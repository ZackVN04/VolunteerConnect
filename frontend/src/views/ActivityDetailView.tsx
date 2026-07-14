import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { activityService } from '../services/apiService';
import { USE_REAL_BACKEND } from '../config/backend';
import type { Activity } from '../context/AppContext';

interface ActivityDetailViewProps {
  activityId: string;
}

// Helper: avatar fallback with initials
const ContactAvatar: React.FC<{ name: string; src?: string | null }> = ({ name, src }) => {
  if (src) {
    return <img alt="Contact avatar" className="w-full h-full object-cover" src={src} />;
  }
  const initials = name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  const colors = ['#006d37', '#0d6efd', '#6f42c1', '#fd7e14', '#20c997'];
  const bg = colors[name.charCodeAt(0) % colors.length];
  return (
    <div style={{ background: bg, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#fff', fontWeight: 700, fontSize: 16, fontFamily: 'inherit' }}>{initials}</span>
    </div>
  );
};

export const ActivityDetailView: React.FC<ActivityDetailViewProps> = ({ activityId }) => {
  const { currentUser, users, activities, registrations, registerForActivity, cancelOrRejectRegistration, showNotification, showConfirm } = useApp();

  const [activity, setActivity] = useState<Activity | null>(
    activities.find(a => a._id === activityId) || null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (USE_REAL_BACKEND && activityId) {
      setLoading(true);
      activityService.getById(activityId)
        .then(act => {
          if (active) {
            setActivity(act);
            setLoading(false);
          }
        })
        .catch(err => {
          console.error("Lỗi lấy chi tiết hoạt động từ server:", err);
          if (active) {
            setLoading(false);
          }
        });
    } else {
      const act = activities.find(a => a._id === activityId);
      setActivity(act || null);
      setLoading(false);
    }
    return () => {
      active = false;
    };
  }, [activityId, activities]);

  const organizerUser = users.find(u => u._id === activity?.organizer_id);

  // Check if current user is registered for this activity
  const userRegistration = registrations.find(
    r => r.volunteer_id === currentUser?._id && r.activity_id === activityId
  );

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#006d37] mx-auto"></div>
        <p className="text-sm text-on-surface-variant font-medium">Đang tải thông tin hoạt động...</p>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto text-left">
        <span className="material-symbols-outlined text-outline text-6xl">campaign</span>
        <h2 className="font-headline-md text-xl font-bold text-on-surface">Không tìm thấy hoạt động</h2>
        <p className="text-sm text-on-surface-variant">Hoạt động có thể đã bị xóa hoặc đường dẫn không chính xác.</p>
        <button
          onClick={() => window.history.back()}
          className="inline-block bg-[#006d37] text-white px-6 py-2 rounded-lg font-medium text-xs shadow cursor-pointer border-none"
        >
          Quay lại trang trước
        </button>
      </div>
    );
  }

  const handleRegister = async () => {
    const res = registerForActivity(activity._id);
    const result = res instanceof Promise ? await res : res;
    if (result.success) {
      showNotification('Yêu cầu tham gia của bạn đã được gửi. Vui lòng chờ Ban tổ chức duyệt.', 'success');
    } else {
      showNotification(result.error || 'Có lỗi xảy ra khi đăng ký', 'error');
    }
  };

  const handleCancelRegistration = () => {
    if (userRegistration) {
      showConfirm(
        'Bạn chắc chắn muốn hủy đăng ký tham gia hoạt động này?',
        async () => {
          const res = cancelOrRejectRegistration(userRegistration._id);
          const result = res instanceof Promise ? await res : res;
          if (result && result.error) {
            showNotification(result.error, 'error');
          } else {
            showNotification('Đã hủy đăng ký thành công!', 'success');
          }
        },
        'Hủy đăng ký tham gia'
      );
    }
  };

  // Status badge config for registration sidebar
  let statusText = 'Chưa đăng ký';
  let statusClass = 'bg-slate-100 text-slate-700';
  if (userRegistration) {
    if (userRegistration.status === 'Approved') {
      statusText = 'Đã duyệt tham gia';
      statusClass = 'bg-[#e8f5e9] text-[#006d37]';
    } else if (userRegistration.status === 'Pending') {
      statusText = 'Đang chờ duyệt';
      statusClass = 'bg-[#fef7e0] text-[#b06000]';
    } else if (userRegistration.status === 'Rejected') {
      statusText = 'Bị từ chối';
      statusClass = 'bg-red-50 text-red-650';
    } else if (userRegistration.status === 'Cancelled') {
      statusText = 'Đã hủy đăng ký';
      statusClass = 'bg-slate-100 text-slate-500';
    } else if (userRegistration.status === 'Completed') {
      statusText = 'Đã hoàn thành';
      statusClass = 'bg-emerald-50 text-[#006d37]';
    } else if (userRegistration.status === 'Absent') {
      statusText = 'Vắng mặt';
      statusClass = 'bg-red-50 text-red-600';
    }
  }

  // Formatting date string nicely: HH:MM:SS DD/MM/YYYY
  const formatDateTime = (isoString: string) => {
    const d = new Date(isoString);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();
    return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
  };

  return (
    <div className="w-full bg-[#f8f9fa] min-h-screen pb-16">
      {/* Container */}
      <div className="max-w-[1280px] mx-auto px-3 sm:px-4 md:px-8 py-5 sm:py-8 text-left">

        {/* Back Link */}
        <button
          onClick={() => window.history.back()}
          className="text-[#006d37] hover:underline font-semibold text-sm inline-flex items-center gap-1 mb-6 border-none bg-transparent cursor-pointer p-0"
        >
          &larr; Quay lại
        </button>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8">

          {/* Left Column (8 cols): Content */}
          <div className="lg:col-span-8 bg-white border border-surface-variant/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6">

            {/* Wide Campaign Image */}
            <div className="w-full h-[220px] sm:h-[300px] md:h-[400px] rounded-2xl overflow-hidden shadow-sm bg-surface-container-low">
              <img
                src={activity.image_url || 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?q=80&w=600'}
                alt={activity.title}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?q=80&w=600'; }}
              />
            </div>

            {/* Category Tag */}
            <div>
              <span className="bg-[#006d37] text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                {activity.categories[0] || 'Tình nguyện'}
              </span>
            </div>

            {/* Campaign Title */}
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-on-surface font-headline-md leading-tight break-words">
              {activity.title}
            </h1>

            {/* Description Block */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-on-surface border-b border-surface-variant/40 pb-2">
                Mô tả hoạt động
              </h2>
              <p className="text-on-surface-variant text-sm md:text-base leading-relaxed whitespace-pre-line">
                {activity.description}
              </p>
            </div>

            {/* Contact Person Card */}
            <div className="space-y-4 pt-4">
              <h2 className="text-lg font-bold text-on-surface border-b border-surface-variant/40 pb-2">
                Người liên hệ & Tổ chức
              </h2>
              <a
                href={`#/profile?userId=${activity.organizer_id}`}
                className="flex items-center gap-4 bg-white border border-surface-variant/40 rounded-2xl p-4 shadow-sm w-full sm:w-fit min-w-0 sm:min-w-[320px] hover:bg-slate-50 transition-colors"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-container bg-surface-container-high shrink-0">
                  <ContactAvatar
                    name={activity.denormalized_organizer?.name || 'Ban tổ chức'}
                    src={organizerUser?.profile?.avatar_url}
                  />
                </div>
                <div className="flex flex-col text-left min-w-0">
                  <span className="font-bold text-sm text-on-surface hover:text-[#006d37] transition-colors flex items-center gap-1 break-words">
                    {activity.denormalized_organizer?.name || 'Ban tổ chức'}
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    Đại diện Ban tổ chức hoạt động
                  </span>
                </div>
              </a>
            </div>

          </div>

          {/* Right Column (4 cols): Sticky Sidebar */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-24 bg-white border border-surface-variant/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col gap-5 sm:gap-6">

              <h3 className="text-lg font-bold text-on-surface border-b border-surface-variant/40 pb-2">
                Đăng ký tham gia
              </h3>

              {/* Status Badge */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-on-surface-variant">Trạng thái hiện tại:</span>
                <span className={`px-4 py-2.5 rounded-xl text-xs font-bold text-center border border-surface-variant/30 ${statusClass}`}>
                  {statusText}
                </span>
                {userRegistration && userRegistration.status === 'Rejected' && (userRegistration.reject_reason || (userRegistration as any).rejection_reason) && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-650 font-semibold leading-relaxed flex items-start gap-2 animate-fadeIn text-left">
                    <span className="material-symbols-outlined text-[16px] shrink-0 text-red-600 mt-0.5 font-bold">info</span>
                    <span>
                      <strong>Lý do từ chối:</strong> {userRegistration.reject_reason || (userRegistration as any).rejection_reason}
                    </span>
                  </div>
                )}
              </div>

              {/* Info Items */}
              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#006d37] text-lg font-bold mt-0.5">calendar_month</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-on-surface-variant">Thời gian bắt đầu</span>
                    <span className="text-sm font-bold text-on-surface mt-0.5">
                      {formatDateTime(activity.start_date)}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#006d37] text-lg font-bold mt-0.5">hourglass_empty</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-on-surface-variant">Thời gian kết thúc</span>
                    <span className="text-sm font-bold text-on-surface mt-0.5">
                      {formatDateTime(activity.end_date)}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#006d37] text-lg font-bold mt-0.5">location_on</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-on-surface-variant">Địa điểm</span>
                    <span className="text-sm font-bold text-on-surface mt-0.5 leading-snug">
                      {activity.location.address_detail}, {activity.location.district}, {activity.location.province}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#006d37] text-lg font-bold mt-0.5">group</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-on-surface-variant">Số lượng tuyển</span>
                    <span className="text-sm font-bold text-on-surface mt-0.5">
                      {activity.approved_volunteers_count || 0}/{activity.limit_volunteers} Tình nguyện viên (đã duyệt)
                    </span>
                  </div>
                </div>
              </div>

              {/* CTA Action Button */}
              <div className="pt-2 border-t border-surface-variant/40">
                {!currentUser ? (
                  <button
                    onClick={() => {
                      window.location.hash = '#/login';
                    }}
                    className="w-full bg-[#006d37] hover:bg-emerald-800 text-white py-3.5 rounded-xl text-sm font-bold shadow transition-all active:scale-95"
                  >
                    Đăng nhập để tham gia
                  </button>
                ) : currentUser?.role !== 'Volunteer' ? (
                  <button
                    disabled
                    className="w-full bg-slate-100 text-slate-400 py-3.5 rounded-xl text-sm font-bold cursor-not-allowed"
                  >
                    Chỉ dành cho Tình nguyện viên
                  </button>
                ) : userRegistration && ['Approved', 'Pending'].includes(userRegistration.status) ? (
                  <button
                    onClick={handleCancelRegistration}
                    className="w-full bg-white hover:bg-red-50 border border-red-200 text-red-600 py-3.5 rounded-xl text-sm font-bold transition-all"
                  >
                    Hủy đăng ký tham gia
                  </button>
                ) : userRegistration && userRegistration.status === 'Rejected' ? (
                  <button
                    disabled
                    className="w-full bg-red-50 text-red-500 border border-red-100 py-3.5 rounded-xl text-sm font-bold cursor-not-allowed"
                  >
                    Đã bị từ chối tham gia
                  </button>
                ) : userRegistration && userRegistration.status === 'Completed' ? (
                  <button
                    disabled
                    className="w-full bg-emerald-50 text-[#006d37] border border-emerald-100 py-3.5 rounded-xl text-sm font-bold cursor-not-allowed"
                  >
                    Đã tham gia & Hoàn thành
                  </button>
                ) : userRegistration && userRegistration.status === 'Absent' ? (
                  <button
                    disabled
                    className="w-full bg-red-50 text-red-500 border border-red-100 py-3.5 rounded-xl text-sm font-bold cursor-not-allowed"
                  >
                    Vắng mặt hoạt động này
                  </button>
                ) : (activity.status === 'Completed' || new Date(activity.end_date) < new Date()) ? (
                  <button
                    disabled
                    className="w-full bg-slate-100 text-slate-400 py-3.5 rounded-xl text-sm font-bold cursor-not-allowed"
                  >
                    Hoạt động đã kết thúc
                  </button>
                ) : activity.status === 'Cancelled' ? (
                  <button
                    disabled
                    className="w-full bg-slate-100 text-slate-400 py-3.5 rounded-xl text-sm font-bold cursor-not-allowed"
                  >
                    Hoạt động đã bị hủy
                  </button>
                ) : activity.status === 'Full' ? (
                  <button
                    disabled
                    className="w-full bg-slate-100 text-slate-400 py-3.5 rounded-xl text-sm font-bold cursor-not-allowed"
                  >
                    Hoạt động đã đầy chỗ
                  </button>
                ) : (
                  <button
                    onClick={handleRegister}
                    className="w-full bg-[#006d37] hover:bg-emerald-800 text-white py-3.5 rounded-xl text-sm font-bold shadow transition-all active:scale-95"
                  >
                    Đăng ký tham gia
                  </button>
                )}
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ActivityDetailView;

