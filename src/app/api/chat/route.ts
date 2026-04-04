import { NextRequest, NextResponse } from 'next/server';
import type Anthropic from '@anthropic-ai/sdk';
import { anthropic, MODEL, SYSTEM_PROMPT } from '@/lib/anthropic';
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
    return NextResponse.json({ error: 'Missing conversationId or message' }, { status: 400 });
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

  // Build messages array for Claude
  const messages: Anthropic.MessageParam[] = [
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
          const claudeStream = anthropic.messages.stream({
            model: MODEL,
            max_tokens: 4096,
            system: SYSTEM_PROMPT,
            tools: TOOL_DEFINITIONS,
            messages,
          });

          // Collect tool use blocks for this iteration
          const toolUseBlocks: Anthropic.ToolUseBlock[] = [];
          let iterationText = '';

          for await (const event of claudeStream) {
            if (event.type === 'content_block_delta') {
              if (event.delta.type === 'text_delta') {
                const token = event.delta.text;
                iterationText += token;
                fullAssistantText += token;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', text: token })}\n\n`));
              }
            }
          }

          const finalMsg = await claudeStream.finalMessage();

          // Collect tool_use blocks
          for (const block of finalMsg.content) {
            if (block.type === 'tool_use') {
              toolUseBlocks.push(block);
            }
          }

          if (finalMsg.stop_reason === 'tool_use' && toolUseBlocks.length > 0) {
            // Append assistant turn
            messages.push({ role: 'assistant', content: finalMsg.content });

            // Execute tools
            const toolResults: Anthropic.ToolResultBlockParam[] = [];
            for (const toolBlock of toolUseBlocks) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: 'tool_call', tool: toolBlock.name })}\n\n`
                )
              );
              const result = await executeTool(toolBlock.name, toolBlock.input as Record<string, unknown>);
              toolResults.push({
                type: 'tool_result',
                tool_use_id: toolBlock.id,
                content: result,
              });
            }

            // Append tool results
            messages.push({ role: 'user', content: toolResults });
          } else {
            continueLoop = false;
            if (iterationText) {
              // text was already streamed
            }
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
            // generate a short title from the first user message
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
