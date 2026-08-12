import React from 'react';
import { ChevronLeft, Bookmark } from 'lucide-react';
import { FavoriteItem } from '../../../types';

interface FavoritesPageProps {
  favorites: FavoriteItem[];
  onBack: () => void;
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({ favorites, onBack }) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-[#f1f1f1] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden animate-fade-in relative">
      <div className="bg-[#edf0f2] dark:bg-zinc-900 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between sticky top-0 z-20">
        <button onClick={onBack} className="flex items-center text-zinc-800 dark:text-zinc-200 text-xs font-semibold">
          <ChevronLeft className="w-5 h-5 -ml-1 text-emerald-600" />
          返回
        </button>
        <span className="font-bold text-sm">我的收藏</span>
        <div className="w-8" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {favorites.length === 0 ? (
          <div className="text-center py-10 text-zinc-400 text-xs bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            暂无收藏的消息，在聊天记录中操作可将其保存至此。
          </div>
        ) : (
          <div className="space-y-3">
            {favorites.map((fav) => (
              <div key={fav.id} className="p-3.5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2 relative overflow-hidden group">
                <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {fav.avatar}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{fav.sender}</div>
                      <div className="text-[9px] text-zinc-400">来自: {fav.chatName}</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono">{fav.savedAt}</div>
                </div>
                
                <div className="text-sm text-zinc-900 dark:text-zinc-100 leading-relaxed pt-1">
                  {fav.content}
                </div>
                
                {/* Decorative Bookmark icon in background */}
                <Bookmark className="w-16 h-16 absolute -bottom-4 -right-4 text-emerald-50 dark:text-emerald-950/20 pointer-events-none" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
