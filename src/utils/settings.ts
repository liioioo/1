export interface SystemSettings {
  showStatusBar: boolean;
  enableMessagePopups: boolean;
  darkMode: boolean;
  soundEnabled: boolean;
  wifiEnabled: boolean;
  bluetoothEnabled: boolean;
  enableBackgroundActivity: boolean;
  backgroundFrequency: string; // '5m' | '15m' | '30m' | '1h'
}

const DEFAULT_SETTINGS: SystemSettings = {
  showStatusBar: true,
  enableMessagePopups: true,
  darkMode: false, // 默认系统风格为白色系
  soundEnabled: true,
  wifiEnabled: true,
  bluetoothEnabled: true,
  enableBackgroundActivity: false,
  backgroundFrequency: '30m',
};

export const getSystemSettings = (): SystemSettings => {
  try {
    const saved = localStorage.getItem('system_settings');
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch {}
  return DEFAULT_SETTINGS;
};

export const saveSystemSettings = (newSettings: Partial<SystemSettings>): SystemSettings => {
  const current = getSystemSettings();
  const updated = { ...current, ...newSettings };
  localStorage.setItem('system_settings', JSON.stringify(updated));

  // Sync dark class on document element
  if (updated.darkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  // Dispatch event for live UI reactivity
  window.dispatchEvent(new CustomEvent('system_settings_changed', { detail: updated }));
  return updated;
};

export const triggerSystemPopup = (title: string, content: string, avatar?: string) => {
  const settings = getSystemSettings();
  if (!settings.enableMessagePopups) return;
  window.dispatchEvent(new CustomEvent('show_system_popup', { 
    detail: { title, content, avatar, time: '刚刚' } 
  }));
};
