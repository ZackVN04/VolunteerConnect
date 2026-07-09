import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import type { Activity, Post } from '../context/AppContext';

// Helper: inline avatar fallback with initials
const PostAvatar: React.FC<{ name: string; src?: string | null; size?: number }> = ({ name, src, size = 44 }) => {
  if (src) {
    return (
      <div style={{ width: size, height: size }} className="rounded-full overflow-hidden border border-slate-200 shrink-0 bg-slate-50">
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
      className="border border-white shadow-sm"
    >
      <span style={{ color: '#fff', fontWeight: 700, fontSize: size * 0.35 }}>{initials}</span>
    </div>
  );
};

// Activity Badge Helper
const CategoryBadge: React.FC<{ category: string }> = ({ category }) => (
  <span className="bg-emerald-50 text-[#006d37] font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase border border-emerald-100/50">
    {category}
  </span>
);

export const PostsView: React.FC = () => {
  const { currentUser, users, posts, activities, createPost, likePost, showNotification } = useApp();
  const [newContent, setNewContent] = useState('');
  const [hashtagsStr, setHashtagsStr] = useState('');
  const [attachedActivityId, setAttachedActivityId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse attached activity from content string
  const parsePostContent = (content: string): { cleanContent: string; activityId: string | null } => {
    const regex = /\[AttachedActivity:([^\]]+)\]/;
    const match = content.match(regex);
    if (match) {
      const cleanContent = content.replace(regex, '').trim();
      return { cleanContent, activityId: match[1] };
    }
    return { cleanContent: content, activityId: null };
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showNotification('Dung lượng hình ảnh phải nhỏ hơn 5MB!', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

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

    // Embed attached activity if selected
    let contentToSubmit = newContent;
    if (attachedActivityId) {
      contentToSubmit += `\n[AttachedActivity:${attachedActivityId}]`;
    }

    // Support single image attach if present
    const imagesArray = imageUrl ? [imageUrl] : [];

    createPost(contentToSubmit, imagesArray, tags);
    setNewContent('');
    setHashtagsStr('');
    setAttachedActivityId('');
    setImageUrl('');
    setShowCreateModal(false);
    showNotification('Đã đăng bài viết thành công!', 'success');
  };

  const handleShare = (_postTitle: string) => {
    navigator.clipboard.writeText(window.location.href);
    showNotification('Đã sao chép liên kết bài đăng vào clipboard!', 'success');
  };

  // Filter activities that are open or full for recommendations sidebar
  const recommendedActivities = activities.filter(a => a.status === 'Open' || a.status === 'Full').slice(0, 3);

  return (
    <div className="w-full bg-[#f5f5f5] min-h-screen pb-16 text-left antialiased">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-8">
        
        {/* Three Column Layout */}
        <div className="grid grid-cols-12 gap-8 items-start">
          
          {/* ================= COLUMN 1: LEFT USER SIDEBAR ================= */}
          <div className="col-span-12 lg:col-span-3 hidden lg:block space-y-6">
            {currentUser ? (
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 text-center space-y-4">
                <div className="flex flex-col items-center">
                  <PostAvatar name={currentUser.profile.full_name} src={currentUser.profile.avatar_url} size={84} />
                  <h3 className="font-bold text-slate-800 text-base mt-3">{currentUser.profile.full_name}</h3>
                  <span className="bg-[#e8f5e9] text-[#006d37] text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase mt-1">
                    {currentUser.role === 'Volunteer' ? 'Tình nguyện viên' : (currentUser.role === 'Organizer' ? 'Ban tổ chức' : currentUser.role)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 italic px-2">
                  {currentUser.profile.bio || "Chưa cập nhật giới thiệu."}
                </p>
                <div className="border-t border-slate-100 pt-3 flex justify-around text-xs">
                  <div className="text-center">
                    <p className="font-bold text-slate-800 text-base">{currentUser.profile.joined_activity_count || 0}</p>
                    <p className="text-slate-400 font-semibold">Chiến dịch</p>
                  </div>
                  <div className="text-center border-l border-slate-100 pl-6">
                    <p className="font-bold text-slate-800 text-base">{currentUser.profile.skills?.length || 0}</p>
                    <p className="text-slate-400 font-semibold">Kỹ năng</p>
                  </div>
                </div>
                <div className="pt-2">
                  <a
                    href="#/profile"
                    className="block w-full text-center bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#006d37] font-bold py-2 rounded-xl text-xs transition-colors"
                  >
                    Xem trang cá nhân
                  </a>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 text-center space-y-3">
                <span className="material-symbols-outlined text-4xl text-[#006d37]">account_circle</span>
                <h3 className="font-bold text-slate-800 text-sm">Chào mừng bạn!</h3>
                <p className="text-xs text-slate-500">Đăng nhập tài khoản để cùng tham gia thảo luận cùng cộng đồng.</p>
                <a
                  href="#/login"
                  className="block w-full text-center bg-[#1a6c3a] hover:bg-[#155c30] text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-sm"
                >
                  Đăng nhập
                </a>
              </div>
            )}
          </div>

          {/* ================= COLUMN 2: MIDDLE MAIN FEED ================= */}
          <div className="col-span-12 lg:col-span-6 space-y-6">
            
            {/* Quick Post Box (Mockup style) */}
            {currentUser && (
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-4 flex gap-3 items-center">
                <PostAvatar name={currentUser.profile.full_name} src={currentUser.profile.avatar_url} size={42} />
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex-grow bg-slate-50 hover:bg-slate-100/80 text-slate-400 text-left text-sm px-4 py-2.5 rounded-full border border-slate-200/60 font-semibold transition-all cursor-pointer"
                >
                  Bạn đang nghĩ gì thế?
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="w-10 h-10 rounded-full hover:bg-slate-50 flex items-center justify-center text-[#006d37] transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xl">image</span>
                </button>
              </div>
            )}

            {/* Posts Feed list */}
            <div className="space-y-6">
              {posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 bg-white border border-slate-200/80 rounded-2xl">
                  <span className="material-symbols-outlined text-5xl text-slate-300">chat_bubble_outline</span>
                  <p className="text-slate-500 font-semibold text-sm">Chưa có bài đăng nào trên bản tin.</p>
                </div>
              ) : (
                posts.map(post => {
                  const authorUser = users.find(u => u._id === post.author_id);
                  const authorName = authorUser?.profile.full_name || post.denormalized_author?.name || 'Thành viên';
                  const avatarUrl = authorUser?.profile.avatar_url;
                  const isLiked = currentUser && post.likedByUserIds?.includes(currentUser._id);
                  const authorRole = post.denormalized_author?.role === 'Organizer' ? 'Ban tổ chức' : (post.denormalized_author?.role === 'Admin' ? 'Quản trị viên' : 'Tình nguyện viên');
                  
                  // Parse attached activity
                  const { cleanContent, activityId } = parsePostContent(post.content);
                  const attachedActivity = activityId ? activities.find(a => a._id === activityId) : null;

                  return (
                    <div key={post._id} className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-4 hover:shadow-md transition-all">
                      
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
                          {cleanContent}
                        </p>
                        
                        {/* Attached Activity Card (trang chủ.png mockup style) */}
                        {attachedActivity && (
                          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50 hover:bg-slate-50 flex flex-col sm:flex-row transition-all max-h-[300px]">
                            {attachedActivity.image_url && (
                              <div className="w-full sm:w-1/3 h-32 sm:h-auto shrink-0 bg-slate-100">
                                <img 
                                  src={attachedActivity.image_url} 
                                  alt={attachedActivity.title} 
                                  className="w-full h-full object-cover" 
                                />
                              </div>
                            )}
                            <div className="p-4 flex flex-col justify-between flex-grow text-left space-y-2">
                              <div className="space-y-1">
                                <CategoryBadge category={attachedActivity.categories[0] || 'Hoạt động'} />
                                <h4 className="font-bold text-slate-800 text-sm line-clamp-1 mt-1">{attachedActivity.title}</h4>
                                <div className="space-y-1 text-xs text-slate-500 font-semibold">
                                  <div className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-sm text-[#006d37]">calendar_month</span>
                                    <span>{new Date(attachedActivity.start_date).toLocaleDateString('vi-VN')}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-sm text-[#006d37]">location_on</span>
                                    <span className="line-clamp-1">{attachedActivity.location?.province || 'Hồ Chí Minh'}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                                <span className="text-slate-400 font-medium">Tuyển {attachedActivity.limit_volunteers} TNV</span>
                                <a 
                                  href={`#/activity/${attachedActivity._id}`}
                                  className="text-[#006d37] hover:underline font-bold"
                                >
                                  Tham gia ngay →
                                </a>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Post image attachment */}
                        {post.images && post.images.length > 0 && (
                          <div className="rounded-xl overflow-hidden border border-slate-100 max-h-[320px] bg-slate-50">
                            <img src={post.images[0]} alt="Post media attachment" className="w-full h-full object-cover" />
                          </div>
                        )}
                        
                        {/* Hashtags */}
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

                      {/* Interaction Area */}
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

          {/* ================= COLUMN 3: RIGHT SIDEBAR RECOMMENDATIONS ================= */}
          <div className="col-span-12 lg:col-span-3 hidden lg:block space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">Hoạt động nổi bật</h3>
              {recommendedActivities.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Không có hoạt động nào đang mở tuyển.</p>
              ) : (
                <div className="space-y-4">
                  {recommendedActivities.map(act => (
                    <div key={act._id} className="group border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50 hover:bg-slate-50 hover:shadow-sm transition-all flex flex-col">
                      {act.image_url && (
                        <div className="w-full h-24 bg-slate-100">
                          <img src={act.image_url} alt={act.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                      )}
                      <div className="p-3 text-left space-y-1.5">
                        <h4 className="font-bold text-slate-800 text-xs line-clamp-1">{act.title}</h4>
                        <div className="text-[10px] text-slate-500 font-semibold space-y-0.5">
                          <p>Khu vực: {act.location?.province || 'Toàn quốc'}</p>
                          <p>Ngày: {new Date(act.start_date).toLocaleDateString('vi-VN')}</p>
                        </div>
                        <a
                          href={`#/activity/${act._id}`}
                          className="block text-center bg-white border border-slate-200 text-[#006d37] hover:bg-[#e8f5e9] font-bold py-1.5 rounded-lg text-[10px] transition-colors"
                        >
                          Xem chi tiết
                        </a>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2">
                    <a
                      href="#/activities"
                      className="block text-center text-[#006d37] hover:underline font-bold text-xs"
                    >
                      Xem tất cả hoạt động →
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ===================== MODAL: TẠO BÀI VIẾT MỚI (tạo bài viết mới.png) ===================== */}
      {showCreateModal && currentUser && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 animate-scaleUp">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-lg">Tạo bài viết mới</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors font-bold text-lg"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* User Info header */}
              <div className="flex items-center gap-3">
                <PostAvatar name={currentUser.profile.full_name} src={currentUser.profile.avatar_url} size={42} />
                <div className="text-left">
                  <p className="font-bold text-slate-800 text-sm leading-tight">{currentUser.profile.full_name}</p>
                  <span className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded-full mt-1 inline-block">
                    {currentUser.role === 'Volunteer' ? 'Tình nguyện viên' : 'Ban tổ chức'}
                  </span>
                </div>
              </div>

              {/* Textarea */}
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Bạn muốn chia sẻ điều gì về các hoạt động tình nguyện?"
                rows={4}
                required
                className="w-full border-0 focus:ring-0 text-sm font-semibold text-slate-800 placeholder-slate-400 resize-none focus:outline-none"
              />

              {/* Attached Image Preview */}
              {imageUrl && (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 max-h-[180px] bg-slate-50">
                  <img src={imageUrl} alt="attached media preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 shadow flex items-center justify-center hover:bg-red-700 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm font-bold">close</span>
                  </button>
                </div>
              )}

              {/* Hashtags Input */}
              <div className="flex items-center gap-2 border border-slate-200 bg-slate-50 rounded-xl px-3 py-2">
                <span className="text-slate-400 font-bold text-sm">#</span>
                <input
                  type="text"
                  value={hashtagsStr}
                  onChange={(e) => setHashtagsStr(e.target.value)}
                  placeholder="tags (cách nhau bằng dấu phẩy)..."
                  className="w-full bg-transparent focus:outline-none text-xs font-semibold text-slate-700"
                />
              </div>

              {/* Dropdown to Attach Activity */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đính kèm hoạt động tình nguyện</label>
                <select
                  value={attachedActivityId}
                  onChange={(e) => setAttachedActivityId(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006d37] text-xs font-semibold text-slate-700 bg-white cursor-pointer"
                >
                  <option value="">-- Không đính kèm hoạt động --</option>
                  {activities.map(act => (
                    <option key={act._id} value={act._id}>{act.title}</option>
                  ))}
                </select>
              </div>

              {/* Upload image button trigger */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">image</span>
                    Thêm ảnh minh họa
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-[#1a6c3a] hover:bg-[#155c30] text-white font-bold px-6 py-2 rounded-xl text-xs transition-all shadow-sm cursor-pointer"
                >
                  Đăng bài
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default PostsView;
