import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, BellRing } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface NotificationData {
  id: string;
  title: string;
  content: string;
  avatar?: string;
  time?: string;
}

export const NotificationPopupBanner: React.FC = () => {
  const [activePopup, setActivePopup] = useState<NotificationData | null>(null);

  useEffect(() => {
    const handlePopup = (e: any) => {
      if (e.detail) {
        soundManager.playTap();
        const popup: NotificationData = {
          id: `popup-${Date.now()}`,
          title: e.detail.title || '新消息提醒',
          content: e.detail.content || '',
          avatar: e.detail.avatar,
          time: e.detail.time || '刚刚',
        };
        setActivePopup(popup);
      }
    };

    window.addEventListener('show_system_popup', handlePopup);
    return () => window.removeEventListener('show_system_popup', handlePopup);
  }, []);

  // Auto dismiss after 4 seconds
  useEffect(() => {
    if (!activePopup) return;
    const timer = setTimeout(() => {
      setActivePopup(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [activePopup]);

  return (
    <AnimatePresence>
      {activePopup && (
        <motion.div
          key={activePopup.id}
          initial={{ opacity: 0, y: -60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          onClick={() => setActivePopup(null)}
          className="absolute top-10 left-3 right-3 z-50 cursor-pointer pointer-events-auto"
        >
          <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-3 shadow-2xl flex items-start gap-3 select-none">
            {/* Avatar or Icon */}
            {activePopup.avatar ? (
              <img
                src={activePopup.avatar}
                alt="Avatar"
                className="w-10 h-10 rounded-xl object-cover shrink-0 shadow-md border border-zinc-200 dark:border-zinc-700"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shrink-0 shadow-md">
                <BellRing className="w-5 h-5" />
              </div>
            )}

            {/* Notification Content */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                  {activePopup.title}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">{activePopup.time}</span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5 line-clamp-2 leading-snug">
                {activePopup.content}
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActivePopup(null);
              }}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
