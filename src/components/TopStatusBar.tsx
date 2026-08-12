import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';

interface TopStatusBarProps {
  darkMode?: boolean;
}

export const TopStatusBar: React.FC<TopStatusBarProps> = ({ darkMode = false }) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [battery, setBattery] = useState<number>(100);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = now.getHours().toString().padStart(2, '0');
      const m = now.getMinutes().toString().padStart(2, '0');
      setTimeStr(`${h}:${m}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((bat: any) => {
        setBattery(Math.floor(bat.level * 100));
        bat.addEventListener('levelchange', () => {
          setBattery(Math.floor(bat.level * 100));
        });
      });
    }
  }, []);

  return (
    <div className="w-full px-5 pt-2 pb-1.5 flex items-center justify-between text-xs font-semibold z-50 select-none transition-colors duration-300 bg-white dark:bg-black text-black dark:text-white border-b border-zinc-100 dark:border-zinc-800/50">
      {/* Left Time */}
      <span className="font-mono text-[14px] font-bold tracking-tight">{timeStr || '09:41'}</span>

      {/* Right System Icons */}
      <div className="flex items-center gap-[2px]">
        <Heart className="w-[13px] h-[13px] fill-current" />
        
        {/* Cellular Signal Bars */}
        <svg width="13" height="9" viewBox="0 0 16 12" fill="currentColor">
          <rect x="0" y="7" width="2.5" height="5" rx="1.25" />
          <rect x="4.5" y="4.5" width="2.5" height="7.5" rx="1.25" />
          <rect x="9" y="2" width="2.5" height="10" rx="1.25" />
          <rect x="13.5" y="0" width="2.5" height="12" rx="1.25" />
        </svg>

        {/* Wi-Fi Icon */}
        <svg width="15" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
          <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
          <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="3"></line>
        </svg>

        {/* Custom Battery Icon */}
        <div className="flex items-center scale-[0.80] origin-right ml-[0.5px]">
          <div className="w-[30px] h-[15px] rounded-[4.5px] bg-current flex items-center justify-center">
            <span className="text-[10px] font-black tracking-tighter leading-none mb-[0.5px] mr-[0.5px] text-white dark:text-black">
              {battery}
            </span>
          </div>
          <div className="w-[2px] h-[6px] rounded-r-[2px] bg-current ml-[1.5px]" />
        </div>
      </div>
    </div>
  );
};
