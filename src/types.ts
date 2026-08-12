export type AppId = 'wechat' | 'worldbook' | 'settings' | 'beautify' | 'checkphone' | 'novel' | 'forum';

export interface AppConfig {
  id: AppId;
  name: string;
  iconName: string;
  customIconUrl?: string;
  badge?: number;
  gradient: string;
  textColor?: string;
  accentColor: string;
  inDock?: boolean;
}

export interface FontPreset {
  id: string;
  name: string;
  family: string;
  sourceType: 'system' | 'url' | 'file';
  fontUrl?: string;
  isDefault?: boolean;
}

export interface Wallpaper {
  id: string;
  name: string;
  category: 'ios' | 'gradient' | 'minimal' | 'nature' | 'dark';
  cssBackground: string;
  previewColor: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  avatar: string;
  content: string;
  time: string;
  isMe?: boolean;
  type?: 'text' | 'image' | 'voice' | 'transfer' | 'sticker' | 'revoke' | 'location' | 'offline';
  mediaUrl?: string;
  duration?: number;
  transferAmount?: string;
  transferStatus?: 'pending' | 'collected' | 'returned';
  originalText?: string;
  locationTitle?: string;
  locationAddress?: string;
  locationDistance?: string;
  offlineTitle?: string;
  offlineTime?: string;
  offlineVenue?: string;
}

export interface WeChatContact {
  id: string;
  name: string;
  remark?: string; // 对char的备注
  avatar: string;
  isGroup?: boolean;
  groupMembers?: string[];
  systemPrompt: string; // CHAR人设
  userPrompt?: string; // USER人设
  userName?: string; // USER在该聊天中的名字
  userAvatar?: string; // USER在该聊天中的头像
  modelName: string;
  temperature?: number; // 独立API温度
  wallpaper?: string;
  boundWorldBookIds?: string[];
  messages: ChatMessage[];
  lastMessage?: string;
  lastTime?: string;
  unreadCount?: number;
  isBlocked?: boolean; // 拉黑标志
  proactiveMessaging?: boolean; // 是否主动发消息
  proactiveFrequency?: 'high' | 'medium' | 'low' | 'random'; // 主动频率
  memoryRounds?: number; // AI调用记忆轮数
  status?: string; // CHAR当前状态
  inmostThought?: string; // CHAR心声/内心独白
  showStatus?: boolean; // 是否显示状态
  builtinPromptPreset?: 'none' | 'gou_nan' | 'nian_shang' | 'custom'; // 内置提示词
  customBuiltinPromptTitle?: string; // 自定义内置提示词标题
  customBuiltinPromptContent?: string; // 自定义内置提示词内容
}

export interface CustomSticker {
  id: string;
  name: string;
  url: string;
  group?: string;
}

export interface MomentComment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  time: string;
  replyTo?: string;
}

export interface MomentPost {
  id: string;
  author: string;
  avatar: string;
  time: string;
  content: string;
  images?: string[];
  likes: string[]; // list of names who liked
  comments: MomentComment[];
}

export interface FavoriteItem {
  id: string;
  sender: string;
  avatar: string;
  content: string;
  time: string;
  chatName: string;
  type?: string;
  mediaUrl?: string;
  savedAt: string;
}

export interface BankCard {
  id: string;
  bankName: string;
  cardType: string;
  cardNumber: string;
  balance: number;
  color?: string;
}

export interface WalletTransaction {
  id: string;
  title: string;
  amount: string;
  type: 'income' | 'expense';
  time: string;
  method: string;
  detail?: string;
}

export interface UserPersona {
  id: string;
  name: string;
  avatar: string;
  prompt: string;
  isSelected?: boolean;
}

export interface WorldBookItem {
  id: string;
  title: string;
  category: string;
  description: string;
  tags?: string[];
  updatedAt: string;
  isGlobal?: boolean; // 是否全局绑定
  position?: 'front' | 'middle' | 'back'; // 位置（前中后，代表重要程度和调用顺序）
}

export interface StylePreset {
  id: string;
  name: string;
  content: string;
}

export interface NovelBook {
  id: string;
  title: string;
  author: string;
  coverGradient: string;
  chapterCount: number;
  currentChapter: number;
  progress: number;
  content: string[];
  chapters?: { title: string; content: string[] }[];
  
  // New fields for Fan Fiction
  worldBookId?: string;
  writingStyle?: string;
  userPersonaId?: string;
  charName?: string;
  outline?: string;
  isFavorited?: boolean; // Joined bookshelf
  tags?: string[];
}

export interface ForumPost {
  id: string;
  author: string;
  avatar: string;
  time: string;
  title: string;
  content: string;
  likes: number;
  comments: number;
  tags: string[];
  isLiked?: boolean;
}

export interface PhoneSpecs {
  model: string;
  systemVersion: string;
  chip: string;
  ram: string;
  storageUsed: number; // GB
  storageTotal: number; // GB
  batteryLevel: number; // %
  batteryHealth: number; // %
  cpuUsage: number; // %
  screenRefreshRate: number; // Hz
  ipAddress: string;
  networkType: '5G' | 'Wi-Fi' | 'Offline';
}

export interface ApiPreset {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  modelName: string;
  temperature: number;
  updatedAt?: number;
}

export interface ActiveApiConfig {
  baseUrl: string;
  apiKey: string;
  modelName: string;
  temperature: number;
  presetId?: string;
  presetName?: string;
}

