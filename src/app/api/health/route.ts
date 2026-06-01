import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

const REQUIRED_ENV = [
  'ANTHROPIC_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'TELEGRAM_BOT_TOKEN',
  'CRON_SECRET',
];

export async function GET() {
  const checks: Record<string, { ok: boolean; detail?: string }> = {};

  // ── 1. Required env vars ─────────────────────────────────────────────────
  const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
  checks.env_vars = missing.length === 0
    ? { ok: true }
    : { ok: false, detail: `Missing: ${missing.join(', ')}` };

  // ── 2. Supabase connection ────────────────────────────────────────────────
  try {
    const { error } = await supabase.from('tasks').select('id').limit(1);
    checks.supabase_connection = error
      ? { ok: false, detail: error.message }
      : { ok: true };
  } catch (e) {
    checks.supabase_connection = { ok: false, detail: String(e) };
  }

  // ── 3. Tasks table schema (required columns) ──────────────────────────────
  try {
    const { error } = await supabase
      .from('tasks')
      .select('due_at, archived, completed_at')
      .limit(1);
    checks.schema = error
      ? { ok: false, detail: `Column(s) missing: ${error.message}` }
      : { ok: true };
  } catch (e) {
    checks.schema = { ok: false, detail: String(e) };
  }

  // ── 4. Telegram webhook ───────────────────────────────────────────────────
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      checks.telegram_webhook = { ok: false, detail: 'TELEGRAM_BOT_TOKEN not set' };
    } else {
      const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
      const json = await res.json() as { ok: boolean; result?: { url?: string; last_error_message?: string } };
      const url = json.result?.url ?? '';
      const lastError = json.result?.last_error_message;

      if (!url) {
        checks.telegram_webhook = {
          ok: false,
          detail: 'Webhook URL is empty — Telegram messages go nowhere',
        };
      } else {
        checks.telegram_webhook = {
          ok: true,
          detail: url + (lastError ? ` (last error: ${lastError})` : ''),
        };
      }
    }
  } catch (e) {
    checks.telegram_webhook = { ok: false, detail: String(e) };
  }

  // ── 5. Conversation history health ────────────────────────────────────────
  try {
    const { data: convs } = await supabase
      .from('conversations')
      .select('id')
      .not('telegram_chat_id', 'is', null)
      .limit(1);

    if (convs && convs.length > 0) {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', convs[0].id);
      checks.conversation_history = {
        ok: (count ?? 0) < 200,
        detail: `${count ?? 0} messages in Telegram conversation${(count ?? 0) >= 200 ? ' — consider /reset' : ''}`,
      };
    } else {
      checks.conversation_history = { ok: true, detail: 'No Telegram conversation yet' };
    }
  } catch (e) {
    checks.conversation_history = { ok: false, detail: String(e) };
  }

  const allOk = Object.values(checks).every((c) => c.ok);
  return NextResponse.json(
    { healthy: allOk, checks, ts: new Date().toISOString() },
    { status: allOk ? 200 : 503 },
  );
}
