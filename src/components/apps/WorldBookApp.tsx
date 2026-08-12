import React, { useState, useRef, useEffect } from 'react';
import { TopToast } from '../TopToast';
import {
  Globe,
  Plus,
  Search,
  X,
  Edit3,
  FolderPlus,
  Upload,
  Globe2,
  Trash2,
  Layers,
  ArrowUpDown,
  BookMarked,
  ChevronLeft,
  Check,
  Folder,
  FileText,
  Copy,
} from 'lucide-react';
import { WorldBookItem } from '../../types';
import { INITIAL_WORLD_BOOKS } from '../../data';
import { soundManager } from '../../utils/audio';

export const WorldBookApp: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  // Load saved items and filter out legacy demo items (wb-1, wb-2, wb-3)
  const [items, setItems] = useState<WorldBookItem[]>(() => {
    try {
      const saved = localStorage.getItem('world_books');
      if (saved) {
        const parsed: WorldBookItem[] = JSON.parse(saved);
        return parsed.filter((item) => !['wb-1', 'wb-2', 'wb-3'].includes(item.id));
      }
      return INITIAL_WORLD_BOOKS.filter((item) => !['wb-1', 'wb-2', 'wb-3'].includes(item.id));
    } catch {
      return [];
    }
  });

  const [groups, setGroups] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('world_book_groups');
      return saved ? JSON.parse(saved) : ['默认分组'];
    } catch {
      return ['默认分组'];
    }
  });

  const [activeGroup, setActiveGroup] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const [showCreateBook, setShowCreateBook] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields for World Book Creation / Editing
  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('默认分组');
  const [position, setPosition] = useState<'front' | 'middle' | 'back'>('middle');
  const [content, setContent] = useState('');
  const [isGlobal, setIsGlobal] = useState(false);
  const [importStatus, setImportStatus] = useState('');

  // Dedicated Independent Viewing Page State
  const [viewingItem, setViewingItem] = useState<WorldBookItem | null>(null);
  const [copiedNotice, setCopiedNotice] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const detailFileInputRef = useRef<HTMLInputElement>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('world_books', JSON.stringify(items));
    } catch (e) {
      console.error(e);
    }
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem('world_book_groups', JSON.stringify(groups));
    } catch (e) {
      console.error(e);
    }
  }, [groups]);

  // Keep viewingItem in sync with items
  useEffect(() => {
    if (viewingItem) {
      const updated = items.find((i) => i.id === viewingItem.id);
      if (updated) {
        setViewingItem(updated);
      }
    }
  }, [items]);

  // Save new Group
  const handleSaveGroup = () => {
    const trimmed = newGroupName.trim();
    if (!trimmed) return;
    if (!groups.includes(trimmed)) {
      soundManager.playTap();
      const nextGroups = [...groups, trimmed];
      setGroups(nextGroups);
      setSelectedCategory(trimmed);
      setActiveGroup(trimmed);
    }
    setNewGroupName('');
    setShowCreateGroup(false);
  };

  // Open modal for Create World Book
  const handleOpenCreateBook = () => {
    soundManager.playTap();
    setEditingId(null);
    setTitle('');
    setSelectedCategory(activeGroup !== 'all' ? activeGroup : groups[0] || '默认分组');
    setPosition('middle');
    setContent('');
    setIsGlobal(false);
    setImportStatus('');
    setShowCreateBook(true);
  };

  // Open modal for Edit World Book
  const handleOpenEditBook = (item: WorldBookItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundManager.playTap();
    setEditingId(item.id);
    setTitle(item.title);
    setSelectedCategory(item.category || groups[0] || '默认分组');
    setPosition(item.position || 'middle');
    setContent(item.description);
    setIsGlobal(!!item.isGlobal);
    setImportStatus('');
    setShowCreateBook(true);
  };

  // File Upload Handler (.txt / .docx)
  const processUploadedFile = (
    file: File,
    onSuccess: (text: string, statusMsg: string) => void
  ) => {
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = (event.target?.result as string) || '';
        onSuccess(text, '已导入');
      };
      reader.readAsText(file, 'utf-8');
    } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const decoder = new TextDecoder('utf-8');
        const rawText = decoder.decode(arrayBuffer);

        const matches = rawText.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
        let extracted = '';
        if (matches && matches.length > 0) {
          extracted = matches.map((m) => m.replace(/<[^>]+>/g, '')).join(' ');
        } else {
          extracted = rawText.replace(/[\x00-\x09\x0B-\x1F\x7F-\x9F]/g, '');
        }

        const cleanText = extracted.trim();
        onSuccess(cleanText, '已导入');
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert('请选择 .txt 或 .docx 格式的文件！');
    }
  };

  const handleModalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processUploadedFile(file, (text, statusMsg) => {
      setContent(text);
      setImportStatus(statusMsg);
      setTimeout(() => setImportStatus(''), 3000);
    });
    if (e.target) e.target.value = '';
  };

  const handleDetailFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !viewingItem) return;
    processUploadedFile(file, (text) => {
      updateSingleItem(viewingItem.id, { description: text });
    });
    if (e.target) e.target.value = '';
  };

  // Save or Update World Book Item from Modal
  const handleSaveBook = () => {
    if (!title.trim()) {
      alert('请输入世界书标题！');
      return;
    }
    if (!content.trim()) {
      alert('请输入或导入世界书设定内容！');
      return;
    }

    soundManager.playTap();
    if (editingId) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? {
                ...item,
                title: title.trim(),
                category: selectedCategory,
                position,
                description: content.trim(),
                isGlobal,
                updatedAt: new Date().toISOString().split('T')[0],
              }
            : item
        )
      );
      if (viewingItem && viewingItem.id === editingId) {
        setViewingItem({
          ...viewingItem,
          title: title.trim(),
          category: selectedCategory,
          position,
          description: content.trim(),
          isGlobal,
          updatedAt: new Date().toISOString().split('T')[0],
        });
      }
    } else {
      const newItem: WorldBookItem = {
        id: `wb-${Date.now()}`,
        title: title.trim(),
        category: selectedCategory,
        position,
        description: content.trim(),
        isGlobal,
        updatedAt: new Date().toISOString().split('T')[0],
      };
      setItems((prev) => [newItem, ...prev]);
      setViewingItem(newItem);
    }

    setShowCreateBook(false);
  };

  // Helper to update fields of a single item directly on the independent page
  const updateSingleItem = (id: string, updates: Partial<WorldBookItem>) => {
    const updatedDate = new Date().toISOString().split('T')[0];
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates, updatedAt: updatedDate } : item))
    );
    if (viewingItem && viewingItem.id === id) {
      setViewingItem((prev) => (prev ? { ...prev, ...updates, updatedAt: updatedDate } : null));
    }
  };

  // Delete World Book Item
  const handleDeleteBook = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm('确定要彻底删除这条世界书词条吗？')) {
      soundManager.playTap();
      setItems((prev) => prev.filter((item) => item.id !== id));
      if (viewingItem?.id === id) setViewingItem(null);
    }
  };

  // Delete Group
  const handleDeleteGroup = (grp: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`确定要删除分组【${grp}】吗？分组下的词条将自动转移至『默认分组』。`)) {
      soundManager.playTap();
      setGroups((prev) => prev.filter((g) => g !== grp));
      setItems((prev) =>
        prev.map((item) => (item.category === grp ? { ...item, category: '默认分组' } : item))
      );
      if (activeGroup === grp) setActiveGroup('all');
    }
  };

  // Filtered items
  const filteredItems = items.filter((item) => {
    const matchesGroup = activeGroup === 'all' || item.category === activeGroup;
    const matchesQuery =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesGroup && matchesQuery;
  });

  const getPositionBadge = (pos?: 'front' | 'middle' | 'back') => {
    switch (pos) {
      case 'front':
        return (
          <span className="text-[10px] bg-white text-black border border-black px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
            <ArrowUpDown className="w-2.5 h-2.5 rotate-180 text-black" /> 位置: 前 (优先调取)
          </span>
        );
      case 'back':
        return (
          <span className="text-[10px] bg-zinc-50 text-zinc-600 border border-zinc-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
            <ArrowUpDown className="w-2.5 h-2.5 text-zinc-500" /> 位置: 后 (末尾补充)
          </span>
        );
      case 'middle':
      default:
        return (
          <span className="text-[10px] bg-white text-black border border-zinc-300 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
            <Layers className="w-2.5 h-2.5 text-black" /> 位置: 中 (常规顺位)
          </span>
        );
    }
  };

  // =========================================================
  // VIEW 2: INDEPENDENT PAGE FOR VIEWING / EDITING A WORLD BOOK
  // =========================================================
  if (viewingItem) {
    return (
      <div className="w-full h-full bg-white text-black flex flex-col font-sans select-none overflow-hidden animate-fade-in">
        {/* Top Header Navigation */}
        <div className="bg-white px-4 py-3 border-b border-zinc-200 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
          <button
            onClick={() => setViewingItem(null)}
            className="flex items-center gap-1 text-xs font-extrabold text-black bg-white hover:bg-zinc-50 border border-black px-2.5 py-1.5 rounded-xl cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-black" />
            返回词条列表
          </button>

          <span className="font-extrabold text-sm text-black max-w-[180px] truncate">
            {viewingItem.title}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenEditBook(viewingItem)}
              className="flex items-center gap-1 bg-white hover:bg-zinc-50 text-black border border-black text-xs px-2.5 py-1.5 rounded-xl font-extrabold transition-all active:scale-95 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              编辑
            </button>
            <button
              onClick={() => handleDeleteBook(viewingItem.id)}
              className="flex items-center gap-1 bg-white hover:bg-zinc-50 text-rose-600 border border-rose-300 text-xs px-2.5 py-1.5 rounded-xl font-extrabold transition-all active:scale-95 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              删除
            </button>
          </div>
        </div>

        {/* Independent Page Body */}
        <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full space-y-4">
          {/* Section 1: Title & Badge Overview Card */}
          <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs px-3 py-1 rounded-full bg-zinc-50 text-black font-extrabold border border-black flex items-center gap-1">
                <Folder className="w-3.5 h-3.5 text-black" />
                {viewingItem.category || '默认分组'}
              </span>

              <div className="flex items-center gap-2">
                {getPositionBadge(viewingItem.position)}
                {viewingItem.isGlobal && (
                  <span className="text-[10px] bg-white text-emerald-700 border border-emerald-500 px-2 py-0.5 rounded-full font-extrabold flex items-center gap-1">
                    <Globe2 className="w-2.5 h-2.5 text-emerald-600" /> 全局自动绑定
                  </span>
                )}
              </div>
            </div>

            <h1 className="text-xl font-black text-black tracking-tight leading-snug">
              {viewingItem.title}
            </h1>

            <div className="text-[11px] text-zinc-500 flex items-center justify-between border-t border-zinc-100 pt-2.5">
              <span>词条编号: {viewingItem.id}</span>
              <span>更新时间: {viewingItem.updatedAt}</span>
            </div>
          </div>

          {/* Section 2: Interactive Property Control Card */}
          <div className="bg-white rounded-2xl p-4 border border-zinc-200 shadow-xs space-y-3">
            <div className="text-xs font-bold text-black flex items-center gap-1.5 border-b border-zinc-100 pb-2">
              <Layers className="w-4 h-4 text-black" />
              词条属性与全局调取规则 (点击即可直接修改)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 1. 更换分组 */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-500 block">所属分组</label>
                <select
                  value={viewingItem.category || '默认分组'}
                  onChange={(e) => updateSingleItem(viewingItem.id, { category: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-black font-bold focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
                >
                  {groups.map((grp) => (
                    <option key={grp} value={grp}>
                      {grp}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. 位置顺序 (前中后) */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-500 block">调用优先级 (位置)</label>
                <div className="flex bg-zinc-50 p-0.5 rounded-xl border border-zinc-200">
                  <button
                    onClick={() => updateSingleItem(viewingItem.id, { position: 'front' })}
                    className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                      viewingItem.position === 'front'
                        ? 'bg-white text-black border-2 border-black font-extrabold shadow-2xs'
                        : 'text-zinc-600 hover:text-black'
                    }`}
                  >
                    前 (优先)
                  </button>
                  <button
                    onClick={() => updateSingleItem(viewingItem.id, { position: 'middle' })}
                    className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                      viewingItem.position === 'middle' || !viewingItem.position
                        ? 'bg-white text-black border-2 border-black font-extrabold shadow-2xs'
                        : 'text-zinc-600 hover:text-black'
                    }`}
                  >
                    中 (常规)
                  </button>
                  <button
                    onClick={() => updateSingleItem(viewingItem.id, { position: 'back' })}
                    className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                      viewingItem.position === 'back'
                        ? 'bg-white text-black border-2 border-black font-extrabold shadow-2xs'
                        : 'text-zinc-600 hover:text-black'
                    }`}
                  >
                    后 (末尾)
                  </button>
                </div>
              </div>
            </div>

            {/* 3. 全局自动绑定 开关 */}
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-extrabold text-black flex items-center gap-1.5">
                  <Globe2 className="w-3.5 h-3.5 text-black" />
                  全局自动绑定 (全应用 AI 聊天共享生效)
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  开启后，该世界书词条无需在单个联系人设置中手动勾选，所有聊天自动包含此设定。
                </div>
              </div>
              <button
                type="button"
                onClick={() => updateSingleItem(viewingItem.id, { isGlobal: !viewingItem.isGlobal })}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ml-2 ${
                  viewingItem.isGlobal ? 'bg-black' : 'bg-zinc-300'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform shadow-xs ${
                    viewingItem.isGlobal ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Section 3: World Book Content Details */}
          <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
              <span className="text-xs font-extrabold text-black flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-black" />
                完整设定与概念文本
              </span>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={detailFileInputRef}
                  accept=".txt,.docx,.doc"
                  onChange={handleDetailFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => detailFileInputRef.current?.click()}
                  className="text-[11px] bg-white hover:bg-zinc-50 text-black font-extrabold border border-black px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3 h-3 text-black" />
                  重新导入文件
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(viewingItem.description);
                    setCopiedNotice(true);
                    setTimeout(() => setCopiedNotice(false), 2000);
                  }}
                  className="text-[11px] bg-white hover:bg-zinc-50 text-black font-extrabold border border-zinc-300 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                >
                  {copiedNotice ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-zinc-500" />}
                  {copiedNotice ? '已复制' : '复制全文'}
                </button>
              </div>
            </div>

            {/* Editable Textarea in Independent View */}
            <div className="space-y-2">
              <textarea
                rows={12}
                value={viewingItem.description}
                onChange={(e) => updateSingleItem(viewingItem.id, { description: e.target.value })}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-xs text-black leading-relaxed focus:outline-none focus:ring-2 focus:ring-black resize-y font-sans select-text"
                placeholder="编辑设定内容..."
              />
              <div className="flex justify-between text-[10px] text-zinc-400">
                <span>提示: 在框内修改内容将自动实时保存</span>
                <span>当前共 {viewingItem.description.length} 字</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // VIEW 1: MAIN LIST VIEW FOR WORLD BOOK APP
  // =========================================================
  return (
    <div className="w-full h-full bg-white text-black flex flex-col font-sans select-none overflow-hidden animate-fade-in relative">
      <TopToast message={importStatus} />
      {/* APP TOP HEADER */}
      <div className="bg-white px-4 py-3 border-b border-zinc-200 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
        <div className="flex items-center gap-2.5">
          {onClose && (
            <button 
              onClick={onClose} 
              className="p-1.5 rounded-xl border border-black text-black hover:bg-zinc-50 transition-colors mr-1 cursor-pointer"
              title="返回"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <div className="w-8 h-8 rounded-xl bg-white border-2 border-black flex items-center justify-center text-black shadow-2xs">
            <Globe className="w-4 h-4 animate-spin" style={{ animationDuration: '16s' }} />
          </div>
          <div>
            <span className="font-extrabold text-base text-black block leading-none">世界书库</span>
            <span className="text-[10px] text-zinc-500 font-medium">World Book Vault</span>
          </div>
        </div>

        {/* TOP TWO BUTTONS */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              soundManager.playTap();
              setShowCreateGroup(true);
            }}
            className="flex items-center gap-1 bg-white hover:bg-zinc-50 text-black border border-black text-xs px-2.5 py-1.5 rounded-xl font-extrabold transition-all active:scale-95 shadow-2xs cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5 text-black" />
            <span>创建分组</span>
          </button>

          <button
            onClick={handleOpenCreateBook}
            className="flex items-center gap-1 bg-white hover:bg-zinc-50 text-black border-2 border-black text-xs px-3 py-1.5 rounded-xl font-extrabold transition-all active:scale-95 shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>创建世界书</span>
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-12">
        {/* GROUP TABS BAR */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => {
              soundManager.playTap();
              setActiveGroup('all');
            }}
            className={`text-xs px-3.5 py-1.5 rounded-xl whitespace-nowrap font-extrabold transition-all ${
              activeGroup === 'all'
                ? 'bg-white text-black border-2 border-black shadow-2xs'
                : 'bg-zinc-50 text-zinc-600 hover:text-black border border-zinc-200'
            }`}
          >
            全部词条 ({items.length})
          </button>

          {groups.map((grp) => {
            const count = items.filter((i) => i.category === grp).length;
            const isActive = activeGroup === grp;
            return (
              <div
                key={grp}
                onClick={() => {
                  soundManager.playTap();
                  setActiveGroup(grp);
                }}
                className={`text-xs px-3 py-1.5 rounded-xl whitespace-nowrap font-extrabold cursor-pointer transition-all flex items-center gap-1 border ${
                  isActive
                    ? 'bg-white text-black border-2 border-black shadow-2xs'
                    : 'bg-zinc-50 text-zinc-600 hover:text-black border-zinc-200'
                }`}
              >
                <span>{grp}</span>
                <span className="text-[10px] opacity-75">({count})</span>
                {grp !== '默认分组' && (
                  <button
                    onClick={(e) => handleDeleteGroup(grp, e)}
                    className="ml-1 hover:text-rose-600 p-0.5 rounded"
                    title="删除分组"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* SEARCH BAR */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索世界书标题、概念设定、关键词..."
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-xs text-black placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black shadow-2xs font-medium"
          />
        </div>

        {/* ITEMS LIST */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-zinc-300 space-y-3 shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-300 flex items-center justify-center mx-auto text-black">
              <BookMarked className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm text-black">暂无世界书词条</h3>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                点击顶部『创建分组』自命名管理类别，或点击『创建世界书』编写/导入新的架空设定。
              </p>
            </div>
            <button
              onClick={handleOpenCreateBook}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-zinc-50 text-black border-2 border-black text-xs px-4 py-2 rounded-xl font-extrabold shadow-2xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              立即创建世界书
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setViewingItem(item)}
                className="p-4 rounded-2xl bg-white border border-zinc-200 hover:border-black cursor-pointer transition-all hover:shadow-xs group relative shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-zinc-100 text-black font-extrabold border border-zinc-300">
                      {item.category || '默认分组'}
                    </span>
                    {getPositionBadge(item.position)}
                    {item.isGlobal && (
                      <span className="text-[10px] bg-white text-emerald-700 border border-emerald-500 px-2 py-0.5 rounded-full font-extrabold flex items-center gap-1">
                        <Globe2 className="w-2.5 h-2.5 text-emerald-600" /> 全局自动绑定
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleOpenEditBook(item, e)}
                      className="p-1 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors"
                      title="编辑词条"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteBook(item.id, e)}
                      className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-zinc-100 rounded-lg transition-colors"
                      title="删除词条"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-extrabold text-base text-black group-hover:underline transition-colors">
                  {item.title}
                </h3>

                <p className="text-xs text-zinc-600 mt-1.5 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                  {item.description}
                </p>

                <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-3 pt-2.5 border-t border-zinc-100">
                  <span>更新于 {item.updatedAt}</span>
                  <span className="text-black font-extrabold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                    查看完整内容与规则 &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL 1: CREATE GROUP MODAL */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 p-4 flex items-center justify-center animate-fade-in">
          <div className="bg-white border border-zinc-200 w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-extrabold text-sm text-black flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-black" />
                创建世界书分组
              </h3>
              <button onClick={() => setShowCreateGroup(false)} className="text-zinc-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-black block">分组名称</label>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="例如: 角色设定 / 魔法法则 / 世界地理"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-black focus:outline-none focus:ring-2 focus:ring-black font-bold"
                autoFocus
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowCreateGroup(false)}
                className="w-1/2 py-2 bg-zinc-100 hover:bg-zinc-200 text-black font-bold text-xs rounded-xl transition-all"
              >
                取消
              </button>
              <button
                onClick={handleSaveGroup}
                className="w-1/2 py-2 bg-white hover:bg-zinc-50 text-black border-2 border-black font-extrabold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
              >
                保存分组
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE / EDIT WORLD BOOK MODAL */}
      {showCreateBook && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 p-4 flex items-center justify-center animate-fade-in">
          <div className="bg-white border border-zinc-200 w-full max-w-md rounded-3xl p-5 space-y-3.5 shadow-2xl max-h-[90vh] overflow-y-auto text-black">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
              <h3 className="font-extrabold text-sm text-black flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-black" />
                {editingId ? '编辑世界书词条' : '新建世界书词条'}
              </h3>
              <button onClick={() => setShowCreateBook(false)} className="text-zinc-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 世界书标题 */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-black block">世界书标题 <span className="text-rose-500">*</span></label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="请输入世界书词条名称 (如: 以太魔法法则)"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-black focus:outline-none focus:ring-2 focus:ring-black font-bold"
              />
            </div>

            {/* 分组 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-black block">所属分组</label>
                <button
                  type="button"
                  onClick={() => setShowCreateGroup(true)}
                  className="text-[10px] text-black hover:underline flex items-center gap-0.5 font-extrabold"
                >
                  <Plus className="w-3 h-3" /> 新建分组
                </button>
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-black focus:outline-none focus:ring-2 focus:ring-black font-bold cursor-pointer"
              >
                {groups.map((grp) => (
                  <option key={grp} value={grp}>
                    {grp}
                  </option>
                ))}
              </select>
            </div>

            {/* 位置顺序 */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-black block">
                位置顺序 <span className="text-[10px] text-zinc-400 font-normal">(决定 AI 上下文的拼接与调取顺序)</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPosition('front')}
                  className={`py-2 px-2 rounded-xl text-xs font-extrabold border transition-all flex flex-col items-center justify-center gap-0.5 ${
                    position === 'front'
                      ? 'bg-white text-black border-2 border-black shadow-2xs'
                      : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:text-black'
                  }`}
                >
                  <span>前 (优先)</span>
                  <span className="text-[9px] font-normal opacity-80">最高权重置顶</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPosition('middle')}
                  className={`py-2 px-2 rounded-xl text-xs font-extrabold border transition-all flex flex-col items-center justify-center gap-0.5 ${
                    position === 'middle'
                      ? 'bg-white text-black border-2 border-black shadow-2xs'
                      : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:text-black'
                  }`}
                >
                  <span>中 (常规)</span>
                  <span className="text-[9px] font-normal opacity-80">默认顺位拼接</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPosition('back')}
                  className={`py-2 px-2 rounded-xl text-xs font-extrabold border transition-all flex flex-col items-center justify-center gap-0.5 ${
                    position === 'back'
                      ? 'bg-white text-black border-2 border-black shadow-2xs'
                      : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:text-black'
                  }`}
                >
                  <span>后 (末尾)</span>
                  <span className="text-[9px] font-normal opacity-80">末尾补充说明</span>
                </button>
              </div>
            </div>

            {/* 全局使用 */}
            <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-extrabold text-black flex items-center gap-1.5">
                  <Globe2 className="w-3.5 h-3.5 text-black" />
                  全局自动绑定
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  开启后，该世界书将在所有微信 AI 聊天中默认自动调取生效
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGlobal(!isGlobal)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                  isGlobal ? 'bg-black' : 'bg-zinc-300'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform shadow-xs ${
                    isGlobal ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 内容 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-black block">
                  设定内容 <span className="text-rose-500">*</span>
                </label>

                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".txt,.docx,.doc"
                    onChange={handleModalFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] bg-white hover:bg-zinc-50 text-black border border-black font-extrabold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3 h-3 text-black" />
                    导入 .txt / .docx 文件
                  </button>
                </div>
              </div>

              {importStatus && (
                <div className="text-[10px] bg-zinc-50 text-emerald-700 p-2 rounded-xl border border-zinc-200 font-bold animate-fade-in">
                  {importStatus}
                </div>
              )}

              <textarea
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="详细撰写世界观、法则、人物背景、势力关系等，或者直接导入 txt / docx 文件..."
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-3 text-xs text-black focus:outline-none focus:ring-2 focus:ring-black leading-relaxed resize-none font-sans"
              />
            </div>

            {/* Submit */}
            <div className="flex gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setShowCreateBook(false)}
                className="w-1/3 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-black font-bold text-xs rounded-xl transition-all"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveBook}
                className="w-2/3 py-2.5 bg-white hover:bg-zinc-50 text-black border-2 border-black font-extrabold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
              >
                保存世界书词条
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
