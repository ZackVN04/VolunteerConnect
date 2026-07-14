import React, { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { mediaService } from '../../services/apiService';
import type { Post } from '../../types/domain';

// Edit Post Modal Component
export const EditPostModal: React.FC<{
  post: Post;
  onClose: () => void;
  onSubmit: (title: string, content: string, images: string[], hashtags: string[]) => Promise<void>;
}> = ({ post, onClose, onSubmit }) => {
  const { showNotification } = useApp();

  // Extract title and body content for editing from content and post.title
  const contentLines = post.content.split('\n');
  const fallbackTitle = contentLines.length > 1 ? contentLines[0] : '';
  const fallbackBody = contentLines.length > 1 ? contentLines.slice(1).join('\n') : post.content;
  const initialTitle = post.title || fallbackTitle;
  const initialBody = post.title ? post.content : fallbackBody;

  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialBody);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(post.images[0] || '');
  const [hashtagsStr, setHashtagsStr] = useState((post.hashtags || []).join(', '));
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setLocalError('Vui lòng nhập tiêu đề bài viết.');
      return;
    }
    if (!content.trim()) {
      setLocalError('Vui lòng nhập nội dung bài viết.');
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    setLocalError('');

    try {
      let imageUrls: string[] = post.images;
      if (imageFile) {
        const uploadRes = await mediaService.upload(imageFile);
        imageUrls = [uploadRes.url];
      } else if (!imagePreview) {
        imageUrls = [];
      }
      const tags = hashtagsStr.split(',').map((t: string) => t.trim().replace(/^#/, '')).filter(Boolean);
      await onSubmit(title.trim(), content.trim(), imageUrls, tags);
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.detail || err.message || 'Không thể cập nhật bài viết. Vui lòng kiểm tra lại.';
      setLocalError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-y-auto max-h-[90vh] animate-scaleUp">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-gray-900 text-xl">Chỉnh sửa bài viết</h3>
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
              placeholder="Nhập tiêu đề..."
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-1 focus:ring-[#006d37] text-sm text-slate-800 transition-all font-semibold"
            />
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-gray-700">Nội dung chi tiết <span className="text-red-500">*</span></label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Nhập nội dung chi tiết bài viết..."
              rows={5}
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-1 focus:ring-[#006d37] text-sm text-slate-800 transition-all leading-relaxed font-medium"
            />
          </div>

          {/* Image Drag and Drop */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-gray-700">Hình ảnh minh họa <span className="text-slate-400 font-normal">(Tùy chọn, tối đa 5MB)</span></label>
            <div
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${isDragging ? 'border-[#006d37] bg-[#e8f5e9]' : 'border-slate-200 hover:border-[#006d37]/50 hover:bg-slate-50'}`}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              {imagePreview ? (
                <div className="relative inline-block" onClick={e => e.stopPropagation()}>
                  <img src={imagePreview} alt="Preview" className="max-h-40 rounded-lg shadow-md border" />
                  <button
                    type="button"
                    onClick={() => { setImagePreview(''); setImageFile(null); }}
                    className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-md transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px] font-bold block">close</span>
                  </button>
                </div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-3xl text-slate-300">image</span>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Kéo thả hình ảnh hoặc nhấp để chọn tệp</p>
                  <p className="text-[10px] text-slate-300 mt-0.5">PNG, JPG, JPEG — tối đa 5MB</p>
                </>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e.target.files?.[0] || null)} />
            </div>
            {imagePreview && (
              <label className="flex items-center gap-2 mt-1 cursor-pointer w-fit" onClick={() => fileRef.current?.click()}>
                <span className="border border-slate-300 bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer">Thay đổi ảnh</span>
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
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-1 focus:ring-[#006d37] text-sm text-slate-800 transition-all font-semibold"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-6 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 text-sm transition-colors cursor-pointer disabled:opacity-50">
              Hủy bỏ
            </button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-[#1a6c3a] hover:bg-[#155c30] text-white font-bold rounded-xl text-sm transition-all shadow-sm cursor-pointer disabled:opacity-50">
              {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
