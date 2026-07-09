import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';

// Avatar helper
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
    <div style={{ width: size, height: size, background: bg, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} className="border border-white shadow-sm">
      <span style={{ color: '#fff', fontWeight: 700, fontSize: size * 0.35 }}>{initials}</span>
    </div>
  );
};

// Create Post Modal Component
const CreatePostModal: React.FC<{ onClose: () => void; onSubmit: (title: string, content: string, images: string[], videoUrl: string, hashtags: string[]) => void }> = ({ onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [hashtagsStr, setHashtagsStr] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) handleFileChange(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = hashtagsStr.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);
    const images = imagePreview ? [imagePreview] : [];
    onSubmit(title, content, images, videoUrl, tags);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-y-auto max-h-[90vh] animate-scaleUp">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-gray-900 text-xl">Tạo bài viết mới</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none font-bold cursor-pointer transition-colors">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-gray-700">Tiêu đề bài viết <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              placeholder="Nhập tiêu đề ngắn gọn (5 – 100 ký tự)"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-1 focus:ring-[#006d37] text-sm text-slate-800 transition-all"
            />
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-gray-700">Nội dung chi tiết <span className="text-red-500">*</span></label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              required
              rows={5}
              placeholder="Kể về trải nghiệm của bạn (10 – 5000 ký tự)..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-1 focus:ring-[#006d37] text-sm text-slate-800 resize-none transition-all"
            />
          </div>

          {/* Image Drop Zone */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-gray-700">Hình ảnh minh họa <span className="text-slate-400 font-normal">(Tùy chọn)</span></label>
            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${isDragging ? 'border-[#006d37] bg-[#e8f5e9]' : 'border-slate-200 hover:border-[#006d37]/50 hover:bg-slate-50'}`}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="preview" className="max-h-32 mx-auto rounded-lg object-cover" />
                  <button type="button" onClick={e => { e.stopPropagation(); setImagePreview(''); }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">×</button>
                </div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-3xl text-slate-300">image</span>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Kéo thả ảnh vào đây hoặc nhấp để tải lên</p>
                </>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e.target.files?.[0] || null)} />
            </div>
            <label className="flex items-center gap-2 mt-1 cursor-pointer w-fit" onClick={() => fileRef.current?.click()}>
              <span className="border border-slate-300 bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer">Chọn Tệp</span>
              <span className="text-xs text-slate-400">{imagePreview ? '1 tệp đã chọn' : 'Không tệp nào được chọn'}</span>
            </label>
          </div>

          {/* Video URL */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-gray-700">Liên kết Video <span className="text-slate-400 font-normal">(Tùy chọn)</span></label>
            <input
              type="url"
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              placeholder="Dán link video YouTube hoặc TikTok"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-1 focus:ring-[#006d37] text-sm text-slate-800 transition-all"
            />
          </div>

          {/* Hashtags */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-gray-700">Thẻ Hashtags <span className="text-slate-400 font-normal">(Tùy chọn)</span></label>
            <input
              type="text"
              value={hashtagsStr}
              onChange={e => setHashtagsStr(e.target.value)}
              placeholder="Ngăn cách các thẻ bằng dấu phẩy (ví dụ: MuaHeXanh, MôiTrường)"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-1 focus:ring-[#006d37] text-sm text-slate-800 transition-all"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-6 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 text-sm transition-colors cursor-pointer">
              Hủy bỏ
            </button>
            <button type="submit" className="px-6 py-2.5 bg-[#1a6c3a] hover:bg-[#155c30] text-white font-bold rounded-xl text-sm transition-all shadow-sm cursor-pointer">
              Đăng bài viết
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const FeedView: React.FC = () => {
  const { currentUser, users, activities, posts, createPost, likePost, showNotification } = useApp();
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const itemsPerPage = 2;

  // Stats
  const totalCampaigns = activities.length;
  const totalVolunteers = users.filter(u => u.role === 'Volunteer').length;
  const totalOrganizers = users.filter(u => u.role === 'Organizer').length;
  const totalCompleted = activities.filter(a => a.status === 'Completed').length;

  // Featured activities
  const featuredList = activities.filter(a => a.status === 'Open' || a.status === 'Full');
  const totalPages = Math.ceil(featuredList.length / itemsPerPage);
  const featuredActivities = featuredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Trending hashtags (aggregate from posts)
  const hashtagCounts: Record<string, number> = {};
  posts.forEach(p => (p.hashtags || []).forEach(h => { hashtagCounts[h] = (hashtagCounts[h] || 0) + 1; }));
  const trendingTags = Object.entries(hashtagCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const handleCreatePost = (title: string, content: string, images: string[], videoUrl: string, hashtags: string[]) => {
    if (!currentUser) return;
    const fullContent = title ? `${title}\n${content}` : content;
    createPost(fullContent, images, hashtags);
    setShowCreateModal(false);
    showNotification('Đã đăng bài viết thành công!', 'success');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showNotification('Đã sao chép liên kết!', 'success');
  };

  return (
    <div className="w-full bg-[#f8f9fa] min-h-screen pb-16 text-left antialiased">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-8 space-y-12">

        {/* ===================== HERO SECTION ===================== */}
        <section className="bg-[#f0f9f4] rounded-[2rem] p-8 md:p-12 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="lg:w-1/2 space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-on-surface leading-tight font-headline-md">
              Kết nối sức trẻ,<br />
              Kiến tạo <span className="text-[#006d37]">cộng đồng xanh</span>
            </h1>
            <p className="text-on-surface-variant text-base md:text-lg leading-relaxed">
              Chào mừng bạn đến với Volunteer Connect! Nơi hội tụ của những hoạt động tình nguyện ý nghĩa, kết nối trực tiếp tình nguyện viên với các tổ chức thiện nguyện uy tín tại Việt Nam. Đăng ký dễ dàng, lưu giữ hành trình ý nghĩa.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#/activities" className="bg-[#006d37] hover:bg-emerald-800 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-sm">
                Khám phá hoạt động
              </a>
              <a href="#/profile" className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-6 py-3 rounded-xl transition-all shadow-sm">
                Tài khoản của tôi
              </a>
            </div>
          </div>
          <div className="lg:w-1/2 w-full flex justify-center">
            <div className="w-full max-w-[500px] h-[300px] rounded-3xl overflow-hidden shadow-md">
              <img
                src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=800&q=80"
                alt="Volunteer Community"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>

        {/* ===================== STATS ===================== */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: totalCampaigns, label: 'Tổng chiến dịch' },
            { value: totalVolunteers, label: 'Tình nguyện viên' },
            { value: totalOrganizers, label: 'Nhà tổ chức' },
            { value: totalCompleted, label: 'Đã hoàn thành' },
          ].map((s, i) => (
            <div key={i} className="bg-white border border-surface-variant/40 rounded-2xl p-6 text-center shadow-sm">
              <h3 className="text-4xl font-bold text-[#006d37]">{s.value}</h3>
              <p className="text-on-surface-variant font-semibold text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </section>

        {/* ===================== FEATURED ACTIVITIES ===================== */}
        <section className="space-y-6">
          <div className="flex justify-between items-end border-b border-surface-variant/40 pb-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-on-surface font-headline-md">Hoạt động nổi bật</h2>
              <p className="text-on-surface-variant text-sm">Tham gia các hoạt động xã hội đang diễn ra gần bạn</p>
            </div>
            <a href="#/activities" className="text-[#006d37] hover:underline font-bold text-sm flex items-center gap-1">Xem tất cả →</a>
          </div>

          {featuredActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 bg-white border border-slate-100 rounded-3xl">
              <span className="material-symbols-outlined text-5xl text-slate-300">volunteer_activism</span>
              <p className="text-slate-500 font-semibold text-sm">Hiện chưa có hoạt động nổi bật nào đang mở đăng ký.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {featuredActivities.map(act => (
                  <div key={act._id} className="bg-white border border-surface-variant/40 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
                    <div className="relative h-[200px] shrink-0">
                      <img
                        src={act.image_url || 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80&w=600'}
                        alt={act.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80&w=600'; }}
                      />
                      <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-[#006d37] font-bold text-xs px-3 py-1 rounded-full uppercase border border-[#006d37]/20">
                        {act.categories[0] || 'Tình nguyện'}
                      </span>
                      {act.status === 'Open' && (
                        <span className="absolute top-4 right-4 bg-[#006d37] text-white text-xs font-bold px-3 py-1 rounded-full">Đang mở</span>
                      )}
                    </div>
                    <div className="p-5 flex flex-col justify-between flex-grow space-y-3">
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold text-on-surface line-clamp-2 leading-tight">{act.title}</h3>
                        <div className="space-y-1 text-sm text-on-surface-variant">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#006d37] text-base">calendar_month</span>
                            <span>{new Date(act.start_date).toLocaleDateString('vi-VN')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#006d37] text-base">location_on</span>
                            <span className="line-clamp-1">{act.location?.province || act.location?.address_detail || 'Toàn quốc'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <a href={`#/activity/${act._id}`} className="flex-1 text-center bg-[#006d37] hover:bg-emerald-800 text-white font-bold py-2 rounded-xl text-xs transition-all">
                          Đang mở đăng ký
                        </a>
                        <a href={`#/activity/${act._id}`} className="flex-1 text-center border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold py-2 rounded-xl text-xs transition-all">
                          Xem chi tiết
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-2">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 rounded-full text-sm font-bold transition-all ${currentPage === i + 1 ? 'bg-[#006d37] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ===================== BẢNG TIN CỘNG ĐỒNG (2 cols) ===================== */}
        <section className="space-y-4">
          <div className="border-b border-surface-variant/40 pb-4">
            <h2 className="text-2xl font-bold text-on-surface font-headline-md">Bảng tin cộng đồng</h2>
            <p className="text-on-surface-variant text-sm mt-1">Chia sẻ những khoảnh khắc, câu chuyện ý nghĩa và cùng nhau lan tỏa các chiến dịch tình nguyện</p>
          </div>

          <div className="grid grid-cols-12 gap-8 items-start">

            {/* ---- LEFT: Post search + feed ---- */}
            <div className="col-span-12 lg:col-span-8 space-y-5">
              {/* Search / Quick compose box */}
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm flex items-center gap-3 p-4">
                <span className="material-symbols-outlined text-slate-400 text-xl">search</span>
                <button
                  onClick={() => { if (currentUser) setShowCreateModal(true); else showNotification('Vui lòng đăng nhập để đăng bài!', 'error'); }}
                  className="flex-1 text-left text-slate-400 text-sm font-semibold bg-slate-50 hover:bg-slate-100 px-4 py-2 rounded-full border border-slate-200/60 transition-all cursor-pointer"
                >
                  Tìm kiếm hoặc tạo bài viết mới về Tình nguyện...
                </button>
                {currentUser && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="shrink-0 bg-[#1a6c3a] hover:bg-[#155c30] text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    Đăng bài
                  </button>
                )}
              </div>

              {/* Posts list */}
              <div className="space-y-5">
                {posts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 bg-white border border-slate-200/80 rounded-2xl">
                    <span className="material-symbols-outlined text-5xl text-slate-300">chat_bubble_outline</span>
                    <p className="text-slate-500 font-semibold text-sm">Chưa có bài đăng nào. Hãy là người đầu tiên chia sẻ!</p>
                  </div>
                ) : (
                  posts.map(post => {
                    const authorUser = users.find(u => u._id === post.author_id);
                    const authorName = authorUser?.profile.full_name || post.denormalized_author?.name || 'Thành viên';
                    const avatarUrl = authorUser?.profile.avatar_url;
                    const isLiked = currentUser && post.likedByUserIds?.includes(currentUser._id);
                    const authorRole = post.denormalized_author?.role === 'Organizer' ? 'Ban tổ chức' : (post.denormalized_author?.role === 'Admin' ? 'Quản trị viên' : 'Tình nguyện viên');

                    return (
                      <div key={post._id} className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-4 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <PostAvatar name={authorName} src={avatarUrl} size={42} />
                            <div>
                              <p className="font-bold text-sm text-slate-800">{authorName}</p>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-[#006d37]">{authorRole}</p>
                            </div>
                          </div>
                          <span className="text-[11px] text-slate-400 font-semibold">{new Date(post.created_at).toLocaleDateString('vi-VN')}</span>
                        </div>

                        <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line font-medium">{post.content}</p>

                        {/* Post images */}
                        {post.images && post.images.length > 0 && (
                          <div className="rounded-xl overflow-hidden border border-slate-100 max-h-[280px]">
                            <img src={post.images[0]} alt="Post image" className="w-full h-full object-cover" />
                          </div>
                        )}

                        {/* Hashtags */}
                        {post.hashtags && post.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {post.hashtags.map((tag, idx) => (
                              <span key={idx} className="bg-emerald-50 text-[#006d37] border border-emerald-100/50 px-2 py-0.5 rounded-lg text-xs font-bold">#{tag}</span>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-4 text-xs text-slate-500 font-bold border-t border-slate-100 pt-3">
                          <button onClick={() => likePost(post._id)} className={`flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer ${isLiked ? 'text-[#006d37] bg-[#e8f5e9]/50' : ''}`}>
                            <span className={`material-symbols-outlined text-lg ${isLiked ? 'filled' : ''}`}>favorite</span>
                            <span>{post.like_count || 0} Thích</span>
                          </button>
                          <button onClick={handleShare} className="flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                            <span className="material-symbols-outlined text-lg">share</span>
                            <span>Chia sẻ</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ---- RIGHT: Sidebar widgets ---- */}
            <div className="col-span-12 lg:col-span-4 hidden lg:flex flex-col gap-5">
              {/* Share card */}
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 space-y-3">
                <p className="text-sm text-slate-600 font-semibold leading-snug">
                  Bạn có những khoảnh khắc tình nguyện ý nghĩa? Hãy chia sẻ ngay với cộng đồng!
                </p>
                {currentUser ? (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="w-full bg-[#1a6c3a] hover:bg-[#155c30] text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-sm cursor-pointer"
                  >
                    Đăng bài viết mới
                  </button>
                ) : (
                  <a href="#/login" className="block w-full text-center bg-[#1a6c3a] hover:bg-[#155c30] text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-sm">
                    Đăng nhập để chia sẻ
                  </a>
                )}
              </div>

              {/* Trending Hashtags */}
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 space-y-3">
                <h4 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">Hashtags thịnh hành</h4>
                {trendingTags.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Chưa có hashtags nào.</p>
                ) : (
                  <div className="space-y-2">
                    {trendingTags.map(([tag, count], i) => (
                      <div key={i} className="flex justify-between items-center text-xs">
                        <span className="text-[#006d37] font-bold">#{tag}</span>
                        <span className="text-slate-400 font-semibold">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Community Rules */}
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 space-y-3">
                <h4 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">Quy tắc cộng đồng</h4>
                <ul className="space-y-1.5 text-xs text-slate-600 font-medium list-disc list-inside leading-relaxed">
                  <li>Tôn trọng: Không sử dụng ngôn ngữ kích động hay phân biệt đối xử.</li>
                  <li>Xác thực: Chia sẻ kinh nghiệm thật và các câu chuyện thật về thiện dịch.</li>
                  <li>Tập trung: Nội dung phải liên quan đến chủ đề tình nguyện và cộng đồng.</li>
                  <li>Bảo mật: Không chia sẻ cá thông tin cá nhân nhạy cảm của người khác.</li>
                </ul>
              </div>
            </div>

          </div>
        </section>

      </div>

      {/* ===================== CREATE POST MODAL ===================== */}
      {showCreateModal && currentUser && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreatePost}
        />
      )}
    </div>
  );
};

export default FeedView;
