import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const MyRegistrationsView: React.FC = () => {
  const { currentUser, registrations, cancelOrRejectRegistration } = useApp();
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Approved' | 'Rejected' | 'Completed' | 'Absent' | 'Cancelled'>('All');

  if (!currentUser) return null;

  // Filter volunteer's registrations
  const userRegs = registrations.filter(r => r.volunteer_id === currentUser._id);

  const filteredRegs = userRegs.filter(r => {
    if (activeTab === 'All') return true;
    return r.status === activeTab;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-1 rounded-full text-xs font-bold uppercase">Chờ duyệt</span>;
      case 'Approved':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-full text-xs font-bold uppercase">Đã duyệt</span>;
      case 'Rejected':
        return <span className="bg-red-100 text-red-800 border border-red-300 px-2.5 py-1 rounded-full text-xs font-bold uppercase">Từ chối</span>;
      case 'Completed':
        return <span className="bg-blue-100 text-blue-800 border border-blue-300 px-2.5 py-1 rounded-full text-xs font-bold uppercase">Hoàn thành</span>;
      case 'Absent':
        return <span className="bg-gray-100 text-gray-800 border border-gray-300 px-2.5 py-1 rounded-full text-xs font-bold uppercase">Vắng mặt</span>;
      case 'Cancelled':
        return <span className="bg-slate-100 text-slate-800 border border-slate-300 px-2.5 py-1 rounded-full text-xs font-bold uppercase">Đã hủy</span>;
      default:
        return null;
    }
  };

  return (
    <div className="flex-grow w-full max-w-[1000px] mx-auto px-4 md:px-8 py-8 text-left space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display-lg-mobile md:font-display-lg text-primary font-bold">Hoạt Động Đã Đăng Ký</h1>
        <p className="text-sm text-on-surface-variant mt-1">Theo dõi tiến độ duyệt đơn đăng ký và lịch sử tham gia của bạn.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-surface-variant pb-2 overflow-x-auto whitespace-nowrap scrollbar-thin">
        {(['All', 'Pending', 'Approved', 'Rejected', 'Completed', 'Absent', 'Cancelled'] as const).map(tab => {
          const count = tab === 'All' ? userRegs.length : userRegs.filter(r => r.status === tab).length;
          const label = 
            tab === 'All' ? 'Tất cả' :
            tab === 'Pending' ? 'Chờ duyệt' :
            tab === 'Approved' ? 'Đã duyệt' :
            tab === 'Rejected' ? 'Từ chối' :
            tab === 'Completed' ? 'Đã tham gia' :
            tab === 'Absent' ? 'Vắng mặt' : 'Đã hủy';

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`font-label-sm text-xs pb-2 px-3 transition-all ${
                activeTab === tab 
                  ? 'text-primary border-b-2 border-primary font-bold' 
                  : 'text-on-surface-variant hover:text-primary font-medium'
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Registrations List */}
      <div className="space-y-4">
        {filteredRegs.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl p-12 border border-surface-variant text-center space-y-3">
            <span className="material-symbols-outlined text-outline text-5xl">event_busy</span>
            <p className="text-sm text-on-surface-variant italic">Không tìm thấy đăng ký nào trong mục này.</p>
            {activeTab === 'All' && (
              <a href="#/activities" className="inline-block bg-primary text-on-primary px-6 py-2 rounded-lg font-medium text-xs shadow hover:bg-tertiary transition-colors">
                Khám phá hoạt động ngay
              </a>
            )}
          </div>
        ) : (
          filteredRegs.map(reg => {
            const showCancel = reg.status === 'Pending' || reg.status === 'Approved';

            return (
              <div 
                key={reg._id} 
                className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-surface-variant flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 flex-grow">
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center shrink-0 border border-outline-variant">
                    <span className="material-symbols-outlined text-primary text-2xl">campaign</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface text-base line-clamp-1">{reg.denormalized_activity.title}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">calendar_month</span>
                        {new Date(reg.denormalized_activity.start_date).toLocaleDateString('vi-VN')}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">schedule</span>
                        {new Date(reg.denormalized_activity.start_date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status and Action */}
                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-surface-variant/40">
                  <div className="text-right">
                    {getStatusBadge(reg.status)}
                    {reg.reject_reason && reg.status === 'Rejected' && (
                      <p className="text-[10px] text-red-600 mt-1 max-w-[200px] truncate" title={reg.reject_reason}>
                        Lý do: {reg.reject_reason}
                      </p>
                    )}
                  </div>
                  
                  {showCancel && (
                    <button
                      onClick={() => {
                        if (confirm('Bạn chắc chắn muốn hủy đơn đăng ký này chứ?')) {
                          cancelOrRejectRegistration(reg._id);
                        }
                      }}
                      className="border border-red-600 text-red-600 hover:bg-red-50 py-1.5 px-4 rounded-lg font-bold text-xs transition-colors active:scale-95 flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-xs">cancel</span>
                      Hủy đơn
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
export default MyRegistrationsView;
