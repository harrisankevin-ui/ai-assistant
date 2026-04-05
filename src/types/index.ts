export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  tool_calls?: unknown;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: 'low' | 'moderate' | 'high';
  position: number;
  project_id: string | null;
  due_at: string | null;
  weekly_brief: boolean;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  text: string;
  due_at: string;
  project_id: string | null;
  telegram_chat_id: number | null;
  sent: boolean;
  created_at: string;
}
