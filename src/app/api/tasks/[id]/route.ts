import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json() as {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    position?: number;
    due_at?: string | null;
    weekly_brief?: boolean;
    archived?: boolean;
    completed_at?: string | null;
  };

  // Auto-set completed_at when marking done, clear it when moving back
  if (body.status === 'done') {
    body.completed_at = new Date().toISOString();
  } else if (body.status !== undefined && body.status !== 'done') {
    body.completed_at = null;
  }

  const { data, error } = await supabase
    .from('tasks')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
