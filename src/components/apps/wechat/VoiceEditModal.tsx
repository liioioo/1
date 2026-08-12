import React, { useState } from 'react';
import { Mic, Volume2, Send, X } from 'lucide-react';
import { soundManager } from '../../../utils/audio';

interface VoiceEditModalProps {
  onClose: () => void;
  onSendVoice: (transcriptText: string, durationSeconds: number) => void;
}

export const VoiceEditModal: React.FC<VoiceEditModalProps> = ({ onClose, onSendVoice }) => {
  const [transcript, setTranscript] = useState('我刚才买好了咖啡，等会见面细说~');
  const [duration, setDuration] = useState(4);

  const handleSend = () => {
    if (!transcript.trim()) return;
    soundManager.playTap();
    onSendVoice(transcript.trim(), duration);
    onClose();
  };

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 w-full max-w-xs border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-2xl animate-scale-up">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
          <span className="font-extrabold text-xs text-purple-600 flex items-center gap-1.5">
            <Mic className="w-4 h-4" /> 自定义编辑语音消息
          </span>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-zinc-400 block mb-1">语音转文字转录文本 (可编辑)</label>
            <textarea
              rows={3}
              value={transcript}
              onChange={(e) => {
                setTranscript(e.target.value);
                setDuration(Math.max(1, Math.min(60, Math.ceil(e.target.value.length * 0.4))));
              }}
              placeholder="请输入语音说出的具体话语..."
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] font-bold text-zinc-400 mb-1">
              <span>语音时长</span>
              <span className="text-purple-600 font-mono font-bold">{duration}" 秒</span>
            </div>
            <input
              type="range"
              min={1}
              max={60}
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value, 10))}
              className="w-full accent-purple-600"
            />
          </div>

          {/* Bubble Preview */}
          <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-200/50 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-purple-600 animate-pulse shrink-0" />
            <div className="text-xs text-purple-900 dark:text-purple-200 font-medium truncate">
              {duration}" [{transcript}]
            </div>
          </div>
        </div>

        <button
          onClick={handleSend}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs py-2.5 rounded-xl shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-1.5"
        >
          <Send className="w-4 h-4" />
          发送语音消息
        </button>
      </div>
    </div>
  );
};
