import React, { useState } from 'react';
import { Users, Heart, MessageCircle, Share2, Plus, Flame, Filter, Send, X, ChevronLeft } from 'lucide-react';
import { ForumPost } from '../../types';
import { INITIAL_FORUM_POSTS } from '../../data';
import { soundManager } from '../../utils/audio';

export const ForumApp: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [posts, setPosts] = useState<ForumPost[]>(INITIAL_FORUM_POSTS);
  const [activeCategory, setActiveCategory] = useState<'all' | 'hot' | 'ios'>('all');
  const [isPosting, setIsPosting] = useState(false);

  // New post state
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTag, setNewTag] = useState('手机讨论');

  const handleLike = (postId: string) => {
    soundManager.playTap();
    setPosts(
      posts.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            likes: p.isLiked ? p.likes - 1 : p.likes + 1,
            isLiked: !p.isLiked,
          };
        }
        return p;
      })
    );
  };

  const handleCreatePost = () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    const post: ForumPost = {
      id: `fp-${Date.now()}`,
      author: '极客玩家',
      avatar: '🚀',
      time: '刚刚',
      title: newTitle,
      content: newContent,
      likes: 1,
      comments: 0,
      tags: [newTag, '新鲜首发'],
      isLiked: true,
    };
    setPosts([post, ...posts]);
    setNewTitle('');
    setNewContent('');
    setIsPosting(false);
  };

  return (
    <div className="w-full h-full bg-rose-50/40 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans select-none overflow-hidden">
      {/* Header */}
      <div className="bg-rose-100/80 dark:bg-zinc-900/90 backdrop-blur-md px-4 py-3 border-b border-rose-200 dark:border-zinc-800 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl border border-rose-400/50 text-rose-800 dark:text-rose-300 hover:bg-rose-200/50 transition-colors mr-1 cursor-pointer"
            title="返回"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <Users className="w-5 h-5 text-rose-500" />
          <span className="font-bold text-lg text-rose-900 dark:text-rose-100">极客玩家论坛</span>
        </div>

        <button 
          onClick={() => setIsPosting(true)}
          className="flex items-center gap-1 bg-rose-500 hover:bg-rose-600 text-white text-xs px-3 py-1.5 rounded-full font-bold transition-all shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>发贴</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button 
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${activeCategory === 'all' ? 'bg-rose-500 text-white shadow-sm' : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300'}`}
          >
            🔥 全部帖子
          </button>
          <button 
            onClick={() => setActiveCategory('hot')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${activeCategory === 'hot' ? 'bg-rose-500 text-white shadow-sm' : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300'}`}
          >
            <Flame className="w-3.5 h-3.5 inline mr-1 text-amber-300" />
            热榜推荐
          </button>
          <button 
            onClick={() => setActiveCategory('ios')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${activeCategory === 'ios' ? 'bg-rose-500 text-white shadow-sm' : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300'}`}
          >
            📱 iOS 讨论区
          </button>
        </div>

        {/* Post Cards */}
        <div className="space-y-3.5">
          {posts.map((post) => (
            <div 
              key={post.id}
              className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-rose-100 dark:border-zinc-800 shadow-sm space-y-3 hover:border-rose-300 transition-colors"
            >
              {/* Author Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950 text-base flex items-center justify-center">
                    {post.avatar}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-xs text-zinc-900 dark:text-zinc-200">{post.author}</span>
                    <span className="text-[10px] text-zinc-400">{post.time}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {post.tags.map((t, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-medium">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Title & Body */}
              <div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 leading-snug">
                  {post.title}
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1.5 leading-relaxed">
                  {post.content}
                </p>
              </div>

              {/* Action Footer */}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                <button 
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center gap-1.5 transition-colors ${post.isLiked ? 'text-rose-500 font-bold' : 'hover:text-rose-500'}`}
                >
                  <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-rose-500' : ''}`} />
                  <span>{post.likes}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4" />
                  <span>{post.comments} 回复</span>
                </div>

                <button className="flex items-center gap-1 hover:text-rose-500">
                  <Share2 className="w-4 h-4" />
                  <span>分享</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Post Modal */}
      {isPosting && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-30 p-4 flex items-center justify-center">
          <div className="bg-white dark:bg-zinc-900 border border-rose-200 dark:border-zinc-800 w-full max-w-sm rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-rose-600 dark:text-rose-400">发表新帖子</h3>
              <button onClick={() => setIsPosting(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <input 
              type="text"
              placeholder="贴子标题..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />

            <textarea 
              rows={4}
              placeholder="精彩内容分享..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none"
            />

            <button 
              onClick={handleCreatePost}
              className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
            >
              立刻发布帖子
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
