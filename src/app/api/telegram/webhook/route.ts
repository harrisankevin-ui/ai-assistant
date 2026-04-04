import { NextRequest, NextResponse } from 'next/server';
import type TelegramBot from 'node-telegram-bot-api';
import { handleTelegramUpdate } from '@/lib/telegram';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // Optional: verify the token matches
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    if (process.env.TELEGRAM_BOT_TOKEN && token !== process.env.TELEGRAM_BOT_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const update = await req.json() as TelegramBot.Update;
    await handleTelegramUpdate(update);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Telegram webhook error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
