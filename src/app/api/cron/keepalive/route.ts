/**
 * /api/cron/keepalive
 *
 * Runs once daily (03:00 UTC). Does two things:
 *   1. Pings Supabase with a lightweight query → prevents Nano/free-tier inactivity pause
 *   2. Checks Telegram webhook URL — re-registers it automatically if it's ever found empty
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const maxDuration = 20;

// Stable production URL — Vercel sets VERCEL_PROJECT_PRODUCTION_URL automatically
const PRODUCTION_URL =
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.NEXT_PUBLIC_APP_URL ?? '';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Record<string, unknown> = { ts: new Date().toISOString() };

  // ── 1. Supabase keepalive ping ─────────────────────────────────────────────
  try {
    const { count, error } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('archived', false);
    results.supabase = error
      ? { ok: false, error: error.message }
      : { ok: true, active_tasks: count ?? 0 };
  } catch (e) {
    results.supabase = { ok: false, error: String(e) };
  }

  // ── 2. Telegram webhook self-heal ──────────────────────────────────────────
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      results.telegram = { ok: false, error: 'TELEGRAM_BOT_TOKEN not set' };
    } else {
      const infoRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
      const info = await infoRes.json() as { ok: boolean; result?: { url?: string } };
      const currentUrl = info.result?.url ?? '';
      const expectedUrl = PRODUCTION_URL ? `${PRODUCTION_URL}/api/telegram/webhook` : '';

      if (!currentUrl && expectedUrl) {
        // Webhook fell off — re-register it silently
        const setRes = await fetch(
          `https://api.telegram.org/bot${token}/setWebhook`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: expectedUrl }),
          },
        );
        const setJson = await setRes.json();
        console.warn('[keepalive] Webhook was empty — re-registered to', expectedUrl);
        results.telegram = { ok: true, action: 'reregistered', url: expectedUrl, response: setJson };
      } else {
        results.telegram = { ok: true, action: 'no_change', url: currentUrl };
      }
    }
  } catch (e) {
    results.telegram = { ok: false, error: String(e) };
  }

  return NextResponse.json(results);
}
