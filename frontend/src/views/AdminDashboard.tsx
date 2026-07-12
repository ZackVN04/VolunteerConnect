import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { User } from '../context/AppContext';

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

const ExpandableText: React.FC<{ text: string; limit?: number }> = ({ text, limit = 50 }) => {
  const [expanded, setExpanded] = useState(false);

  if (text.length <= limit) {
    return <span>{text}</span>;
  }

  return (
    <span>
      {expanded ? text : `${text.slice(0, limit)}...`}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-[#006d37] hover:underline font-bold ml-1.5 focus:outline-none inline-block text-[11px] cursor-pointer"
      >
        {expanded ? 'Thu gọn' : 'Xem thêm'}
      </button>
    </span>
  );
};

export const AdminDashboard: React.FC = () => {
  const {
    currentUser, users, activities, registrations, organizerRequests,
    reviewOrganizerRequest, reviewActivity, bulkReviewOrganizerRequests, bulkReviewActivities,
    setCurrentUser, showNotification, showPrompt, refreshAllData
  } = useApp();

  useEffect(() => {
    const interval = setInterval(() => {
      refreshAllData().catch((err) => console.error("Lỗi tự động cập nhật dữ liệu Admin:", err));
    }, 30000);
    return () => clearInterval(interval);
  }, [refreshAllData]);

  const [activeTab, setActiveTab] = useState<'overview' | 'organizers' | 'activities' | 'users' | 'stats' | 'history'>('overview');
  const [historySubTab, setHistorySubTab] = useState<'organizers' | 'activities'>('organizers');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Filters for History Tab
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'All' | 'Approved' | 'Rejected'>('All');
  const [historyDateFilter, setHistoryDateFilter] = useState('');

  // Filters for Organizers Tab
  const [orgSearch, setOrgSearch] = useState('');
  const [orgDateFilter, setOrgDateFilter] = useState('');

  // Filters for Activities Tab
  const [actSearch, setActSearch] = useState('');
  const [actCategoryFilter, setActCategoryFilter] = useState('All');

  // Filters for Users Tab
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('All');

  // Filters for Stats Tab
  const [statsSearch, setStatsSearch] = useState('');
  const [statsStatusFilter, setStatsStatusFilter] = useState('All');

  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);

  useEffect(() => {
    setSelectedRequestIds([]);
    setSelectedActivityIds([]);
  }, [activeTab]);

  if (!currentUser) return null;

  // Filter pending review lists
  const pendingRequests = organizerRequests
    .filter(r => r.status === 'Pending')
    .filter(req => {
      const requesterUser = users.find(u => u._id === req.volunteer_id);
      const name = (req.denormalized_volunteer?.name || '').toLowerCase();
      const email = (requesterUser?.email || req.denormalized_volunteer?.email || '').toLowerCase();
      const phone = (requesterUser?.phone || req.contact_phone || '').toLowerCase();
      const search = orgSearch.toLowerCase();

      if (search && !name.includes(search) && !email.includes(search) && !phone.includes(search)) {
        return false;
      }

      if (orgDateFilter && req.created_at) {
        const itemDateStr = new Date(req.created_at).toISOString().split('T')[0];
        if (itemDateStr !== orgDateFilter) return false;
      }

      return true;
    });

  const pendingActivities = activities
    .filter(a => a.status === 'Pending Review')
    .filter(act => {
      const title = (act.title || '').toLowerCase();
      const orgName = (act.denormalized_organizer?.name || '').toLowerCase();
      const search = actSearch.toLowerCase();

      if (search && !title.includes(search) && !orgName.includes(search)) {
        return false;
      }

      if (actCategoryFilter !== 'All') {
        if (!act.categories?.includes(actCategoryFilter)) return false;
      }

      return true;
    });

  const handleBulkApproveRequests = async () => {
    if (selectedRequestIds.length === 0) return;
    const res = await bulkReviewOrganizerRequests(selectedRequestIds, true);
    if (res.success) {
      showNotification(res.error || 'Đã duyệt nâng cấp các tài khoản được chọn.', 'success');
      setSelectedRequestIds([]);
    } else {
      showNotification(res.error || 'Duyệt nâng cấp hàng loạt thất bại.', 'error');
    }
  };

  const handleBulkRejectRequests = () => {
    if (selectedRequestIds.length === 0) return;
    showPrompt(
      'Nhập lý do từ chối nâng cấp hàng loạt:',
      async (feedback) => {
        const trimmed = feedback.trim();
        if (trimmed.length < 5 || trimmed.length > 500) {
          showNotification('Lý do từ chối phải từ 5 đến 500 ký tự (AC-ADM-02.07).', 'error');
          return;
        }
        const res = await bulkReviewOrganizerRequests(selectedRequestIds, false, trimmed);
        if (res.success) {
          showNotification(res.error || 'Đã từ chối các yêu cầu nâng cấp được chọn.', 'success');
          setSelectedRequestIds([]);
        } else {
          showNotification(res.error || 'Từ chối nâng cấp hàng loạt thất bại.', 'error');
        }
      },
      'Từ chối nâng cấp hàng loạt'
    );
  };

  const handleBulkApproveActivities = async () => {
    if (selectedActivityIds.length === 0) return;
    const res = await bulkReviewActivities(selectedActivityIds, true);
    if (res.success) {
      showNotification(res.error || 'Đã duyệt các hoạt động được chọn.', 'success');
      setSelectedActivityIds([]);
    } else {
      showNotification(res.error || 'Duyệt hoạt động hàng loạt thất bại.', 'error');
    }
  };

  const handleBulkRejectActivities = () => {
    if (selectedActivityIds.length === 0) return;
    showPrompt(
      'Nhập lý do từ chối duyệt hoạt động hàng loạt:',
      async (feedback) => {
        if (!feedback.trim()) {
          showNotification('Vui lòng nhập lý do từ chối.', 'error');
          return;
        }
        const res = await bulkReviewActivities(selectedActivityIds, false, feedback);
        if (res.success) {
          showNotification(res.error || 'Đã từ chối duyệt các hoạt động được chọn.', 'success');
          setSelectedActivityIds([]);
        } else {
          showNotification(res.error || 'Từ chối duyệt hoạt động hàng loạt thất bại.', 'error');
        }
      },
      'Từ chối hoạt động hàng loạt'
    );
  };

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
          showNotification('Lý do từ chối phải từ 5 đến 500 ký tự.', 'error');
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

  const getLoginStatusBadge = (user: User) => {
    // Current logged-in user is always online. Other users are simulated based on their ID hash for a realistic experience.
    const isOnline = currentUser && user._id === currentUser._id
      ? true
      : (user._id.charCodeAt(user._id.length - 1) % 2 === 0);

    if (isOnline) {
      return (
        <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1.5 rounded-full font-bold border border-emerald-200 shadow-sm shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Đang hoạt động
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-500 text-xs px-2.5 py-1.5 rounded-full font-semibold border border-slate-200 shadow-sm shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          Ngoại tuyến
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

            {/* Tab 6: Lịch sử phê duyệt */}
            <button
              onClick={() => setActiveTab('history')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeTab === 'history'
                ? 'bg-[#006d37] text-white'
                : 'text-on-surface-variant hover:bg-slate-100 hover:text-on-surface'
                }`}
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">history</span>
                Lịch sử phê duyệt
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

              {/* Filter controls */}
              <div className="bg-white border border-surface-variant/40 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-80">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                  <input
                    type="text"
                    placeholder="Tìm theo tên, email, SĐT..."
                    value={orgSearch}
                    onChange={(e) => setOrgSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#006d37] focus:border-[#006d37]"
                  />
                </div>

                <div className="flex flex-wrap w-full md:w-auto gap-4 items-center justify-end">
                  {/* Date Filter */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-500 font-semibold">Ngày gửi:</span>
                    <input
                      type="date"
                      value={orgDateFilter}
                      onChange={(e) => setOrgDateFilter(e.target.value)}
                      className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
                    />
                  </div>

                  {/* Clear Filters */}
                  {(orgSearch || orgDateFilter) && (
                    <button
                      onClick={() => {
                        setOrgSearch('');
                        setOrgDateFilter('');
                      }}
                      className="text-red-600 hover:text-red-700 font-bold text-xs flex items-center gap-0.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">clear</span>
                      Xóa lọc
                    </button>
                  )}
                </div>
              </div>

              {/* Bulk actions bar */}
              {selectedRequestIds.length > 0 && (
                <div className="bg-[#e8f5e9] border border-[#b2dfdb] rounded-2xl p-4 shadow-sm flex items-center justify-between">
                  <div className="text-xs text-[#004d40] font-bold">
                    Đã chọn <span className="text-[#00796b] text-sm">{selectedRequestIds.length}</span> yêu cầu
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleBulkApproveRequests}
                      className="px-4 py-2 bg-[#006d37] text-white rounded-xl text-xs font-bold shadow hover:bg-[#005229] transition-colors cursor-pointer"
                    >
                      Duyệt nâng cấp hàng loạt
                    </button>
                    <button
                      onClick={handleBulkRejectRequests}
                      className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold shadow hover:bg-red-700 transition-colors cursor-pointer"
                    >
                      Từ chối hàng loạt
                    </button>
                  </div>
                </div>
              )}

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
                          <th className="px-6 py-4 w-12 text-center">
                            <input
                              type="checkbox"
                              checked={pendingRequests.length > 0 && selectedRequestIds.length === pendingRequests.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedRequestIds(pendingRequests.map(r => r._id));
                                } else {
                                  setSelectedRequestIds([]);
                                }
                              }}
                              className="rounded border-slate-300 text-[#006d37] focus:ring-[#006d37] cursor-pointer"
                            />
                          </th>
                          <th className="px-6 py-4">Tên tài khoản</th>
                          <th className="px-6 py-4">Đơn vị đại diện</th>
                          <th className="px-6 py-4">Mô tả hoạt động</th>
                          <th className="px-6 py-4">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-variant/30 text-on-surface">
                        {pendingRequests.map(req => (
                          <tr key={req._id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-5 w-12 text-center">
                              <input
                                type="checkbox"
                                checked={selectedRequestIds.includes(req._id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedRequestIds(prev => [...prev, req._id]);
                                  } else {
                                    setSelectedRequestIds(prev => prev.filter(id => id !== req._id));
                                  }
                                }}
                                className="rounded border-slate-300 text-[#006d37] focus:ring-[#006d37] cursor-pointer"
                              />
                            </td>
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

              {/* Filter controls */}
              <div className="bg-white border border-surface-variant/40 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-80">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                  <input
                    type="text"
                    placeholder="Tìm theo tên hoạt động, BTC..."
                    value={actSearch}
                    onChange={(e) => setActSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#006d37] focus:border-[#006d37]"
                  />
                </div>

                <div className="flex flex-wrap w-full md:w-auto gap-4 items-center justify-end">
                  {/* Category Filter */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-500 font-semibold">Lĩnh vực:</span>
                    <select
                      value={actCategoryFilter}
                      onChange={(e) => setActCategoryFilter(e.target.value)}
                      className="border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white font-medium text-slate-700 focus:outline-none text-xs"
                    >
                      <option value="All">Tất cả</option>
                      <option value="Môi trường">Môi trường</option>
                      <option value="Giáo dục">Giáo dục</option>
                      <option value="Y tế">Y tế</option>
                      <option value="Từ thiện">Từ thiện</option>
                      <option value="Gây quỹ">Gây quỹ</option>
                    </select>
                  </div>

                  {/* Clear Filters */}
                  {(actSearch || actCategoryFilter !== 'All') && (
                    <button
                      onClick={() => {
                        setActSearch('');
                        setActCategoryFilter('All');
                      }}
                      className="text-red-600 hover:text-red-700 font-bold text-xs flex items-center gap-0.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">clear</span>
                      Xóa lọc
                    </button>
                  )}
                </div>
              </div>

              {/* Bulk actions bar */}
              {selectedActivityIds.length > 0 && (
                <div className="bg-[#e8f5e9] border border-[#b2dfdb] rounded-2xl p-4 shadow-sm flex items-center justify-between">
                  <div className="text-xs text-[#004d40] font-bold">
                    Đã chọn <span className="text-[#00796b] text-sm">{selectedActivityIds.length}</span> hoạt động
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleBulkApproveActivities}
                      className="px-4 py-2 bg-[#006d37] text-white rounded-xl text-xs font-bold shadow hover:bg-[#005229] transition-colors cursor-pointer"
                    >
                      Duyệt hoạt động hàng loạt
                    </button>
                    <button
                      onClick={handleBulkRejectActivities}
                      className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold shadow hover:bg-red-700 transition-colors cursor-pointer"
                    >
                      Từ chối hàng loạt
                    </button>
                  </div>
                </div>
              )}

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
                          <th className="px-6 py-4 w-12 text-center">
                            <input
                              type="checkbox"
                              checked={pendingActivities.length > 0 && selectedActivityIds.length === pendingActivities.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedActivityIds(pendingActivities.map(a => a._id));
                                } else {
                                  setSelectedActivityIds([]);
                                }
                              }}
                              className="rounded border-slate-300 text-[#006d37] focus:ring-[#006d37] cursor-pointer"
                            />
                          </th>
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
                            <td className="px-6 py-5 w-12 text-center">
                              <input
                                type="checkbox"
                                checked={selectedActivityIds.includes(act._id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedActivityIds(prev => [...prev, act._id]);
                                  } else {
                                    setSelectedActivityIds(prev => prev.filter(id => id !== act._id));
                                  }
                                }}
                                className="rounded border-slate-300 text-[#006d37] focus:ring-[#006d37] cursor-pointer"
                              />
                            </td>
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
          {activeTab === 'users' && (() => {
            const filteredUsers = users.filter(u => {
              const name = (u.profile.full_name || '').toLowerCase();
              const phone = (u.phone || '').toLowerCase();
              const email = (u.email || '').toLowerCase();
              const search = userSearch.toLowerCase();

              if (search && !name.includes(search) && !phone.includes(search) && !email.includes(search)) {
                return false;
              }

              if (userRoleFilter !== 'All') {
                if (u.role !== userRoleFilter) return false;
              }

              return true;
            });

            return (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-on-surface border-b border-surface-variant/40 pb-3">
                  Danh sách người dùng
                </h2>

                {/* Filter controls */}
                <div className="bg-white border border-surface-variant/40 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="relative w-full md:w-80">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                    <input
                      type="text"
                      placeholder="Tìm theo tên, SĐT, email..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#006d37] focus:border-[#006d37]"
                    />
                  </div>

                  <div className="flex flex-wrap w-full md:w-auto gap-4 items-center justify-end">
                    {/* Role Filter */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-500 font-semibold">Vai trò:</span>
                      <select
                        value={userRoleFilter}
                        onChange={(e) => setUserRoleFilter(e.target.value)}
                        className="border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white font-medium text-slate-700 focus:outline-none text-xs"
                      >
                        <option value="All">Tất cả</option>
                        <option value="Volunteer">Tình nguyện viên</option>
                        <option value="Organizer">Ban tổ chức</option>
                        <option value="Admin">Quản trị viên</option>
                      </select>
                    </div>

                    {/* Clear Filters */}
                    {(userSearch || userRoleFilter !== 'All') && (
                      <button
                        onClick={() => {
                          setUserSearch('');
                          setUserRoleFilter('All');
                        }}
                        className="text-red-600 hover:text-red-700 font-bold text-xs flex items-center gap-0.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">clear</span>
                        Xóa lọc
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-surface-variant/40 rounded-2xl shadow-sm overflow-hidden">
                  {filteredUsers.length === 0 ? (
                    <div className="p-16 text-center space-y-3">
                      <span className="material-symbols-outlined text-outline text-5xl">group</span>
                      <p className="text-sm text-on-surface-variant italic">Không tìm thấy người dùng phù hợp.</p>
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
                            <th className="px-4 py-3 whitespace-nowrap">Trạng thái hoạt động</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-variant/30 text-on-surface">
                          {filteredUsers.map(u => (
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
                                {getLoginStatusBadge(u)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* TAB 5: REGISTRATION & ATTENDANCE STATS TABLE */}
          {activeTab === 'stats' && (() => {
            const filteredRegs = registrations.filter(reg => {
              const name = (reg.denormalized_volunteer?.name || '').toLowerCase();
              const actTitle = (reg.denormalized_activity?.title || '').toLowerCase();
              const search = statsSearch.toLowerCase();

              if (search && !name.includes(search) && !actTitle.includes(search)) {
                return false;
              }

              if (statsStatusFilter !== 'All') {
                if (statsStatusFilter === 'Approved' && reg.status !== 'Approved') return false;
                if (statsStatusFilter === 'Pending' && reg.status !== 'Pending') return false;
                if (statsStatusFilter === 'Completed' && reg.status !== 'Completed') return false;
                if (statsStatusFilter === 'Absent' && reg.status !== 'Absent') return false;
                if (statsStatusFilter === 'Rejected' && reg.status !== 'Rejected') return false;
                if (statsStatusFilter === 'Cancelled' && reg.status !== 'Cancelled') return false;
              }

              return true;
            });

            return (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-on-surface border-b border-surface-variant/40 pb-3">
                  Thống kê tham gia
                </h2>

                {/* Filter controls */}
                <div className="bg-white border border-surface-variant/40 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="relative w-full md:w-80">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                    <input
                      type="text"
                      placeholder="Tìm theo tên tình nguyện viên, hoạt động..."
                      value={statsSearch}
                      onChange={(e) => setStatsSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#006d37] focus:border-[#006d37]"
                    />
                  </div>

                  <div className="flex flex-wrap w-full md:w-auto gap-4 items-center justify-end">
                    {/* Status Filter */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-500 font-semibold">Trạng thái:</span>
                      <select
                        value={statsStatusFilter}
                        onChange={(e) => setStatsStatusFilter(e.target.value)}
                        className="border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white font-medium text-slate-700 focus:outline-none text-xs"
                      >
                        <option value="All">Tất cả</option>
                        <option value="Pending">Chờ duyệt</option>
                        <option value="Approved">Đã duyệt</option>
                        <option value="Completed">Hoàn thành</option>
                        <option value="Absent">Vắng mặt</option>
                        <option value="Rejected">Bị từ chối</option>
                        <option value="Cancelled">Đã hủy</option>
                      </select>
                    </div>

                    {/* Clear Filters */}
                    {(statsSearch || statsStatusFilter !== 'All') && (
                      <button
                        onClick={() => {
                          setStatsSearch('');
                          setStatsStatusFilter('All');
                        }}
                        className="text-red-600 hover:text-red-700 font-bold text-xs flex items-center gap-0.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">clear</span>
                        Xóa lọc
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-surface-variant/40 rounded-2xl shadow-sm overflow-hidden">
                  {filteredRegs.length === 0 ? (
                    <div className="p-16 text-center space-y-3">
                      <span className="material-symbols-outlined text-outline text-5xl">analytics</span>
                      <p className="text-sm text-on-surface-variant italic">Không tìm thấy kết quả thống kê tham gia phù hợp.</p>
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
                          {filteredRegs.map(reg => {
                            const actDetails = activities.find(a => a._id === reg.activity_id);
                            return (
                              <tr key={reg._id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-5 font-bold">{reg.denormalized_volunteer.name}</td>
                                <td className="px-6 py-5 text-on-surface font-semibold">
                                  {reg.denormalized_activity.title}
                                </td>
                                <td className="px-6 py-5 text-on-surface-variant">
                                  {actDetails?.denormalized_organizer?.name || 'Ban tổ chức'}
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap text-on-surface-variant">
                                  {new Date(reg.created_at).toLocaleDateString('vi-VN')}
                                </td>
                                <td className="px-6 py-5">
                                  {getStatusBadge(reg.status)}
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
            );
          })()}

          {/* TAB 6: APPROVAL HISTORY */}
          {activeTab === 'history' && (() => {
            const filteredRequests = organizerRequests
              .filter(r => r.status === 'Approved' || r.status === 'Rejected')
              .filter(req => {
                const requesterUser = users.find(u => u._id === req.volunteer_id);
                const name = (req.denormalized_volunteer?.name || '').toLowerCase();
                const accountName = (requesterUser?.phone || req.contact_phone || '').toLowerCase();
                const reason = (req.reason || '').toLowerCase();
                const search = historySearch.toLowerCase();
                if (search && !name.includes(search) && !accountName.includes(search) && !reason.includes(search)) {
                  return false;
                }

                if (historyStatusFilter !== 'All') {
                  if (historyStatusFilter === 'Approved' && req.status !== 'Approved') return false;
                  if (historyStatusFilter === 'Rejected' && req.status !== 'Rejected') return false;
                }

                if (historyDateFilter && req.reviewed_at) {
                  const itemDateStr = new Date(req.reviewed_at).toISOString().split('T')[0];
                  if (itemDateStr !== historyDateFilter) return false;
                }

                return true;
              });

            const filteredActs = activities
              .filter(a => a.status === 'Open' || a.status === 'Rejected')
              .filter(act => {
                const title = (act.title || '').toLowerCase();
                const orgName = (act.denormalized_organizer?.name || '').toLowerCase();
                const categories = (act.categories?.join(', ') || '').toLowerCase();
                const search = historySearch.toLowerCase();
                if (search && !title.includes(search) && !orgName.includes(search) && !categories.includes(search)) {
                  return false;
                }

                if (historyStatusFilter !== 'All') {
                  if (historyStatusFilter === 'Approved' && act.status !== 'Open') return false;
                  if (historyStatusFilter === 'Rejected' && act.status !== 'Rejected') return false;
                }

                if (historyDateFilter && act.updated_at) {
                  const itemDateStr = new Date(act.updated_at).toISOString().split('T')[0];
                  if (itemDateStr !== historyDateFilter) return false;
                }

                return true;
              });

            return (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-surface-variant/40 pb-3">
                  <div>
                    <h2 className="text-xl font-bold text-on-surface">
                      Lịch sử phê duyệt
                    </h2>
                    <p className="text-xs text-on-surface-variant mt-1">
                      Xem lịch sử kết quả xử lý các yêu cầu nâng cấp Ban tổ chức và phê duyệt hoạt động
                    </p>
                  </div>

                  {/* Sub-tab Switcher */}
                  <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-auto">
                    <button
                      onClick={() => {
                        setHistorySubTab('organizers');
                        setHistorySearch('');
                        setHistoryStatusFilter('All');
                        setHistoryDateFilter('');
                      }}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${historySubTab === 'organizers'
                        ? 'bg-[#006d37] text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      Duyệt Ban tổ chức
                    </button>
                    <button
                      onClick={() => {
                        setHistorySubTab('activities');
                        setHistorySearch('');
                        setHistoryStatusFilter('All');
                        setHistoryDateFilter('');
                      }}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${historySubTab === 'activities'
                        ? 'bg-[#006d37] text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      Duyệt Hoạt động
                    </button>
                  </div>
                </div>

                {/* Filter controls */}
                <div className="bg-white border border-surface-variant/40 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="relative w-full md:w-80">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                    <input
                      type="text"
                      placeholder={historySubTab === 'organizers' ? "Tìm theo tên, tên tài khoản, lý do..." : "Tìm theo tên hoạt động, BTC..."}
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#006d37] focus:border-[#006d37]"
                    />
                  </div>

                  <div className="flex flex-wrap w-full md:w-auto gap-4 items-center justify-end">
                    {/* Status Filter */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-500 font-semibold">Trạng thái:</span>
                      <select
                        value={historyStatusFilter}
                        onChange={(e) => setHistoryStatusFilter(e.target.value as any)}
                        className="border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white font-medium text-slate-700 focus:outline-none text-xs"
                      >
                        <option value="All">Tất cả</option>
                        <option value="Approved">Đã duyệt</option>
                        <option value="Rejected">Từ chối</option>
                      </select>
                    </div>

                    {/* Date Filter */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-500 font-semibold">Ngày duyệt:</span>
                      <input
                        type="date"
                        value={historyDateFilter}
                        onChange={(e) => setHistoryDateFilter(e.target.value)}
                        className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
                      />
                    </div>

                    {/* Clear Filters */}
                    {(historySearch || historyStatusFilter !== 'All' || historyDateFilter) && (
                      <button
                        onClick={() => {
                          setHistorySearch('');
                          setHistoryStatusFilter('All');
                          setHistoryDateFilter('');
                        }}
                        className="text-red-600 hover:text-red-700 font-bold text-xs flex items-center gap-0.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">clear</span>
                        Xóa lọc
                      </button>
                    )}
                  </div>
                </div>

                {historySubTab === 'organizers' ? (
                  <div className="bg-white border border-surface-variant/40 rounded-2xl shadow-sm overflow-hidden">
                    {filteredRequests.length === 0 ? (
                      <div className="p-16 text-center space-y-3">
                        <span className="material-symbols-outlined text-outline text-5xl">history</span>
                        <p className="text-sm text-on-surface-variant italic">Không tìm thấy lịch sử phê duyệt Ban tổ chức phù hợp.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-sm">
                          <thead>
                            <tr className="bg-[#f8f9fa] border-b border-surface-variant/40 text-on-surface-variant font-bold text-xs uppercase tracking-wider">
                              <th className="px-4 py-3 whitespace-nowrap">Người yêu cầu</th>
                              <th className="px-4 py-3">Lý do xin nâng quyền</th>
                              <th className="px-4 py-3 whitespace-nowrap">Thời gian duyệt</th>
                              <th className="px-4 py-3 whitespace-nowrap">Trạng thái</th>
                              <th className="px-4 py-3">Phản hồi của Admin</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-surface-variant/30 text-on-surface">
                            {filteredRequests.map(req => {
                              const requesterUser = users.find(u => u._id === req.volunteer_id);
                              return (
                                <tr key={req._id} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-4 py-3.5 whitespace-nowrap font-semibold">
                                    <div>{req.denormalized_volunteer?.name || 'Tài Khoản'}</div>
                                    <div className="text-[10px] text-on-surface-variant font-normal">
                                      {requesterUser?.email || req.denormalized_volunteer?.email || 'Chưa cập nhật'}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3.5 text-xs text-on-surface-variant max-w-[250px] break-words">
                                    {req.reason}
                                  </td>
                                  <td className="px-4 py-3.5 whitespace-nowrap text-xs text-on-surface-variant">
                                    {req.reviewed_at ? new Date(req.reviewed_at).toLocaleString('vi-VN') : 'Chưa cập nhật'}
                                  </td>
                                  <td className="px-4 py-3.5 whitespace-nowrap">
                                    {req.status === 'Approved' ? (
                                      <span className="bg-[#e8f5e9] text-[#006d37] font-bold text-[10px] px-2.5 py-1 rounded-full border border-[#006d37]/20 shadow-sm shrink-0">
                                        Đã duyệt
                                      </span>
                                    ) : (
                                      <span className="bg-red-50 text-red-700 font-bold text-[10px] px-2.5 py-1 rounded-full border border-red-200 shadow-sm shrink-0">
                                        Từ chối
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3.5 text-xs text-on-surface-variant max-w-[200px] break-words">
                                    {req.admin_feedback ? (
                                      <ExpandableText text={req.admin_feedback} limit={50} />
                                    ) : (
                                      <span className="italic text-slate-400">Không có</span>
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
                ) : (
                  <div className="bg-white border border-surface-variant/40 rounded-2xl shadow-sm overflow-hidden">
                    {filteredActs.length === 0 ? (
                      <div className="p-16 text-center space-y-3">
                        <span className="material-symbols-outlined text-outline text-5xl">history</span>
                        <p className="text-sm text-on-surface-variant italic">Không tìm thấy lịch sử phê duyệt hoạt động phù hợp.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-sm">
                          <thead>
                            <tr className="bg-[#f8f9fa] border-b border-surface-variant/40 text-on-surface-variant font-bold text-xs uppercase tracking-wider">
                              <th className="px-4 py-3 whitespace-nowrap">Tên hoạt động</th>
                              <th className="px-4 py-3 whitespace-nowrap">Ban tổ chức</th>
                              <th className="px-4 py-3 whitespace-nowrap">Lĩnh vực</th>
                              <th className="px-4 py-3 whitespace-nowrap">Thời gian diễn ra</th>
                              <th className="px-4 py-3 whitespace-nowrap">Trạng thái</th>
                              <th className="px-4 py-3 whitespace-nowrap">Ngày duyệt</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-surface-variant/30 text-on-surface">
                            {filteredActs.map(act => (
                              <tr key={act._id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3.5 max-w-[200px] truncate font-bold text-primary hover:underline">
                                  <a href={`#/activity/${act._id}`}>{act.title}</a>
                                </td>
                                <td className="px-4 py-3.5 whitespace-nowrap text-on-surface font-semibold">
                                  {act.denormalized_organizer?.name || 'Ban tổ chức'}
                                </td>
                                <td className="px-4 py-3.5 whitespace-nowrap text-xs text-on-surface-variant">
                                  {act.categories?.join(', ') || 'Chưa cập nhật'}
                                </td>
                                <td className="px-4 py-3.5 whitespace-nowrap text-xs text-on-surface-variant">
                                  {new Date(act.start_date).toLocaleDateString('vi-VN')} - {new Date(act.end_date).toLocaleDateString('vi-VN')}
                                </td>
                                <td className="px-4 py-3.5 whitespace-nowrap">
                                  {act.status === 'Open' ? (
                                    <span className="bg-[#e8f5e9] text-[#006d37] font-bold text-[10px] px-2.5 py-1 rounded-full border border-[#006d37]/20 shadow-sm shrink-0">
                                      Đã duyệt
                                    </span>
                                  ) : (
                                    <span className="bg-red-50 text-red-700 font-bold text-[10px] px-2.5 py-1 rounded-full border border-red-200 shadow-sm shrink-0">
                                      Từ chối
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3.5 whitespace-nowrap text-xs text-on-surface-variant">
                                  {new Date(act.updated_at).toLocaleDateString('vi-VN')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

        </section>

      </div>
    </div>
  );
};

export default AdminDashboard;
