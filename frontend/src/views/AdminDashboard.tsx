import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

// Helper: inline avatar fallback with initials
const AdminAvatar: React.FC<{ name: string; src?: string | null }> = ({ name, src }) => {
  if (src) {
    return <img alt="Avatar" className="w-full h-full object-cover" src={src} />;
  }
  const initials = name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  const colors = ['#006d37', '#0d6efd', '#6f42c1', '#fd7e14', '#20c997'];
  const bg = colors[name.charCodeAt(0) % colors.length];
  return (
    <div style={{ background: bg, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#fff', fontWeight: 700, fontSize: 14, fontFamily: 'inherit' }}>{initials}</span>
    </div>
  );
};

export const AdminDashboard: React.FC = () => {
  const {
    currentUser, users, activities, registrations, organizerRequests,
    reviewOrganizerRequest, reviewActivity, changeUserRole, setCurrentUser,
    showNotification, showPrompt, showConfirm, confirmDialog
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'organizers' | 'activities' | 'users' | 'stats'>('overview');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  if (!currentUser) return null;

  // Filter pending review lists
  const pendingRequests = organizerRequests.filter(r => r.status === 'Pending');
  const pendingActivities = activities.filter(a => a.status === 'Pending Review');

  const handleApproveOrganizer = async (reqId: string) => {
    const res = await reviewOrganizerRequest(reqId, true);
    if (res.success) {
      showNotification('Đã duyệt nâng cấp tài khoản này lên Ban tổ chức.', 'success');
    } else {
      showNotification(res.error || 'Duyệt nâng cấp thất bại.', 'error');
    }
  };

  const handleRejectOrganizer = (reqId: string) => {
    showPrompt(
      'Nhập lý do từ chối nâng cấp:',
      async (feedback) => {
        const trimmed = feedback.trim();
        if (trimmed.length < 5 || trimmed.length > 500) {
          showNotification('Lý do từ chối phải từ 5 đến 500 ký tự (AC-ADM-02.07).', 'error');
          return;
        }
        const res = await reviewOrganizerRequest(reqId, false, trimmed);
        if (res.success) {
          showNotification('Đã từ chối yêu cầu nâng cấp.', 'success');
        } else {
          showNotification(res.error || 'Từ chối nâng cấp thất bại.', 'error');
        }
      },
      'Từ chối nâng cấp'
    );
  };

  const handleApproveActivity = async (actId: string) => {
    const res = await reviewActivity(actId, true);
    if (res.success) {
      showNotification('Đã duyệt hoạt động này.', 'success');
    } else {
      showNotification(res.error || 'Duyệt hoạt động thất bại.', 'error');
    }
  };

  const handleRejectActivity = (actId: string) => {
    showPrompt(
      'Nhập lý do từ chối hoạt động:',
      async (feedback) => {
        if (!feedback.trim()) {
          showNotification('Vui lòng nhập lý do từ chối.', 'error');
          return;
        }
        const res = await reviewActivity(actId, false);
        if (res.success) {
          showNotification('Đã từ chối duyệt hoạt động.', 'success');
        } else {
          showNotification(res.error || 'Từ chối duyệt hoạt động thất bại.', 'error');
        }
      },
      'Từ chối hoạt động'
    );
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

  const getRoleBadge = (role: 'Volunteer' | 'Organizer' | 'Admin') => {
    switch (role) {
      case 'Admin':
        return (
          <span className="bg-amber-50 text-amber-700 text-xs px-2.5 py-1 rounded-full font-bold border border-amber-200 shadow-sm shrink-0">
            Quản Trị Viên
          </span>
        );
      case 'Organizer':
        return (
          <span className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-bold border border-indigo-200 shadow-sm shrink-0">
            Ban Tổ Chức
          </span>
        );
      case 'Volunteer':
      default:
        return (
          <span className="bg-sky-50 text-sky-700 text-xs px-2.5 py-1 rounded-full font-bold border border-sky-200 shadow-sm shrink-0">
            Tình Nguyện Viên
          </span>
        );
    }
  };

  return (
    <div className="w-full bg-[#f8f9fa] min-h-screen pb-16 relative">
      {/* Admin specialized Header */}
      <header className="bg-white border-b border-surface-variant/40 shadow-sm transition-all duration-200 w-full mb-2">
        <div className="flex justify-between items-center px-4 md:px-8 py-4 w-full max-w-[1440px] mx-auto h-[72px]">
          {/* Left: Brand & Admin Tag */}
          <div className="flex items-center gap-3">
            <a href="#/feed" className="font-headline-md text-xl text-primary font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-3xl filled">diversity_3</span>
              <span className="tracking-tight select-none">Volunteer Connect</span>
            </a>
            <span className="text-on-surface-variant border-l border-surface-variant pl-3 font-semibold text-sm">
              Quản trị hệ thống
            </span>
          </div>

          {/* Right: Admin Actions & Info Dropdown */}
          <div className="flex items-center gap-4">
            <a
              href="#/feed"
              className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">home</span>
              Trang chủ
            </a>

            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 pl-2 focus:outline-none cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full border-2 border-primary-container overflow-hidden bg-surface-container-high shrink-0 hover:scale-105 active:scale-95 transition-all">
                  <AdminAvatar
                    name={currentUser.profile.full_name}
                    src={currentUser.profile.avatar_url}
                  />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-bold text-xs text-on-surface leading-tight">
                    {currentUser.profile.full_name}
                  </span>
                  <span className="text-[10px] text-on-surface-variant font-semibold mt-0.5 flex items-center gap-0.5">
                    Quản trị viên
                    <span className="material-symbols-outlined text-[12px] text-outline-variant">keyboard_arrow_down</span>
                  </span>
                </div>
              </button>

              {/* Dropdown Menu */}
              {profileDropdownOpen && (
                <>
                  {/* Backdrop overlay */}
                  <div
                    onClick={() => setProfileDropdownOpen(false)}
                    className="fixed inset-0 z-40 bg-transparent"
                  ></div>

                  {/* Menu list */}
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-surface-variant rounded-xl shadow-lg py-2 z-50 animate-fadeIn text-left text-xs font-semibold">
                    <a
                      href="#/feed"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-on-surface hover:bg-slate-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm text-on-surface-variant">home</span>
                      Trang chủ hệ thống
                    </a>
                    <hr className="border-outline-variant/30 my-1" />
                    <a
                      href="#/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-on-surface hover:bg-slate-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm text-on-surface-variant">account_circle</span>
                      Hồ sơ cá nhân
                    </a>
                    <hr className="border-outline-variant/30 my-1" />
                    <a
                      href="#/profile?tab=password"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-on-surface hover:bg-slate-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm text-on-surface-variant">vpn_key</span>
                      Đổi mật khẩu
                    </a>
                    <hr className="border-outline-variant/30 my-1" />
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        localStorage.removeItem('token');
                        setCurrentUser(null);
                        window.location.hash = '#/feed';
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors text-left font-semibold"
                    >
                      <span className="material-symbols-outlined text-sm text-red-500">logout</span>
                      Đăng xuất
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

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
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeTab === 'overview'
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
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeTab === 'organizers'
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
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeTab === 'activities'
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
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeTab === 'users'
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
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeTab === 'stats'
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
              {/* Header section with actions */}
              <div className="border-b border-surface-variant/40 pb-4">
                <h2 className="text-2xl font-bold text-on-surface">
                  Tổng quan hệ thống
                </h2>
                <p className="text-on-surface-variant text-xs mt-1 font-semibold">
                  Theo dõi hoạt động, người dùng và các yêu cầu cần xử lý trên Volunteer Connect.
                </p>
              </div>

              {/* Stats bento-grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Stats 1 */}
                <div className="bg-white border border-surface-variant/40 rounded-2xl p-6 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-500 shrink-0">
                    <span className="material-symbols-outlined text-2xl">description</span>
                  </div>
                  <div>
                    <h4 className="text-3xl font-bold text-on-surface">{activities.length}</h4>
                    <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mt-0.5">Tổng hoạt động</p>
                  </div>
                </div>

                {/* Stats 2 */}
                <div className="bg-white border border-surface-variant/40 rounded-2xl p-6 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-500 shrink-0">
                    <span className="material-symbols-outlined text-2xl">person</span>
                  </div>
                  <div>
                    <h4 className="text-3xl font-bold text-on-surface">{users.filter(u => u.role === 'Volunteer').length}</h4>
                    <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mt-0.5">Tình nguyện viên</p>
                  </div>
                </div>

                {/* Stats 3 */}
                <div className="bg-white border border-surface-variant/40 rounded-2xl p-6 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-500 shrink-0">
                    <span className="material-symbols-outlined text-2xl">shield</span>
                  </div>
                  <div>
                    <h4 className="text-3xl font-bold text-on-surface">{users.filter(u => u.role === 'Organizer').length}</h4>
                    <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mt-0.5">Nhà tổ chức</p>
                  </div>
                </div>
              </div>

              {/* Two-Column Middle part */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left: Nhiệm vụ cần xử lý */}
                <div className="lg:col-span-8 bg-white border border-surface-variant/40 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <span className="material-symbols-outlined text-[#006d37]">schedule</span>
                    <h3 className="text-base font-bold text-on-surface">Nhiệm vụ cần xử lý</h3>
                  </div>

                  <div className="space-y-3">
                    {/* Task 1 */}
                    <div className="flex justify-between items-center bg-[#f8f9fa] border border-slate-100 rounded-xl p-4 gap-4">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-[#fef7e0] text-[#b06000] font-bold text-xs flex items-center justify-center shrink-0">
                          {pendingActivities.length}
                        </span>
                        <div>
                          <span className="font-bold text-sm text-on-surface block">Hoạt động tình nguyện chờ duyệt</span>
                          <span className="text-xs text-on-surface-variant font-semibold">Cần kiểm duyệt nội dung chiến dịch mới đăng ký.</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('activities')}
                        className="border border-slate-200 hover:bg-slate-100 text-on-surface-variant font-bold text-xs px-4 py-2 rounded-lg transition-all shrink-0"
                      >
                        Xem danh sách
                      </button>
                    </div>

                    {/* Task 2 */}
                    <div className="flex justify-between items-center bg-[#f8f9fa] border border-slate-100 rounded-xl p-4 gap-4">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-[#fef7e0] text-[#b06000] font-bold text-xs flex items-center justify-center shrink-0">
                          {pendingRequests.length}
                        </span>
                        <div>
                          <span className="font-bold text-sm text-on-surface block">Yêu cầu nâng quyền Organizer</span>
                          <span className="text-xs text-on-surface-variant font-semibold">Đơn đề xuất xin quyền tổ chức hoạt động của Tình nguyện viên.</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('organizers')}
                        className="border border-slate-200 hover:bg-slate-100 text-on-surface-variant font-bold text-xs px-4 py-2 rounded-lg transition-all shrink-0"
                      >
                        Xem danh sách
                      </button>
                    </div>

                    {/* Task 3 */}
                    <div className="flex justify-between items-center bg-[#f8f9fa] border border-slate-100 rounded-xl p-4 gap-4">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-[#fef7e0] text-[#b06000] font-bold text-xs flex items-center justify-center shrink-0">
                          {registrations.filter(r => r.status === 'Pending').length}
                        </span>
                        <div>
                          <span className="font-bold text-sm text-on-surface block">Đăng ký tham gia hoạt động</span>
                          <span className="text-xs text-on-surface-variant font-semibold">Lượt đăng ký tham gia hoạt động cần rà soát trên hệ thống.</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('stats')}
                        className="border border-slate-200 hover:bg-slate-100 text-on-surface-variant font-bold text-xs px-4 py-2 rounded-lg transition-all shrink-0"
                      >
                        Xem danh sách
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: Statuses & Registration results */}
                <div className="lg:col-span-4 flex flex-col gap-6">

                  {/* Statuses card */}
                  <div className="bg-white border border-surface-variant/40 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <span className="material-symbols-outlined text-[#006d37]">analytics</span>
                      <h3 className="text-base font-bold text-on-surface">Tình trạng hoạt động</h3>
                    </div>

                    <div className="space-y-3.5 text-xs text-on-surface font-semibold">
                      {/* Item 1 */}
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>Đang mở tuyển (Open)</span>
                          <span>
                            {activities.filter(a => a.status === 'Open').length} / {activities.length} ({
                              activities.length > 0
                                ? Math.round((activities.filter(a => a.status === 'Open').length / activities.length) * 100)
                                : 0
                            }%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[#006d37] h-full"
                            style={{
                              width: `${activities.length > 0
                                ? (activities.filter(a => a.status === 'Open').length / activities.length) * 100
                                : 0
                                }%`
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Item 2 */}
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>Chờ duyệt (Pending)</span>
                          <span>
                            {activities.filter(a => a.status === 'Pending Review').length} / {activities.length} ({
                              activities.length > 0
                                ? Math.round((activities.filter(a => a.status === 'Pending Review').length / activities.length) * 100)
                                : 0
                            }%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[#b06000] h-full"
                            style={{
                              width: `${activities.length > 0
                                ? (activities.filter(a => a.status === 'Pending Review').length / activities.length) * 100
                                : 0
                                }%`
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Item 3 */}
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>Đã kết thúc (Completed)</span>
                          <span>
                            {activities.filter(a => a.status === 'Completed').length} / {activities.length} ({
                              activities.length > 0
                                ? Math.round((activities.filter(a => a.status === 'Completed').length / activities.length) * 100)
                                : 0
                            }%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[#1e429f] h-full"
                            style={{
                              width: `${activities.length > 0
                                ? (activities.filter(a => a.status === 'Completed').length / activities.length) * 100
                                : 0
                                }%`
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Results box */}
                  <div className="bg-[#e8f5e9]/30 border border-[#006d37]/10 rounded-2xl p-6 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-white border border-[#006d37]/20 rounded-xl flex items-center justify-center text-[#006d37] shrink-0 shadow-sm">
                      <span className="material-symbols-outlined text-2xl font-bold">check_circle</span>
                    </div>
                    <div>
                      <h4 className="text-3xl font-bold text-[#006d37]">{registrations.filter(r => r.status === 'Completed').length}</h4>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mt-0.5 leading-tight">Số lượt đã hoàn tất được xác nhận</p>
                    </div>
                  </div>

                </div>

              </div>

              {/* Bottom Quick Review Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Yêu cầu nâng quyền Organizer mới */}
                <div className="bg-white border border-surface-variant/40 rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[300px]">
                  <div>
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#006d37] text-xl">person_add</span>
                        <h3 className="text-base font-bold text-on-surface">Yêu cầu nâng quyền Organizer mới</h3>
                      </div>
                      <button
                        onClick={() => setActiveTab('organizers')}
                        className="text-[#006d37] hover:underline text-xs font-bold"
                      >
                        Xem tất cả &rarr;
                      </button>
                    </div>

                    {pendingRequests.length === 0 ? (
                      <p className="text-sm text-on-surface-variant italic py-8 text-center">Không có yêu cầu nâng quyền nào đang chờ.</p>
                    ) : (
                      <div className="space-y-4 text-xs font-semibold">
                        <div className="grid grid-cols-3 gap-2">
                          <span className="text-on-surface-variant">Họ và tên</span>
                          <span className="col-span-2 text-on-surface font-bold">{pendingRequests[0].denormalized_volunteer.name}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <span className="text-on-surface-variant">Số điện thoại</span>
                          <span className="col-span-2 text-on-surface font-bold">{pendingRequests[0].contact_phone || 'Chưa cung cấp'}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <span className="text-on-surface-variant">Thời gian gửi</span>
                          <span className="col-span-2 text-on-surface font-bold">
                            {new Date(pendingRequests[0].created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} {new Date(pendingRequests[0].created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-on-surface-variant block">Lý do xin cấp quyền</span>
                          <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-on-surface text-[11px] leading-relaxed">
                            {pendingRequests[0].reason}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-on-surface-variant">Trạng thái</span>
                          <span className="bg-[#fef7e0] text-[#b06000] px-2.5 py-0.5 rounded-full text-[10px] font-bold">Chờ duyệt</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {pendingRequests.length > 0 && (
                    <button
                      onClick={() => handleApproveOrganizer(pendingRequests[0]._id)}
                      className="w-full bg-[#006d37] hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl transition-all text-xs shadow-sm mt-4"
                    >
                      Phê duyệt ngay
                    </button>
                  )}
                </div>

                {/* Right: Hoạt động chờ duyệt mới */}
                <div className="bg-white border border-surface-variant/40 rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[300px]">
                  <div>
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#006d37] text-xl">fact_check</span>
                        <h3 className="text-base font-bold text-on-surface">Hoạt động chờ duyệt mới</h3>
                      </div>
                      <button
                        onClick={() => setActiveTab('activities')}
                        className="text-[#006d37] hover:underline text-xs font-bold"
                      >
                        Xem tất cả &rarr;
                      </button>
                    </div>

                    {pendingActivities.length === 0 ? (
                      <p className="text-sm text-on-surface-variant italic py-8 text-center">Không có chiến dịch nào đang chờ duyệt.</p>
                    ) : (
                      <div className="space-y-4 text-xs font-semibold">
                        <div className="grid grid-cols-3 gap-2">
                          <span className="text-on-surface-variant">Tên hoạt động</span>
                          <span className="col-span-2 text-on-surface font-bold">{pendingActivities[0].title}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <span className="text-on-surface-variant">Lĩnh vực</span>
                          <span className="col-span-2 text-on-surface font-bold">{pendingActivities[0].categories.join(', ')}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <span className="text-on-surface-variant">Người đăng</span>
                          <span className="col-span-2 text-on-surface font-bold">{pendingActivities[0].denormalized_organizer?.name || 'Ban tổ chức'}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <span className="text-on-surface-variant">Thời gian gửi</span>
                          <span className="col-span-2 text-on-surface font-bold">
                            {new Date(pendingActivities[0].created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} {new Date(pendingActivities[0].created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-on-surface-variant">Trạng thái</span>
                          <span className="bg-[#fef7e0] text-[#b06000] px-2.5 py-0.5 rounded-full text-[10px] font-bold">Chờ duyệt</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {pendingActivities.length > 0 && (
                    <button
                      onClick={() => handleApproveActivity(pendingActivities[0]._id)}
                      className="w-full bg-[#006d37] hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl transition-all text-xs shadow-sm mt-4"
                    >
                      Phê duyệt ngay
                    </button>
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
                              {act.denormalized_organizer?.name || 'Ban tổ chức'}
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
                {users.length === 0 ? (
                  <div className="p-16 text-center space-y-3">
                    <span className="material-symbols-outlined text-outline text-5xl">group</span>
                    <p className="text-sm text-on-surface-variant italic">Không có người dùng nào trong hệ thống</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="bg-[#f8f9fa] border-b border-surface-variant/40 text-on-surface-variant font-bold text-xs uppercase tracking-wider">
                          <th className="px-4 py-3 whitespace-nowrap">Tên người dùng</th>
                          <th className="px-4 py-3 whitespace-nowrap">Số điện thoại</th>
                          <th className="px-4 py-3 whitespace-nowrap">Email</th>
                          <th className="px-4 py-3 whitespace-nowrap">Vai trò</th>
                          <th className="px-4 py-3 whitespace-nowrap">Cấp quyền vai trò</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-variant/30 text-on-surface">
                        {users.map(u => (
                          <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3.5 font-bold whitespace-nowrap">{u.profile.full_name}</td>
                            <td className="px-4 py-3.5 text-on-surface-variant whitespace-nowrap">{u.phone}</td>
                            <td className="px-4 py-3.5 text-on-surface-variant max-w-[200px] truncate" title={u.email || 'Chưa cập nhật'}>
                              {u.email || 'Chưa cập nhật'}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              {getRoleBadge(u.role)}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <select
                                value={u.role}
                                onChange={(e) => {
                                  const newRole = e.target.value as 'Volunteer' | 'Organizer' | 'Admin';
                                  if (newRole === u.role) return;
                                  if (confirmDialog) return;
                                  e.target.blur();
                                  
                                  const oldRoleName = u.role === 'Volunteer' ? 'Tình Nguyện Viên' : u.role === 'Organizer' ? 'Ban Tổ Chức' : 'Quản Trị Viên';
                                  const newRoleName = newRole === 'Volunteer' ? 'Tình Nguyện Viên' : newRole === 'Organizer' ? 'Ban Tổ Chức' : 'Quản Trị Viên';
                                  
                                  showConfirm(
                                    `Bạn có chắc chắn muốn thay đổi vai trò của người dùng "${u.profile.full_name}" từ "${oldRoleName}" sang "${newRoleName}" không?`,
                                    () => {
                                      changeUserRole(u._id, newRole);
                                      showNotification(`Đã chuyển vai trò của ${u.profile.full_name} sang ${newRoleName}`, 'success');
                                    }
                                  );
                                }}
                                className="border border-surface-variant rounded-lg px-2 py-1 text-xs bg-white cursor-pointer font-semibold"
                              >
                                <option value="Volunteer">Tình Nguyện Viên</option>
                                <option value="Organizer">Ban Tổ Chức</option>
                                {u.role === 'Admin' && <option value="Admin">Quản Trị Viên</option>}
                              </select>
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
