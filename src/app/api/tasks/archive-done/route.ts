import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Called by Vercel cron at 0 5 * * * (5am UTC = ~1am EDT, safely past midnight Toronto)
// Archives all tasks that were marked done before today midnight in Toronto time.
export async function GET() {
  // Calculate today's midnight in Toronto (America/Toronto)
  const now = new Date();
  const torontoMidnight = new Date(
    new Date(now.toLocaleDateString('en-CA', { timeZone: 'America/Toronto' })).toISOString()
  );

  const { data, error } = await supabase
    .from('tasks')
    .update({ archived: true, updated_at: now.toISOString() })
    .eq('status', 'done')
    .eq('archived', false)
    .lt('completed_at', torontoMidnight.toISOString())
    .select('id');

  if (error) {
    console.error('archive-done error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ archived: data?.length ?? 0 });
}
