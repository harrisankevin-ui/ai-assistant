'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, Wrench, Send } from 'lucide-react';
import type { Conversation, Message } from '@/types';
import ConversationList from './ConversationList';
import MessageBubble from './MessageBubble';

interface StreamMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatInterface() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<(Message | StreamMessage)[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [toolCalling, setToolCalling] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadConversations = useCallback(async () => {
    const res = await fetch('/api/conversations');
    if (res.ok) setConversations(await res.json());
  }, []);

  const loadMessages = useCallback(async (id: string) => {
    setLoading(true);
    const res = await fetch(`/api/conversations/${id}`);
    if (res.ok) setMessages(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (activeId) loadMessages(activeId);
  }, [activeId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const createConversation = async () => {
    const res = await fetch('/api/conversations', { method: 'POST' });
    if (res.ok) {
      const conv = await res.json() as Conversation;
      setConversations((prev) => [conv, ...prev]);
      setActiveId(conv.id);
      setMessages([]);
    }
  };

  const deleteConversation = async (id: string) => {
    await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      setActiveId(null);
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeId || streaming) return;

    const userMsg: StreamMessage = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setStreaming(true);
    setStreamingText('');
    setToolCalling(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: activeId, message: userMsg.content }),
      });

      if (!res.ok || !res.body) throw new Error('Stream failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const evt = JSON.parse(line.slice(6)) as {
              type: string;
              text?: string;
              tool?: string;
              error?: string;
            };

            if (evt.type === 'text' && evt.text) {
              fullText += evt.text;
              setStreamingText(fullText);
              setToolCalling(null);
            } else if (evt.type === 'tool_call') {
              setToolCalling(evt.tool ?? 'tool');
            } else if (evt.type === 'done') {
              setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: fullText } as StreamMessage,
              ]);
              setStreamingText('');
              // Refresh conversations to get updated titles
              loadConversations();
            } else if (evt.type === 'error') {
              throw new Error(evt.error);
            }
          } catch {
            // parse error, skip
          }
        }
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong.' } as StreamMessage,
      ]);
    } finally {
      setStreaming(false);
      setStreamingText('');
      setToolCalling(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-full bg-gradient-to-br from-gray-50 to-gray-100">
      <ConversationList
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
        onCreate={createConversation}
        onDelete={deleteConversation}
      />

      {/* Chat area */}
      <div className="flex-1 flex flex-col h-full">
        {!activeId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-gray-900/20">
                <span className="text-2xl font-bold text-white">M</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Hey Harrisan</h2>
              <p className="text-gray-500 text-sm max-w-xs">What can I help you with today?</p>
              <button
                onClick={createConversation}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors"
              >
                New Chat
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loading && (
                <div className="flex justify-center">
                  <Loader2 size={20} className="animate-spin text-gray-400" />
                </div>
              )}
              {messages.map((msg, i) => (
                <MessageBubble key={('id' in msg && msg.id) ? msg.id : i} message={msg as Message} />
              ))}
              {toolCalling && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-gray-700">M</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 backdrop-blur border border-gray-200/60 rounded-2xl rounded-tl-sm shadow-sm">
                    <Wrench size={11} className="text-gray-500 animate-pulse" />
                    <span className="text-xs text-gray-500">{toolCalling.replace(/_/g, ' ')}</span>
                  </div>
                </div>
              )}
              {streamingText && (
                <MessageBubble
                  message={{ role: 'assistant', content: streamingText } as Message}
                />
              )}
              {streaming && !streamingText && !toolCalling && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center">
                    <Loader2 size={14} className="animate-spin text-gray-400" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+68px)] lg:pb-4 border-t border-gray-200/60 bg-white/60 backdrop-blur-xl">
              <div className="flex gap-3 items-end bg-white/80 backdrop-blur border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message Max…"
                  rows={1}
                  className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 resize-none outline-none max-h-40"
                  style={{ minHeight: '1.5rem', fontSize: '16px' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || streaming}
                  className="w-8 h-8 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-lg flex items-center justify-center transition-colors shrink-0"
                >
                  {streaming ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
