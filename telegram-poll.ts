/**
 * Local development Telegram bot (polling mode).
 * Run with: npm run telegram
 * Keep this running in a separate terminal alongside `npm run dev`.
 *
 * Claude detects intent from plain text messages and acts on them:
 *   "add task: buy new glove"          → creates a task
 *   "add task to softball: team lineup" → creates task scoped to project
 *   "remind me Friday 3pm to check in"  → saves a reminder
 *   "what's my day?"                    → briefing of tasks + reminders
 *   "what do I have for softball?"      → project-specific task list
 *   anything else                       → conversational response
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import TelegramBot from 'node-telegram-bot-api';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY!;
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!BOT_TOKEN) { console.error('Missing TELEGRAM_BOT_TOKEN'); process.exit(1); }

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log('🤖 Telegram bot (intent mode) polling started…');

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

async function getProjects() {
  const { data } = await supabase.from('projects').select('id, name').order('created_at');
  return data ?? [];
}

async function getUpcomingTasks(projectId?: string) {
  let q = supabase.from('tasks').select('title, status, project_id').neq('status', 'done').order('status').order('position').limit(20);
  if (projectId) q = q.eq('project_id', projectId);
  const { data } = await q;
  return data ?? [];
}

async function getUpcomingReminders(chatId: number) {
  const { data } = await supabase
    .from('reminders')
    .select('text, due_at')
    .eq('telegram_chat_id', chatId)
    .eq('sent', false)
    .gte('due_at', new Date().toISOString())
    .order('due_at')
    .limit(5);
  return data ?? [];
}

// ──────────────────────────────────────────────────────────────────────────────
// Intent detection via Claude
// ──────────────────────────────────────────────────────────────────────────────

interface IntentResult {
  intent: 'create_task' | 'create_reminder' | 'briefing' | 'project_tasks' | 'chat';
  task_title?: string;
  task_status?: 'todo' | 'in_progress' | 'done';
  project_name?: string;
  reminder_text?: string;
  reminder_due_iso?: string;
  reply_text: string;
}

async function detectIntent(userText: string, chatId: number): Promise<IntentResult> {
  const projects = await getProjects();
  const projectList = projects.length
    ? `Known projects: ${projects.map(p => p.name).join(', ')}`
    : 'No projects yet.';

  const now = new Date().toISOString();

  const systemPrompt = `You are an intent classifier for a personal AI assistant. The current date/time is ${now}.
${projectList}

Given the user's message, respond ONLY with a valid JSON object with these fields:
- intent: one of "create_task", "create_reminder", "briefing", "project_tasks", "chat"
- task_title: (if intent=create_task) the task title string
- task_status: (if intent=create_task) "todo" | "in_progress" | "done", default "todo"
- project_name: (if intent=create_task or project_tasks) the project name as given in the known list, or null
- reminder_text: (if intent=create_reminder) the reminder description
- reminder_due_iso: (if intent=create_reminder) ISO 8601 datetime string for when to fire
- reply_text: a short, friendly confirmation or response to send back to the user

Rules:
- "add task", "create task", "new task", "remind me to", "put X on my list" → create_task
- "remind me at/on/by [time]", "set a reminder" → create_reminder
- "what's my day", "what do I have today", "/briefing", "day overview" → briefing
- "what do I have for [project]", "show [project] tasks" → project_tasks
- Everything else → chat (reply_text is a normal conversational response)
- Respond ONLY with raw JSON. No markdown, no code fences.`;

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 512,
    system: systemPrompt,
    messages: [{ role: 'user', content: userText }],
  });

  const raw = response.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('');
  return JSON.parse(raw) as IntentResult;
}

// ──────────────────────────────────────────────────────────────────────────────
// Action handlers
// ──────────────────────────────────────────────────────────────────────────────

async function handleCreateTask(result: IntentResult): Promise<string> {
  const projects = await getProjects();
  let projectId: string | null = null;

  if (result.project_name) {
    const match = projects.find(p => p.name.toLowerCase() === result.project_name!.toLowerCase());
    projectId = match?.id ?? null;
  }

  const status = result.task_status ?? 'todo';
  const { data: existing } = await supabase.from('tasks').select('position').eq('status', status).order('position', { ascending: false }).limit(1);
  const position = existing && existing.length > 0 ? existing[0].position + 1 : 0;

  const { error } = await supabase.from('tasks').insert({
    title: result.task_title,
    description: '',
    status,
    position,
    project_id: projectId,
  });

  if (error) return `Error creating task: ${error.message}`;
  return result.reply_text;
}

async function handleCreateReminder(result: IntentResult, chatId: number): Promise<string> {
  if (!result.reminder_due_iso) return 'I couldn\'t parse that time. Try: "remind me Friday 3pm to check in"';

  const { error } = await supabase.from('reminders').insert({
    text: result.reminder_text,
    due_at: result.reminder_due_iso,
    telegram_chat_id: chatId,
    sent: false,
  });

  if (error) return `Error saving reminder: ${error.message}`;
  return result.reply_text;
}

async function handleBriefing(chatId: number): Promise<string> {
  const [tasks, reminders] = await Promise.all([
    getUpcomingTasks(),
    getUpcomingReminders(chatId),
  ]);

  const lines: string[] = ['📋 *Your Day*\n'];

  if (tasks.length === 0) {
    lines.push('No open tasks.');
  } else {
    const emoji: Record<string, string> = { todo: '⬜', in_progress: '🔄' };
    lines.push('*Tasks:*');
    tasks.forEach(t => lines.push(`${emoji[t.status] ?? '•'} ${t.title}`));
  }

  if (reminders.length > 0) {
    lines.push('\n*Upcoming Reminders:*');
    reminders.forEach(r => {
      const dt = new Date(r.due_at).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
      lines.push(`🔔 ${dt} — ${r.text}`);
    });
  }

  return lines.join('\n');
}

async function handleProjectTasks(result: IntentResult): Promise<string> {
  const projects = await getProjects();
  const match = result.project_name
    ? projects.find(p => p.name.toLowerCase() === result.project_name!.toLowerCase())
    : null;

  const tasks = await getUpcomingTasks(match?.id);

  if (tasks.length === 0) {
    return match ? `No open tasks for ${match.name}.` : 'No open tasks found.';
  }

  const emoji: Record<string, string> = { todo: '⬜', in_progress: '🔄' };
  const header = match ? `📋 *${match.name} Tasks*\n` : '📋 *All Open Tasks*\n';
  const list = tasks.map(t => `${emoji[t.status] ?? '•'} ${t.title}`).join('\n');
  return header + list;
}

// ──────────────────────────────────────────────────────────────────────────────
// Message handler
// ──────────────────────────────────────────────────────────────────────────────

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();
  if (!text) return;

  try {
    await bot.sendChatAction(chatId, 'typing');

    if (text === '/start') {
      await bot.sendMessage(chatId,
        '👋 Hi! I\'m your personal AI assistant.\n\nJust text me naturally:\n• "add task: email the sponsor"\n• "add task to Softball: buy new gloves"\n• "remind me Friday 3pm to check the schedule"\n• "what\'s my day?"\n• "what do I have for Softball?"\n\nOr just chat!'
      );
      return;
    }

    const result = await detectIntent(text, chatId);

    let reply: string;
    switch (result.intent) {
      case 'create_task':
        reply = await handleCreateTask(result);
        break;
      case 'create_reminder':
        reply = await handleCreateReminder(result, chatId);
        break;
      case 'briefing':
        reply = await handleBriefing(chatId);
        break;
      case 'project_tasks':
        reply = await handleProjectTasks(result);
        break;
      default:
        reply = result.reply_text || 'I\'m not sure how to help with that.';
    }

    await bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' });

  } catch (err) {
    console.error('Bot error:', err);
    await bot.sendMessage(chatId, 'Sorry, something went wrong. Try again!');
  }
});

bot.on('polling_error', (err) => {
  console.error('Polling error:', err.message);
  if (err.message.includes('ECONNRESET') || err.message.includes('EFATAL')) {
    console.log('Reconnecting in 5s…');
    setTimeout(() => {
      bot.stopPolling().then(() => bot.startPolling()).catch(console.error);
    }, 5000);
  }
});
