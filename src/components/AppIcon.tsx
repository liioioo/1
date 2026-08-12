import React from 'react';
import { 
  MessageSquare, 
  Globe, 
  Settings, 
  Palette, 
  Smartphone, 
  BookOpen, 
  Users 
} from 'lucide-react';
import { AppConfig } from '../types';
import { soundManager } from '../utils/audio';

interface AppIconProps {
  app: AppConfig;
  onClick: (appId: AppConfig['id']) => void;
  size?: 'normal' | 'large';
}

const ICON_MAP: Record<string, React.ElementType> = {
  MessageSquare,
  Globe,
  Settings,
  Palette,
  Smartphone,
  BookOpen,
  Users,
};

const UNIFIED_ICON_STYLE = {
  bg: 'bg-white/70 dark:bg-zinc-800/60 border border-white/80 dark:border-zinc-700/60',
  iconColor: 'text-zinc-800 dark:text-zinc-200',
  badgeBg: 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-white dark:border-zinc-800',
};

export const AppIcon: React.FC<AppIconProps> = ({ app, onClick, size = 'normal' }) => {
  const IconComponent = ICON_MAP[app.iconName] || Smartphone;
  const style = UNIFIED_ICON_STYLE;

  const handleClick = () => {
    soundManager.playAppOpen();
    onClick(app.id);
  };

  const isLarge = size === 'large';

  return (
    <div className="flex flex-col items-center select-none group cursor-pointer" onClick={handleClick}>
      <div 
        className={`
          relative flex items-center justify-center rounded-[22px] ${style.bg}
          backdrop-blur-xl shadow-[0_4px_15px_rgb(0,0,0,0.04)] dark:shadow-[0_4px_15px_rgb(0,0,0,0.2)]
          transition-all duration-300 active:scale-90 group-hover:-translate-y-1 group-hover:shadow-[0_8px_25px_rgb(0,0,0,0.08)] group-hover:scale-105
          overflow-hidden
          ${isLarge ? 'w-16 h-16 sm:w-[72px] sm:h-[72px]' : 'w-[60px] h-[60px] sm:w-[68px] sm:h-[68px]'}
        `}
      >
        {/* Subtle gloss overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 to-transparent dark:from-white/10 pointer-events-none" />
        
        {app.customIconUrl ? (
          <img
            src={app.customIconUrl}
            alt={app.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <IconComponent className={`w-[26px] h-[26px] sm:w-7 sm:h-7 ${style.iconColor}`} strokeWidth={1.5} />
        )}

      </div>

      {/* App Title */}
      <span className="mt-1.5 text-[11px] sm:text-[12px] font-bold text-zinc-700 dark:text-zinc-300 tracking-wide text-center max-w-[72px] line-clamp-1 group-hover:text-zinc-950 dark:group-hover:text-white transition-colors">
        {app.name}
      </span>
    </div>
  );
};

