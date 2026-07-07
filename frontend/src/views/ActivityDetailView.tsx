import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

interface ActivityDetailViewProps {
  activityId: string;
}

export const ActivityDetailView: React.FC<ActivityDetailViewProps> = ({ activityId }) => {
  const { currentUser, activities, registrations, registerForActivity, cancelOrRejectRegistration, showNotification, showConfirm } = useApp();
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const activity = activities.find(a => a._id === activityId);

  // Check if current user is registered for this activity
  const userRegistration = registrations.find(
    r => r.volunteer_id === currentUser?._id && r.activity_id === activityId
  );

  useEffect(() => {
    // If user just registered, show success toast automatically
    if (userRegistration && userRegistration.status === 'Pending' && !localStorage.getItem(`toast_shown_${userRegistration._id}`)) {
      setShowSuccessToast(true);
      setToastMessage('Yêu cầu tham gia của bạn đã được gửi. Vui lòng chờ Ban tổ chức duyệt.');
      localStorage.setItem(`toast_shown_${userRegistration._id}`, 'true');
    }
  }, [userRegistration]);

  if (!activity) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto text-left">
        <span className="material-symbols-outlined text-outline text-6xl">campaign</span>
        <h2 className="font-headline-md text-xl font-bold text-on-surface">Không tìm thấy hoạt động</h2>
        <p className="text-sm text-on-surface-variant">Hoạt động có thể đã bị xóa hoặc đường dẫn không chính xác.</p>
        <a href="#/activities" className="inline-block bg-[#006d37] text-white px-6 py-2 rounded-lg font-medium text-xs shadow">
          Quay lại danh sách
        </a>
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
        () => {
          cancelOrRejectRegistration(userRegistration._id);
          showNotification('Đã hủy đăng ký thành công!', 'success');
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
      statusClass = 'bg-red-50 text-red-600';
    } else if (userRegistration.status === 'Cancelled') {
      statusText = 'Đã hủy đăng ký';
      statusClass = 'bg-slate-100 text-slate-500';
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
      {/* Toast alert overlay if showSuccessToast is true */}
      {showSuccessToast && (
        <div className="fixed top-20 right-4 z-[100] w-full max-w-[400px] animate-slideIn">
          <div className="bg-white border border-[#006d37] rounded-xl shadow-xl p-4 flex items-start gap-3 text-left">
            <div className="bg-[#e8f5e9] p-2 rounded-full shrink-0">
              <span className="material-symbols-outlined text-[#006d37]" data-weight="fill">check_circle</span>
            </div>
            <div className="flex-grow">
              <h4 className="font-bold text-sm text-on-surface">Đăng ký thành công!</h4>
              <p className="text-xs text-on-surface-variant mt-1">{toastMessage}</p>
            </div>
            <button 
              onClick={() => setShowSuccessToast(false)}
              className="text-on-surface-variant hover:text-on-surface transition-colors p-1"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Container */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-8 text-left">
        
        {/* Back Link */}
        <a 
          href="#/activities" 
          className="text-[#006d37] hover:underline font-semibold text-sm inline-flex items-center gap-1 mb-6"
        >
          &larr; Quay lại danh sách
        </a>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column (8 cols): Content */}
          <div className="lg:col-span-8 bg-white border border-surface-variant/40 rounded-3xl p-6 md:p-8 space-y-6">
            
            {/* Wide Campaign Image */}
            <div className="w-full h-[300px] md:h-[400px] rounded-2xl overflow-hidden shadow-sm bg-surface-container-low">
              <img 
                src={activity.image_url || 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?q=80&w=600'} 
                alt={activity.title} 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Category Tag */}
            <div>
              <span className="bg-[#006d37] text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                {activity.categories[0] || 'Tình nguyện'}
              </span>
            </div>

            {/* Campaign Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-on-surface font-headline-md leading-tight">
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
              <div className="flex items-center gap-4 bg-white border border-surface-variant/40 rounded-2xl p-4 shadow-sm w-fit min-w-[320px]">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-container bg-surface-container-high shrink-0">
                  <img 
                    src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80" 
                    alt="Contact avatar" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-bold text-sm text-on-surface">
                    {activity.denormalized_organizer.name}
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    Đại diện Ban tổ chức hoạt động
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column (4 cols): Sticky Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 bg-white border border-surface-variant/40 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
              
              <h3 className="text-lg font-bold text-on-surface border-b border-surface-variant/40 pb-2">
                Đăng ký tham gia
              </h3>

              {/* Status Badge */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-on-surface-variant">Trạng thái hiện tại:</span>
                <span className={`px-4 py-2.5 rounded-xl text-xs font-bold text-center border border-surface-variant/30 ${statusClass}`}>
                  Trạng thái: {statusText}
                </span>
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
                      {activity.limit_volunteers} Tình nguyện viên
                    </span>
                  </div>
                </div>
              </div>

              {/* CTA Action Button */}
              <div className="pt-2 border-t border-surface-variant/40">
                {currentUser?.role !== 'Volunteer' ? (
                  <button 
                    disabled 
                    className="w-full bg-slate-100 text-slate-400 py-3.5 rounded-xl text-sm font-bold cursor-not-allowed"
                  >
                    Chỉ dành cho Tình nguyện viên
                  </button>
                ) : userRegistration && userRegistration.status !== 'Cancelled' ? (
                  <button 
                    onClick={handleCancelRegistration}
                    className="w-full bg-white hover:bg-red-50 border border-red-200 text-red-600 py-3.5 rounded-xl text-sm font-bold transition-all"
                  >
                    Hủy đăng ký tham gia
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

