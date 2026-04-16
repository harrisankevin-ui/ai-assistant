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

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });

  // Query A: schedule items due today (weekly_brief: true)
  const { data: scheduleItems } = await supabase
    .from('tasks')
    .select('title, due_at')
    .eq('weekly_brief', true)
    .gte('due_at', `${today}T00:00:00`)
    .lte('due_at', `${today}T23:59:59`)
    .order('due_at', { ascending: true });

  // Query B: high-priority tasks not yet done
  const { data: highTasks } = await supabase
    .from('tasks')
    .select('title')
    .eq('priority', 'high')
    .eq('weekly_brief', false)
    .neq('status', 'done')
    .eq('archived', false);

  const hasSchedule = scheduleItems && scheduleItems.length > 0;
  const hasHigh = highTasks && highTasks.length > 0;

  if (!hasSchedule && !hasHigh) {
    return NextResponse.json({ sent: false, reason: 'Nothing to report today' });
  }

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Toronto' });

  const lines: string[] = ['Morning. Here\'s your day:\n'];

  if (hasSchedule) {
    lines.push('📅 Schedule:');
    for (const item of scheduleItems!) {
      const time = item.due_at ? ` — ${formatTime(item.due_at)}` : '';
      lines.push(`→ ${item.title}${time}`);
    }
  }

  if (hasSchedule && hasHigh) lines.push('');

  if (hasHigh) {
    lines.push('↑ High priority:');
    for (const task of highTasks!) {
      lines.push(`↑ ${task.title}`);
    }
  }

  const message = lines.join('\n');

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

  return NextResponse.json({ sent: true, schedule: scheduleItems?.length ?? 0, highPriority: highTasks?.length ?? 0 });
}
