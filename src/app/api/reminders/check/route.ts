import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import TelegramBot from 'node-telegram-bot-api';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  // Verify cron secret
  const auth = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date().toISOString();

  // Find due reminders
  const { data: due, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('sent', false)
    .lte('due_at', now);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!due || due.length === 0) return NextResponse.json({ sent: 0 });

  const bot = process.env.TELEGRAM_BOT_TOKEN
    ? new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false })
    : null;

  let sent = 0;
  for (const reminder of due) {
    if (bot && reminder.telegram_chat_id) {
      try {
        await bot.sendMessage(
          reminder.telegram_chat_id,
          `⏰ Reminder: ${reminder.text}`
        );
        sent++;
      } catch (e) {
        console.error('Failed to send reminder:', e);
      }
    }
    // Mark as sent regardless (don't retry failed ones to avoid spam)
    await supabase.from('reminders').update({ sent: true }).eq('id', reminder.id);
  }

  return NextResponse.json({ sent, total: due.length });
}
