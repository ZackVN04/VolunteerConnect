import React, { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { mediaService } from '../../services/apiService';

// Create Post Modal Component
export const CreatePostModal: React.FC<{ onClose: () => void; onSubmit: (title: string, content: string, images: string[], videoUrl: string | null, hashtags: string[]) => Promise<void> }> = ({ onClose, onSubmit }) => {
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
      let videoUrl: string = '';

      if (imageFile) {
        // Upload image to backend first
        const uploadRes = await mediaService.upload(imageFile);
        imageUrls.push(uploadRes.url);
      }

      if (videoFile) {
        // Upload video to backend
        const uploadRes = await mediaService.upload(videoFile);
        videoUrl = uploadRes.url;
      }

      const tags = hashtagsStr.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);
      // Wait for onSubmit to complete
      await onSubmit(title, content, imageUrls, videoUrl || null, tags);
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
