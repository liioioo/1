import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  RefreshCw, 
  ChevronLeft,
  MessageSquare,
  BookOpen,
  FileText,
  Globe,
  ShoppingBag,
  Music,
  Video,
  Image as ImageIcon,
  Wallet as WalletIcon,
  Users,
  Sparkles,
  Heart,
  Bookmark,
  User,
  MessageCircle,
  ExternalLink,
  Send,
  Eye
} from 'lucide-react';
import { WeChatContact } from '../../types';
import { soundManager } from '../../utils/audio';

interface Message {
  id: string;
  sender: string;
  content: string;
  time: string;
  isMe: boolean;
}

interface Conversation {
  friendName: string;
  friendAvatar: string;
  messages: Message[];
}

interface SmallAccount {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  conversations: Conversation[];
}

interface CheckPhoneData {
  chat: {
    mainConversations: Conversation[];
    smallAccounts: SmallAccount[];
  };
  diary: Array<{ id: string; date: string; title: string; content: string; mood: string }>;
  memos: Array<{ id: string; title: string; content: string; time: string; isPinned: boolean }>;
  browser: Array<{ 
    id: string; 
    title: string; 
    url: string; 
    time: string; 
    snippet: string;
    fullContent: string;
    comments: Array<{ id: string; user: string; content: string; time: string }>;
  }>;
  shopping: {
    cart: Array<{ id: string; name: string; price: number; count: number; image: string }>;
    orders: Array<{ id: string; name: string; price: number; status: string; time: string }>;
  };
  cloudMusic: {
    recentlyPlayed: Array<{ song: string; artist: string; album: string }>;
    likedSongs: Array<{ song: string; artist: string }>;
    comments: Array<{ song: string; content: string; time: string }>;
  };
  bookshelf: Array<{ id: string; title: string; author: string; progress: number; lastChapter: string }>;
  video: Array<{ id: string; title: string; uploader: string; views: string; duration: string; cover: string }>;
  gallery: Array<{ 
    id: string; 
    url: string; 
    detailedDescription: string; 
    innerThoughts: string; 
    time: string; 
    likes: number 
  }>;
  wallet: {
    balance: number;
    transactions: Array<{ id: string; title: string; amount: string; type: 'income' | 'expense'; time: string; method: string }>;
  };
  social: {
    profile: {
      idName: string;
      idNumber: string;
      bio: string;
    };
    posts: Array<{ id: string; content: string; time: string; likes: number; commentsCount: number; images: string[] }>;
  };
}

export const CheckPhoneApp: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [contacts, setContacts] = useState<WeChatContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<WeChatContact | null>(null);
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [phoneData, setPhoneData] = useState<CheckPhoneData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Chat state
  const [activeSmallAccount, setActiveSmallAccount] = useState<SmallAccount | null>(null);
  const [activeConversationIndex, setActiveConversationIndex] = useState(0);
  const [showSmallAccountModal, setShowSmallAccountModal] = useState(false);
  const [showCharSelector, setShowCharSelector] = useState(false);

  // Detail view modals for diary, memo, browser, shopping, music, books, gallery, wallet, social
  const [activeDetailPage, setActiveDetailPage] = useState<{ 
    type: 'diary' | 'memo' | 'browser' | 'shopping' | 'music' | 'book' | 'video' | 'gallery' | 'wallet' | 'social', 
    data: any 
  } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('wechat_contacts');
    if (saved) {
      try {
        const parsed: WeChatContact[] = JSON.parse(saved);
        setContacts(parsed);
      } catch {}
    }
  }, []);

  const loadPhoneDataForContact = (contactId: string) => {
    const savedData = localStorage.getItem(`checkphone_data_${contactId}`);
    if (savedData) {
      try {
        setPhoneData(JSON.parse(savedData));
        setActiveSmallAccount(null);
        setActiveConversationIndex(0);
      } catch {
        setPhoneData(null);
      }
    } else {
      setPhoneData(null);
    }
  };

  const handleSelectContact = (contact: WeChatContact) => {
    soundManager.playTap();
    setSelectedContact(contact);
    localStorage.setItem('checkphone_selected_contact', contact.id);
    setActiveApp(null);
    loadPhoneDataForContact(contact.id);
  };

  const handleOneClickRefresh = async () => {
    if (!selectedContact) return;
    soundManager.playTap();
    setIsGenerating(true);
    setErrorMsg(null);

    let apiConfig = null;
    try {
      const savedApi = localStorage.getItem('active_api_config');
      if (savedApi) {
        apiConfig = JSON.parse(savedApi);
      }
    } catch {}

    try {
      const res = await fetch('https://one-ah64.onrender.com/api/checkphone-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterName: selectedContact.remark || selectedContact.name,
          systemPrompt: selectedContact.systemPrompt,
          apiConfig,
          modelName: apiConfig?.modelName || selectedContact.modelName || 'gemini-2.5-flash',
          temperature: selectedContact.temperature ?? 0.85
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || '生成失败，请检查 API Key 配置。');
      }

      setPhoneData(data.data);
      setActiveSmallAccount(null);
      setActiveConversationIndex(0);
      localStorage.setItem(`checkphone_data_${selectedContact.id}`, JSON.stringify(data.data));
    } catch (err: any) {
      setErrorMsg(err.message || '网络请求失败');
    } finally {
      setIsGenerating(false);
    }
  };

  if (contacts.length === 0) {
    return (
      <div className="w-full h-full bg-white text-zinc-900 flex flex-col font-sans select-none overflow-y-auto">
        {/* ... existing header ... */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <h2 className="text-base font-bold text-zinc-900">未找到可查阅的角色</h2>
          <button onClick={onClose} className="px-4 py-2 bg-white border border-zinc-900 text-zinc-900 text-xs font-bold rounded-xl shadow-sm hover:bg-zinc-50 transition-all">返回添加</button>
        </div>
      </div>
    );
  }

  if (!selectedContact) {
    return (
      <div className="w-full h-full bg-white p-6 space-y-6 flex flex-col items-center justify-center">
        <h2 className="text-base font-bold text-zinc-900">选择查阅手机的角色</h2>
        <div className="w-full max-w-xs space-y-3">
          {contacts.map(c => (
            <button 
              key={c.id} 
              onClick={() => handleSelectContact(c)} 
              className="w-full p-4 border border-zinc-900 bg-white text-zinc-900 rounded-2xl flex items-center gap-3 font-bold hover:bg-zinc-50 transition-all shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-xl border border-zinc-200 overflow-hidden">
                {c.avatar.startsWith('http') || c.avatar.startsWith('data:') ? (
                  <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" />
                ) : (
                  c.avatar
                )}
              </div>
              <div className="text-left">
                <div className="text-sm">{c.name}</div>
                <div className="text-[10px] text-zinc-400 font-normal">点击查手机</div>
              </div>
            </button>
          ))}
        </div>
        <button onClick={onClose} className="text-xs text-zinc-400 hover:text-zinc-600 underline">返回</button>
      </div>
    );
  }

  const appsList = [
    { id: 'chat', name: '聊天', icon: MessageSquare },
    { id: 'diary', name: '日记', icon: BookOpen },
    { id: 'memo', name: '备忘录', icon: FileText },
    { id: 'browser', name: '浏览器', icon: Globe },
    { id: 'shopping', name: '购物', icon: ShoppingBag },
    { id: 'cloudMusic', name: '网易云', icon: Music },
    { id: 'bookshelf', name: '书架', icon: Bookmark },
    { id: 'video', name: '视频', icon: Video },
    { id: 'gallery', name: '相册', icon: ImageIcon },
    { id: 'wallet', name: '钱包', icon: WalletIcon },
    { id: 'social', name: '社交', icon: Users },
  ];

  // Active chat conversations depending on main or small account
  const currentConversations = activeSmallAccount 
    ? (activeSmallAccount.conversations || []) 
    : (phoneData?.chat?.mainConversations || []);

  const activeConv = currentConversations[activeConversationIndex] || currentConversations[0];

  return (
    <div className="w-full h-full bg-white text-zinc-900 flex flex-col font-sans select-none overflow-y-auto">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-zinc-200 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-2">
          {activeApp ? (
            <button 
              onClick={() => { soundManager.playTap(); setActiveApp(null); }}
              className="p-1.5 rounded-xl border border-zinc-300 text-zinc-800 hover:bg-zinc-100 transition-colors mr-1 cursor-pointer"
              title="返回手机桌面"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={onClose}
              className="p-1.5 rounded-xl border border-zinc-300 text-zinc-800 hover:bg-zinc-100 transition-colors mr-1 cursor-pointer"
              title="返回"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-2 cursor-pointer py-1 px-2.5 rounded-xl hover:bg-zinc-100 transition-colors border border-transparent hover:border-zinc-200" onClick={() => setShowCharSelector(!showCharSelector)}>
            <div className="w-7 h-7 rounded-full bg-zinc-100 border border-zinc-300 flex items-center justify-center text-sm overflow-hidden">
              {selectedContact.avatar?.startsWith('http') || selectedContact.avatar?.startsWith('data:') ? (
                <img src={selectedContact.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{selectedContact.avatar || '👤'}</span>
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xs text-zinc-900 flex items-center gap-1">
                {selectedContact.remark || selectedContact.name} 的手机
                <span className="text-[10px] text-zinc-900 font-normal">切换</span>
              </span>
            </div>
          </div>
        </div>

        {/* Top-Right One-Click Refresh */}
        <div className="flex items-center gap-2">
          {!activeApp && (
            <button
              onClick={handleOneClickRefresh}
              disabled={isGenerating}
              className="px-3 py-1.5 bg-white border border-zinc-900 text-zinc-900 text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-sm font-bold"
              title="一键刷新"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>一键刷新</span>
            </button>
          )}
        </div>
      </div>

      {/* Character Selector Dropdown */}
      {showCharSelector && (
        <div className="bg-zinc-50 border-b border-zinc-200 p-3 space-y-2 animate-fade-in z-20">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-700 font-bold">选择要查阅手机的角色：</span>
            <button onClick={() => setShowCharSelector(false)} className="text-xs text-zinc-400 hover:text-zinc-900">关闭</button>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {contacts.map((c) => (
              <button
                key={c.id}
                onClick={() => { handleSelectContact(c); setShowCharSelector(false); }}
                className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer shadow-sm ${
                  selectedContact.id === c.id 
                    ? 'bg-zinc-50 border-zinc-900 text-zinc-900 font-bold' 
                    : 'bg-white border-zinc-200 text-zinc-800 hover:border-zinc-300'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-xs overflow-hidden shrink-0">
                  {c.avatar?.startsWith('http') || c.avatar?.startsWith('data:') ? (
                    <img src={c.avatar} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{c.avatar || '👤'}</span>
                  )}
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold truncate">{c.remark || c.name}</div>
                  <div className={`text-[10px] truncate ${selectedContact.id === c.id ? 'text-zinc-300' : 'text-zinc-400'}`}>点击查手机</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Generating Loading Banner */}
      {isGenerating && (
        <div className="bg-white border-b border-zinc-900 text-zinc-900 px-4 py-3 flex items-center justify-between text-xs animate-pulse z-10 font-bold">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-zinc-900 animate-spin" />
            <span>正在一键刷新全套手机数据...</span>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 text-xs text-rose-700 flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-xs underline font-medium">关闭</button>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col p-4 pb-16 overflow-y-auto">
        {!phoneData ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-12">
            <div className="w-16 h-16 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-700 shadow-2xs">
              <Smartphone className="w-8 h-8 animate-bounce" />
            </div>
            <h3 className="text-base font-bold text-zinc-900">尚未生成该角色的手机数据</h3>
            <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
              点击右上角的 <span className="text-zinc-900 font-bold">【一键刷新】</span> 按钮，AI 将根据 {selectedContact.remark || selectedContact.name} 的人设一键生成全套私密应用。
            </p>
            <button
              onClick={handleOneClickRefresh}
              disabled={isGenerating}
              className="px-6 py-3 bg-white border border-zinc-900 text-zinc-900 text-xs font-black rounded-2xl shadow-sm transition-all cursor-pointer flex items-center gap-2 hover:bg-zinc-50 active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>立即一键刷新并生成</span>
            </button>
          </div>
        ) : !activeApp ? (
          /* PHONE HOME SCREEN (No iPhone header or status widget as requested) */
          <div className="space-y-6 max-w-2xl mx-auto w-full pt-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">私密应用矩阵</h3>
                <span className="text-[11px] text-zinc-500">{selectedContact.remark || selectedContact.name} 的设备</span>
              </div>
              <div className="grid grid-cols-4 gap-4">
                {appsList.map((app) => {
                  const IconComp = app.icon;
                  return (
                    <button
                      key={app.id}
                      onClick={() => { soundManager.playTap(); setActiveApp(app.id); }}
                      className="flex flex-col items-center gap-2 group cursor-pointer"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-900 shadow-2xs group-hover:border-black group-hover:scale-105 transition-all">
                        <IconComp className="w-7 h-7 text-zinc-900" />
                      </div>
                      <span className="text-xs text-zinc-700 group-hover:text-black font-medium">{app.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* INDIVIDUAL APP VIEWS */
          <div className="space-y-4 animate-fade-in max-w-2xl mx-auto w-full">
            
            {/* 1. 聊天 App */}
            {activeApp === 'chat' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-zinc-50 p-3 rounded-2xl border border-zinc-200 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-zinc-900" />
                    <span className="text-xs font-bold text-zinc-900">
                      {activeSmallAccount ? `[小号: ${activeSmallAccount.name}] 聊天` : '微信 / 聊天记录'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {phoneData.chat?.smallAccounts && phoneData.chat.smallAccounts.length > 0 && (
                      <button
                        onClick={() => setShowSmallAccountModal(true)}
                        className="px-3 py-1 bg-white hover:bg-zinc-100 text-zinc-900 text-[11px] rounded-xl border border-zinc-300 cursor-pointer flex items-center gap-1 shadow-2xs font-medium"
                      >
                        <User className="w-3 h-3" />
                        <span>{activeSmallAccount ? '切换回大号' : `切换分身账号 (${phoneData.chat.smallAccounts.length})`}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Friend tabs if multiple conversations */}
                {currentConversations.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {currentConversations.map((conv, idx) => (
                      <button
                        key={idx}
                        onClick={() => { soundManager.playTap(); setActiveConversationIndex(idx); }}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-medium shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                          activeConversationIndex === idx 
                            ? 'bg-black border-black text-white' 
                            : 'bg-white border-zinc-200 text-zinc-800 hover:border-zinc-300'
                        }`}
                      >
                        <span>{conv.friendAvatar || '👤'}</span>
                        <span>{conv.friendName}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Chat Messages */}
                <div className="flex flex-col gap-4 bg-zinc-50 p-4 rounded-2xl border border-zinc-200 max-h-[500px] overflow-y-auto shadow-2xs">
                  {activeConv?.messages && activeConv.messages.length > 0 ? (
                    activeConv.messages.map((msg) => (
                      <div key={msg.id} className={`flex flex-col gap-1 w-full ${msg.isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`text-[10px] font-medium ${msg.isMe ? 'text-zinc-900' : 'text-zinc-900'}`}>
                          {msg.isMe ? '我' : msg.sender} · {msg.time}
                        </div>
                        <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                          msg.isMe ? 'bg-zinc-50 text-zinc-900 border border-zinc-900 rounded-tr-none font-bold' : 'bg-white text-zinc-900 rounded-tl-none border border-zinc-200'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-xs text-zinc-900">暂无聊天记录</div>
                  )}
                </div>
              </div>
            )}

            {/* Small Account Switch Modal */}
            {showSmallAccountModal && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <div className="bg-white border border-zinc-200 rounded-2xl p-5 w-full max-w-sm space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-zinc-900">切换聊天身份 / 小号</h3>
                    <button onClick={() => setShowSmallAccountModal(false)} className="text-xs text-zinc-400 hover:text-zinc-900">关闭</button>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => { setActiveSmallAccount(null); setActiveConversationIndex(0); setShowSmallAccountModal(false); }}
                      className={`w-full p-4 rounded-2xl border text-left flex items-center gap-3 text-xs transition-all cursor-pointer shadow-sm ${!activeSmallAccount ? 'bg-zinc-50 border-zinc-900 text-zinc-900 font-bold' : 'bg-white border-zinc-200 text-zinc-800'}`}
                    >
                      <span className="text-base font-bold">👤</span>
                      <div>
                        <div>主账号聊天 (大号)</div>
                        <div className={`text-[10px] ${!activeSmallAccount ? 'text-zinc-500 font-normal' : 'text-zinc-400'}`}>默认主要身份与好友</div>
                      </div>
                    </button>
                    {phoneData.chat?.smallAccounts?.map((sa) => (
                      <button
                        key={sa.id}
                        onClick={() => { setActiveSmallAccount(sa); setActiveConversationIndex(0); setShowSmallAccountModal(false); }}
                        className={`w-full p-4 rounded-2xl border text-left flex items-center gap-3 text-xs transition-all cursor-pointer shadow-sm ${activeSmallAccount?.id === sa.id ? 'bg-zinc-50 border-zinc-900 text-zinc-900 font-bold' : 'bg-white border-zinc-200 text-zinc-800'}`}
                      >
                        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center overflow-hidden border border-zinc-200">
                          {sa.avatar.startsWith('http') || sa.avatar.startsWith('data:') ? (
                            <img src={sa.avatar} alt={sa.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-base font-bold">{sa.avatar}</span>
                          )}
                        </div>
                        <div>
                          <div>{sa.name}</div>
                          <div className={`text-[10px] truncate max-w-[200px] ${activeSmallAccount?.id === sa.id ? 'text-zinc-500 font-normal' : 'text-zinc-400'}`}>{sa.bio}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. 日记 App (10-200 chars, clickable) */}
            {activeApp === 'diary' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 bg-zinc-50 p-3 rounded-2xl border border-zinc-200 shadow-2xs">
                  <BookOpen className="w-4 h-4 text-zinc-900" />
                  <span className="text-xs font-bold text-zinc-900">私密日记本</span>
                </div>
                <div className="space-y-3">
                  {phoneData.diary?.map((d) => (
                    <div 
                      key={d.id} 
                      onClick={() => setActiveDetailPage({ type: 'diary', data: d })}
                      className="p-4 rounded-2xl bg-white border border-zinc-200 space-y-2 shadow-2xs hover:border-black transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-[11px] text-zinc-400">
                        <span className="font-mono">{d.date}</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-800 border border-zinc-200 text-[10px] font-medium">{d.mood}</span>
                      </div>
                      <h4 className="text-sm font-bold text-zinc-900">{d.title}</h4>
                      <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed">{d.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detail Page Modal */}
            {activeDetailPage && (
              <div className="fixed inset-0 bg-white z-50 flex flex-col animate-fade-in">
                <div className="bg-white px-4 py-3 border-b border-zinc-200 flex items-center justify-between sticky top-0 shadow-2xs">
                  <button onClick={() => setActiveDetailPage(null)} className="p-1.5 rounded-xl border border-zinc-300 text-zinc-800 hover:bg-zinc-100 transition-colors cursor-pointer">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-sm text-zinc-900">详情</span>
                  <div className="w-8" />
                </div>
                <div className="flex-1 p-6 overflow-y-auto max-w-2xl mx-auto w-full">
                  {activeDetailPage.type === 'diary' && (
                    <div className="space-y-4">
                      <div className="space-y-1 border-b border-zinc-100 pb-4">
                        <span className="text-[11px] font-mono text-zinc-400">{activeDetailPage.data.date}</span>
                        <h3 className="text-lg font-bold text-zinc-900">{activeDetailPage.data.title}</h3>
                        <span className="px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-900 text-[10px] font-medium border border-zinc-200 inline-block">{activeDetailPage.data.mood}</span>
                      </div>
                      <div className="text-sm text-zinc-800 leading-relaxed whitespace-pre-wrap">
                        {activeDetailPage.data.content}
                      </div>
                    </div>
                  )}
                  {activeDetailPage.type === 'memo' && (
                    <div className="space-y-4">
                      <div className="space-y-1 border-b border-zinc-100 pb-4">
                        <h3 className="text-lg font-bold text-zinc-900">{activeDetailPage.data.title}</h3>
                        <span className="text-[11px] font-mono text-zinc-400">{activeDetailPage.data.time}</span>
                      </div>
                      <div className="text-sm text-zinc-800 leading-relaxed whitespace-pre-wrap">
                        {activeDetailPage.data.content}
                      </div>
                    </div>
                  )}
                  {activeDetailPage.type === 'browser' && (
                    <div className="space-y-4">
                      <div className="space-y-1 border-b border-zinc-100 pb-4">
                        <h3 className="text-lg font-bold text-zinc-900">{activeDetailPage.data.title}</h3>
                        <div className="text-[10px] text-zinc-400 font-mono truncate">{activeDetailPage.data.url}</div>
                      </div>
                      <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-800 leading-relaxed whitespace-pre-wrap">
                        {activeDetailPage.data.fullContent || activeDetailPage.data.snippet}
                      </div>
                      <div className="space-y-3 pt-2">
                        <h4 className="text-xs font-bold text-zinc-900">网友热评 ({activeDetailPage.data.comments?.length || 0})</h4>
                        {activeDetailPage.data.comments?.map((c: any) => (
                          <div key={c.id} className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-zinc-400">
                              <span className="font-bold text-zinc-700">{c.user}</span>
                              <span className="font-mono">{c.time}</span>
                            </div>
                            <p className="text-zinc-800">{c.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {activeDetailPage.type === 'shopping' && (
                    <div className="space-y-6">
                      <div className="aspect-square bg-zinc-100 rounded-2xl overflow-hidden border border-zinc-200">
                        <img src={activeDetailPage.data.image} alt={activeDetailPage.data.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <h3 className="text-xl font-black text-zinc-900">{activeDetailPage.data.name}</h3>
                          <div className="text-2xl font-mono font-black text-zinc-900">¥{activeDetailPage.data.price?.toFixed(2)}</div>
                        </div>
                        <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
                          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">商品参数</div>
                          <div className="text-xs text-zinc-700 flex justify-between">
                            <span>购买数量 / 订单量</span>
                            <span className="font-bold">{activeDetailPage.data.count || 1}</span>
                          </div>
                          <div className="text-xs text-zinc-700 flex justify-between">
                            <span>状态</span>
                            <span className="font-bold">{activeDetailPage.data.status || '正常'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeDetailPage.type === 'music' && (
                    <div className="space-y-6">
                      <div className="w-48 h-48 mx-auto rounded-full bg-zinc-900 border-8 border-zinc-100 shadow-xl flex items-center justify-center relative animate-spin-slow">
                        <div className="w-12 h-12 rounded-full bg-white border-2 border-zinc-900" />
                      </div>
                      <div className="text-center space-y-2">
                        <h3 className="text-xl font-black text-zinc-900">{activeDetailPage.data.song}</h3>
                        <p className="text-sm text-zinc-500 font-bold">{activeDetailPage.data.artist} · {activeDetailPage.data.album}</p>
                      </div>
                      {activeDetailPage.data.content && (
                        <div className="p-5 rounded-2xl bg-zinc-900 text-white space-y-3 shadow-lg">
                          <div className="flex items-center justify-between text-[10px] text-zinc-400">
                            <span className="font-bold">网抑云热评</span>
                            <span className="font-mono">{activeDetailPage.data.time}</span>
                          </div>
                          <p className="text-sm leading-relaxed italic">"{activeDetailPage.data.content}"</p>
                        </div>
                      )}
                    </div>
                  )}
                  {activeDetailPage.type === 'book' && (
                    <div className="space-y-6">
                      <div className="flex gap-4">
                        <div className="w-32 h-44 rounded-xl bg-zinc-100 border border-zinc-200 shadow-lg flex items-center justify-center text-zinc-800 font-black text-center p-4">
                          {activeDetailPage.data.title}
                        </div>
                        <div className="flex-1 space-y-3 py-2">
                          <h3 className="text-xl font-black text-zinc-900">{activeDetailPage.data.title}</h3>
                          <p className="text-sm text-zinc-500 font-bold">作者: {activeDetailPage.data.author}</p>
                          <div className="space-y-1">
                            <div className="text-xs text-zinc-400">阅读进度 {activeDetailPage.data.progress}%</div>
                            <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
                              <div className="h-full bg-zinc-900" style={{ width: `${activeDetailPage.data.progress}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">最后阅读章节</div>
                        <div className="text-sm text-zinc-900 font-bold">{activeDetailPage.data.lastChapter}</div>
                      </div>
                    </div>
                  )}
                  {activeDetailPage.type === 'video' && (
                    <div className="space-y-6">
                      <div className="aspect-video bg-zinc-900 rounded-2xl overflow-hidden shadow-lg border border-zinc-200 relative">
                        <img src={activeDetailPage.data.cover} alt={activeDetailPage.data.title} className="w-full h-full object-cover opacity-60" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/40">
                            <Video className="w-8 h-8 text-white fill-current" />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-xl font-black text-zinc-900">{activeDetailPage.data.title}</h3>
                        <div className="flex items-center justify-between text-xs text-zinc-500 font-bold border-b border-zinc-100 pb-4">
                          <span>发布者: {activeDetailPage.data.uploader}</span>
                          <span>播放次数: {activeDetailPage.data.views}</span>
                        </div>
                        <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 flex justify-between items-center">
                          <span className="text-xs text-zinc-500">视频时长</span>
                          <span className="text-sm font-mono font-bold text-zinc-900">{activeDetailPage.data.duration}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeDetailPage.type === 'wallet' && (
                    <div className="space-y-6">
                      <div className="text-center space-y-2 py-6">
                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">交易金额</div>
                        <div className="text-4xl font-black text-zinc-900 font-mono">{activeDetailPage.data.amount}</div>
                      </div>
                      <div className="space-y-3">
                        <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-3">
                          <div className="flex justify-between text-xs">
                            <span className="text-zinc-500">付款商户</span>
                            <span className="text-zinc-900 font-bold">{activeDetailPage.data.title}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-zinc-500">支付时间</span>
                            <span className="text-zinc-900 font-mono">{activeDetailPage.data.time}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-zinc-500">支付方式</span>
                            <span className="text-zinc-900 font-bold">{activeDetailPage.data.method}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-zinc-500">交易单号</span>
                            <span className="text-zinc-900 font-mono">{activeDetailPage.data.id}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeDetailPage.type === 'gallery' && (
                    <div className="space-y-6">
                      <div className="bg-zinc-100 rounded-2xl overflow-hidden border border-zinc-200 shadow-xl">
                        <img src={activeDetailPage.data.url} alt="Gallery" className="w-full h-auto" />
                      </div>
                      <div className="space-y-4">
                        <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
                          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">📷 照片详细描述</div>
                          <p className="text-sm text-zinc-800 leading-relaxed">{activeDetailPage.data.detailedDescription}</p>
                        </div>
                        <div className="p-5 rounded-2xl bg-zinc-900 text-white space-y-2 shadow-lg">
                          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">💭 此时此刻的心声</div>
                          <p className="text-sm leading-relaxed italic font-bold">"{activeDetailPage.data.innerThoughts}"</p>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-zinc-400 border-t border-zinc-100 pt-4">
                          <span className="font-mono">{activeDetailPage.data.time}</span>
                          <span className="flex items-center gap-1 text-zinc-900 font-bold">
                            <Heart className="w-4 h-4 fill-current" /> {activeDetailPage.data.likes} 赞
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeDetailPage.type === 'social' && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-xl overflow-hidden">
                          {selectedContact.avatar.startsWith('http') || selectedContact.avatar.startsWith('data:') ? (
                            <img src={selectedContact.avatar} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            selectedContact.avatar
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-black text-zinc-900">{selectedContact.remark || selectedContact.name}</div>
                          <div className="text-[10px] text-zinc-400 font-mono">{activeDetailPage.data.time}</div>
                        </div>
                      </div>
                      <p className="text-sm text-zinc-800 leading-relaxed whitespace-pre-wrap font-medium">{activeDetailPage.data.content}</p>
                      {activeDetailPage.data.images && activeDetailPage.data.images.length > 0 && (
                        <div className="grid grid-cols-1 gap-3">
                          {activeDetailPage.data.images.map((img: string, idx: number) => (
                            <img key={idx} src={img} alt="Post" className="w-full rounded-2xl border border-zinc-200 shadow-sm" />
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-6 py-4 border-y border-zinc-100 text-xs font-bold text-zinc-900">
                        <span className="flex items-center gap-1.5"><Heart className="w-4 h-4" /> {activeDetailPage.data.likes}</span>
                        <span className="flex items-center gap-1.5"><MessageCircle className="w-4 h-4" /> {activeDetailPage.data.commentsCount}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. 备忘录 App (10-200 chars, clickable) */}
            {activeApp === 'memo' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 bg-zinc-50 p-3 rounded-2xl border border-zinc-200 shadow-2xs">
                  <FileText className="w-4 h-4 text-zinc-900" />
                  <span className="text-xs font-bold text-zinc-900">备忘录清单</span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {phoneData.memos?.map((m) => (
                    <div 
                      key={m.id} 
                      onClick={() => setActiveDetailPage({ type: 'memo', data: m })}
                      className="p-4 rounded-2xl bg-white border border-zinc-200 space-y-2 shadow-2xs hover:border-black transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-900">{m.title}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">{m.time}</span>
                      </div>
                      <p className="text-xs text-zinc-600 line-clamp-2">{m.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. 浏览器 App (Clickable with netizen comments) */}
            {activeApp === 'browser' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 bg-zinc-50 p-3 rounded-2xl border border-zinc-200 shadow-2xs">
                  <Globe className="w-4 h-4 text-zinc-900" />
                  <span className="text-xs font-bold text-zinc-900">浏览器历史与网友评论</span>
                </div>
                <div className="space-y-3">
                  {phoneData.browser?.map((b) => (
                    <div 
                      key={b.id} 
                      onClick={() => setActiveDetailPage({ type: 'browser', data: b })}
                      className="p-4 rounded-2xl bg-white border border-zinc-200 space-y-2 shadow-2xs hover:border-black transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span className="truncate font-semibold text-zinc-900">{b.title}</span>
                        <span className="text-[10px] text-zinc-400 shrink-0 font-mono">{b.time}</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 truncate font-mono">{b.url}</div>
                      <p className="text-xs text-zinc-600 line-clamp-2">{b.snippet}</p>
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-100">
                        <span>网友评论: {b.comments?.length || 0} 条</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. 购物 App (Strictly Vertical Arrangement / 纵向排列) */}
            {activeApp === 'shopping' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 bg-zinc-50 p-3 rounded-2xl border border-zinc-200 shadow-2xs">
                  <ShoppingBag className="w-4 h-4 text-zinc-900" />
                  <span className="text-xs font-bold text-zinc-900">购物车与历史订单</span>
                </div>
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">购物车商品</h4>
                  <div className="space-y-2">
                    {phoneData.shopping?.cart?.map((item) => (
                      <div 
                        key={item.id} 
                        onClick={() => setActiveDetailPage({ type: 'shopping', data: item })}
                        className="p-3.5 rounded-2xl bg-white border border-zinc-200 flex items-center gap-3 shadow-2xs hover:border-zinc-900 transition-all cursor-pointer"
                      >
                        <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover bg-zinc-100 border border-zinc-200 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-zinc-900 truncate">{item.name}</div>
                          <div className="text-xs text-zinc-900 font-mono font-bold">¥{item.price.toFixed(2)} × {item.count}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">历史订单记录</h4>
                  <div className="space-y-2">
                    {phoneData.shopping?.orders?.map((ord) => (
                      <div 
                        key={ord.id} 
                        onClick={() => setActiveDetailPage({ type: 'shopping', data: ord })}
                        className="p-3.5 rounded-2xl bg-white border border-zinc-200 flex items-center justify-between text-xs shadow-2xs hover:border-zinc-900 transition-all cursor-pointer"
                      >
                        <div className="space-y-1">
                          <div className="font-bold text-zinc-900">{ord.name}</div>
                          <div className="text-[10px] text-zinc-400 font-mono">{ord.time}</div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="font-mono text-zinc-900 font-bold">¥{ord.price.toFixed(2)}</div>
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-800 border border-zinc-200 inline-block font-medium">{ord.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 6. 网易云 App (Strictly Vertical Arrangement / 纵向排列) */}
            {activeApp === 'cloudMusic' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 bg-zinc-50 p-3 rounded-2xl border border-zinc-200 shadow-2xs">
                  <Music className="w-4 h-4 text-zinc-900" />
                  <span className="text-xs font-bold text-zinc-900">网易云音乐隐私足迹</span>
                </div>
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">最近播放音乐</h4>
                  <div className="space-y-2">
                    {phoneData.cloudMusic?.recentlyPlayed?.map((s, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => setActiveDetailPage({ type: 'music', data: s })}
                        className="p-3.5 rounded-2xl bg-white border border-zinc-200 flex items-center justify-between text-xs shadow-2xs hover:border-zinc-900 transition-all cursor-pointer"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-zinc-900">{s.song}</div>
                          <div className="text-[10px] text-zinc-500">{s.artist} · {s.album}</div>
                        </div>
                        <Music className="w-4 h-4 text-zinc-900" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">网抑云歌曲评论区发言</h4>
                  <div className="space-y-2">
                    {phoneData.cloudMusic?.comments?.map((c, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => setActiveDetailPage({ type: 'music', data: c })}
                        className="p-3.5 rounded-2xl bg-white border border-zinc-200 space-y-1.5 text-xs shadow-2xs hover:border-zinc-900 transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between text-[10px] text-zinc-400">
                          <span className="font-medium text-zinc-700">单曲: {c.song}</span>
                          <span className="font-mono">{c.time}</span>
                        </div>
                        <p className="text-zinc-800 italic">"{c.content}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 7. 书架 App (Strictly Vertical Arrangement / 纵向排列) */}
            {activeApp === 'bookshelf' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 bg-zinc-50 p-3 rounded-2xl border border-zinc-200 shadow-2xs">
                  <Bookmark className="w-4 h-4 text-zinc-900" />
                  <span className="text-xs font-bold text-zinc-900">私密书架与阅读进度</span>
                </div>
                <div className="space-y-3">
                  {phoneData.bookshelf?.map((bk) => (
                    <div 
                      key={bk.id} 
                      onClick={() => setActiveDetailPage({ type: 'book', data: bk })}
                      className="p-4 rounded-2xl bg-white border border-zinc-200 flex items-center justify-between gap-4 shadow-2xs hover:border-zinc-900 transition-all cursor-pointer"
                    >
                      <div className="w-14 h-20 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-800 font-bold text-xs text-center p-1 shrink-0">
                        {bk.title.slice(0, 4)}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="text-xs font-bold text-zinc-900 truncate">{bk.title}</div>
                        <div className="text-[10px] text-zinc-500">作者：{bk.author}</div>
                        <div className="text-[10px] text-zinc-400">当前阅读至：{bk.lastChapter}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono font-bold text-zinc-900">{bk.progress}%</span>
                        <div className="text-[10px] text-zinc-400">已读进度</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 8. 视频 App (Strictly Vertical Arrangement / 纵向排列) */}
            {activeApp === 'video' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 bg-zinc-50 p-3 rounded-2xl border border-zinc-200 shadow-2xs">
                  <Video className="w-4 h-4 text-zinc-900" />
                  <span className="text-xs font-bold text-zinc-900">视频观看足迹</span>
                </div>
                <div className="space-y-3">
                  {phoneData.video?.map((v) => (
                    <div 
                      key={v.id} 
                      onClick={() => setActiveDetailPage({ type: 'video', data: v })}
                      className="p-3.5 rounded-2xl bg-white border border-zinc-200 flex items-center gap-3.5 shadow-2xs hover:border-zinc-900 transition-all cursor-pointer"
                    >
                      <div className="relative w-28 h-20 bg-zinc-100 rounded-xl overflow-hidden shrink-0 border border-zinc-200">
                        <img src={v.cover} alt={v.title} className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 text-[9px] rounded text-white font-mono">{v.duration}</span>
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <h4 className="text-xs font-bold text-zinc-900 line-clamp-2">{v.title}</h4>
                        <div className="flex items-center justify-between text-[10px] text-zinc-400">
                          <span>UP: {v.uploader}</span>
                          <span>播放量 {v.views}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 9. 相册 App (Combined photo detailed description & current inner thoughts) */}
            {activeApp === 'gallery' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 bg-zinc-50 p-3 rounded-2xl border border-zinc-200 shadow-2xs">
                  <ImageIcon className="w-4 h-4 text-zinc-900" />
                  <span className="text-xs font-bold text-zinc-900">私密相册</span>
                </div>
                <div className="space-y-4">
                  {phoneData.gallery?.map((g) => (
                    <div 
                      key={g.id} 
                      onClick={() => setActiveDetailPage({ type: 'gallery', data: g })}
                      className="rounded-2xl bg-white border border-zinc-200 overflow-hidden shadow-2xs space-y-3 p-4 hover:border-zinc-900 transition-all cursor-pointer"
                    >
                      <div className="h-56 bg-zinc-100 rounded-xl overflow-hidden border border-zinc-200">
                        <img src={g.url} alt="photo" className="w-full h-full object-cover" />
                      </div>
                      <div className="space-y-2.5">
                        <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
                          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">📷 照片详细内容</div>
                          <p className="text-xs text-zinc-800 leading-relaxed line-clamp-2">{g.detailedDescription}</p>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1">
                          <span className="font-mono">{g.time}</span>
                          <span className="flex items-center gap-1 text-zinc-900 font-medium">
                            <Heart className="w-3.5 h-3.5 fill-current text-black" /> {g.likes} 赞
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 10. 钱包 App */}
            {activeApp === 'wallet' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 bg-zinc-50 p-3 rounded-2xl border border-zinc-200 shadow-2xs">
                  <WalletIcon className="w-4 h-4 text-zinc-900" />
                  <span className="text-xs font-bold text-zinc-900">零钱与银行卡账单</span>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-zinc-200 text-center space-y-2 shadow-2xs">
                  <span className="text-xs text-zinc-400 font-medium">零钱余额 (CNY)</span>
                  <div className="text-3xl font-black text-zinc-900 font-mono">¥{phoneData.wallet?.balance?.toFixed(2) || '0.00'}</div>
                  <span className="text-[10px] text-zinc-800 bg-zinc-100 px-3 py-1 rounded-full inline-block border border-zinc-200 font-medium">已实名认证 · 资金安全保障中</span>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">最近流水记录</h4>
                  <div className="space-y-2">
                    {phoneData.wallet?.transactions?.map((tx) => (
                      <div 
                        key={tx.id} 
                        onClick={() => setActiveDetailPage({ type: 'wallet', data: tx })}
                        className="p-3.5 rounded-2xl bg-white border border-zinc-200 flex items-center justify-between text-xs shadow-2xs hover:border-zinc-900 transition-all cursor-pointer"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-zinc-900">{tx.title}</div>
                          <div className="text-[10px] text-zinc-400 font-mono">{tx.time} · {tx.method}</div>
                        </div>
                        <div className="font-mono font-bold text-zinc-900">
                          {tx.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 11. 社交 App (Profile ID name, ID number, bio, real posts) */}
            {activeApp === 'social' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 bg-zinc-50 p-3 rounded-2xl border border-zinc-200 shadow-2xs">
                  <Users className="w-4 h-4 text-zinc-900" />
                  <span className="text-xs font-bold text-zinc-900">微博 / 社交动态广场</span>
                </div>

                {/* Profile Card */}
                {phoneData.social?.profile && (
                  <div className="p-5 rounded-2xl bg-white border border-zinc-200 space-y-3 shadow-2xs">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-100 border border-zinc-300 flex items-center justify-center text-xl shadow-2xs overflow-hidden">
                        {selectedContact.avatar.startsWith('http') || selectedContact.avatar.startsWith('data:') ? (
                          <img src={selectedContact.avatar} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          selectedContact.avatar
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <h3 className="text-sm font-bold text-zinc-900">{phoneData.social.profile.idName || selectedContact.remark || selectedContact.name}</h3>
                        <div className="text-[10px] text-zinc-400 font-mono">ID号: {phoneData.social.profile.idNumber || '88392019'}</div>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-700 bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                      {phoneData.social.profile.bio}
                    </p>
                  </div>
                )}

                {/* Posts List */}
                <div className="space-y-3">
                  {phoneData.social?.posts?.map((s) => (
                    <div 
                      key={s.id} 
                      onClick={() => setActiveDetailPage({ type: 'social', data: s })}
                      className="p-4 rounded-2xl bg-white border border-zinc-200 space-y-3 shadow-2xs hover:border-zinc-900 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-zinc-100 border border-zinc-300 flex items-center justify-center text-base overflow-hidden">
                          {selectedContact.avatar.startsWith('http') || selectedContact.avatar.startsWith('data:') ? (
                            <img src={selectedContact.avatar} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            selectedContact.avatar
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-zinc-900">{phoneData.social?.profile?.idName || selectedContact.remark || selectedContact.name}</div>
                          <div className="text-[10px] text-zinc-400 font-mono">{s.time}</div>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-800 leading-relaxed line-clamp-3">{s.content}</p>
                      {s.images && s.images.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {s.images.map((img, idx) => (
                            <img key={idx} src={img} alt="post" className="w-full h-32 object-cover rounded-xl bg-zinc-100 border border-zinc-200" />
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-6 pt-2 border-t border-zinc-100 text-xs text-zinc-500 font-medium">
                        <div className="flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5" />
                          <span>{s.likes}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{s.commentsCount}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};
