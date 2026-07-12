import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const RequestOrganizerView: React.FC = () => {
  const { currentUser, submitOrganizerRequest, showNotification } = useApp();

  const [requestContact, setRequestContact] = useState(currentUser?.phone || '');
  const [requestOrgName, setRequestOrgName] = useState('');
  const [requestOrgDesc, setRequestOrgDesc] = useState('');
  const [loading, setLoading] = useState(false);

  if (!currentUser) return null;

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestOrgDesc.trim() || !requestOrgName.trim() || !requestContact.trim()) {
      showNotification('Vui lòng nhập đầy đủ thông tin yêu cầu.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = submitOrganizerRequest(requestOrgDesc, requestOrgName, requestContact);
      const result = res instanceof Promise ? await res : res;
      if (result.success) {
        showNotification('Gửi yêu cầu nâng cấp tài khoản thành công!', 'success');
        setRequestOrgDesc('');
        setRequestOrgName('');
        window.location.hash = '#/profile';
      } else {
        showNotification(result.error || 'Có lỗi xảy ra khi gửi yêu cầu', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Gửi yêu cầu thất bại', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    window.location.hash = '#/profile';
  };

  return (
    <div className="w-full bg-[#f5f5f5] min-h-screen pb-16 text-left font-body-md">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-8">

        {/* Link quay lại */}
        <button
          onClick={handleCancel}
          className="text-[#006d37] hover:underline font-semibold text-sm flex items-center gap-1 mb-6 border-none bg-transparent cursor-pointer"
        >
          &larr; Hủy & Quay lại
        </button>

        {/* Centered Card */}
        <div className="max-w-2xl mx-auto bg-white border border-slate-200/80 rounded-3xl p-8 md:p-10 shadow-sm space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400">Hồ sơ cá nhân &gt; Xin quyền tổ chức</span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 font-headline-md tracking-tight pt-1">
              Đăng ký quyền Ban tổ chức
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed font-semibold pt-2">
              Vui lòng cung cấp đầy đủ thông tin để Ban quản trị kiểm duyệt năng lực tổ chức của bạn. Sau khi phê duyệt, vai trò tài khoản của bạn sẽ đổi thành Organizer và mở khóa chức năng tự tạo hoạt động.
            </p>
          </div>

          <form onSubmit={handleSendRequest} className="space-y-6 pt-2">

            {/* Field 1: SĐT */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Số điện thoại liên hệ khẩn cấp</label>
              <input
                type="text"
                value={requestContact}
                onChange={(e) => setRequestContact(e.target.value)}
                required
                placeholder="Nhập số điện thoại để liên hệ trực tiếp"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-2 focus:ring-[#006d37]/20 text-sm font-semibold text-slate-800 bg-white transition-all"
                disabled={loading}
              />
            </div>

            {/* Field 2: Kinh nghiệm */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Kinh nghiệm hoạt động / Tên tổ chức đại diện</label>
              <textarea
                rows={4}
                value={requestOrgName}
                onChange={(e) => setRequestOrgName(e.target.value)}
                required
                placeholder="Nêu rõ kinh nghiệm làm tình nguyện của bạn hoặc ghi tên câu lạc bộ/nhóm tình nguyện mà bạn đang đại diện..."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-2 focus:ring-[#006d37]/20 text-sm font-semibold text-slate-800 bg-white transition-all resize-none"
                disabled={loading}
              />
            </div>

            {/* Field 3: Lý do */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Lý do muốn trở thành Nhà tổ chức</label>
              <textarea
                rows={4}
                value={requestOrgDesc}
                onChange={(e) => setRequestOrgDesc(e.target.value)}
                required
                placeholder="Chia sẻ mục đích của bạn (ví dụ: Muốn tổ chức gom pin cũ định kỳ hàng tuần, Muốn liên kết các bữa ăn thiện nguyện tại các mái ấm...)"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-2 focus:ring-[#006d37]/20 text-sm font-semibold text-slate-800 bg-white transition-all resize-none"
                disabled={loading}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2.5 border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-colors text-sm font-bold cursor-pointer"
                disabled={loading}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#006d37] hover:bg-emerald-800 text-white rounded-xl transition-colors text-sm font-bold shadow-sm cursor-pointer disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Đang gửi...' : 'Gửi yêu cầu duyệt'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};

export default RequestOrganizerView;
