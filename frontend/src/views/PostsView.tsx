import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

// Local avatar fallback helper
const PostAvatar: React.FC<{ name: string; src?: string | null; size?: number }> = ({ name, src, size = 44 }) => {
  if (src) {
    return (
      <div style={{ width: size, height: size }} className="rounded-full overflow-hidden border-2 border-[#006d37]/20 shrink-0 bg-slate-50">
        <img alt="Avatar" className="w-full h-full object-cover" src={src} />
      </div>
    );
  }
  const initials = name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  const colors = ['#006d37', '#0d6efd', '#6f42c1', '#fd7e14', '#20c997'];
  const bg = colors[name.charCodeAt(0) % colors.length];
  return (
    <div
      style={{ width: size, height: size, background: bg, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
      className="border-2 border-white shadow-sm"
    >
      <span style={{ color: '#fff', fontWeight: 700, fontSize: size * 0.35 }}>{initials}</span>
    </div>
  );
};

export const PostsView: React.FC = () => {
  const { currentUser, users, posts, createPost, likePost, showNotification } = useApp();
  const [newContent, setNewContent] = useState('');
  const [hashtagsStr, setHashtagsStr] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showNotification('Vui lòng đăng nhập để đăng bài viết!', 'error');
      return;
    }
    if (!newContent.trim()) {
      showNotification('Nội dung bài viết không được để trống.', 'error');
      return;
    }
    const tags = hashtagsStr
      .split(',')
      .map(t => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    createPost(newContent, [], tags);
    setNewContent('');
    setHashtagsStr('');
    showNotification('Đã đăng bài viết thành công!', 'success');
  };

  const handleShare = (_postTitle: string) => {
    navigator.clipboard.writeText(window.location.href);
    showNotification('Đã sao chép liên kết bài đăng vào clipboard!', 'success');
  };

  return (
    <div className="w-full bg-[#f8f9fa] min-h-screen pb-16 text-left font-body-md antialiased">
      <div className="max-w-[800px] mx-auto px-4 py-8 space-y-8">
        
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 font-headline-md flex items-center gap-2">
            <span className="material-symbols-outlined text-[#006d37] text-3xl filled">forum</span>
            Bản tin cộng đồng
          </h1>
          <p className="text-slate-500 text-sm mt-1.5 font-medium">
            Chia sẻ câu chuyện tình nguyện, lan tỏa thông điệp yêu thương và kết nối với cộng đồng.
          </p>
        </div>

        {/* Create Post Card (Visible only when logged in) */}
        {currentUser ? (
          <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm p-6 space-y-4">
            <div className="flex gap-3">
              <PostAvatar name={currentUser.profile.full_name} src={currentUser.profile.avatar_url} size={48} />
              <div className="flex-grow">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Bạn đang muốn chia sẻ điều gì về các hoạt động tình nguyện?"
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:border-[#006d37] focus:ring-2 focus:ring-[#006d37]/10 text-sm font-semibold text-slate-800 bg-slate-50/50 hover:bg-slate-50 focus:bg-white transition-all shadow-inner resize-none"
                  />
                  <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-2">
                    {/* Hashtags input */}
                    <div className="w-full sm:max-w-[320px] flex items-center gap-2 border border-slate-200 bg-slate-50 rounded-xl px-3 py-1.5">
                      <span className="text-slate-400 font-bold text-sm">#</span>
                      <input
                        type="text"
                        value={hashtagsStr}
                        onChange={(e) => setHashtagsStr(e.target.value)}
                        placeholder="hashtags (cách nhau bằng dấu phẩy)..."
                        className="w-full bg-transparent focus:outline-none text-xs font-semibold text-slate-700"
                      />
                    </div>
                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="w-full sm:w-auto bg-[#006d37] hover:bg-emerald-800 text-white font-bold px-6 py-2.5 rounded-xl transition-all text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <span className="material-symbols-outlined text-sm">send</span>
                      Đăng bài viết
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#e8f5e9]/30 border border-[#006d37]/15 rounded-3xl p-6 text-center space-y-3">
            <span className="material-symbols-outlined text-4xl text-[#006d37]">login</span>
            <p className="text-slate-600 font-bold text-sm">Vui lòng đăng nhập để tham gia thảo luận và viết bài.</p>
            <a href="#/auth/login" className="inline-block bg-[#006d37] hover:bg-emerald-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-all shadow-sm">Đăng nhập ngay</a>
          </div>
        )}

        {/* Posts List */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 bg-white border border-slate-200/80 rounded-3xl">
              <span className="material-symbols-outlined text-5xl text-slate-300">chat_bubble_outline</span>
              <p className="text-slate-500 font-semibold text-sm">Chưa có bài đăng nào trên bản tin.</p>
            </div>
          ) : (
            posts.map(post => {
              const authorUser = users.find(u => u._id === post.author_id);
              const authorName = authorUser?.profile.full_name || post.denormalized_author?.name || 'Thành viên ẩn danh';
              const avatarUrl = authorUser?.profile.avatar_url;
              const isLiked = currentUser && post.likedByUserIds?.includes(currentUser._id);
              const authorRole = post.denormalized_author?.role === 'Organizer' ? 'Ban tổ chức' : (post.denormalized_author?.role === 'Admin' ? 'Quản trị viên' : 'Tình nguyện viên');
              
              return (
                <div key={post._id} className="bg-white border border-slate-200/80 rounded-3xl shadow-sm p-6 space-y-4 hover:shadow-md transition-all">
                  
                  {/* Post Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <PostAvatar name={authorName} src={avatarUrl} size={42} />
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-sm text-slate-800">{authorName}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#006d37] mt-0.5">{authorRole}</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 font-semibold">
                      {new Date(post.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  {/* Post Content */}
                  <div className="space-y-3">
                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line font-medium">
                      {post.content}
                    </p>
                    
                    {/* Hashtags display */}
                    {post.hashtags && post.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {post.hashtags.map((tag, idx) => (
                          <span key={idx} className="bg-emerald-50 text-[#006d37] border border-emerald-100/50 px-2 py-0.5 rounded-lg text-xs font-bold">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Interaction Stats */}
                  <div className="flex items-center justify-between text-xs text-slate-500 font-bold border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => likePost(post._id)}
                        className={`flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer ${
                          isLiked ? 'text-[#006d37] bg-[#e8f5e9]/50' : 'text-slate-500'
                        }`}
                      >
                        <span className={`material-symbols-outlined text-lg ${isLiked ? 'filled' : ''}`}>favorite</span>
                        <span>{post.like_count || 0} Thích</span>
                      </button>

                      <button
                        onClick={() => handleShare(post.content)}
                        className="flex items-center gap-1.5 py-1 px-3 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-lg">share</span>
                        <span>Chia sẻ</span>
                      </button>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};

export default PostsView;
