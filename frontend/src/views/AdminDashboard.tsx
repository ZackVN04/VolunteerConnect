import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { adminService } from '../services/apiService';

const USE_REAL_BACKEND = true;

export const AdminDashboard: React.FC = () => {
  const { 
    currentUser, users, activities, registrations, organizerRequests,
    reviewOrganizerRequest, reviewActivity, loginAs 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'organizers' | 'activities' | 'users'>('overview');
  const [backendStats, setBackendStats] = useState<any>(null);

  useEffect(() => {
    if (USE_REAL_BACKEND) {
      adminService.getStatistics()
        .then(res => setBackendStats(res))
        .catch(err => console.error("Lỗi lấy dữ liệu thống kê từ backend:", err));
    }
  }, []);

  // Compute all 9 required BRD stats cards with local fallbacks
  const totalActivities = backendStats ? backendStats.totalActivities : activities.length;
  const pendingActivityApprovals = backendStats ? backendStats.pendingActivityApprovals : activities.filter(a => a.status === 'Pending Review').length;
  const totalVolunteers = backendStats ? backendStats.totalVolunteers : users.filter(u => u.role === 'Volunteer').length;
  const totalOrganizers = backendStats ? backendStats.totalOrganizers : users.filter(u => u.role === 'Organizer').length;
  const pendingOrganizerRequests = backendStats ? backendStats.pendingOrganizerRequests : organizerRequests.filter(r => r.status === 'Pending').length;
  const pendingRegistrations = backendStats ? backendStats.pendingRegistrations : registrations.filter(r => r.status === 'Pending').length;
  const openActivities = backendStats ? backendStats.openActivities : activities.filter(a => a.status === 'Open').length;
  const completedActivities = backendStats ? backendStats.completedActivities : activities.filter(a => a.status === 'Completed').length;
  const totalCompletedParticipations = backendStats ? backendStats.totalCompletedParticipations : registrations.filter(r => r.status === 'Completed').length;

  if (!currentUser) return null;

  // Filter lists for review
  const pendingReqs = organizerRequests.filter(r => r.status === 'Pending');
  const pendingActs = activities.filter(a => a.status === 'Pending Review');

  return (
    <div className="flex-grow w-full max-w-[1280px] mx-auto px-4 md:px-8 py-8 text-left grid grid-cols-1 lg:grid-cols-12 gap-gutter">
      {/* Admin Sidebar Navigation */}
      <aside className="lg:col-span-3 bg-surface-container-lowest p-5 rounded-xl border border-surface-variant shadow-sm h-fit space-y-6">
        <div>
          <h3 className="font-headline-md text-lg font-bold text-primary dark:text-primary-fixed leading-tight">Admin Console</h3>
          <p className="text-xs text-on-surface-variant font-medium mt-0.5">Bảng điều khiển hệ thống</p>
        </div>
        
        <nav className="flex flex-col gap-1.5 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg active:scale-95 transition-all text-left ${
              activeTab === 'overview'
                ? 'bg-primary text-on-primary font-bold shadow-sm'
                : 'text-on-surface-variant hover:bg-primary-container/15 hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-lg">dashboard</span>
            Tổng quan (Overview)
          </button>
          
          <button
            onClick={() => setActiveTab('organizers')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg active:scale-95 transition-all text-left relative ${
              activeTab === 'organizers'
                ? 'bg-primary text-on-primary font-bold shadow-sm'
                : 'text-on-surface-variant hover:bg-primary-container/15 hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-lg">person_add</span>
            Duyệt Quyền Organizer
            {pendingReqs.length > 0 && (
              <span className="absolute right-3 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold">
                {pendingReqs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('activities')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg active:scale-95 transition-all text-left relative ${
              activeTab === 'activities'
                ? 'bg-primary text-on-primary font-bold shadow-sm'
                : 'text-on-surface-variant hover:bg-primary-container/15 hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-lg">verified</span>
            Duyệt Hoạt Động
            {pendingActs.length > 0 && (
              <span className="absolute right-3 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold">
                {pendingActs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg active:scale-95 transition-all text-left ${
              activeTab === 'users'
                ? 'bg-primary text-on-primary font-bold shadow-sm'
                : 'text-on-surface-variant hover:bg-primary-container/15 hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-lg">group</span>
            Quản Lý Thành Viên
          </button>
        </nav>
      </aside>

      {/* Main Workspace Workspace */}
      <section className="lg:col-span-9 space-y-6">
        
        {/* --- Active View 1: Overview Dashboard --- */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h2 className="font-headline-md text-xl font-bold text-on-surface">Bảng Thống Kê Tổng Quan</h2>
            
            {/* 3x3 Bento Grid Statistic Cards (Fully implementing BRD table) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
              {/* Card 1 */}
              <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/30 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary-container/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="flex items-start justify-between mb-2">
                  <span className="material-symbols-outlined text-primary text-2xl">local_activity</span>
                  <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">Tổng số</span>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant font-medium">Tổng Hoạt Động</p>
                  <h3 className="font-display-lg text-2xl font-bold text-on-surface mt-1">{totalActivities}</h3>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/30 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="flex items-start justify-between mb-2">
                  <span className="material-symbols-outlined text-amber-600 text-2xl">pending_actions</span>
                  <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">Chờ duyệt</span>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant font-medium">Hoạt Động Chờ Duyệt</p>
                  <h3 className="font-display-lg text-2xl font-bold text-on-surface mt-1">{pendingActivityApprovals}</h3>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/30 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="flex items-start justify-between mb-2">
                  <span className="material-symbols-outlined text-blue-600 text-2xl">volunteer_activism</span>
                  <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">Thành viên</span>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant font-medium">Tình Nguyện Viên</p>
                  <h3 className="font-display-lg text-2xl font-bold text-on-surface mt-1">{totalVolunteers}</h3>
                </div>
              </div>

              {/* Card 4 */}
              <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/30 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="flex items-start justify-between mb-2">
                  <span className="material-symbols-outlined text-emerald-600 text-2xl">business_center</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Tổ chức</span>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant font-medium">Nhà Tổ Chức (Organizers)</p>
                  <h3 className="font-display-lg text-2xl font-bold text-on-surface mt-1">{totalOrganizers}</h3>
                </div>
              </div>

              {/* Card 5 */}
              <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/30 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="flex items-start justify-between mb-2">
                  <span className="material-symbols-outlined text-rose-600 text-2xl">person_alert</span>
                  <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full">Đơn nâng quyền</span>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant font-medium">Yêu Cầu Nâng Quyền Chờ Duyệt</p>
                  <h3 className="font-display-lg text-2xl font-bold text-on-surface mt-1">{pendingOrganizerRequests}</h3>
                </div>
              </div>

              {/* Card 6 */}
              <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/30 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="flex items-start justify-between mb-2">
                  <span className="material-symbols-outlined text-amber-600 text-2xl">assignment_ind</span>
                  <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">Đăng ký tham gia</span>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant font-medium">Đăng Ký Tham Gia Chờ Duyệt</p>
                  <h3 className="font-display-lg text-2xl font-bold text-on-surface mt-1">{pendingRegistrations}</h3>
                </div>
              </div>

              {/* Card 7 */}
              <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/30 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="flex items-start justify-between mb-2">
                  <span className="material-symbols-outlined text-emerald-600 text-2xl">campaign</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Mở tuyển</span>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant font-medium">Hoạt Động Đang Mở (Open)</p>
                  <h3 className="font-display-lg text-2xl font-bold text-on-surface mt-1">{openActivities}</h3>
                </div>
              </div>

              {/* Card 8 */}
              <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/30 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="flex items-start justify-between mb-2">
                  <span className="material-symbols-outlined text-teal-600 text-2xl">task_alt</span>
                  <span className="text-[10px] bg-teal-100 text-teal-700 font-bold px-2 py-0.5 rounded-full">Hoàn thành</span>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant font-medium">Hoạt Động Đã Hoàn Thành</p>
                  <h3 className="font-display-lg text-2xl font-bold text-on-surface mt-1">{completedActivities}</h3>
                </div>
              </div>

              {/* Card 9 */}
              <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/30 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="flex items-start justify-between mb-2">
                  <span className="material-symbols-outlined text-indigo-600 text-2xl">military_tech</span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Lượt tham gia</span>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant font-medium">Lượt Tham Gia Đã Hoàn Thành</p>
                  <h3 className="font-display-lg text-2xl font-bold text-on-surface mt-1">{totalCompletedParticipations}</h3>
                </div>
              </div>
            </div>

            {/* Quick overview of requests inside overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-md pt-4">
              {/* Requests preview */}
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-surface-container-high pb-2">
                  <h4 className="font-bold text-on-surface text-sm">Đơn nâng quyền chờ duyệt</h4>
                  <button onClick={() => setActiveTab('organizers')} className="text-primary text-xs hover:underline font-bold">Xem tất cả</button>
                </div>
                {pendingReqs.length === 0 ? (
                  <p className="text-xs text-on-surface-variant italic text-center py-4">Không có yêu cầu nâng quyền nào đang chờ duyệt</p>
                ) : (
                  <ul className="divide-y divide-surface-container-high">
                    {pendingReqs.slice(0, 3).map(req => (
                      <li key={req._id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-on-surface">{req.denormalized_volunteer.name}</p>
                          <p className="text-[10px] text-on-surface-variant">SĐT: {req.contact_phone}</p>
                        </div>
                        <button onClick={() => setActiveTab('organizers')} className="bg-primary text-on-primary px-3 py-1 rounded text-[10px] font-bold">Duyệt</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Activities review preview */}
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-surface-container-high pb-2">
                  <h4 className="font-bold text-on-surface text-sm">Hoạt động chờ phê duyệt</h4>
                  <button onClick={() => setActiveTab('activities')} className="text-primary text-xs hover:underline font-bold">Xem tất cả</button>
                </div>
                {pendingActs.length === 0 ? (
                  <p className="text-xs text-on-surface-variant italic text-center py-4">Không có hoạt động nào đang chờ phê duyệt</p>
                ) : (
                  <ul className="divide-y divide-surface-container-high">
                    {pendingActs.slice(0, 3).map(act => (
                      <li key={act._id} className="py-2.5 flex items-center justify-between text-xs">
                        <div className="max-w-[70%]">
                          <p className="font-bold text-on-surface truncate">{act.title}</p>
                          <p className="text-[10px] text-on-surface-variant">Người tạo: {act.denormalized_organizer.name}</p>
                        </div>
                        <button onClick={() => setActiveTab('activities')} className="bg-primary text-on-primary px-3 py-1 rounded text-[10px] font-bold">Xét duyệt</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- Active View 2: Approve Organizer Upgrades --- */}
        {activeTab === 'organizers' && (
          <div className="space-y-4">
            <h2 className="font-headline-md text-xl font-bold text-on-surface">Duyệt Yêu Cầu Xin Quyền Nhà Tổ Chức</h2>
            
            <div className="space-y-3">
              {pendingReqs.length === 0 ? (
                <div className="bg-surface-container-lowest p-8 rounded-xl border border-surface-variant text-center space-y-2">
                  <span className="material-symbols-outlined text-outline text-4xl">person_add_disabled</span>
                  <p className="text-sm text-on-surface-variant italic">Không có yêu cầu nâng quyền Organizer nào đang chờ duyệt.</p>
                </div>
              ) : (
                pendingReqs.map(req => (
                  <div key={req._id} className="bg-surface-container-lowest p-6 rounded-xl border border-surface-variant shadow-sm space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-container-high pb-3">
                      <div>
                        <h4 className="font-bold text-on-surface text-base">{req.denormalized_volunteer.name}</h4>
                        <p className="text-xs text-on-surface-variant mt-0.5">Email: {req.denormalized_volunteer.email} • Liên hệ: {req.contact_phone}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const reason = prompt('Nhập lý do từ chối:');
                            if (reason !== null) {
                              reviewOrganizerRequest(req._id, false, reason);
                            }
                          }}
                          className="border border-red-600 text-red-600 hover:bg-red-50 py-1.5 px-4 rounded-lg font-bold text-xs transition-colors active:scale-95"
                        >
                          Từ chối
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Bạn đồng ý nâng quyền Organizer cho tình nguyện viên ${req.denormalized_volunteer.name} chứ?`)) {
                              reviewOrganizerRequest(req._id, true);
                            }
                          }}
                          className="bg-primary text-on-primary hover:bg-tertiary py-1.5 px-4 rounded-lg font-bold text-xs shadow transition-colors active:scale-95"
                        >
                          Phê duyệt nâng quyền
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-on-surface-variant space-y-2">
                      <p><strong>Lý do xin nâng quyền:</strong></p>
                      <p className="bg-surface p-3 rounded-lg border border-outline-variant/30 leading-relaxed text-on-surface">
                        {req.reason}
                      </p>
                      {req.experience && (
                        <>
                          <p className="mt-2"><strong>Kinh nghiệm / Tên tổ chức:</strong></p>
                          <p className="bg-surface p-3 rounded-lg border border-outline-variant/30 leading-relaxed text-on-surface">
                            {req.experience}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* --- Active View 3: Approve Activity Requests --- */}
        {activeTab === 'activities' && (
          <div className="space-y-4">
            <h2 className="font-headline-md text-xl font-bold text-on-surface">Duyệt Đăng Tải Hoạt Động Mới</h2>
            
            <div className="space-y-4">
              {pendingActs.length === 0 ? (
                <div className="bg-surface-container-lowest p-8 rounded-xl border border-surface-variant text-center space-y-2">
                  <span className="material-symbols-outlined text-outline text-4xl">check_box</span>
                  <p className="text-sm text-on-surface-variant italic">Không có chiến dịch nào đang chờ xét duyệt.</p>
                </div>
              ) : (
                pendingActs.map(act => (
                  <div key={act._id} className="bg-surface-container-lowest p-6 rounded-xl border border-surface-variant shadow-sm space-y-4">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-surface-container-high pb-3">
                      <div>
                        <h4 className="font-bold text-on-surface text-base">{act.title}</h4>
                        <p className="text-xs text-on-surface-variant mt-1">
                          Người tạo: <strong>{act.denormalized_organizer.name}</strong> • Thể loại: {act.categories.join(', ')}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => reviewActivity(act._id, false)}
                          className="border border-red-600 text-red-600 hover:bg-red-50 py-1.5 px-4 rounded-lg font-bold text-xs transition-colors active:scale-95"
                        >
                          Từ chối duyệt
                        </button>
                        <button
                          onClick={() => reviewActivity(act._id, true)}
                          className="bg-primary text-on-primary hover:bg-tertiary py-1.5 px-4 rounded-lg font-bold text-xs shadow transition-colors active:scale-95"
                        >
                          Phê duyệt xuất bản (Open)
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-on-surface-variant bg-surface p-3 rounded-lg border border-outline-variant/30">
                      <div>
                        <p><strong>Thời gian dự kiến:</strong></p>
                        <p className="mt-1 text-on-surface font-medium">{new Date(act.start_date).toLocaleString('vi-VN')} - {new Date(act.end_date).toLocaleString('vi-VN')}</p>
                      </div>
                      <div>
                        <p><strong>Địa điểm diễn ra:</strong></p>
                        <p className="mt-1 text-on-surface font-medium">{act.location.address_detail}, {act.location.district}, {act.location.province}</p>
                      </div>
                      <div className="col-span-full">
                        <p><strong>Số lượng tuyển dụng tối đa:</strong> {act.limit_volunteers} thành viên</p>
                      </div>
                    </div>

                    <div className="text-xs text-on-surface-variant space-y-2">
                      <p><strong>Mô tả chi tiết hoạt động:</strong></p>
                      <p className="bg-surface p-3 rounded-lg border border-outline-variant/30 leading-relaxed text-on-surface whitespace-pre-line">
                        {act.description}
                      </p>
                      {act.requirements && (
                        <>
                          <p className="mt-2"><strong>Yêu cầu đối với Tình nguyện viên:</strong></p>
                          <p className="bg-surface p-3 rounded-lg border border-outline-variant/30 leading-relaxed text-on-surface whitespace-pre-line">
                            {act.requirements}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* --- Active View 4: User Management Table --- */}
        {activeTab === 'users' && (
          <div className="bg-surface-container-lowest rounded-xl border border-surface-variant overflow-hidden shadow-sm space-y-4 p-5">
            <h2 className="font-headline-md text-xl font-bold text-on-surface">Quản Lý Danh Sách Thành Viên</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant font-bold border-b border-surface-container-high">
                    <th className="py-3 px-4">Tên người dùng</th>
                    <th className="py-3 px-4">Số điện thoại</th>
                    <th className="py-3 px-4">Vai trò hệ thống</th>
                    <th className="py-3 px-4">Số hoạt động joined</th>
                    <th className="py-3 px-4 text-right">Giả lập đăng nhập</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high">
                  {users.map(u => (
                    <tr key={u._id} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-3 px-4 font-bold text-on-surface">{u.profile.full_name}</td>
                      <td className="py-3 px-4 text-on-surface-variant">{u.phone}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.role === 'Admin' ? 'bg-red-100 text-red-700' :
                          u.role === 'Organizer' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-on-surface">{u.profile.joined_activity_count}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            loginAs(u._id);
                            alert(`Đã đổi phiên đăng nhập sang: ${u.profile.full_name}`);
                          }}
                          className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-2 py-1 rounded transition-colors text-[10px] font-bold"
                        >
                          Login As
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </section>
    </div>
  );
};
export default AdminDashboard;
