import React, { useState, useRef, useEffect } from 'react';
import {
  Palette,
  Image as ImageIcon,
  Sparkles,
  Check,
  Upload,
  Type,
  RotateCcw,
  Plus,
  Trash2,
  Smartphone,
  Sliders,
  CheckCircle2,
  FileText,
  Link as LinkIcon,
  X,
  Zap,
  ChevronLeft,
} from 'lucide-react';
import { Wallpaper, AppConfig, FontPreset } from '../../types';
import { WALLPAPERS } from '../../data';
import { soundManager } from '../../utils/audio';
import { INITIAL_FONT_PRESETS } from '../../utils/fontUtils';

interface BeautifyAppProps {
  apps: AppConfig[];
  onUpdateApps: (apps: AppConfig[]) => void;
  currentWallpaper: Wallpaper;
  onSelectWallpaper: (wallpaper: Wallpaper) => void;
  activeFontPreset: FontPreset;
  onSelectFontPreset: (preset: FontPreset) => void;
  fontSize: number;
  onChangeFontSize: (size: number) => void;
  onClose: () => void;
}

export const BeautifyApp: React.FC<BeautifyAppProps> = ({
  apps,
  onUpdateApps,
  currentWallpaper,
  onSelectWallpaper,
  activeFontPreset,
  onSelectFontPreset,
  fontSize,
  onChangeFontSize,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'wallpaper' | 'icons' | 'fonts'>('wallpaper');

  // Wallpaper states
  const [customBg, setCustomBg] = useState('');
  const wallpaperFileInputRef = useRef<HTMLInputElement>(null);

  // Custom App Icon File Input Ref
  const iconFileInputRef = useRef<HTMLInputElement>(null);
  const [selectedAppForIcon, setSelectedAppForIcon] = useState<string | null>(null);

  // Font States
  const [fontPresets, setFontPresets] = useState<FontPreset[]>(() => {
    try {
      const saved = localStorage.getItem('custom_font_presets');
      if (saved) {
        const parsed: FontPreset[] = JSON.parse(saved);
        // Merge with initial presets ensuring no duplicates by ID
        const customOnly = parsed.filter(
          (p) => !INITIAL_FONT_PRESETS.some((init) => init.id === p.id)
        );
        return [...INITIAL_FONT_PRESETS, ...customOnly];
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_FONT_PRESETS;
  });

  // Modal / Form state for adding custom font
  const [showAddFontModal, setShowAddFontModal] = useState(false);
  const [newFontName, setNewFontName] = useState('');
  const [importType, setImportType] = useState<'file' | 'url'>('file');
  const [fontUrl, setFontUrl] = useState('');
  const [fontFileName, setFontFileName] = useState('');
  const [fontFileDataUrl, setFontFileDataUrl] = useState('');
  const fontFileInputRef = useRef<HTMLInputElement>(null);

  // Save font presets to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('custom_font_presets', JSON.stringify(fontPresets));
    } catch (e) {
      console.error(e);
    }
  }, [fontPresets]);

  // -------------------------------------------------------------
  // 1. WALLPAPER HANDLERS
  // -------------------------------------------------------------
  const handleWallpaperFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件！');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        soundManager.playTap();
        const customWp: Wallpaper = {
          id: `custom-album-${Date.now()}`,
          name: `相册壁纸 (${file.name})`,
          category: 'nature',
          cssBackground: `url("${dataUrl}") center/cover no-repeat`,
          previewColor: '#000000',
        };
        onSelectWallpaper(customWp);
      }
    };
    reader.readAsDataURL(file);

    if (e.target) e.target.value = '';
  };

  const handleApplyCustomBgUrl = () => {
    if (!customBg.trim()) return;
    soundManager.playTap();
    const customWp: Wallpaper = {
      id: `custom-url-${Date.now()}`,
      name: '自定义壁纸',
      category: 'gradient',
      cssBackground: customBg.startsWith('http')
        ? `url("${customBg}") center/cover no-repeat`
        : customBg,
      previewColor: '#000000',
    };
    onSelectWallpaper(customWp);
  };

  // -------------------------------------------------------------
  // 2. APP ICON HANDLERS
  // -------------------------------------------------------------
  const handleTriggerIconUpload = (appId: string) => {
    setSelectedAppForIcon(appId);
    iconFileInputRef.current?.click();
  };

  const handleIconFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedAppForIcon) return;

    if (!file.type.startsWith('image/')) {
      alert('请选择有效的图片文件！');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        soundManager.playTap();
        const nextApps = apps.map((app) =>
          app.id === selectedAppForIcon ? { ...app, customIconUrl: dataUrl } : app
        );
        onUpdateApps(nextApps);
      }
    };
    reader.readAsDataURL(file);

    if (e.target) e.target.value = '';
    setSelectedAppForIcon(null);
  };

  const handleResetIcon = (appId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playTap();
    const nextApps = apps.map((app) =>
      app.id === appId ? { ...app, customIconUrl: undefined } : app
    );
    onUpdateApps(nextApps);
  };

  const handleResetAllIcons = () => {
    if (confirm('确定要恢复所有应用的默认图标吗？')) {
      soundManager.playTap();
      const nextApps = apps.map((app) => ({ ...app, customIconUrl: undefined }));
      onUpdateApps(nextApps);
    }
  };

  // -------------------------------------------------------------
  // 3. FONT IMPORT & RESET HANDLERS
  // -------------------------------------------------------------
  const handleRestoreFontDefaults = () => {
    soundManager.playTap();
    setFontPresets(INITIAL_FONT_PRESETS);
    localStorage.removeItem('custom_font_presets');
    onSelectFontPreset(INITIAL_FONT_PRESETS[0]);
    onChangeFontSize(14);
  };

  const handleFontFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (!['ttf', 'otf', 'woff', 'woff2'].includes(ext || '')) {
      alert('请上传 .ttf, .otf, .woff 或 .woff2 格式的字体文件！');
      return;
    }

    setFontFileName(fileName);
    if (!newFontName.trim()) {
      const defaultName = fileName.replace(/\.[^/.]+$/, '');
      setNewFontName(defaultName);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFontFileDataUrl(dataUrl);
    };
    reader.readAsDataURL(file);

    if (e.target) e.target.value = '';
  };

  const handleSaveFontPreset = () => {
    const trimmedName = newFontName.trim();
    if (!trimmedName) {
      alert('请填写字体预设名称！');
      return;
    }

    let createdPreset: FontPreset | null = null;
    const uniqueFamilyName = `CustomFont_${Date.now()}`;

    if (importType === 'file') {
      if (!fontFileDataUrl) {
        alert('请先选择并上传字体文件！');
        return;
      }
      createdPreset = {
        id: `font-custom-${Date.now()}`,
        name: trimmedName,
        family: uniqueFamilyName,
        sourceType: 'file',
        fontUrl: fontFileDataUrl,
      };
    } else {
      if (!fontUrl.trim()) {
        alert('请输入字体文件或 CSS 链接 URL！');
        return;
      }
      createdPreset = {
        id: `font-custom-${Date.now()}`,
        name: trimmedName,
        family: uniqueFamilyName,
        sourceType: 'url',
        fontUrl: fontUrl.trim(),
      };
    }

    soundManager.playTap();
    setFontPresets((prev) => [createdPreset!, ...prev]);
    onSelectFontPreset(createdPreset);

    setNewFontName('');
    setFontUrl('');
    setFontFileName('');
    setFontFileDataUrl('');
    setShowAddFontModal(false);
  };

  const handleDeleteFontPreset = (presetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这个字体预设吗？')) {
      setFontPresets((prev) => prev.filter((p) => p.id !== presetId));
      if (activeFontPreset.id === presetId) {
        onSelectFontPreset(INITIAL_FONT_PRESETS[0]);
      }
    }
  };

  return (
    <div className="w-full h-full bg-white text-black flex flex-col font-sans select-none overflow-y-auto animate-fade-in">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={wallpaperFileInputRef}
        accept="image/*"
        onChange={handleWallpaperFileUpload}
        className="hidden"
      />
      <input
        type="file"
        ref={iconFileInputRef}
        accept="image/*"
        onChange={handleIconFileUpload}
        className="hidden"
      />
      <input
        type="file"
        ref={fontFileInputRef}
        accept=".ttf,.otf,.woff,.woff2"
        onChange={handleFontFileChange}
        className="hidden"
      />

      {/* WHITE STICKY HEADER */}
      <div className="bg-white px-4 py-3 border-b border-zinc-200 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl border border-black text-black hover:bg-zinc-50 transition-colors mr-1 cursor-pointer"
            title="返回"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="w-8 h-8 rounded-xl bg-white border-2 border-black flex items-center justify-center text-black shadow-2xs">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-base text-black block leading-none">
              美化
            </span>
            <span className="text-[10px] text-zinc-500 font-medium">Theme & Font Studio</span>
          </div>
        </div>
      </div>

      {/* TOP NAVIGATION TABS BAR */}
      <div className="bg-white border-b border-zinc-200 px-4 py-2 flex items-center justify-around z-10 sticky top-[57px]">
        <button
          onClick={() => {
            soundManager.playTap();
            setActiveTab('wallpaper');
          }}
          className={`flex-1 py-2 text-xs font-normal rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'wallpaper'
              ? 'bg-white text-black border-2 border-black shadow-2xs'
              : 'text-zinc-600 hover:text-black bg-zinc-50 border border-zinc-200'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          主屏幕壁纸
        </button>

        <button
          onClick={() => {
            soundManager.playTap();
            setActiveTab('icons');
          }}
          className={`flex-1 py-2 text-xs font-normal rounded-xl transition-all flex items-center justify-center gap-1.5 mx-1.5 ${
            activeTab === 'icons'
              ? 'bg-white text-black border-2 border-black shadow-2xs'
              : 'text-zinc-600 hover:text-black bg-zinc-50 border border-zinc-200'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          应用图标
        </button>

        <button
          onClick={() => {
            soundManager.playTap();
            setActiveTab('fonts');
          }}
          className={`flex-1 py-2 text-xs font-normal rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'fonts'
              ? 'bg-white text-black border-2 border-black shadow-2xs'
              : 'text-zinc-600 hover:text-black bg-zinc-50 border border-zinc-200'
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          字体与字号
        </button>
      </div>

      <div className="p-4 space-y-5 pb-12">
        {/* =======================================================
            TAB 1: WALLPAPER SETTINGS
           ======================================================= */}
        {activeTab === 'wallpaper' && (
          <div className="space-y-4 animate-fade-in">
            {/* CURRENT WALLPAPER PREVIEW CARD */}
            <div className="bg-white rounded-2xl p-4 border border-zinc-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-normal text-black flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-black" />
                  当前壁纸预览
                </span>
                <span className="text-xs text-zinc-600 font-normal max-w-[160px] truncate">
                  {currentWallpaper.name}
                </span>
              </div>

              <div
                className="w-full h-36 rounded-2xl border border-zinc-200 shadow-inner flex items-center justify-center relative overflow-hidden transition-all"
                style={{ background: currentWallpaper.cssBackground }}
              >
                <div className="bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-black text-xs font-normal text-black flex items-center gap-1.5 shadow-2xs">
                  <Check className="w-4 h-4 text-emerald-600" />
                  主屏幕已启用
                </div>
              </div>

              {/* ALBUM PICKER BUTTON */}
              <button
                onClick={() => wallpaperFileInputRef.current?.click()}
                className="w-full py-2.5 bg-white hover:bg-zinc-50 text-black border-2 border-black text-xs font-normal rounded-xl transition-all shadow-2xs flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                从系统相册选择主屏幕壁纸
              </button>
            </div>

            {/* PRESET WALLPAPERS GALLERY */}
            <div className="space-y-2.5">
              <span className="text-xs font-normal text-black flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-black" />
                推荐预设壁纸库
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {WALLPAPERS.map((wp) => {
                  const isSelected = currentWallpaper.id === wp.id;
                  return (
                    <div
                      key={wp.id}
                      onClick={() => {
                        soundManager.playTap();
                        onSelectWallpaper(wp);
                      }}
                      className={`relative rounded-2xl h-28 cursor-pointer border-2 overflow-hidden transition-all group flex flex-col justify-end p-2.5 ${
                        isSelected
                          ? 'border-black scale-98 shadow-md'
                          : 'border-zinc-200 hover:border-zinc-400'
                      }`}
                      style={{ background: wp.cssBackground }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                      <span className="relative z-10 text-[11px] font-normal text-white truncate drop-shadow-md">
                        {wp.name}
                      </span>

                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white text-black border-2 border-black flex items-center justify-center shadow-md">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CUSTOM GRADIENT OR URL INPUT */}
            <div className="bg-white rounded-2xl p-4 border border-zinc-200 shadow-xs space-y-2.5">
              <span className="text-xs font-normal text-black flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-black" />
                自定义 CSS 渐变或网络图片 URL
              </span>

              <div className="space-y-2">
                <input
                  type="text"
                  value={customBg}
                  onChange={(e) => setCustomBg(e.target.value)}
                  placeholder="如: linear-gradient(135deg, #000000, #444444) 或 图片地址"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-black focus:outline-none focus:ring-2 focus:ring-black font-mono"
                />

                <button
                  onClick={handleApplyCustomBgUrl}
                  className="w-full py-2 bg-white hover:bg-zinc-50 text-black border-2 border-black text-xs font-normal rounded-xl transition-all shadow-2xs active:scale-95 cursor-pointer"
                >
                  应用自定义壁纸
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
            TAB 2: APP ICON CUSTOMIZATION
           ======================================================= */}
        {activeTab === 'icons' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white rounded-2xl p-4 border border-zinc-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-normal text-black block">
                  应用图标相册自定义
                </span>
                <span className="text-[10px] text-zinc-500">
                  点击任意应用，即可从系统相册选取照片替换图标
                </span>
              </div>
              <button
                onClick={handleResetAllIcons}
                className="text-[11px] bg-white hover:bg-zinc-50 text-black font-normal border border-black px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                恢复默认
              </button>
            </div>

            {/* APPS ICON GRID LIST */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {apps.map((app) => (
                <div
                  key={app.id}
                  onClick={() => handleTriggerIconUpload(app.id)}
                  className="p-3.5 bg-white rounded-2xl border border-zinc-200 hover:border-black shadow-xs transition-all flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    {/* ICON PREVIEW */}
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                      {app.customIconUrl ? (
                        <img
                          src={app.customIconUrl}
                          alt={app.name}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-white text-black border border-zinc-300 flex items-center justify-center font-normal text-xs">
                          {app.name[0]}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="font-normal text-xs text-black flex items-center gap-1.5">
                        {app.name}
                        {app.customIconUrl && (
                          <span className="text-[9px] bg-zinc-100 text-black font-normal px-1.5 py-0.2 rounded border border-zinc-300">
                            已自定义
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">
                        点击更换系统相册图片
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTriggerIconUpload(app.id);
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-zinc-50 text-black border border-black font-normal text-[11px] rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Upload className="w-3 h-3" />
                      相册
                    </button>

                    {app.customIconUrl && (
                      <button
                        onClick={(e) => handleResetIcon(app.id, e)}
                        className="p-1 text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors"
                        title="重置为默认图标"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =======================================================
            TAB 3: FONTS & FONT SIZE CUSTOMIZATION
           ======================================================= */}
        {activeTab === 'fonts' && (
          <div className="space-y-4 animate-fade-in">
            {/* SECTION 1: GLOBAL FONT SIZE ADJUSTMENT */}
            <div className="bg-white rounded-2xl p-4 border border-zinc-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-normal text-black flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-black" />
                  全局系统字号调节 ({fontSize}px)
                </span>
                <span className="text-[11px] font-normal text-black bg-zinc-100 border border-zinc-200 px-2.5 py-0.5 rounded-full">
                  实时全局生效
                </span>
              </div>

              {/* SLIDER & PRESET BUTTONS */}
              <div className="space-y-2.5">
                <input
                  type="range"
                  min="12"
                  max="18"
                  step="1"
                  value={fontSize}
                  onChange={(e) => onChangeFontSize(Number(e.target.value))}
                  className="w-full accent-black cursor-pointer h-2 bg-zinc-200 rounded-lg"
                />

                <div className="grid grid-cols-5 gap-1 text-[11px]">
                  {[
                    { label: '小号', size: 12 },
                    { label: '标准', size: 14 },
                    { label: '中号', size: 15 },
                    { label: '大号', size: 16 },
                    { label: '特大', size: 18 },
                  ].map((item) => (
                    <button
                      key={item.size}
                      onClick={() => {
                        soundManager.playTap();
                        onChangeFontSize(item.size);
                      }}
                      className={`py-1.5 rounded-xl font-normal transition-all border ${
                        fontSize === item.size
                          ? 'bg-white text-black border-2 border-black font-normal shadow-2xs'
                          : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:text-black hover:border-zinc-400'
                      }`}
                    >
                      {item.label} ({item.size})
                    </button>
                  ))}
                </div>
              </div>

              {/* LIVE TEXT SAMPLE FOR FONT SIZE */}
              <div
                className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-black leading-relaxed font-sans"
                style={{ fontSize: `${fontSize}px` }}
              >
                字体预览：愿世间美好与你环环相扣
              </div>
            </div>

            {/* SECTION 2: FONT PRESETS LIBRARY, IMPORT & RESTORE BUTTON */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-normal text-black flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-black" />
                  字体库 ({fontPresets.length})
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRestoreFontDefaults}
                    className="flex items-center gap-1 bg-white hover:bg-zinc-50 text-black text-xs px-2.5 py-1.5 rounded-xl font-normal border border-black transition-all shadow-2xs active:scale-95 cursor-pointer"
                    title="恢复所有默认字体"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-black" />
                    恢复默认
                  </button>

                  <button
                    onClick={() => setShowAddFontModal(true)}
                    className="flex items-center gap-1 bg-white hover:bg-zinc-50 text-black text-xs px-3 py-1.5 rounded-xl font-normal border-2 border-black transition-all shadow-2xs active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    导入字体
                  </button>
                </div>
              </div>

              {/* PRESETS CARDS */}
              <div className="space-y-3">
                {fontPresets.map((preset) => {
                  const isActive = activeFontPreset.id === preset.id;
                  return (
                    <div
                      key={preset.id}
                      className={`p-4 rounded-2xl bg-white border transition-all shadow-xs space-y-2.5 ${
                        isActive
                          ? 'border-2 border-black ring-2 ring-black/10'
                          : 'border-zinc-200 hover:border-zinc-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-normal text-sm text-black">
                            {preset.name}
                          </span>
                          <span className="text-[10px] bg-zinc-100 text-zinc-600 border border-zinc-200 px-2 py-0.5 rounded-md font-mono">
                            {preset.sourceType === 'system'
                              ? '默认'
                              : preset.sourceType === 'file'
                              ? '本地导入'
                              : '网络URL'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {!preset.isDefault && (
                            <button
                              onClick={(e) => handleDeleteFontPreset(preset.id, e)}
                              className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-zinc-100 rounded-lg transition-colors"
                              title="删除预设"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              soundManager.playTap();
                              onSelectFontPreset(preset);
                            }}
                            className={`px-3 py-1 rounded-xl text-xs font-normal transition-all flex items-center gap-1 ${
                              isActive
                                ? 'bg-white text-black border-2 border-black shadow-2xs'
                                : 'bg-zinc-50 hover:bg-zinc-100 text-black border border-zinc-300'
                            }`}
                          >
                            {isActive ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-black" /> 使用中
                              </>
                            ) : (
                              '使用'
                            )}
                          </button>
                        </div>
                      </div>

                      {/* SAMPLE TEXT PREVIEW FOR THIS FONT */}
                      <div
                        className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-black text-xs leading-relaxed truncate"
                        style={{ fontFamily: `"${preset.family}", sans-serif` }}
                      >
                        字体预览：愿世间美好与你环环相扣
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =======================================================
          MODAL: ADD / IMPORT CUSTOM FONT
         ======================================================= */}
      {showAddFontModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 p-4 flex items-center justify-center animate-fade-in">
          <div className="bg-white border border-zinc-200 w-full max-w-md rounded-3xl p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto text-black">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-normal text-sm text-black flex items-center gap-2">
                <Type className="w-4 h-4 text-black" />
                导入/添加自定义字体
              </h3>
              <button
                onClick={() => setShowAddFontModal(false)}
                className="text-zinc-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* STEP 1: PRESET NAME */}
            <div className="space-y-1">
              <label className="text-xs font-normal text-black block">
                字体名称 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={newFontName}
                onChange={(e) => setNewFontName(e.target.value)}
                placeholder="例如: 仓耳今楷 / 极客代码体"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-black focus:outline-none focus:ring-2 focus:ring-black font-normal"
              />
            </div>

            {/* STEP 2: IMPORT SOURCE MODE */}
            <div className="space-y-1.5">
              <label className="text-xs font-normal text-black block">导入来源</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setImportType('file')}
                  className={`py-2 px-3 rounded-xl text-xs font-normal border transition-all flex items-center justify-center gap-1.5 ${
                    importType === 'file'
                      ? 'bg-white text-black border-2 border-black shadow-2xs'
                      : 'bg-zinc-50 text-zinc-700 border border-zinc-200 hover:text-black'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  从系统文件导入 (.ttf/.otf)
                </button>

                <button
                  type="button"
                  onClick={() => setImportType('url')}
                  className={`py-2 px-3 rounded-xl text-xs font-normal border transition-all flex items-center justify-center gap-1.5 ${
                    importType === 'url'
                      ? 'bg-white text-black border-2 border-black shadow-2xs'
                      : 'bg-zinc-50 text-zinc-700 border border-zinc-200 hover:text-black'
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  网络字体 URL
                </button>
              </div>
            </div>

            {/* MODE CONTENT: FILE OR URL */}
            {importType === 'file' ? (
              <div className="space-y-2 p-3 bg-zinc-50 rounded-2xl border border-zinc-200">
                <div className="text-xs font-normal text-black">
                  选择本地字体文件 (.ttf / .otf / .woff / .woff2)
                </div>
                <button
                  type="button"
                  onClick={() => fontFileInputRef.current?.click()}
                  className="w-full py-2.5 bg-white border border-black hover:bg-zinc-50 text-black font-normal text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-black" />
                  {fontFileName ? `已选择: ${fontFileName}` : '调用文件管理器选择字体'}
                </button>
                {fontFileName && (
                  <div className="text-[10px] text-emerald-600 font-normal flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 字体文件解析成功！
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-xs font-normal text-black block">
                  字体 URL / Google Fonts 链接
                </label>
                <input
                  type="text"
                  value={fontUrl}
                  onChange={(e) => setFontUrl(e.target.value)}
                  placeholder="https://fonts.googleapis.com/css2?family=Noto+Serif+SC..."
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-black focus:outline-none focus:ring-2 focus:ring-black font-mono"
                />
              </div>
            )}

            {/* SUBMIT BUTTONS */}
            <div className="flex gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setShowAddFontModal(false)}
                className="w-1/3 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-black font-normal text-xs rounded-xl transition-all"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveFontPreset}
                className="w-2/3 py-2.5 bg-white hover:bg-zinc-50 text-black border-2 border-black font-normal text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                保存并使用
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
