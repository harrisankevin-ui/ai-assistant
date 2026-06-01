# Pipeline Safeguards — Max AI Assistant

Everything that was broken before and how it's protected now.

---

## Quick health check

```
https://ai-assistant-delta-dun.vercel.app/api/health
```

Returns JSON. `"healthy": true` means all 5 checks pass. `503` means something is wrong — look at the `checks` object to see which one failed.

---

## The 5 risks and their fixes

### 1. Supabase schema drift (missing columns)

**What broke:** `due_at`, `archived`, `completed_at` didn't exist. INSERT silently failed, Claude said "Done" anyway.

**What's protected now:**
- `/api/health` checks those 3 columns exist on every hit
- `create_task` now returns `"Error executing create_task: DB schema mismatch…"` if a column is missing — Max will tell you what failed instead of lying
- `supabase-schema-v5.sql` documents the required migration

**If it breaks again:** Run this in the Supabase SQL editor:
```sql
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL;
```

---

### 2. Supabase inactivity pause (Nano/free tier)

**What broke:** Supabase pauses projects after 7 days of inactivity. All DB calls fail with a connection error.

**What's protected now:**
- `/api/cron/keepalive` runs daily at 03:00 UTC — pings Supabase with a lightweight query
- The existing archive cron (`0 5 * * *`) also hits Supabase daily as a second ping
- Two daily touches keeps the project well above the inactivity threshold

**If it breaks:** Go to [app.supabase.com](https://app.supabase.com), open the project, click **Restore**. Takes ~30 seconds.

---

### 3. Telegram webhook going empty

**What broke:** Without a webhook, Telegram queues messages but nothing processes them. The local polling script only worked while your machine was on.

**What's protected now:**
- `/api/cron/keepalive` checks the webhook URL daily — if it's empty, it re-registers it automatically to `https://ai-assistant-delta-dun.vercel.app/api/telegram/webhook`
- `/api/health` shows the current webhook URL so you can verify it anytime

**If it breaks manually:** Run in terminal:
```
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://ai-assistant-delta-dun.vercel.app/api/telegram/webhook"}'
```

---

### 4. Vercel env vars disappearing

**What broke:** `TELEGRAM_BOT_TOKEN` was set to a wrong/stale value. The right token was in `.env.local` but not in Vercel.

**What's protected now:**
- `/api/health` checks all 5 required env vars are present on every request
- If any are missing, `checks.env_vars` shows which ones

**If it breaks:**
```bash
# List what's set
vercel env ls

# Re-add a missing one
printf "your-value-here" | vercel env add TELEGRAM_BOT_TOKEN production

# Then redeploy
vercel deploy --prod
```

---

### 5. Conversation history poisoning

**What broke:** 20+ repetitive fake "Done" messages in the Telegram conversation history caused Claude Haiku to skip tool calls and just echo fake confirmations.

**What's protected now:**
- Max is now on Claude Sonnet 4.6 — far less likely to fake tool calls
- `loadHistory` has a poison guard: if the last 6+ assistant messages all match `/(done|created|added)/i` and are very short, history is auto-trimmed to the last 4 messages
- **`/reset` command in Telegram**: text `/reset` to Max and it wipes the conversation history. Fresh start in one message.

**If Max starts acting weird / ignoring tasks:**
1. Text `/reset` to Max on Telegram
2. Send your request again

---

## Cron schedule

| Cron | Time (UTC) | What it does |
|------|-----------|--------------|
| `/api/cron/briefing` | 12:00 | Morning brief via Telegram |
| `/api/tasks/archive-done` | 05:00 | Archive completed tasks |
| `/api/cron/keepalive` | 03:00 | Supabase ping + webhook self-heal |

All 3 are once-per-day — within Vercel Hobby plan limits.

---

## Environment variables reference

| Key | What it's for |
|-----|--------------|
| `ANTHROPIC_API_KEY` | Claude API |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (bypasses RLS) |
| `TELEGRAM_BOT_TOKEN` | Bot token for `@maxharrisansbot_bot` |
| `CRON_SECRET` | Protects cron endpoints from unauthorized calls |
| `GROQ_API_KEY` | Voice transcription (Whisper) |
| `BRAVE_API_KEY` | Web search tool |
