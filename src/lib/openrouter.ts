import OpenAI from 'openai';

export const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY ?? 'placeholder',
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://vidya-eight.vercel.app',
    'X-Title': 'Max AI Assistant',
  },
});

export const MODEL = 'qwen/qwen3-next-80b-a3b-instruct:free';
// Fallback: used automatically by OpenRouter if the primary model is unavailable or rate-limited
export const FALLBACK_MODEL = 'meta-llama/llama-3.3-70b-instruct:free';
