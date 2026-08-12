import React, { useState, useEffect } from 'react';
import { TopStatusBar } from './TopStatusBar';
import { NotificationPopupBanner } from './NotificationPopupBanner';
import { getSystemSettings } from '../utils/settings';

interface PhoneFrameProps {
  children: React.ReactNode;
  activeAppId: string | null;
  onCloseApp: () => void;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  children,
  activeAppId,
  onCloseApp,
}) => {
  const [settings, setSettings] = useState(getSystemSettings());

  useEffect(() => {
    // Sync dark class on mount
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const handleSettingsChange = (e: any) => {
      if (e.detail) {
        setSettings(e.detail);
      }
    };
    window.addEventListener('system_settings_changed', handleSettingsChange);
    return () => window.removeEventListener('system_settings_changed', handleSettingsChange);
  }, []);

  return (
    <div className={`w-full min-h-screen ${settings.darkMode ? 'bg-slate-950 text-slate-100' : 'bg-zinc-100 text-zinc-900'} flex flex-col items-center justify-center font-sans relative overflow-x-hidden transition-colors duration-300 selection:bg-indigo-500 selection:text-white`}>
      {/* Container for main App view without phone outer frame */}
      <div className={`w-full h-screen max-w-2xl mx-auto ${settings.darkMode ? 'bg-black dark' : 'bg-[#f2f2f7]'} relative flex flex-col overflow-hidden shadow-2xl transition-colors duration-300`}>
        
        {/* Top Status Bar (When enabled in settings) */}
        {settings.showStatusBar && <TopStatusBar darkMode={settings.darkMode} />}
        
        {/* Message Popups Notification Banner (When enabled in settings) */}
        {settings.enableMessagePopups && <NotificationPopupBanner />}

        {/* App Content */}
        <div className="w-full relative overflow-hidden flex flex-col flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};
