import type Anthropic from '@anthropic-ai/sdk';
import { supabase } from './supabase';

// Tool definitions for Claude
export const TOOL_DEFINITIONS: Anthropic.Tool[] = [
  {
    name: 'list_projects',
    description: 'List all projects the user has created',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'create_note',
    description: 'Create a new note with a title, content, and optional tags',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'The note title' },
        content: { type: 'string', description: 'The note content' },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional array of tags',
        },
        project_id: { type: 'string', description: 'Optional project ID to associate this note with' },
      },
      required: ['title', 'content'],
    },
  },
  {
    name: 'list_notes',
    description: 'List or search notes, optionally filtering by tags or project',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query to filter notes by title' },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter notes by tags',
        },
        project_id: { type: 'string', description: 'Filter notes by project ID' },
      },
      required: [],
    },
  },
  {
    name: 'create_document',
    description: 'Create a new document with a title and content',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'The document title' },
        content: { type: 'string', description: 'The document content' },
        project_id: { type: 'string', description: 'Optional project ID to associate this document with' },
      },
      required: ['title', 'content'],
    },
  },
  {
    name: 'search_documents',
    description: 'Search documents by title or content',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        project_id: { type: 'string', description: 'Filter by project ID' },
      },
      required: ['query'],
    },
  },
  {
    name: 'create_task',
    description: 'Create a new task',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'The task title' },
        description: { type: 'string', description: 'Optional task description' },
        status: {
          type: 'string',
          enum: ['todo', 'in_progress', 'done'],
          description: 'Initial status (defaults to todo)',
        },
        project_id: { type: 'string', description: 'Optional project ID to associate this task with' },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_task',
    description: 'Update an existing task',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'The task ID' },
        title: { type: 'string', description: 'New title' },
        description: { type: 'string', description: 'New description' },
        status: {
          type: 'string',
          enum: ['todo', 'in_progress', 'done'],
          description: 'New status',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'list_tasks',
    description: 'List tasks, optionally filtered by status or project',
    input_schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['todo', 'in_progress', 'done'],
          description: 'Filter by status',
        },
        project_id: { type: 'string', description: 'Filter by project ID' },
      },
      required: [],
    },
  },
];

// Tool executors
type ToolInput = Record<string, unknown>;

export async function executeTool(name: string, input: ToolInput): Promise<string> {
  try {
    switch (name) {
      case 'list_projects': {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name, color')
          .order('created_at', { ascending: true });
        if (error) throw error;
        if (!data || data.length === 0) return 'No projects found.';
        return JSON.stringify(data, null, 2);
      }

      case 'create_note': {
        const { title, content, tags = [], project_id } = input as {
          title: string;
          content: string;
          tags?: string[];
          project_id?: string;
        };
        const { data, error } = await supabase
          .from('notes')
          .insert({ title, content, tags, project_id: project_id ?? null })
          .select()
          .single();
        if (error) throw error;
        return `Created note "${data.title}" with ID ${data.id}`;
      }

      case 'list_notes': {
        const { query, tags, project_id } = input as { query?: string; tags?: string[]; project_id?: string };
        let q = supabase.from('notes').select('id, title, tags, project_id, created_at').order('updated_at', { ascending: false });
        if (tags && tags.length > 0) q = q.overlaps('tags', tags);
        if (project_id) q = q.eq('project_id', project_id);
        const { data, error } = await q.limit(20);
        if (error) throw error;
        if (!data || data.length === 0) return 'No notes found.';
        const filtered = query
          ? data.filter((n) => n.title.toLowerCase().includes(query.toLowerCase()))
          : data;
        return JSON.stringify(filtered, null, 2);
      }

      case 'create_document': {
        const { title, content, project_id } = input as { title: string; content: string; project_id?: string };
        const { data, error } = await supabase
          .from('documents')
          .insert({ title, content, project_id: project_id ?? null })
          .select()
          .single();
        if (error) throw error;
        return `Created document "${data.title}" with ID ${data.id}`;
      }

      case 'search_documents': {
        const { query, project_id } = input as { query: string; project_id?: string };
        let q = supabase
          .from('documents')
          .select('id, title, project_id, created_at')
          .ilike('title', `%${query}%`)
          .order('updated_at', { ascending: false })
          .limit(10);
        if (project_id) q = q.eq('project_id', project_id);
        const { data, error } = await q;
        if (error) throw error;
        if (!data || data.length === 0) return 'No documents found.';
        return JSON.stringify(data, null, 2);
      }

      case 'create_task': {
        const { title, description = '', status = 'todo', project_id } = input as {
          title: string;
          description?: string;
          status?: string;
          project_id?: string;
        };
        const { data: existing } = await supabase
          .from('tasks')
          .select('position')
          .eq('status', status)
          .order('position', { ascending: false })
          .limit(1);
        const position = existing && existing.length > 0 ? existing[0].position + 1 : 0;
        const { data, error } = await supabase
          .from('tasks')
          .insert({ title, description, status, position, project_id: project_id ?? null })
          .select()
          .single();
        if (error) throw error;
        return `Created task "${data.title}" (${data.status}) with ID ${data.id}`;
      }

      case 'update_task': {
        const { id, ...updates } = input as {
          id: string;
          title?: string;
          description?: string;
          status?: string;
        };
        const { data, error } = await supabase
          .from('tasks')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return `Updated task "${data.title}" — status: ${data.status}`;
      }

      case 'list_tasks': {
        const { status, project_id } = input as { status?: string; project_id?: string };
        let q = supabase.from('tasks').select('id, title, description, status, project_id, position').order('status').order('position');
        if (status) q = q.eq('status', status);
        if (project_id) q = q.eq('project_id', project_id);
        const { data, error } = await q;
        if (error) throw error;
        if (!data || data.length === 0) return 'No tasks found.';
        return JSON.stringify(data, null, 2);
      }

      default:
        return `Unknown tool: ${name}`;
    }
  } catch (err) {
    return `Error executing ${name}: ${err instanceof Error ? err.message : String(err)}`;
  }
}
