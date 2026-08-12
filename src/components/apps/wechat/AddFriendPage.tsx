import React, { useState } from 'react';
import { ChevronLeft, Upload, FileText, Sparkles, Check, Image as ImageIcon, Camera, Zap, ChevronDown, ChevronUp, Save, Trash2 } from 'lucide-react';
import { WeChatContact } from '../../../types';
import { soundManager } from '../../../utils/audio';
import { BUILTIN_PROMPTS, getSavedCustomPresets, saveCustomPresetItem, deleteSavedCustomPreset } from '../../../constants/builtinPrompts';
import { TopToast } from '../../TopToast';

interface AddFriendPageProps {
  onBack: () => void;
  onAddContact: (contact: WeChatContact) => void;
  onFileUpload: (file: File, targetSetter: (val: string) => void) => void;
  userDefaultPrompt: string;
  userPersonas: Array<{ id: string; name: string; avatar: string; prompt: string }>;
  userProfile: { name: string; avatar: string; accountId: string };
}

export const AddFriendPage: React.FC<AddFriendPageProps> = ({
  onBack,
  onAddContact,
  onFileUpload,
  userDefaultPrompt,
  userPersonas,
  userProfile
}) => {
  const [name, setName] = useState('');
  const [remark, setRemark] = useState('');
  const [avatar, setAvatar] = useState('https://api.dicebear.com/7.x/avataaars/svg?seed=Char');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [builtinPreset, setBuiltinPreset] = useState<string>('none');
  const [customBuiltinTitle, setCustomBuiltinTitle] = useState('');
  const [customBuiltinContent, setCustomBuiltinContent] = useState('');
  const [savedPresets, setSavedPresets] = useState(getSavedCustomPresets());
  const [isBuiltinFolded, setIsBuiltinFolded] = useState(true);
  const [userPrompt, setUserPrompt] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const handleSaveAsPreset = () => {
    if (!customBuiltinTitle.trim() || !customBuiltinContent.trim()) {
      setNotice('请先填写自定义提示词标题和内容！');
      setTimeout(() => setNotice(null), 2500);
      return;
    }
    const savedItem = saveCustomPresetItem(customBuiltinTitle, customBuiltinContent);
    setSavedPresets(getSavedCustomPresets());
    setBuiltinPreset(savedItem.id);
    setNotice('已保存');
    setTimeout(() => setNotice(null), 2000);
  };

  const [userNameInChat, setUserNameInChat] = useState(userProfile.name);
  const [userAvatarInChat, setUserAvatarInChat] = useState(userProfile.avatar);

  const handleSelectPersonaTemplate = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = e.target.value;
    if (!pId) return;
    const p = userPersonas.find(p => p.id === pId);
    if (p) {
      soundManager.playTap();
      setUserNameInChat(p.name);
      setUserAvatarInChat(p.avatar);
      setUserPrompt(p.prompt);
      setNotice('已加载');
      setTimeout(() => setNotice(null), 2000);
    }
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        if (url) {
          setAvatar(url);
          setNotice('已导入');
          setTimeout(() => setNotice(null), 2000);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocxImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file, (extracted) => {
        setSystemPrompt(extracted);
      });
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      alert('请填写好友姓名或昵称！');
      return;
    }
    soundManager.playTap();

    const newContact: WeChatContact = {
      id: `c-${Date.now()}`,
      name: name.trim(),
      remark: remark.trim() || undefined,
      avatar: avatar || '👧',
      systemPrompt: systemPrompt.trim() || '你是一个性格生活化、真诚友好的人。',
      builtinPromptPreset: builtinPreset,
      customBuiltinPromptTitle: customBuiltinTitle.trim() || undefined,
      customBuiltinPromptContent: customBuiltinContent.trim() || undefined,
      userPrompt: userPrompt.trim(),
      userName: userNameInChat.trim() || userProfile.name,
      userAvatar: userAvatarInChat || userProfile.avatar,
      modelName: 'gemini-2.0-flash', 
      boundWorldBookIds: [],
      messages: [], 
      lastMessage: '尚未开始聊天',
      lastTime: '刚刚',
      memoryRounds: 10,
    };

    onAddContact(newContact);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f1f1f1] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden animate-fade-in font-sans">
      {/* Top Header */}
      <div className="bg-white dark:bg-zinc-900 px-4 py-3 border-b border-zinc-900 dark:border-zinc-800 flex items-center justify-between sticky top-0 z-20">
        <button onClick={onBack} className="flex items-center text-zinc-900 dark:text-zinc-100 text-xs font-bold">
          <ChevronLeft className="w-5 h-5 -ml-1" />
          返回
        </button>
        <span className="font-black text-sm uppercase tracking-tighter">添加新好友</span>
        <div className="w-8" />
      </div>

      <TopToast message={notice} />

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* Avatar Section */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-900 dark:border-zinc-800 shadow-sm space-y-3">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">好友头像设置</label>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white border-2 border-zinc-900 text-zinc-900 flex items-center justify-center text-3xl font-bold shadow-sm overflow-hidden shrink-0">
              {avatar.startsWith('data:') || avatar.startsWith('http') ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                avatar
              )}
            </div>

            <div className="flex-1 space-y-2">
              <label className="bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 cursor-pointer inline-flex transition-all shadow-sm active:scale-95">
                <ImageIcon className="w-3.5 h-3.5" />
                上传本地头像
                <input type="file" accept="image/*" onChange={handleAvatarFileChange} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-900 dark:border-zinc-800 shadow-sm space-y-3">
          <div>
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">好友姓名 / CHAR名称 *</label>
            <input
              type="text"
              placeholder="请输入名称..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-zinc-900 transition-all"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">设置备注</label>
            <input
              type="text"
              placeholder="可选备注..."
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-zinc-900 transition-all"
            />
          </div>
        </div>

        {/* Builtin Prompt Selector (Folded by default) */}
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
              <div className="grid grid-cols-2 gap-2">
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
                      onClick={() => {
                        setBuiltinPreset(p.id);
                        setNotice('已保存');
                        setTimeout(() => setNotice(null), 2000);
                      }}
                      className={`p-2.5 rounded-xl text-left flex flex-col justify-between transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 shadow-sm'
                          : 'bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-extrabold text-[11px] truncate">{p.name}</div>
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
                              }
                              setNotice('已删除');
                              setTimeout(() => setNotice(null), 2000);
                            }}
                            className="p-1 hover:bg-rose-500/20 text-rose-400 rounded transition-colors"
                            title="删除预设"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div className={`text-[9px] mt-1 line-clamp-2 ${isSelected ? 'text-zinc-500 dark:text-zinc-400 font-medium' : 'text-zinc-400'}`}>
                        {p.shortDesc}
                      </div>
                    </div>
                  );
                })}
              </div>

              {builtinPreset === 'custom' && (
                <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
                      自定义提示词标题
                    </label>
                    <input
                      type="text"
                      value={customBuiltinTitle}
                      onChange={(e) => setCustomBuiltinTitle(e.target.value)}
                      placeholder="例如：冷酷学长协议 / 傲娇黑客等"
                      className="w-full px-3 py-1.5 rounded-lg text-xs font-semibold outline-none border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
                      自定义提示词内容
                    </label>
                    <textarea
                      rows={3}
                      value={customBuiltinContent}
                      onChange={(e) => setCustomBuiltinContent(e.target.value)}
                      placeholder="请输入自定义的底层框架/法则提示词内容..."
                      className="w-full p-2.5 rounded-lg text-xs leading-relaxed outline-none border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-mono resize-y"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveAsPreset}
                    className="w-full text-xs font-bold py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" /> 存为预设
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Char Prompt */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-900 dark:border-zinc-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> 人设逻辑与口吻导轨
            </label>
            <label className="text-[9px] bg-white text-zinc-900 font-black px-2.5 py-1.5 rounded-lg border border-zinc-900 flex items-center gap-1 cursor-pointer hover:bg-zinc-50 transition-all shadow-sm">
              <FileText className="w-3 h-3" /> 导入 DOCX/TXT
              <input type="file" accept=".txt,.docx" onChange={handleDocxImport} className="hidden" />
            </label>
          </div>

          <textarea
            rows={5}
            placeholder="描述 CHAR 的性格、身份、口吻细节..."
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-xs font-bold leading-relaxed focus:outline-none focus:border-zinc-900 transition-all resize-none"
          />
        </div>

        {/* User Persona for this Chat (针对本聊天的专属身份) */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-900 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight flex items-center gap-1.5">
              USER 人设与头像 (针对本聊天的专属身份)
            </label>
            <select 
              onChange={handleSelectPersonaTemplate}
              className="bg-white border border-zinc-900 text-zinc-900 text-[10px] font-bold px-2 py-1 rounded-lg focus:outline-none"
            >
              <option value="">从人设库选择...</option>
              {userPersonas.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4">
             <div className="relative group">
                <div className="w-14 h-14 rounded-2xl bg-white border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center font-bold text-2xl shrink-0 shadow-sm overflow-hidden">
                  {userAvatarInChat.startsWith('http') || userAvatarInChat.startsWith('data:') ? (
                    <img src={userAvatarInChat} alt="user avatar" className="w-full h-full object-cover" />
                  ) : (
                    userAvatarInChat
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity bg-black/20 rounded-2xl">
                  <Camera className="w-4 h-4 text-white" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => setUserAvatarInChat(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }} 
                    className="hidden" 
                  />
                </label>
             </div>
             <div className="flex-1 space-y-1.5">
                <input 
                  type="text" 
                  value={userNameInChat}
                  onChange={(e) => setUserNameInChat(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none"
                  placeholder="USER 聊天昵称"
                />
                <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                   <ImageIcon className="w-3 h-3" /> 从相册更换USER头像
                </div>
             </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">USER 人设提示词</label>
            <textarea
              rows={3}
              placeholder="定义你在此段关系中的身份..."
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-xs font-bold focus:outline-none focus:border-zinc-900 transition-all resize-none"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-white border-2 border-zinc-900 text-zinc-900 font-black text-sm py-4 rounded-2xl shadow-sm hover:bg-zinc-50 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
        >
          <Check className="w-5 h-5" />
          确认添加并开始聊天
        </button>
      </div>
    </div>
  );
};
