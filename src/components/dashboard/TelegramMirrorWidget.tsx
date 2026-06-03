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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.06)] rounded-2xl p-4 flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Max chat</p>
        {hasConversation && (
          <span className="text-[10px] font-semibold bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
            Live
          </span>
        )}
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-3">Telegram mirror</h3>

      <div className="flex-1 overflow-y-auto space-y-2 max-h-[220px] min-h-[80px]">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`h-7 bg-gray-100 rounded-xl animate-pulse ${i % 2 === 0 ? 'ml-8' : 'mr-8'}`} />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-3">
            {hasConversation ? 'No messages yet' : 'No Telegram conversation found'}
          </p>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] px-3 py-1.5 rounded-2xl text-xs leading-snug ${
                  msg.role === 'user'
                    ? 'bg-gray-900 text-white rounded-br-sm'
                    : 'bg-white border border-gray-100 text-gray-700 rounded-bl-sm shadow-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center justify-between">
        <p className="text-[10px] text-gray-400">Read-only mirror</p>
        <a
          href="https://t.me/maxharrisansbot_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-700 transition-colors"
        >
          Reply on Telegram <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
    </div>
  );
}
