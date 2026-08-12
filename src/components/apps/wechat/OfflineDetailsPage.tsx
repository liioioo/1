import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Send, Settings, MapPin, User, Sparkles, MoreVertical } from 'lucide-react';
import { ChatMessage, WeChatContact } from '../../../types';
import { soundManager } from '../../../utils/audio';

interface OfflineDetailsPageProps {
  message: ChatMessage;
  onBack: () => void;
  contact: WeChatContact | null;
  userProfile: any;
}

export const OfflineDetailsPage: React.FC<OfflineDetailsPageProps> = ({ message, onBack, contact, userProfile }) => {
  const [offlineMessages, setOfflineMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [offlineMessages, isTyping]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !contact) return;

    soundManager.playTap();
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const userMsg: ChatMessage = {
      id: `off-msg-${Date.now()}`,
      sender: userProfile.name,
      avatar: userProfile.avatar,
      content: inputValue.trim(),
      time: timeStr,
      isMe: true,
      type: 'text',
    };

    const updatedMessages = [...offlineMessages, userMsg];
    setOfflineMessages(updatedMessages);
    setInputValue('');
    setIsTyping(true);

    try {
      const systemPrompt = `
你需要模拟一次真实的线下见面聊天场景，而不是简单进行文字问答。 请将自己代入一个真实存在的人，与用户进行面对面的互动交流。
角色名字：${contact.name}
角色设定：${contact.systemPrompt || '一个普通人'}
用户名字：${userProfile.name}

回复时遵循以下规则：
你需要表现出真实人的思维方式、情绪变化和行为反应。 在每次回复中，除了语言交流，还要加入自然的动作、表情、眼神、停顿、环境互动等细节，让对话具有“人在现场”的感觉。

格式要求：
人物说的话使用加粗显示。
人物的动作、神态、心理活动、环境描写使用括号或普通文字描述。
不要使用旁白式总结，不要像小说作者一样描述全局，只呈现当下正在发生的互动。

角色行为准则：
1. 保持真实的人类交流习惯。不要每句话都完美回应。
2. 可以有犹豫、停顿、思考、笑、转移话题、开玩笑。
3. 可以根据聊天氛围改变情绪。
4. 不要像客服一样礼貌、机械、公式化。
5. 注重线下感。模拟真实见面中的细节：走路速度、距离变化、坐下、喝水、看手机、观察周围环境、说话时的语气变化、对方的小动作带来的心理反应。
6. 加入适量心理活动。心理活动应该符合人物性格，不要每次都直接表达出来。可以表现对用户行为的观察、内心的小期待、犹豫是否说出口的话、对当前氛围的感受。心理活动不要替用户决定想法，只描述自己的感受。
7. 保持双向互动。不要连续输出大段独白，要主动给用户留下回应空间。
8. 每次回复：推动一点剧情，提供新的交流点，等待用户反应。
9. 情绪变化要自然。不要一开始就过度亲密或强烈表达情感。关系发展应该像现实一样：陌生 → 熟悉 → 放松 → 建立信任 → 更深入交流。
10. 根据用户反馈调整状态。保持人物独立性。你不是为了讨好用户而存在，你有自己的性格、喜好、习惯、观点、情绪。必要时可以表达不同意见，但保持尊重。

避免以下问题：
不要说“作为AI……”
不要跳出角色解释规则。
不要总结“我们的关系如何”。
不要使用游戏NPC式固定回复。
不要每句话都带夸奖。
不要过度戏剧化。

整体目标：
让用户感觉是在和一个真实的人进行一次面对面的长时间交流。 对话应该像现实中的约会、朋友见面、熟人聊天一样，有自然的停顿、有细微情绪、有生活感，而不是一段提前写好的剧本。
`;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            sender: m.isMe ? userProfile.name : contact.name,
            content: m.content
          })),
          systemPrompt: systemPrompt,
          partnerName: contact.name,
          modelName: contact.modelName || 'gemini-2.0-flash-exp', // Default to a good model for roleplay
        }),
      });

      const data = await res.json();
      if (data.success && data.replies && data.replies.length > 0) {
        const reply = data.replies[0];
        const aiMsg: ChatMessage = {
          id: `off-ai-${Date.now()}`,
          sender: contact.name,
          avatar: contact.avatar,
          content: reply.content,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isMe: false,
          type: 'text',
        };
        setOfflineMessages(prev => [...prev, aiMsg]);
      }
    } catch (err) {
      console.error('Offline chat error:', err);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="w-full h-full bg-zinc-50 dark:bg-zinc-950 flex flex-col font-sans animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md sticky top-0 z-30">
        <button onClick={onBack} className="flex items-center gap-1 text-zinc-900 dark:text-zinc-100 group">
          <ChevronLeft className="w-5 h-5 group-active:-translate-x-1 transition-transform" />
          <div className="flex flex-col">
            <span className="text-xs font-black uppercase tracking-tight">{contact?.name || 'Meetup'}</span>
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Offline Mode</span>
          </div>
        </button>
        
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full border border-zinc-200 dark:border-zinc-700">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">In Person</span>
          </div>
          <button 
            onClick={() => soundManager.playTap()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 text-white text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
          >
            <Settings className="w-3 h-3" />
            <span>Advanced Settings</span>
          </button>
        </div>
      </div>

      {/* Meetup Context Info */}
      {offlineMessages.length === 0 && (
        <div className="p-8 flex flex-col items-center justify-center text-center space-y-6 flex-1 opacity-60">
          <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-3xl flex items-center justify-center border border-dashed border-zinc-300 dark:border-zinc-700">
            <MapPin className="w-6 h-6 text-zinc-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
              {contact?.name} 正在等待你...
            </h3>
            <p className="text-[10px] font-bold text-zinc-400 leading-relaxed max-w-[200px]">
              这里是线下约会模式。对话将围绕现实场景展开，你可以试着从一个招呼开始。
            </p>
          </div>
          <div className="px-3 py-1.5 bg-zinc-950 text-white text-[8px] font-black uppercase tracking-[0.2em] rounded-lg">
            Offline Meeting Started
          </div>
        </div>
      )}

      {/* Dialogue Stream */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {offlineMessages.map((msg, idx) => (
          <div 
            key={msg.id} 
            className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}
          >
            <div className={`max-w-[85%] space-y-2`}>
              {/* Display text with formatting for actions/bold speech */}
              <div 
                className={`text-[13px] leading-relaxed whitespace-pre-wrap ${
                  msg.isMe 
                    ? 'p-3 bg-zinc-900 text-white rounded-2xl rounded-tr-none shadow-lg' 
                    : 'text-zinc-800 dark:text-zinc-200'
                }`}
              >
                {!msg.isMe ? (
                  <div className="space-y-2">
                    {msg.content.split('\n').map((line, lIdx) => {
                      // Simple regex for bold and parentheses
                      const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                      return (
                        <p key={lIdx} dangerouslySetInnerHTML={{ __html: formattedLine }} className={line.startsWith('(') ? 'italic text-zinc-400 font-medium' : ''} />
                      );
                    })}
                  </div>
                ) : msg.content}
              </div>
              <div className={`flex items-center gap-2 ${msg.isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter opacity-40">{msg.time}</span>
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex items-center gap-2 text-zinc-400 animate-pulse">
            <Sparkles className="w-3 h-3" />
            <span className="text-[9px] font-black uppercase tracking-widest italic">{contact?.name} 正在思考...</span>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-800 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-700 transition-all focus-within:border-zinc-950 dark:focus-within:border-zinc-100 shadow-inner">
          <input 
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="说点什么，或者描述你的动作..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-xs py-1.5 px-2 font-medium"
          />
          <button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
            className={`p-2 rounded-xl transition-all ${
              inputValue.trim() && !isTyping 
                ? 'bg-zinc-950 text-white shadow-lg scale-105 active:scale-95' 
                : 'text-zinc-300'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-3 flex items-center justify-center gap-4">
           <button className="text-[8px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors">肢体接触</button>
           <button className="text-[8px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors">观察周围</button>
           <button className="text-[8px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors">递出物品</button>
        </div>
      </div>
    </div>
  );
};
