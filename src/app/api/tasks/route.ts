import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const projectId = searchParams.get('project');

  let query = supabase
    .from('tasks')
    .select('id, title, description, status, position, project_id, created_at, updated_at')
    .order('position', { ascending: true });

  if (status) query = query.eq('status', status);
  if (projectId) query = query.eq('project_id', projectId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    title: string;
    description?: string;
    status?: string;
    project_id?: string | null;
  };

  const taskStatus = body.status || 'todo';

  // Get max position for the column
  const { data: existing } = await supabase
    .from('tasks')
    .select('position')
    .eq('status', taskStatus)
    .order('position', { ascending: false })
    .limit(1);

  const position = existing && existing.length > 0 ? existing[0].position + 1 : 0;

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: body.title,
      description: body.description || '',
      status: taskStatus,
      position,
      project_id: body.project_id ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
