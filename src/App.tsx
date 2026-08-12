import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppId, Wallpaper, AppConfig, FontPreset } from './types';
import { INITIAL_APPS, WALLPAPERS } from './data';
import { PhoneFrame } from './components/PhoneFrame';
import { HomeScreen } from './components/HomeScreen';
import { WeChatApp } from './components/apps/WeChatApp';
import { WorldBookApp } from './components/apps/WorldBookApp';
import { SettingsApp } from './components/apps/SettingsApp';
import { BeautifyApp } from './components/apps/BeautifyApp';
import { CheckPhoneApp } from './components/apps/CheckPhoneApp';
import { NovelApp } from './components/apps/NovelApp';
import { ForumApp } from './components/apps/ForumApp';
import { INITIAL_FONT_PRESETS, applyFontToDOM } from './utils/fontUtils';

export default function App() {
  const [apps, setApps] = useState<AppConfig[]>(() => {
    try {
      const saved = localStorage.getItem('app_custom_icons');
      if (saved) {
        const customIcons: Record<string, string> = JSON.parse(saved);
        return INITIAL_APPS.map((app) => ({
          ...app,
          customIconUrl: customIcons[app.id] || app.customIconUrl,
        }));
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_APPS;
  });

  const [activeAppId, setActiveAppId] = useState<AppId | null>(null);

  const [currentWallpaper, setCurrentWallpaper] = useState<Wallpaper>(() => {
    try {
      const saved = localStorage.getItem('current_wallpaper');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return WALLPAPERS[0];
  });

  const [activeFontPreset, setActiveFontPreset] = useState<FontPreset>(() => {
    try {
      const saved = localStorage.getItem('active_font_preset');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_FONT_PRESETS[0];
  });

  const [fontSize, setFontSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('active_font_size');
      if (saved) return Number(saved);
    } catch (e) {
      console.error(e);
    }
    return 14;
  });

  // Sync wallpaper to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('current_wallpaper', JSON.stringify(currentWallpaper));
    } catch (e) {
      console.error(e);
    }
  }, [currentWallpaper]);

  // Sync custom app icons to localStorage
  useEffect(() => {
    try {
      const iconsMap: Record<string, string> = {};
      apps.forEach((app) => {
        if (app.customIconUrl) iconsMap[app.id] = app.customIconUrl;
      });
      localStorage.setItem('app_custom_icons', JSON.stringify(iconsMap));
    } catch (e) {
      console.error(e);
    }
  }, [apps]);

  // Sync font preset and font size to DOM
  useEffect(() => {
    try {
      localStorage.setItem('active_font_preset', JSON.stringify(activeFontPreset));
    } catch (e) {
      console.error(e);
    }
    applyFontToDOM(activeFontPreset, fontSize);
  }, [activeFontPreset, fontSize]);

  useEffect(() => {
    try {
      localStorage.setItem('active_font_size', String(fontSize));
    } catch (e) {
      console.error(e);
    }
  }, [fontSize]);

  const handleOpenApp = (id: AppId) => {
    setActiveAppId(id);
  };

  const handleCloseApp = () => {
    setActiveAppId(null);
  };

  return (
    <PhoneFrame activeAppId={activeAppId} onCloseApp={handleCloseApp}>
      {/* Home Screen View */}
      <HomeScreen
        apps={apps}
        onOpenApp={handleOpenApp}
        wallpaper={currentWallpaper}
      />

      {/* Active App Full-Screen Sheet Overlay with iOS opening animation */}
      <AnimatePresence>
        {activeAppId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="absolute inset-0 bg-white dark:bg-black z-30 flex flex-col"
          >
            {/* App View Router */}
            {activeAppId === 'wechat' && <WeChatApp onClose={handleCloseApp} />}
            {activeAppId === 'worldbook' && <WorldBookApp onClose={handleCloseApp} />}
            {activeAppId === 'settings' && <SettingsApp onClose={handleCloseApp} />}
            {activeAppId === 'beautify' && (
              <BeautifyApp
                apps={apps}
                onUpdateApps={(updatedApps) => setApps(updatedApps)}
                currentWallpaper={currentWallpaper}
                onSelectWallpaper={(wp) => setCurrentWallpaper(wp)}
                activeFontPreset={activeFontPreset}
                onSelectFontPreset={(preset) => setActiveFontPreset(preset)}
                fontSize={fontSize}
                onChangeFontSize={(sz) => setFontSize(sz)}
                onClose={handleCloseApp}
              />
            )}
            {activeAppId === 'checkphone' && <CheckPhoneApp onClose={handleCloseApp} />}
            {activeAppId === 'novel' && <NovelApp onClose={handleCloseApp} />}
            {activeAppId === 'forum' && <ForumApp onClose={handleCloseApp} />}
          </motion.div>
        )}
      </AnimatePresence>
    </PhoneFrame>
  );
}
