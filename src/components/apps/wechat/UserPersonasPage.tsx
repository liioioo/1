import React, { useState } from 'react';
import { ChevronLeft, User, Settings, Trash2, Check, FileText } from 'lucide-react';
import { UserPersona } from '../../../types';
import { TopToast } from '../../TopToast';

interface UserPersonasPageProps {
  personas: UserPersona[];
  onBack: () => void;
  onDeletePersona: (id: string) => void;
  onSavePersona: (persona: UserPersona) => void;
  onFileUpload: (file: File, targetSetter: (val: string) => void) => void;
}

export const UserPersonasPage: React.FC<UserPersonasPageProps> = ({
  personas,
  onBack,
  onDeletePersona,
  onSavePersona,
  onFileUpload
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formName, setFormName] = useState('');
  const [formAvatar, setFormAvatar] = useState('🧑‍💻');
  const [formPrompt, setFormPrompt] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const openNew = () => {
    setEditingId(null);
    setFormName('');
    setFormAvatar('🧑‍💻');
    setFormPrompt('');
    setShowModal(true);
  };

  const openEdit = (p: UserPersona) => {
    setEditingId(p.id);
    setFormName(p.name);
    setFormAvatar(p.avatar);
    setFormPrompt(p.prompt);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formName.trim()) {
      alert('请填写人设名称');
      return;
    }
    const persona: UserPersona = {
      id: editingId || `up-${Date.now()}`,
      name: formName.trim(),
      avatar: formAvatar,
      prompt: formPrompt.trim(),
    };
    onSavePersona(persona);
    setShowModal(false);
    setNotice('已保存');
    setTimeout(() => setNotice(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f1f1f1] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden animate-fade-in relative">
      <TopToast message={notice} />
      <div className="bg-[#edf0f2] dark:bg-zinc-900 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between sticky top-0 z-20">
        <button onClick={onBack} className="flex items-center text-zinc-800 dark:text-zinc-200 text-xs font-semibold">
          <ChevronLeft className="w-5 h-5 -ml-1 text-zinc-900 dark:text-zinc-100" />
          返回
        </button>
        <span className="font-bold text-sm">USER 人设库</span>
        <button onClick={openNew} className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
          添加
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {personas.map((p) => (
          <div 
            key={p.id}
            className="p-4 rounded-2xl border transition-all flex flex-col gap-3 shadow-sm bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white border border-zinc-900 text-zinc-900 flex items-center justify-center font-bold text-xl shadow-sm overflow-hidden">
                  {p.avatar.startsWith('http') || p.avatar.startsWith('data:') ? (
                    <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    p.avatar
                  )}
                </div>
                <div>
                  <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    {p.name}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{p.id}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(p)} className="p-1.5 text-zinc-400 hover:text-indigo-500 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                  <Settings className="w-4 h-4" />
                </button>
                <button onClick={() => onDeletePersona(p.id)} className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 p-2 rounded-xl text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
              {p.prompt || '暂无详细设定...'}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col">
          <div className="bg-[#edf0f2] dark:bg-zinc-900 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <button onClick={() => setShowModal(false)} className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">取消</button>
            <span className="font-bold text-sm">{editingId ? '编辑 USER 人设' : '新增 USER 人设'}</span>
            <button onClick={handleSave} className="text-zinc-900 dark:text-zinc-100 text-xs font-bold">完成</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 space-y-3">
              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">USER 姓名</label>
                <input 
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="如: 用户"
                  className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <div className="w-12 h-12 rounded-xl bg-white border border-zinc-200 dark:border-zinc-800 text-2xl flex items-center justify-center shadow-sm shrink-0 overflow-hidden">
                  {formAvatar.startsWith('data:') || formAvatar.startsWith('http') ? (
                    <img src={formAvatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    formAvatar
                  )}
                </div>
                <div className="flex-1">
                  <label className="text-xs bg-white border border-zinc-900 text-zinc-900 font-bold px-3 py-1.5 rounded-lg border-zinc-200 flex justify-center cursor-pointer hover:bg-zinc-50">
                    从本地相册选择头像
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (reader.result) setFormAvatar(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }} 
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-zinc-400">USER 人设 Prompt</label>
                  <label className="text-[10px] text-indigo-500 hover:underline cursor-pointer flex items-center gap-1 font-semibold">
                    <FileText className="w-3 h-3" />
                    导入文件
                    <input 
                      type="file" 
                      accept=".txt,.docx" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onFileUpload(file, setFormPrompt);
                      }} 
                      className="hidden" 
                    />
                  </label>
                </div>
                <textarea 
                  rows={6}
                  placeholder="详细的 USER 设定..."
                  value={formPrompt}
                  onChange={(e) => setFormPrompt(e.target.value)}
                  className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-zinc-900 dark:text-zinc-100 focus:outline-none resize-none leading-relaxed text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
