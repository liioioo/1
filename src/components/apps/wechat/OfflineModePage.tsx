import React, { useState } from 'react';
import { ChevronLeft, Sparkles, Heart, Send, Calendar, MapPin, Coffee, Utensils, Compass, Flame } from 'lucide-react';
import { WeChatContact } from '../../../types';
import { soundManager } from '../../../utils/audio';

interface DateLog {
  id: string;
  sender: string;
  avatar: string;
  text: string;
  action?: string;
  time: string;
  isMe: boolean;
}

interface OfflineModePageProps {
  activeContact: WeChatContact;
  userAvatar: string;
  userName: string;
  onBack: () => void;
}

export const OfflineModePage: React.FC<OfflineModePageProps> = ({
  activeContact,
  userAvatar,
  userName,
  onBack,
}) => {
  const [venue, setVenue] = useState('静安寺 Manner 露天咖啡馆');
  const [atmosphere, setAtmosphere] = useState('浪漫温暖 · 阳光轻抚');
  const [affection, setAffection] = useState(88);

  const [dateLogs, setDateLogs] = useState<DateLog[]>([
    {
      id: 'd-1',
      sender: activeContact.name,
      avatar: activeContact.avatar,
      text: `“你到啦！我已经点好了拿铁，就坐在靠近梧桐树的这桌呢。”`,
      action: '在角落靠窗位置微笑着向你挥挥手',
      time: '15:30',
      isMe: false,
    },
  ]);

  const [inputAction, setInputAction] = useState('');
  const [inputSpeech, setInputSpeech] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const quickActions = [
    { label: '☕ 递上一杯热咖啡', speech: '尝尝看，这家店的招牌拿铁。', action: '轻触她的指尖并递过咖啡' },
    { label: '🤝 轻轻牵起手', speech: '今天天气真好，我们去那边散散步吧。', action: '温柔地牵起对方的手' },
    { label: '👁️ 眼神对视微笑', speech: '看你今天心情很好，真可爱。', action: '凝视对方并露出温柔的微笑' },
    { label: '🍰 分享一份精美甜品', speech: '张嘴，试一下这个巴斯克蛋糕~', action: '舀了一小块蛋糕递到对方嘴边' },
  ];

  const handleSendDateInteraction = async (actionText?: string, speechText?: string) => {
    const act = actionText || inputAction;
    const sp = speechText || inputSpeech;

    if (!act.trim() && !sp.trim()) return;
    soundManager.playTap();

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const userLog: DateLog = {
      id: `d-${Date.now()}`,
      sender: userName,
      avatar: userAvatar,
      text: sp.trim() ? `“${sp.trim()}”` : '',
      action: act.trim(),
      time: timeStr,
      isMe: true,
    };

    setDateLogs((prev) => [...prev, userLog]);
    setInputAction('');
    setInputSpeech('');
    setIsGenerating(true);

    try {
      const res = await fetch('https://one-ah64.onrender.com/api/chat', {

        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...dateLogs.map((l) => ({ sender: l.sender, content: `${l.action ? `[动作: ${l.action}] ` : ''}${l.text}` })),
            { sender: userName, content: `${act ? `[动作: ${act}] ` : ''}${sp}` },
          ],
          systemPrompt: `${activeContact.systemPrompt}\n【线下约会场景】: 你现在正在和 USER 在【${venue}】线下约会互动。你的反应要极其真实、充满生活气息，包含生动的心理描写、微表情或动作，展现心动、害羞或开心的真实情绪。`,
          userPrompt: activeContact.userPrompt,
          partnerName: activeContact.name,
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.replies) && data.replies.length > 0) {
        const replyObj = data.replies[0];
        const aiLog: DateLog = {
          id: `d-ai-${Date.now()}`,
          sender: activeContact.name,
          avatar: activeContact.avatar,
          text: `“${replyObj.content || '真开心今天能和你在一起...'}”`,
          action: '眼神微微闪烁，脸颊泛起一丝微红',
          time: timeStr,
          isMe: false,
        };
        setDateLogs((prev) => [...prev, aiLog]);
        setAffection((prev) => Math.min(100, prev + 2));
      }
    } catch {
      // Fallback
      const fallbackLog: DateLog = {
        id: `d-ai-${Date.now()}`,
        sender: activeContact.name,
        avatar: activeContact.avatar,
        text: `“和你待在一起的时候，时间好像过得特别快...”`,
        action: '甜甜地笑了起来，低头抿了一口咖啡',
        time: timeStr,
        isMe: false,
      };
      setDateLogs((prev) => [...prev, fallbackLog]);
      setAffection((prev) => Math.min(100, prev + 1));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8f6f0] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden animate-fade-in relative">
      {/* Top Header */}
      <div className="bg-[#ede9de] dark:bg-zinc-900 px-4 py-3 border-b border-amber-200/50 dark:border-zinc-800 flex items-center justify-between sticky top-0 z-20">
        <button onClick={onBack} className="flex items-center text-zinc-800 dark:text-zinc-200 text-xs font-semibold">
          <ChevronLeft className="w-5 h-5 -ml-1 text-amber-700 dark:text-amber-400" />
          返回微信
        </button>
        <span className="font-extrabold text-sm text-amber-950 dark:text-amber-100 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-rose-500" /> 线下约会现场 · {activeContact.name}
        </span>
        <div className="flex items-center gap-1 text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200">
          <Heart className="w-3.5 h-3.5 fill-current animate-pulse" />
          {affection}%
        </div>
      </div>

      {/* Date Scene Top Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-pink-600 text-white p-3.5 shadow-md space-y-1">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-amber-200" /> {venue}
          </span>
          <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full">{atmosphere}</span>
        </div>
      </div>

      {/* Interaction Timeline */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {dateLogs.map((log) => (
          <div key={log.id} className={`flex items-start gap-2.5 ${log.isMe ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className="w-9 h-9 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold text-base shadow shrink-0">
              {log.avatar}
            </div>

            <div className={`max-w-[80%] space-y-1 ${log.isMe ? 'items-end text-right' : 'items-start'}`}>
              {log.action && (
                <div className="text-[11px] italic text-amber-800 dark:text-amber-200 bg-amber-100/70 dark:bg-amber-950/50 px-2.5 py-1 rounded-xl border border-amber-200/50 inline-block">
                  * {log.action} *
                </div>
              )}
              {log.text && (
                <div className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                  log.isMe 
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white rounded-tr-none'
                    : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tl-none border border-amber-200/60 dark:border-zinc-700'
                }`}>
                  {log.text}
                </div>
              )}
              <span className="text-[9px] text-zinc-400 font-mono block px-1">{log.time}</span>
            </div>
          </div>
        ))}

        {isGenerating && (
          <div className="flex items-center gap-2 text-xs text-rose-500 font-bold animate-pulse p-2">
            <Sparkles className="w-4 h-4 animate-spin" />
            {activeContact.name} 正在害羞回应中...
          </div>
        )}
      </div>

      {/* Interactive Action Control Panel */}
      <div className="bg-white dark:bg-zinc-900 border-t border-amber-200/60 dark:border-zinc-800 p-3 space-y-2.5 shadow-lg z-20">
        {/* Quick Action Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {quickActions.map((qa, idx) => (
            <button
              key={idx}
              onClick={() => handleSendDateInteraction(qa.action, qa.speech)}
              className="text-[10px] bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-200/80 dark:border-amber-900 font-bold px-2.5 py-1 rounded-full shrink-0 hover:bg-amber-100 transition-all active:scale-95"
            >
              {qa.label}
            </button>
          ))}
        </div>

        {/* Inputs */}
        <div className="space-y-2">
          <input
            type="text"
            placeholder="[动作描写] 例如: 递过餐巾纸、轻揽住肩..."
            value={inputAction}
            onChange={(e) => setInputAction(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
          />
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="“对 CHAR 说的亲密言语...”"
              value={inputSpeech}
              onChange={(e) => setInputSpeech(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendDateInteraction()}
              className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
            />
            <button
              onClick={() => handleSendDateInteraction()}
              disabled={isGenerating}
              className="bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-extrabold text-xs px-4 py-1.5 rounded-xl shadow transition-all active:scale-95 flex items-center gap-1 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              互动
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
