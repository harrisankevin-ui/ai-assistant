import { NextRequest } from 'next/server';
import type OpenAI from 'openai';
import type { Stream } from 'openai/streaming';
import { openrouter, MODEL, FALLBACK_MODEL } from '@/lib/openrouter';
import { buildSystemPrompt } from '@/lib/anthropic';
import { supabase } from '@/lib/supabase';
import { TOOL_DEFINITIONS, executeTool } from '@/lib/tools';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { conversationId, message } = await req.json() as {
    conversationId: string;
    message: string;
  };

  if (!conversationId || !message) {
    return new Response(JSON.stringify({ error: 'Missing conversationId or message' }), { status: 400 });
  }

  // Load history
  const { data: history } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  // Save user message
  await supabase.from('messages').insert({
    conversation_id: conversationId,
    role: 'user',
    content: message,
  });

  const systemPrompt = await buildSystemPrompt();

  // Build messages array — system first, then history, then current user message
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...(history || []).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: message },
  ];

  // SSE stream
  const encoder = new TextEncoder();
  let fullAssistantText = '';

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let continueLoop = true;

        while (continueLoop) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const openrouterStream = await (openrouter.chat.completions.create as any)({
            model: MODEL,
            max_tokens: 4096,
            stream: true,
            messages,
            tools: TOOL_DEFINITIONS,
            tool_choice: 'auto',
            // OpenRouter-specific: try primary first, fall back to Llama 3.3 70B if unavailable
            models: [MODEL, FALLBACK_MODEL],
          }) as Stream<OpenAI.Chat.ChatCompletionChunk>;

          let finishReason: string | null = null;
          const toolCallsAcc: Record<number, { id: string; name: string; arguments: string }> = {};
          let iterationText = '';

          for await (const chunk of openrouterStream) {
            const delta = chunk.choices[0]?.delta;
            const reason = chunk.choices[0]?.finish_reason;
            if (reason) finishReason = reason;

            if (delta?.content) {
              iterationText += delta.content;
              fullAssistantText += delta.content;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', text: delta.content })}\n\n`));
            }

            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                if (!toolCallsAcc[tc.index]) {
                  toolCallsAcc[tc.index] = { id: '', name: '', arguments: '' };
                }
                if (tc.id) toolCallsAcc[tc.index].id = tc.id;
                if (tc.function?.name) toolCallsAcc[tc.index].name = tc.function.name;
                if (tc.function?.arguments) toolCallsAcc[tc.index].arguments += tc.function.arguments;
              }
            }
          }

          if (finishReason === 'tool_calls') {
            const toolCalls = Object.values(toolCallsAcc);

            // Append assistant message with tool_calls
            messages.push({
              role: 'assistant',
              content: iterationText || null,
              tool_calls: toolCalls.map((tc) => ({
                id: tc.id,
                type: 'function' as const,
                function: { name: tc.name, arguments: tc.arguments },
              })),
            });

            // Execute each tool and append results
            for (const tc of toolCalls) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'tool_call', tool: tc.name })}\n\n`)
              );
              const result = await executeTool(tc.name, JSON.parse(tc.arguments) as Record<string, unknown>);
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

        // Save full assistant response
        if (fullAssistantText) {
          await supabase.from('messages').insert({
            conversation_id: conversationId,
            role: 'assistant',
            content: fullAssistantText,
          });

          // Update conversation updated_at and auto-title if still "New Conversation"
          const { data: conv } = await supabase
            .from('conversations')
            .select('title')
            .eq('id', conversationId)
            .single();

          if (conv?.title === 'New Conversation') {
            const shortTitle = message.slice(0, 50).trim();
            await supabase
              .from('conversations')
              .update({ title: shortTitle, updated_at: new Date().toISOString() })
              .eq('id', conversationId);
          } else {
            await supabase
              .from('conversations')
              .update({ updated_at: new Date().toISOString() })
              .eq('id', conversationId);
          }
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
        controller.close();
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Unknown error';
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: errMsg })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
