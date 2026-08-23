/**
 * /api/transcribe
 *
 * Browser microphone → text, using the same Groq Whisper transcription
 * already used for Telegram voice messages (see src/lib/telegram.ts).
 * Called by the dashboard's voice capture button before handing the
 * transcript to /api/capture.
 */
import { NextRequest, NextResponse } from 'next/server';
import OpenAI, { toFile } from 'openai';

export const runtime = 'nodejs';
export const maxDuration = 30;

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY ?? 'placeholder',
  baseURL: 'https://api.groq.com/openai/v1',
});

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const audio = formData.get('audio');

  if (!(audio instanceof File)) {
    return NextResponse.json({ error: 'Missing audio' }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await audio.arrayBuffer());
    const file = await toFile(buffer, 'recording.webm', { type: audio.type || 'audio/webm' });

    const transcription = await groq.audio.transcriptions.create({
      file,
      model: 'whisper-large-v3',
    });

    return NextResponse.json({ text: transcription.text });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
