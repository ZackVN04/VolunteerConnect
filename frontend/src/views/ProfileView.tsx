import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { User } from '../context/AppContext';
import { mediaService, userService } from '../services/apiService';
import { USE_REAL_BACKEND } from '../config/backend';

// Helper: generate avatar initials placeholder
const AvatarPlaceholder: React.FC<{ name: string; size?: number }> = ({ name, size = 128 }) => {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const colors = ['#006d37', '#0d6efd', '#6f42c1', '#fd7e14', '#20c997', '#e83e8c'];
  const bg = colors[name.charCodeAt(0) % colors.length];
  return (
    <div
      style={{ width: size, height: size, background: bg, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
      aria-label={`Avatar của ${name}`}
    >
      <span style={{ color: '#fff', fontWeight: 700, fontSize: size * 0.35, fontFamily: 'inherit' }}>{initials}</span>
    </div>
  );
};

// Helper: fix wrong dev port in backend-returned image URLs
const fixImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  return url.replace('http://localhost:3000/', 'http://localhost:8000/');
};

const InfoItem: React.FC<{
  icon: string;
  iconColorClass: string;
  bgClass: string;
  label: string;
  value: React.ReactNode
}> = ({ icon, iconColorClass, bgClass, label, value }) => (
  <div className="flex gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50 border border-slate-100 rounded-2xl items-start sm:items-center hover:shadow-sm transition-all duration-150">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgClass} shrink-0`}>
      <span className={`material-symbols-outlined text-lg ${iconColorClass}`}>{icon}</span>
    </div>
    <div className="min-w-0 space-y-0.5 text-left flex-1">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block break-words">{label}</span>
      <span className="text-slate-800 text-sm font-semibold block break-words">{value}</span>
    </div>
  </div>
);

export const ProfileView: React.FC = () => {
  const { currentUser, users, activities, registrations, organizerRequests, updateProfile, showNotification, changePassword, refreshAllData } = useApp();

  // View mode state: 'details' (default), 'edit', 'upgrade', 'password', 'participated', 'org_management'
  const [viewMode, setViewMode] = useState<'details' | 'edit' | 'upgrade' | 'password' | 'participated' | 'org_management'>('details');

  // Form states for Edit Profile
  const [fullName, setFullName] = useState(currentUser?.profile.full_name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [areaOfInterest, setAreaOfInterest] = useState(currentUser?.profile.area_of_interest || '');
  const [skillsStr, setSkillsStr] = useState(currentUser?.profile.skills?.join(', ') || '');
  const [bio, setBio] = useState(currentUser?.profile.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.profile.avatar_url || '');
  const [age, setAge] = useState<number | ''>(currentUser?.profile.age ?? '');
  const [gender, setGender] = useState(currentUser?.profile.gender || '');

  // Form states for Change Password
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Sync state if URL specifies a tab
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.includes('tab=upgrade')) {
        window.location.hash = '#/request-organizer';
      } else if (hash.includes('tab=password')) {
        setViewMode('password');
      } else if (hash.includes('tab=edit')) {
        setViewMode('edit');
      } else if (hash.includes('tab=participated')) {
        setViewMode('participated');
      } else if (hash.includes('tab=org_management')) {
        setViewMode('org_management');
      } else {
        setViewMode('details');
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const getUserIdFromHash = () => {
    const hash = window.location.hash;
    const match = hash.match(/[?&]userId=([^&]+)/);
    return match ? match[1] : null;
  };

  const viewedUserId = getUserIdFromHash();
  const isOwnProfile = !viewedUserId || viewedUserId === currentUser?._id;

  const [fetchedUser, setFetchedUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);

  useEffect(() => {
    if (!isOwnProfile && viewedUserId) {
      setLoadingUser(true);
      if (USE_REAL_BACKEND) {
        userService.getById(viewedUserId)
          .then(user => {
            setFetchedUser(user);
            setLoadingUser(false);
          })
          .catch(err => {
            console.error("Lỗi khi tải thông tin người dùng từ backend:", err);
            setFetchedUser(null);
            setLoadingUser(false);
          });
      } else {
        const localUser = users.find(u => u._id === viewedUserId);
        setFetchedUser(localUser || null);
        setLoadingUser(false);
      }
    } else {
      setFetchedUser(null);
      setLoadingUser(false);
    }
  }, [viewedUserId, isOwnProfile, users]);

  // Refetch user profile on mount to get latest statistics (e.g. joined_activity_count) (Group 4)
  useEffect(() => {
    if (isOwnProfile && USE_REAL_BACKEND) {
      refreshAllData().catch(err => console.error("Error refreshing profile stats:", err));
    }
  }, [isOwnProfile, refreshAllData]);

  const displayUser = isOwnProfile ? currentUser : viewedUserId ? fetchedUser : null;

  const myRegs = registrations.filter(r => r.volunteer_id === displayUser?._id);
  const orgActs = activities.filter(a => a.organizer_id === displayUser?._id);

  useEffect(() => {
    if (currentUser && isOwnProfile) {
      setFullName(currentUser.profile.full_name || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
      setAreaOfInterest(currentUser.profile.area_of_interest || '');
      setSkillsStr(currentUser.profile.skills?.join(', ') || '');
      setBio(currentUser.profile.bio || '');
      setAvatarUrl(fixImageUrl(currentUser.profile.avatar_url) || currentUser.profile.avatar_url || '');
      setAge(currentUser.profile.age ?? '');
      setGender(currentUser.profile.gender || '');
    }
  }, [currentUser, isOwnProfile]);

  if (loadingUser) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#006d37] mx-auto"></div>
        <p className="text-sm text-on-surface-variant font-medium">Đang tải thông tin người dùng...</p>
      </div>
    );
  }

  if (!displayUser) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto">
        <span className="material-symbols-outlined text-[#006d37] text-6xl">account_circle</span>
        <h2 className="font-headline-md text-xl font-bold text-on-surface">Không tìm thấy người dùng</h2>
        <p className="text-sm text-on-surface-variant">Tài khoản này có thể đã bị xóa hoặc đường dẫn không chính xác.</p>
        <a href="#/feed" className="inline-block bg-[#006d37] text-white px-6 py-2.5 rounded-xl font-semibold text-xs shadow-sm transition-all active:scale-95">
          Quay lại trang chủ
        </a>
      </div>
    );
  }

  const userRequest = currentUser ? organizerRequests.find(r => r.volunteer_id === currentUser._id) : undefined;
  const isPending = userRequest?.status === 'Pending';
  const isApproved = userRequest?.status === 'Approved';
  const isRejected = userRequest?.status === 'Rejected';

  let inCooldown = false;
  let cooldownHoursRemaining = 0;
  if (isRejected && userRequest) {
    const diffHours = (new Date().getTime() - new Date(userRequest.created_at).getTime()) / (1000 * 60 * 60);
    if (diffHours < 24) {
      inCooldown = true;
      cooldownHoursRemaining = Math.ceil(24 - diffHours);
    }
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showNotification('Họ và tên không được để trống.', 'error');
      return;
    }
    if (fullName.trim().length > 100) {
      showNotification('Họ và tên không được vượt quá 100 ký tự.', 'error');
      return;
    }
    if (!phone.trim()) {
      showNotification('Số điện thoại không được để trống.', 'error');
      return;
    }
    const cleanPhone = phone.trim().replace(/[\s\-()]/g, "");
    if (!/^\+?[0-9]{10,15}$/.test(cleanPhone)) {
      showNotification('Số điện thoại không hợp lệ (phải từ 10-15 chữ số).', 'error');
      return;
    }
    if (age !== '' && (Number(age) < 0 || Number(age) > 120)) {
      showNotification('Tuổi nhập vào không hợp lệ (từ 0 đến 120).', 'error');
      return;
    }

    const skills = skillsStr
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    updateProfile(
      {
        full_name: fullName,
        skills,
        bio,
        avatar_url: avatarUrl,
        age: age !== '' ? Number(age) : undefined,
        gender: gender || undefined
      },
      email || '',
      areaOfInterest || '',
      phone
    );
    showNotification('Cập nhật thông tin hồ sơ thành công!', 'success');
    setViewMode('details');
    window.location.hash = '#/profile';
  };

  const handleCancelEdit = () => {
    if (!currentUser) return;
    setFullName(currentUser.profile.full_name || '');
    setEmail(currentUser.email || '');
    setPhone(currentUser.phone || '');
    setAreaOfInterest(currentUser.profile.area_of_interest || '');
    setSkillsStr(currentUser.profile.skills?.join(', ') || '');
    setBio(currentUser.profile.bio || '');
    setAvatarUrl(currentUser.profile.avatar_url || '');
    setAge(currentUser.profile.age ?? '');
    setGender(currentUser.profile.gender || '');
    setViewMode('details');
    window.location.hash = '#/profile';
  };


  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showNotification('File ảnh quá lớn! Vui lòng chọn ảnh có dung lượng dưới 2MB.', 'error');
      return;
    }

    try {
      showNotification('Đang tải ảnh đại diện lên...', 'info');
      const uploadRes = await mediaService.upload(file);
      const publicUrl = fixImageUrl(uploadRes.url) || uploadRes.url;

      setAvatarUrl(publicUrl);
      updateProfile(
        {
          avatar_url: publicUrl,
          full_name: currentUser.profile.full_name,
          skills: currentUser.profile.skills,
          bio: currentUser.profile.bio,
          age: currentUser.profile.age,
          gender: currentUser.profile.gender
        },
        currentUser.email || '',
        currentUser.profile.area_of_interest || '',
        phone
      );
      showNotification('Đã cập nhật ảnh đại diện mới thành công!', 'success');
    } catch (err: any) {
      console.error("Lỗi upload avatar:", err);
      showNotification(err.response?.data?.detail || 'Có lỗi xảy ra khi tải ảnh lên máy chủ.', 'error');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordLoading) return;
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      showNotification('Vui lòng điền đầy đủ tất cả các trường mật khẩu.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showNotification('Mật khẩu mới phải có ít nhất 6 ký tự.', 'error');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showNotification('Mật khẩu mới và mật khẩu xác nhận không trùng khớp.', 'error');
      return;
    }

    setPasswordLoading(true);
    const res = await changePassword(oldPassword, newPassword);
    setPasswordLoading(false);

    if (res.success) {
      showNotification('Đổi mật khẩu thành công!', 'success');
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setViewMode('details');
      window.location.hash = '#/profile';
    } else {
      showNotification(res.error || 'Có lỗi xảy ra khi đổi mật khẩu.', 'error');
    }
  };

  return (
    <div className="w-full bg-[#f8f9fa] min-h-screen pb-16 text-left">
      <div className="max-w-[1100px] mx-auto px-3 sm:px-4 md:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6">

        {/* Header Breadcrumbs and Navigation */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-slate-200/60 pb-5">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-800 font-headline-md">
              {isOwnProfile ? 'Hồ sơ tài khoản' : 'Hồ sơ đối tác'}
            </h1>
            <p className="text-slate-500 text-sm mt-1.5 font-medium leading-relaxed">
              {isOwnProfile
                ? 'Quản lý thông tin bảo mật, chỉnh sửa các chi tiết hồ sơ cá nhân và theo dõi hoạt động cộng đồng.'
                : 'Thông tin liên hệ, giới thiệu và lịch sử cống hiến của thành viên.'
              }
            </p>
          </div>
          {!isOwnProfile && (
            <button
              onClick={() => window.history.back()}
              className="w-full sm:w-auto justify-center flex items-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 rounded-xl transition-all text-sm shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Quay lại
            </button>
          )}
        </div>

        {isOwnProfile ? (
          /* OWN PROFILE: 2-COLUMN LAYOUT (hồ sơ cá nhân.jpg) */
          <div className="grid grid-cols-12 gap-5 sm:gap-8 items-start">

            {/* ================= COLUMN 1: LEFT SIDEBAR (Avatar Card & Tab Menus) ================= */}
            <div className="col-span-12 md:col-span-4 space-y-6">

              {/* Avatar & Basic Info Card */}
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-4 sm:p-6 text-center space-y-4">
                <div className="flex flex-col items-center">
                  <div className="relative group w-32 h-32 rounded-full overflow-hidden border-4 border-[#006d37] shrink-0 bg-slate-50 shadow-sm">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="User Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <AvatarPlaceholder name={displayUser.profile.full_name || 'ND'} size={128} />
                    )}
                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold uppercase transition-all duration-200 cursor-pointer">
                      <span className="material-symbols-outlined text-xl mb-1">photo_camera</span>
                      Đổi ảnh
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-800 mt-4 leading-tight break-words">{displayUser.profile.full_name}</h3>
                  <span className="bg-[#e8f5e9] text-[#006d37] text-xs px-3 py-1 rounded-full font-bold uppercase mt-2">
                    {displayUser.role === 'Volunteer' ? 'Tình nguyện viên' : (displayUser.role === 'Organizer' ? 'Ban tổ chức' : displayUser.role)}
                  </span>
                  <p className="text-xs text-slate-400 font-medium mt-2.5">
                    Thành viên Volunteer Connect
                  </p>
                </div>

                {/* Vertical Tab Navigation */}
                <div className="pt-4 border-t border-slate-100 flex flex-col gap-1">
                  <button
                    onClick={() => { setViewMode('details'); window.location.hash = '#/profile'; }}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${viewMode === 'details'
                      ? 'bg-[#e8f5e9] text-[#006d37] font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <span className="material-symbols-outlined text-lg">account_circle</span>
                    Thông tin hồ sơ
                  </button>

                  <button
                    onClick={() => { setViewMode('edit'); window.location.hash = '#/profile?tab=edit'; }}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${viewMode === 'edit'
                      ? 'bg-[#e8f5e9] text-[#006d37] font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <span className="material-symbols-outlined text-lg">edit_square</span>
                    Chỉnh sửa thông tin
                  </button>

                  <button
                    onClick={() => { setViewMode('password'); window.location.hash = '#/profile?tab=password'; }}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${viewMode === 'password'
                      ? 'bg-[#e8f5e9] text-[#006d37] font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <span className="material-symbols-outlined text-lg">lock</span>
                    Đổi mật khẩu
                  </button>

                  {displayUser.role === 'Volunteer' && (
                    <button
                      onClick={() => { setViewMode('participated'); window.location.hash = '#/profile?tab=participated'; }}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${viewMode === 'participated'
                        ? 'bg-[#e8f5e9] text-[#006d37] font-bold'
                        : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                      <span className="material-symbols-outlined text-lg">volunteer_activism</span>
                      Hoạt động tham gia
                    </button>
                  )}

                  {displayUser.role === 'Organizer' && (
                    <button
                      onClick={() => { setViewMode('org_management'); window.location.hash = '#/profile?tab=org_management'; }}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${viewMode === 'org_management'
                        ? 'bg-[#e8f5e9] text-[#006d37] font-bold'
                        : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                      <span className="material-symbols-outlined text-lg">campaign</span>
                      Quản lý tổ chức
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ================= COLUMN 2: RIGHT DETAIL CONTENT ================= */}
            <div className="col-span-12 md:col-span-8 space-y-6">

              {/* tab === details: VIEW PROFILE DETAILS */}
              {viewMode === 'details' && (() => {
                const displaySkills: string[] = isOwnProfile
                  ? (skillsStr ? skillsStr.split(',').map(s => s.trim()).filter(Boolean) : [])
                  : (displayUser.profile.skills || []);
                const displayAge = isOwnProfile ? age : displayUser.profile.age;
                const displayGender = isOwnProfile ? gender : displayUser.profile.gender;
                const displayAreaOfInterest = isOwnProfile ? areaOfInterest : displayUser.profile.area_of_interest;

                return (
                  <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-4 sm:p-6 md:p-8 space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">Thông tin chi tiết</h3>
                      <p className="text-slate-400 text-xs mt-1">Các thông tin cơ bản và lý lịch cá nhân được liên kết trên hệ thống.</p>
                    </div>

                    {/* Organizer upgrade banner if Volunteer (MOVED TO TOP) */}
                    {displayUser.role === 'Volunteer' && (userRequest ? (
                      <div className={`p-4 rounded-xl border text-sm text-left ${isPending ? 'bg-[#fef7e0] border-[#b06000]/30 text-[#b06000]' :
                        isApproved ? 'bg-[#e8f5e9] border-[#006d37]/30 text-[#006d37]' :
                          'bg-red-50 border-red-200 text-red-700'
                        }`}>
                        <div className="font-bold flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-lg">
                            {isPending ? 'hourglass_empty' : isApproved ? 'verified' : 'cancel'}
                          </span>
                          Trạng thái đơn nâng quyền: {
                            isPending ? 'Đang chờ Admin duyệt' :
                              isApproved ? 'Đã duyệt thành công' : 'Bị từ chối'
                          }
                          {inCooldown && (
                            <span className="text-red-600 font-medium ml-1">
                              (Bạn có thể gửi lại yêu cầu sau {cooldownHoursRemaining} giờ)
                            </span>
                          )}
                        </div>
                        <p className="mt-[5px] ml-[5px] text-xs opacity-90">
                          Gửi ngày: {new Date(userRequest.created_at).toLocaleDateString('vi-VN')}
                        </p>
                        {userRequest.admin_feedback && (
                          <p className="mt-2.5 p-3 bg-white/60 border border-current/20 rounded-lg text-xs font-semibold leading-relaxed">
                            <strong>Phản hồi từ Admin:</strong> {userRequest.admin_feedback}
                          </p>
                        )}
                        {isRejected && !inCooldown && (
                          <button
                            onClick={() => {
                              setViewMode('upgrade');
                              window.location.hash = '#/profile?tab=upgrade';
                            }}
                            className="mt-3 w-full bg-[#006d37] hover:bg-emerald-800 text-white py-2 rounded-xl font-bold text-xs shadow-sm transition-all"
                          >
                            Gửi lại yêu cầu nâng quyền khác
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="bg-[#e8f5e9]/30 border border-[#006d37]/15 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 text-left">
                        <div className="space-y-1 min-w-0">
                          <h4 className="text-sm font-bold text-slate-800">Trở thành Ban Tổ Chức</h4>
                          <p className="text-slate-500 text-xs leading-relaxed max-w-[420px]">
                            Bạn muốn tự đăng bài và quản lý chiến dịch cộng đồng của riêng mình? Đăng ký nâng cấp tài khoản ngay.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setViewMode('upgrade');
                            window.location.hash = '#/profile?tab=upgrade';
                          }}
                          className="w-full sm:w-auto bg-[#006d37] hover:bg-emerald-800 text-white font-bold px-4 py-2.5 rounded-xl transition-all text-xs shadow-sm whitespace-nowrap cursor-pointer shrink-0 animate-pulse hover:animate-none"
                        >
                          Đăng ký nâng quyền
                        </button>
                      </div>
                    ))}

                    {/* 2-Column Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InfoItem
                        icon="mail"
                        iconColorClass="text-blue-600"
                        bgClass="bg-blue-50"
                        label="Địa chỉ Email"
                        value={displayUser.email || "Chưa cập nhật"}
                      />
                      <InfoItem
                        icon="call"
                        iconColorClass="text-emerald-600"
                        bgClass="bg-emerald-50"
                        label="Số điện thoại"
                        value={displayUser.phone || "Chưa cập nhật"}
                      />
                      <InfoItem
                        icon="location_on"
                        iconColorClass="text-rose-600"
                        bgClass="bg-rose-50"
                        label="Khu vực hoạt động"
                        value={displayAreaOfInterest || "Chưa cập nhật"}
                      />
                      <InfoItem
                        icon="cake"
                        iconColorClass="text-amber-600"
                        bgClass="bg-amber-50"
                        label="Tuổi"
                        value={displayAge ? `${displayAge} tuổi` : "Chưa cập nhật"}
                      />
                      <InfoItem
                        icon="wc"
                        iconColorClass="text-purple-600"
                        bgClass="bg-purple-50"
                        label="Giới tính"
                        value={displayGender || "Chưa cập nhật"}
                      />
                    </div>

                    {/* Kỹ năng nổi bật */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 space-y-2 text-left">
                      <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-wider">
                        <span className="material-symbols-outlined text-lg text-[#006d37]">psychology</span>
                        Kỹ năng nổi bật
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {displaySkills.length > 0 ? (
                          displaySkills.map((skill, index) => (
                            <span key={index} className="bg-teal-50 text-teal-800 border border-teal-100 px-3 py-1 rounded-lg text-xs font-semibold">
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-xs italic font-medium">Chưa cập nhật danh sách kỹ năng nổi bật.</span>
                        )}
                      </div>
                    </div>

                    {/* Giới thiệu bản thân */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 space-y-2 text-left">
                      <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-wider">
                        <span className="material-symbols-outlined text-lg text-[#006d37]">chat_bubble</span>
                        Giới thiệu bản thân
                      </div>
                      <p className="text-slate-600 text-sm font-medium leading-relaxed italic">
                        "{displayUser.profile.bio || "Thành viên Volunteer Connect"}"
                      </p>
                    </div>

                    {/* Stats Box */}
                    <div className="bg-[#e8f5e9]/40 border border-[#006d37]/15 p-4 sm:p-5 rounded-xl flex items-start sm:items-center gap-4 text-left">
                      <div className="w-12 h-12 rounded-xl bg-[#e8f5e9] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[#006d37] text-2xl font-bold">star</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Thống kê cống hiến</span>
                        <span className="text-slate-800 text-sm font-bold block mt-0.5">
                          Đã tham gia <span className="text-[#006d37] text-base font-extrabold">{myRegs.filter(r => r.status === 'Completed').length}</span> chiến dịch tình nguyện
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* tab === edit: EDIT PROFILE FORM */}
              {viewMode === 'edit' && (
                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-4 sm:p-6 md:p-8 space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Cập nhật thông tin cá nhân</h3>
                    <p className="text-slate-400 text-xs mt-1">Thay đổi họ tên, số điện thoại liên lạc, giới tính và khu vực hoạt động.</p>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-5 text-left">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Họ và tên</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        placeholder="Nguyễn Văn A"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-1 focus:ring-[#006d37] text-sm font-semibold text-slate-800 bg-white transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Địa chỉ Email</label>
                        <input
                          type="email"
                          value={email}
                          disabled
                          className="w-full px-4 py-2.5 border border-slate-100 rounded-xl text-sm bg-slate-50 text-slate-400 cursor-not-allowed focus:outline-none font-semibold"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Số điện thoại</label>
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          placeholder="Nhập số điện thoại..."
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-1 focus:ring-[#006d37] text-sm font-semibold text-slate-800 bg-white transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Khu vực hoạt động</label>
                        <select
                          value={areaOfInterest}
                          onChange={(e) => setAreaOfInterest(e.target.value)}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-1 focus:ring-[#006d37] text-sm font-semibold text-slate-800 bg-white transition-all cursor-pointer"
                        >
                          <option value="">Chọn khu vực hoạt động</option>
                          <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                          <option value="Hà Nội">Hà Nội</option>
                          <option value="Đà Nẵng">Đà Nẵng</option>
                          <option value="Cần Thơ">Cần Thơ</option>
                          <option value="Hải Phòng">Hải Phòng</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tuổi</label>
                        <input
                          type="number"
                          value={age}
                          onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="Nhập tuổi..."
                          min={0}
                          max={120}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-1 focus:ring-[#006d37] text-sm font-semibold text-slate-800 bg-white transition-all"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Giới tính</label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-1 focus:ring-[#006d37] text-sm font-semibold text-slate-800 bg-white transition-all cursor-pointer"
                        >
                          <option value="">Chưa chọn</option>
                          <option value="Nam">Nam</option>
                          <option value="Nữ">Nữ</option>
                          <option value="Khác">Khác</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kỹ năng nổi bật (Cách nhau bằng dấu phẩy)</label>
                      <input
                        type="text"
                        value={skillsStr}
                        onChange={(e) => setSkillsStr(e.target.value)}
                        placeholder="Giao tiếp tiếng Anh, Dạy học, Vẽ tranh"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-1 focus:ring-[#006d37] text-sm font-semibold text-slate-800 bg-white transition-all"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Giới thiệu bản thân</label>
                      <textarea
                        rows={3}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Nhập một vài dòng giới thiệu ngắn về bản thân..."
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-1 focus:ring-[#006d37] text-sm font-semibold text-slate-800 bg-white transition-all"
                      />
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="w-full sm:w-auto px-5 py-2.5 border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-colors text-sm font-bold cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="w-full sm:w-auto px-5 py-2.5 bg-[#006d37] hover:bg-emerald-800 text-white rounded-xl transition-colors text-sm font-bold shadow-sm cursor-pointer"
                      >
                        Lưu thay đổi
                      </button>
                    </div>
                  </form>
                </div>
              )}


              {/* tab === password: CHANGE PASSWORD */}
              {viewMode === 'password' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4 sm:p-6 md:p-8 space-y-6">
                  <div className="text-center space-y-1">
                    <h3 className="text-2xl font-bold text-gray-900">Đổi mật khẩu</h3>
                    <p className="text-slate-400 text-xs">Cập nhật mật khẩu mới để bảo mật tài khoản cá nhân</p>
                  </div>

                  <form onSubmit={handleChangePassword} className="space-y-4 text-left">
                    {/* Old password */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Mật khẩu hiện tại</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                          <span className="material-symbols-outlined text-slate-400" style={{ fontSize: 18 }}>lock</span>
                        </div>
                        <input
                          type={showOldPassword ? "text" : "password"}
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          required
                          placeholder="••••••••"
                          className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-1 focus:ring-[#006d37] text-sm font-semibold text-slate-800 bg-white transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOldPassword(!showOldPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center p-1 cursor-pointer"
                          tabIndex={-1}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {showOldPassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* New password */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Mật khẩu mới</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                          <span className="material-symbols-outlined text-slate-400" style={{ fontSize: 18 }}>lock</span>
                        </div>
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          placeholder="••••••••"
                          className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-1 focus:ring-[#006d37] text-sm font-semibold text-slate-800 bg-white transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center p-1 cursor-pointer"
                          tabIndex={-1}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {showNewPassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Confirm password */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Xác nhận mật khẩu mới</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                          <span className="material-symbols-outlined text-slate-400" style={{ fontSize: 18 }}>lock</span>
                        </div>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          required
                          placeholder="••••••••"
                          className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-1 focus:ring-[#006d37] text-sm font-semibold text-slate-800 bg-white transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center p-1 cursor-pointer"
                          tabIndex={-1}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {showConfirmPassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="w-full mt-2 bg-[#006d37] hover:bg-emerald-800 text-white font-semibold rounded-full py-2.5 text-sm transition-all shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {passwordLoading ? 'Đang thực hiện...' : 'Cập nhật mật khẩu'}
                    </button>
                  </form>
                </div>
              )}

              {/* tab === participated: PARTICIPATED CAMPAIGNS */}
              {viewMode === 'participated' && (
                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-4 sm:p-6 md:p-8 space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Lịch sử tham gia hoạt động</h3>
                  </div>

                  {myRegs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 bg-slate-50 border border-slate-100 rounded-2xl">
                      <span className="material-symbols-outlined text-4xl text-slate-300">volunteer_activism</span>
                      <p className="text-slate-500 font-semibold text-sm">Chưa có hoạt động tham gia nào.</p>
                      <a href="#/activities" className="text-[#006d37] hover:underline font-bold text-xs">Khám phá hoạt động ngay</a>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-100 rounded-xl">
                      <table className="w-full text-sm text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                            <th className="px-6 py-4">HOẠT ĐỘNG</th>
                            <th className="px-6 py-4">THỜI GIAN DIỄN RA</th>
                            <th className="px-6 py-4">TRẠNG THÁI DUYỆT</th>
                            <th className="px-6 py-4">KẾT QUẢ THAM GIA</th>
                            <th className="px-6 py-4">THAO TÁC</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {myRegs.map(reg => {
                            const act = activities.find(a => a._id === reg.activity_id);
                            if (!act) return null;
                            const dateObj = new Date(act.start_date);
                            const formattedDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
                            const statusConfig: Record<string, { label: string; class: string }> = {
                              'Pending': { label: 'Chờ duyệt', class: 'bg-amber-50 text-amber-800 border-amber-100/50' },
                              'Approved': { label: 'Đã duyệt', class: 'bg-emerald-50 text-[#006d37] border-emerald-100/50' },
                              'Rejected': { label: 'Từ chối', class: 'bg-rose-50 text-rose-800 border-rose-100/50' },
                              'Completed': { label: 'Completed', class: 'bg-slate-100 text-slate-600 border border-slate-200/50' },
                              'Absent': { label: 'Vắng mặt', class: 'bg-slate-100 text-slate-600 border-slate-200/50' },
                              'Cancelled': { label: 'Đã hủy', class: 'bg-slate-50 text-slate-500 border-slate-100/50' }
                            };
                            const badge = statusConfig[reg.status] || { label: reg.status, class: 'bg-slate-50 text-slate-600' };

                            let resultNode = <span className="text-slate-500 text-xs font-semibold">Chưa diễn ra</span>;
                            if (reg.status === 'Completed') {
                              resultNode = (
                                <span className="bg-emerald-50 text-[#006d37] border border-emerald-100/50 px-2.5 py-0.5 rounded-lg text-xs font-bold whitespace-nowrap">
                                  Có mặt
                                </span>
                              );
                            } else if (reg.status === 'Absent') {
                              resultNode = <span className="text-red-500 text-xs font-bold">Vắng mặt</span>;
                            } else if (reg.status === 'Cancelled') {
                              resultNode = <span className="text-slate-400 text-xs font-semibold">Đã hủy</span>;
                            }

                            return (
                              <tr key={reg._id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-800 max-w-[280px]">
                                  <a href={`#/activity/${act._id}`} className="text-[#006d37] hover:underline whitespace-normal break-words line-clamp-2 leading-relaxed">
                                    {act.title}
                                  </a>
                                </td>
                                <td className="px-6 py-4 text-xs font-semibold text-slate-500 whitespace-nowrap">{formattedDate}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold uppercase border ${badge.class}`}>
                                    {badge.label}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">{resultNode}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <a href={`#/activity/${act._id}`} className="text-xs font-bold text-[#006d37] hover:underline">Chi tiết →</a>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* tab === org_management: ORGANIZER MANAGEMENT */}
              {viewMode === 'org_management' && (
                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-4 sm:p-6 md:p-8 space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Quản lý tổ chức</h3>
                    <p className="text-slate-400 text-xs mt-1">Thông tin chiến dịch và hoạt động quản trị của đơn vị tổ chức.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
                      <h4 className="text-3xl font-extrabold text-[#006d37]">{orgActs.length}</h4>
                      <p className="text-slate-500 text-xs font-semibold mt-1">Tổng chiến dịch</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
                      <h4 className="text-3xl font-extrabold text-[#006d37]">{orgActs.filter(a => a.status === 'Open').length}</h4>
                      <p className="text-slate-500 text-xs font-semibold mt-1">Chiến dịch đang mở</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Danh sách chiến dịch đã tạo</h4>
                    {orgActs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center space-y-3 bg-slate-50 border border-slate-100 rounded-2xl">
                        <span className="material-symbols-outlined text-4xl text-slate-300">campaign</span>
                        <p className="text-slate-500 font-semibold text-sm">Chưa tạo chiến dịch nào.</p>
                        {isOwnProfile && (
                          <a href="#/organizer/dashboard" className="text-[#006d37] hover:underline font-bold text-xs">Tạo chiến dịch đầu tiên</a>
                        )}
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-slate-50">
                        {orgActs.map(act => {
                          const statusConfig: Record<string, { label: string; class: string }> = {
                            'Draft': { label: 'Bản nháp', class: 'bg-slate-100 text-slate-600' },
                            'Pending Review': { label: 'Chờ duyệt', class: 'bg-amber-100 text-amber-800' },
                            'Open': { label: 'Đang mở', class: 'bg-emerald-100 text-emerald-800' },
                            'Full': { label: 'Đã đầy', class: 'bg-teal-100 text-teal-800' },
                            'Ongoing': { label: 'Đang diễn ra', class: 'bg-blue-100 text-blue-800' },
                            'Completed': { label: 'Đã kết thúc', class: 'bg-[#bbcbbb] text-slate-700' },
                            'Rejected': { label: 'Từ chối', class: 'bg-rose-100 text-rose-800' },
                            'Cancelled': { label: 'Đã hủy', class: 'bg-slate-200 text-slate-700' }
                          };
                          const badge = statusConfig[act.status] || { label: act.status, class: 'bg-slate-100 text-slate-600' };

                          return (
                            <div key={act._id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-white transition-colors">
                              <div className="space-y-1 min-w-0">
                                <h5 className="font-bold text-sm text-slate-800 break-words">{act.title}</h5>
                                <p className="text-xs text-slate-500 font-medium">Bắt đầu: {new Date(act.start_date).toLocaleDateString('vi-VN')}</p>
                              </div>
                              <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
                                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${badge.class}`}>
                                  {badge.label}
                                </span>
                                <a href={`#/activity/${act._id}`} className="bg-white hover:bg-slate-50 border border-slate-200 text-[#006d37] font-bold px-3 py-1.5 rounded-lg text-[11px] transition-colors">Xem chi tiết</a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

          </div>
        ) : (
          /* PARTNER PROFILE VIEW (isOwnProfile === false) */
          <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl shadow-sm p-4 sm:p-6 md:p-8 flex flex-col md:flex-row gap-5 sm:gap-8 items-center md:items-start">
            {/* Avatar Column */}
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#006d37]/80 shrink-0 bg-slate-50 shadow-md">
              {displayUser.profile.avatar_url ? (
                <img
                  src={displayUser.profile.avatar_url}
                  alt="User Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <AvatarPlaceholder name={displayUser.profile.full_name || 'ND'} size={128} />
              )}
            </div>

            {/* Info Column */}
            <div className="flex-grow space-y-6 w-full text-center md:text-left">
              {/* Name & Role Badge */}
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-800 break-words">{displayUser.profile.full_name}</h2>
                  <span className="bg-[#e8f5e9] text-[#006d37] text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                    {displayUser.role === 'Volunteer' ? 'Tình nguyện viên' : (displayUser.role === 'Organizer' ? 'Ban tổ chức' : displayUser.role)}
                  </span>
                </div>
                <p className="text-slate-500 text-sm mt-1 font-semibold italic">
                  {displayUser.profile.bio || "Không có giới thiệu bản thân."}
                </p>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoItem
                  icon="mail"
                  iconColorClass="text-blue-600"
                  bgClass="bg-blue-50"
                  label="Địa chỉ Email"
                  value={displayUser.email || "Chưa cập nhật"}
                />
                <InfoItem
                  icon="call"
                  iconColorClass="text-emerald-600"
                  bgClass="bg-emerald-50"
                  label="Số điện thoại"
                  value={displayUser.phone || "Chưa cập nhật"}
                />
                <InfoItem
                  icon="location_on"
                  iconColorClass="text-rose-600"
                  bgClass="bg-rose-50"
                  label="Khu vực hoạt động"
                  value={displayUser.profile.area_of_interest || "TP. Hồ Chí Minh"}
                />
                <InfoItem
                  icon="cake"
                  iconColorClass="text-amber-600"
                  bgClass="bg-amber-50"
                  label="Tuổi"
                  value={displayUser.profile.age !== undefined && displayUser.profile.age !== null ? `${displayUser.profile.age} tuổi` : "Chưa cập nhật"}
                />
                <InfoItem
                  icon="wc"
                  iconColorClass="text-purple-600"
                  bgClass="bg-purple-50"
                  label="Giới tính"
                  value={displayUser.profile.gender || "Chưa cập nhật"}
                />
              </div>

              {/* Skills list */}
              {displayUser.profile.skills && displayUser.profile.skills.length > 0 && (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-2 text-left">
                  <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-wider">
                    <span className="material-symbols-outlined text-lg text-teal-600">psychology</span>
                    Kỹ năng nổi bật
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {displayUser.profile.skills.map((skill: string, index: number) => (
                      <span key={index} className="bg-teal-50 text-teal-800 border border-teal-100 px-3 py-1 rounded-lg text-xs font-semibold">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats Box */}
              <div className="bg-[#e8f5e9]/40 border border-[#006d37]/15 p-4 sm:p-5 rounded-2xl inline-flex items-start sm:items-center gap-4 text-left w-full sm:max-w-md">
                <div className="w-12 h-12 rounded-xl bg-[#e8f5e9] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#e3a008] text-2xl font-bold">star</span>
                </div>
                <div className="min-w-0">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Hoạt động cống hiến</span>
                  <span className="text-slate-800 text-sm font-bold block mt-0.5">
                    Đã tham gia <span className="text-[#006d37] text-base">{displayUser.profile.joined_activity_count || 0}</span> chiến dịch tình nguyện
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProfileView;
