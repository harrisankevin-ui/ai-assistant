'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

export default function QuickCapture() {
  const [text, setText] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [reply, setReply] = useState('');

  async function submit() {
    if (!text.trim() || status === 'sending') return;
    setStatus('sending');
    try {
      const res = await fetch('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed');
      setReply(data.reply);
      setText('');
      setStatus('done');
      setTimeout(() => setStatus('idle'), 4000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 4000);
    }
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl p-4 shadow-sm shrink-0">
      <div className="flex items-center gap-2 mb-2 text-gray-500">
        <Sparkles size={16} />
        <span className="text-sm font-medium">Quick capture</span>
      </div>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          placeholder="Dump anything — a task, a thought, a reminder..."
          className="flex-1 bg-white/60 border border-white/60 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          disabled={status === 'sending'}
        />
        <button
          onClick={submit}
          disabled={status === 'sending' || !text.trim()}
          className="bg-gray-900 hover:bg-gray-800 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-xl transition shrink-0"
        >
          {status === 'sending' ? <Loader2 size={16} className="animate-spin" /> : 'Send'}
        </button>
      </div>
      {status === 'done' && reply && <p className="mt-2 text-xs text-gray-500">{reply}</p>}
      {status === 'error' && (
        <p className="mt-2 text-xs text-red-500">Something went wrong — try again.</p>
      )}
    </div>
  );
}
