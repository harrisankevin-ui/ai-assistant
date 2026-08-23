'use client';

import { useRef, useState } from 'react';
import { Loader2, Mic, Send, Square } from 'lucide-react';

type Status = 'idle' | 'recording' | 'transcribing' | 'sending' | 'done' | 'error';

export default function QuickCapture() {
  const [text, setText] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [reply, setReply] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  function resetSoon() {
    setTimeout(() => setStatus('idle'), 5000);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        void transcribeAndSend(blob);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setStatus('recording');
    } catch {
      setReply('Microphone access denied or unavailable.');
      setStatus('error');
      resetSoon();
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  async function transcribeAndSend(blob: Blob) {
    setStatus('transcribing');
    try {
      const form = new FormData();
      form.append('audio', blob, 'recording.webm');
      const res = await fetch('/api/transcribe', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok || !data.text) throw new Error(data.error || 'Transcription failed');
      await submit(data.text);
    } catch (err) {
      setReply(err instanceof Error ? err.message : 'Something went wrong.');
      setStatus('error');
      resetSoon();
    }
  }

  async function submit(overrideText?: string) {
    const payload = (overrideText ?? text).trim();
    if (!payload || status === 'sending') return;
    setStatus('sending');
    try {
      const res = await fetch('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: payload }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed');
      setReply(data.reply);
      setText('');
      setStatus('done');
      resetSoon();
    } catch (err) {
      setReply(err instanceof Error ? err.message : 'Something went wrong.');
      setStatus('error');
      resetSoon();
    }
  }

  const isBusy = status === 'transcribing' || status === 'sending';

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">What&apos;s on your mind?</h1>
        <p className="text-sm text-gray-500 mt-1">Say it or type it — I&apos;ll sort it out.</p>
      </div>

      <button
        onClick={status === 'recording' ? stopRecording : startRecording}
        disabled={isBusy}
        className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition
          ${status === 'recording' ? 'bg-red-500 animate-pulse' : 'bg-gray-900 hover:bg-gray-800'}
          disabled:opacity-40`}
      >
        {isBusy ? (
          <Loader2 size={28} className="text-white animate-spin" />
        ) : status === 'recording' ? (
          <Square size={24} className="text-white" fill="white" />
        ) : (
          <Mic size={28} className="text-white" />
        )}
      </button>

      <p className="text-xs text-gray-400 h-4">
        {status === 'recording' && 'Listening — tap to stop'}
        {status === 'transcribing' && 'Transcribing...'}
        {status === 'sending' && 'Sorting it out...'}
      </p>

      <div className="w-full flex gap-2 bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl p-2 shadow-sm">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          placeholder="...or type here"
          disabled={isBusy || status === 'recording'}
          className="flex-1 bg-transparent px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />
        <button
          onClick={() => submit()}
          disabled={isBusy || !text.trim()}
          className="bg-gray-900 hover:bg-gray-800 disabled:opacity-40 text-white p-2.5 rounded-xl transition shrink-0"
        >
          <Send size={16} />
        </button>
      </div>

      {(status === 'done' || status === 'error') && reply && (
        <p className={`text-sm max-w-md ${status === 'error' ? 'text-red-500' : 'text-gray-600'}`}>
          {reply}
        </p>
      )}
    </div>
  );
}
