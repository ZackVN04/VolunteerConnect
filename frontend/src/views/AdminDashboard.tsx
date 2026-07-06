import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const AdminDashboard: React.FC = () => {
  const { 
    currentUser, users, activities, registrations, organizerRequests,
    reviewOrganizerRequest, reviewActivity, changeUserRole, loginAs 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'organizers' | 'activities' | 'users' | 'stats'>('overview');

  if (!currentUser) return null;

  // Filter pending review lists
  const pendingRequests = organizerRequests.filter(r => r.status === 'Pending');
  const pendingActivities = activities.filter(a => a.status === 'Pending Review');

  // Stats calculation
  const totalCampaigns = activities.length;
  const totalVolunteers = users.filter(u => u.role === 'Volunteer').length;
  const totalOrganizers = users.filter(u => u.role === 'Organizer').length;
  const totalPendingReviews = pendingActivities.length + pendingRequests.length;

  const handleApproveOrganizer = (reqId: string) => {
    reviewOrganizerRequest(reqId, true);
    alert('Đã duyệt nâng cấp tài khoản này lên Ban tổ chức.');
  };

  const handleRejectOrganizer = (reqId: string) => {
    const feedback = prompt('Nhập lý do từ chối nâng cấp:');
    if (feedback === null) return;
    if (!feedback.trim()) {
      alert('Vui lòng nhập lý do từ chối.');
      return;
    }
    reviewOrganizerRequest(reqId, false, feedback);
    alert('Đã từ chối yêu cầu nâng cấp.');
  };

  const handleApproveActivity = (actId: string) => {
    reviewActivity(actId, true);
    alert('Đã duyệt duyệt công khai hoạt động này.');
  };

  const handleRejectActivity = (actId: string) => {
    const feedback = prompt('Nhập lý do từ chối hoạt động:');
    if (feedback === null) return;
    if (!feedback.trim()) {
      alert('Vui lòng nhập lý do từ chối.');
      return;
    }
    reviewActivity(actId, false);
    alert('Đã từ chối duyệt hoạt động.');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <span className="bg-[#fef7e0] text-[#b06000] px-2.5 py-1 rounded-full text-xs font-semibold">Chờ duyệt</span>;
      case 'Approved':
        return <span className="bg-[#e8f5e9] text-[#006d37] px-2.5 py-1 rounded-full text-xs font-semibold">Đã duyệt</span>;
      case 'Rejected':
        return <span className="bg-red-50 text-red-600 px-2.5 py-1 rounded-full text-xs font-semibold">Từ chối</span>;
      case 'Completed':
        return <span className="bg-[#e1effe] text-[#1e429f] px-2.5 py-1 rounded-full text-xs font-semibold">Đã tham gia</span>;
      case 'Absent':
        return <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-semibold">Vắng mặt</span>;
      case 'Cancelled':
        return <span className="bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full text-xs font-semibold">Đã hủy</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-semibold">{status}</span>;
    }
  };

  return (
    <div className="w-full bg-[#f8f9fa] min-h-screen pb-16">
      {/* Container */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
        
        {/* Left Sidebar Layout */}
        <aside className="lg:col-span-3 bg-white border border-surface-variant/40 rounded-3xl p-6 shadow-sm h-fit space-y-6">
          <div>
            <h3 className="text-lg font-bold text-on-surface font-headline-md">Admin Console</h3>
            <p className="text-xs text-on-surface-variant mt-0.5 font-semibold">Quản trị toàn bộ hệ thống</p>
          </div>

          <nav className="flex flex-col gap-1.5 text-sm font-semibold">
            {/* Tab 1 */}
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                activeTab === 'overview'
                  ? 'bg-[#006d37] text-white'
                  : 'text-on-surface-variant hover:bg-slate-100 hover:text-on-surface'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">dashboard</span>
                Tổng quan hệ thống
              </span>
            </button>

            {/* Tab 2 */}
            <button
              onClick={() => setActiveTab('organizers')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                activeTab === 'organizers'
                  ? 'bg-[#006d37] text-white'
                  : 'text-on-surface-variant hover:bg-slate-100 hover:text-on-surface'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">person_add</span>
                Phê duyệt ban tổ chức
              </span>
              {pendingRequests.length > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                  {pendingRequests.length}
                </span>
              )}
            </button>

            {/* Tab 3 */}
            <button
              onClick={() => setActiveTab('activities')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                activeTab === 'activities'
                  ? 'bg-[#006d37] text-white'
                  : 'text-on-surface-variant hover:bg-slate-100 hover:text-on-surface'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">verified_user</span>
                Phê duyệt hoạt động
              </span>
              {pendingActivities.length > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                  {pendingActivities.length}
                </span>
              )}
            </button>

            {/* Tab 4 */}
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                activeTab === 'users'
                  ? 'bg-[#006d37] text-white'
                  : 'text-on-surface-variant hover:bg-slate-100 hover:text-on-surface'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">group</span>
                Danh sách người dùng
              </span>
            </button>

            {/* Tab 5 */}
            <button
              onClick={() => setActiveTab('stats')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                activeTab === 'stats'
                  ? 'bg-[#006d37] text-white'
                  : 'text-on-surface-variant hover:bg-slate-100 hover:text-on-surface'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">analytics</span>
                Thống kê tham gia
              </span>
            </button>
          </nav>
        </aside>

        {/* Right main workspace layout */}
        <section className="lg:col-span-9 space-y-6">
          
          {/* TAB 1: SYSTEM OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <h2 className="text-xl font-bold text-on-surface border-b border-surface-variant/40 pb-3">
                Tổng quan hệ thống
              </h2>

              {/* Stats bento-grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white border border-surface-variant/40 rounded-2xl p-6 text-center shadow-sm">
                  <h3 className="text-4xl font-bold text-[#006d37]">{totalCampaigns}</h3>
                  <p className="text-on-surface-variant font-semibold text-xs mt-1 uppercase tracking-wider">Tổng hoạt động</p>
                </div>
                <div className="bg-white border border-surface-variant/40 rounded-2xl p-6 text-center shadow-sm">
                  <h3 className="text-4xl font-bold text-[#006d37]">{totalVolunteers}</h3>
                  <p className="text-on-surface-variant font-semibold text-xs mt-1 uppercase tracking-wider">Tình nguyện viên</p>
                </div>
                <div className="bg-white border border-surface-variant/40 rounded-2xl p-6 text-center shadow-sm">
                  <h3 className="text-4xl font-bold text-[#006d37]">{totalOrganizers}</h3>
                  <p className="text-on-surface-variant font-semibold text-xs mt-1 uppercase tracking-wider">Ban tổ chức</p>
                </div>
                <div className="bg-white border border-surface-variant/40 rounded-2xl p-6 text-center shadow-sm">
                  <h3 className="text-4xl font-bold text-[#b06000]">{totalPendingReviews}</h3>
                  <p className="text-on-surface-variant font-semibold text-xs mt-1 uppercase tracking-wider">Đơn chờ duyệt</p>
                </div>
              </div>

              {/* Quick Summary Cards below grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pending Upgrades list */}
                <div className="bg-white border border-surface-variant/40 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-base font-bold text-on-surface border-b border-surface-variant/40 pb-3 mb-4">
                    Yêu cầu nâng quyền gần đây
                  </h3>
                  {pendingRequests.length === 0 ? (
                    <p className="text-sm text-on-surface-variant italic">Không có yêu cầu nâng quyền nào đang chờ.</p>
                  ) : (
                    <div className="space-y-3">
                      {pendingRequests.slice(0, 3).map(req => (
                        <div key={req._id} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                          <div>
                            <span className="font-bold text-on-surface block">{req.denormalized_volunteer.name}</span>
                            <span className="text-xs text-on-surface-variant">Đơn vị: {req.experience || 'CLB Tình Nguyện'}</span>
                          </div>
                          <button
                            onClick={() => setActiveTab('organizers')}
                            className="text-[#006d37] hover:underline text-xs font-bold"
                          >
                            Xem & duyệt &rarr;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pending Campaigns list */}
                <div className="bg-white border border-surface-variant/40 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-base font-bold text-on-surface border-b border-surface-variant/40 pb-3 mb-4">
                    Chiến dịch chờ duyệt gần đây
                  </h3>
                  {pendingActivities.length === 0 ? (
                    <p className="text-sm text-on-surface-variant italic">Không có chiến dịch nào đang chờ duyệt công khai.</p>
                  ) : (
                    <div className="space-y-3">
                      {pendingActivities.slice(0, 3).map(act => (
                        <div key={act._id} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                          <div>
                            <span className="font-bold text-on-surface block">{act.title}</span>
                            <span className="text-xs text-on-surface-variant">Tổ chức: {act.denormalized_organizer.name}</span>
                          </div>
                          <button
                            onClick={() => setActiveTab('activities')}
                            className="text-[#006d37] hover:underline text-xs font-bold"
                          >
                            Xem & duyệt &rarr;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ORGANIZER UPGRADES APPROVAL */}
          {activeTab === 'organizers' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-on-surface border-b border-surface-variant/40 pb-3">
                Phê duyệt ban tổ chức
              </h2>

              <div className="bg-white border border-surface-variant/40 rounded-2xl shadow-sm overflow-hidden">
                {pendingRequests.length === 0 ? (
                  <div className="p-16 text-center space-y-3">
                    <span className="material-symbols-outlined text-outline text-5xl">verified</span>
                    <p className="text-sm text-on-surface-variant italic">Không có yêu cầu nâng cấp nào đang chờ duyệt.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="bg-[#f8f9fa] border-b border-surface-variant/40 text-on-surface-variant font-bold text-xs uppercase tracking-wider">
                          <th className="px-6 py-4">Tên tài khoản</th>
                          <th className="px-6 py-4">Đơn vị đại diện</th>
                          <th className="px-6 py-4">Mô tả hoạt động</th>
                          <th className="px-6 py-4">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-variant/30 text-on-surface">
                        {pendingRequests.map(req => (
                          <tr key={req._id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-5 font-bold">{req.denormalized_volunteer.name}</td>
                            <td className="px-6 py-5 text-on-surface-variant font-semibold">
                              {req.experience}
                            </td>
                            <td className="px-6 py-5 text-on-surface-variant">
                              <p className="line-clamp-2 max-w-[300px]" title={req.reason}>
                                {req.reason}
                              </p>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="flex gap-3">
                                <button
                                  onClick={() => handleApproveOrganizer(req._id)}
                                  className="text-[#006d37] hover:underline font-bold"
                                >
                                  Duyệt nâng cấp
                                </button>
                                <button
                                  onClick={() => handleRejectOrganizer(req._id)}
                                  className="text-red-600 hover:underline font-bold"
                                >
                                  Từ chối
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CAMPAIGNS APPROVAL LIST */}
          {activeTab === 'activities' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-on-surface border-b border-surface-variant/40 pb-3">
                Phê duyệt hoạt động
              </h2>

              <div className="bg-white border border-surface-variant/40 rounded-2xl shadow-sm overflow-hidden">
                {pendingActivities.length === 0 ? (
                  <div className="p-16 text-center space-y-3">
                    <span className="material-symbols-outlined text-outline text-5xl">fact_check</span>
                    <p className="text-sm text-on-surface-variant italic">Không có hoạt động nào đang chờ duyệt.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="bg-[#f8f9fa] border-b border-surface-variant/40 text-on-surface-variant font-bold text-xs uppercase tracking-wider">
                          <th className="px-6 py-4">Tên hoạt động</th>
                          <th className="px-6 py-4">Lĩnh vực</th>
                          <th className="px-6 py-4">Ngày tạo</th>
                          <th className="px-6 py-4">Ban tổ chức</th>
                          <th className="px-6 py-4">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-variant/30 text-on-surface">
                        {pendingActivities.map(act => (
                          <tr key={act._id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-5 font-bold">
                              <a 
                                href={`#/activity/${act._id}`} 
                                className="hover:text-[#006d37] hover:underline"
                                target="_blank"
                                rel="noreferrer"
                              >
                                {act.title}
                              </a>
                            </td>
                            <td className="px-6 py-5 text-on-surface-variant">
                              {act.categories[0] || 'Tình nguyện'}
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-on-surface-variant">
                              {new Date(act.created_at).toLocaleDateString('vi-VN')}
                            </td>
                            <td className="px-6 py-5 text-on-surface-variant">
                              {act.denormalized_organizer.name}
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="flex gap-3">
                                <button
                                  onClick={() => handleApproveActivity(act._id)}
                                  className="text-[#006d37] hover:underline font-bold"
                                >
                                  Duyệt hoạt động
                                </button>
                                <button
                                  onClick={() => handleRejectActivity(act._id)}
                                  className="text-red-600 hover:underline font-bold"
                                >
                                  Từ chối
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SYSTEM USER LIST */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-on-surface border-b border-surface-variant/40 pb-3">
                Danh sách người dùng
              </h2>

              <div className="bg-white border border-surface-variant/40 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="bg-[#f8f9fa] border-b border-surface-variant/40 text-on-surface-variant font-bold text-xs uppercase tracking-wider">
                        <th className="px-6 py-4">Tên người dùng</th>
                        <th className="px-6 py-4">Số điện thoại</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Vai trò hiện tại</th>
                        <th className="px-6 py-4">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-variant/30 text-on-surface">
                      {users.map(u => (
                        <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-5 font-bold">{u.profile.full_name}</td>
                          <td className="px-6 py-5 text-on-surface-variant">{u.phone}</td>
                          <td className="px-6 py-5 text-on-surface-variant">{u.email || 'Chưa cập nhật'}</td>
                          <td className="px-6 py-5">
                            <select
                              value={u.role}
                              onChange={(e) => {
                                const newRole = e.target.value as 'Volunteer' | 'Organizer' | 'Admin';
                                changeUserRole(u._id, newRole);
                                alert(`Đã chuyển vai trò của ${u.profile.full_name} sang ${newRole}`);
                              }}
                              className="border border-surface-variant rounded-lg px-2 py-1 text-xs bg-white cursor-pointer"
                            >
                              <option value="Volunteer">Volunteer</option>
                              <option value="Organizer">Organizer</option>
                              <option value="Admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <button
                              onClick={() => {
                                loginAs(u._id);
                                alert(`Đã đổi phiên giả lập đăng nhập sang: ${u.profile.full_name}`);
                              }}
                              className="text-[#006d37] hover:underline font-bold text-xs border border-[#006d37]/30 px-3 py-1.5 rounded-lg hover:bg-[#e8f5e9]"
                            >
                              Giả lập đăng nhập
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: REGISTRATION & ATTENDANCE STATS TABLE */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-on-surface border-b border-surface-variant/40 pb-3">
                Thống kê tham gia
              </h2>

              <div className="bg-white border border-surface-variant/40 rounded-2xl shadow-sm overflow-hidden">
                {registrations.length === 0 ? (
                  <div className="p-16 text-center space-y-3">
                    <span className="material-symbols-outlined text-outline text-5xl">analytics</span>
                    <p className="text-sm text-on-surface-variant italic">Không có dữ liệu đăng ký/điểm danh tham gia nào.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="bg-[#f8f9fa] border-b border-surface-variant/40 text-on-surface-variant font-bold text-xs uppercase tracking-wider">
                          <th className="px-6 py-4">Tình nguyện viên</th>
                          <th className="px-6 py-4">Tên hoạt động</th>
                          <th className="px-6 py-4">Ban tổ chức</th>
                          <th className="px-6 py-4">Ngày đăng ký</th>
                          <th className="px-6 py-4">Điểm danh</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-variant/30 text-on-surface">
                        {registrations.map(reg => (
                          <tr key={reg._id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-5 font-bold">{reg.denormalized_volunteer.name}</td>
                            <td className="px-6 py-5 text-on-surface font-semibold">
                              {reg.denormalized_activity.title}
                            </td>
                            <td className="px-6 py-5 text-on-surface-variant">
                              Ban tổ chức hoạt động
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-on-surface-variant">
                              {new Date(reg.created_at).toLocaleDateString('vi-VN')}
                            </td>
                            <td className="px-6 py-5">
                              {getStatusBadge(reg.status)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

        </section>

      </div>
    </div>
  );
};

export default AdminDashboard;
