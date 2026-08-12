import React, { useState, useEffect } from 'react';
import { TopToast } from './TopToast';
import { 
  KeyRound, 
  RefreshCw, 
  Save, 
  BookmarkPlus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Zap, 
  Sliders,
  Sparkles,
  Server,
  Layers,
  ChevronDown
} from 'lucide-react';
import { ApiPreset, ActiveApiConfig } from '../types';
import { soundManager } from '../utils/audio';

const DEFAULT_PRESETS: ApiPreset[] = [
  {
    id: 'preset-deepseek',
    name: 'DeepSeek 官方 API',
    baseUrl: 'https://api.deepseek.com/v1',
    apiKey: '',
    modelName: 'deepseek-chat',
    temperature: 0.7,
  },
  {
    id: 'preset-openai',
    name: 'OpenAI 官方 API',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    modelName: 'gpt-4o-mini',
    temperature: 0.7,
  },
  {
    id: 'preset-silicon',
    name: '硅基流动 (SiliconFlow)',
    baseUrl: 'https://api.siliconflow.cn/v1',
    apiKey: '',
    modelName: 'deepseek-ai/DeepSeek-V3',
    temperature: 0.7,
  }
];

export const ApiManagementSection: React.FC = () => {
  // Form fields
  const [baseUrl, setBaseUrl] = useState<string>('https://api.openai.com/v1');
  const [apiKey, setApiKey] = useState<string>('');
  const [modelName, setModelName] = useState<string>('gpt-4o-mini');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [presetName, setPresetName] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);

  // Presets and selection
  const [presets, setPresets] = useState<ApiPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');

  // Fetched models state
  const [fetchedModels, setFetchedModels] = useState<Array<{ id: string; name: string }>>([]);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Load initial settings and presets
  useEffect(() => {
    // 1. Load Presets
    const savedPresets = localStorage.getItem('api_presets');
    if (savedPresets) {
      try {
        const parsed = JSON.parse(savedPresets);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPresets(parsed);
        } else {
          setPresets(DEFAULT_PRESETS);
        }
      } catch {
        setPresets(DEFAULT_PRESETS);
      }
    } else {
      setPresets(DEFAULT_PRESETS);
      localStorage.setItem('api_presets', JSON.stringify(DEFAULT_PRESETS));
    }

    // 2. Load Active API Config
    const savedActive = localStorage.getItem('active_api_config');
    if (savedActive) {
      try {
        const cfg: ActiveApiConfig = JSON.parse(savedActive);
        if (cfg.baseUrl) setBaseUrl(cfg.baseUrl);
        if (cfg.apiKey !== undefined) setApiKey(cfg.apiKey);
        if (cfg.modelName) setModelName(cfg.modelName);
        if (typeof cfg.temperature === 'number') setTemperature(cfg.temperature);
        if (cfg.presetName) setPresetName(cfg.presetName);
        if (cfg.presetId) setSelectedPresetId(cfg.presetId);
      } catch {}
    }
  }, []);

  // One-click fetch models from API
  const handleFetchModels = async () => {
    if (!baseUrl.trim() || !apiKey.trim()) {
      setStatusMsg({ type: 'error', text: '请先填写完整的 Base URL 和 API Key 才能拉取模型' });
      return;
    }

    soundManager.playTap();
    setIsFetching(true);
    setStatusMsg({ type: 'info', text: '正在跨域拉取 API 模型列表中...' });

    try {
      const res = await fetch('https://one-ah64.onrender.com/api/fetch-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl: baseUrl.trim(),
          apiKey: apiKey.trim(),
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.models)) {
        setFetchedModels(data.models);
        setStatusMsg({ 
          type: 'success', 
          text: `拉取成功！共找到 ${data.models.length} 个可用模型，可在下方下拉选择。` 
        });
        if (data.models.length > 0 && !data.models.some((m: any) => m.id === modelName)) {
          setModelName(data.models[0].id);
        }
      } else {
        setStatusMsg({ type: 'error', text: data.error || '拉取模型失败，请检查 Base URL 或 Key 是否正确' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: `网络错误: ${err.message || '无法连接到 API'}` });
    } finally {
      setIsFetching(false);
    }
  };

  // Save active configuration
  const handleSaveActive = () => {
    soundManager.playTap();
    const config: ActiveApiConfig = {
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
      modelName: modelName.trim() || 'gpt-4o-mini',
      temperature,
      presetId: selectedPresetId,
      presetName: presetName.trim() || '自定义 API',
    };

    localStorage.setItem('active_api_config', JSON.stringify(config));
    setStatusMsg({ 
      type: 'success', 
      text: '已保存' 
    });
    setTimeout(() => setStatusMsg(null), 2000);
  };

  // Save as Preset
  const handleSavePreset = () => {
    const name = presetName.trim();
    if (!name) {
      setStatusMsg({ type: 'error', text: '请输入预设名称（例如：DeepSeek 个人专用预设）' });
      return;
    }

    soundManager.playTap();
    const existingIndex = presets.findIndex((p) => p.name === name || p.id === selectedPresetId);

    const newPreset: ApiPreset = {
      id: existingIndex >= 0 ? presets[existingIndex].id : `preset-${Date.now()}`,
      name,
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
      modelName: modelName.trim() || 'gpt-4o-mini',
      temperature,
      updatedAt: Date.now(),
    };

    let updatedList: ApiPreset[];
    if (existingIndex >= 0) {
      updatedList = [...presets];
      updatedList[existingIndex] = newPreset;
    } else {
      updatedList = [newPreset, ...presets];
    }

    setPresets(updatedList);
    setSelectedPresetId(newPreset.id);
    localStorage.setItem('api_presets', JSON.stringify(updatedList));

    // Also set active
    localStorage.setItem('active_api_config', JSON.stringify({
      ...newPreset,
      presetId: newPreset.id,
      presetName: newPreset.name,
    }));

    setStatusMsg({ type: 'success', text: '已保存' });
    setTimeout(() => setStatusMsg(null), 2000);
  };

  // Load Selected Preset
  const handleSelectPreset = (presetId: string) => {
    soundManager.playTap();
    setSelectedPresetId(presetId);
    if (!presetId) return;

    const target = presets.find((p) => p.id === presetId);
    if (target) {
      setBaseUrl(target.baseUrl);
      setApiKey(target.apiKey);
      setModelName(target.modelName);
      setTemperature(target.temperature);
      setPresetName(target.name);
      setStatusMsg({ type: 'info', text: '已加载' });
      setTimeout(() => setStatusMsg(null), 2000);
    }
  };

  // Delete Preset
  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playTap();
    const updated = presets.filter((p) => p.id !== id);
    setPresets(updated);
    localStorage.setItem('api_presets', JSON.stringify(updated));
    if (selectedPresetId === id) {
      setSelectedPresetId('');
    }
    setStatusMsg({ type: 'info', text: '已删除' });
    setTimeout(() => setStatusMsg(null), 2000);
  };

  // Quick Preset Provider Templates
  const handleApplyQuickProvider = (provider: { name: string; url: string; defaultModel: string }) => {
    soundManager.playTap();
    setBaseUrl(provider.url);
    setModelName(provider.defaultModel);
    if (!presetName) setPresetName(provider.name);
    setStatusMsg({ type: 'info', text: `已填入 ${provider.name} 接入地址，请输入你的 API Key` });
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-2xs border border-zinc-200 transition-all text-black relative">
      <TopToast message={statusMsg?.text || null} />
      {/* Header */}
      <div className="p-4 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white border border-black text-black flex items-center justify-center shadow-2xs">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-base flex items-center gap-2 text-black">
              API 管理 <span className="text-xs font-normal px-2 py-0.5 bg-white text-black rounded-full border border-black">OpenAI 格式</span>
            </h3>
            <p className="text-xs text-zinc-500">配置第三方或本地 OpenAI 兼容 API 接口参数</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Preset Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-normal text-black flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-black" />
            预设切换 (API Presets)
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <select
                value={selectedPresetId}
                onChange={(e) => handleSelectPreset(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-normal appearance-none focus:outline-none focus:ring-2 focus:ring-black pr-8 cursor-pointer text-black"
              >
                <option value="">-- 自定义参数 / 未关联预设 --</option>
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.modelName || '默认模型'})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            {selectedPresetId && (
              <button
                type="button"
                onClick={(e) => handleDeletePreset(selectedPresetId, e)}
                title="删除当前选中的预设"
                className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-300 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Base URL */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-normal text-black flex items-center gap-1">
              <Server className="w-3.5 h-3.5 text-black" />
              Base URL (接口域名地址)
            </label>
          </div>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.openai.com/v1 或 https://api.deepseek.com"
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-black transition-all text-black"
          />

          {/* Quick BaseURL presets */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[10px] text-zinc-500 font-normal self-center">快速设置:</span>
            {[
              { name: 'OpenAI 官方', url: 'https://api.openai.com/v1', defaultModel: 'gpt-4o-mini' },
              { name: 'DeepSeek 官方', url: 'https://api.deepseek.com/v1', defaultModel: 'deepseek-chat' },
              { name: '硅基流动', url: 'https://api.siliconflow.cn/v1', defaultModel: 'deepseek-ai/DeepSeek-V3' },
              { name: '月之暗面', url: 'https://api.moonshot.cn/v1', defaultModel: 'moonshot-v1-8k' },
              { name: 'Ollama 本地', url: 'http://localhost:11434/v1', defaultModel: 'llama3' },
            ].map((prov) => (
              <button
                key={prov.name}
                type="button"
                onClick={() => handleApplyQuickProvider(prov)}
                className="text-[10px] px-2 py-0.5 bg-white hover:bg-zinc-100 text-black font-normal rounded-lg border border-black transition-all cursor-pointer shadow-2xs"
              >
                {prov.name}
              </button>
            ))}
          </div>
        </div>

        {/* API Key */}
        <div className="space-y-1.5">
          <label className="text-xs font-normal text-black flex items-center gap-1">
            <KeyRound className="w-3.5 h-3.5 text-black" />
            API Key (令牌密钥)
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-3 pr-10 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-black transition-all text-black"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-2.5 top-2 text-zinc-400 hover:text-black"
            >
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Model Name & Fetch Models */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-normal text-black flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-black" />
              模型名称 (Model Name)
            </label>
            <button
              type="button"
              onClick={handleFetchModels}
              disabled={isFetching}
              className="text-xs font-normal text-black hover:underline flex items-center gap-1 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              一键拉取模型
            </button>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="例如: gpt-4o-mini 或 deepseek-chat"
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-black transition-all text-black"
            />

            {fetchedModels.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] text-emerald-700 font-normal">已获取可用模型 (点击快速填入):</span>
                <div className="max-h-28 overflow-y-auto bg-zinc-50 rounded-xl border border-zinc-200 p-1 divide-y divide-zinc-100">
                  {fetchedModels.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setModelName(m.id)}
                      className={`w-full text-left px-2.5 py-1.5 text-xs font-mono hover:bg-zinc-100 transition-colors flex items-center justify-between ${
                        modelName === m.id ? 'text-black font-normal bg-white border border-black rounded-lg' : 'text-zinc-700'
                      }`}
                    >
                      <span className="truncate">{m.name || m.id}</span>
                      {modelName === m.id && <CheckCircle2 className="w-3.5 h-3.5 text-black shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Model Temperature */}
        <div className="space-y-2 pt-1 border-t border-zinc-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-normal text-black flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-black" />
              模型温度 (Temperature)
            </label>
            <span className="text-xs font-mono font-normal text-black bg-zinc-100 border border-black px-2 py-0.5 rounded-md">
              {temperature.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0.0"
            max="2.0"
            step="0.05"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="w-full accent-black cursor-pointer h-1.5 bg-zinc-200 rounded-lg appearance-none"
          />
          <div className="flex items-center justify-between text-[10px] text-zinc-500 font-normal">
            <span>0.0 严谨准确</span>
            <span>0.7 平稳均衡 (推荐)</span>
            <span>2.0 极具创意风趣</span>
          </div>
        </div>

        {/* Preset Name Input */}
        <div className="space-y-1.5 pt-1 border-t border-zinc-100">
          <label className="text-xs font-normal text-black flex items-center gap-1">
            <BookmarkPlus className="w-3.5 h-3.5 text-black" />
            预设名称 (用于保存和区分配置)
          </label>
          <input
            type="text"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="例如: 我的 DeepSeek 极速模式"
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-black transition-all text-black"
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            onClick={handleSaveActive}
            className="w-full py-2.5 px-3 bg-white hover:bg-zinc-50 text-black border-2 border-black font-normal text-xs rounded-xl shadow-2xs transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            保存并立即生效
          </button>

          <button
            type="button"
            onClick={handleSavePreset}
            className="w-full py-2.5 px-3 bg-zinc-50 hover:bg-zinc-100 text-black font-normal text-xs rounded-xl border border-black transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <BookmarkPlus className="w-4 h-4 text-black" />
            保存为新预设
          </button>
        </div>
      </div>
    </div>
  );
};
