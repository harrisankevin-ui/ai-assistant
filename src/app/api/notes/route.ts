import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tag = searchParams.get('tag');
  const q = searchParams.get('q');

  const projectId = searchParams.get('project');

  let query = supabase
    .from('notes')
    .select('id, title, content, tags, project_id, created_at, updated_at')
    .order('updated_at', { ascending: false });

  if (tag) query = query.contains('tags', [tag]);
  if (q) query = query.ilike('title', `%${q}%`);
  if (projectId) query = query.eq('project_id', projectId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json() as { title: string; content: string; tags?: string[]; project_id?: string | null };
  const { data, error } = await supabase
    .from('notes')
    .insert({ title: body.title, content: body.content || '', tags: body.tags || [], project_id: body.project_id ?? null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
