import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET() {
  // Find the Telegram conversation
  const { data: conv } = await supabase
    .from('conversations')
    .select('id')
    .not('telegram_chat_id', 'is', null)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (!conv) {
    return NextResponse.json({ conversation_id: null, messages: [] });
  }

  const { data: messages, error } = await supabase
    .from('messages')
    .select('role, content, created_at')
    .eq('conversation_id', conv.id)
    .order('created_at', { ascending: false })
    .limit(12);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return in ascending order (oldest first) for display
  return NextResponse.json({
    conversation_id: conv.id,
    messages: (messages ?? []).reverse(),
  });
}
