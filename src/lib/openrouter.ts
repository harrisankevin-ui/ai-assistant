import OpenAI from 'openai';

export const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY ?? 'placeholder',
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://vidya-eight.vercel.app',
    'X-Title': 'Max AI Assistant',
  },
});

// Fallback chain — tried in order if the previous model is rate-limited
export const MODELS = [
  'qwen/qwen3-next-80b-a3b-instruct:free',  // primary
  'meta-llama/llama-3.3-70b-instruct:free', // fallback 1
  'mistralai/mistral-7b-instruct:free',     // fallback 2
  'google/gemma-2-9b-it:free',              // fallback 3
];
export const MODEL = MODELS[0];
