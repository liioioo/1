import React from 'react';
import { Search } from 'lucide-react';
import { AppConfig, AppId, Wallpaper } from '../types';
import { AppIcon } from './AppIcon';
import { TopTimeWidget, ChatBubblesWidget } from './HomeScreenWidget';

interface HomeScreenProps {
  apps: AppConfig[];
  onOpenApp: (appId: AppId) => void;
  wallpaper: Wallpaper;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  apps,
  onOpenApp,
  wallpaper,
}) => {
  // Separate main page apps and dock apps
  const gridApps = apps; // show all 7 apps on main screen grid
  const dockApps = apps.filter((app) => app.inDock);

  return (
    <div 
      className="w-full flex-1 relative overflow-hidden flex flex-col justify-between p-4 pt-4 pb-1 select-none transition-all duration-500 bg-[#f8f9fa] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100"
      style={{ background: wallpaper.cssBackground || undefined }}
    >
      {/* Subtle INS aesthetic grid background texture */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-black/5 dark:from-white/5 dark:to-black/40 pointer-events-none" />

      {/* Main Home Screen Grid Area */}
      <div className="flex-1 flex flex-col justify-between pt-0 z-10 overflow-hidden">
        {/* Top Time Widget */}
        <div className="w-full pt-1">
          <TopTimeWidget />
        </div>

        {/* Chat Bubbles Area */}
        <div className="w-full mt-2 scale-[0.82] origin-top">
          <ChatBubblesWidget />
        </div>

        {/* Spacer for bottom layout */}
        <div className="flex-1 min-h-[8px]" />

        {/* App Icons Grid */}
        <div className="w-full pb-2">
          <div className="grid grid-cols-4 gap-y-3 gap-x-3 px-1">
            {gridApps.map((app) => (
              <AppIcon key={app.id} app={app} onClick={onOpenApp} />
            ))}
          </div>
        </div>
      </div>

      {/* INS Bottom Dock Container */}
      <div className="w-full px-3 mb-0 z-10">
        <div className="w-full py-2.5 px-4 rounded-[28px] bg-white/60 dark:bg-zinc-900/60 backdrop-blur-3xl border border-white/70 dark:border-zinc-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex items-center justify-between relative overflow-hidden">
          {/* subtle dock glow */}
          <div className="absolute inset-0 bg-gradient-to-t from-white/40 to-transparent dark:from-white/5 pointer-events-none" />
          
          {/* 4 Blank Placeholder Icons (No Text) */}
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={`dock-blank-${i}`}
              className="w-[52px] h-[52px] sm:w-[58px] sm:h-[58px] rounded-[18px] bg-white/70 dark:bg-zinc-800/60 border border-white/80 dark:border-zinc-700/60 backdrop-blur-md shadow-[0_2px_10px_rgb(0,0,0,0.03)] dark:shadow-[0_2px_10px_rgb(0,0,0,0.1)] relative overflow-hidden flex items-center justify-center"
            >
              {/* Inner slight gradient mimicking the app icon style */}
              <div className="w-[42px] h-[42px] sm:w-[48px] sm:h-[48px] rounded-[14px] bg-gradient-to-br from-white/40 to-transparent dark:from-zinc-700/50 dark:to-transparent border border-white/50 dark:border-zinc-600/30"></div>
              {/* Gloss overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/60 to-transparent dark:from-white/10 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
