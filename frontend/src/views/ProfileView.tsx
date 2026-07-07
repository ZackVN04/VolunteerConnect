import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export const ProfileView: React.FC = () => {
  const { currentUser, organizerRequests, submitOrganizerRequest, updateProfile, showNotification } = useApp();
  
  // View mode state: 'details' (default), 'edit', 'upgrade'
  const [viewMode, setViewMode] = useState<'details' | 'edit' | 'upgrade'>('details');

  // Form states for Edit Profile
  const [fullName, setFullName] = useState(currentUser?.profile.full_name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [areaOfInterest, setAreaOfInterest] = useState(currentUser?.profile.area_of_interest || 'TP. Hồ Chí Minh');
  const [skillsStr, setSkillsStr] = useState(currentUser?.profile.skills?.join(', ') || '');
  const [bio, setBio] = useState(currentUser?.profile.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.profile.avatar_url || '');

  // Form states for Organizer Upgrade
  const [requestOrgName, setRequestOrgName] = useState('');
  const [requestOrgDesc, setRequestOrgDesc] = useState('');
  const [requestContact, setRequestContact] = useState(currentUser?.phone || '');

  // Sync state if URL specifies a tab
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.includes('tab=upgrade')) {
        setViewMode('upgrade');
      } else if (hash.includes('tab=edit')) {
        setViewMode('edit');
      } else {
        setViewMode('details');
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Update states if currentUser changes
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.profile.full_name || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
      setAreaOfInterest(currentUser.profile.area_of_interest || 'TP. Hồ Chí Minh');
      setSkillsStr(currentUser.profile.skills?.join(', ') || '');
      setBio(currentUser.profile.bio || '');
      setAvatarUrl(currentUser.profile.avatar_url || '');
      setRequestContact(currentUser.phone || '');
    }
  }, [currentUser]);

  if (!currentUser) return null;

  // Retrieve current organizer request
  const userRequest = organizerRequests.find(r => r.volunteer_id === currentUser._id);

  // Sync request states if already submitted
  const isPending = userRequest?.status === 'Pending';
  const isApproved = userRequest?.status === 'Approved';
  const isRejected = userRequest?.status === 'Rejected';

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const skills = skillsStr
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    updateProfile(
      { 
        full_name: fullName, 
        skills, 
        bio,
        avatar_url: avatarUrl
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
    setFullName(currentUser.profile.full_name || '');
    setEmail(currentUser.email || '');
    setPhone(currentUser.phone || '');
    setAreaOfInterest(currentUser.profile.area_of_interest || 'TP. Hồ Chí Minh');
    setSkillsStr(currentUser.profile.skills?.join(', ') || '');
    setBio(currentUser.profile.bio || '');
    setAvatarUrl(currentUser.profile.avatar_url || '');
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

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showNotification('File ảnh quá lớn! Vui lòng chọn ảnh có dung lượng dưới 2MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setAvatarUrl(base64);
      updateProfile(
        { 
          avatar_url: base64,
          full_name: currentUser.profile.full_name,
          skills: currentUser.profile.skills,
          bio: currentUser.profile.bio
        }, 
        currentUser.email || '', 
        currentUser.profile.area_of_interest || '',
        phone
      );
      showNotification('Đã cập nhật ảnh đại diện mới!', 'success');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full bg-[#f8f9fa] min-h-screen pb-16 text-left">
      <div className="max-w-[800px] mx-auto px-4 md:px-8 py-8 space-y-6">

        {/* ------------------------------------------- */}
        {/* VIEW 1: PROFILE DETAILS VIEW (DEFAULT) */}
        {viewMode === 'details' && (
          <div className="space-y-6">
            
            {/* Header section with Edit Button */}
            <div className="flex justify-between items-start gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-on-surface font-headline-md">
                  Hồ sơ cá nhân
                </h1>
                <p className="text-on-surface-variant text-sm mt-1.5 font-semibold">
                  Quản lý thông tin tài khoản và xem lịch sử tích lũy hoạt động xã hội
                </p>
              </div>
              <button
                onClick={() => {
                  setViewMode('edit');
                  window.location.hash = '#/profile?tab=edit';
                }}
                className="border border-[#006d37] hover:bg-emerald-50 text-[#006d37] font-bold px-6 py-2.5 rounded-xl transition-all text-sm shadow-sm shrink-0"
              >
                Chỉnh sửa hồ sơ
              </button>
            </div>

            {/* Profile Info Card */}
            <div className="bg-white border border-surface-variant/40 rounded-3xl shadow-sm p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center md:items-start">
              
              {/* Left Column: Avatar image with upload trigger */}
              <div className="relative group w-36 h-36 rounded-full overflow-hidden border-4 border-[#006d37]/80 shrink-0 bg-slate-50 cursor-pointer">
                <img 
                  src={avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&h=250&q=80"} 
                  alt="User Avatar" 
                  className="w-full h-full object-cover"
                />
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

              {/* Right Column: User details list */}
              <div className="flex-grow space-y-6 w-full text-center md:text-left">
                
                {/* Name & Badge */}
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <h2 className="text-2xl font-bold text-on-surface">{currentUser.profile.full_name}</h2>
                    <span className="bg-[#e8f5e9] text-[#006d37] text-xs px-3 py-1 rounded-full font-bold uppercase">
                      {currentUser.role === 'Volunteer' ? 'Tình nguyện viên' : currentUser.role}
                    </span>
                  </div>
                  <p className="text-on-surface-variant text-sm mt-1 font-semibold italic text-slate-500">
                    {bio || "Không có giới thiệu bản thân."}
                  </p>
                </div>

                {/* 2-Column Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm text-left">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">Địa chỉ Email</span>
                    <span className="text-on-surface font-semibold block break-all">{currentUser.email || "Chưa cập nhật"}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">Số điện thoại</span>
                    <span className="text-on-surface font-semibold block">{currentUser.phone || "Chưa cập nhật"}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">Khu vực hoạt động</span>
                    <span className="text-on-surface font-semibold block">{areaOfInterest || "TP. Hồ Chí Minh"}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">Kỹ năng nổi bật</span>
                    <span className="text-on-surface font-semibold block">{skillsStr || "Chưa cập nhật kỹ năng"}</span>
                  </div>
                </div>

                {/* Stats highlight box */}
                <div className="inline-flex items-center gap-3 bg-[#e8f5e9]/40 border border-[#006d37]/10 p-4 rounded-2xl w-full max-w-[320px] text-left">
                  <span className="material-symbols-outlined text-[#e3a008] text-3xl font-bold">star</span>
                  <div>
                    <span className="text-xs text-on-surface-variant font-bold block">Số hoạt động đã tham gia</span>
                    <span className="text-lg font-bold text-[#006d37]">{currentUser.profile.joined_activity_count || 0} hoạt động</span>
                  </div>
                </div>

              </div>

            </div>

            {/* Request upgrade panel or request status */}
            {currentUser.role === 'Volunteer' && (
              userRequest ? (
                /* Display upgrade request status if already submitted */
                <div className="bg-white border border-surface-variant/40 rounded-3xl p-6 md:p-8 space-y-4">
                  <div className={`p-4 rounded-xl border text-sm ${
                    isPending ? 'bg-[#fef7e0] border-[#b06000]/30 text-[#b06000]' :
                    isApproved ? 'bg-[#e8f5e9] border-[#006d37]/30 text-[#006d37]' :
                    'bg-red-50 border-red-200 text-red-700'
                  }`}>
                    <div className="font-bold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-lg">
                        {isPending ? 'hourglass_empty' : isApproved ? 'verified' : 'cancel'}
                      </span>
                      Trạng thái yêu cầu nâng quyền: {
                        isPending ? 'Đang chờ duyệt' :
                        isApproved ? 'Đã duyệt thành công' : 'Bị từ chối'
                      }
                    </div>
                    <p className="mt-2 text-xs opacity-90">Ngày gửi: {new Date(userRequest.created_at).toLocaleDateString('vi-VN')}</p>
                    
                    {userRequest.admin_feedback && (
                      <p className="mt-3 p-3 bg-white/60 border border-current/20 rounded-lg text-xs leading-relaxed font-semibold">
                        <strong>Lý do phản hồi:</strong> {userRequest.admin_feedback}
                      </p>
                    )}
                  </div>

                  {isRejected && (
                    <button
                      onClick={() => setViewMode('upgrade')}
                      className="w-full bg-[#006d37] hover:bg-emerald-800 text-white py-3 rounded-xl font-bold text-sm shadow transition-all"
                    >
                      Gửi lại yêu cầu nâng quyền khác
                    </button>
                  )}
                </div>
              ) : (
                /* Bottom Upgrade Banner matching figma design card */
                <div className="bg-[#e8f5e9]/30 border border-[#006d37]/20 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-on-surface">Trở thành Nhà tổ chức hoạt động</h3>
                    <p className="text-on-surface-variant text-sm leading-relaxed max-w-[500px]">
                      Bạn là đại diện câu lạc bộ, doanh nghiệp xã hội hoặc mong muốn tự tổ chức hoạt động vì cộng đồng? Hãy nâng cấp tài khoản lên vai trò Organizer.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setViewMode('upgrade');
                      window.location.hash = '#/profile?tab=upgrade';
                    }}
                    className="bg-[#006d37] hover:bg-emerald-800 text-white font-bold px-6 py-3 rounded-xl transition-all text-sm shadow-sm whitespace-nowrap"
                  >
                    Yêu cầu nâng cấp &rarr;
                  </button>
                </div>
              )
            )}

          </div>
        )}

        {/* ------------------------------------------- */}
        {/* VIEW 2: EDIT PROFILE FORM */}
        {viewMode === 'edit' && (
          <div className="space-y-4">
            {/* Top link navigation */}
            <button
              onClick={handleCancelEdit}
              className="text-[#006d37] hover:underline font-bold text-sm flex items-center gap-1"
            >
              &larr; Hủy & Quay lại hồ sơ
            </button>

            {/* Edit Card Form */}
            <div className="bg-white border border-surface-variant/40 rounded-3xl shadow-sm p-6 md:p-8">
              <h2 className="text-2xl font-bold text-on-surface mb-6">
                Cập nhật thông tin cá nhân
              </h2>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                {/* Họ và tên */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Họ và tên</label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Lê Minh Thư"
                    className="w-full px-4 py-2.5 border border-surface-variant rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-1 focus:ring-[#006d37] text-sm"
                  />
                </div>

                {/* Email & Phone Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Địa chỉ Email</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="minhthu.le@gmail.com"
                      className="w-full px-4 py-2.5 border border-surface-variant rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-1 focus:ring-[#006d37] text-sm"
                    />
                  </div>
                  
                  {/* Phone input without country code prefix box */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Số điện thoại</label>
                    <input 
                      type="text" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      placeholder="Nhập số điện thoại..."
                      className="w-full px-4 py-2.5 border border-surface-variant rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-1 focus:ring-[#006d37] text-sm"
                    />
                  </div>
                </div>

                {/* Area of Interest & Skills Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Khu vực hoạt động</label>
                    <select
                      value={areaOfInterest}
                      onChange={(e) => setAreaOfInterest(e.target.value)}
                      className="w-full px-4 py-2.5 border border-surface-variant rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-1 focus:ring-[#006d37] text-sm bg-white cursor-pointer"
                    >
                      <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                      <option value="Hà Nội">Hà Nội</option>
                      <option value="Đà Nẵng">Đà Nẵng</option>
                      <option value="Cần Thơ">Cần Thơ</option>
                      <option value="Hải Phòng">Hải Phòng</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Kỹ năng nổi bật</label>
                    <input 
                      type="text" 
                      value={skillsStr}
                      onChange={(e) => setSkillsStr(e.target.value)}
                      placeholder="Giao tiếp tiếng Anh, Dạy học, Vẽ tranh"
                      className="w-full px-4 py-2.5 border border-surface-variant rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-1 focus:ring-[#006d37] text-sm"
                    />
                  </div>
                </div>

                {/* Bio Description */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Giới thiệu ngắn bản thân</label>
                  <textarea 
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Sinh viên Đại học Sư Phạm TP.HCM, đam mê các hoạt động giáo dục trẻ em."
                    className="w-full px-4 py-2.5 border border-surface-variant rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-1 focus:ring-[#006d37] text-sm"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4 border-t border-surface-variant/40 pt-6">
                  <button 
                    type="button" 
                    onClick={handleCancelEdit}
                    className="px-6 py-2.5 border border-surface-variant text-on-surface-variant rounded-xl hover:bg-slate-50 transition-colors text-sm font-semibold"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2.5 bg-[#006d37] hover:bg-emerald-800 text-white rounded-xl transition-colors text-sm font-bold shadow-sm"
                  >
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ------------------------------------------- */}
        {/* VIEW 3: ORGANIZER UPGRADE REQUEST */}
        {viewMode === 'upgrade' && (
          <div className="space-y-4">
            {/* Top link navigation */}
            <button
              onClick={() => setViewMode('details')}
              className="text-[#006d37] hover:underline font-bold text-sm flex items-center gap-1"
            >
              &larr; Hủy & Quay lại hồ sơ
            </button>

            {/* Upgrade Request Card */}
            <div className="bg-white border border-surface-variant/40 rounded-3xl shadow-sm p-6 md:p-8">
              <span className="text-xs text-on-surface-variant block font-semibold mb-2">Hồ sơ cá nhân &gt; Xin quyền tổ chức</span>
              <h2 className="text-2xl font-bold text-on-surface mb-2">
                Đăng ký quyền Ban tổ chức (Organizer)
              </h2>
              <p className="text-on-surface-variant text-sm leading-relaxed mb-6 font-semibold">
                Vui lòng cung cấp đầy đủ thông tin để Ban quản trị (Admin) kiểm duyệt năng lực tổ chức của bạn. Sau khi phê duyệt, vai trò tài khoản của bạn sẽ đổi thành Organizer và mở khóa chức năng tự tạo hoạt động.
              </p>

              <form onSubmit={handleSendRequest} className="space-y-6">
                
                {/* Emergency Contact Phone input */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Số điện thoại liên hệ khẩn cấp</label>
                  <input 
                    type="text" 
                    value={requestContact}
                    onChange={(e) => setRequestContact(e.target.value)}
                    required
                    placeholder="Nhập số điện thoại..."
                    className="w-full px-4 py-2.5 border border-surface-variant rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-1 focus:ring-[#006d37] text-sm"
                  />
                </div>

                {/* Kinh nghiệm hoạt động */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Kinh nghiệm hoạt động / Tên tổ chức đại diện</label>
                  <textarea 
                    rows={4}
                    value={requestOrgName}
                    onChange={(e) => setRequestOrgName(e.target.value)}
                    required
                    placeholder="Nêu rõ kinh nghiệm làm tình nguyện của bạn hoặc ghi tên câu lạc bộ/nhóm tình nguyện mà bạn đang đại diện..."
                    className="w-full px-4 py-2.5 border border-surface-variant rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-1 focus:ring-[#006d37] text-sm"
                  />
                </div>

                {/* Lý do muốn trở thành nhà tổ chức */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Lý do muốn trở thành Nhà tổ chức</label>
                  <textarea 
                    rows={4}
                    value={requestOrgDesc}
                    onChange={(e) => setRequestOrgDesc(e.target.value)}
                    required
                    placeholder="Chia sẻ mục đích của bạn (ví dụ: Muốn tổ chức gom pin cũ định kỳ hàng tuần, Muốn liên kết các bữa ăn thiện nguyện tại các mái ấm...)"
                    className="w-full px-4 py-2.5 border border-surface-variant rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-1 focus:ring-[#006d37] text-sm"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4 border-t border-surface-variant/40 pt-6">
                  <button 
                    type="button"
                    onClick={() => setViewMode('details')}
                    className="px-6 py-2.5 border border-surface-variant text-on-surface-variant rounded-xl hover:bg-slate-50 transition-colors text-sm font-semibold"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2.5 bg-[#006d37] hover:bg-emerald-800 text-white rounded-xl transition-colors text-sm font-bold shadow-sm"
                  >
                    Gửi yêu cầu duyệt
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProfileView;
