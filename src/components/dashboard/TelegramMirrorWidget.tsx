'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { ExternalLink } from 'lucide-react';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export default function TelegramMirrorWidget() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [hasConversation, setHasConversation] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/telegram/messages');
    if (!res.ok) return;
    const data = await res.json() as { conversation_id: string | null; messages: Msg[] };
    setHasConversation(!!data.conversation_id);
    setMessages(data.messages ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  // Scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Max chat</p>
        {hasConversation && (
          <span className="text-[10px] font-semibold bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
            Live
          </span>
        )}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-4">Telegram mirror</h3>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto space-y-2 max-h-[260px] min-h-[120px]">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`h-8 bg-gray-100 rounded-xl animate-pulse ${i % 2 === 0 ? 'ml-8' : 'mr-8'}`} />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            {hasConversation ? 'No messages yet' : 'No Telegram conversation found'}
          </p>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-snug ${
                  msg.role === 'user'
                    ? 'bg-gray-900 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
        <p className="text-xs text-gray-400">Read-only mirror</p>
        <a
          href="https://t.me/maxharrisansbot_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors"
        >
          Reply on Telegram <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
