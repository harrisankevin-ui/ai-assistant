import TelegramBot from 'node-telegram-bot-api';
import type OpenAI from 'openai';
import { openrouter, MODEL, FALLBACK_MODEL } from './openrouter';
import { buildSystemPrompt } from './anthropic';
import { supabase } from './supabase';
import { TOOL_DEFINITIONS, executeTool } from './tools';

let bot: TelegramBot | null = null;

export function getTelegramBot(): TelegramBot | null {
  if (!process.env.TELEGRAM_BOT_TOKEN) return null;
  if (!bot) {
    bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
  }
  return bot;
}

async function getOrCreateTelegramConversation(chatId: number): Promise<string> {
  const { data } = await supabase
    .from('conversations')
    .select('id')
    .eq('telegram_chat_id', chatId)
    .single();

  if (data) return data.id;

  const { data: newConv, error } = await supabase
    .from('conversations')
    .insert({ title: 'Telegram', telegram_chat_id: chatId })
    .select('id')
    .single();

  if (error || !newConv) throw new Error('Failed to create Telegram conversation');
  return newConv.id;
}

async function loadHistory(conversationId: string): Promise<OpenAI.Chat.ChatCompletionMessageParam[]> {
  const { data } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(40);

  return (data ?? []).reverse().map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));
}

async function saveMessage(conversationId: string, role: 'user' | 'assistant', content: string): Promise<void> {
  await supabase.from('messages').insert({ conversation_id: conversationId, role, content });
}

export async function runMaxLoop(userText: string, chatId: number): Promise<string> {
  const conversationId = await getOrCreateTelegramConversation(chatId);
  await saveMessage(conversationId, 'user', userText);

  const history = await loadHistory(conversationId);
  const systemPrompt = await buildSystemPrompt();

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userText },
  ];

  let fullText = '';
  let continueLoop = true;

  while (continueLoop) {
    let response: OpenAI.Chat.ChatCompletion;
    try {
      response = await openrouter.chat.completions.create({
        model: MODEL,
        max_tokens: 1024,
        messages,
        tools: TOOL_DEFINITIONS,
        tool_choice: 'auto',
      });
    } catch (err: unknown) {
      // If primary model is rate-limited, retry once with the fallback model
      const status = (err as { status?: number })?.status;
      if (status === 429) {
        response = await openrouter.chat.completions.create({
          model: FALLBACK_MODEL,
          max_tokens: 1024,
          messages,
          tools: TOOL_DEFINITIONS,
          tool_choice: 'auto',
        });
      } else {
        throw err;
      }
    }

    const choice = response.choices[0];
    const assistantMessage = choice.message;

    if (assistantMessage.content) {
      fullText += assistantMessage.content;
    }

    if (choice.finish_reason === 'tool_calls' && assistantMessage.tool_calls?.length) {
      // Append assistant turn with tool_calls
      messages.push({
        role: 'assistant',
        content: assistantMessage.content ?? null,
        tool_calls: assistantMessage.tool_calls,
      });

      // Execute each tool and append results
      for (const tc of assistantMessage.tool_calls) {
        if (tc.type !== 'function') continue;
        const args = JSON.parse(tc.function.arguments) as Record<string, unknown>;
        const result = await executeTool(tc.function.name, args);
        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: result,
        });
      }
    } else {
      continueLoop = false;
    }
  }

  if (fullText) {
    await saveMessage(conversationId, 'assistant', fullText);
  }

  return fullText || 'Done.';
}

export async function handleTelegramUpdate(update: TelegramBot.Update): Promise<void> {
  const b = getTelegramBot();
  if (!b) return;

  const message = update.message;
  if (!message?.text || !message.chat?.id) return;

  const chatId = message.chat.id;
  const text = message.text.trim();

  if (text === '/start') {
    await b.sendMessage(
      chatId,
      `Hey Harrisan — I'm Max, your personal assistant.\n\nI'm the same Max from your dashboard. Same memory, same tools, same context.\n\nI can create tasks, set reminders, manage your projects, and help you stay organized. Just talk to me naturally.`
    );
    return;
  }

  try {
    await b.sendChatAction(chatId, 'typing');
    const reply = await runMaxLoop(text, chatId);

    if (reply.length <= 4096) {
      await b.sendMessage(chatId, reply);
    } else {
      const chunks = reply.match(/[\s\S]{1,4000}/g) ?? [reply.slice(0, 4000)];
      for (const chunk of chunks) {
        await b.sendMessage(chatId, chunk);
      }
    }
  } catch (err) {
    console.error('Telegram handler error:', err);
    await b.sendMessage(chatId, 'Something went wrong. Try again in a moment.');
  }
}
