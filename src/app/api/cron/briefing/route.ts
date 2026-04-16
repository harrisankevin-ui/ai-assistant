import { NextRequest, NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Today's date in Toronto timezone (YYYY-MM-DD)
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('title, priority, due_at, status')
    .neq('status', 'done')
    .gte('due_at', `${today}T00:00:00`)
    .lte('due_at', `${today}T23:59:59`)
    .order('priority');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!tasks || tasks.length === 0) {
    return NextResponse.json({ sent: false, reason: 'No tasks today' });
  }

  // Build message
  const priorityIcon = (p: string) => p === 'high' ? '↑' : p === 'moderate' ? '→' : '↓';
  const lines = tasks.map((t) => `${priorityIcon(t.priority)} ${t.title}`).join('\n');
  const message = `Morning. You've got ${tasks.length} task${tasks.length > 1 ? 's' : ''} today:\n\n${lines}`;

  // Send to all known Telegram chat IDs
  const { data: convs } = await supabase
    .from('conversations')
    .select('telegram_chat_id')
    .not('telegram_chat_id', 'is', null);

  const chatIds = [...new Set((convs ?? []).map((c) => c.telegram_chat_id).filter(Boolean))] as number[];

  if (chatIds.length === 0) return NextResponse.json({ sent: false, reason: 'No Telegram chat IDs found' });

  const bot = process.env.TELEGRAM_BOT_TOKEN
    ? new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false })
    : null;

  if (!bot) return NextResponse.json({ sent: false, reason: 'No bot token' });

  for (const chatId of chatIds) {
    await bot.sendMessage(chatId, message);
  }

  return NextResponse.json({ sent: true, tasks: tasks.length, chatIds: chatIds.length });
}
