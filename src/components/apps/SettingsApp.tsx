import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  PanelTop,
  Send,
  Settings as SettingsIcon,
  ChevronLeft,
  Activity,
  Save
} from 'lucide-react';
import { soundManager } from '../../utils/audio';
import { ApiManagementSection } from '../ApiManagementSection';
import { 
  getSystemSettings, 
  saveSystemSettings, 
  triggerSystemPopup, 
  SystemSettings 
} from '../../utils/settings';

export const SettingsApp: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [sysSettings, setSysSettings] = useState<SystemSettings>(getSystemSettings());

  useEffect(() => {
    // Listen for setting changes
    const handleSettingsChange = (e: any) => {
      if (e.detail) {
        setSysSettings(e.detail);
      }
    };
    window.addEventListener('system_settings_changed', handleSettingsChange);
    return () => window.removeEventListener('system_settings_changed', handleSettingsChange);
  }, []);

  const handleToggleSetting = (key: keyof SystemSettings) => {
    soundManager.playTap();
    const newValue = !sysSettings[key];
    const updated = saveSystemSettings({ [key]: newValue });
    setSysSettings(updated);

    if (key === 'soundEnabled') {
      soundManager.setSoundEnabled(newValue);
    }
  };

  const handleFrequencyChange = (freq: string) => {
    soundManager.playTap();
    const updated = saveSystemSettings({ backgroundFrequency: freq });
    setSysSettings(updated);
  };

  const handleSendTestNotification = () => {
    soundManager.playTap();
    if (!sysSettings.enableMessagePopups) {
      alert('请先开启『消息弹窗』功能，才能接收浮动通知！');
      return;
    }
    triggerSystemPopup('消息弹窗测试', '弹窗通知正常开启！收到 AI 聊天时将在顶部及时悬浮提醒。');
  };

  const handleSaveAllSettings = () => {
    soundManager.playTap();
    triggerSystemPopup('设置已保存', '您的所有系统与后台设置已成功更新。');
  };

  return (
    <div className="w-full h-full bg-white text-black flex flex-col font-sans select-none overflow-y-auto transition-colors duration-300 animate-fade-in">
      {/* Settings Header */}
      <div className="bg-white px-4 py-3 border-b border-zinc-200 sticky top-0 z-20 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2">
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
            <SettingsIcon className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-lg text-black">设置</span>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-16">
        {/* FIRST FEATURE: API Management */}
        <ApiManagementSection />

        {/* SYSTEM DISPLAY & STATUS BAR */}
        <div className="bg-white rounded-2xl overflow-hidden divide-y divide-zinc-100 shadow-2xs border border-zinc-200">
          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white border border-black text-black flex items-center justify-center shadow-2xs">
                <PanelTop className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-normal text-black">顶部状态栏</span>
                <span className="text-[11px] text-zinc-500">显示/隐藏手机顶部状态栏（时间、信号、电量）</span>
              </div>
            </div>
            <button 
              onClick={() => handleToggleSetting('showStatusBar')}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 cursor-pointer ${sysSettings.showStatusBar ? 'bg-black' : 'bg-zinc-300'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${sysSettings.showStatusBar ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        {/* BACKGROUND ACTIVITY & FREQUENCY */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-2xs border border-zinc-200 divide-y divide-zinc-100">
          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white border border-black text-black flex items-center justify-center shadow-2xs">
                <Activity className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-normal text-black">后台活动 (Char 主动发消息 / 发动态)</span>
                <span className="text-[11px] text-zinc-500 font-normal">允许角色在后台自主发起互动与分享动态</span>
              </div>
            </div>
            <button 
              onClick={() => handleToggleSetting('enableBackgroundActivity')}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 cursor-pointer ${sysSettings.enableBackgroundActivity ? 'bg-black' : 'bg-zinc-300'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${sysSettings.enableBackgroundActivity ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {sysSettings.enableBackgroundActivity && (
            <div className="p-3.5 space-y-2 bg-zinc-50/50 animate-fade-in">
              <span className="text-xs font-normal text-zinc-700 block">后台触发频率选择</span>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '每 5 分钟', value: '5m' },
                  { label: '每 15 分钟', value: '15m' },
                  { label: '每 30 分钟', value: '30m' },
                  { label: '每 1 小时', value: '1h' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handleFrequencyChange(item.value)}
                    className={`py-2 px-1 text-xs rounded-xl border transition-all text-center cursor-pointer ${
                      sysSettings.backgroundFrequency === item.value
                        ? 'bg-black text-white border-black font-normal'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:border-black font-normal'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* NOTIFICATIONS & MESSAGE POPUPS */}
        <div className="bg-white rounded-2xl overflow-hidden divide-y divide-zinc-100 shadow-2xs border border-zinc-200">
          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white border border-black text-black flex items-center justify-center shadow-2xs">
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-normal text-black">消息弹窗</span>
                <span className="text-[11px] text-zinc-500 font-normal">收到 AI 回复与事件时在顶部浮动横幅提醒</span>
              </div>
            </div>
            <button 
              onClick={() => handleToggleSetting('enableMessagePopups')}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 cursor-pointer ${sysSettings.enableMessagePopups ? 'bg-black' : 'bg-zinc-300'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${sysSettings.enableMessagePopups ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="p-3.5 flex items-center justify-between">
            <span className="text-xs font-normal text-zinc-700">测试弹窗通知</span>
            <button
              onClick={handleSendTestNotification}
              className="px-3 py-1.5 bg-white hover:bg-zinc-50 text-black font-normal text-xs rounded-xl border border-black flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              发送测试弹窗
            </button>
          </div>
        </div>

        {/* SAVE SETTINGS BUTTON */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSaveAllSettings}
            className="w-full py-3 bg-black hover:bg-zinc-800 text-white font-normal text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <Save className="w-4 h-4" />
            保存设置
          </button>
        </div>
      </div>
    </div>
  );
};
