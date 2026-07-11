import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { mediaService, commentService } from '../services/apiService';

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
const CreatePostModal: React.FC<{ onClose: () => void; onSubmit: (title: string, content: string, images: string[], videoUrl: string, hashtags: string[]) => Promise<void> }> = ({ onClose, onSubmit }) => {
  const { showNotification } = useApp();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('');
  const [isVideoDragging, setIsVideoDragging] = useState(false);
  const [hashtagsStr, setHashtagsStr] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    setLocalError('');
    if (file.size > 5 * 1024 * 1024) {
      setLocalError('Kích thước ảnh vượt quá giới hạn cho phép (Tối đa 5MB).');
      showNotification('Kích thước ảnh vượt quá giới hạn cho phép (Tối đa 5MB).', 'error');
      return;
    }
    setImageFile(file);
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

  const handleVideoFileChange = (file: File | null) => {
    if (!file) return;
    setLocalError('');
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/ogg'];
    if (!validTypes.includes(file.type)) {
      setLocalError('Chỉ chấp nhận file video (MP4, MOV, AVI, WebM).');
      showNotification('Chỉ chấp nhận file video (MP4, MOV, AVI, WebM).', 'error');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setLocalError('Kích thước video vượt quá giới hạn cho phép (Tối đa 100MB).');
      showNotification('Kích thước video vượt quá giới hạn cho phép (Tối đa 100MB).', 'error');
      return;
    }
    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
  };

  const handleVideoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsVideoDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) handleVideoFileChange(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setLocalError('');

    try {
      let imageUrls: string[] = [];
      if (imageFile) {
        // Upload image to backend first
        const uploadRes = await mediaService.upload(imageFile);
        imageUrls.push(uploadRes.url);
      }
      const tags = hashtagsStr.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);
      // Wait for onSubmit to complete
      await onSubmit(title, content, imageUrls, videoFile ? videoFile.name : '', tags);
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.detail || err.message || 'Không thể đăng bài viết. Vui lòng kiểm tra lại.';
      setLocalError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      setIsSubmitting(false);
    }
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
          {/* Local Error Alert */}
          {localError && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{localError}</span>
            </div>
          )}

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

          {/* Video Upload */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-gray-700">Video minh họa <span className="text-slate-400 font-normal">(Tùy chọn, tối đa 100MB)</span></label>
            <div
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${isVideoDragging ? 'border-[#006d37] bg-[#e8f5e9]' : 'border-slate-200 hover:border-[#006d37]/50 hover:bg-slate-50'}`}
              onDragOver={e => { e.preventDefault(); setIsVideoDragging(true); }}
              onDragLeave={() => setIsVideoDragging(false)}
              onDrop={handleVideoDrop}
              onClick={() => videoRef.current?.click()}
            >
              {videoFile && videoPreviewUrl ? (
                <div className="flex items-center gap-3 justify-center" onClick={e => e.stopPropagation()}>
                  <video src={videoPreviewUrl} className="h-20 rounded-lg" controls />
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-700 truncate max-w-[160px]">{videoFile.name}</p>
                    <p className="text-[10px] text-slate-400">{(videoFile.size / 1024 / 1024).toFixed(1)} MB</p>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setVideoFile(null); setVideoPreviewUrl(''); }}
                      className="text-[10px] text-red-500 font-bold hover:underline mt-0.5 cursor-pointer"
                    >
                      Xóa video
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-3xl text-slate-300">videocam</span>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Kéo thả file video hoặc nhấp để tải lên</p>
                  <p className="text-[10px] text-slate-300 mt-0.5">MP4, MOV, AVI, WebM — tối đa 100MB</p>
                </>
              )}
              <input
                ref={videoRef}
                type="file"
                accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,video/ogg"
                className="hidden"
                onChange={e => handleVideoFileChange(e.target.files?.[0] || null)}
              />
            </div>
            {!videoFile && (
              <label className="flex items-center gap-2 mt-1 cursor-pointer w-fit" onClick={() => videoRef.current?.click()}>
                <span className="border border-slate-300 bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer">Chọn Tệp Video</span>
                <span className="text-xs text-slate-400">Không tệp nào được chọn</span>
              </label>
            )}
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
            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-6 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 text-sm transition-colors cursor-pointer disabled:opacity-50">
              Hủy bỏ
            </button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-[#1a6c3a] hover:bg-[#155c30] text-white font-bold rounded-xl text-sm transition-all shadow-sm cursor-pointer disabled:opacity-50">
              {isSubmitting ? 'Đang đăng...' : 'Đăng bài viết'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export interface PostComment {
  _id: string;
  post_id: string;
  author_name: string;
  author_avatar?: string;
  content: string;
  created_at: string;
}

export const FeedView: React.FC = () => {
  const { currentUser, users, activities, posts, createPost, likePost, sharePost, deletePost, incrementCommentCount, showNotification } = useApp();
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [openMenuPostId, setOpenMenuPostId] = useState<string | null>(null);
  const itemsPerPage = 3;

  // Community Feed Pagination states
  const [feedPage, setFeedPage] = useState(1);
  const postsPerPage = 5;

  useEffect(() => {
    setFeedPage(1);
  }, [searchQuery]);

  // Comments states
  const [commentsMap, setCommentsMap] = useState<Record<string, PostComment[]>>({});
  const [showCommentsPostId, setShowCommentsPostId] = useState<string | null>(null);
  const [newCommentTexts, setNewCommentTexts] = useState<Record<string, string>>({});
  const fetchingPostIds = useRef<Set<string>>(new Set());

  // Load comments when opening a post
  useEffect(() => {
    if (showCommentsPostId) {
      const fetchComments = async () => {
        try {
          const fetched = await commentService.getComments(showCommentsPostId);
          const mappedComments = fetched.map((c: any) => ({
            _id: c.id || c._id,
            post_id: showCommentsPostId,
            author_name: c.author_name || 'Thành viên',
            author_avatar: c.author_avatar,
            content: c.content,
            created_at: c.created_at
          }));
          
          setCommentsMap(prev => ({
            ...prev,
            [showCommentsPostId]: mappedComments
          }));
        } catch (e) {
          console.error("Lỗi lấy bình luận:", e);
        }
      };
      fetchComments();
    }
  }, [showCommentsPostId]);

  // Banner slide state
  const bannerImages = [
    "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=800&q=80"
  ];
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveImageIndex((prevIndex) => (prevIndex + 1) % bannerImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleAddComment = async (postId: string) => {
    const text = newCommentTexts[postId]?.trim();
    if (!text) return;

    try {
      const createdComment = await commentService.createComment(postId, text);
      const newComment: PostComment = {
        _id: createdComment.id || createdComment._id || `comment_${Date.now()}`,
        post_id: postId,
        author_name: currentUser?.profile.full_name || 'Thành viên',
        author_avatar: currentUser?.profile.avatar_url,
        content: text,
        created_at: new Date().toISOString()
      };

      const postComments = commentsMap[postId] || [];
      const updatedComments = [...postComments, newComment];
      const updatedMap = {
        ...commentsMap,
        [postId]: updatedComments
      };

      setCommentsMap(updatedMap);

      // Clear comment input
      setNewCommentTexts({
        ...newCommentTexts,
        [postId]: ''
      });
      // Increment comment count in context state to trigger re-render and immediately update the counter on screen
      incrementCommentCount(postId);
    } catch (error) {
      console.error('Lỗi khi thêm bình luận', error);
      showNotification('Lỗi khi gửi bình luận.', 'error');
    }
  };

  // Stats
  const totalCampaigns = activities.length;
  const totalVolunteers = users.filter(u => u.role === 'Volunteer').length;
  const totalOrganizers = users.filter(u => u.role === 'Organizer').length;
  const totalCompleted = activities.filter(a => a.status === 'Completed').length;

  // Featured activities
  const featuredList = activities.filter(a => a.status === 'Open' || a.status === 'Full');
  const totalPages = Math.ceil(featuredList.length / itemsPerPage);
  const featuredActivities = featuredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Filter posts based on search query
  const filteredPosts = posts.filter(post => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const contentMatch = post.content.toLowerCase().includes(query);
    const hashtagMatch = (post.hashtags || []).some(tag => tag.toLowerCase().includes(query));
    return contentMatch || hashtagMatch;
  });

  const totalFeedPages = Math.ceil(filteredPosts.length / postsPerPage);
  const paginatedPosts = filteredPosts.slice((feedPage - 1) * postsPerPage, feedPage * postsPerPage);

  const postIdsString = paginatedPosts.map(p => p._id).join(',');

  // Pre-loading comment counts was removed to fix N+1 query performance bottleneck.
  // Comments will now only load on-demand when the user opens the comment section.


  // Relative time helper
  const formatRelativeTime = (dateStr: string): string => {
    if (!dateStr) return '';
    let cleanDateStr = dateStr;
    // Force naive ISO strings to be treated as UTC
    if (cleanDateStr.includes('T') && !cleanDateStr.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(cleanDateStr)) {
      cleanDateStr += 'Z';
    } else if (!cleanDateStr.includes('T') && !cleanDateStr.includes('Z')) {
      cleanDateStr = cleanDateStr.replace(' ', 'T') + 'Z';
    }
    const diff = Date.now() - new Date(cleanDateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Vừa xong';
    if (mins < 60) return `${mins} phút trước`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} giờ trước`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days} ngày trước`;
    return new Date(cleanDateStr).toLocaleDateString('vi-VN');
  };

  const handleCreatePost = async (title: string, content: string, images: string[], _videoUrl: string, hashtags: string[]) => {
    if (!currentUser) return;
    const res = await createPost(title, content, images, hashtags);
    if (res.success) {
      setShowCreateModal(false);
      showNotification('Đã đăng bài viết thành công!', 'success');
    } else {
      throw new Error(res.error || 'Đăng bài viết thất bại.');
    }
  };


  const handleDelete = async (postId: string) => {
    setOpenMenuPostId(null);
    setDeletingPostId(postId);
    const result = await deletePost(postId);
    setDeletingPostId(null);
    if (result.success) {
      showNotification('Đã xóa bài viết thành công!', 'success');
    } else {
      showNotification(result.error || 'Xóa bài viết thất bại!', 'error');
    }
  };

  return (
    <div className="w-full bg-[#f8f9fa] min-h-screen pb-16 text-left antialiased">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-8 space-y-12">

        {/* ===================== HERO SECTION ===================== */}
        <section className="bg-[#f0f9f4] rounded-[2rem] p-8 md:p-12 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="lg:w-1/2 space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-on-surface leading-tight font-headline-md">
              Kết nối sức trẻ<br />
              <span className="text-[#006d37]">Lan tỏa giá trị cho cộng đồng</span>
            </h1>
            <p className="text-on-surface-variant text-base md:text-lg leading-relaxed">
              Volunteer Connect mang đến không gian nơi mỗi người đều có thể đóng góp cho xã hội. Khám phá các hoạt động tình nguyện uy tín, đồng hành cùng những con người cùng chí hướng và lưu giữ hành trình tạo nên những thay đổi tích cực.
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
            <div className="w-full max-w-[500px] h-[300px] rounded-3xl overflow-hidden shadow-md relative group">
              {bannerImages.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Volunteer Community ${idx + 1}`}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${idx === activeImageIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                />
              ))}

              {/* Dots navigation indicator */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
                {bannerImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${idx === activeImageIndex ? 'bg-white w-6' : 'bg-white/50'}`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Prev / Next controls */}
              <button
                type="button"
                onClick={() => setActiveImageIndex((prev) => (prev - 1 + bannerImages.length) % bannerImages.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-20 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveImageIndex((prev) => (prev + 1) % bannerImages.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-20 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">chevron_right</span>
              </button>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredActivities.map(act => (
                  <div
                    key={act._id}
                    onClick={() => { window.location.hash = `#/activity/${act._id}`; }}
                    className="bg-white border border-surface-variant/40 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col cursor-pointer"
                  >
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
                        <a href={`#/activity/${act._id}`} onClick={(e) => e.stopPropagation()} className="flex-1 text-center bg-[#006d37] hover:bg-emerald-800 text-white font-bold py-2 rounded-xl text-xs transition-all">
                          Đang mở đăng ký
                        </a>
                        <a href={`#/activity/${act._id}`} onClick={(e) => e.stopPropagation()} className="flex-1 text-center border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold py-2 rounded-xl text-xs transition-all">
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

        {/* ===================== LỢI ÍCH KHI THAM GIA ===================== */}
        <section className="space-y-6 text-center py-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900 font-headline-md">Lợi ích khi tham gia</h2>
            <p className="text-slate-500 text-sm font-medium max-w-2xl mx-auto leading-relaxed">
              Volunteer Connect mang đến nền tảng toàn diện để bạn dễ dàng bắt đầu hành trình tạo tác động xã hội.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center md:items-start text-center md:text-left">
              <div className="bg-[#e8f5e9] w-12 h-12 rounded-full flex items-center justify-center text-[#006d37] shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-2xl font-bold">search</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-4">Tìm kiếm dễ dàng</h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-2">
                Khám phá và lọc các hoạt động tình nguyện theo sở thích cá nhân, kỹ năng chuyên môn, vị trí địa lý và thời gian rảnh rỗi của bạn chỉ với vài cú click.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center md:items-start text-center md:text-left">
              <div className="bg-[#e8f5e9] w-12 h-12 rounded-full flex items-center justify-center text-[#006d37] shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-2xl font-bold">trending_up</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-4">Theo dõi tác động</h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-2">
                Ghi nhận chính xác số giờ đóng góp, theo dõi các dự án đã tham gia và nhận chứng nhận để đánh giá trực quan mức độ ảnh hưởng của bạn đến cộng đồng.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center md:items-start text-center md:text-left">
              <div className="bg-[#e8f5e9] w-12 h-12 rounded-full flex items-center justify-center text-[#006d37] shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-2xl font-bold">groups</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-4">Cộng đồng năng động</h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-2">
                Kết nối sâu sắc với những cá nhân cùng chung chí hướng, trao đổi kinh nghiệm và xây dựng một mạng lưới quan hệ ý nghĩa, lâu dài.
              </p>
            </div>
          </div>
        </section>

        {/* ===================== DÀNH CHO TỔ CHỨC ===================== */}
        <section className="bg-white border border-slate-200/60 rounded-3xl p-6 md:p-10 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Info */}
            <div className="lg:col-span-7 space-y-5 text-left flex flex-col">
              <span className="bg-slate-100 text-slate-600 font-bold text-xs px-3 py-1.5 rounded-full w-fit shadow-sm">
                Dành cho tổ chức
              </span>
              <div className="space-y-2">
                <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 font-headline-md tracking-tight">
                  Bạn là tổ chức phi lợi nhuận?
                </h3>
                <p className="text-sm text-slate-500 font-semibold leading-relaxed">
                  Đăng tuyển tình nguyện viên dễ dàng, quản lý dự án hiệu quả và mở rộng tầm ảnh hưởng của tổ chức bạn tới hàng ngàn người trẻ nhiệt huyết trên nền tảng của chúng tôi.
                </p>
              </div>

              {/* Checklist */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[#006d37] text-xl font-bold">check_circle</span>
                  <span className="text-xs font-bold text-slate-700">Tiếp cận nguồn tình nguyện viên dồi dào</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[#006d37] text-xl font-bold">check_circle</span>
                  <span className="text-xs font-bold text-slate-700">Công cụ quản lý sự kiện và người tham gia thông minh</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[#006d37] text-xl font-bold">check_circle</span>
                  <span className="text-xs font-bold text-slate-700">Cấp chứng nhận tự động</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3">
                <button 
                  onClick={() => window.location.hash = '#/request-organizer'}
                  className="bg-[#121212] hover:bg-[#2c2c2c] text-white font-bold rounded-xl py-3.5 px-6 text-xs transition-all shadow hover:shadow-md flex items-center gap-2 cursor-pointer"
                >
                  Đăng ký tổ chức
                  <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                </button>
              </div>
            </div>

            {/* Right Image */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm aspect-[4/3] bg-slate-50">
                <img 
                  src="https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=800" 
                  alt="Dành cho tổ chức" 
                  className="w-full h-full object-cover" 
                />
              </div>
            </div>
          </div>
        </section>

        {/* ===================== BẢNG TIN CỘNG ĐỒNG ===================== */}
        <section id="community-feed-section" className="space-y-4">
          <div className="border-b border-surface-variant/40 pb-4">
            <h2 className="text-2xl font-bold text-on-surface font-headline-md">Bảng tin cộng đồng</h2>
            <p className="text-on-surface-variant text-sm mt-1">Chia sẻ những khoảnh khắc, câu chuyện ý nghĩa và cùng nhau lan tỏa các chiến dịch tình nguyện</p>
          </div>

          <div className="max-w-[850px] mx-auto w-full space-y-5">
            {/* Search Box & Add Post Button */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch">
              <div className="flex-1 bg-white border border-slate-200/80 rounded-xl flex items-center gap-2.5 px-3.5 py-2 shadow-sm focus-within:border-[#006d37] focus-within:ring-2 focus-within:ring-[#006d37]/10 transition-all">
                <span className="material-symbols-outlined text-slate-400 text-lg">search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm hoặc lọc theo hashtag (ví dụ: MuaHeXanh)..."
                  className="flex-1 bg-transparent text-slate-700 text-xs md:text-sm font-semibold focus:outline-none placeholder-slate-400"
                />
              </div>
              {currentUser && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="shrink-0 bg-[#006d37] hover:bg-emerald-800 text-white font-bold text-xs md:text-sm px-5 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  Đăng bài viết mới
                </button>
              )}
            </div>

            {/* Posts list */}
            <div className="space-y-5">
              {filteredPosts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 bg-white border border-slate-200/80 rounded-2xl">
                  <span className="material-symbols-outlined text-5xl text-slate-300">chat_bubble_outline</span>
                  <p className="text-slate-500 font-semibold text-sm">Không tìm thấy bài viết phù hợp.</p>
                </div>
              ) : (
                paginatedPosts.map(post => {
                  const authorUser = users.find(u => u._id === post.author_id);
                  const authorName = authorUser?.profile.full_name || post.denormalized_author?.name || 'Thành viên';
                  const avatarUrl = authorUser?.profile.avatar_url;
                  const isLiked = currentUser && post.likedByUserIds?.includes(currentUser._id);
                  const authorRole = post.denormalized_author?.role === 'Organizer' ? 'Ban tổ chức' : (post.denormalized_author?.role === 'Admin' ? 'Quản trị viên' : 'Tình nguyện viên');
                  const canDelete = currentUser && (post.author_id === currentUser._id || currentUser.role === 'Admin');
                  const isDeleting = deletingPostId === post._id;

                  // Split title (first line) and body content
                  const contentLines = post.content.split('\n');
                  const postTitle = contentLines.length > 1 ? contentLines[0] : null;
                  const postBody = contentLines.length > 1 ? contentLines.slice(1).join('\n') : post.content;

                  return (
                    <div
                      key={post._id}
                      className={`bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-4 hover:shadow-md transition-all relative ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      {/* Post Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <PostAvatar name={authorName} src={avatarUrl} size={44} />
                          <div>
                            <p className="font-bold text-sm text-slate-800">{authorName}</p>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#006d37]">{authorRole}</span>
                              <span className="text-slate-300 text-[10px]">•</span>
                              <span className="text-[10px] text-slate-400 font-semibold">{formatRelativeTime(post.created_at)}</span>
                            </div>
                          </div>
                        </div>


                        {/* 3-dot menu for owner/admin */}
                        {canDelete && (
                          <div className="relative">
                            <button
                              onClick={() => setOpenMenuPostId(openMenuPostId === post._id ? null : post._id)}
                              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-xl">more_horiz</span>
                            </button>
                            {openMenuPostId === post._id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setOpenMenuPostId(null)}
                                />
                                <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-20 animate-fadeIn">
                                  <button
                                    onClick={() => handleDelete(post._id)}
                                    className="w-full flex items-center gap-2.5 px-4 py-2 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors cursor-pointer text-left"
                                  >
                                    <span className="material-symbols-outlined text-sm text-red-500">delete</span>
                                    Xóa bài viết
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Post Title (if exists) */}
                      {postTitle && (
                        <h3 className="font-bold text-base text-slate-900 leading-snug">{postTitle}</h3>
                      )}

                      {/* Post Body */}
                      <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line font-medium">{postBody}</p>

                      {/* Post images */}
                      {post.images && post.images.length > 0 && (
                        <div className={`rounded-xl overflow-hidden border border-slate-100 ${post.images.length > 1 ? 'grid grid-cols-2 gap-1' : 'max-h-[320px]'}`}>
                          {post.images.slice(0, 4).map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`Post image ${idx + 1}`}
                              className="w-full object-cover"
                              style={{ maxHeight: post.images.length > 1 ? '180px' : '320px' }}
                            />
                          ))}
                        </div>
                      )}

                      {/* Hashtags */}
                      {post.hashtags && post.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {post.hashtags.map((tag, idx) => (
                            <button
                              key={idx}
                              onClick={() => setSearchQuery(tag)}
                              className="bg-emerald-50 text-[#006d37] border border-emerald-100/50 px-2 py-0.5 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                            >
                              #{tag}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Actions: Like, Comment, Share */}
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-bold border-t border-slate-100 pt-3">
                        <button
                          onClick={() => likePost(post._id)}
                          className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl hover:bg-slate-50 transition-all cursor-pointer ${isLiked ? 'text-rose-500 bg-rose-50' : 'hover:text-slate-700'}`}
                        >
                          <span className="material-symbols-outlined text-lg pointer-events-none" style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0", color: isLiked ? '#f43f5e' : 'inherit' }}>favorite</span>
                          <span>{isLiked ? 'Đã thích' : 'Thích'} ({post.like_count || 0})</span>
                        </button>

                        <button
                          onClick={() => setShowCommentsPostId(showCommentsPostId === post._id ? null : post._id)}
                          className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl hover:bg-slate-50 hover:text-slate-700 transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-lg">chat_bubble</span>
                          <span>Bình luận ({commentsMap[post._id] !== undefined ? commentsMap[post._id].length : (post.comment_count || 0)})</span>
                        </button>

                        <button
                          onClick={async () => {
                            try {
                              if (navigator.share) {
                                await navigator.share({
                                  title: postTitle || 'Volunteer Connect Post',
                                  text: postBody,
                                  url: window.location.href,
                                });
                                sharePost(post._id);
                              } else {
                                await navigator.clipboard.writeText(`${window.location.href}/posts`);
                                showNotification('Đã sao chép liên kết bài viết!', 'success');
                                sharePost(post._id);
                              }
                            } catch (err) {
                              console.log('Chia sẻ bị hủy hoặc gặp lỗi:', err);
                            }
                          }}
                          className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl hover:bg-slate-50 hover:text-slate-700 transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-lg">share</span>
                          <span>Chia sẻ ({post.share_count || 0})</span>
                        </button>
                      </div>

                      {/* Comments Section */}
                      {showCommentsPostId === post._id && (
                        <div className="border-t border-slate-100 pt-4 space-y-4 animate-fadeIn text-left">
                          {/* Comment Input */}
                          {currentUser ? (
                            <div className="flex items-start gap-3">
                              <PostAvatar name={currentUser.profile.full_name} src={currentUser.profile.avatar_url} size={36} />
                              <div className="flex-1 flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Viết bình luận của bạn..."
                                  value={newCommentTexts[post._id] || ''}
                                  onChange={(e) => setNewCommentTexts({
                                    ...newCommentTexts,
                                    [post._id]: e.target.value
                                  })}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleAddComment(post._id);
                                    }
                                  }}
                                  className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#006d37] focus:ring-1 focus:ring-[#006d37] bg-slate-50/50 font-semibold"
                                />
                                <button
                                  onClick={() => handleAddComment(post._id)}
                                  className="bg-[#006d37] hover:bg-[#005027] text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
                                >
                                  Gửi
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 font-semibold italic">Vui lòng đăng nhập để viết bình luận.</p>
                          )}

                          {/* Comments List */}
                          <div className="space-y-3.5 max-h-[250px] overflow-y-auto pr-1">
                            {(commentsMap[post._id] || []).length === 0 ? (
                              <p className="text-xs text-slate-400 italic">Chưa có bình luận nào cho bài viết này.</p>
                            ) : (
                              (commentsMap[post._id] || []).map((comment) => (
                                <div key={comment._id} className="flex gap-3 text-xs bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                                  <PostAvatar name={comment.author_name} src={comment.author_avatar} size={32} />
                                  <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-slate-800">{comment.author_name}</span>
                                      <span className="text-[10px] text-slate-400 font-semibold">{formatRelativeTime(comment.created_at)}</span>
                                    </div>
                                    <p className="text-slate-600 font-semibold leading-relaxed">{comment.content}</p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Community Feed Pagination */}
            {totalFeedPages > 1 && (
              <div className="flex justify-center gap-2 pt-6">
                {Array.from({ length: totalFeedPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setFeedPage(i + 1);
                      const postsContainer = document.getElementById('community-feed-section');
                      if (postsContainer) {
                        postsContainer.scrollIntoView({ behavior: 'smooth' });
                      } else {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className={`w-8 h-8 rounded-full text-sm font-bold transition-all ${
                      feedPage === i + 1
                        ? 'bg-[#006d37] text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}

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
