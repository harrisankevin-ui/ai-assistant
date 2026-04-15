import TelegramBot from 'node-telegram-bot-api';
import type Anthropic from '@anthropic-ai/sdk';
import OpenAI, { toFile } from 'openai';
import { anthropic, MODEL, buildSystemPrompt } from './anthropic';
import { supabase } from './supabase';
import { TOOL_DEFINITIONS, executeTool } from './tools';

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY ?? 'placeholder',
  baseURL: 'https://api.groq.com/openai/v1',
});

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

async function loadHistory(conversationId: string): Promise<Anthropic.MessageParam[]> {
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

  const messages: Anthropic.MessageParam[] = history;
  let fullText = '';
  let continueLoop = true;

  while (continueLoop) {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      tools: TOOL_DEFINITIONS,
      messages,
    });

    for (const block of response.content) {
      if (block.type === 'text') fullText += block.text;
    }

    if (response.stop_reason === 'tool_use') {
      messages.push({ role: 'assistant', content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type === 'tool_use') {
          const result = await executeTool(block.name, block.input as Record<string, unknown>);
          toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result });
        }
      }
      messages.push({ role: 'user', content: toolResults });
    } else {
      continueLoop = false;
    }
  }

  if (fullText) {
    await saveMessage(conversationId, 'assistant', fullText);
  }

  return fullText || 'Done.';
}

async function transcribeVoice(fileId: string): Promise<string> {
  const b = getTelegramBot();
  if (!b) throw new Error('No bot available');

  const fileInfo = await b.getFile(fileId);
  if (!fileInfo.file_path) throw new Error('No file path returned from Telegram');

  const url = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${fileInfo.file_path}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to download voice file: ${resp.status}`);

  const buffer = Buffer.from(await resp.arrayBuffer());
  const file = await toFile(buffer, 'voice.ogg', { type: 'audio/ogg' });

  const transcription = await groq.audio.transcriptions.create({
    file,
    model: 'whisper-large-v3',
  });

  return transcription.text;
}

export async function handleTelegramUpdate(update: TelegramBot.Update): Promise<void> {
  const b = getTelegramBot();
  if (!b) return;

  const message = update.message;
  if (!message?.chat?.id) return;

  const chatId = message.chat.id;

  if (message.text?.trim() === '/start') {
    await b.sendMessage(
      chatId,
      `Hey Harrisan — I'm Max, your personal assistant.\n\nI'm the same Max from your dashboard. Same memory, same tools, same context.\n\nI can create tasks, set reminders, manage your projects, and help you stay organized. Just talk to me naturally.`
    );
    return;
  }

  // Resolve text from either a text message or a voice note
  let userText: string | null = null;

  if (message.text) {
    userText = message.text.trim();
  } else if (message.voice) {
    try {
      await b.sendChatAction(chatId, 'typing');
      userText = await transcribeVoice(message.voice.file_id);
    } catch (err) {
      console.error('Voice transcription error:', err);
      await b.sendMessage(chatId, "Couldn't transcribe that. Try again or send as text.");
      return;
    }
  }

  if (!userText) return;

  try {
    await b.sendChatAction(chatId, 'typing');
    const reply = await runMaxLoop(userText, chatId);

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
