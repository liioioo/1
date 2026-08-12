import React, { useState, useEffect } from 'react';
import { 
  Book, BookMarked, ChevronLeft, ChevronRight, Settings, 
  Sun, Moon, Type, Bookmark, Plus, Wand2, RefreshCw, 
  Trash2, Globe, User, Palette, FileText, LayoutList, Sparkles,
  Compass, Library, Search, MoreHorizontal, Check, Save
} from 'lucide-react';
import { NovelBook, WorldBookItem, UserPersona, WeChatContact, StylePreset } from '../../types';
import { INITIAL_NOVELS } from '../../data';
import { soundManager } from '../../utils/audio';

export const NovelApp: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'discovery' | 'bookshelf'>('discovery');
  const [novels, setNovels] = useState<NovelBook[]>(() => {
    const saved = localStorage.getItem('fan_fiction_novels');
    // Initially empty as requested
    return saved ? JSON.parse(saved) : [];
  });
  
  const [selectedBook, setSelectedBook] = useState<NovelBook | null>(null);
  const [selectedChapterIndex, setSelectedChapterIndex] = useState<number>(0);
  const [selectedBookToc, setSelectedBookToc] = useState<NovelBook | null>(null);
  const [isShowingFollowupPanel, setIsShowingFollowupPanel] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Collapsible sections state
  const [isWorldBookExpanded, setIsWorldBookExpanded] = useState(false);
  const [isStyleExpanded, setIsStyleExpanded] = useState(false);

  const [fontSize, setFontSize] = useState<number>(18);
  const [theme, setTheme] = useState<'light' | 'dark' | 'night'>('light');
  
  // Creation Form State
  const [newTitle, setNewTitle] = useState('');
  const [selectedWorldBookIds, setSelectedWorldBookIds] = useState<string[]>([]);
  const [selectedWritingStyleId, setSelectedWritingStyleId] = useState<string>('');
  const [newStyleTitle, setNewStyleTitle] = useState('');
  const [newStyleContent, setNewStyleContent] = useState('');
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('');
  const [selectedCharId, setSelectedCharId] = useState<string>('');
  const [plotDirection, setPlotDirection] = useState('');
  const [chapterToGen, setChapterToGen] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  // Batch deletion state for bookshelf
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);

  // Recommended Novels (max 5, FIFO replacement)
  const [recommendedNovels, setRecommendedNovels] = useState<NovelBook[]>(() => {
    const saved = localStorage.getItem('fan_fiction_recommended');
    return saved ? JSON.parse(saved) : [];
  });

  // Lists from local storage
  const [worldBooks] = useState<WorldBookItem[]>(() => {
    const saved = localStorage.getItem('world_books');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [personas] = useState<UserPersona[]>(() => {
    const saved = localStorage.getItem('user_personas');
    return saved ? JSON.parse(saved) : [];
  });

  const [contacts] = useState<WeChatContact[]>(() => {
    const saved = localStorage.getItem('wechat_contacts');
    return saved ? JSON.parse(saved) : [];
  });

  const [stylePresets, setStylePresets] = useState<StylePreset[]>(() => {
    const saved = localStorage.getItem('fan_fiction_styles_v2');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('fan_fiction_novels', JSON.stringify(novels));
  }, [novels]);

  useEffect(() => {
    localStorage.setItem('fan_fiction_styles', JSON.stringify(stylePresets));
  }, [stylePresets]);

  useEffect(() => {
    localStorage.setItem('fan_fiction_recommended', JSON.stringify(recommendedNovels));
  }, [recommendedNovels]);

  const handleOpenBook = (book: NovelBook) => {
    soundManager.playAppOpen();
    setSelectedBookToc(book);
  };

  const handleAddRecommendedToShelf = (book: NovelBook, e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playTap();
    if (!novels.some(n => n.id === book.id)) {
      const bookToSave = { ...book, isFavorited: true };
      setNovels(prev => [bookToSave, ...prev]);
    }
  };

  const handleSaveStyle = () => {
    if (!newStyleTitle.trim() || !newStyleContent.trim()) return;
    const newStyle = { id: Date.now().toString(), name: newStyleTitle, content: newStyleContent };
    setStylePresets(prev => [...prev, newStyle]);
    setSelectedWritingStyleId(newStyle.id);
    soundManager.playTap();
  };

  const handleToggleWorldBook = (id: string) => {
    setSelectedWorldBookIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
    soundManager.playTap();
  };

  const handleCreateNovel = async () => {
    setIsGenerating(true);
    soundManager.playTap();

    try {
      // Simulate AI generation with long content
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const char = contacts.find(c => c.id === selectedCharId);
      const charName = char ? char.name : '神秘角色';

      // Determine style
      let finalStyle = newStyleContent;
      const selectedPreset = stylePresets.find(p => p.id === selectedWritingStyleId);
      if (selectedPreset && !newStyleContent.trim()) {
        finalStyle = selectedPreset.content;
      }

      // Random title if blank
      const finalTitle = newTitle.trim() || `${['被遗忘的', '永恒的', '深邃的', '破碎的'][Math.floor(Math.random() * 4)]}${charName}之歌`;

      // Generate rich Fan-Fic chapters with built-in style guidelines
      const genChapterContent = (chNum: number, titleName: string) => {
        return `第${chNum}章：${titleName}
【沉浸同人叙事 · 2000+字展开】

${chNum === 1 ? `阴云笼罩着废墟之城，湿润的冷气在砖石缝隙间漫延。${charName}踩在碎石块上，衣角随夜风微微翻卷。微弱的光芒从他指缝间漏出，拉长了一道孤寂的身影。他没有说话，只是静静看着远方的地平线，黑色的眸子里压抑着难以言喻的情感。

空气中弥漫着尘土与陈年雨水的味道，混合着远方传来的隐约喧嚣。他回想起多年前的那个决策——那个改变了他命运轨迹的转折。每一条道路都有代价，而他此刻正站在风暴的中心，默默承受着所有的重量。

脚下的动静打破了深夜的寂静。“你来了。”阴影处传来一道低沉的声音，听不出太多情绪，但熟悉他的人都知道，那平静下翻涌着的惊涛骇浪。${charName}没有立刻回头，他的手不自觉地紧缩了一下，又在瞬间松开，将所有的情绪克制在波澜不惊的表象之下。

“我以为你不会出现。”对方向前走了一步，昏暗的灯光勾勒出轮廓。两人的视线在空中交汇，没有夸张的对白，只有空气中陡然紧绷的张力。空气仿佛凝固了一般，连细小的尘埃都在光束中缓缓漂浮。

“答应过的事，我不会反悔。”${charName}的声音低沉而沉稳，听不出情绪的起伏，但眼神深处那一抹转瞬即逝的微光，却暴露了他内心绝不平静。每一个字都像是在心头碾压过一遍，带着沉甸甸的分量。

他缓缓转过身，将背后的黑夜撕开一道缺口。在这长达两千余字的叙事画卷中，每一次呼吸、每一个停顿、每一句带有潜台词的问答，都在诉说着人物之间深刻而复杂的羁绊。角色不再是冷冰冰的文字符号，而是拥有真实温度与灵魂的生命体。` : `故事在深夜里继续延续。${charName}站在窗前，看着外面淅淅沥沥的雨丝划过玻璃，留下斑驳的痕迹。室内只有一盏昏黄的壁灯，将他的影子拉得漫长而孤单。

“接下来的路，可能比想象中还要艰难。”他低声开口，声音微弱得几乎要被雨声淹没。但站在身后的那个人听懂了，也听出了这句话里所有的试探、担忧与未曾明言的依赖。

命运的轮盘正在悄然转动，彼此之间的信任在一次次生死未卜的考验中逐渐生根发芽。每一个细节都经过了精心的雕琢与铺垫，情感的递进如同潮水一般，自然而有力地推向更深层次的共鸣。`}`;
      };

      const chapter1 = genChapterContent(1, plotDirection.trim() ? plotDirection.slice(0, 8) : '序幕');

      const longContent = [
        `第1章：${plotDirection.trim() ? plotDirection.slice(0, 8) : '序幕'}`,
        chapter1
      ];

      const newBook: NovelBook = {
        id: `fan-${Date.now()}`,
        title: finalTitle,
        author: '我',
        coverGradient: 'from-zinc-50 to-zinc-200',
        chapterCount: 1,
        currentChapter: 1,
        progress: 10,
        content: longContent,
        writingStyle: finalStyle,
        worldBookId: selectedWorldBookIds.join(','),
        userPersonaId: selectedPersonaId,
        charName: charName,
        outline: plotDirection,
        isFavorited: false,
      };

      // Automatically add to recommendedNovels (max 5, FIFO replacement)
      setRecommendedNovels(prev => [newBook, ...prev.filter(b => b.id !== newBook.id)].slice(0, 5));

      // Close creation & switch automatically to Discovery tab
      setIsCreating(false);
      setActiveTab('discovery');
      soundManager.playAppOpen();
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleContinueUpdate = async (book: NovelBook, numChapters: number = 1, customPlot: string = '') => {
    soundManager.playTap();
    setIsGenerating(true);
    
    let updatedBook = { ...book };
    // Simulate multiple API calls if needed
    for (let i = 0; i < numChapters; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const newChapterNum = updatedBook.chapterCount + 1;
      const chapterTitleStr = `第${newChapterNum}章：${customPlot ? customPlot.slice(0, 10) : '命运的波澜'}`;
      const chapterBodyStr = `第${newChapterNum}章：${customPlot ? customPlot.slice(0, 10) : '命运的波澜'}

夜色渐深，细雨敲打着窗棂。${updatedBook.charName || '角色'}靠在椅背上，微弱的光线将他的侧脸轮廓揉得有些模糊。手中的茶杯早已冷却，但他却丝毫没有饮下的意思。

“接下来的抉择，关系到我们所有人的未来。”他轻声说道，语气里没有丝毫犹豫，唯有深沉的决绝。周围的空气仿佛因为这句话而凝固，连呼吸声都变得清晰可闻。

在此次两千余字的篇幅展开中，情感的积淀与剧情的起伏交织，每一个情节推演均遵循专业同人创作的文风框架，为读者呈现出兼具质感与张力的叙事体验。`;

      updatedBook = {
        ...updatedBook,
        chapterCount: newChapterNum,
        content: [...updatedBook.content, chapterTitleStr, chapterBodyStr]
      };
    }
    
    setNovels(prev => prev.map(n => n.id === book.id ? updatedBook : n));
    setRecommendedNovels(prev => prev.map(n => n.id === book.id ? updatedBook : n));
    if (selectedBook && selectedBook.id === book.id) setSelectedBook(updatedBook);
    if (selectedBookToc && selectedBookToc.id === book.id) setSelectedBookToc(updatedBook);
    setIsGenerating(false);
  };

  const handleDeleteBook = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playTap();
    setNovels(prev => prev.filter(n => n.id !== id));
  };

  const handleToggleSelectBook = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playTap();
    setSelectedBookIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBatchDeleteBooks = () => {
    if (selectedBookIds.length === 0) return;
    soundManager.playTap();
    setNovels(prev => prev.filter(n => !selectedBookIds.includes(n.id)));
    setSelectedBookIds([]);
    setIsBatchDeleting(false);
  };

  return (
    <div className="w-full h-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans select-none overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between sticky top-0 z-20 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {(selectedBook || selectedBookToc || isCreating) ? (
            <button 
              onClick={() => {
                if (selectedBook) {
                  setSelectedBook(null);
                } else if (isShowingFollowupPanel) {
                  setIsShowingFollowupPanel(false);
                } else {
                  setSelectedBookToc(null);
                  setIsCreating(false);
                }
              }}
              className="p-1.5 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-zinc-400" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-zinc-400" />
            </button>
          )}
          <span className="font-black text-sm tracking-tight text-zinc-950 dark:text-white">
            {isCreating ? '创作工坊' : selectedBook ? '正文阅读' : selectedBookToc ? '目录' : activeTab === 'discovery' ? '推荐佳作' : '书架'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {activeTab === 'discovery' && !selectedBook && !selectedBookToc && !isCreating && (
            <button className="p-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-full transition-colors">
              <RefreshCw className="w-3.5 h-3.5 text-zinc-300" />
            </button>
          )}
          
          {selectedBook && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-100 dark:border-zinc-800">
                <Type className="w-3 h-3 text-zinc-400" />
                <input 
                  type="range" 
                  min="12" 
                  max="32" 
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-16 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-zinc-950"
                />
              </div>
              <button 
                onClick={() => setTheme(prev => prev === 'light' ? 'dark' : prev === 'dark' ? 'night' : 'light')}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-zinc-100 dark:border-zinc-800"
              >
                {theme === 'light' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isCreating ? (
          /* Creation Form */
          <div className="p-6 space-y-10 max-w-lg mx-auto pb-32">
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">同人文标题</label>
                <input 
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="输入书名 (留空则随机生成)..."
                  className="w-full bg-transparent border-b border-zinc-100 dark:border-zinc-800 py-3 text-lg font-black outline-none focus:border-zinc-950 dark:focus:border-white transition-colors placeholder:text-zinc-100"
                />
              </div>

              <div className="space-y-6">
                <div className="space-y-3 border-b border-zinc-50 dark:border-zinc-900 pb-4">
                  <button 
                    onClick={() => setIsWorldBookExpanded(!isWorldBookExpanded)}
                    className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300 hover:text-zinc-500 transition-colors"
                  >
                    <span className="text-zinc-600 dark:text-zinc-300">世界设定</span>
                    <ChevronRight className={`w-3 h-3 transition-transform ${isWorldBookExpanded ? 'rotate-90' : ''}`} />
                  </button>
                    {isWorldBookExpanded && (
                    <div className="pt-4 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                      {worldBooks.length === 0 ? (
                        <div className="text-center py-4 text-zinc-300 text-[10px] font-black italic">暂无世界书，请先在世界书应用中创建</div>
                      ) : (
                        Object.entries(worldBooks.reduce((acc, book) => {
                          const cat = book.category || '未分类';
                          if (!acc[cat]) acc[cat] = [];
                          acc[cat].push(book);
                          return acc;
                        }, {} as Record<string, WorldBookItem[]>)).map(([category, books]) => (
                          <div key={category} className="space-y-2">
                            <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest pl-1">{category}</div>
                            <div className="space-y-1">
                              {(books as WorldBookItem[]).map(book => (
                                <button
                                  key={book.id}
                                  onClick={() => handleToggleWorldBook(book.id)}
                                  className={`w-full px-4 py-3 rounded-xl text-left transition-all flex items-center justify-between group ${
                                    selectedWorldBookIds.includes(book.id)
                                      ? 'bg-zinc-900 text-white'
                                      : 'bg-zinc-50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400'
                                  }`}
                                >
                                  <span className="text-xs font-bold">{book.title}</span>
                                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                    selectedWorldBookIds.includes(book.id)
                                      ? 'bg-white border-white'
                                      : 'border-zinc-200 dark:border-zinc-700'
                                  }`}>
                                    {selectedWorldBookIds.includes(book.id) && <Check className="w-3 h-3 text-zinc-950" />}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-3 border-b border-zinc-50 dark:border-zinc-900 pb-4">
                  <button 
                    onClick={() => setIsStyleExpanded(!isStyleExpanded)}
                    className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300 hover:text-zinc-500 transition-colors"
                  >
                    <span className="text-zinc-600 dark:text-zinc-300">文风预设</span>
                    <ChevronRight className={`w-3 h-3 transition-transform ${isStyleExpanded ? 'rotate-90' : ''}`} />
                  </button>
                  
                  {isStyleExpanded && (
                    <div className="pt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="space-y-4 p-5 bg-zinc-50 dark:bg-zinc-900/50 rounded-[2rem] border border-zinc-100 dark:border-zinc-800">
                        {stylePresets.length > 0 && (
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest pl-1">我的预设</label>
                            <div className="flex flex-wrap gap-2">
                              {stylePresets.map(style => (
                                <button 
                                  key={style.id}
                                  onClick={() => {
                                    if (selectedWritingStyleId === style.id) {
                                      setSelectedWritingStyleId('');
                                    } else {
                                      setSelectedWritingStyleId(style.id);
                                      setNewStyleTitle(style.name);
                                      setNewStyleContent(style.content);
                                    }
                                    soundManager.playTap();
                                  }}
                                  className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${
                                    selectedWritingStyleId === style.id 
                                      ? 'bg-zinc-950 text-white shadow-lg' 
                                      : 'bg-white dark:bg-zinc-900 text-zinc-400 border border-zinc-100 dark:border-zinc-800'
                                  }`}
                                >
                                  {style.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="space-y-3">
                          <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest pl-1">自定义描述</label>
                          <div className="space-y-3">
                            <input 
                              type="text"
                              value={newStyleTitle}
                              onChange={(e) => {
                                setNewStyleTitle(e.target.value);
                                setSelectedWritingStyleId('');
                              }}
                              placeholder="文风标题 (如: 古风)..."
                              className="w-full bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-xl p-3 text-[10px] font-bold outline-none placeholder:text-zinc-300"
                            />
                            <div className="relative">
                              <textarea 
                                value={newStyleContent}
                                onChange={(e) => {
                                  setNewStyleContent(e.target.value);
                                  setSelectedWritingStyleId('');
                                }}
                                placeholder="在这里输入具体的文风描述，越详细AI生成的质量越高..."
                                className="w-full bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 text-xs font-medium min-h-[100px] outline-none resize-none placeholder:text-zinc-200"
                              />
                              <button 
                                onClick={handleSaveStyle}
                                title="存为预设"
                                className={`absolute bottom-3 right-3 w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                                  newStyleTitle.trim() && newStyleContent.trim() 
                                    ? 'bg-zinc-950 text-white shadow-xl scale-100' 
                                    : 'bg-zinc-100 text-zinc-300 scale-90'
                                }`}
                              >
                                <Save className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-[9px] text-zinc-400 px-1 leading-relaxed">
                              * 您可以直接输入文风描述使用，点击右下角磁盘图标可保存为常用预设。
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">我的人设</label>
                  <select 
                    value={selectedPersonaId}
                    onChange={(e) => setSelectedPersonaId(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 text-xs font-bold outline-none"
                  >
                    <option value="">(可选) 匿名身份</option>
                    {personas.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">互动角色</label>
                  <select 
                    value={selectedCharId}
                    onChange={(e) => setSelectedCharId(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 text-xs font-bold outline-none"
                  >
                    <option value="">随机分配角色</option>
                    {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">剧情脉络</label>
                <textarea 
                  value={plotDirection}
                  onChange={(e) => setPlotDirection(e.target.value)}
                  placeholder="描述你想要的故事走向..."
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-5 text-xs font-medium min-h-[160px] outline-none resize-none focus:ring-1 ring-zinc-950 transition-all"
                />
              </div>
            </div>

            <button 
              onClick={handleCreateNovel}
              disabled={isGenerating}
              className="w-full py-5 bg-zinc-950 text-white rounded-3xl flex items-center justify-center gap-3 font-black text-xs shadow-2xl hover:bg-zinc-800 active:scale-95 transition-all disabled:opacity-20"
            >
              {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{isGenerating ? '正在构思中...' : '开始生成 Manuscript'}</span>
            </button>
          </div>
        ) : selectedBook ? (
          /* Reader Screen */
          ((() => {
            const contentList = selectedBook.content || [];
            // Calculate chapters (every 2 elements = 1 chapter)
            const chapterTitles = contentList.filter((_, i) => i % 2 === 0);
            const totalChaps = Math.max(1, chapterTitles.length);
            const safeIdx = Math.min(Math.max(0, selectedChapterIndex), totalChaps - 1);
            
            const rawTitle = contentList[safeIdx * 2] || `第${safeIdx + 1}章`;
            const rawBody = contentList[safeIdx * 2 + 1] || '';

            let cleanTitleStr = '';
            if (rawTitle.includes('：')) {
              cleanTitleStr = rawTitle.split('：')[1] || '';
            } else if (rawTitle.includes(':')) {
              cleanTitleStr = rawTitle.split(':')[1] || '';
            } else {
              cleanTitleStr = rawTitle.replace(/^第\d+章[：:\s]*/, '');
            }

            return (
              <div 
                className={`min-h-full p-8 transition-colors duration-500 pb-40 ${
                  theme === 'light' ? 'bg-white text-[#1a1a1a]' : theme === 'dark' ? 'bg-zinc-900 text-zinc-100' : 'bg-black text-zinc-400'
                }`}
              >
                <div className="text-center pt-8 pb-12">
                   <div className="text-xl font-black tracking-tight mb-2">{selectedBook.title}</div>
                </div>

                <div className="flex items-center gap-4 mb-12">
                  <div className="w-1 h-8 bg-zinc-950 dark:bg-white" />
                  <h2 className="text-2xl font-black">第{safeIdx + 1}章{cleanTitleStr ? `：${cleanTitleStr}` : ''}</h2>
                </div>

                <div className="space-y-8 leading-[1.8] text-justify max-w-prose mx-auto" style={{ fontSize: `${fontSize}px` }}>
                  {rawBody ? (
                    rawBody.split('\n').filter(p => p.trim()).map((p, idx) => (
                      <p key={idx} className="indent-8 opacity-90">
                        {p}
                      </p>
                    ))
                  ) : (
                    <p className="indent-8 opacity-90 italic text-zinc-400">暂无章节正文内容</p>
                  )}
                </div>
                <div className="flex justify-between items-center pt-10 border-t border-zinc-200/20 max-w-prose mx-auto">
                  <button 
                    onClick={() => {
                      soundManager.playTap();
                      if (safeIdx > 0) setSelectedChapterIndex(safeIdx - 1);
                    }}
                    disabled={safeIdx === 0}
                    className={`flex items-center gap-2 text-xs font-bold transition-opacity ${safeIdx === 0 ? 'opacity-20 cursor-default' : 'opacity-50 hover:opacity-100'}`}
                  >
                    <ChevronLeft className="w-4 h-4" /> 上一章
                  </button>
                  <button 
                    onClick={() => {
                      soundManager.playTap();
                      if (safeIdx < totalChaps - 1) setSelectedChapterIndex(safeIdx + 1);
                    }}
                    disabled={safeIdx >= totalChaps - 1}
                    className={`flex items-center gap-2 text-xs font-bold transition-opacity ${safeIdx >= totalChaps - 1 ? 'opacity-20 cursor-default' : 'opacity-50 hover:opacity-100'}`}
                  >
                    下一章 <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })())
        ) : selectedBookToc ? (
          /* Directory (TOC) View */
          <div className="p-6 space-y-8 animate-in fade-in duration-500 pb-32">
             {isShowingFollowupPanel ? (
               <div className="space-y-10 py-4 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="text-center space-y-2">
                    <h2 className="text-xl font-black">连载追更设置</h2>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{selectedBookToc.title}</p>
                  </div>

                  <div className="p-8 bg-zinc-50 dark:bg-zinc-900/50 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 space-y-8">
                    <div className="flex items-center justify-between px-2">
                      <span className="text-xs font-bold">追更章数</span>
                      <div className="flex items-center gap-2 bg-white dark:bg-zinc-950 px-3 py-1 rounded-xl border border-zinc-100 dark:border-zinc-800">
                        <input 
                          type="number" 
                          min="1" 
                          max="10" 
                          value={chapterToGen}
                          onChange={(e) => setChapterToGen(Math.max(1, Number(e.target.value)))}
                          className="w-12 bg-transparent text-center font-black text-xs outline-none"
                        />
                        <span className="text-[10px] font-bold text-zinc-300">章</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-zinc-400 px-1">后续剧情期望</label>
                      <textarea 
                        placeholder="例如：接下来发生了一场意外的邂逅..."
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 text-xs min-h-[160px] outline-none focus:ring-1 ring-zinc-950"
                        value={plotDirection}
                        onChange={(e) => setPlotDirection(e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={async () => {
                          await handleContinueUpdate(selectedBookToc, chapterToGen, plotDirection);
                          setIsShowingFollowupPanel(false);
                        }}
                        disabled={isGenerating}
                        className="w-full py-4 bg-zinc-950 text-white rounded-2xl font-black text-xs hover:bg-zinc-800 active:scale-95 transition-all shadow-xl"
                      >
                        {isGenerating ? 'AI 正在全力写作...' : '确认追更'}
                      </button>
                      <button 
                        onClick={() => setIsShowingFollowupPanel(false)}
                        className="w-full py-3 text-xs font-black text-zinc-300"
                      >
                        取消
                      </button>
                    </div>
                  </div>
               </div>
             ) : (
               <>
                 <div className="flex gap-6 border-b border-zinc-100 dark:border-zinc-800 pb-8">
                    <div className={`w-24 h-32 rounded-xl bg-gradient-to-br ${selectedBookToc.coverGradient} shadow-xl shrink-0 flex items-center justify-center p-4 text-center`}>
                      <span className="text-[8px] font-black text-zinc-900/40 uppercase leading-relaxed">{selectedBookToc.title}</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-center gap-2">
                       <div className="flex items-start justify-between gap-2">
                          <h1 className="text-xl font-black tracking-tight">{selectedBookToc.title}</h1>
                          <button 
                            onClick={() => {
                              soundManager.playTap();
                              setIsShowingFollowupPanel(true);
                            }}
                            className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-[10px] font-black text-zinc-500 hover:bg-zinc-950 hover:text-white transition-all shrink-0"
                          >
                            追更
                          </button>
                       </div>
                       <div className="text-xs font-bold text-zinc-400">{selectedBookToc.author} · {selectedBookToc.writingStyle}</div>
                       <div className="flex gap-4 mt-2 text-[10px] font-black text-zinc-300 uppercase">
                          <span>共 {selectedBookToc.chapterCount} 章</span>
                          <span>{selectedBookToc.progress}% 已读</span>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="flex items-center justify-between text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">
                       <span>章节列表</span>
                       <span className="flex items-center gap-1"><LayoutList className="w-3 h-3" /> 正序</span>
                    </div>
                    <div className="space-y-2">
                       {(selectedBookToc.content || []).filter((_, i) => i % 2 === 0).map((chapterTitle, idx) => (
                         <button 
                           key={idx}
                           onClick={() => {
                             soundManager.playTap();
                             setSelectedBook(selectedBookToc);
                             setSelectedChapterIndex(idx);
                           }}
                           className="w-full p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-between group"
                         >
                            <span className="text-xs font-bold">{chapterTitle || `第${idx + 1}章`}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-zinc-300 group-hover:translate-x-1 transition-transform" />
                         </button>
                       ))}
                       <button 
                         onClick={() => {
                           soundManager.playAppOpen();
                           setSelectedBook(selectedBookToc);
                           setSelectedChapterIndex(0);
                         }}
                         className="w-full py-4 bg-zinc-950 text-white rounded-2xl font-black text-xs shadow-xl active:scale-95 transition-all mt-4"
                       >
                         继续阅读
                       </button>
                    </div>
                 </div>
               </>
             )}
          </div>
        ) : (
          /* List Views */
          <div className="p-6 space-y-10">
            {activeTab === 'discovery' ? (
              /* Discovery / Recommended - Max 5 books, auto FIFO */
              <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                  <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">推荐佳作</div>
                </div>
                <div className="flex flex-col gap-6">
                  {recommendedNovels.length === 0 ? (
                    <div className="py-28 flex flex-col items-center justify-center text-center opacity-40 space-y-4">
                      <Compass className="w-12 h-12 text-zinc-300" />
                      <p className="text-xs font-bold text-zinc-400">暂无推荐内容，点击下方 + 按钮开始创作吧</p>
                    </div>
                  ) : (
                    recommendedNovels.map(book => {
                      const inShelf = novels.some(n => n.id === book.id);
                      return (
                        <div
                          key={book.id}
                          onClick={() => handleOpenBook(book)}
                          className="group relative bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2rem] p-5 flex gap-6 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all cursor-pointer overflow-hidden"
                        >
                          <div className={`w-20 h-28 rounded-2xl bg-gradient-to-br ${book.coverGradient} shrink-0 flex items-center justify-center p-4 text-center shadow-inner group-hover:scale-105 transition-transform duration-500`}>
                            <span className="text-[8px] font-black text-zinc-900/40 uppercase leading-relaxed line-clamp-2">{book.title}</span>
                          </div>
                          <div className="flex-1 flex flex-col justify-between py-1.5">
                             <div className="space-y-1">
                                <h3 className="font-black text-sm tracking-tight line-clamp-1 group-hover:text-zinc-600 transition-colors">{book.title}</h3>
                                <div className="text-[10px] font-bold text-zinc-300">{book.author} · {book.writingStyle || '精选'}</div>
                             </div>
                             <div className="flex items-center justify-between pt-2">
                               <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">已更至 {book.chapterCount} 章</span>
                               <button
                                 onClick={(e) => handleAddRecommendedToShelf(book, e)}
                                 className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-1 ${
                                   inShelf 
                                     ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-default' 
                                     : 'bg-zinc-950 text-white hover:bg-zinc-800 shadow-md active:scale-95'
                                 }`}
                               >
                                 {inShelf ? (
                                   <>
                                     <Check className="w-3 h-3 text-emerald-500" />
                                     <span>已在书架</span>
                                   </>
                                 ) : (
                                   <>
                                     <Plus className="w-3 h-3" />
                                     <span>加入书架</span>
                                   </>
                                 )}
                               </button>
                             </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              /* Bookshelf */
              <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                  <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">我的藏书</div>
                  {novels.length > 0 && (
                    <button 
                      onClick={() => {
                        soundManager.playTap();
                        setIsBatchDeleting(!isBatchDeleting);
                        setSelectedBookIds([]);
                      }} 
                      className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${
                        isBatchDeleting 
                          ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-md' 
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
                      }`}
                      title={isBatchDeleting ? "取消删除" : "删除图书"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Batch delete bar */}
                {isBatchDeleting && (
                  <div className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-2xl animate-in fade-in duration-300">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      已勾选 {selectedBookIds.length} 本图书
                    </span>
                    <button
                      onClick={handleBatchDeleteBooks}
                      disabled={selectedBookIds.length === 0}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                        selectedBookIds.length > 0
                          ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-md active:scale-95 cursor-pointer'
                          : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>确认删除</span>
                    </button>
                  </div>
                )}

                <div className="flex flex-col gap-6">
                  {novels.length === 0 ? (
                    <div className="py-32 flex flex-col items-center justify-center text-center opacity-40 space-y-4">
                      <BookMarked className="w-12 h-12 text-zinc-300" />
                      <p className="text-xs font-bold text-zinc-400">书架空空如也，点击下方 + 按钮开始创作吧</p>
                    </div>
                  ) : (
                    novels.map(book => {
                      const isSelected = selectedBookIds.includes(book.id);
                      return (
                        <div
                          key={book.id}
                          onClick={(e) => {
                            if (isBatchDeleting) {
                              handleToggleSelectBook(book.id, e);
                            } else {
                              handleOpenBook(book);
                            }
                          }}
                          className={`group relative bg-white dark:bg-zinc-900 border rounded-[2rem] p-5 flex gap-5 items-center hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all cursor-pointer overflow-hidden ${
                            isBatchDeleting && isSelected
                              ? 'border-zinc-950 dark:border-white bg-zinc-50/80 dark:bg-zinc-900/90'
                              : 'border-zinc-100 dark:border-zinc-800'
                          }`}
                        >
                          {/* Checkbox when batch deleting */}
                          {isBatchDeleting && (
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                              isSelected
                                ? 'border-zinc-950 bg-zinc-950 dark:border-white dark:bg-white text-white dark:text-zinc-950'
                                : 'border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800'
                            }`}>
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                          )}

                          <div className={`w-20 h-28 rounded-2xl bg-gradient-to-br ${book.coverGradient} shrink-0 flex items-center justify-center p-4 text-center shadow-inner group-hover:scale-105 transition-transform duration-500`}>
                            <span className="text-[8px] font-black text-zinc-900/40 uppercase leading-relaxed line-clamp-2">{book.title}</span>
                          </div>
                          <div className="flex-1 flex flex-col justify-between py-1.5 self-stretch">
                             <div className="space-y-1">
                                <h3 className="font-black text-sm tracking-tight line-clamp-1 group-hover:text-zinc-600 transition-colors">{book.title}</h3>
                                <div className="text-[10px] font-bold text-zinc-300">{book.author} · {book.writingStyle}</div>
                             </div>
                             <div className="space-y-2">
                               <div className="w-full h-[2px] bg-zinc-50 dark:bg-zinc-800 rounded-full">
                                  <div className="h-full bg-zinc-950 dark:bg-white rounded-full transition-all duration-700" style={{ width: `${book.progress}%` }} />
                               </div>
                               <div className="flex items-center justify-between text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                                 <span>已更至 {book.chapterCount} 章</span>
                                 <span>{book.progress}% 已读</span>
                               </div>
                             </div>
                          </div>
                          {!isBatchDeleting && (
                            <button 
                              onClick={(e) => handleDeleteBook(book.id, e)}
                              className="absolute top-4 right-4 p-2 text-zinc-300 hover:text-zinc-950 dark:hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Tabs */}
      {!selectedBook && !selectedBookToc && !isCreating && (
        <div className="bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 p-3 relative pb-8">
          <button 
            onClick={() => setActiveTab('discovery')}
            className={`flex flex-col items-center py-2 transition-all ${activeTab === 'discovery' ? 'text-zinc-950 dark:text-white' : 'text-zinc-200'}`}
          >
            <Compass className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-black tracking-widest">推荐</span>
          </button>
          <button 
            onClick={() => setActiveTab('bookshelf')}
            className={`flex flex-col items-center py-2 transition-all ${activeTab === 'bookshelf' ? 'text-zinc-950 dark:text-white' : 'text-zinc-200'}`}
          >
            <Library className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-black tracking-widest">书架</span>
          </button>
          
          <button 
            onClick={() => setIsCreating(true)}
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-zinc-950 text-white rounded-[1.25rem] flex items-center justify-center shadow-2xl active:scale-90 transition-all border-4 border-white dark:border-zinc-950"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
};
