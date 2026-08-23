/**
 * /api/capture
 *
 * Single-shot free-text intake — built for the iOS Shortcut quick-capture flow
 * (Action Button / Share Sheet) and the dashboard's Quick Capture box.
 *
 * You send raw text, Claude decides what it is (task / note / reminder) and
 * files it with exactly one tool call, no back-and-forth. Everything is also
 * logged into a "Quick Capture" conversation so it's reviewable in the Chat page.
 */
import { NextRequest, NextResponse } from 'next/server';
import type Anthropic from '@anthropic-ai/sdk';
import { anthropic, MODEL, buildSystemPrompt } from '@/lib/anthropic';
import { supabase } from '@/lib/supabase';
import { TOOL_DEFINITIONS, executeTool } from '@/lib/tools';

export const runtime = 'nodejs';
export const maxDuration = 30;

const CAPTURE_CONVERSATION_TITLE = 'Quick Capture';

async function getCaptureConversationId(): Promise<string> {
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('title', CAPTURE_CONVERSATION_TITLE)
    .limit(1)
    .single();
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from('conversations')
    .insert({ title: CAPTURE_CONVERSATION_TITLE })
    .select('id')
    .single();
  if (error) throw error;
  return created.id;
}

export async function POST(req: NextRequest) {
  // Optional shared-secret check — set CAPTURE_SECRET once this is reachable
  // from the public internet (the iOS Shortcut hits it directly).
  const secret = process.env.CAPTURE_SECRET;
  if (secret) {
    const url = new URL(req.url);
    const provided = req.headers.get('x-capture-key') ?? url.searchParams.get('key');
    if (provided !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const { text } = (await req.json()) as { text?: string };
  if (!text || !text.trim()) {
    return NextResponse.json({ error: 'Missing text' }, { status: 400 });
  }

  try {
    const conversationId = await getCaptureConversationId();

    await supabase.from('messages').insert({
      conversation_id: conversationId,
      role: 'user',
      content: text,
    });

    const basePrompt = await buildSystemPrompt();
    const systemPrompt = `${basePrompt}

## Quick capture mode
This came in through the quick-capture Shortcut, not a live chat — Harrisan is not there to answer follow-ups. Read it and immediately decide what it is, then act:
- Sounds like something to do → create_task (infer priority; set due_at only if a date/time is stated)
- Sounds like a fact, idea, or note to self → create_note
- Explicitly says "remind me" → create_reminder
When unsure between task and note, default to create_task.
Always call exactly one tool, then reply with ONE short confirmation line — no questions, since nobody will answer them.`;

    const messages: Anthropic.MessageParam[] = [{ role: 'user', content: text }];
    let replyText = '';

    for (let i = 0; i < 3; i++) {
      const resp = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        tools: TOOL_DEFINITIONS,
        messages,
      });

      const toolUses = resp.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
      );
      const textBlocks = resp.content.filter(
        (b): b is Anthropic.TextBlock => b.type === 'text'
      );
      const iterationText = textBlocks.map((b) => b.text).join(' ').trim();
      if (iterationText) replyText = iterationText;

      if (resp.stop_reason !== 'tool_use' || toolUses.length === 0) break;

      messages.push({ role: 'assistant', content: resp.content });
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const toolUse of toolUses) {
        const result = await executeTool(toolUse.name, toolUse.input as Record<string, unknown>);
        toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: result });
      }
      messages.push({ role: 'user', content: toolResults });
    }

    if (!replyText) replyText = 'Captured.';

    await supabase.from('messages').insert({
      conversation_id: conversationId,
      role: 'assistant',
      content: replyText,
    });
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return NextResponse.json({ ok: true, reply: replyText });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message: unknown }).message)
          : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
