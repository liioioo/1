import React, { useState, useMemo } from 'react';
import { ChevronLeft, Image as ImageIcon, Sparkles, Globe, Trash2, ShieldAlert, BarChart2, FileText, Check, RotateCcw, Search, X, ChevronDown, ChevronUp, Folder, BookOpen, Zap, Save } from 'lucide-react';
import { WeChatContact, WorldBookItem, UserPersona } from '../../../types';
import { soundManager } from '../../../utils/audio';
import { BUILTIN_PROMPTS, getBuiltinPromptById, getSavedCustomPresets, saveCustomPresetItem, deleteSavedCustomPreset } from '../../../constants/builtinPrompts';
import { TopToast } from '../../TopToast';

interface ChatSettingsPageProps {
  contact: WeChatContact;
  worldBooks: WorldBookItem[];
  userPersonas: UserPersona[];
  onBack: () => void;
  onUpdateContact: (updated: WeChatContact) => void;
  onDeleteContact: (id: string) => void;
  onFileUpload: (file: File, targetSetter: (val: string) => void) => void;
}

export const ChatSettingsPage: React.FC<ChatSettingsPageProps> = ({
  contact,
  worldBooks,
  userPersonas,
  onBack,
  onUpdateContact,
  onDeleteContact,
  onFileUpload,
}) => {
  const [name, setName] = useState(contact.name);
  const [remark, setRemark] = useState(contact.remark || '');
  const [avatar, setAvatar] = useState(contact.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Char');
  const [systemPrompt, setSystemPrompt] = useState(contact.systemPrompt);
  
  // Builtin Prompt Preset
  const [builtinPreset, setBuiltinPreset] = useState<string>(
    contact.builtinPromptPreset || 'none'
  );
  const [customBuiltinTitle, setCustomBuiltinTitle] = useState(contact.customBuiltinPromptTitle || '');
  const [customBuiltinContent, setCustomBuiltinContent] = useState(contact.customBuiltinPromptContent || '');
  const [savedPresets, setSavedPresets] = useState(getSavedCustomPresets());
  const [isBuiltinFolded, setIsBuiltinFolded] = useState(true);

  const handleSaveAsPreset = () => {
    if (!customBuiltinTitle.trim() || !customBuiltinContent.trim()) {
      setNotice('请先填写自定义提示词标题和内容！');
      setTimeout(() => setNotice(null), 2500);
      return;
    }
    const savedItem = saveCustomPresetItem(customBuiltinTitle, customBuiltinContent);
    setSavedPresets(getSavedCustomPresets());
    setBuiltinPreset(savedItem.id);
    handleSaveAndSync({ builtinPromptPreset: savedItem.id });
    setNotice('已保存');
    setTimeout(() => setNotice(null), 2000);
  };

  // Independent API Temperature
  const [temperature, setTemperature] = useState<number>(contact.temperature ?? 0.7);

  // User persona in this chat
  const [userName, setUserName] = useState(contact.userName || '我');
  const [userAvatar, setUserAvatar] = useState(contact.userAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User');
  const [userPrompt, setUserPrompt] = useState(contact.userPrompt || '');

  // Bound World Books
  const [boundWbIds, setBoundWbIds] = useState<string[]>(contact.boundWorldBookIds || []);
  const [isWbExpanded, setIsWbExpanded] = useState(false);

  // Search History
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Wallpaper
  const [wallpaper, setWallpaper] = useState<string | undefined>(contact.wallpaper);

  // Proactive Messaging
  const [proactiveMessaging, setProactiveMessaging] = useState<boolean>(!!contact.proactiveMessaging);
  const [proactiveFrequency, setProactiveFrequency] = useState<'high' | 'medium' | 'low' | 'random'>(
    contact.proactiveFrequency || 'medium'
  );

  // Memory Rounds
  const [memoryRounds, setMemoryRounds] = useState<number>(contact.memoryRounds || 10);

  // Block status
  const [isBlocked, setIsBlocked] = useState<boolean>(!!contact.isBlocked);

  const [notice, setNotice] = useState<string | null>(null);

  // Calculate Tokens dynamically
  const calculateTokenStats = () => {
    const builtinText = getBuiltinPromptById(builtinPreset);
    const charChars = (systemPrompt + (builtinText ? '\n' + builtinText : '')).length;
    const userChars = userPrompt.length;

    const boundWbText = worldBooks
      .filter((wb) => wb.isGlobal || boundWbIds.includes(wb.id))
      .map((wb) => `${wb.title}: ${wb.description}`)
      .join('\n');
    const wbChars = boundWbText.length;

    // Slice history according to memoryRounds
    const slicedMessages = contact.messages.slice(-memoryRounds);
    const historyText = slicedMessages.map((m) => `${m.sender}: ${m.content}`).join('\n');
    const historyChars = historyText.length;

    const totalChars = charChars + userChars + wbChars + historyChars;

    return {
      total: Math.ceil(totalChars * 1.5),
      char: Math.ceil(charChars * 1.5),
      user: Math.ceil(userChars * 1.5),
      wb: Math.ceil(wbChars * 1.5),
      history: Math.ceil(historyChars * 1.5),
    };
  };

  const tokenStats = calculateTokenStats();

  // Status Settings
  const [status, setStatus] = useState(contact.status || '');
  const [showStatus, setShowStatus] = useState(!!contact.showStatus);

  const statusPresets = ['在线', '离线', '工作中', '休息中', '隐身', '通话中', '在学校', '在吃饭'];

  const handleSaveAndSync = (overrides?: Partial<WeChatContact>) => {
    soundManager.playTap();
    const updated: WeChatContact = {
      ...contact,
      name: name.trim() || contact.name,
      remark: remark.trim() || undefined,
      avatar,
      systemPrompt,
      builtinPromptPreset: builtinPreset,
      temperature,
      userName,
      userAvatar,
      userPrompt,
      boundWorldBookIds: boundWbIds,
      wallpaper,
      proactiveMessaging,
      proactiveFrequency,
      memoryRounds,
      isBlocked,
      status,
      showStatus,
      ...overrides,
    };
    onUpdateContact(updated);
    setNotice('已保存');
    setTimeout(() => setNotice(null), 2000);
  };

  // Avatar album upload
  const handleCharAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          const url = evt.target.result as string;
          setAvatar(url);
          handleSaveAndSync({ avatar: url });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUserAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          const url = evt.target.result as string;
          setUserAvatar(url);
          handleSaveAndSync({ userAvatar: url });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWallpaperFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          const url = evt.target.result as string;
          setWallpaper(url);
          handleSaveAndSync({ wallpaper: url });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleWb = (wbId: string) => {
    const next = boundWbIds.includes(wbId)
      ? boundWbIds.filter((id) => id !== wbId)
      : [...boundWbIds, wbId];
    setBoundWbIds(next);
    handleSaveAndSync({ boundWorldBookIds: next });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f1f1f1] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden animate-fade-in relative">
      {/* Top Header */}
      <div className="bg-[#edf0f2] dark:bg-zinc-900 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between sticky top-0 z-20">
        <button onClick={onBack} className="flex items-center text-zinc-800 dark:text-zinc-200 text-xs font-semibold">
          <ChevronLeft className="w-5 h-5 -ml-1 text-zinc-900 dark:text-zinc-100" />
          返回聊天
        </button>
        <span className="font-bold text-sm">聊天高级设置</span>
        <button onClick={() => handleSaveAndSync()} className="text-xs bg-white border border-zinc-900 text-zinc-900 font-bold px-2.5 py-1 rounded-lg hover:bg-zinc-50 transition-colors">
          保存
        </button>
      </div>

      <TopToast message={notice} />

      {/* Unified Scrollable Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* SECTION 1: TOP TOKEN STATS CARD */}
        <div className="bg-white border border-zinc-900 text-zinc-900 p-4 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
            <span className="text-xs font-extrabold flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-zinc-500" /> 上下文 Tokens 实时统计 (Top)
            </span>
            <span className="text-base font-black font-mono text-zinc-900">{tokenStats.total} Tokens</span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
            <div className="bg-zinc-50 p-2 rounded-xl border border-zinc-100">
              <div className="text-zinc-500 font-bold">CHAR人设</div>
              <div className="font-mono font-extrabold text-xs mt-0.5">{tokenStats.char}</div>
            </div>
            <div className="bg-zinc-50 p-2 rounded-xl border border-zinc-100">
              <div className="text-zinc-500 font-bold">USER人设</div>
              <div className="font-mono font-extrabold text-xs mt-0.5">{tokenStats.user}</div>
            </div>
            <div className="bg-zinc-50 p-2 rounded-xl border border-zinc-100">
              <div className="text-zinc-500 font-bold">世界书</div>
              <div className="font-mono font-extrabold text-xs mt-0.5">{tokenStats.wb}</div>
            </div>
            <div className="bg-zinc-50 p-2 rounded-xl border border-zinc-100">
              <div className="text-zinc-500 font-bold">历史记忆</div>
              <div className="font-mono font-extrabold text-xs mt-0.5">{tokenStats.history}</div>
            </div>
          </div>
        </div>

        {/* SECTION 2: AI MEMORY Context Rounds */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
              AI 调用记忆轮数 <span className="text-[10px] text-zinc-400 font-normal">(轮数越大Tokens越多)</span>
            </label>
          </div>
          
          <input
            type="number"
            min={1}
            max={500}
            value={memoryRounds}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 1;
              setMemoryRounds(val);
            }}
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none"
          />
        </div>

        {/* SECTION 2.5: INDEPENDENT API TEMPERATURE */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
              独立 API 温度 <span className="text-[10px] text-zinc-400 font-normal">(覆盖全局设置)</span>
            </label>
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-mono">{temperature}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={temperature}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setTemperature(val);
              }}
              className="flex-1 accent-zinc-900 dark:accent-zinc-100"
            />
          </div>
        </div>

        {/* SECTION 2.6: CHAR STATUS SETTINGS */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                CHAR 当下状态自动同步
              </span>
              <p className="text-[10px] text-zinc-400">开启后由 AI 根据对话内容与回复实时生成状态</p>
            </div>
            <button
              onClick={() => {
                const next = !showStatus;
                setShowStatus(next);
              }}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${showStatus ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-300 dark:bg-zinc-700'}`}
            >
              <div className={`w-5 h-5 bg-white dark:bg-zinc-900 rounded-full transition-transform ${showStatus ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        {/* SECTION 2.7: BUILTIN PROMPT PRESETS (FOLDED BY DEFAULT) */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all">
          <button
            type="button"
            onClick={() => setIsBuiltinFolded(!isBuiltinFolded)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <div>
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  内置提示词
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    builtinPreset !== 'none'
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                  }`}>
                    {builtinPreset === 'gou_nan' ? '狗男版' : builtinPreset === 'nian_shang' ? '年上版' : builtinPreset === 'custom' ? (customBuiltinTitle || '自定义') : '未开启 (无)'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-medium">
              <span>{isBuiltinFolded ? '展开折叠配置' : '收起'}</span>
              {isBuiltinFolded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </div>
          </button>

          {!isBuiltinFolded && (
            <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
              {[
                ...BUILTIN_PROMPTS,
                ...savedPresets.map((sp) => ({
                  id: sp.id,
                  name: sp.name,
                  shortDesc: sp.shortDesc,
                  targetPersona: sp.targetPersona,
                  prompt: sp.prompt,
                  isCustomSaved: true,
                })),
              ].map((p) => {
                const isSelected = builtinPreset === p.id;
                return (
                  <div
                    key={p.id}
                    className={`p-3 rounded-xl transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 shadow-sm'
                        : 'bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 text-zinc-800 dark:text-zinc-200'
                    }`}
                    onClick={() => {
                      setBuiltinPreset(p.id);
                      handleSaveAndSync({ builtinPromptPreset: p.id }, '已保存');
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs">{p.name}</span>
                        {('isCustomSaved' in p) && p.isCustomSaved && (
                          <span className="text-[9px] bg-amber-400/20 text-amber-500 font-bold px-1.5 py-0.5 rounded">
                            已存预设
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {('isCustomSaved' in p) && p.isCustomSaved && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSavedCustomPreset(p.id);
                              const updatedList = getSavedCustomPresets();
                              setSavedPresets(updatedList);
                              if (builtinPreset === p.id) {
                                setBuiltinPreset('none');
                                handleSaveAndSync({ builtinPromptPreset: 'none' }, '已删除');
                              } else {
                                setNotice('已删除');
                                setTimeout(() => setNotice(null), 2000);
                              }
                            }}
                            className="p-1 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors mr-1"
                            title="删除预设"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'bg-zinc-900 border-zinc-900 text-white dark:bg-zinc-100 dark:border-zinc-100 dark:text-zinc-900 font-bold' : 'border-zinc-300 dark:border-zinc-700'
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-[10px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                      <span className="font-semibold opacity-90">说明/类型：</span>{p.targetPersona}
                    </p>

                    {/* Custom Builtin Prompt Inputs */}
                    {p.id === 'custom' && isSelected && (
                      <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2" onClick={(e) => e.stopPropagation()}>
                        <div>
                          <label className="text-[10px] font-bold block mb-1 text-zinc-600 dark:text-zinc-400">
                            自定义提示词标题
                          </label>
                          <input
                            type="text"
                            value={customBuiltinTitle}
                            onChange={(e) => {
                              setCustomBuiltinTitle(e.target.value);
                            }}
                            placeholder="例如：冷酷学长协议 / 傲娇黑客等"
                            className="w-full px-3 py-1.5 rounded-lg text-xs font-semibold outline-none border bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold block mb-1 text-zinc-600 dark:text-zinc-400">
                            自定义提示词内容
                          </label>
                          <textarea
                            rows={4}
                            value={customBuiltinContent}
                            onChange={(e) => {
                              setCustomBuiltinContent(e.target.value);
                            }}
                            placeholder="请输入自定义的底层框架/法则提示词内容..."
                            className="w-full p-2.5 rounded-lg text-xs leading-relaxed outline-none border font-mono resize-y bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveAsPreset();
                          }}
                          className="w-full mt-2 text-xs font-bold py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 flex items-center justify-center gap-1.5 transition-all shadow-sm"
                        >
                          <Save className="w-3.5 h-3.5" /> 存为预设
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 3: CHAR PERSONA & AVATAR */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
              <Sparkles className="w-4 h-4" /> CHAR 人设与头像
            </span>
          </div>

          <div className="flex items-center gap-3">
            <label className="w-14 h-14 rounded-2xl bg-white border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center text-2xl font-bold shadow overflow-hidden shrink-0 cursor-pointer hover:opacity-80 transition-opacity relative group" title="点击更换头像">
              {avatar.startsWith('data:') || avatar.startsWith('http') ? (
                <img src={avatar} alt="Char Avatar" className="w-full h-full object-cover" />
              ) : (
                avatar
              )}
              <input type="file" accept="image/*" onChange={handleCharAvatarFile} className="hidden" />
            </label>
            <div className="flex-1 space-y-1">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="姓名"
                  className="w-1/2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                />
                <input
                  type="text"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="备注"
                  className="w-1/2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-zinc-400 block mb-1">CHAR 人设提示词</label>
            <textarea
              rows={4}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs leading-relaxed focus:outline-none"
            />
          </div>
        </div>

        {/* SECTION 4: USER PERSONA & AVATAR */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
              USER 人设与头像 (针对本聊天的专属身份)
            </span>
            <select
              className="bg-white text-zinc-900 border border-zinc-900 dark:border-zinc-100 rounded-lg px-2 py-1 text-[10px] font-bold outline-none max-w-[120px] truncate"
              onChange={(e) => {
                const selected = userPersonas.find((p) => p.id === e.target.value);
                if (selected) {
                  setUserName(selected.name);
                  setUserAvatar(selected.avatar);
                  setUserPrompt(selected.prompt);
                  handleSaveAndSync({
                    userName: selected.name,
                    userAvatar: selected.avatar,
                    userPrompt: selected.prompt
                  });
                }
              }}
            >
              <option value="">从人设库选择...</option>
              {userPersonas.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label className="w-12 h-12 rounded-xl bg-white border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center text-xl font-bold shadow overflow-hidden shrink-0 cursor-pointer hover:opacity-80 transition-opacity relative group" title="点击更换USER头像">
              {userAvatar.startsWith('data:') || userAvatar.startsWith('http') ? (
                <img src={userAvatar} alt="User Avatar" className="w-full h-full object-cover" />
              ) : (
                userAvatar
              )}
              <input type="file" accept="image/*" onChange={handleUserAvatarFile} className="hidden" />
            </label>
            <div className="flex-1 space-y-1">
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="我的名字"
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-bold"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-zinc-400 block mb-1">USER 人设提示词</label>
            <textarea
              rows={2}
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="例如: CHAR的好朋友/同事..."
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs focus:outline-none"
            />
          </div>
        </div>

        {/* SECTION 5: WORLD BOOK BINDING */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
          <div 
            className="flex items-center justify-between cursor-pointer border-b border-zinc-100 dark:border-zinc-800 pb-2"
            onClick={() => setIsWbExpanded(!isWbExpanded)}
          >
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
              <Globe className="w-4 h-4" /> 绑定世界书栏目
            </span>
            {isWbExpanded ? <ChevronUp className="w-4 h-4 text-zinc-900" /> : <ChevronDown className="w-4 h-4 text-zinc-900" />}
          </div>

          {isWbExpanded && (
            <div className="space-y-3 max-h-64 overflow-y-auto pt-1">
              {worldBooks.length === 0 ? (
                <div className="text-[11px] text-zinc-400 p-3 text-center bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                  暂无世界书词条，请在主屏幕『世界书』中创建。
                </div>
              ) : (
                (() => {
                  const groups: Record<string, WorldBookItem[]> = {};
                  worldBooks.forEach((wb) => {
                    const cat = wb.category || '默认分组';
                    if (!groups[cat]) groups[cat] = [];
                    groups[cat].push(wb);
                  });

                  return Object.entries(groups).map(([grpName, items]) => (
                    <div key={grpName} className="space-y-1.5">
                      <div className="text-[11px] font-extrabold text-amber-700 dark:text-amber-400 flex items-center gap-1 mt-1">
                        <Folder className="w-3.5 h-3.5" />
                        <span>{grpName}</span>
                        <span className="text-[10px] text-zinc-400 font-normal">({items.length})</span>
                      </div>
                      <div className="space-y-1.5 pl-1.5 border-l-2 border-amber-300 dark:border-amber-900/60">
                        {items.map((wb) => {
                          const isBound = wb.isGlobal || boundWbIds.includes(wb.id);
                          const posLabel = wb.position === 'front' ? '前' : wb.position === 'back' ? '后' : '中';
                          return (
                            <div
                              key={wb.id}
                              onClick={() => !wb.isGlobal && handleToggleWb(wb.id)}
                              className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                isBound
                                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500'
                                  : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-amber-300'
                              }`}
                            >
                              <div>
                                <div className="font-bold text-xs flex items-center gap-1.5">
                                  {wb.title}
                                  <span className="text-[9px] bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-1 py-0.2 rounded font-mono">
                                    位置:{posLabel}
                                  </span>
                                  {wb.isGlobal && (
                                    <span className="text-[9px] bg-amber-500 text-white font-bold px-1.5 py-0.2 rounded">
                                      全局自动绑定
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-zinc-400 line-clamp-1">{wb.description}</div>
                              </div>
                              <div
                                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                                  isBound ? 'bg-amber-500 border-amber-500 text-white' : 'border-zinc-300'
                                }`}
                              >
                                {isBound && <Check className="w-3 h-3" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()
              )}
            </div>
          )}
        </div>

        {/* SECTION 6: CHAT WALLPAPER */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
          <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300 block border-b border-zinc-100 dark:border-zinc-800 pb-2">
            聊天背景壁纸
          </span>

          <div className="flex items-center gap-3">
            <div className="w-20 h-14 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 overflow-hidden flex items-center justify-center relative">
              {wallpaper ? (
                <img src={wallpaper} alt="Wallpaper" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] text-zinc-400">默认壁纸</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs bg-white border border-zinc-900 text-zinc-900 font-bold px-3 py-1.5 rounded-xl cursor-pointer hover:bg-zinc-50 text-center inline-block transition-colors">
                调用相册换壁纸
                <input type="file" accept="image/*" onChange={handleWallpaperFile} className="hidden" />
              </label>

              {wallpaper && (
                <button
                  onClick={() => {
                    setWallpaper(undefined);
                    handleSaveAndSync({ wallpaper: undefined });
                  }}
                  className="text-xs text-rose-500 hover:underline font-bold"
                >
                  清空现有壁纸
                </button>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 7: PROACTIVE MESSAGING */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-xs">CHAR 主动发消息</div>
              <div className="text-[10px] text-zinc-400">开启后 CHAR 将在挂机时主动给用户发微信</div>
            </div>
            <button
              onClick={() => {
                const next = !proactiveMessaging;
                setProactiveMessaging(next);
                handleSaveAndSync({ proactiveMessaging: next });
              }}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${proactiveMessaging ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-300 dark:bg-zinc-700'}`}
            >
              <div className={`w-5 h-5 bg-white dark:bg-zinc-900 rounded-full transition-transform ${proactiveMessaging ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {proactiveMessaging && (
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-500 font-bold">主动发送频率</span>
              <select
                value={proactiveFrequency}
                onChange={(e: any) => {
                  setProactiveFrequency(e.target.value);
                  handleSaveAndSync({ proactiveFrequency: e.target.value });
                }}
                className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-xs"
              >
                <option value="high">高 (1-3分钟)</option>
                <option value="medium">中 (5-10分钟)</option>
                <option value="low">低 (30分钟)</option>
                <option value="random">随机模式</option>
              </select>
            </div>
          )}
        </div>

        {/* SECTION 8: CHAT & CONTACT ACTIONS (VERTICAL STACK) */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
          <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300 block border-b border-zinc-100 dark:border-zinc-800 pb-2">
            高级管理与操作
          </span>

          {/* 1. 查找记录 */}
          <button
            onClick={() => setShowSearch(true)}
            className="w-full bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs py-3 px-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-zinc-500" />
              <span>查找记录</span>
            </div>
            <span className="text-[10px] text-zinc-400">→</span>
          </button>

          {/* 2. 拉黑联系人 */}
          <div className="w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 font-bold text-xs py-2.5 px-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>拉黑此联系人</span>
            </div>
            <button
              onClick={() => {
                const next = !isBlocked;
                setIsBlocked(next);
                handleSaveAndSync({ isBlocked: next });
              }}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${isBlocked ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-300 dark:bg-zinc-700'}`}
            >
              <div className={`w-5 h-5 bg-white dark:bg-zinc-900 rounded-full transition-transform ${isBlocked ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* 3. 清空记录 */}
          <button
            onClick={() => {
              if (confirm(`确定要清空与【${contact.name}】的全部聊天记录吗？此操作无法撤销。`)) {
                onUpdateContact({ ...contact, messages: [] });
                setNotice('已清空');
                setTimeout(() => setNotice(null), 2000);
              }
            }}
            className="w-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 font-bold text-xs py-3 px-3.5 rounded-xl border border-rose-200 dark:border-rose-900 transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              <span>清空记录</span>
            </div>
            <span className="text-[10px] text-rose-400">清空所有对话</span>
          </button>

          {/* 4. 删除联系人 */}
          <button
            onClick={() => {
              if (confirm(`确定要彻底删除联系人【${contact.name}】吗？聊天记录将被一并清空。`)) {
                onDeleteContact(contact.id);
              }
            }}
            className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 font-extrabold text-xs py-3 px-3.5 rounded-xl border border-rose-200 dark:border-rose-900 transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              <span>删除联系人</span>
            </div>
            <span className="text-[10px] text-rose-400">移除此好友</span>
          </button>
        </div>
      </div>

      {/* SEARCH MODAL */}
      {showSearch && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 w-full max-w-sm border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col h-[70vh]">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-3">
              <span className="font-extrabold text-sm flex items-center gap-1.5">
                <Search className="w-4 h-4 text-zinc-900 dark:text-zinc-100" /> 查找聊天记录
              </span>
              <button onClick={() => setShowSearch(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <input
              type="text"
              placeholder="输入关键字搜索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-none mb-3"
              autoFocus
            />
            
            <div className="flex-1 overflow-y-auto space-y-2">
              {searchQuery.trim() ? (
                contact.messages
                  .filter((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((m) => (
                    <div key={m.id} className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-lg p-2 text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-zinc-700 dark:text-zinc-300">{m.sender}</span>
                        <span className="text-[9px] text-zinc-400">{m.time}</span>
                      </div>
                      <div className="text-zinc-600 dark:text-zinc-400 line-clamp-2">
                        {m.content}
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center text-zinc-400 text-xs mt-10">
                  请输入关键字进行搜索
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
