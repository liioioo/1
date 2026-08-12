import React from 'react';

interface TopToastProps {
  message: string | null;
}

export const TopToast: React.FC<TopToastProps> = ({ message }) => {
  if (!message) return null;

  // Clean emoji or checkmarks from message
  const cleanMessage = message.replace(/^[\s✅⭐⚠️]+/, '').trim();

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none flex items-center justify-center max-w-[90vw] animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="bg-zinc-950/90 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-xl border border-zinc-800 backdrop-blur-md text-center">
        <span>{cleanMessage}</span>
      </div>
    </div>
  );
};

