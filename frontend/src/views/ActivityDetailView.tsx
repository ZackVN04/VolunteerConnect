import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

interface ActivityDetailViewProps {
  activityId: string;
}

export const ActivityDetailView: React.FC<ActivityDetailViewProps> = ({ activityId }) => {
  const { currentUser, activities, registrations, registerForActivity } = useApp();
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
      <div className="py-20 text-center space-y-4 max-w-md mx-auto">
        <span className="material-symbols-outlined text-outline text-6xl">campaign</span>
        <h2 className="font-headline-md text-xl font-bold text-on-surface">Không tìm thấy hoạt động</h2>
        <p className="text-sm text-on-surface-variant">Hoạt động có thể đã bị xóa hoặc đường dẫn không chính xác.</p>
        <a href="#/activities" className="inline-block bg-primary text-on-primary px-6 py-2 rounded-lg font-medium text-xs shadow">
          Quay lại danh sách
        </a>
      </div>
    );
  }

  const handleRegister = async () => {
    const res = registerForActivity(activity._id);
    const result = res instanceof Promise ? await res : res;
    if (result.success) {
      setShowSuccessToast(true);
      setToastMessage('Yêu cầu tham gia của bạn đã được gửi. Vui lòng chờ Ban tổ chức duyệt.');
    } else {
      alert(result.error || 'Có lỗi xảy ra khi đăng ký');
    }
  };

  const pctFull = Math.min(100, Math.round((activity.approved_volunteers_count / activity.limit_volunteers) * 100));

  // Determine CTA Button style and text
  let btnText = 'Đăng ký tham gia';
  let btnDisabled = false;
  let btnClass = 'bg-primary text-on-primary hover:bg-tertiary active:scale-95 shadow-sm';

  if (currentUser?.role !== 'Volunteer') {
    btnText = 'Đăng ký (Chỉ dành cho Tình nguyện viên)';
    btnDisabled = true;
    btnClass = 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed';
  } else if (userRegistration) {
    if (userRegistration.status === 'Pending') {
      btnText = 'Đã gửi yêu cầu';
      btnDisabled = true;
      btnClass = 'bg-surface-container-highest text-on-surface-variant cursor-default';
    } else if (userRegistration.status === 'Approved') {
      btnText = 'Đơn đăng ký được duyệt';
      btnDisabled = true;
      btnClass = 'bg-emerald-600 text-white cursor-default';
    } else if (userRegistration.status === 'Rejected') {
      btnText = 'Yêu cầu bị từ chối';
      btnDisabled = true;
      btnClass = 'bg-red-600 text-white cursor-default';
    } else if (userRegistration.status === 'Completed') {
      btnText = 'Hoạt động đã hoàn thành';
      btnDisabled = true;
      btnClass = 'bg-primary-container text-on-primary-container cursor-default';
    } else if (userRegistration.status === 'Absent') {
      btnText = 'Bạn đã vắng mặt';
      btnDisabled = true;
      btnClass = 'bg-amber-600 text-white cursor-default';
    } else if (userRegistration.status === 'Cancelled') {
      btnText = 'Đăng ký lại';
      btnDisabled = false;
      btnClass = 'bg-primary text-on-primary hover:bg-tertiary active:scale-95 shadow-sm';
    }
  } else if (activity.status === 'Full') {
    btnText = 'Hoạt động đã đầy chỗ';
    btnDisabled = true;
    btnClass = 'bg-amber-100 text-amber-800 cursor-not-allowed';
  }

  return (
    <div className="flex-grow w-full max-w-[1280px] mx-auto px-4 md:px-8 py-8 md:py-12 relative text-left">
      {/* Toast Alert overlay matching 09-Chi tiết hoạt động -đăng ký.html */}
      {showSuccessToast && (
        <div className="fixed top-20 right-4 z-[100] w-full max-w-[400px] animate-slideIn">
          <div className="bg-surface-container-lowest border border-primary-container rounded-lg shadow-xl p-4 flex items-start gap-3">
            <div className="bg-primary-container/20 p-2 rounded-full shrink-0">
              <span className="material-symbols-outlined text-primary" data-weight="fill">check_circle</span>
            </div>
            <div className="flex-grow">
              <h4 className="font-label-sm text-sm text-on-surface font-bold">Đăng ký thành công!</h4>
              <p className="font-body-md text-xs text-on-surface-variant mt-1">{toastMessage}</p>
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

      {/* Breadcrumb */}
      <div className="mb-6">
        <a href="#/activities" className="text-primary hover:text-tertiary transition-colors flex items-center gap-1 text-sm font-semibold">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Quay lại danh sách hoạt động
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Left Column (70%) */}
        <div className="lg:col-span-8 flex flex-col gap-md">
          {/* Cover Image */}
          <div className="w-full h-[300px] md:h-[400px] rounded-xl overflow-hidden relative shadow-sm bg-surface-container-high">
            <img 
              className="w-full h-full object-cover"
              alt={activity.title}
              src={activity.image_url || 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?q=80&w=600'}
            />
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="bg-secondary-container text-on-secondary-container font-label-sm text-xs px-3 py-1.5 rounded-full flex items-center gap-1 backdrop-blur-md bg-opacity-90 font-bold uppercase">
                <span className="material-symbols-outlined text-[16px] filled">tag</span>
                {activity.categories[0] || 'Hoạt động'}
              </span>
              <span className="bg-surface/85 text-on-surface font-label-sm text-xs px-3 py-1.5 rounded-full flex items-center gap-1 backdrop-blur-md font-bold uppercase">
                <span className="material-symbols-outlined text-[16px]">group</span>
                Chiến dịch nhóm
              </span>
            </div>
          </div>

          {/* Title & Basic Info */}
          <div className="flex flex-col gap-sm">
            <h1 className="font-display-lg-mobile md:font-display-lg text-headline-md md:text-display-lg text-on-surface font-bold leading-tight">
              {activity.title}
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant whitespace-pre-line leading-relaxed">
              {activity.description}
            </p>
          </div>

          <hr className="border-t border-outline-variant my-sm" />

          {/* Detail Sections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            {/* Time & Date */}
            <div className="flex gap-md p-md bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-sm">
              <div className="w-12 h-12 rounded-full bg-primary-container/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-2xl">calendar_month</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-bold">Thời gian</span>
                <span className="font-body-md text-sm text-on-surface font-semibold mt-1">
                  Bắt đầu: {new Date(activity.start_date).toLocaleDateString('vi-VN')} • {new Date(activity.start_date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="font-body-md text-sm text-on-surface-variant mt-0.5">
                  Kết thúc: {new Date(activity.end_date).toLocaleDateString('vi-VN')} • {new Date(activity.end_date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Location */}
            <div className="flex gap-md p-md bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-sm">
              <div className="w-12 h-12 rounded-full bg-primary-container/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-2xl">location_on</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-bold">Địa điểm</span>
                <span className="font-body-md text-sm text-on-surface font-semibold mt-1">
                  {activity.location.district}, {activity.location.province}
                </span>
                <span className="font-body-md text-xs text-on-surface-variant mt-0.5">
                  {activity.location.address_detail}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Requirements / Notes */}
          {activity.requirements && (
            <div className="bg-surface-container-lowest rounded-xl p-6 border border-surface-container-high shadow-sm space-y-4">
              <h2 className="font-headline-md text-base text-on-surface flex items-center gap-2 font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-primary">check_circle</span> Yêu cầu & Ghi chú
              </h2>
              <p className="font-body-md text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">
                {activity.requirements}
              </p>
            </div>
          )}

          {/* Organizer Info */}
          <div className="bg-surface-container-lowest rounded-xl p-6 border border-surface-container-high shadow-sm flex items-center gap-md">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-surface-container-high shrink-0 bg-surface-container-low flex items-center justify-center">
              <span className="material-symbols-outlined text-outline text-3xl filled">person</span>
            </div>
            <div className="flex-grow">
              <span className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider block mb-1">Tổ chức bởi</span>
              <h3 className="font-headline-md text-lg text-on-surface font-bold leading-tight">
                {activity.denormalized_organizer.name}
              </h3>
              <p className="font-body-md text-xs text-on-surface-variant flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-[16px] text-primary">verified_user</span> Ban tổ chức cộng đồng uy tín
              </p>
            </div>
            <button className="hidden sm:flex items-center justify-center border border-outline text-on-surface font-label-sm text-xs px-4 py-2 rounded-lg hover:bg-surface-container-low transition-colors font-bold">
              Liên hệ
            </button>
          </div>
        </div>

        {/* Right Column (30%) - Sticky Widget */}
        <div className="lg:col-span-4 relative">
          <div className="sticky top-24 glass-card rounded-xl p-6 flex flex-col gap-6">
            {/* Status & Spots */}
            <div className="flex justify-between items-center">
              <span className={`font-label-sm text-xs px-3 py-1 rounded-full border flex items-center gap-1 font-bold ${
                activity.status === 'Full' 
                  ? 'bg-amber-100 text-amber-800 border-amber-300' 
                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}>
                <span className={`w-2 h-2 rounded-full animate-pulse ${
                  activity.status === 'Full' ? 'bg-amber-500' : 'bg-emerald-500'
                }`}></span>
                {activity.status === 'Full' ? 'Đã đầy chỗ' : 'Đang tuyển'}
              </span>
              <span className="font-body-md text-sm text-on-surface-variant flex items-center gap-1 font-medium">
                <span className="material-symbols-outlined text-[20px] text-primary">group</span>
                <strong>{activity.approved_volunteers_count}</strong> / {activity.limit_volunteers} tình nguyện viên
              </span>
            </div>

            {/* Progress Bar */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between font-label-sm text-xs text-on-surface-variant mb-1 font-semibold">
                <span>Tiến độ tuyển thành viên</span>
                <span>{pctFull}% Đầy</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${pctFull}%` }}></div>
              </div>
              <p className="font-body-md text-xs text-on-surface-variant mt-1.5">
                {activity.limit_volunteers - activity.approved_volunteers_count > 0 
                  ? `Chỉ còn ${activity.limit_volunteers - activity.approved_volunteers_count} suất tham gia!` 
                  : 'Đã tuyển đủ số lượng thành viên dự kiến'
                }
              </p>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleRegister}
              disabled={btnDisabled}
              className={`w-full font-headline-md text-sm py-4 rounded-lg flex justify-center items-center gap-2 font-bold transition-all duration-200 ${btnClass}`}
            >
              {btnText}
              {!btnDisabled && <span className="material-symbols-outlined text-base">arrow_forward</span>}
            </button>

            <p className="text-center font-body-md text-[11px] text-on-surface-variant">
              Tham gia hoàn toàn miễn phí. Hủy đăng ký trước ngày diễn ra tối thiểu 2 ngày.
            </p>

            <hr className="border-t border-outline-variant my-xs" />

            {/* Social Proof */}
            <div className="flex flex-col gap-2">
              <span className="font-label-sm text-xs text-on-surface-variant font-semibold">Các tình nguyện viên đã tham gia:</span>
              <div className="flex -space-x-2 overflow-hidden">
                <img 
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-surface-container-lowest object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4iHoFeG7RT9-mJzOtb8bMpLKszryi5P_kV3vI-d5VDhLV4oIYxRStVvpKgsEHrPPIB4sM9QIuAFV0NG3FR4dkWQfpFfWB9eq_xnG6TEl1CjhRex3CpNxkqImZbl6Jt9CYmsTSw7PhLiTTVMhBjJLHMMt0dOvXJmDFCE8fqnyWGrQzI-IFEmCQsHeAVrliFMojuUZaJ-bBzasR5KY7Px3NSbz4oVADEzVv6DyblAQxBx7pDqYxXidi0Q"
                  alt="Volunteer"
                />
                <img 
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-surface-container-lowest object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC_9c-Hb0fcBgxDtY5jCYz2CNuUjHDhz0dUP8_keAHUsJKn2ayaICKM07UkhDF_jjka-6q1Ix4EXUZyDbdhKJFlKhXLczIpTNwLntebWpEkUfJ5E6r_d74ITm7mGrA4hZyVSJKDjn40GP0yKTjMssxJCxZeHeTbd1QQ6TFe7pjMVDqnOpH0kHs--pemhRHwLP9sr41tU9iDpgwroYVud8kdlnVPJOvPxA7WVhY6JrjDdLsuce5KPAOfuQ"
                  alt="Volunteer"
                />
                <img 
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-surface-container-lowest object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAtKSCOarCq6yX3aiuCEs7wLTTriM9rQxtRVVK4iZuRKYvGgVEbjgedKC56HS83NZDmdwynTS9cFpxofIwPdIqySyIsYEDVRWZXkQ2SnH89tiaUxCu0PWyMEvlYtdxe9C7zQrCFaiCDjx6F7EfQjFb-H5jMrFTIgc-Ddg0QL7LPv3RQomyesR7Lqvlg-15oAIFyFc67wIYQrOMV6u2NtHP-lY1nw-gpnauptaP5D0b_2XeRhlxRUEqK8w"
                  alt="Volunteer"
                />
                <div className="inline-flex h-8 w-8 rounded-full ring-2 ring-surface-container-lowest bg-surface-container-high items-center justify-center font-label-sm text-[10px] text-on-surface-variant font-bold z-10">
                  +{30 + activity.approved_volunteers_count}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ActivityDetailView;
