import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const RequestOrganizerView: React.FC = () => {
  const { currentUser, submitOrganizerRequest, showNotification, organizerRequests } = useApp();

  const userRequest = currentUser ? organizerRequests.find(r => r.volunteer_id === currentUser._id) : undefined;
  const isPending = userRequest?.status === 'Pending';
  const isRejected = userRequest?.status === 'Rejected';

  let inCooldown = false;
  let cooldownHoursRemaining = 0;
  if (isRejected && userRequest) {
    const diffHours = (new Date().getTime() - new Date(userRequest.created_at).getTime()) / (1000 * 60 * 60);
    if (diffHours < 24) {
      inCooldown = true;
      cooldownHoursRemaining = Math.ceil(24 - diffHours);
    }
  }

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
    if (requestOrgDesc.trim().length < 10 || requestOrgDesc.trim().length > 500) {
      showNotification('Lý do muốn trở thành Nhà tổ chức phải từ 10 đến 500 ký tự.', 'error');
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
    window.history.back();
  };

  return (
    <div className="w-full bg-[#f5f5f5] min-h-screen pb-16 text-left font-body-md">
      <div className="max-w-[1280px] mx-auto px-3 sm:px-4 md:px-8 py-5 sm:py-8">

        {/* Link quay lại */}
        <button
          onClick={handleCancel}
          className="text-[#006d37] hover:underline font-semibold text-sm flex items-center gap-1 mb-6 border-none bg-transparent cursor-pointer"
        >
          &larr; Quay lại
        </button>

        {/* Centered Card */}
        <div className="max-w-2xl mx-auto bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-8 md:p-10 shadow-sm space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400">Hồ sơ cá nhân &gt; Xin quyền tổ chức</span>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 font-headline-md tracking-tight pt-1">
              Đăng ký quyền Ban tổ chức
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed font-semibold pt-2">
              Vui lòng cung cấp đầy đủ thông tin để Ban quản trị kiểm duyệt năng lực tổ chức của bạn. Sau khi phê duyệt, vai trò tài khoản của bạn sẽ đổi thành Organizer và mở khóa chức năng tự tạo hoạt động.
            </p>
          </div>

          {(isPending || inCooldown) ? (
            <div className={`p-5 rounded-2xl border ${isPending ? 'bg-[#fef7e0] border-[#b06000]/30 text-[#b06000]' : 'bg-red-50 border-red-200 text-red-700'} font-semibold text-sm`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined">{isPending ? 'hourglass_empty' : 'cancel'}</span>
                <h3 className="text-base font-bold">{isPending ? 'Đơn đăng ký đang được xử lý' : 'Bạn đang trong thời gian chờ (Cooldown)'}</h3>
              </div>
              <p>
                {isPending 
                  ? 'Bạn đã gửi một đơn xin cấp quyền và đang chờ Ban quản trị phê duyệt. Vui lòng kiểm tra lại sau.'
                  : `Yêu cầu trước đó của bạn đã bị từ chối. Vui lòng chờ thêm ${cooldownHoursRemaining} giờ nữa để có thể gửi lại yêu cầu mới.`}
              </p>
              <div className="mt-4 text-center md:text-left">
                <a href="#/profile" className="inline-block bg-[#006d37] hover:bg-emerald-800 text-white font-bold py-2 px-6 rounded-xl transition-all shadow-sm">
                  Quay về Hồ sơ
                </a>
              </div>
            </div>
          ) : (
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
                maxLength={500}
                placeholder="Chia sẻ mục đích của bạn (ví dụ: Muốn tổ chức gom pin cũ định kỳ hàng tuần, Muốn liên kết các bữa ăn thiện nguyện tại các mái ấm...)"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-2 focus:ring-[#006d37]/20 text-sm font-semibold text-slate-800 bg-white transition-all resize-none"
                disabled={loading}
              />
              <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 font-semibold">
                <span>Vui lòng điền chi tiết từ 10 đến 500 ký tự</span>
                <span className={requestOrgDesc.length >= 500 ? 'text-red-500 font-bold' : ''}>
                  {requestOrgDesc.length}/500
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCancel}
                className="w-full sm:w-auto px-6 py-2.5 border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-colors text-sm font-bold cursor-pointer"
                disabled={loading}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 bg-[#006d37] hover:bg-emerald-800 text-white rounded-xl transition-colors text-sm font-bold shadow-sm cursor-pointer disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Đang gửi...' : 'Gửi yêu cầu duyệt'}
              </button>
            </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
};

export default RequestOrganizerView;
