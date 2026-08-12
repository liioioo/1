import React, { useState, useEffect, useRef } from 'react';
import { TopToast } from '../TopToast';
import { 
  MessageSquare, 
  Users, 
  Compass, 
  User, 
  Search, 
  Plus, 
  ChevronLeft, 
  Send, 
  Image as ImageIcon, 
  Smile, 
  Mic, 
  Sparkles, 
  RotateCcw, 
  Wallet, 
  Settings, 
  Upload, 
  Volume2, 
  X, 
  CheckCircle2, 
  RefreshCw,
  Globe,
  MapPin,
  Camera,
  Calendar,
  FileText,
  UserPlus,
  UsersRound,
  Trash2,
  Lock,
  BarChart2,
  Check,
  Paintbrush,
  Eraser,
  Type,
  Bookmark,
  Heart,
  MessageCircle,
  CreditCard,
  History,
  PlusCircle,
  Camera as CameraIcon,
  Layers,
  ChevronRight,
  MoreHorizontal,
  Share2,
  KeyRound
} from 'lucide-react';
import { 
  ChatMessage, 
  WeChatContact, 
  CustomSticker, 
  WorldBookItem, 
  MomentPost, 
  MomentComment, 
  FavoriteItem, 
  WalletTransaction, 
  UserPersona,
  BankCard 
} from '../../types';
import { INITIAL_WORLD_BOOKS } from '../../data';
import { soundManager } from '../../utils/audio';
import { triggerSystemPopup } from '../../utils/settings';
import { getBuiltinPromptById } from '../../constants/builtinPrompts';

import { FavoritesPage } from './wechat/FavoritesPage';
import { UserPersonasPage } from './wechat/UserPersonasPage';
import { AddFriendPage } from './wechat/AddFriendPage';
import { CreateGroupPage } from './wechat/CreateGroupPage';
import { ChatSettingsPage } from './wechat/ChatSettingsPage';
import { OfflineModePage } from './wechat/OfflineModePage';
import { OfflineDetailsPage } from './wechat/OfflineDetailsPage';
import { WalletPage } from './wechat/WalletPage';
import { VoiceEditModal } from './wechat/VoiceEditModal';
import { ApiManagementSection } from '../ApiManagementSection';


export const WeChatApp: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  // Navigation Tabs: 微信 (chats) | 通讯录 (contacts) | 动态 (moments/discover) | 我 (me)
  const [activeTab, setActiveTab] = useState<'chats' | 'contacts' | 'moments' | 'me'>('chats');
  
  // Contacts and Group Chats state
  const [contacts, setContacts] = useState<WeChatContact[]>(() => {
    const saved = localStorage.getItem('wechat_contacts');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [];
  });
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [transcribedMessageIds, setTranscribedMessageIds] = useState<string[]>([]);

  // User Profile State (Nickname, Avatar, ID)
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('wechat_user_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      name: '默认用户',
      avatar: '🧑‍💻',
      accountId: 'wxid_user_persona',
    };
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const getEffectiveUserIdentity = (contact?: WeChatContact | null) => {
    if (contact?.userName) {
      return { 
        name: contact.userName, 
        avatar: contact.userAvatar || userProfile.avatar 
      };
    }
    return { name: userProfile.name, avatar: userProfile.avatar };
  };

  // Global World Book Items
  const [worldBooks, setWorldBooks] = useState<WorldBookItem[]>(() => {
    const saved = localStorage.getItem('world_books');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return INITIAL_WORLD_BOOKS.map((item, idx) => ({
      ...item,
      isGlobal: idx === 0,
    }));
  });

  // User Personas Gallery State
  const [userPersonas, setUserPersonas] = useState<UserPersona[]>(() => {
    const saved = localStorage.getItem('user_personas');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      {
        id: 'up-1',
        name: '许知',
        avatar: '👨‍🎓',
        prompt: '一个对世界充满好奇、热爱思考的青年学者。',
        isSelected: true,
      },
    ];
  });

  // Moments (动态) State
  const [momentsCover, setMomentsCover] = useState<string>(() => {
    return localStorage.getItem('moments_cover') || 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=400&fit=crop';
  });
  const [moments, setMoments] = useState<MomentPost[]>(() => {
    const saved = localStorage.getItem('wechat_moments');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [];
  });
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState<string | null>(null);
  const [replyingToPostId, setReplyingToPostId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [isGeneratingComments, setIsGeneratingComments] = useState<string | null>(null);

  // Wallet State
  const [walletBalance, setWalletBalance] = useState<number>(() => {
    const saved = localStorage.getItem('wallet_balance');
    return saved ? parseFloat(saved) : 888.0;
  });
  const [bankCards, setBankCards] = useState<BankCard[]>(() => {
    const saved = localStorage.getItem('wechat_bank_cards');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return []; // Bank cards start empty as requested
  });
  const [paymentPin, setPaymentPin] = useState<string>(() => {
    return localStorage.getItem('payment_pin') || '123456';
  });
  const [transactions, setTransactions] = useState<WalletTransaction[]>(() => {
    const saved = localStorage.getItem('wallet_txs');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      { id: 'tx-1', title: '初始体验赠送', amount: '+888.00', type: 'income', time: '今天 09:00', method: '微信系统零钱' },
    ];
  });

  // Sub-View Pages Navigation State
  const [subView, setSubView] = useState<null | 'add_friend' | 'create_group' | 'chat_settings' | 'offline_mode' | 'wallet' | 'api_settings' | 'favorites' | 'personas' | 'offline_page'>(null);
  const [selectedOfflineMessage, setSelectedOfflineMessage] = useState<ChatMessage | null>(null);
  const [showVoiceEditModal, setShowVoiceEditModal] = useState(false);

  // Favorites (收藏) State
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => {
    const saved = localStorage.getItem('wechat_favorites');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [];
  });

  // Active Chat Message State
  const [inputContent, setInputContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Modals & Panels
  const [showLeftMenu, setShowLeftMenu] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [showInmostThoughtModal, setShowInmostThoughtModal] = useState(false);

  // Transfer Form State
  const [transferAmount, setTransferAmount] = useState('520.00');
  const [transferRemark, setTransferRemark] = useState('给你发个零花钱');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'balance' | string>('balance');

  // Location Form State
  const [locationTitle, setLocationTitle] = useState('五角场万达广场');
  const [locationAddress, setLocationAddress] = useState('上海市杨浦区邯郸路600号');
  const [locationDistance, setLocationDistance] = useState('1.2km');

  // Offline Hangout Form State
  const [offlineTitle, setOfflineTitle] = useState('周末精酿咖啡线下聚会');
  const [offlineTime, setOfflineTime] = useState('本周六 15:30');
  const [offlineVenue, setOfflineVenue] = useState('Manner Coffee (静安寺店)');

  // Add Contact Form State
  const [importNotice, setImportNotice] = useState<string | null>(null);

  // User Persona Modal State

  // Me Sub-Tabs State

  // Custom Stickers
  const [customStickers, setCustomStickers] = useState<CustomSticker[]>([
    { id: 's1', name: '偷笑', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop', group: '系统' },
    { id: 's2', name: '摸摸头', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop', group: '系统' },
    { id: 's3', name: '吃瓜', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop', group: '系统' },
    { id: 's4', name: '开心', url: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=100&h=100&fit=crop', group: '自定义' },
  ]);
  const [activeStickerGroup, setActiveStickerGroup] = useState<string>('系统');
  const [newStickerName, setNewStickerName] = useState('');
  const [newStickerUrl, setNewStickerUrl] = useState('');

  // Camera Canvas Ref & Tools
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(4);
  const [canvasText, setCanvasText] = useState('');

  // Models list
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeContact = contacts.find((c) => c.id === activeContactId) || null;

  // LocalStorage persistence
  useEffect(() => {
    localStorage.setItem('wechat_user_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('world_books', JSON.stringify(worldBooks));
  }, [worldBooks]);

  useEffect(() => {
    localStorage.setItem('wechat_personas', JSON.stringify(userPersonas));
  }, [userPersonas]);

  useEffect(() => {
    localStorage.setItem('wechat_moments', JSON.stringify(moments));
  }, [moments]);

  useEffect(() => {
    localStorage.setItem('moments_cover', momentsCover);
  }, [momentsCover]);

  useEffect(() => {
    localStorage.setItem('wallet_balance', walletBalance.toString());
  }, [walletBalance]);

  useEffect(() => {
    localStorage.setItem('wechat_bank_cards', JSON.stringify(bankCards));
  }, [bankCards]);

  useEffect(() => {
    localStorage.setItem('payment_pin', paymentPin);
  }, [paymentPin]);

  useEffect(() => {
    localStorage.setItem('wallet_txs', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('wechat_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeContact?.messages, isGenerating]);

  // File Import for Persona Prompts (txt / docx)
  const handleImportPersonaFile = (file: File, targetSetter: (text: string) => void) => {
    if (!file) return;

    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        targetSetter(text);
        setImportNotice('已导入');
        soundManager.playTap();
      };
      reader.readAsText(file, 'utf-8');
    } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const decoder = new TextDecoder('utf-8');
        const content = decoder.decode(arrayBuffer);

        const matches = content.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
        let extractedText = '';
        if (matches && matches.length > 0) {
          extractedText = matches.map((m) => m.replace(/<[^>]+>/g, '')).join(' ');
        } else {
          extractedText = content.replace(/[\x00-\x09\x0B-\x1F\x7F-\x9F]/g, '');
        }

        if (extractedText.trim().length > 0) {
          targetSetter(extractedText.trim());
          setImportNotice('已导入');
          soundManager.playTap();
        } else {
          setImportNotice('读取失败，尝试纯文本读取');
          const txtReader = new FileReader();
          txtReader.onload = (te) => targetSetter(te.target?.result as string || '');
          txtReader.readAsText(file);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setImportNotice('请选择 .txt 或 .docx 格式');
    }

    setTimeout(() => setImportNotice(null), 2000);
  };

  // Create Contact or Group

  // Delete active contact
  const handleDeleteContact = (contactId: string) => {
    soundManager.playTap();
    setContacts((prev) => prev.filter((c) => c.id !== contactId));
    if (activeContactId === contactId) {
      setActiveContactId(null);
      setSubView(null);
    }
  };

  // User sends text message in active chat
  const handleSendUserMessage = () => {
    if (!inputContent.trim() || !activeContact) return;
    soundManager.playTap();
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const userIdentity = getEffectiveUserIdentity(activeContact);

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: userIdentity.name,
      avatar: userIdentity.avatar,
      content: inputContent.trim(),
      time: timeStr,
      isMe: true,
      type: 'text',
    };

    setContacts((prev) =>
      prev.map((c) => {
        if (c.id === activeContact.id) {
          return {
            ...c,
            messages: [...c.messages, newMsg],
            lastMessage: newMsg.content,
            lastTime: timeStr,
          };
        }
        return c;
      })
    );

    setInputContent('');
  };

  // Calculate Tokens for current Chat
  const handleUpdateTransferStatus = (msgId: string, status: 'collected' | 'returned') => {
    soundManager.playTap();
    setContacts((prev) =>
      prev.map((c) => {
        if (c.id === activeContact?.id) {
          return {
            ...c,
            messages: c.messages.map((m) =>
              m.id === msgId ? { ...m, transferStatus: status } : m
            ),
          };
        }
        return c;
      })
    );
  };

  const calculateTokenStats = () => {
    if (!activeContact) return { total: 0, char: 0, user: 0, wb: 0, history: 0 };

    const builtinText = getBuiltinPromptById(
      activeContact.builtinPromptPreset,
      activeContact.customBuiltinPromptTitle,
      activeContact.customBuiltinPromptContent
    );
    const charChars = ((activeContact.systemPrompt || '') + (builtinText ? '\n' + builtinText : '')).length;
    const userChars = (activeContact.userPrompt || userProfile.name).length;

    const posWeight: Record<string, number> = { front: 1, middle: 2, back: 3 };
    const boundWbText = worldBooks
      .filter((wb) => wb.isGlobal || activeContact.boundWorldBookIds?.includes(wb.id))
      .sort((a, b) => (posWeight[a.position || 'middle'] || 2) - (posWeight[b.position || 'middle'] || 2))
      .map((wb) => `${wb.title}: ${wb.description}`)
      .join('\n');
    const wbChars = boundWbText.length;

    const historyText = activeContact.messages.map((m) => `${m.sender}: ${m.content}`).join('\n');
    const historyChars = historyText.length;

    const totalChars = charChars + userChars + wbChars + historyChars;

    return {
      total: Math.ceil(totalChars / 2),
      char: Math.ceil(charChars / 2),
      user: Math.ceil(userChars / 2),
      wb: Math.ceil(wbChars / 2),
      history: Math.ceil(historyChars / 2),
    };
  };

  // Trigger AI Generate Reply
  const handleGenerateReply = async () => {
    if (isGenerating || !activeContact) return;
    soundManager.playTap();
    setIsGenerating(true);

    const userIdentity = getEffectiveUserIdentity(activeContact);

    try {
      const posWeight: Record<string, number> = { front: 1, middle: 2, back: 3 };
      const boundWbText = worldBooks
        .filter((wb) => wb.isGlobal || activeContact.boundWorldBookIds?.includes(wb.id))
        .sort((a, b) => (posWeight[a.position || 'middle'] || 2) - (posWeight[b.position || 'middle'] || 2))
        .map((wb) => `【设定: ${wb.title}】(${wb.category || '通用'} - 位置:${wb.position === 'front' ? '前' : wb.position === 'back' ? '后' : '中'})\n${wb.description}`)
        .join('\n\n');

      const memoryRounds = activeContact.memoryRounds || 10;
      const historyToUse = activeContact.messages.slice(-memoryRounds);

      let activeApiConfig = null;
      try {
        const savedApi = localStorage.getItem('active_api_config');
        if (savedApi) {
          activeApiConfig = JSON.parse(savedApi);
        }
      } catch {}

      const builtinText = getBuiltinPromptById(
        activeContact.builtinPromptPreset,
        activeContact.customBuiltinPromptTitle,
        activeContact.customBuiltinPromptContent
      );

      const res = await fetch('https://one-ah64.onrender.com/api/chat', {

        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyToUse.map((m) => ({
            sender: m.isMe ? userIdentity.name : activeContact.name,
            content: m.content,
          })),
          systemPrompt: activeContact.systemPrompt || '',
          builtinPrompt: builtinText || '',
          userPrompt: activeContact.userPrompt || '',
          worldBookContext: boundWbText,
          modelName: activeApiConfig?.modelName || activeContact.modelName,
          partnerName: activeContact.name,
          apiConfig: activeApiConfig ? {
            ...activeApiConfig,
            temperature: activeContact.temperature ?? activeApiConfig.temperature
          } : undefined,
          temperature: activeContact.temperature,
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.replies)) {
        const replies = data.replies;
        const newAiMessages: ChatMessage[] = [];

        for (let i = 0; i < replies.length; i++) {
          const r = replies[i];
          if (!r.content && r.type === 'text') continue;
          const now = new Date();
          const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

          const aiMsg: ChatMessage = {
            id: `ai-${Date.now()}-${i}`,
            sender: activeContact.name,
            avatar: activeContact.avatar,
            content: r.content || '...',
            time: timeStr,
            isMe: false,
            type: r.type || 'text',
            duration: r.duration || 4,
            originalText: r.original,
          };
          newAiMessages.push(aiMsg);
        }

        for (let i = 0; i < newAiMessages.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 600));
          const aiMsg = newAiMessages[i];

          soundManager.playTap();
          triggerSystemPopup(`微信 · ${activeContact.name}`, aiMsg.content, activeContact.avatar);
          setContacts((prev) =>
            prev.map((c) => {
              if (c.id === activeContact.id) {
                return {
                  ...c,
                  messages: [...c.messages, aiMsg],
                  lastMessage: aiMsg.content,
                  lastTime: aiMsg.time,
                  ...(data.charStatus ? { status: data.charStatus } : {}),
                  ...(data.charInmostThought ? { inmostThought: data.charInmostThought } : {}),
                };
              }
              return c;
            })
          );
        }

        // If no message objects had content but status or thought was returned
        if (newAiMessages.length === 0 && (data.charStatus || data.charInmostThought)) {
          setContacts((prev) =>
            prev.map((c) => {
              if (c.id === activeContact.id) {
                return {
                  ...c,
                  ...(data.charStatus ? { status: data.charStatus } : {}),
                  ...(data.charInmostThought ? { inmostThought: data.charInmostThought } : {}),
                };
              }
              return c;
            })
          );
        }
      } else {
        // Display error message in chat if AI generation fails
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const errorMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          sender: '系统通知',
          avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
          content: `[AI 回复异常]: ${data.error || '请求 API 失败'}。请在【设置 - API管理】中核对 API Key、Base URL 与 Model Name 配置。`,
          time: timeStr,
          isMe: false,
          type: 'text',
        };
        setContacts((prev) =>
          prev.map((c) => (c.id === activeContact.id ? { ...c, messages: [...c.messages, errorMsg] } : c))
        );
      }
    } catch (err: any) {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const networkErrorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: '系统通知',
        avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
        content: `[网络请求失败]: ${err.message || '无法连接后端服务器'}。请检查 API 配置。`,
        time: timeStr,
        isMe: false,
        type: 'text',
      };
      setContacts((prev) =>
        prev.map((c) => (c.id === activeContact.id ? { ...c, messages: [...c.messages, networkErrorMsg] } : c))
      );
    } finally {
      setIsGenerating(false);
    }
  };


  // Favorite a chat message
  const handleFavoriteMessage = (msg: ChatMessage) => {
    soundManager.playTap();
    const newFav: FavoriteItem = {
      id: `fav-${Date.now()}`,
      sender: msg.sender,
      avatar: msg.avatar || '💬',
      content: msg.content,
      time: msg.time,
      chatName: activeContact?.name || '微信聊天',
      type: msg.type,
      mediaUrl: msg.mediaUrl,
      savedAt: new Date().toLocaleDateString(),
    };
    setFavorites((prev) => [newFav, ...prev]);
    setImportNotice('已收藏');
    setTimeout(() => setImportNotice(null), 2000);
  };

  // Send Money Transfer (deduct from wallet)
  const handleSendTransfer = () => {
    if (!transferAmount.trim() || !activeContact) return;
    const amountNum = parseFloat(transferAmount);

    if (selectedPaymentMethod === 'balance') {
      if (walletBalance < amountNum) {
        alert('零钱余额不足，请先充值或切换银行卡！');
        return;
      }
      setWalletBalance((prev) => prev - amountNum);
    }

    soundManager.playTap();
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Add transaction history
    const newTx: WalletTransaction = {
      id: `tx-${Date.now()}`,
      title: `转账给 ${activeContact.name}`,
      amount: `-${amountNum.toFixed(2)}`,
      type: 'expense',
      time: '刚刚',
      method: selectedPaymentMethod === 'balance' ? '零钱' : selectedPaymentMethod,
    };
    setTransactions((prev) => [newTx, ...prev]);

    const userIdentity = getEffectiveUserIdentity(activeContact);

    const transferMsg: ChatMessage = {
      id: `tf-${Date.now()}`,
      sender: userIdentity.name,
      avatar: userIdentity.avatar,
      content: transferRemark || '微信转账',
      time: timeStr,
      isMe: true,
      type: 'transfer',
      transferAmount: `¥${amountNum.toFixed(2)}`,
    };

    setContacts((prev) =>
      prev.map((c) => (c.id === activeContact.id ? { ...c, messages: [...c.messages, transferMsg] } : c))
    );
    setShowTransferModal(false);
    setShowLeftMenu(false);
  };

  // Recharge Wallet Balance

  // Post a new Moment
  const handlePostMoment = () => {
    if (!postContent.trim() && !postImage) return;
    soundManager.playTap();

    const newPost: MomentPost = {
      id: `moment-${Date.now()}`,
      author: userProfile.name,
      avatar: userProfile.avatar,
      time: '刚刚',
      content: postContent.trim(),
      images: postImage ? [postImage] : undefined,
      likes: [],
      comments: [],
    };

    setMoments((prev) => [newPost, ...prev]);
    setShowNewPostModal(false);
    setPostContent('');
    setPostImage(null);
  };

  // Generate NPC / Contact Comments & Likes for a Moment
  const handleGenerateMomentInteractions = async (postId: string) => {
    soundManager.playTap();
    setIsGeneratingComments(postId);

    const post = moments.find((m) => m.id === postId);
    if (!post) {
      setIsGeneratingComments(null);
      return;
    }

    // Pick random existing contact or create realistic NPC
    const possibleNames = contacts.map((c) => ({ name: c.name, avatar: c.avatar }));
    if (possibleNames.length === 0) {
      possibleNames.push(
        { name: '小林', avatar: '👧' },
        { name: '阿强', avatar: '👦' },
        { name: '莉莉', avatar: '👩' },
        { name: '班长', avatar: '👓' }
      );
    }

    try {
      const res = await fetch('https://one-ah64.onrender.com/api/chat', {

        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ sender: '用户动态', content: post.content || '发了一张图片' }],
          systemPrompt: `你是一个热闹的朋友圈NPC互动生成器。请根据用户的动态内容《${post.content}》，以不同朋友的口吻给出【1-3条】简短真诚的互动评论，以及喜欢这篇动态的人的名字。
必须输出 JSON 格式:
{
  "likes": ["名字1", "名字2"],
  "comments": [
    {"author": "名字", "avatar": "👧", "content": "评论内容严格10字以内"}
  ]
}`,
          partnerName: '朋友圈助理',
        }),
      });

      const data = await res.json();
      let generatedLikes: string[] = [possibleNames[0].name];
      let generatedComments: MomentComment[] = [
        {
          id: `mc-${Date.now()}-1`,
          author: possibleNames[0].name,
          avatar: possibleNames[0].avatar,
          content: '哈哈，太赞了！具体是哪里呀？',
          time: '刚刚',
        },
      ];

      if (data.success && Array.isArray(data.replies) && data.replies.length > 0) {
        try {
          const rawObj = JSON.parse(data.replies[0]?.content || '{}');
          if (Array.isArray(rawObj.likes)) generatedLikes = rawObj.likes;
          if (Array.isArray(rawObj.comments)) {
            generatedComments = rawObj.comments.map((c: any, i: number) => ({
              id: `mc-${Date.now()}-${i}`,
              author: c.author || possibleNames[i % possibleNames.length].name,
              avatar: c.avatar || possibleNames[i % possibleNames.length].avatar,
              content: c.content || '好酷啊！',
              time: '刚刚',
            }));
          }
        } catch {
          // fallback
        }
      }

      setMoments((prev) =>
        prev.map((m) => {
          if (m.id === postId) {
            const newLikes = Array.from(new Set([...m.likes, ...generatedLikes]));
            return {
              ...m,
              likes: newLikes,
              comments: [...m.comments, ...generatedComments],
            };
          }
          return m;
        })
      );
    } catch {
      // fallback manual add
      setMoments((prev) =>
        prev.map((m) => {
          if (m.id === postId) {
            return {
              ...m,
              likes: Array.from(new Set([...m.likes, possibleNames[0].name])),
              comments: [
                ...m.comments,
                {
                  id: `mc-${Date.now()}`,
                  author: possibleNames[0].name,
                  avatar: possibleNames[0].avatar,
                  content: '为你点赞！太有趣了',
                  time: '刚刚',
                },
              ],
            };
          }
          return m;
        })
      );
    } finally {
      setIsGeneratingComments(null);
    }
  };

  // Like a moment
  const handleToggleLikeMoment = (postId: string) => {
    soundManager.playTap();
    setMoments((prev) =>
      prev.map((m) => {
        if (m.id === postId) {
          const hasLiked = m.likes.includes(userProfile.name);
          const newLikes = hasLiked
            ? m.likes.filter((name) => name !== userProfile.name)
            : [...m.likes, userProfile.name];
          return { ...m, likes: newLikes };
        }
        return m;
      })
    );
  };

  // Add Comment to Moment
  const handleAddComment = (postId: string) => {
    if (!commentInput.trim()) return;
    soundManager.playTap();
    const newComment: MomentComment = {
      id: `mc-${Date.now()}`,
      author: userProfile.name,
      avatar: userProfile.avatar,
      content: commentInput.trim(),
      time: '刚刚',
    };

    setMoments((prev) =>
      prev.map((m) => {
        if (m.id === postId) {
          return { ...m, comments: [...m.comments, newComment] };
        }
        return m;
      })
    );

    setCommentInput('');
    setReplyingToPostId(null);
  };

  // Delete Moment
  const handleDeleteMoment = (postId: string) => {
    soundManager.playTap();
    setMoments((prev) => prev.filter((m) => m.id !== postId));
  };

  // Handle User Persona Form Save

  // Delete Persona
  const handleDeleteUserPersona = (id: string) => {
    if (userPersonas.length <= 1) return;
    soundManager.playTap();
    setUserPersonas((prev) => prev.filter((p) => p.id !== id));
  };

  // Sticker Import
  const handleImportSticker = () => {
    if (!newStickerName.trim() || !newStickerUrl.trim()) return;
    soundManager.playTap();
    setCustomStickers((prev) => [
      ...prev,
      { id: `s-${Date.now()}`, name: newStickerName.trim(), url: newStickerUrl.trim(), group: '自定义' },
    ]);
    setNewStickerName('');
    setNewStickerUrl('');
    setActiveStickerGroup('自定义');
  };

  // WorldBook Binding Toggle
  const handleToggleWorldBookBinding = (wbId: string) => {
    if (!activeContact) return;
    soundManager.playTap();
    setContacts((prev) =>
      prev.map((c) => {
        if (c.id === activeContact.id) {
          const currentBound = c.boundWorldBookIds || [];
          const isBound = currentBound.includes(wbId);
          const nextBound = isBound ? currentBound.filter((id) => id !== wbId) : [...currentBound, wbId];
          return { ...c, boundWorldBookIds: nextBound };
        }
        return c;
      })
    );
  };

  // Select Chat Wallpaper
  const handleSelectWallpaper = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeContact) return;
    soundManager.playTap();
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      if (url) {
        setContacts((prev) =>
          prev.map((c) => (c.id === activeContact.id ? { ...c, wallpaper: url } : c))
        );
      }
    };
    reader.readAsDataURL(file);
  };

  // Clear Wallpaper
  const handleClearWallpaper = () => {
    if (!activeContact) return;
    soundManager.playTap();
    setContacts((prev) =>
      prev.map((c) => (c.id === activeContact.id ? { ...c, wallpaper: undefined } : c))
    );
  };

  // Send Location Message
  const handleSendLocation = () => {
    if (!activeContact || !locationTitle.trim()) return;
    soundManager.playTap();
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const userIdentity = getEffectiveUserIdentity(activeContact);

    const newMsg: ChatMessage = {
      id: `loc-${Date.now()}`,
      sender: userIdentity.name,
      avatar: userIdentity.avatar,
      content: `📍 ${locationTitle}\n${locationAddress}`,
      time: timeStr,
      isMe: true,
      type: 'location',
      locationTitle,
      locationAddress,
      locationDistance,
    };
    setContacts((prev) =>
      prev.map((c) =>
        c.id === activeContact.id
          ? { ...c, messages: [...c.messages, newMsg], lastMessage: '[位置消息]', lastTime: timeStr }
          : c
      )
    );
    setShowLocationModal(false);
    setShowLeftMenu(false);
  };

  // Send Offline Invitation
  const handleSendOfflineInvite = () => {
    if (!activeContact) return;
    soundManager.playTap();
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const userIdentity = getEffectiveUserIdentity(activeContact);

    const newMsg: ChatMessage = {
      id: `off-${Date.now()}`,
      sender: userIdentity.name,
      avatar: userIdentity.avatar,
      content: `一起约会吧~`,
      time: timeStr,
      isMe: true,
      type: 'offline',
      offlineTitle: '一起约会吧~',
      offlineTime: '今天 就在现在',
      offlineVenue: '某个心动的地方',
    };
    setContacts((prev) =>
      prev.map((c) =>
        c.id === activeContact.id
          ? { ...c, messages: [...c.messages, newMsg], lastMessage: '[线下邀约]', lastTime: timeStr }
          : c
      )
    );
    setShowOfflineModal(false);
    setShowLeftMenu(false);
  };

  // Camera / Canvas Painting Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSendCameraPhoto = () => {
    const canvas = canvasRef.current;
    if (!canvas || !activeContact) return;
    soundManager.playTap();

    const ctx = canvas.getContext('2d');
    if (ctx && canvasText.trim()) {
      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(canvasText, 10, canvas.height - 20);
      ctx.fillText(canvasText, 10, canvas.height - 20);
    }

    const dataUrl = canvas.toDataURL('image/png');
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const userIdentity = getEffectiveUserIdentity(activeContact);

    const newMsg: ChatMessage = {
      id: `cam-${Date.now()}`,
      sender: userIdentity.name,
      avatar: userIdentity.avatar,
      content: dataUrl,
      time: timeStr,
      isMe: true,
      type: 'image',
    };
    setContacts((prev) =>
      prev.map((c) =>
        c.id === activeContact.id
          ? { ...c, messages: [...c.messages, newMsg], lastMessage: '[图片]', lastTime: timeStr }
          : c
      )
    );
    setShowCameraModal(false);
    setShowLeftMenu(false);
    setCanvasText('');
    clearCanvas();
  };

  // Sort Contacts Alphabetically A-Z
  const getSortedContacts = () => {
    return [...contacts].sort((a, b) => {
      const nameA = a.remark || a.name;
      const nameB = b.remark || b.name;
      return nameA.localeCompare(nameB, 'zh-Hans-CN-u-co-pinyin');
    });
  };

  // Sort Chats by latest message / timestamp
  const getSortedChats = () => {
    return [...contacts].sort((a, b) => {
      const timeA = a.messages[a.messages.length - 1]?.id || a.id;
      const timeB = b.messages[b.messages.length - 1]?.id || b.id;
      return timeB.localeCompare(timeA);
    });
  };

  const tokenStats = calculateTokenStats();

  if (subView === 'add_friend') {
    return (
      <AddFriendPage
        onBack={() => setSubView(null)}
        onAddContact={(newContact) => {
          setContacts((prev) => [newContact, ...prev]);
          setActiveContactId(newContact.id);
          setSubView(null);
        }}
        onFileUpload={(file, targetSetter) => handleImportPersonaFile(file, targetSetter)}
        userDefaultPrompt={userProfile.name}
        userPersonas={userPersonas}
        userProfile={userProfile}
      />
    );
  }

  if (subView === 'create_group') {
    return (
      <CreateGroupPage
        existingContacts={contacts.filter((c) => !c.isGroup)}
        onBack={() => setSubView(null)}
        onCreateGroup={(newGroup) => {
          setContacts((prev) => [newGroup, ...prev]);
          setActiveContactId(newGroup.id);
          setSubView(null);
        }}
      />
    );
  }

  if (subView === 'chat_settings' && activeContact) {
    return (
      <ChatSettingsPage
        contact={activeContact}
        worldBooks={worldBooks}
        userPersonas={userPersonas}
        onBack={() => setSubView(null)}
        onUpdateContact={(updated) => {
          setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        }}
        onDeleteContact={(id) => {
          handleDeleteContact(id);
          setSubView(null);
        }}
        onFileUpload={(file, targetSetter) => handleImportPersonaFile(file, targetSetter)}
      />
    );
  }

  if (subView === 'offline_mode' && activeContact) {
    return (
      <OfflineModePage
        activeContact={activeContact}
        userAvatar={userProfile.avatar}
        userName={userProfile.name}
        onBack={() => setSubView(null)}
      />
    );
  }

  if (subView === 'offline_page' && selectedOfflineMessage) {
    return (
      <OfflineDetailsPage
        message={selectedOfflineMessage}
        onBack={() => setSubView(null)}
        contact={activeContact}
        userProfile={userProfile}
      />
    );
  }

  if (subView === 'wallet') {
    return (
      <WalletPage
        balance={walletBalance}
        bankCards={bankCards}
        transactions={transactions}
        paymentPin={paymentPin}
        onBack={() => setSubView(null)}
        onRecharge={(amt) => {
          setWalletBalance((prev) => prev + amt);
          setTransactions((prev) => [
            { id: `tx-${Date.now()}`, title: '钱包充值', amount: `+${amt.toFixed(2)}`, type: 'income', time: '刚刚', method: bankCards[0]?.bankName || '零钱通道' },
            ...prev,
          ]);
        }}
        onAddBankCard={(card) => {
          setBankCards((prev) => [...prev, card]);
        }}
        onUpdatePin={(pin) => setPaymentPin(pin)}
      />
    );
  }

  if (subView === 'favorites') {
    return (
      <FavoritesPage 
        favorites={favorites} 
        onBack={() => setSubView(null)} 
      />
    );
  }

  if (subView === 'personas') {
    return (
      <UserPersonasPage
        personas={userPersonas}
        onBack={() => setSubView(null)}
        onDeletePersona={(id) => handleDeleteUserPersona(id)}
        onSavePersona={(persona) => {
          setUserPersonas((prev) => {
            const existing = prev.findIndex(p => p.id === persona.id);
            if (existing >= 0) {
              const next = [...prev];
              next[existing] = persona;
              return next;
            }
            return [persona, ...prev];
          });
        }}
        onFileUpload={(file, targetSetter) => handleImportPersonaFile(file, targetSetter)}
      />
    );
  }

  if (subView === 'api_settings') {
    return (
      <div className="w-full h-full bg-[#f2f2f7] dark:bg-black text-zinc-900 dark:text-zinc-100 flex flex-col font-sans select-none overflow-hidden">
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between sticky top-0 z-20">
          <button
            onClick={() => setSubView(null)}
            className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1 hover:underline"
          >
            <ChevronLeft className="w-4 h-4" /> 返回微信
          </button>
          <span className="font-bold text-sm">API 管理与预设</span>
          <div className="w-12" />
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <ApiManagementSection />
        </div>
      </div>
    );
  }


  return (
    <div className="w-full h-full bg-[#f1f1f1] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans select-none overflow-hidden relative">
      
      {/* Toast Notice Banner */}
      <TopToast message={importNotice} />

          {/* Voice Message Custom Edit Modal */}
          {showVoiceEditModal && activeContact && (
            <VoiceEditModal
              onClose={() => setShowVoiceEditModal(false)}
              onSendVoice={(transcriptText, durationSeconds) => {
                const now = new Date();
                const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                
                const userIdentity = getEffectiveUserIdentity(activeContact);

                const voiceMsg: ChatMessage = {
                  id: `v-${Date.now()}`,
                  sender: userIdentity.name,
                  avatar: userIdentity.avatar,
                  content: transcriptText,
                  time: timeStr,
                  isMe: true,
                  type: 'voice',
                  duration: durationSeconds,
                };
            setContacts((prev) =>
              prev.map((c) =>
                c.id === activeContact.id
                  ? { ...c, messages: [...c.messages, voiceMsg], lastMessage: `[语音 ${durationSeconds}"]`, lastTime: timeStr }
                  : c
              )
            );
            setShowLeftMenu(false);
          }}
        />
      )}

      {/* ----------------- Active Chat Screen ----------------- */}
      {activeContact ? (
        <div className="flex-1 flex flex-col h-full relative overflow-hidden">
          {/* Top Chat Header */}
          <div className="bg-[#edf0f2]/90 dark:bg-zinc-900/90 backdrop-blur-md px-3 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between sticky top-0 z-20">
            <button 
              onClick={() => setActiveContactId(null)}
              className="flex items-center text-zinc-800 dark:text-zinc-200 font-medium text-xs hover:opacity-80"
            >
              <ChevronLeft className="w-5 h-5 -ml-1 text-zinc-900 dark:text-zinc-100" />
              微信
            </button>

            <div 
              onClick={() => {
                soundManager.playTap();
                setShowInmostThoughtModal(!showInmostThoughtModal);
              }}
              className="flex flex-col items-center cursor-pointer group py-0.5 px-2 rounded-xl hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition-all select-none"
              title="点击展开/收起心声"
            >
              <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                {activeContact.remark || activeContact.name}
                {activeContact.isGroup && <span className="text-[10px] text-zinc-900 dark:text-zinc-100 font-normal">群组</span>}
                <span className="text-[9px] text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
                  {showInmostThoughtModal ? '收起心声▲' : '心声▼'}
                </span>
              </span>

              {isGenerating ? (
                <span className="text-[10px] text-zinc-900 dark:text-zinc-100 font-medium animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100 animate-ping" />
                  对方正在输入...
                </span>
              ) : (
                activeContact.showStatus && activeContact.status && (
                  <span className="text-[9px] text-zinc-400 truncate max-w-[120px]">
                    {activeContact.status}
                  </span>
                )
              )}
            </div>

            <button 
              onClick={() => setSubView("chat_settings")}
              className="p-1.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
              title="设置人设/世界书/壁纸"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

          {/* Collapsible Inmost Thought Drawer */}
          {showInmostThoughtModal && (
            <div className="absolute top-[53px] inset-x-0 z-30 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-4 shadow-xl animate-in slide-in-from-top duration-200">
              <div className="max-w-md mx-auto p-4 bg-white dark:bg-zinc-950 border-2 border-zinc-950 dark:border-zinc-50 text-zinc-950 dark:text-zinc-50 shadow-md space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-950 dark:border-zinc-50 pb-2">
                  <span className="text-xs font-black tracking-widest uppercase text-zinc-950 dark:text-zinc-50">当前心声</span>
                  <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-normal">点击名字或空白处收起</span>
                </div>
                <p className="text-xs text-zinc-900 dark:text-zinc-100 leading-relaxed font-normal whitespace-pre-wrap">
                  {activeContact.inmostThought || `其实最近一直在默默关注着你的动态。虽然表面上聊天时可能显得挺随意的，但每一次看到你发过来的消息，心里都会忍不住泛起一阵阵涟漪。你的喜怒哀乐仿佛都有着神奇的魔力，牵动着我的情绪。`}
                </p>
              </div>
            </div>
          )}

          {/* Messages Container */}
          <div 
            onClick={() => {
              if (showInmostThoughtModal) {
                setShowInmostThoughtModal(false);
              }
            }}
            className="flex-1 overflow-y-auto p-3 space-y-3 relative cursor-default"
            style={{
              backgroundImage: activeContact.wallpaper ? `url(${activeContact.wallpaper})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {activeContact.wallpaper && (
              <div className="absolute inset-0 bg-black/20 dark:bg-black/40 pointer-events-none z-0" />
            )}

            <div className="text-center my-1 relative z-10">
              <span className="text-[10px] bg-zinc-200/80 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                与 {activeContact.name} 对话中
              </span>
            </div>

            {activeContact.messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex items-start gap-2.5 relative z-10 group ${msg.isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-lg bg-white border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center font-bold text-base shrink-0 shadow-sm overflow-hidden">
                  {(() => {
                    const userIdentity = getEffectiveUserIdentity(activeContact);
                    const av = msg.avatar || (msg.isMe ? userIdentity.avatar : activeContact.avatar);
                    return av.startsWith('http') || av.startsWith('data:') ? (
                      <img src={av} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      av
                    );
                  })()}
                </div>

                {/* Message Content */}
                <div className="max-w-[82%] flex flex-col">
                  {msg.type === 'text' && (
                    <div 
                      className={`p-2.5 px-3 rounded-2xl text-xs sm:text-[13px] leading-relaxed break-words relative transition-all border ${
                        msg.isMe 
                          ? 'bg-white border-zinc-950 text-zinc-950 rounded-tr-none' 
                          : 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-tl-none border-zinc-200 dark:border-zinc-800 shadow-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                  )}

                  {msg.type === 'voice' && (
                    <div className="space-y-1.5">
                      <div 
                        onClick={() => {
                          soundManager.playAppOpen();
                          setTranscribedMessageIds(prev => 
                            prev.includes(msg.id) ? prev.filter(id => id !== msg.id) : [...prev, msg.id]
                          );
                        }}
                        className={`p-2.5 rounded-2xl text-xs flex items-center gap-2 cursor-pointer active:scale-95 transition-all border ${
                          msg.isMe 
                            ? 'bg-white border-zinc-950 text-zinc-950 rounded-tr-none flex-row-reverse' 
                            : 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-tl-none border-zinc-200 dark:border-zinc-800'
                        }`}
                        style={{ width: `${Math.min(80 + (msg.duration || 3) * 10, 160)}px` }}
                      >
                        <Volume2 className={`w-3.5 h-3.5 animate-pulse text-zinc-400`} />
                        <span className="font-mono font-bold text-[11px]">{msg.duration || 3}"</span>
                      </div>
                      
                      {transcribedMessageIds.includes(msg.id) && msg.content && (
                        <div className={`p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-[10px] font-medium text-zinc-500 animate-in fade-in slide-in-from-top-1 ${msg.isMe ? 'text-right' : 'text-left'}`}>
                          {msg.content}
                        </div>
                      )}
                    </div>
                  )}

                  {msg.type === 'transfer' && (
                    <div className={`w-52 rounded-2xl p-3.5 border shadow-sm space-y-3 transition-all ${
                      msg.isMe 
                        ? 'bg-white border-zinc-950 text-zinc-950' 
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100'
                    }`}>
                      <div className="flex items-center justify-between border-b border-zinc-50 dark:border-zinc-800 pb-2">
                        <div className="flex items-center gap-1.5">
                          <Wallet className={`w-3.5 h-3.5 text-zinc-400`} />
                          <span className="text-[9px] font-black uppercase tracking-wider opacity-60">Transfer</span>
                        </div>
                        <div className="text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-zinc-950/20 opacity-40 uppercase">转账</div>
                      </div>

                      <div className="space-y-0.5 text-center">
                        <div className="text-xl font-black tracking-tighter">{msg.transferAmount}</div>
                        <div className={`text-[9px] uppercase font-bold opacity-40 tracking-widest`}>{msg.content || '微信转账'}</div>
                      </div>

                      {(!msg.transferStatus || msg.transferStatus === 'pending') ? (
                        <div className="flex gap-2 pt-1">
                          {!msg.isMe ? (
                            <>
                              <button 
                                onClick={() => handleUpdateTransferStatus(msg.id, 'collected')}
                                className="flex-1 bg-zinc-950 text-white py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all active:scale-95"
                              >
                                收款
                              </button>
                              <button 
                                onClick={() => handleUpdateTransferStatus(msg.id, 'returned')}
                                className="flex-1 border border-zinc-200 text-zinc-400 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:border-zinc-950 hover:text-zinc-950 transition-all active:scale-95"
                              >
                                退回
                              </button>
                            </>
                          ) : (
                            <div className="flex-1 py-1.5 border border-dashed border-zinc-100 rounded-lg text-[8px] font-bold text-zinc-300 text-center uppercase tracking-widest">
                              PENDING
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className={`p-1.5 rounded-lg border flex items-center justify-center gap-1.5 ${
                          msg.transferStatus === 'collected' ? 'bg-zinc-50 border-zinc-100 text-zinc-900' : 'border-zinc-50 text-zinc-300'
                        }`}>
                          {msg.transferStatus === 'collected' ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          <span className="text-[9px] font-black uppercase tracking-widest">
                            {msg.transferStatus === 'collected' ? 'COLLECTED' : 'RETURNED'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {msg.type === 'location' && (
                    <div className={`w-52 rounded-2xl overflow-hidden border shadow-sm flex flex-col group active:scale-[0.98] transition-all cursor-pointer ${
                      msg.isMe 
                        ? 'bg-white border-zinc-950' 
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                    }`}>
                      {/* Stylized Map View */}
                      <div className="h-24 bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #000 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                          <div className="relative">
                            <div className="absolute inset-0 bg-zinc-900 blur-lg opacity-20 scale-150 animate-pulse" />
                            <div className="w-8 h-8 bg-zinc-950 rounded-full flex items-center justify-center text-white relative z-10 shadow-xl border-2 border-white">
                              <MapPin className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                        <div className="absolute bottom-2 right-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 text-[8px] font-black uppercase tracking-tighter opacity-40">
                          {msg.locationDistance || '1.2km'}
                        </div>
                      </div>
                      
                      <div className="p-3 space-y-0.5">
                        <div className={`text-[11px] font-black truncate text-zinc-900 dark:text-white uppercase tracking-tight`}>{msg.locationTitle}</div>
                        <div className={`text-[9px] line-clamp-1 leading-tight font-bold text-zinc-400`}>{msg.locationAddress}</div>
                      </div>
                      
                      <div className={`h-8 border-t flex items-center justify-center text-[8px] font-black uppercase tracking-[0.2em] bg-zinc-50 border-zinc-100 text-zinc-400 group-hover:text-zinc-900 transition-colors`}>
                        Location View
                      </div>
                    </div>
                  )}

                  {msg.type === 'offline' && (
                    <div 
                      onClick={() => {
                        setSelectedOfflineMessage(msg);
                        setSubView('offline_page');
                      }}
                      className={`w-52 rounded-2xl p-3.5 border shadow-sm space-y-3.5 transition-all cursor-pointer active:scale-95 group ${
                        msg.isMe 
                          ? 'bg-white border-zinc-950 text-zinc-950' 
                          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100'
                      }`}
                    >
                      <div className={`flex items-center justify-between border-b pb-2 border-zinc-50 dark:border-zinc-800`}>
                        <div className="flex items-center gap-1.5">
                          <Calendar className={`w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-950 transition-colors`} />
                          <span className="text-[9px] font-black uppercase tracking-widest opacity-60">MEETUP</span>
                        </div>
                        <div className="text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-zinc-950/20 opacity-40 uppercase">Offline</div>
                      </div>
                      
                      <div className="space-y-0.5">
                        <div className="text-sm font-black leading-tight uppercase tracking-tight truncate group-hover:underline">{msg.offlineTitle || '一起约会吧~'}</div>
                        <div className={`text-[9px] font-bold text-zinc-400`}>{msg.offlineTime}</div>
                      </div>
                      
                      <div className={`p-2.5 rounded-xl border flex items-center gap-2 bg-zinc-50 border-zinc-100 dark:border-zinc-800 group-hover:border-zinc-900 transition-colors`}>
                        <MapPin className="w-3 h-3 shrink-0 opacity-40" />
                        <span className="text-[9px] font-bold truncate opacity-80">{msg.offlineVenue}</span>
                      </div>
                    </div>
                  )}

                  {msg.type === 'image' && (
                    <div className="rounded-xl overflow-hidden border border-zinc-200 shadow-md max-w-[200px]">
                      <img src={msg.mediaUrl} alt="图片" className="w-full h-auto object-cover" />
                    </div>
                  )}

                  {msg.type === 'sticker' && (
                    <div className="w-24 h-24 rounded-2xl overflow-hidden p-1 bg-white/60 dark:bg-zinc-800/60 backdrop-blur-sm border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-sm">
                      {msg.mediaUrl ? (
                        <img src={msg.mediaUrl} alt="表情包" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">[{msg.content}]</span>
                      )}
                    </div>
                  )}

                  <div className={`flex items-center gap-2 mt-0.5 ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[9px] text-zinc-400 font-mono">{msg.time}</span>
                    <button 
                      onClick={() => handleFavoriteMessage(msg)}
                      className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-amber-500 transition-opacity"
                      title="收藏此条消息"
                    >
                      <Bookmark className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Chat Action Bar */}
          <div className="bg-[#f7f7f7] dark:bg-zinc-900 border-t border-zinc-300 dark:border-zinc-800 p-2 flex flex-col gap-2 z-20">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  setShowLeftMenu(!showLeftMenu);
                  setShowStickerPicker(false);
                }}
                className="p-1.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
                title="更多功能"
              >
                <Plus className={`w-5 h-5 transition-transform ${showLeftMenu ? 'rotate-45' : ''}`} />
              </button>

              <input 
                type="text"
                value={inputContent}
                onChange={(e) => setInputContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSendUserMessage();
                  }
                }}
                placeholder="发送消息..."
                className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />

              <button 
                onClick={() => {
                  setShowStickerPicker(!showStickerPicker);
                  setShowLeftMenu(false);
                }}
                className="p-1.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
              >
                <Smile className="w-5 h-5" />
              </button>

              <button 
                onClick={handleGenerateReply}
                disabled={isGenerating}
                className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1"
                title="AI生成回复"
              >
                {isGenerating ? (
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>发送</span>
              </button>
            </div>

            {/* Menu Grid */}
            {showLeftMenu && (
              <div 
                className="grid grid-cols-4 gap-2 pt-2 pb-1 border-t border-zinc-200 dark:border-zinc-800 animate-fade-in relative"
                onClick={(e) => {
                  // If clicking the grid container (blank area), close it
                  if (e.target === e.currentTarget) {
                    setShowLeftMenu(false);
                  }
                }}
              >
                <button 
                  onClick={() => {
                    setShowStickerPicker(true);
                    setShowLeftMenu(false);
                  }}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-all active:scale-95"
                >
                  <Smile className="w-5 h-5 text-amber-500" />
                  <span className="text-[10px] font-medium">表情包</span>
                </button>

                <button 
                  onClick={() => setShowLocationModal(true)}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-all active:scale-95"
                >
                  <MapPin className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
                  <span className="text-[10px] font-medium">位置</span>
                </button>

                <button 
                  onClick={() => setShowCameraModal(true)}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-all active:scale-95"
                >
                  <Camera className="w-5 h-5 text-rose-500" />
                  <span className="text-[10px] font-medium">相机</span>
                </button>

                <button 
                  onClick={handleSendOfflineInvite}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-all active:scale-95"
                >
                  <Calendar className="w-5 h-5 text-indigo-500" />
                  <span className="text-[10px] font-medium">线下</span>
                </button>

                <button 
                  onClick={() => {
                    setShowLeftMenu(false);
                    handleGenerateReply();
                  }}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-all active:scale-95"
                >
                  <RotateCcw className="w-5 h-5 text-cyan-500" />
                  <span className="text-[10px] font-medium">重新生成</span>
                </button>

                <label className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-all cursor-pointer active:scale-95">
                  <ImageIcon className="w-5 h-5 text-blue-500" />
                  <span className="text-[10px] font-medium">相册</span>
                  <input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        const url = reader.result as string;
                        const now = new Date();
                        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                        const userIdentity = getEffectiveUserIdentity(activeContact);
                        const newMsg: ChatMessage = {
                          id: `img-${Date.now()}`,
                          sender: userIdentity.name,
                          avatar: userIdentity.avatar,
                          content: '[图片]',
                          time: timeStr,
                          isMe: true,
                          type: 'image',
                          mediaUrl: url,
                        };
                        setContacts((prev) =>
                          prev.map((c) => (c.id === activeContact.id ? { ...c, messages: [...c.messages, newMsg] } : c))
                        );
                      };
                      reader.readAsDataURL(file);
                    }
                    setShowLeftMenu(false);
                  }} className="hidden" />
                </label>

                <button 
                  onClick={() => setShowTransferModal(true)}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-all active:scale-95"
                >
                  <Wallet className="w-5 h-5 text-amber-500" />
                  <span className="text-[10px] font-medium">转账</span>
                </button>

                <button 
                  onClick={() => {
                    soundManager.playTap();
                    setShowVoiceEditModal(true);
                    setShowLeftMenu(false);
                  }}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-all active:scale-95"
                >
                  <Mic className="w-5 h-5 text-purple-500" />
                  <span className="text-[10px] font-medium">语音</span>
                </button>
              </div>
            )}

            {/* Sticker Picker */}
            {showStickerPicker && (
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">表情包库 & 导入</span>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-bold px-2 py-1 rounded-lg cursor-pointer hover:bg-zinc-200 transition-colors flex items-center gap-1">
                      <FileText className="w-3 h-3" /> 一键导入 (.txt)
                      <input 
                        type="file" 
                        accept=".txt,.docx" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              const content = evt.target?.result as string;
                              const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                              const newStks = lines.map((line, idx) => ({
                                id: `stk-import-${Date.now()}-${idx}`,
                                name: line.slice(0, 5),
                                url: line.startsWith('http') ? line : 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=100&h=100&fit=crop',
                                group: '导入'
                              }));
                              setCustomStickers(prev => [...prev, ...newStks]);
                              setActiveStickerGroup('导入');
                            };
                            reader.readAsText(file);
                          }
                        }}
                      />
                    </label>
                    <button onClick={() => setShowStickerPicker(false)} className="text-zinc-400 hover:text-zinc-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Grouping Tabs */}
                <div className="flex gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2 overflow-x-auto scrollbar-hide">
                  {Array.from(new Set(customStickers.map(s => s.group || '默认'))).map(group => (
                    <button
                      key={group}
                      onClick={() => setActiveStickerGroup(group)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all whitespace-nowrap ${
                        activeStickerGroup === group 
                          ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' 
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {group}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                  {customStickers
                    .filter(s => (s.group || '默认') === activeStickerGroup)
                    .map((stk) => (
                      <div 
                        key={stk.id}
                        onClick={() => {
                          soundManager.playTap();
                          const now = new Date();
                          const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                          const userIdentity = getEffectiveUserIdentity(activeContact);
                          const newMsg: ChatMessage = {
                            id: `stk-${Date.now()}`,
                            sender: userIdentity.name,
                            avatar: userIdentity.avatar,
                            content: '[表情包]',
                            time: timeStr,
                            isMe: true,
                            type: 'sticker',
                            mediaUrl: stk.url,
                          };
                          setContacts((prev) =>
                            prev.map((c) => (c.id === activeContact.id ? { ...c, messages: [...c.messages, newMsg] } : c))
                          );
                          setShowStickerPicker(false);
                        }}
                        className="w-14 h-14 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden cursor-pointer hover:border-zinc-900 transition-all relative group"
                      >
                        <img src={stk.url} alt={stk.name} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-white text-center truncate">
                          {stk.name}
                        </span>
                      </div>
                    ))}
                  {customStickers.filter(s => (s.group || '默认') === activeStickerGroup).length === 0 && (
                    <div className="col-span-4 py-4 text-center text-[10px] text-zinc-400">该分组下暂无表情包</div>
                  )}
                </div>

                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                  <span className="text-[10px] font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    导入新表情包 (图片URL)
                  </span>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="名称"
                      value={newStickerName}
                      onChange={(e) => setNewStickerName(e.target.value)}
                      className="w-1/3 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 text-[10px]"
                    />
                    <input 
                      type="text"
                      placeholder="https://...图片URL"
                      value={newStickerUrl}
                      onChange={(e) => setNewStickerUrl(e.target.value)}
                      className="flex-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 text-[10px]"
                    />
                    <button 
                      onClick={handleImportSticker}
                      className="bg-white border border-zinc-900 text-zinc-900 px-2.5 py-1 rounded text-[10px] font-bold"
                    >
                      导入
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ----------------- Main Screen by Tabs (Chats, Contacts, Moments, Me) ----------------- */
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="bg-white dark:bg-zinc-900 px-4 py-3 border-b border-zinc-900 dark:border-zinc-800 flex items-center justify-between sticky top-0 z-20">
            <button onClick={onClose} className="text-zinc-900 dark:text-zinc-100">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-base">
              {activeTab === 'chats' && '微信'}
              {activeTab === 'contacts' && '通讯录'}
              {activeTab === 'moments' && '动态'}
              {activeTab === 'me' && '我'}
            </span>
            <div className="flex items-center gap-2">
              {activeTab === 'moments' && (
                  <button 
                    onClick={() => setShowNewPostModal(true)}
                    className="p-1.5 bg-white border border-zinc-900 text-zinc-900 rounded-full shadow-sm hover:bg-zinc-50 transition-all active:scale-95"
                    title="发布新动态"
                  >
                  <CameraIcon className="w-4 h-4" />
                </button>
              )}
              {activeTab === 'contacts' && (
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => setSubView('add_friend')}
                    className="p-1.5 bg-white border border-zinc-900 text-zinc-900 rounded-full shadow-sm hover:bg-zinc-50 transition-all active:scale-95"
                    title="添加联系人"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setSubView('create_group')}
                    className="p-1.5 bg-white border border-zinc-800 text-zinc-800 rounded-full shadow-sm hover:bg-zinc-50 transition-all active:scale-95"
                    title="创建群聊"
                  >
                    <UsersRound className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* TAB 1: CHATS (微信消息列表 - 最新在最上) */}
          {activeTab === 'chats' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {contacts.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-900">
                    <UserPlus className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">暂无消息</h3>
                    <p className="text-xs text-zinc-400">点击右上角 “+” 手动添加联系人或导入 docx/txt 人设</p>
                  </div>
                  <button 
                    onClick={() => setSubView('add_friend')}
                    className="bg-white border border-zinc-900 text-zinc-900 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 hover:bg-zinc-100"
                  >
                    <Plus className="w-4 h-4" />
                    新建联系人
                  </button>
                </div>
              ) : (
                getSortedChats().map((c) => {
                  const lastMsg = c.messages[c.messages.length - 1];
                  return (
                    <div 
                      key={c.id}
                      onClick={() => setActiveContactId(c.id)}
                      className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-900/50 cursor-pointer transition-all flex items-center justify-between shadow-sm group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-white border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center font-bold text-xl shrink-0 shadow-sm overflow-hidden">
                          {c.avatar.startsWith('http') || c.avatar.startsWith('data:') ? (
                            <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" />
                          ) : (
                            c.avatar
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                            {c.remark || c.name}
                            {c.isGroup && <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-1.5 py-0.2 rounded">群聊</span>}
                          </div>
                          <div className="text-xs text-zinc-400 truncate max-w-[180px] mt-0.5">
                            {lastMsg ? lastMsg.content : c.lastMessage}
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] text-zinc-400 font-mono">
                        {lastMsg ? lastMsg.time : c.lastTime}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: CONTACTS (通讯录 - 按首字母/字符排序) */}
          {activeTab === 'contacts' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-400">联系人列表 (A-Z 排序)</span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setSubView('add_friend')}
                    className="text-xs text-zinc-900 dark:text-zinc-100 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    添加联系人
                  </button>
                  <button 
                    onClick={() => setSubView('create_group')}
                    className="text-xs text-zinc-900 dark:text-zinc-100 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <UsersRound className="w-3.5 h-3.5" />
                    创建群聊
                  </button>
                </div>
              </div>

              {contacts.length === 0 ? (
                <div className="text-center py-12 text-zinc-400 text-xs">
                  通讯录为空，点击上方新建添加联系人
                </div>
              ) : (
                getSortedContacts().map((c) => (
                  <div 
                    key={c.id}
                    onClick={() => setActiveContactId(c.id)}
                    className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-900/50 cursor-pointer transition-all flex items-center justify-between shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center font-bold text-lg shrink-0 shadow-sm overflow-hidden">
                        {c.avatar.startsWith('http') || c.avatar.startsWith('data:') ? (
                          <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" />
                        ) : (
                          c.avatar
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                          {c.remark || c.name}
                        </div>
                        <div className="text-[10px] text-zinc-400 truncate max-w-[180px]">
                          人设: {c.systemPrompt.slice(0, 25)}...
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: MOMENTS (动态 / 朋友圈) */}
          {activeTab === 'moments' && (
            <div className="flex-1 overflow-y-auto space-y-4">
              {/* Cover Banner */}
              <div className="relative h-44 bg-zinc-800 overflow-hidden group">
                <img src={momentsCover} alt="Cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Cover Tools */}
                <div className="absolute top-2 right-2 flex gap-2">
                  <label className="p-1.5 bg-black/50 hover:bg-black/80 text-white rounded-full cursor-pointer transition-all">
                    <ImageIcon className="w-4 h-4" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => setMomentsCover(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }} 
                      className="hidden" 
                    />
                  </label>
                  <button 
                    onClick={() => setMomentsCover('https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=400&fit=crop')}
                    className="p-1.5 bg-black/50 hover:bg-black/80 text-white rounded-full transition-all"
                    title="重置壁纸"
                  >
                    <Eraser className="w-4 h-4" />
                  </button>
                </div>

                {/* User Info Header */}
                <div className="absolute bottom-3 right-4 flex items-center gap-3">
                  <span className="font-bold text-white text-sm drop-shadow">{userProfile.name}</span>
                  <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center font-bold text-2xl shadow-lg border-2 border-white dark:border-zinc-900 overflow-hidden">
                    {userProfile.avatar.startsWith('http') || userProfile.avatar.startsWith('data:') ? (
                      <img src={userProfile.avatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      userProfile.avatar
                    )}
                  </div>
                </div>
              </div>

              {/* Moments List */}
              <div className="p-3 space-y-4">
                {moments.length === 0 ? (
                  <div className="text-center py-10 space-y-2">
                    <p className="text-xs text-zinc-400">暂无朋友圈动态</p>
                    <button 
                      onClick={() => handlePostMoment()}
                      className="bg-white border border-zinc-900 text-zinc-900 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm"
                    >
                      发布第一条动态
                    </button>
                  </div>
                ) : (
                  moments.map((m) => (
                    <div key={m.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-3 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2">
                      {/* Author Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-white border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center font-bold text-lg shadow-sm overflow-hidden">
                      {m.avatar.startsWith('http') || m.avatar.startsWith('data:') ? (
                        <img src={m.avatar} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        m.avatar
                      )}
                    </div>
                          <div>
                            <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{m.author}</div>
                            <div className="text-[9px] text-zinc-400">{m.time}</div>
                          </div>
                        </div>

                        {m.author === userProfile.name && (
                          <button 
                            onClick={() => handleDeleteMoment(m.id)}
                            className="text-zinc-400 hover:text-rose-500 transition-colors p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Content */}
                      <div className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed px-1">
                        {m.content}
                      </div>

                      {/* Images */}
                      {m.images && m.images.length > 0 && (
                        <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden max-w-xs">
                          {m.images.map((img, idx) => (
                            <img key={idx} src={img} alt="Post" className="w-full h-24 object-cover rounded" />
                          ))}
                        </div>
                      )}

                      {/* Action Bar */}
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                        <button 
                          onClick={() => handleGenerateMomentInteractions(m.id)}
                          disabled={isGeneratingComments === m.id}
                          className="text-[10px] text-zinc-900 dark:text-zinc-100 font-bold flex items-center gap-1 hover:underline"
                        >
                          <Sparkles className={`w-3 h-3 ${isGeneratingComments === m.id ? 'animate-spin' : ''}`} />
                          生成NPC互动
                        </button>

                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => handleToggleLikeMoment(m.id)}
                            className={`flex items-center gap-1 text-xs font-semibold ${m.likes.includes(userProfile.name) ? 'text-rose-500' : 'text-zinc-400 hover:text-rose-500'}`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${m.likes.includes(userProfile.name) ? 'fill-current' : ''}`} />
                            <span className="text-[10px]">{m.likes.length}</span>
                          </button>

                          <button 
                            onClick={() => setReplyingToPostId(replyingToPostId === m.id ? null : m.id)}
                            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-900"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span className="text-[10px]">{m.comments.length}</span>
                          </button>
                        </div>
                      </div>

                      {/* Likes Row */}
                      {m.likes.length > 0 && (
                        <div className="bg-zinc-50 dark:bg-zinc-950/60 p-2 rounded-xl text-[10px] text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                          <Heart className="w-3 h-3 text-rose-500 fill-current shrink-0" />
                          <span className="font-semibold">{m.likes.join(', ')}</span>
                        </div>
                      )}

                      {/* Comments Thread */}
                      {m.comments.length > 0 && (
                        <div className="bg-zinc-50 dark:bg-zinc-950/60 p-2 rounded-xl text-[11px] space-y-1">
                          {m.comments.map((c) => (
                            <div key={c.id} className="flex items-start gap-1">
                              <span className="font-bold text-zinc-900 dark:text-zinc-100 shrink-0">{c.author}:</span>
                              <span className="text-zinc-700 dark:text-zinc-300">{c.content}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Comment Input Drawer */}
                      {replyingToPostId === m.id && (
                        <div className="flex gap-2 pt-2">
                          <input 
                            type="text"
                            placeholder="评论..."
                            value={commentInput}
                            onChange={(e) => setCommentInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment(m.id)}
                            className="flex-1 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-xs focus:outline-none"
                          />
                          <button 
                            onClick={() => handleAddComment(m.id)}
                            className="bg-white border border-zinc-900 text-zinc-900 px-3 py-1 rounded-lg text-xs font-bold shadow-sm"
                          >
                            发送
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ME (我 - 包含 收藏, 钱包, 人设合集) */}
          {activeTab === 'me' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Profile Card Header */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <div className="w-16 h-16 rounded-2xl bg-white border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center font-bold text-4xl shrink-0 shadow-md overflow-hidden transition-all group-hover:opacity-80">
                      {userProfile.avatar.startsWith('http') || userProfile.avatar.startsWith('data:') ? (
                        <img src={userProfile.avatar} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        userProfile.avatar
                      )}
                    </div>
                    <label className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                      <CameraIcon className="w-6 h-6 text-white drop-shadow-md" />
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => setUserProfile(prev => ({ ...prev, avatar: reader.result as string }));
                            reader.readAsDataURL(file);
                          }
                        }} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                  <div className="flex-1">
                    {isEditingProfile ? (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                        <input 
                          type="text" 
                          value={userProfile.name}
                          onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 text-sm font-extrabold focus:outline-none focus:border-zinc-900"
                          placeholder="昵称"
                          autoFocus
                        />
                        <input 
                          type="text" 
                          value={userProfile.accountId}
                          onChange={(e) => setUserProfile(prev => ({ ...prev, accountId: e.target.value }))}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 text-[10px] text-zinc-500 focus:outline-none focus:border-zinc-900"
                          placeholder="微信号"
                        />
                        <button 
                          onClick={() => setIsEditingProfile(false)}
                          className="bg-zinc-900 text-white text-[10px] px-3 py-1 rounded-full font-bold active:scale-95 transition-all"
                        >
                          完成修改
                        </button>
                      </div>
                    ) : (
                      <div className="cursor-pointer group" onClick={() => setIsEditingProfile(true)}>
                        <div className="font-extrabold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-1 group-hover:text-zinc-500 transition-colors">
                          {userProfile.name}
                          <Settings className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                        </div>
                        <div className="text-xs text-zinc-400 mt-0.5 line-clamp-1">微信号: {userProfile.accountId}</div>
                        <div className="text-[10px] bg-zinc-50 dark:bg-zinc-800 text-zinc-400 border border-zinc-100 dark:border-zinc-700 font-medium px-2 py-0.5 rounded-md inline-block mt-1">
                          点击修改个人信息
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation Menu Grid (收藏 | 钱包 | 人设) */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm divide-y divide-zinc-100 dark:divide-zinc-800">
                {/* 1. 收藏 (Favorites) */}
                <button 
                  onClick={() => setSubView('favorites')}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                      <Bookmark className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs">收藏</span>
                  </div>
                  <span className="text-xs text-zinc-400 flex items-center gap-1">
                    {favorites.length} 条
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </button>

                {/* 2. 钱包 (Wallet) */}
                <button 
                  onClick={() => setSubView('wallet')}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                    </div>
                    <span className="font-bold text-xs">钱包</span>
                  </div>
                  <span className="text-xs text-zinc-900 dark:text-zinc-100 font-extrabold flex items-center gap-1">
                    ¥{walletBalance.toFixed(2)}
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  </span>
                </button>

                {/* 3. 人设 (User Persona Gallery) */}
                <button 
                  onClick={() => setSubView('personas')}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs">USER 人设合集</span>
                  </div>
                  <span className="text-xs text-zinc-400 flex items-center gap-1">
                    {userPersonas.length} 个
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </button>

                {/* 4. API 管理与预设 (API Settings & Presets) */}
                <button 
                  onClick={() => setSubView('api_settings')}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs">API 管理</span>
                  </div>
                  <span className="text-xs text-indigo-600 font-bold flex items-center gap-1">
                    参数预设
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  </span>
                </button>

              </div>

            </div>
          )}

          {/* Bottom WeChat Navigation Bar */}
          <div className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 py-2 px-6 flex justify-around items-center sticky bottom-0 z-20">
            <button 
              onClick={() => setActiveTab('chats')}
              className={`flex flex-col items-center gap-1 ${activeTab === 'chats' ? 'text-zinc-900 dark:text-zinc-100 font-bold' : 'text-zinc-400'}`}
            >
              <MessageSquare className={`w-5 h-5 ${activeTab === 'chats' ? 'stroke-[2.5px]' : ''}`} />
              <span className="text-[10px]">微信</span>
            </button>

            <button 
              onClick={() => setActiveTab('contacts')}
              className={`flex flex-col items-center gap-1 ${activeTab === 'contacts' ? 'text-zinc-900 dark:text-zinc-100 font-bold' : 'text-zinc-400'}`}
            >
              <Users className={`w-5 h-5 ${activeTab === 'contacts' ? 'stroke-[2.5px]' : ''}`} />
              <span className="text-[10px]">通讯录</span>
            </button>

            <button 
              onClick={() => setActiveTab('moments')}
              className={`flex flex-col items-center gap-1 ${activeTab === 'moments' ? 'text-zinc-900 dark:text-zinc-100 font-bold' : 'text-zinc-400'}`}
            >
              <Compass className={`w-5 h-5 ${activeTab === 'moments' ? 'stroke-[2.5px]' : ''}`} />
              <span className="text-[10px]">动态</span>
            </button>

            <button 
              onClick={() => setActiveTab('me')}
              className={`flex flex-col items-center gap-1 ${activeTab === 'me' ? 'text-zinc-900 dark:text-zinc-100 font-bold' : 'text-zinc-400'}`}
            >
              <User className={`w-5 h-5 ${activeTab === 'me' ? 'stroke-[2.5px]' : ''}`} />
              <span className="text-[10px]">我</span>
            </button>
          </div>
        </div>
      )}

      {/* ----------------- MODALS & PANELS ----------------- */}

      {/* New Post (Moment) Modal */}
      {showNewPostModal && (
        <div className="absolute inset-0 bg-white dark:bg-zinc-950 z-50 p-4 flex flex-col justify-between animate-fade-in">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <CameraIcon className="w-4 h-4" /> 发布新动态
              </span>
              <button onClick={() => setShowNewPostModal(false)} className="text-zinc-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea 
              rows={6}
              placeholder="这一刻的想法..."
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 resize-none"
            />

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs bg-white border border-zinc-900 text-zinc-900 font-bold px-4 py-2.5 rounded-xl cursor-pointer shadow-sm hover:bg-zinc-50 transition-all">
                <ImageIcon className="w-4 h-4" />
                <span>选择图片</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => setPostImage(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }} 
                  className="hidden" 
                />
              </label>

              {postImage && (
                <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-zinc-900 shadow-sm">
                  <img src={postImage} alt="Preview" className="w-full h-full object-cover" />
                  <button onClick={() => setPostImage(null)} className="absolute top-0 right-0 bg-white border-l border-b border-zinc-900 text-zinc-900 p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={handlePostMoment}
            className="w-full py-3 bg-white border border-zinc-900 text-zinc-900 font-black text-sm rounded-2xl shadow-sm mb-4 hover:bg-zinc-50 transition-all active:scale-95"
          >
            发表朋友圈
          </button>
        </div>
      )}


      {/* Transfer Modal */}
      {showTransferModal && activeContact && (
        <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-900 dark:border-zinc-100 w-full max-w-xs rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Wallet className="w-4 h-4" /> 微信转账
              </span>
              <button onClick={() => setShowTransferModal(false)}>
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">转账金额 (¥)</label>
              <input 
                type="text"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="w-full bg-white dark:bg-zinc-800 border border-zinc-900 dark:border-zinc-700 rounded-2xl p-3 text-2xl font-black font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">扣款方式选择</label>
              <select 
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-2.5 text-xs focus:outline-none font-bold"
              >
                <option value="balance">零钱 (余额: ¥{walletBalance.toFixed(2)})</option>
                {bankCards.map((card) => (
                  <option key={card.id} value={card.name}>
                    {card.name} ({card.number})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-zinc-400">转账说明</label>
              <input 
                type="text"
                value={transferRemark}
                onChange={(e) => setTransferRemark(e.target.value)}
                placeholder="添加备注..."
                className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-xs focus:outline-none"
              />
            </div>

            <button 
              onClick={handleSendTransfer}
              className="w-full py-3 bg-white border border-zinc-900 text-zinc-900 font-black text-sm rounded-2xl shadow-sm hover:bg-zinc-50 active:scale-95 transition-all"
            >
              确认转账给 {activeContact.name}
            </button>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {showLocationModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-xs rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> 发送位置
              </span>
              <button onClick={() => setShowLocationModal(false)}>
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            </div>

            <div>
              <label className="text-[10px] text-zinc-400">地点名称</label>
              <input 
                type="text"
                value={locationTitle}
                onChange={(e) => setLocationTitle(e.target.value)}
                className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-xs"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-400">详细地址</label>
              <input 
                type="text"
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-xs"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-400">距离显示 (如: 1.2km)</label>
              <input 
                type="text"
                value={locationDistance}
                onChange={(e) => setLocationDistance(e.target.value)}
                className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-xs"
              />
            </div>

            <button 
              onClick={handleSendLocation}
              className="w-full py-2 bg-white border border-zinc-900 text-zinc-900 font-bold text-xs rounded-xl shadow-sm hover:bg-zinc-50"
            >
              确认发送位置
            </button>
          </div>
        </div>
      )}

      {/* Offline Meetup Modal */}
      {showOfflineModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-xs rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-indigo-600 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> 发送线下聚会邀约
              </span>
              <button onClick={() => setShowOfflineModal(false)}>
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            </div>

            <div>
              <label className="text-[10px] text-zinc-400">活动主题</label>
              <input 
                type="text"
                value={offlineTitle}
                onChange={(e) => setOfflineTitle(e.target.value)}
                className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-xs"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-400">聚会时间</label>
              <input 
                type="text"
                value={offlineTime}
                onChange={(e) => setOfflineTime(e.target.value)}
                className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-xs"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-400">约定地点</label>
              <input 
                type="text"
                value={offlineVenue}
                onChange={(e) => setOfflineVenue(e.target.value)}
                className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-xs"
              />
            </div>

            <button 
              onClick={handleSendOfflineInvite}
              className="w-full py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md"
            >
              发送线下邀约
            </button>
          </div>
        </div>
      )}

      {/* Camera / Doodle Canvas Modal */}
      {showCameraModal && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-white border-b border-zinc-800 pb-2">
            <span className="font-bold text-sm flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-rose-500" /> 相机 / 艺术照片创作
            </span>
            <button onClick={() => setShowCameraModal(false)}>
              <X className="w-4 h-4 text-zinc-400" />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center gap-2 my-2">
            <canvas 
              ref={canvasRef}
              width={280}
              height={260}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="bg-zinc-950 border-2 border-zinc-800 rounded-2xl cursor-crosshair touch-none shadow-xl"
            />

            <div className="flex items-center gap-2">
              {['#10B981', '#EF4444', '#3B82F6', '#F59E0B', '#EC4899', '#FFFFFF'].map((color) => (
                <button 
                  key={color}
                  onClick={() => setBrushColor(color)}
                  className={`w-6 h-6 rounded-full border-2 ${brushColor === color ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <button 
                onClick={clearCanvas}
                className="p-1.5 bg-white border border-zinc-900 text-zinc-900 rounded-full hover:bg-zinc-50 transition-all"
                title="清空画布"
              >
                <Eraser className="w-4 h-4" />
              </button>
            </div>

            <input 
              type="text"
              placeholder="照片字幕/贴纸签名..."
              value={canvasText}
              onChange={(e) => setCanvasText(e.target.value)}
              className="w-full max-w-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 text-center focus:outline-none"
            />
          </div>

          <button 
            onClick={handleSendCameraPhoto}
            className="w-full py-3 bg-white border border-zinc-900 text-zinc-900 font-black text-sm rounded-2xl shadow-sm hover:bg-zinc-50 active:scale-95 transition-all mb-4"
          >
            拍下并发送照片作品
          </button>
        </div>
      )}

    </div>
  );
};
