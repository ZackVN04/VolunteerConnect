import React from 'react';
import { useApp } from '../context/AppContext';

export const MyRegistrationsView: React.FC = () => {
  const { currentUser, registrations, activities } = useApp();

  if (!currentUser) return null;

  // Filter volunteer's registrations
  const userRegs = registrations.filter(r => r.volunteer_id === currentUser._id);

  // Compute stat counts dynamically
  const pendingCount = userRegs.filter(r => r.status === 'Pending').length;
  const approvedCount = userRegs.filter(r => r.status === 'Approved').length;
  const completedCount = userRegs.filter(r => r.status === 'Completed').length;




  const formatRegistrationSchedule = (startStr: string, endStr: string) => {
    try {
      const start = new Date(startStr);
      const end = new Date(endStr);
      const startTime = start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
      const endTime = end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
      const startDate = start.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const endDate = end.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

      if (startDate === endDate) {
        return `${startTime} - ${endTime} | ${startDate}`;
      } else {
        return `${startTime} ${startDate} - ${endTime} ${endDate}`;
      }
    } catch (e) {
      return `${startStr} - ${endStr}`;
    }
  };

  const getStatusBadges = (status: string) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="bg-[#fef7e0] text-[#b06000] px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap">
            Đang chờ
          </span>
        );
      case 'Approved':
        return (
          <span className="bg-[#e8f5e9] text-[#006d37] px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap">
            Đã duyệt
          </span>
        );
      case 'Rejected':
        return (
          <span className="bg-red-50 text-red-600 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap">
            Từ chối
          </span>
        );
      case 'Completed':
        return (
          <div className="flex items-center gap-2">
            <span className="bg-[#e8f5e9] text-[#006d37] px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap">
              Đã duyệt
            </span>
            <span className="bg-[#006d37] text-white px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap">
              Hoàn thành
            </span>
          </div>
        );
      case 'Absent':
        return (
          <div className="flex items-center gap-2">
            <span className="bg-[#e8f5e9] text-[#006d37] px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap">
              Đã duyệt
            </span>
            <span className="bg-red-600 text-white px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap">
              Vắng mặt
            </span>
          </div>
        );
      case 'Cancelled':
        return (
          <span className="bg-gray-100 text-gray-500 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap">
            Đã hủy
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-700 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="w-full bg-[#f5f5f5] min-h-screen pb-16 text-left font-body-md">
      {/* Container */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-8 space-y-8">
        
        {/* Title block */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 font-headline-md">
            Đăng ký của tôi
          </h1>
          <p className="text-slate-500 text-sm md:text-base mt-1.5 font-semibold">
            Theo dõi trạng thái và hành trình các hoạt động tình nguyện bạn đã đăng ký tham gia
          </p>
        </div>

        {/* Header stats row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-6 flex flex-col items-center justify-center shadow-sm min-h-[120px] space-y-1">
            <span className="text-4xl font-extrabold text-gray-900">{pendingCount}</span>
            <span className="text-sm font-bold text-gray-600">Đang chờ duyệt</span>
          </div>
          
          {/* Card 2 */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-6 flex flex-col items-center justify-center shadow-sm min-h-[120px] space-y-1">
            <span className="text-4xl font-extrabold text-gray-900">{approvedCount}</span>
            <span className="text-sm font-bold text-gray-600">Sắp diễn ra</span>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-6 flex flex-col items-center justify-center shadow-sm min-h-[120px] space-y-1">
            <span className="text-4xl font-extrabold text-gray-900">{completedCount}</span>
            <span className="text-sm font-bold text-gray-600">Đã hoàn thành</span>
          </div>
        </div>

        {/* Section Title */}
        <div className="space-y-1 pt-2">
          <h2 className="text-xl font-bold text-gray-900 font-headline-md">
            Dòng thời gian hoạt động
          </h2>
          <p className="text-sm text-gray-500 font-semibold">
            Theo dõi hành trình tình nguyện của bạn theo trình tự thời gian
          </p>
        </div>

        {/* Timeline Items List */}
        <div className="space-y-4">
          {userRegs.length === 0 ? (
            <div className="bg-white border border-gray-200/80 rounded-2xl p-16 text-center shadow-sm space-y-4">
              <span className="material-symbols-outlined text-gray-300 text-5xl">event_busy</span>
              <p className="text-sm text-gray-500 font-semibold italic">Bạn chưa đăng ký tham gia hoạt động nào.</p>
              <a 
                href="#/activities" 
                className="inline-block bg-[#006d37] hover:bg-[#005027] text-white font-bold px-6 py-2.5 rounded-xl transition-all text-sm shadow-sm"
              >
                Khám phá hoạt động ngay
              </a>
            </div>
          ) : (
            userRegs.map(reg => {
              const actDetails = activities.find(a => a._id === reg.activity_id);
              const organizerId = reg.denormalized_activity.organizer_id || actDetails?.organizer_id;
              const organizerName = reg.denormalized_activity.organizer_name || actDetails?.denormalized_organizer?.name;
              return (
                <div 
                  key={reg._id} 
                  className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left Side: Info */}
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 font-semibold block mb-1">
                      {formatRegistrationSchedule(reg.denormalized_activity.start_date, reg.denormalized_activity.end_date)}
                    </span>
                    <h3 className="text-base font-bold text-gray-900 hover:text-[#006d37] transition-colors leading-snug block mb-2">
                      <a href={`#/activity/${reg.activity_id}`}>
                        {reg.denormalized_activity.title}
                      </a>
                    </h3>
                    
                    {/* Additional Details (QA Request) */}
                    <div className="flex flex-col gap-1.5 text-xs text-slate-500 pt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[#006d37] text-[16px] font-bold">corporate_fare</span>
                        <span>
                          <strong>Ban tổ chức:</strong>{' '}
                          {organizerId ? (
                            <a href={`#/profile?userId=${organizerId}`} className="font-bold text-[#006d37] hover:underline">
                              {organizerName || 'Ban tổ chức'}
                            </a>
                          ) : (
                            organizerName || 'Chưa cập nhật'
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[#006d37] text-[16px] font-bold">category</span>
                        <span>
                          <strong>Lĩnh vực:</strong> {actDetails?.categories?.join(', ') || 'Chưa cập nhật'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[#006d37] text-[16px] font-bold">location_on</span>
                        <span className="line-clamp-1">
                          <strong>Địa điểm:</strong> {actDetails?.location ? `${actDetails.location.address_detail}, ${actDetails.location.district}, ${actDetails.location.province}` : 'Chưa cập nhật'}
                        </span>
                      </div>
                    </div>
                    {reg.status === 'Rejected' && (reg.reject_reason || (reg as any).rejection_reason) && (
                      <div className="mt-3.5 text-xs text-red-700 bg-red-50/60 border border-red-200/50 rounded-xl p-3 flex items-start gap-2 max-w-[500px]">
                        <span className="material-symbols-outlined text-[16px] shrink-0 text-red-600 mt-0.5 font-bold">info</span>
                        <span>
                          <strong>Lý do từ chối:</strong> {reg.reject_reason || (reg as any).rejection_reason}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right Side: Badges & Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3 self-start md:self-auto shrink-0">
                    {/* Status badges */}
                    <div className="flex items-center gap-2">
                      {getStatusBadges(reg.status)}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                      <a 
                        href={`#/activity/${reg.activity_id}`}
                        className="border border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50 px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap block"
                      >
                        Xem chi tiết
                      </a>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};

export default MyRegistrationsView;
