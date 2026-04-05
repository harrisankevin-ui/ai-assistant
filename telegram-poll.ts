/**
 * Local development Telegram bot (polling mode).
 * Run with: npm run telegram
 * Keep this running in a separate terminal alongside `npm run dev`.
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import TelegramBot from 'node-telegram-bot-api';
import { handleTelegramUpdate } from './src/lib/telegram';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
if (!BOT_TOKEN) { console.error('Missing TELEGRAM_BOT_TOKEN'); process.exit(1); }

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log('Max (polling) started…');

bot.on('message', async (msg) => {
  await handleTelegramUpdate({ message: msg, update_id: 0 });
});

bot.on('polling_error', (err) => {
  console.error('Polling error:', err.message);
  if (err.message.includes('ECONNRESET') || err.message.includes('EFATAL')) {
    console.log('Reconnecting in 5s…');
    setTimeout(() => {
      bot.stopPolling().then(() => bot.startPolling()).catch(console.error);
    }, 5000);
  }
});
