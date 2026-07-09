import React from 'react';
import { useApp } from '../context/AppContext';

export const MyRegistrationsView: React.FC = () => {
  const { currentUser, registrations, activities, cancelOrRejectRegistration, showConfirm, showNotification } = useApp();

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
      async () => {
        const res = cancelOrRejectRegistration(regId);
        const result = res instanceof Promise ? await res : res;
        if (result && result.error) {
          showNotification(result.error, 'error');
        } else {
          showNotification('Đã hủy đơn đăng ký thành công!', 'success');
        }
      },
      'Hủy đăng ký tham gia'
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="bg-[#fef7e0] text-[#b06000] px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
            Đang chờ duyệt
          </span>
        );
      case 'Approved':
        return (
          <span className="bg-[#e8f5e9] text-[#006d37] px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
            Đã duyệt
          </span>
        );
      case 'Rejected':
        return (
          <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
            Từ chối
          </span>
        );
      case 'Completed':
        return (
          <span className="bg-[#e1effe] text-[#1e429f] px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
            Đã hoàn thành
          </span>
        );
      case 'Cancelled':
        return (
          <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
            Đã hủy
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="w-full bg-[#f8f9fa] min-h-screen pb-16">
      {/* Container */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-8 space-y-8 text-left">

        {/* Title block */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-on-surface font-headline-md">
            Đăng ký của tôi
          </h1>
          <p className="text-on-surface-variant text-sm md:text-base mt-1.5 font-semibold">
            Theo dõi trạng thái các hoạt động tình nguyện bạn đã đăng ký tham gia
          </p>
        </div>

        {/* Header stats row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-surface-variant/40 rounded-2xl p-6 text-center shadow-sm">
            <h3 className="text-4xl font-bold text-[#b06000]">{pendingCount}</h3>
            <p className="text-on-surface-variant font-semibold text-sm mt-1">Đang chờ duyệt</p>
          </div>
          <div className="bg-white border border-surface-variant/40 rounded-2xl p-6 text-center shadow-sm">
            <h3 className="text-4xl font-bold text-[#006d37]">{approvedCount}</h3>
            <p className="text-on-surface-variant font-semibold text-sm mt-1">Đã duyệt tham gia</p>
          </div>
          <div className="bg-white border border-surface-variant/40 rounded-2xl p-6 text-center shadow-sm">
            <h3 className="text-4xl font-bold text-[#1e429f]">{completedCount}</h3>
            <p className="text-on-surface-variant font-semibold text-sm mt-1">Đã hoàn thành</p>
          </div>
        </div>

        {/* Registrations List Table */}
        <div className="bg-white border border-surface-variant/40 rounded-2xl shadow-sm overflow-hidden">
          {userRegs.length === 0 ? (
            <div className="p-16 text-center space-y-4">
              <span className="material-symbols-outlined text-outline text-5xl">event_busy</span>
              <p className="text-sm text-on-surface-variant italic">Bạn chưa đăng ký tham gia hoạt động nào.</p>
              <a
                href="#/activities"
                className="inline-block bg-[#006d37] hover:bg-emerald-800 text-white font-bold px-6 py-2.5 rounded-xl transition-all text-sm shadow-sm"
              >
                Khám phá hoạt động ngay
              </a>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-[#f8f9fa] border-b border-surface-variant/40 text-on-surface-variant font-bold text-xs uppercase tracking-wider">
                    <th className="px-6 py-4">Tên hoạt động</th>
                    <th className="px-6 py-4">Thời gian diễn ra</th>
                    <th className="px-6 py-4">Địa điểm</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant/30 text-on-surface">
                  {userRegs.map(reg => {
                    const isCancellable = reg.status === 'Pending' || reg.status === 'Approved';
                    const act = activities.find(a => a._id === reg.activity_id);
                    const district = act?.location?.district || 'Hồ Chí Minh';

                    return (
                      <tr key={reg._id} className="hover:bg-slate-50 transition-colors">
                        {/* Title Column */}
                        <td className="px-6 py-5 font-bold">
                          <a
                            href={`#/activity/${reg.activity_id}`}
                            className="hover:text-[#006d37] transition-colors"
                          >
                            {reg.denormalized_activity.title}
                          </a>
                        </td>
                        {/* Time Column */}
                        <td className="px-6 py-5 whitespace-nowrap text-on-surface-variant font-semibold">
                          {new Date(reg.denormalized_activity.start_date).toLocaleDateString('vi-VN')}
                        </td>
                        {/* Location Column */}
                        <td className="px-6 py-5 text-on-surface-variant font-semibold">
                          {district}
                        </td>
                        {/* Status Column */}
                        <td className="px-6 py-5">
                          {getStatusBadge(reg.status)}
                        </td>
                        {/* Actions Column */}
                        <td className="px-6 py-5">
                          {isCancellable ? (
                            <button
                              onClick={() => handleCancel(reg._id)}
                              className="text-red-600 hover:underline font-bold"
                            >
                              Hủy đăng ký
                            </button>
                          ) : (
                            <span className="text-on-surface-variant">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default MyRegistrationsView;
