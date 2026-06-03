'use client';

import ReactMarkdown from 'react-markdown';
import type { Message } from '@/types';
import { User } from 'lucide-react';

interface Props {
  message: Message | { role: 'user' | 'assistant'; content: string; id?: string };
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser
            ? 'bg-gray-900'
            : 'bg-white border border-gray-200 shadow-sm'
        }`}
      >
        {isUser
          ? <User size={16} className="text-white" />
          : <span className="text-sm font-semibold text-gray-700">M</span>
        }
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
          isUser
            ? 'bg-gray-900 text-white rounded-tr-sm shadow-sm'
            : 'bg-white/80 backdrop-blur-xl border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose-dark">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
