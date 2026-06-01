import { Send } from 'lucide-react';

export default function TelegramStatusWidget() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">Telegram</p>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#229ED9] flex items-center justify-center shrink-0">
          <Send className="w-4 h-4 text-white" />
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
