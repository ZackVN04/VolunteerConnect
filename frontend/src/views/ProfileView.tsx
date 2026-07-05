import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const ProfileView: React.FC = () => {
  const { currentUser, registrations, organizerRequests, submitOrganizerRequest, updateProfile } = useApp();
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(currentUser?.profile.bio || '');
  const isVirtualEmail = currentUser?.email?.endsWith('@volunteerconnect.com') || false;
  const [email, setEmail] = useState(isVirtualEmail ? '' : (currentUser?.email || ''));
  const [province, setProvince] = useState(currentUser?.profile.area_of_interest || '');
  const [skillsStr, setSkillsStr] = useState(currentUser?.profile.skills.join(', ') || '');
  const [fullName, setFullName] = useState(currentUser?.profile.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.profile.avatar_url || '');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Dung lượng ảnh phải nhỏ hơn 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Organizer request modal state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestReason, setRequestReason] = useState('');
  const [requestExp, setRequestExp] = useState('');
  const [requestPhone, setRequestPhone] = useState(currentUser?.phone || '');

  if (!currentUser) return null;

  // Filter completed registrations
  const completedRegs = registrations.filter(
    r => r.volunteer_id === currentUser._id && r.status === 'Completed'
  );

  // Get current organizer request status
  const userRequest = organizerRequests.find(r => r.volunteer_id === currentUser._id);

  const handleSaveProfile = () => {
    const skills = skillsStr
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    updateProfile({ bio, skills, full_name: fullName, avatar_url: avatarUrl }, email, province);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setBio(currentUser.profile.bio || '');
    setEmail(isVirtualEmail ? '' : (currentUser.email || ''));
    setProvince(currentUser.profile.area_of_interest || '');
    setSkillsStr(currentUser.profile.skills.join(', '));
    setFullName(currentUser.profile.full_name || '');
    setAvatarUrl(currentUser.profile.avatar_url || '');
    setIsEditing(false);
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestReason.trim() || !requestPhone.trim()) return;

    const res = submitOrganizerRequest(requestReason, requestExp, requestPhone);
    const result = res instanceof Promise ? await res : res;
    if (result.success) {
      setShowRequestModal(false);
      setRequestReason('');
      setRequestExp('');
    } else {
      alert(result.error || 'Có lỗi xảy ra khi gửi yêu cầu');
    }
  };

  return (
    <div className="flex-grow w-full max-w-[1280px] mx-auto px-4 md:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-gutter text-left">
      {/* Left Column: Profile Card & Actions */}
      <section className="lg:col-span-4 flex flex-col gap-md">
        
        {/* Profile Card */}
        <div className="bg-surface-container-lowest rounded-lg p-6 border border-surface-variant shadow-sm flex flex-col items-center text-center">
          {!isEditing && (
            <div className="w-full flex justify-end mb-2">
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 text-primary font-label-sm text-sm hover:bg-primary-container/20 px-2.5 py-1 rounded-md transition-colors font-bold"
              >
                <span className="material-symbols-outlined text-sm">edit</span> Chỉnh sửa
              </button>
            </div>
          )}

          <div className="relative mb-4">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-surface-bright shadow-sm bg-surface-container-high flex items-center justify-center relative group">
              <img 
                className="w-full h-full object-cover" 
                src={
                  isEditing 
                    ? (avatarUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCqR7c6MmYIK026t2CIKgJdzN-HVXJHuqj92skuH6GsQRsHvMxbEHHfJw4SZzJn1z7ycOuw65ul7NnXNvhBxovjiMraR3LbRNHHR4d6HmA29IW3oVGYPNSaG5QPYI0VCqShoV70UAg15BkVDPICUKrC5a1D4OhhpawjfyMo1BFfKacEJXqW3UQYfZvAq2O0roU323LKHahR9UoY_5rWFImGEoXmFIcsACP6G1q73EUHh8hTMmhtEEtQ8A')
                    : (currentUser.profile.avatar_url ||
                       (currentUser._id === 'user_vol_a_002' ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuB_PQBoM34v-KHc_RgV_5yx56GMnqxDEhWKCFYBFHs2DD_v0AfXxYHUzf2X3lHHgAe2vyMGRQql2_ip1v1PHVYhvFyoXhPynpBV2nxiOGxa8e8ofteEH-zmu0GxXB6A8jodf8hDo5WAuXJJrmVLLOR1IjbvdDXwj0qbFpahbPlbl0ck9hpAKNzpXmdr75nvpBMMDMs4UZOVhWf1sVfevY5pMBzIvjY41MIz8mTplH5pZ7hrKQrRtevMrQ' :
                        currentUser._id === 'user_org_b_003' ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkQYvd65g9k6JOGizWiwW69fSLpWWr-F9ZrbB9rVITYy_HR6LpTrryKx45BWMirCv1Bl458Rn7xSD7iNoQiH2qr1i-zXYYpEOVAhyzlwAiSWYaeDSajjvTk79HCfIoD2bKu6PP-Ni7Rl8dNUcyusGXtwrW_leJf2pHSMyVYQ7GGycn96gK0LnhC85StwbzmSLfjRVsPGdPZvSyywYXC6R-9TA5TRIQ_rODyBNU7NlmuV4LUv8M9-3XUw' :
                        currentUser._id === 'user_admin_001' ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuCYcsfThBjqJ3O_WR02laZ868Vy0rbWRrqdcH5bE3iJVWcOgHMoh3CsowraUnMiJ6A8cGSGFjyuG_USGZmPk9q36M_dwSakgzQkp_8IfSXGp7yLav94zAH16CEYFw3LDkyEtm7yzOYC78AETUOiDy0IlPDic3zG1k8vpFwuKZ9138GaZWz-wC0CRMWAolLdDQkliuxw0LYkcJqLf-shkA2mNmKjWWYkkobzu4FtFN95KYT-bCJPwGNXzw' :
                        'https://lh3.googleusercontent.com/aida-public/AB6AXuCqR7c6MmYIK026t2CIKgJdzN-HVXJHuqj92skuH6GsQRsHvMxbEHHfJw4SZzJn1z7ycOuw65ul7NnXNvhBxovjiMraR3LbRNHHR4d6HmA29IW3oVGYPNSaG5QPYI0VCqShoV70UAg15BkVDPICUKrC5a1D4OhhpawjfyMo1BFfKacEJXqW3UQYfZvAq2O0roU323LKHahR9UoY_5rWFImGEoXmFIcsACP6G1q73EUHh8hTMmhtEEtQ8A'))
                }
                alt="Profile Avatar"
              />
            </div>
          </div>

          {isEditing ? (
            <div className="w-full space-y-3 mb-4">
              <div>
                <label className="block text-left text-xs font-semibold text-on-surface-variant mb-1">Họ và tên</label>
                <input 
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm outline-none focus:border-primary text-on-surface"
                  placeholder="Họ và tên..."
                />
              </div>
              <div>
                <label className="block text-left text-xs font-semibold text-on-surface-variant mb-1">Ảnh đại diện</label>
                <div className="flex items-center gap-3 mt-1.5">
                  <label className="cursor-pointer bg-primary-container text-primary font-bold px-4 py-2.5 rounded-lg hover:bg-primary-container/80 transition-colors text-xs flex items-center gap-1.5 shadow-sm border border-primary/20">
                    <span className="material-symbols-outlined text-sm font-bold">upload</span>
                    Tải ảnh từ thiết bị
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      className="hidden" 
                    />
                  </label>
                  {avatarUrl && (
                    <span className="text-xs text-on-surface-variant italic truncate max-w-[180px]">
                      Đã chọn ảnh mới
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              <h1 className="font-headline-md text-xl text-on-surface mb-1 font-bold">{currentUser.profile.full_name}</h1>
              <p className="font-body-md text-sm text-on-surface-variant mb-4">
                {currentUser.role === 'Admin' ? 'Quản trị viên toàn hệ thống' :
                 currentUser.role === 'Organizer' ? 'Nhà tổ chức hoạt động' : 'Tình nguyện viên tích cực'}
              </p>
            </>
          )}

          {/* About Me Section */}
          <div className="w-full text-left mb-4">
            <h3 className="font-label-sm text-sm text-on-surface mb-2 uppercase tracking-wider font-bold">Giới thiệu bản thân</h3>
            {isEditing ? (
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full p-2 bg-surface-container-low border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none text-xs min-h-[100px]"
                placeholder="Mô tả bản thân của bạn..."
              />
            ) : (
              <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
                {currentUser.profile.bio || 'Chưa có thông tin giới thiệu.'}
              </p>
            )}
          </div>

          {/* Volunteer level tracker */}
          <div className="w-full text-left mb-6">
            <div className="flex justify-between items-center mb-1.5 text-sm font-semibold">
              <span className="text-on-surface">Cấp độ tình nguyện</span>
              <span className="text-primary">
                {currentUser.profile.joined_activity_count >= 5 ? 'Vàng (Gold) 🥇' : 
                 currentUser.profile.joined_activity_count >= 1 ? 'Bạc (Silver) 🥈' : 'Đồng (Bronze) 🥉'}
              </span>
            </div>
            <div className="progress-bar-track">
              <div 
                className="progress-bar-fill"
                style={{ width: `${Math.min(100, (currentUser.profile.joined_activity_count / 5) * 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-on-surface-variant mt-1 text-right">
              {currentUser.profile.joined_activity_count >= 5 ? 'Đã đạt cấp Gold' : `Cần hoàn thành ${5 - currentUser.profile.joined_activity_count} hoạt động nữa để lên Vàng`}
            </p>
          </div>

          {/* Role Upgrade Request triggers */}
          {currentUser.role === 'Volunteer' && (
            <div className="w-full">
              {userRequest ? (
                <div className={`p-3 rounded-lg border text-xs text-left ${
                  userRequest.status === 'Pending' ? 'bg-amber-50 border-amber-300 text-amber-800' :
                  userRequest.status === 'Approved' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' :
                  'bg-red-50 border-red-300 text-red-800'
                }`}>
                  <div className="font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">
                      {userRequest.status === 'Pending' ? 'hourglass_empty' :
                       userRequest.status === 'Approved' ? 'verified' : 'cancel'}
                    </span>
                    Yêu cầu nâng quyền: {
                      userRequest.status === 'Pending' ? 'Đang chờ duyệt' :
                      userRequest.status === 'Approved' ? 'Đã duyệt' : 'Bị từ chối'
                    }
                  </div>
                  <p className="mt-1 text-on-surface-variant">Ngày gửi: {new Date(userRequest.created_at).toLocaleDateString('vi-VN')}</p>
                  {userRequest.admin_feedback && (
                    <p className="mt-1 text-[11px] font-medium text-red-700 bg-red-100/50 p-1.5 rounded">
                      <strong>Lý do:</strong> {userRequest.admin_feedback}
                    </p>
                  )}
                  {userRequest.status === 'Rejected' && (
                    <button 
                      onClick={() => setShowRequestModal(true)}
                      className="mt-2.5 w-full bg-primary hover:bg-tertiary text-on-primary font-bold py-1.5 rounded text-xs transition-colors"
                    >
                      Gửi lại yêu cầu nâng quyền
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="w-full bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-white px-4 py-3 rounded-lg font-label-sm text-sm font-bold transition-all duration-200 active:scale-95 text-center flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">workspace_premium</span>
                  Yêu cầu vai trò Tổ chức (Organizer)
                </button>
              )}
            </div>
          )}
        </div>

        {/* Contact/Details Panel */}
        <div className="bg-surface-container-lowest rounded-lg p-6 border border-surface-variant shadow-sm">
          <h3 className="font-label-sm text-sm text-on-surface mb-3 uppercase tracking-wider font-bold">Thông tin liên hệ</h3>
          {isEditing ? (
            <ul className="flex flex-col gap-3 text-sm">
              {!isVirtualEmail && (
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-base">mail</span>
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-grow p-1.5 bg-surface-container-low border border-outline-variant rounded-md text-sm outline-none focus:border-primary"
                  />
                </li>
              )}
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-base">location_on</span>
                <input 
                  type="text"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder="Thành phố/Khu vực"
                  className="flex-grow p-1.5 bg-surface-container-low border border-outline-variant rounded-md text-sm outline-none focus:border-primary"
                />
              </li>
            </ul>
          ) : (
            <ul className="flex flex-col gap-3 text-sm text-on-surface-variant font-medium">
              {!isVirtualEmail && (
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-base">mail</span>
                  <span>{currentUser.email || 'Chưa điền email'}</span>
                </li>
              )}
              {!currentUser.phone?.startsWith('+84') && (
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-base">phone</span>
                  <span>{currentUser.phone}</span>
                </li>
              )}
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-base">location_on</span>
                <span>{currentUser.profile.area_of_interest || 'Chưa điền khu vực'}</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-base">calendar_month</span>
                <span>Tham gia: {new Date(currentUser.created_at).toLocaleDateString('vi-VN')}</span>
              </li>
            </ul>
          )}
        </div>

        {/* Skills Panel */}
        <div className="bg-surface-container-lowest rounded-lg p-6 border border-surface-variant shadow-sm">
          <h3 className="font-label-sm text-sm text-on-surface mb-3 uppercase tracking-wider font-bold">Kỹ năng</h3>
          {isEditing ? (
            <div className="flex flex-col gap-2">
              <input 
                type="text"
                value={skillsStr}
                onChange={(e) => setSkillsStr(e.target.value)}
                placeholder="ví dụ: Giao tiếp, Làm việc nhóm, Sơ cứu..."
                className="w-full p-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm focus:border-primary outline-none"
              />
              <p className="text-[10px] text-on-surface-variant">Phân cách các kỹ năng bằng dấu phẩy</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {currentUser.profile.skills.length > 0 ? (
                currentUser.profile.skills.map((skill, idx) => (
                  <span key={idx} className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-sm font-semibold">
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-sm text-on-surface-variant italic">Chưa khai báo kỹ năng</span>
              )}
            </div>
          )}
        </div>

        {/* Save/Cancel edit action row */}
        {isEditing && (
          <div className="flex gap-3">
            <button 
              onClick={handleSaveProfile}
              className="flex-grow bg-primary text-on-primary hover:bg-tertiary px-4 py-3 rounded-lg font-label-sm text-sm font-bold shadow transition-colors"
            >
              Lưu thay đổi
            </button>
            <button 
              onClick={handleCancelEdit}
              className="flex-grow bg-surface-container-high text-on-surface hover:bg-surface-variant px-4 py-3 rounded-lg font-label-sm text-sm font-bold transition-colors"
            >
              Hủy
            </button>
          </div>
        )}
      </section>

      {/* Right Column: Stats & Completed Activities */}
      <section className="lg:col-span-8 flex flex-col gap-md">
        {/* Profile Hero Stats Panel */}
        <div className="bg-primary-container/20 text-on-primary-container rounded-lg p-8 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-sm border border-surface-variant min-h-[250px]">
          {/* Decorative gradients */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-tertiary/10 rounded-full blur-3xl"></div>
          
          <span className="material-symbols-outlined text-primary mb-3 filled" style={{ fontSize: '48px' }}>volunteer_activism</span>
          <h2 className="font-display-lg text-4xl font-bold mb-1">{currentUser.profile.joined_activity_count}</h2>
          <p className="font-headline-md text-base opacity-90 font-semibold uppercase tracking-wide">Số hoạt động đã tham gia hoàn thành</p>
          
          <div className="mt-4">
            <span className="bg-surface-container-lowest text-primary px-4 py-1.5 rounded-full text-sm font-bold shadow-sm uppercase tracking-wider">
              {currentUser.profile.joined_activity_count >= 5 ? 'Top 5% Contributor' : 
               currentUser.profile.joined_activity_count >= 1 ? 'Top 20% Contributor' : 'Thành viên mới'}
            </span>
          </div>
        </div>

        {/* Recently Completed Activities Section */}
        <div className="mt-4">
          <h3 className="font-headline-md text-lg text-on-surface mb-6 flex items-center gap-2 font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-primary">history</span> Lịch sử hoạt động đã hoàn thành
          </h3>

          {completedRegs.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-lg p-8 border border-surface-variant text-center space-y-3 shadow-sm">
              <span className="material-symbols-outlined text-outline text-4xl">history_toggle_off</span>
              <p className="text-sm text-on-surface-variant italic">Bạn chưa hoàn thành hoạt động nào trên hệ thống.</p>
              <a href="#/activities" className="inline-block bg-primary text-on-primary px-4 py-2 rounded-lg font-medium text-sm shadow hover:bg-tertiary transition-colors">
                Khám phá chiến dịch ngay
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              {completedRegs.map(reg => (
                <div key={reg._id} className="bg-surface-container-lowest rounded-lg border border-surface-variant shadow-sm overflow-hidden hover:shadow-md transition-all flex flex-col h-[320px]">
                  <div className="h-36 w-full bg-surface-container relative shrink-0">
                    <div className="absolute top-4 left-4 bg-secondary-fixed text-primary px-3 py-1 rounded-full text-xs font-bold uppercase shadow-sm">
                      Hoàn thành
                    </div>
                  </div>
                  <div className="p-6 flex-grow flex flex-col justify-between">
                    <div>
                      <h4 className="font-headline-md text-on-surface text-base font-bold line-clamp-2 leading-tight mb-2">
                        {reg.denormalized_activity.title}
                      </h4>
                      <p className="text-sm text-on-surface-variant mb-4">
                        Diễn ra từ: {new Date(reg.denormalized_activity.start_date).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-sm text-on-surface-variant border-t border-surface-variant pt-3">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-base">event_available</span>
                        Đã điểm danh
                      </span>
                      <span className="flex items-center gap-1 text-[#137333] font-bold">
                        <span className="material-symbols-outlined text-base">verified</span> Completed
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Organizer request submission modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-[100] modal-overlay flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-xl rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="flex justify-between items-center px-md py-sm border-b border-surface-variant">
              <h3 className="font-headline-md text-lg text-on-surface font-bold">Đơn xin cấp quyền Organizer</h3>
              <button 
                onClick={() => setShowRequestModal(false)}
                className="p-1 hover:bg-surface-variant rounded-full text-on-surface-variant"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSendRequest}>
              <div className="p-md space-y-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2" htmlFor="reason">
                    Lý do muốn trở thành Nhà tổ chức *
                  </label>
                  <textarea 
                    id="reason"
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    required
                    rows={4}
                    placeholder="Mô tả lý do bạn muốn tạo hoạt động, tổ chức của bạn là gì, mục đích thế nào..."
                    className="w-full p-3 bg-surface-container-low border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2" htmlFor="experience">
                    Kinh nghiệm tổ chức / Tên CLB, Đội, Nhóm (Nếu có)
                  </label>
                  <textarea 
                    id="experience"
                    value={requestExp}
                    onChange={(e) => setRequestExp(e.target.value)}
                    rows={3}
                    placeholder="Kể tên các hoạt động bạn từng tham gia điều phối hoặc tên nhóm tình nguyện..."
                    className="w-full p-3 bg-surface-container-low border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2" htmlFor="phone">
                    Số điện thoại liên hệ *
                  </label>
                  <input 
                    id="phone"
                    type="text"
                    value={requestPhone}
                    onChange={(e) => setRequestPhone(e.target.value)}
                    required
                    className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                  />
                </div>
              </div>
              <div className="px-md py-sm border-t border-surface-variant flex justify-end gap-2 bg-surface-bright">
                <button 
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 border border-outline-variant text-on-surface-variant rounded-lg hover:bg-surface-variant font-medium text-xs transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-primary text-on-primary hover:bg-tertiary rounded-lg font-medium text-xs shadow transition-colors"
                >
                  Gửi Đề Xuất
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default ProfileView;
