import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const projectId = searchParams.get('project');
  const weeklyBrief = searchParams.get('weekly_brief');

  const weekStart = searchParams.get('week_start');
  const weekEnd = searchParams.get('week_end');

  let query = supabase
    .from('tasks')
    .select('id, title, description, status, priority, position, project_id, due_at, weekly_brief, archived, completed_at, created_at, updated_at');

  if (weeklyBrief === 'true') {
    query = query
      .eq('weekly_brief', true)
      .order('due_at', { ascending: true });
  } else if (weekStart && weekEnd) {
    query = query
      .gte('due_at', weekStart)
      .lte('due_at', weekEnd)
      .not('due_at', 'is', null)
      .order('due_at', { ascending: true });
  } else {
    if (status) query = query.eq('status', status);
    if (projectId) query = query.eq('project_id', projectId);
    query = query.eq('archived', false).order('status').order('position');
  }

  let { data, error } = await query;

  // If archived column doesn't exist yet (migration pending), retry without that filter
  if (error && error.message?.includes('archived')) {
    const fallback = supabase
      .from('tasks')
      .select('id, title, description, status, priority, position, project_id, due_at, weekly_brief, archived, completed_at, created_at, updated_at');
    if (status) fallback.eq('status', status);
    if (projectId) fallback.eq('project_id', projectId);
    const result = await fallback.order('status').order('position');
    data = result.data;
    error = result.error;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    due_at?: string | null;
    project_id?: string | null;
    weekly_brief?: boolean;
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
      priority: body.priority ?? 'moderate',
      due_at: body.due_at ?? null,
      position,
      project_id: body.project_id ?? null,
      weekly_brief: body.weekly_brief ?? false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
