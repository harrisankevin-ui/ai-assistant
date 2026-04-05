import { NextRequest, NextResponse } from 'next/server';
import type TelegramBot from 'node-telegram-bot-api';
import { handleTelegramUpdate } from '@/lib/telegram';

export const runtime = 'nodejs';
export const maxDuration = 55;

export async function POST(req: NextRequest) {
  try {
    const update = await req.json() as TelegramBot.Update;
    await handleTelegramUpdate(update);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Telegram webhook error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
