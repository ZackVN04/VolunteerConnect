import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const FeedView: React.FC = () => {
  const { currentUser, posts, createPost, likePost, users, activities } = useApp();
  const [postContent, setPostContent] = useState('');
  const [hashtagsStr, setHashtagsStr] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Compute stats dynamically from the state
  const totalVolunteers = users.filter(u => u.role === 'Volunteer').length;
  const totalProjectsCompleted = activities.filter(a => a.status === 'Completed').length;
  // Hours is hardcoded or estimated for UI
  const totalHours = 1200000; 

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    // Parse hashtags
    const hashtags = hashtagsStr
      .split(',')
      .map(tag => tag.trim().replace(/^#/, ''))
      .filter(tag => tag.length > 0);

    const images = imageUrl.trim() ? [imageUrl.trim()] : [];

    createPost(postContent, images, hashtags);
    setPostContent('');
    setHashtagsStr('');
    setImageUrl('');
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-xl px-4 md:px-0 py-8 max-w-[1280px] mx-auto w-full">
      {/* Hero Section with Impact Stats */}
      <section className="flex flex-col lg:flex-row gap-lg items-center">
        <div className="lg:w-1/2 flex flex-col gap-6 text-left">
          <h1 className="font-display-lg-mobile lg:font-display-lg text-display-lg-mobile lg:text-display-lg text-on-surface tracking-tight leading-tight">
            Kết Nối Tình Nguyện, Lan Tỏa Yêu Thương
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Nền tảng trực quan giúp kết nối các tình nguyện viên năng động với các hoạt động cộng đồng ý nghĩa. Cùng nhau dọn rác, hiến máu, gây quỹ, hỗ trợ trẻ em khó khăn và tạo ra sức mạnh thay đổi xã hội tốt đẹp hơn.
          </p>
          <div className="flex flex-wrap gap-4 mt-2">
            <a 
              href="#/activities" 
              className="bg-primary text-on-primary px-8 py-4 rounded-lg hover:bg-tertiary transition-all duration-200 active:scale-95 font-label-sm text-sm flex items-center gap-2 shadow-sm"
            >
              Khám Phá Hoạt Động
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </a>
            {currentUser && currentUser.role === 'Volunteer' && (
              <a 
                href="#/profile" 
                className="border border-primary text-primary px-8 py-4 rounded-lg hover:bg-primary-container/20 transition-all duration-200 active:scale-95 font-label-sm text-sm"
              >
                Gửi Đơn Xin Quyền Tổ Chức
              </a>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="lg:w-1/2 grid grid-cols-2 gap-gutter w-full">
          <div className="bg-surface-container-lowest rounded-lg p-6 border border-surface-variant flex flex-col items-center justify-center text-center shadow-sm">
            <span className="material-symbols-outlined text-primary text-4xl mb-2 filled">favorite</span>
            <span className="font-headline-md text-headline-md text-on-surface font-bold">{(12400 + totalVolunteers).toLocaleString()}+</span>
            <span className="font-body-md text-body-md text-on-surface-variant mt-1">Tình nguyện viên</span>
          </div>
          <div className="bg-surface-container-lowest rounded-lg p-6 border border-surface-variant flex flex-col items-center justify-center text-center shadow-sm">
            <span className="material-symbols-outlined text-primary text-4xl mb-2 filled">event_available</span>
            <span className="font-headline-md text-headline-md text-on-surface font-bold">{(850 + totalProjectsCompleted).toLocaleString()}+</span>
            <span className="font-body-md text-body-md text-on-surface-variant mt-1">Chiến dịch hoàn thành</span>
          </div>
          <div className="bg-surface-container-lowest rounded-lg p-6 border border-surface-variant flex flex-col items-center justify-center text-center col-span-2 shadow-sm">
            <span className="material-symbols-outlined text-[#2ECC71] text-4xl mb-2 filled">volunteer_activism</span>
            <span className="font-headline-md text-headline-md text-on-surface font-bold">{(totalHours).toLocaleString()}+</span>
            <span className="font-body-md text-body-md text-on-surface-variant mt-1">Giờ đóng góp xã hội</span>
          </div>
        </div>
      </section>

      {/* Featured Activities Grid */}
      <section className="flex flex-col gap-6 text-left">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-surface-variant pb-4">
          <div className="flex flex-col gap-2">
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
              Hoạt Động Nổi Bật
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant text-sm">
              Khám phá các hoạt động tình nguyện nổi bật và đăng ký tham gia ngay hôm nay.
            </p>
          </div>
          <a 
            href="#/activities" 
            className="text-primary hover:text-primary/80 font-semibold text-sm flex items-center gap-1 transition-colors group"
          >
            Xem tất cả hoạt động
            <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {activities
            .filter(act => act.status === 'Open' || act.status === 'Full')
            .slice(0, 3)
            .map(act => (
              <div 
                key={act._id} 
                className="bg-surface-container-lowest border border-surface-variant rounded-lg overflow-hidden flex flex-col h-[435px] transition-all duration-200 hover:shadow-md"
              >
                {/* Image & Category tag */}
                <div className="relative h-[192px] w-full bg-surface-container-low shrink-0">
                  <img 
                    src={act.image_url || 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80&w=600'} 
                    alt={act.title} 
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-4 left-4 bg-secondary-fixed text-primary font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    {act.categories[0] || 'Tình nguyện'}
                  </span>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col justify-between flex-grow">
                  {/* Title & Status */}
                  <div className="flex justify-between items-start gap-3">
                    <h3 className="font-headline-md text-on-surface text-base md:text-lg font-semibold line-clamp-2 leading-tight">
                      {act.title}
                    </h3>
                    <span className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded font-bold text-xs ${
                      act.status === 'Open' ? 'bg-[#E6F4EA] text-[#137333]' : 'bg-red-50 text-red-600'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${act.status === 'Open' ? 'bg-[#137333]' : 'bg-red-600'}`}></span>
                      {act.status === 'Open' ? 'Đang tuyển' : 'Đã đầy'}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 my-4">
                    <div className="flex items-center gap-2 text-on-surface-variant text-sm">
                      <span className="material-symbols-outlined text-base">calendar_month</span>
                      <span>
                        {new Date(act.start_date).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-on-surface-variant text-sm">
                      <span className="material-symbols-outlined text-base">location_on</span>
                      <span className="line-clamp-1">
                        {act.location.district}, {act.location.province}
                      </span>
                    </div>
                  </div>

                  {/* Button */}
                  <div className="border-t border-surface-variant pt-4 mt-auto">
                    <a 
                      href={`#/activity/${act._id}`}
                      className="w-full bg-primary hover:bg-primary/95 text-white font-bold h-[52px] rounded-lg transition-all duration-200 active:scale-95 flex justify-center items-center gap-2 shadow-sm text-sm"
                    >
                      Xem chi tiết
                    </a>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* Community Feed Area */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter text-left">
        {/* Left column: Feed content */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Bảng Tin Cộng Đồng</h2>
              <p className="font-body-md text-body-md text-on-surface-variant text-sm mt-1">Chia sẻ hình ảnh, trải nghiệm và khoảnh khắc tình nguyện đẹp từ cộng đồng.</p>
            </div>
            <button 
              onClick={() => setShowCreateModal(true)} 
              className="bg-primary text-on-primary hover:bg-tertiary px-4 py-2 rounded-lg font-label-sm text-xs transition-all flex items-center gap-1 shadow"
            >
              <span className="material-symbols-outlined text-sm">edit_note</span>
              Đăng Bài Viết
            </button>
          </div>

          {/* Posts List */}
          <div className="space-y-6">
            {posts.map((post) => {
              const isLiked = post.likedByUserIds?.includes(currentUser?._id || '');
              return (
                <article key={post._id} className="bg-surface-container-lowest rounded-xl border border-surface-variant p-6 shadow-sm hover:shadow-md transition-shadow">
                  {/* Post Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold">
                        {post.denormalized_author.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-on-surface text-base">{post.denormalized_author.name}</span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            post.denormalized_author.role === 'Admin' ? 'bg-red-100 text-red-700' :
                            post.denormalized_author.role === 'Organizer' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {post.denormalized_author.role}
                          </span>
                        </div>
                        <span className="text-xs text-on-surface-variant">
                          {new Date(post.created_at).toLocaleDateString('vi-VN', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            day: 'numeric',
                            month: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <p className="font-body-md text-on-surface text-base leading-relaxed mb-4 whitespace-pre-line">
                    {post.content}
                  </p>

                  {/* Post Image Attachments */}
                  {post.images && post.images.length > 0 && (
                    <div className="rounded-xl overflow-hidden mb-4 border border-outline-variant bg-surface-container-low max-h-[350px]">
                      <img 
                        src={post.images[0]} 
                        alt="Đính kèm bài đăng" 
                        className="w-full h-full object-cover max-h-[350px]"
                      />
                    </div>
                  )}

                  {/* Hashtags */}
                  {post.hashtags && post.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.hashtags.map((tag, idx) => (
                        <span key={idx} className="text-xs font-semibold text-primary bg-primary-container/10 px-2 py-0.5 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Post Footer / Actions */}
                  <div className="flex items-center gap-6 pt-3 border-t border-surface-variant text-sm text-on-surface-variant">
                    <button 
                      onClick={() => likePost(post._id)}
                      className={`flex items-center gap-1.5 hover:text-primary transition-colors ${isLiked ? 'text-primary font-bold' : ''}`}
                    >
                      <span className={`material-symbols-outlined text-lg ${isLiked ? 'filled' : ''}`}>favorite</span>
                      <span>{post.like_count}</span>
                    </button>
                    <span className="flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-lg">comment</span>
                      <span>{post.comment_count} Bình luận</span>
                    </span>
                    <span className="flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-lg">share</span>
                      <span>{post.share_count} Chia sẻ</span>
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* Right column: Quick info panels */}
        <div className="lg:col-span-4 space-y-6">
          {/* Level Progress Panel */}
          {currentUser && (
            <div className="bg-surface-container-lowest rounded-xl border border-surface-variant p-6 shadow-sm">
              <h3 className="font-label-sm text-label-sm text-on-surface mb-3 uppercase tracking-wider font-bold">Cấp độ của tôi</h3>
              <div className="flex justify-between items-center mb-2 text-sm">
                <span className="font-bold text-on-surface">Volunteer Level</span>
                <span className="font-bold text-primary">
                  {currentUser.profile.joined_activity_count >= 5 ? 'Gold 🥇' : 
                   currentUser.profile.joined_activity_count >= 1 ? 'Silver 🥈' : 'Bronze 🥉'}
                </span>
              </div>
              <div className="progress-bar-track my-3">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${Math.min(100, (currentUser.profile.joined_activity_count / 5) * 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-on-surface-variant text-right">
                {currentUser.profile.joined_activity_count >= 5 
                  ? 'Chúc mừng! Bạn đã đạt Cấp độ cao nhất' 
                  : `Hoàn thành thêm ${5 - currentUser.profile.joined_activity_count} hoạt động nữa để lên hạng Vàng`
                }
              </p>
            </div>
          )}

          {/* Quick guidelines */}
          <div className="bg-surface-container-lowest rounded-xl border border-surface-variant p-6 shadow-sm space-y-4">
            <h3 className="font-label-sm text-label-sm text-on-surface uppercase tracking-wider font-bold">Luồng demo chuẩn MVP</h3>
            <ul className="text-xs text-on-surface-variant space-y-2.5 list-decimal pl-4">
              <li>Đăng nhập <strong>Tình nguyện viên A</strong>, vào Hồ sơ cá nhân gửi đơn xin nâng quyền.</li>
              <li>Chuyển qua <strong>Admin</strong> duyệt yêu cầu lên thành vai trò Organizer.</li>
              <li><strong>Organizer B</strong> tạo hoạt động và gửi duyệt.</li>
              <li><strong>Admin</strong> duyệt duyệt hoạt động hiển thị ra công khai.</li>
              <li>Đăng nhập <strong>Tình nguyện viên B</strong> đăng ký hoạt động.</li>
              <li><strong>Organizer</strong> duyệt đơn và cập nhật điểm danh sau sự kiện.</li>
              <li>Bộ đếm hồ sơ Volunteer tăng +1 và Admin theo dõi Dashboard tổng quan.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] modal-overlay flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-xl rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-md py-sm border-b border-surface-variant">
              <h3 className="font-headline-md text-lg text-on-surface font-bold">Tạo bài viết mới</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-surface-variant rounded-full text-on-surface-variant"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreatePost}>
              <div className="p-md space-y-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Nội dung chia sẻ</label>
                  <textarea 
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    required
                    rows={4}
                    placeholder="Bạn đang nghĩ gì? Chia sẻ câu chuyện tình nguyện của bạn..."
                    className="w-full p-3 bg-surface-container-low border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Hashtags (cách nhau bằng dấu phẩy)</label>
                  <input 
                    type="text"
                    value={hashtagsStr}
                    onChange={(e) => setHashtagsStr(e.target.value)}
                    placeholder="ví dụ: tuthien, greenlife, donrac"
                    className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Link ảnh minh họa (Không bắt buộc)</label>
                  <input 
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="ví dụ: https://images.unsplash.com/..."
                    className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                  />
                </div>
              </div>
              <div className="px-md py-sm border-t border-surface-variant flex justify-end gap-2 bg-surface-bright">
                <button 
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-outline-variant text-on-surface-variant rounded-lg hover:bg-surface-variant font-medium text-xs transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-primary text-on-primary hover:bg-tertiary rounded-lg font-medium text-xs shadow transition-colors"
                >
                  Đăng Bài
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default FeedView;
