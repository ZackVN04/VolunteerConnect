import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { mediaService } from '../services/apiService';

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
  // Backend fallback trả sai port localhost:3000, sửa về localhost:8000
  return url.replace('http://localhost:3000/', 'http://localhost:8000/');
};

const InfoItem: React.FC<{ 
  icon: string; 
  iconColorClass: string; 
  bgClass: string; 
  label: string; 
  value: React.ReactNode 
}> = ({ icon, iconColorClass, bgClass, label, value }) => (
  <div className="flex gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl items-center hover:shadow-sm transition-all duration-150">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgClass} shrink-0`}>
      <span className={`material-symbols-outlined text-lg ${iconColorClass}`}>{icon}</span>
    </div>
    <div className="space-y-0.5">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{label}</span>
      <span className="text-slate-800 text-sm font-semibold block">{value}</span>
    </div>
  </div>
);

export const ProfileView: React.FC = () => {
  const { currentUser, users, activities, registrations, organizerRequests, submitOrganizerRequest, updateProfile, showNotification, changePassword } = useApp();
  
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

  // Form states for Organizer Upgrade
  const [requestOrgName, setRequestOrgName] = useState('');
  const [requestOrgDesc, setRequestOrgDesc] = useState('');
  const [requestContact, setRequestContact] = useState(currentUser?.phone || '');

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
        setViewMode('upgrade');
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

  // Extract userId from window.location.hash
  const getUserIdFromHash = () => {
    const hash = window.location.hash;
    const match = hash.match(/[?&]userId=([^&]+)/);
    return match ? match[1] : null;
  };

  const viewedUserId = getUserIdFromHash();
  const isOwnProfile = !viewedUserId || viewedUserId === currentUser?._id;

  // Find user to display
  const displayUser = isOwnProfile ? currentUser : users.find(u => u._id === viewedUserId);

  const myRegs = registrations.filter(r => r.volunteer_id === displayUser?._id);
  const orgActs = activities.filter(a => a.organizer_id === displayUser?._id);


  // Update states if currentUser changes
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
      setRequestContact(currentUser.phone || '');
    }
  }, [currentUser, isOwnProfile]);

  if (!displayUser) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto text-left">
        <span className="material-symbols-outlined text-[#006d37] text-6xl">account_circle</span>
        <h2 className="font-headline-md text-xl font-bold text-on-surface">Không tìm thấy người dùng</h2>
        <p className="text-sm text-on-surface-variant">Tài khoản này có thể đã bị xóa hoặc đường dẫn không chính xác.</p>
        <a href="#/feed" className="inline-block bg-[#006d37] text-white px-6 py-2.5 rounded-xl font-semibold text-xs shadow-sm transition-all active:scale-95">
          Quay lại trang chủ
        </a>
      </div>
    );
  }

  // Retrieve current organizer request
  const userRequest = currentUser ? organizerRequests.find(r => r.volunteer_id === currentUser._id) : undefined;

  // Sync request states if already submitted
  const isPending = userRequest?.status === 'Pending';
  const isApproved = userRequest?.status === 'Approved';
  const isRejected = userRequest?.status === 'Rejected';

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
    const cleanPhone = phone.trim().replace(/[\s\-\(\)]/g, "");
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

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestOrgDesc.trim() || !requestOrgName.trim() || !requestContact.trim()) {
      showNotification('Vui lòng nhập đầy đủ thông tin yêu cầu.', 'error');
      return;
    }

    const res = submitOrganizerRequest(requestOrgDesc, requestOrgName, requestContact);
    const result = res instanceof Promise ? await res : res;
    if (result.success) {
      showNotification('Gửi yêu cầu nâng cấp tài khoản thành công!', 'success');
      setRequestOrgDesc('');
      setRequestOrgName('');
      setViewMode('details');
    } else {
      showNotification(result.error || 'Có lỗi xảy ra khi gửi yêu cầu', 'error');
    }
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

  const menuItems = [
    { id: 'details', label: 'Thông tin hồ sơ', icon: 'account_circle', hash: viewedUserId ? `#/profile?userId=${viewedUserId}` : '#/profile' },
    ...(displayUser?.role === 'Volunteer' ? [{ id: 'participated', label: 'Hoạt động tham gia', icon: 'volunteer_activism', hash: viewedUserId ? `#/profile?tab=participated&userId=${viewedUserId}` : '#/profile?tab=participated' }] : []),
    ...(displayUser?.role === 'Organizer' ? [{ id: 'org_management', label: 'Quản lý tổ chức', icon: 'corporate_fare', hash: viewedUserId ? `#/profile?tab=org_management&userId=${viewedUserId}` : '#/profile?tab=org_management' }] : []),
    ...(isOwnProfile ? [
      { id: 'edit', label: 'Chỉnh sửa thông tin', icon: 'edit_square', hash: '#/profile?tab=edit' },
      { id: 'password', label: 'Đổi mật khẩu', icon: 'lock', hash: '#/profile?tab=password' },
      ...(currentUser?.role === 'Volunteer' ? [{ id: 'upgrade', label: 'Nâng cấp Organizer', icon: 'verified_user', hash: '#/profile?tab=upgrade' }] : [])
    ] : [])
  ];

  const handleMenuClick = (item: typeof menuItems[0]) => {
    setViewMode(item.id as any);
    window.location.hash = item.hash;
  };

  return (
    <div className="w-full bg-[#f8f9fa] min-h-screen pb-16 text-left">
      <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-8 space-y-6">

        {/* Header Breadcrumbs and Navigation */}
        <div className="flex justify-between items-center border-b border-slate-200/60 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 font-headline-md">
              {isOwnProfile ? 'Hồ sơ tài khoản' : 'Hồ sơ đối tác'}
            </h1>
            <p className="text-slate-500 text-sm mt-1.5 font-medium">
              {isOwnProfile 
                ? 'Quản lý thông tin bảo mật, chỉnh sửa các chi tiết hồ sơ cá nhân và theo dõi hoạt động cộng đồng.' 
                : 'Thông tin liên hệ, giới thiệu và lịch sử cống hiến của thành viên.'
              }
            </p>
          </div>
          {!isOwnProfile && (
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 rounded-xl transition-all text-sm shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Quay lại
            </button>
          )}
        </div>

        {isOwnProfile ? (
          /* OWN PROFILE: SIDEBAR LAYOUT FOR SPARKING SPACE */
          <div className="grid grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: SIDEBAR CARD */}
            <div className="col-span-12 md:col-span-4 bg-white border border-slate-200/80 rounded-3xl shadow-sm p-6 space-y-6">
              
              {/* Profile Card Header */}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="relative group w-32 h-32 rounded-full overflow-hidden border-4 border-[#006d37]/80 shrink-0 bg-slate-50 shadow-md">
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
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{displayUser.profile.full_name}</h2>
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <span className="bg-[#e8f5e9] text-[#006d37] text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                      {displayUser.role === 'Volunteer' ? 'Tình nguyện viên' : (displayUser.role === 'Organizer' ? 'Ban tổ chức' : displayUser.role)}
                    </span>
                  </div>
                </div>
                <p className="text-slate-500 text-xs italic max-w-[240px] leading-relaxed">
                  {displayUser.profile.bio || "Không có giới thiệu bản thân."}
                </p>
              </div>

              {/* Sidebar Menu Navigation */}
              <nav className="flex flex-col gap-1.5 pt-4 border-t border-slate-100">
                {menuItems.map(item => {
                  const isActive = viewMode === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleMenuClick(item)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-[#e8f5e9] text-[#006d37] shadow-sm' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-lg ${isActive ? 'text-[#006d37]' : 'text-slate-400'}`}>
                        {item.icon}
                      </span>
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* RIGHT COLUMN: ACTIVE VIEW CARD */}
            <div className="col-span-12 md:col-span-8 space-y-6">
              
              {/* VIEW 1: PROFILE DETAILS VIEW */}
              {viewMode === 'details' && (
                <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm p-6 md:p-8 space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Thông tin chi tiết</h3>
                    <p className="text-slate-400 text-xs mt-1">Các thông tin cơ bản và lý lịch cá nhân được liên kết trên hệ thống.</p>
                  </div>

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
                      value={areaOfInterest || "Chưa cập nhật"} 
                    />
                    <InfoItem 
                      icon="cake" 
                      iconColorClass="text-amber-600" 
                      bgClass="bg-amber-50" 
                      label="Tuổi" 
                      value={age !== '' && age !== null && age !== undefined ? `${age} tuổi` : "Chưa cập nhật"} 
                    />
                    <InfoItem 
                      icon="wc" 
                      iconColorClass="text-purple-600" 
                      bgClass="bg-purple-50" 
                      label="Giới tính" 
                      value={gender || "Chưa cập nhật"} 
                    />
                  </div>

                  {/* Kỹ năng nổi bật */}
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-2 text-left">
                    <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-wider">
                      <span className="material-symbols-outlined text-lg text-teal-600">psychology</span>
                      Kỹ năng nổi bật
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {skillsStr ? (
                        skillsStr.split(',').map(s => s.trim()).filter(s => s.length > 0).map((skill, index) => (
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
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-2 text-left">
                    <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-wider">
                      <span className="material-symbols-outlined text-lg text-indigo-600">format_quote</span>
                      Giới thiệu bản thân
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed italic font-medium pt-1">
                      {bio ? `"${bio}"` : "Chưa có giới thiệu bản thân."}
                    </p>
                  </div>

                  {/* Stats Box */}
                  <div className="bg-[#e8f5e9]/40 border border-[#006d37]/15 p-5 rounded-2xl flex items-center gap-4 text-left">
                    <div className="w-12 h-12 rounded-xl bg-[#e8f5e9] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[#e3a008] text-2xl font-bold">star</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Thống kê cống hiến</span>
                      <span className="text-slate-800 text-sm font-bold block mt-0.5">
                        Đã tham gia <span className="text-[#006d37] text-base">{displayUser.profile.joined_activity_count || 0}</span> chiến dịch tình nguyện
                      </span>
                    </div>
                  </div>

                  {/* Organizer upgrade banner if Volunteer */}
                  {displayUser.role === 'Volunteer' && (userRequest ? (
                    <div className={`p-4 rounded-xl border text-sm text-left ${
                      isPending ? 'bg-[#fef7e0] border-[#b06000]/30 text-[#b06000]' :
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
                      </div>
                      <p className="mt-1 text-xs opacity-90">Gửi ngày: {new Date(userRequest.created_at).toLocaleDateString('vi-VN')}</p>
                      {userRequest.admin_feedback && (
                        <p className="mt-2.5 p-3 bg-white/60 border border-current/20 rounded-lg text-xs font-semibold leading-relaxed">
                          <strong>Phản hồi từ Admin:</strong> {userRequest.admin_feedback}
                        </p>
                      )}
                      {isRejected && (
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
                    <div className="bg-[#e8f5e9]/30 border border-[#006d37]/15 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4 text-left">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-800">Trở thành Nhà tổ chức (Organizer)</h4>
                        <p className="text-slate-500 text-xs leading-relaxed max-w-[420px]">
                          Bạn muốn tự đăng bài và quản lý chiến dịch cộng đồng của riêng mình? Đăng ký nâng cấp tài khoản ngay.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setViewMode('upgrade');
                          window.location.hash = '#/profile?tab=upgrade';
                        }}
                        className="bg-[#006d37] hover:bg-emerald-800 text-white font-bold px-4 py-2.5 rounded-xl transition-all text-xs shadow-sm whitespace-nowrap cursor-pointer shrink-0"
                      >
                        Đăng ký nâng quyền
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* VIEW: PARTICIPATED CAMPAIGNS */}
              {viewMode === 'participated' && (
                <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm p-6 md:p-8 space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Hoạt động đã tham gia</h3>
                    <p className="text-slate-400 text-xs mt-1">Danh sách các hoạt động xã hội bạn đã đăng ký tham gia hoặc cống hiến.</p>
                  </div>

                  {myRegs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 bg-slate-50 border border-slate-100 rounded-2xl">
                      <span className="material-symbols-outlined text-4xl text-slate-300">volunteer_activism</span>
                      <p className="text-slate-500 font-semibold text-sm">Chưa có hoạt động tham gia nào.</p>
                      <a href="#/activities" className="text-[#006d37] hover:underline font-bold text-xs">Khám phá hoạt động ngay</a>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {myRegs.map(reg => {
                        const act = activities.find(a => a._id === reg.activity_id);
                        if (!act) return null;
                        
                        const statusConfig: Record<string, { label: string; class: string }> = {
                          'Pending': { label: 'Đang chờ duyệt', class: 'bg-amber-50 text-amber-800 border-amber-100' },
                          'Approved': { label: 'Đã chấp nhận', class: 'bg-emerald-50 text-emerald-800 border-emerald-100' },
                          'Rejected': { label: 'Từ chối', class: 'bg-rose-50 text-rose-800 border-rose-100' },
                          'Completed': { label: 'Đã tham gia', class: 'bg-blue-50 text-blue-800 border-blue-100' },
                          'Absent': { label: 'Vắng mặt', class: 'bg-slate-100 text-slate-600 border-slate-200' },
                          'Cancelled': { label: 'Đã hủy', class: 'bg-slate-50 text-slate-500 border-slate-100' }
                        };
                        const badge = statusConfig[reg.status] || { label: reg.status, class: 'bg-slate-50 text-slate-600 border-slate-200' };

                        return (
                          <div key={reg._id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition-all">
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <span className="bg-[#e8f5e9] text-[#006d37] font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                  {act.categories[0] || 'Tình nguyện'}
                                </span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase border ${badge.class}`}>
                                  {badge.label}
                                </span>
                              </div>
                              <h4 className="font-bold text-slate-800 line-clamp-1 text-sm">{act.title}</h4>
                              <div className="space-y-1.5 text-xs text-slate-500 font-semibold">
                                <div className="flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-sm">calendar_month</span>
                                  <span>{new Date(act.start_date).toLocaleDateString('vi-VN')}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-sm">location_on</span>
                                  <span className="line-clamp-1">{act.location.province}</span>
                                </div>
                              </div>
                            </div>
                            <a 
                              href={`#/activity/${act._id}`} 
                              className="mt-4 text-center bg-white hover:bg-slate-100 border border-slate-200 text-[#006d37] font-bold py-2 rounded-xl text-xs transition-colors block shadow-sm"
                            >
                              Chi tiết hoạt động
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* VIEW: ORGANIZER MANAGEMENT */}
              {viewMode === 'org_management' && (
                <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm p-6 md:p-8 space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Quản lý tổ chức</h3>
                    <p className="text-slate-400 text-xs mt-1">Thông tin chiến dịch và hoạt động quản trị của đơn vị tổ chức.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                      <h4 className="text-3xl font-extrabold text-[#006d37]">{orgActs.length}</h4>
                      <p className="text-slate-500 text-xs font-semibold mt-1">Tổng chiến dịch</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                      <h4 className="text-3xl font-extrabold text-[#006d37]">
                        {orgActs.filter(a => a.status === 'Open').length}
                      </h4>
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
                      <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-slate-50">
                        {orgActs.map(act => {
                          const statusConfig: Record<string, { label: string; class: string }> = {
                            'Draft': { label: 'Bản nháp', class: 'bg-slate-100 text-slate-600' },
                            'Pending Review': { label: 'Chờ duyệt', class: 'bg-amber-100 text-amber-800' },
                            'Open': { label: 'Đang mở', class: 'bg-emerald-100 text-emerald-800' },
                            'Full': { label: 'Đã đầy', class: 'bg-teal-100 text-teal-800' },
                            'Ongoing': { label: 'Đang diễn ra', class: 'bg-blue-100 text-blue-800' },
                            'Completed': { label: 'Đã kết thúc', class: 'bg-purple-100 text-purple-800' },
                            'Rejected': { label: 'Từ chối', class: 'bg-rose-100 text-rose-800' },
                            'Cancelled': { label: 'Đã hủy', class: 'bg-slate-200 text-slate-700' }
                          };
                          const badge = statusConfig[act.status] || { label: act.status, class: 'bg-slate-100 text-slate-600' };

                          return (
                            <div key={act._id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-white transition-colors">
                              <div className="space-y-1">
                                <h5 className="font-bold text-sm text-slate-800">{act.title}</h5>
                                <p className="text-xs text-slate-500 font-medium">Bắt đầu: {new Date(act.start_date).toLocaleDateString('vi-VN')}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${badge.class}`}>
                                  {badge.label}
                                </span>
                                <a 
                                  href={`#/activity/${act._id}`} 
                                  className="bg-white hover:bg-slate-50 border border-slate-200 text-[#006d37] font-bold px-3 py-1.5 rounded-lg text-[11px] transition-colors"
                                >
                                  Xem chi tiết
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* VIEW 2: EDIT PROFILE FORM */}
              {viewMode === 'edit' && (
                <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm p-6 md:p-8 space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Cập nhật thông tin cá nhân</h3>
                    <p className="text-slate-400 text-xs mt-1">Thay đổi họ tên, số điện thoại liên lạc, giới tính và khu vực hoạt động.</p>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-5 text-left">
                    {/* Họ và tên */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Họ và tên</label>
                      <input 
                        type="text" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        placeholder="Nguyễn Văn A"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-2 focus:ring-[#006d37]/20 text-sm font-semibold text-slate-800 bg-white transition-all shadow-sm"
                      />
                    </div>

                    {/* Email & Phone Row */}
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
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-2 focus:ring-[#006d37]/20 text-sm font-semibold text-slate-800 bg-white transition-all shadow-sm"
                        />
                      </div>
                    </div>

                    {/* Area, Age, and Gender in one 3-Column Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Khu vực hoạt động</label>
                        <select
                          value={areaOfInterest}
                          onChange={(e) => setAreaOfInterest(e.target.value)}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-2 focus:ring-[#006d37]/20 text-sm font-semibold text-slate-800 bg-white transition-all shadow-sm cursor-pointer"
                        >
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
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-2 focus:ring-[#006d37]/20 text-sm font-semibold text-slate-800 bg-white transition-all shadow-sm"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Giới tính</label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-2 focus:ring-[#006d37]/20 text-sm font-semibold text-slate-800 bg-white transition-all shadow-sm cursor-pointer"
                        >
                          <option value="">Chưa chọn</option>
                          <option value="Nam">Nam</option>
                          <option value="Nữ">Nữ</option>
                          <option value="Khác">Khác</option>
                        </select>
                      </div>
                    </div>

                    {/* Kỹ năng nổi bật */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kỹ năng nổi bật (Cách nhau bằng dấu phẩy)</label>
                      <input 
                        type="text" 
                        value={skillsStr}
                        onChange={(e) => setSkillsStr(e.target.value)}
                        placeholder="Giao tiếp tiếng Anh, Dạy học, Vẽ tranh"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-2 focus:ring-[#006d37]/20 text-sm font-semibold text-slate-800 bg-white transition-all shadow-sm"
                      />
                    </div>

                    {/* Giới thiệu bản thân */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Giới thiệu bản thân</label>
                      <textarea 
                        rows={3}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Nhập một vài dòng giới thiệu ngắn về bản thân..."
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-2 focus:ring-[#006d37]/20 text-sm font-semibold text-slate-800 bg-white transition-all shadow-sm"
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                      <button 
                        type="button" 
                        onClick={handleCancelEdit}
                        className="px-5 py-2.5 border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-colors text-sm font-bold cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button 
                        type="submit"
                        className="px-5 py-2.5 bg-[#006d37] hover:bg-emerald-800 text-white rounded-xl transition-colors text-sm font-bold shadow-sm cursor-pointer"
                      >
                        Lưu thay đổi
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* VIEW 3: ORGANIZER UPGRADE REQUEST FORM */}
              {viewMode === 'upgrade' && (
                <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm p-6 md:p-8 space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Đăng ký tài khoản Organizer</h3>
                    <p className="text-slate-400 text-xs mt-1">Cung cấp lý lịch hoạt động để Admin kiểm duyệt vai trò nhà tổ chức chiến dịch.</p>
                  </div>

                  <form onSubmit={handleSendRequest} className="space-y-5 text-left">
                    {/* SĐT liên hệ */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Số điện thoại liên hệ khẩn cấp</label>
                      <input 
                        type="text" 
                        value={requestContact}
                        onChange={(e) => setRequestContact(e.target.value)}
                        required
                        placeholder="Nhập số điện thoại..."
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-2 focus:ring-[#006d37]/20 text-sm font-semibold text-slate-800 bg-white transition-all shadow-sm"
                      />
                    </div>

                    {/* Kinh nghiệm hoạt động */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kinh nghiệm hoạt động / Tổ chức đại diện</label>
                      <textarea 
                        rows={3}
                        value={requestOrgName}
                        onChange={(e) => setRequestOrgName(e.target.value)}
                        required
                        placeholder="Mô tả kinh nghiệm tình nguyện của bạn hoặc ghi tên câu lạc bộ/đội nhóm bạn làm đại diện..."
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-2 focus:ring-[#006d37]/20 text-sm font-semibold text-slate-800 bg-white transition-all shadow-sm"
                      />
                    </div>

                    {/* Lý do muốn nâng quyền */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mục đích/Lý do nâng cấp quyền tổ chức</label>
                      <textarea 
                        rows={3}
                        value={requestOrgDesc}
                        onChange={(e) => setRequestOrgDesc(e.target.value)}
                        required
                        placeholder="Lý do và kế hoạch các hoạt động tình nguyện bạn dự định tạo lập trên hệ thống..."
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-2 focus:ring-[#006d37]/20 text-sm font-semibold text-slate-800 bg-white transition-all shadow-sm"
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                      <button 
                        type="button" 
                        onClick={() => setViewMode('details')}
                        className="px-5 py-2.5 border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-colors text-sm font-bold cursor-pointer"
                      >
                        Hủy bỏ
                      </button>
                      <button 
                        type="submit"
                        className="px-5 py-2.5 bg-[#006d37] hover:bg-emerald-800 text-white rounded-xl transition-colors text-sm font-bold shadow-sm cursor-pointer"
                      >
                        Gửi yêu cầu duyệt
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* VIEW 4: CHANGE PASSWORD */}
              {viewMode === 'password' && (
                <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm p-6 md:p-8 space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Thay đổi mật khẩu</h3>
                    <p className="text-slate-400 text-xs mt-1">Cập nhật mật khẩu định kỳ để nâng cao bảo mật tài khoản cá nhân.</p>
                  </div>

                  <form onSubmit={handleChangePassword} className="space-y-5 text-left">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mật khẩu hiện tại</label>
                      <div className="relative">
                        <input 
                          type={showOldPassword ? "text" : "password"} 
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          required
                          placeholder="••••••••"
                          className="w-full pl-4 pr-12 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-2 focus:ring-[#006d37]/20 text-sm font-semibold text-slate-800 bg-white transition-all shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOldPassword(!showOldPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center p-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {showOldPassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mật khẩu mới (Tối thiểu 6 ký tự)</label>
                      <div className="relative">
                        <input 
                          type={showNewPassword ? "text" : "password"} 
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          placeholder="••••••••"
                          className="w-full pl-4 pr-12 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-2 focus:ring-[#006d37]/20 text-sm font-semibold text-slate-800 bg-white transition-all shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center p-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {showNewPassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Xác nhận mật khẩu mới</label>
                      <div className="relative">
                        <input 
                          type={showConfirmPassword ? "text" : "password"} 
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          required
                          placeholder="••••••••"
                          className="w-full pl-4 pr-12 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-2 focus:ring-[#006d37]/20 text-sm font-semibold text-slate-800 bg-white transition-all shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center p-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {showConfirmPassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                      <button 
                        type="button" 
                        onClick={() => setViewMode('details')}
                        className="px-5 py-2.5 border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-colors text-sm font-bold cursor-pointer"
                      >
                        Hủy bỏ
                      </button>
                      <button 
                        type="submit"
                        disabled={passwordLoading}
                        className="px-5 py-2.5 bg-[#006d37] hover:bg-emerald-800 text-white rounded-xl transition-colors text-sm font-bold shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        {passwordLoading ? 'Đang thực hiện...' : 'Cập nhật mật khẩu'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

            </div>

          </div>
        ) : (
          /* PARTNER PROFILE VIEW (isOwnProfile === false) */
          <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center md:items-start">
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
                  <h2 className="text-2xl font-bold text-slate-800">{displayUser.profile.full_name}</h2>
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
                    {displayUser.profile.skills.map((skill, index) => (
                      <span key={index} className="bg-teal-50 text-teal-800 border border-teal-100 px-3 py-1 rounded-lg text-xs font-semibold">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats Box */}
              <div className="bg-[#e8f5e9]/40 border border-[#006d37]/15 p-5 rounded-2xl inline-flex items-center gap-4 text-left w-full sm:max-w-md">
                <div className="w-12 h-12 rounded-xl bg-[#e8f5e9] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#e3a008] text-2xl font-bold">star</span>
                </div>
                <div>
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
