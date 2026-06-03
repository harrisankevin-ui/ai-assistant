import { Send } from 'lucide-react';

export default function TelegramStatusWidget() {
  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.06)] rounded-2xl p-4">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">Telegram</p>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#229ED9] flex items-center justify-center shrink-0">
          <Send className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Connected channel</p>
          <p className="text-xs text-gray-500">Text and voice ready</p>
        </div>
        <div className="ml-auto w-2 h-2 rounded-full bg-green-400" />
      </div>
    </div>
  );
}
