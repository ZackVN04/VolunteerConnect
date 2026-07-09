import React from 'react';
import { useApp } from '../context/AppContext';

export const MyRegistrationsView: React.FC = () => {
  const { currentUser, registrations, cancelOrRejectRegistration, showConfirm, showNotification } = useApp();

  if (!currentUser) return null;

  // Filter volunteer's registrations
  const userRegs = registrations.filter(r => r.volunteer_id === currentUser._id);

  // Compute stat counts dynamically
  const pendingCount = userRegs.filter(r => r.status === 'Pending').length;
  const approvedCount = userRegs.filter(r => r.status === 'Approved').length;
  const completedCount = userRegs.filter(r => r.status === 'Completed').length;

  const handleCancel = (regId: string) => {
    showConfirm(
      'Bạn có chắc chắn muốn hủy đơn đăng ký tham gia hoạt động này?',
      () => {
        cancelOrRejectRegistration(regId);
        showNotification('Đã hủy đơn đăng ký thành công!', 'success');
      },
      'Hủy đăng ký tham gia'
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
      return dateStr;
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
              const isCancellable = reg.status === 'Pending' || reg.status === 'Approved';
              
              return (
                <div 
                  key={reg._id} 
                  className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left Side: Info */}
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 font-semibold">
                      {formatDate(reg.denormalized_activity.start_date)} - {formatDate(reg.denormalized_activity.end_date)}
                    </span>
                    <h3 className="text-base font-bold text-gray-900 hover:text-[#006d37] transition-colors leading-snug block">
                      <a href={`#/activity/${reg.activity_id}`}>
                        {reg.denormalized_activity.title}
                      </a>
                    </h3>
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
                      
                      {isCancellable && (
                        <button
                          onClick={() => handleCancel(reg._id)}
                          className="border border-red-200 hover:border-red-600 text-red-600 hover:bg-red-50 px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer"
                        >
                          Hủy đăng ký
                        </button>
                      )}
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
