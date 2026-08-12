import React, { useState } from 'react';
import { ChevronLeft, Plus, Users, UserPlus, Sparkles, Check, Trash2, Image as ImageIcon } from 'lucide-react';
import { WeChatContact } from '../../../types';
import { soundManager } from '../../../utils/audio';

interface CustomNPC {
  id: string;
  name: string;
  avatar: string;
  relation: string;
  prompt: string;
}

interface CreateGroupPageProps {
  existingContacts: WeChatContact[];
  onBack: () => void;
  onCreateGroup: (groupContact: WeChatContact) => void;
}

export const CreateGroupPage: React.FC<CreateGroupPageProps> = ({
  existingContacts,
  onBack,
  onCreateGroup,
}) => {
  const [groupName, setGroupName] = useState('');
  const [groupAvatar, setGroupAvatar] = useState('https://api.dicebear.com/7.x/identicon/svg?seed=Group');
  const [groupPrompt, setGroupPrompt] = useState('这是一个热闹融洽的群聊，成员各自性格鲜明，说话生活化。');
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  
  // Custom NPCs for group
  const [customNPCs, setCustomNPCs] = useState<CustomNPC[]>([]);
  const [showAddNPCModal, setShowAddNPCModal] = useState(false);
  const [npcName, setNpcName] = useState('');
  const [npcAvatar, setNpcAvatar] = useState('https://api.dicebear.com/7.x/avataaars/svg?seed=NPC');
  const [npcRelation, setNpcRelation] = useState('');
  const [npcPrompt, setNpcPrompt] = useState('');

  const toggleSelectContact = (id: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddCustomNPC = () => {
    if (!npcName.trim()) {
      alert('请填写NPC名字！');
      return;
    }
    soundManager.playTap();
    const newNPC: CustomNPC = {
      id: `npc-${Date.now()}`,
      name: npcName.trim(),
      avatar: npcAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=NPC',
      relation: npcRelation.trim() || '群成员',
      prompt: npcPrompt.trim() || '性格独特的群友。',
    };
    setCustomNPCs((prev) => [...prev, newNPC]);
    setShowAddNPCModal(false);
    setNpcName('');
    setNpcRelation('');
    setNpcPrompt('');
  };

  const handleRemoveNPC = (id: string) => {
    soundManager.playTap();
    setCustomNPCs((prev) => prev.filter((item) => item.id !== id));
  };

  const handleGroupAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setGroupAvatar(evt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNpcAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setNpcAvatar(evt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!groupName.trim()) {
      alert('请填写群聊名称！');
      return;
    }
    soundManager.playTap();

    const selectedContactsNames = existingContacts
      .filter((c) => selectedContactIds.includes(c.id))
      .map((c) => c.name);

    const npcNames = customNPCs.map((n) => `${n.name}(${n.relation})`);
    const allMembers = [...selectedContactsNames, ...npcNames, '我'];

    const npcSystemText = customNPCs
      .map((n) => `【NPC成员: ${n.name} (${n.relation})】: ${n.prompt}`)
      .join('\n');

    const combinedPrompt = `${groupPrompt.trim()}\n\n【群聊成员名单】:\n${allMembers.join(', ')}\n\n${npcSystemText}`;

    const newGroupContact: WeChatContact = {
      id: `grp-${Date.now()}`,
      name: groupName.trim(),
      avatar: groupAvatar || '👥',
      isGroup: true,
      groupMembers: allMembers,
      systemPrompt: combinedPrompt,
      userPrompt: '群成员之一',
      modelName: 'gemini-2.5-flash',
      boundWorldBookIds: [],
      messages: [], // Starts with empty messages array so first message is sent by user!
      lastMessage: '群聊已创建',
      lastTime: '刚刚',
      memoryRounds: 10,
    };

    onCreateGroup(newGroupContact);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f1f1f1] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden animate-fade-in relative">
      {/* Top Header */}
      <div className="bg-[#edf0f2] dark:bg-zinc-900 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between sticky top-0 z-20">
        <button onClick={onBack} className="flex items-center text-zinc-800 dark:text-zinc-200 text-xs font-semibold">
          <ChevronLeft className="w-5 h-5 -ml-1 text-emerald-600" />
          返回
        </button>
        <span className="font-bold text-sm">创建新群聊</span>
        <div className="w-8" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Basic Group Info */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
          <label className="text-xs font-bold text-zinc-500 block">群聊基本设置</label>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-2xl font-bold shadow overflow-hidden shrink-0">
              {groupAvatar.startsWith('data:') || groupAvatar.startsWith('http') ? (
                <img src={groupAvatar} alt="Group Avatar" className="w-full h-full object-cover" />
              ) : (
                groupAvatar
              )}
            </div>
            <div className="flex-1 space-y-1">
              <input
                type="text"
                placeholder="群聊名称 (例如: 暴富小分队)"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <label className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 cursor-pointer hover:underline">
                <ImageIcon className="w-3 h-3" /> 自定义群头像 (相册选择)
                <input type="file" accept="image/*" onChange={handleGroupAvatarFile} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        {/* Group World Prompt */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2">
          <label className="text-xs font-bold text-zinc-500 block flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> 群聊场景与世界设定
          </label>
          <textarea
            rows={3}
            placeholder="描述群聊背景、聊天氛围、常见话题..."
            value={groupPrompt}
            onChange={(e) => setGroupPrompt(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Invite Existing Contacts */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-500 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-500" /> 从已有联系人拉入群聊 ({selectedContactIds.length})
            </label>
          </div>

          {existingContacts.length === 0 ? (
            <div className="text-xs text-zinc-400 py-2 text-center">暂无已添加的联系人，可以下方添加自定义NPC</div>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {existingContacts.map((c) => (
                <div
                  key={c.id}
                  onClick={() => toggleSelectContact(c.id)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    selectedContactIds.includes(c.id)
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500'
                      : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs overflow-hidden">
                      {c.avatar.startsWith('http') || c.avatar.startsWith('data:') ? (
                        <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" />
                      ) : (
                        c.avatar
                      )}
                    </div>
                    <span className="font-bold text-xs">{c.remark ? `${c.remark} (${c.name})` : c.name}</span>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      selectedContactIds.includes(c.id) ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-zinc-300'
                    }`}
                  >
                    {selectedContactIds.includes(c.id) && <Check className="w-3 h-3" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Custom Added NPCs */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-500 flex items-center gap-1">
              <UserPlus className="w-3.5 h-3.5 text-purple-500" /> 自定义添加NPC成员 ({customNPCs.length})
            </label>
            <button
              onClick={() => setShowAddNPCModal(true)}
              className="text-xs bg-purple-600 hover:bg-purple-500 text-white font-bold px-3 py-1 rounded-xl flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> 添加NPC
            </button>
          </div>

          {customNPCs.length === 0 ? (
            <div className="text-xs text-zinc-400 py-3 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
              未添加自定义NPC，点击右上角 “+ 添加NPC” 补充额外群成员
            </div>
          ) : (
            <div className="space-y-2">
              {customNPCs.map((npc) => (
                <div key={npc.id} className="p-2.5 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs overflow-hidden">
                      {npc.avatar.startsWith('data:') || npc.avatar.startsWith('http') ? (
                        <img src={npc.avatar} alt={npc.name} className="w-full h-full object-cover" />
                      ) : (
                        npc.avatar
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        {npc.name} <span className="text-[10px] bg-purple-100 text-purple-700 font-medium px-1.5 py-0.2 rounded">{npc.relation}</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 line-clamp-1">{npc.prompt}</div>
                    </div>
                  </div>
                  <button onClick={() => handleRemoveNPC(npc.id)} className="text-zinc-400 hover:text-rose-500 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-sm py-3 rounded-2xl shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5" />
          立即创建群聊
        </button>
      </div>

      {/* Modal: Add Custom NPC */}
      {showAddNPCModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 w-full max-w-xs border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-2xl animate-scale-up">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">添加自定义NPC群成员</h3>

            <div className="space-y-2">
              <div>
                <label className="text-[10px] font-bold text-zinc-400">NPC 姓名 *</label>
                <input
                  type="text"
                  placeholder="例如: 班长 / 阿强"
                  value={npcName}
                  onChange={(e) => setNpcName(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400">NPC 群内身份 / 人物关系</label>
                <input
                  type="text"
                  placeholder="例如: 毒舌发小 / 活跃群主"
                  value={npcRelation}
                  onChange={(e) => setNpcRelation(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400">头像 (Emoji 或 相册上传)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="头像 URL"
                    value={npcAvatar}
                    onChange={(e) => setNpcAvatar(e.target.value)}
                    className="w-16 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-xs text-center"
                  />
                  <label className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded cursor-pointer text-emerald-600 font-bold">
                    相册选择
                    <input type="file" accept="image/*" onChange={handleNpcAvatarFile} className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400">NPC 人设描述</label>
                <textarea
                  rows={2}
                  placeholder="说话爱吐槽，热心肠..."
                  value={npcPrompt}
                  onChange={(e) => setNpcPrompt(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={() => setShowAddNPCModal(false)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-600"
              >
                取消
              </button>
              <button
                onClick={handleAddCustomNPC}
                className="px-3 py-1.5 text-xs bg-purple-600 text-white font-bold rounded-lg"
              >
                保存NPC
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
