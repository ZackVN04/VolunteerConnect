import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { Activity } from '../context/AppContext';

const LOCATION_DATA: Record<string, string[]> = {
  "Hồ Chí Minh": [
    "Quận 1", "Quận 3", "Quận 4", "Quận 5", "Quận 6", "Quận 7", "Quận 8", "Quận 10", "Quận 11", "Quận 12",
    "Quận Bình Thạnh", "Quận Bình Tân", "Quận Gò Vấp", "Quận Phú Nhuận", "Quận Tân Bình", "Quận Tân Phú",
    "Thành phố Thủ Đức", "Huyện Bình Chánh", "Huyện Cần Giờ", "Huyện Củ Chi", "Huyện Hóc Môn", "Huyện Nhà Bè"
  ],
  "Hà Nội": [
    "Quận Ba Đình", "Quận Hoàn Kiếm", "Quận Tây Hồ", "Quận Long Biên", "Quận Cầu Giấy", "Quận Đống Đa", 
    "Quận Hai Bà Trưng", "Quận Hoàng Mai", "Quận Thanh Xuân", "Huyện Sóc Sơn", "Huyện Đông Anh", "Huyện Gia Lâm"
  ],
  "Đà Nẵng": [
    "Quận Hải Châu", "Quận Thanh Khê", "Quận Sơn Trà", "Quận Ngũ Hành Sơn", "Quận Liên Chiểu", "Quận Cẩm Lệ", "Huyện Hòa Vang"
  ],
  "Cần Thơ": [
    "Quận Ninh Kiều", "Quận Bình Thủy", "Quận Cái Răng", "Quận Ô Môn", "Quận Thốt Nốt", "Huyện Phong Điền", "Huyện Cờ Đỏ"
  ],
  "Hải Phòng": [
    "Quận Hồng Bàng", "Quận Lê Chân", "Quận Ngô Quyền", "Quận Kiến An", "Quận Hải An", "Quận Đồ Sơn", "Quận Dương Kinh"
  ]
};

// Helper: inline avatar fallback with initials
const OrgAvatar: React.FC<{ name: string; src?: string | null }> = ({ name, src }) => {
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

export const OrganizerDashboard: React.FC = () => {
  const { 
    currentUser, activities, registrations, 
    createActivity, editActivity, 
    approveRegistration, cancelOrRejectRegistration, updateParticipation,
    showNotification, showPrompt
  } = useApp();

  const translateActivityStatus = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'Bản nháp';
      case 'Pending Review':
        return 'Chờ duyệt';
      case 'Open':
        return 'Đang mở';
      case 'Full':
        return 'Đã đầy';
      case 'Ongoing':
        return 'Đang diễn ra';
      case 'Completed':
        return 'Đã kết thúc';
      case 'Rejected':
        return 'Bị từ chối';
      case 'Cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const [activeTab, setActiveTab] = useState<'overview' | 'my-campaigns' | 'create-campaign' | 'approve' | 'attendance'>('overview');
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');

  // Form Fields State
  const [editMode, setEditMode] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Môi trường');
  const [province, setProvince] = useState('Hồ Chí Minh');
  const [district, setDistrict] = useState('Quận 1');
  const [addressDetail, setAddressDetail] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [limitVolunteers, setLimitVolunteers] = useState<number | string>(10);
  const [requirements, setRequirements] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showNotification('Dung lượng hình ảnh phải nhỏ hơn 5MB!', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Auto-fill selected activity if hash specifies create=true
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash.includes('create=true')) {
        setActiveTab('create-campaign');
        setEditMode(false);
        resetForm();
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Filter campaigns created by this organizer
  const myCampaigns = currentUser ? activities.filter(a => a.organizer_id === currentUser._id) : [];

  // Default selected activity ID for sub-selectors
  useEffect(() => {
    if (myCampaigns.length > 0 && !selectedActivityId) {
      setSelectedActivityId(myCampaigns[0]._id);
    }
  }, [myCampaigns, selectedActivityId]);

  if (!currentUser) return null;

  // Compute stats dynamically
  const totalCampaigns = myCampaigns.length;
  const totalCompleted = myCampaigns.filter(a => a.status === 'Completed').length;
  
  // Volunteers approved across all organizer's campaigns
  const myCampaignIds = myCampaigns.map(c => c._id);
  const organizerRegs = registrations.filter(r => myCampaignIds.includes(r.activity_id));
  const totalRecruited = organizerRegs.filter(r => r.status === 'Approved' || r.status === 'Completed').length;
  const pendingApprovalCount = organizerRegs.filter(r => r.status === 'Pending').length;

  // Filter registrations for selected activity (Tab: Duyệt tình nguyện viên)
  const selectedRegs = registrations.filter(r => r.activity_id === selectedActivityId);

  // Reset form helper
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('Môi trường');
    setProvince('Hồ Chí Minh');
    setDistrict('Quận 1');
    setAddressDetail('');
    setStartDate('');
    setEndDate('');
    setLimitVolunteers(10);
    setRequirements('');
    setImageUrl('');
    setEditMode(false);
    setEditingActivityId(null);
  };

  const handleEditCampaignClick = (act: Activity) => {
    setEditMode(true);
    setEditingActivityId(act._id);
    setTitle(act.title);
    setDescription(act.description);
    setCategory(act.categories[0] || 'Môi trường');
    setProvince(act.location?.province || 'Hồ Chí Minh');
    setDistrict(act.location?.district || 'Quận 1');
    setAddressDetail(act.location?.address_detail || '');
    
    // Convert dates to standard format YYYY-MM-DD or YYYY-MM-DDTHH:MM
    const sDate = act.start_date.substring(0, 16);
    const eDate = act.end_date.substring(0, 16);
    setStartDate(sDate);
    setEndDate(eDate);

    setLimitVolunteers(act.limit_volunteers);
    setRequirements(act.requirements || '');
    setImageUrl(act.image_url || '');

    setActiveTab('create-campaign');
  };

  const handleSubmitActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !district.trim() || !addressDetail.trim() || !startDate || !endDate) {
      showNotification('Vui lòng điền đầy đủ các thông tin bắt buộc', 'error');
      return;
    }

    const limitNum = Number(limitVolunteers);
    if (isNaN(limitNum) || limitNum < 1) {
      showNotification('Số lượng tình nguyện viên tối thiểu là 1', 'error');
      return;
    }

    const activityData: Partial<Activity> = {
      title,
      description,
      categories: [category],
      location: {
        province,
        district,
        address_detail: addressDetail
      },
      start_date: startDate.includes('T') ? `${startDate}:00.000Z` : `${startDate}T08:00:00.000Z`,
      end_date: endDate.includes('T') ? `${endDate}:00.000Z` : `${endDate}T17:00:00.000Z`,
      limit_volunteers: limitNum,
      requirements: requirements.trim() || null,
      image_url: imageUrl.trim() || 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?q=80&w=600',
      status: 'Pending Review' // All newly created/edited activities go to Pending Review
    };

    if (editMode && editingActivityId) {
      const res = await editActivity(editingActivityId, activityData);
      if (res.success) {
        showNotification('Đã cập nhật chiến dịch và gửi yêu cầu duyệt lại!', 'success');
        resetForm();
        setActiveTab('my-campaigns');
        window.location.hash = '#/organizer/dashboard';
      } else {
        showNotification(res.error || 'Có lỗi xảy ra khi cập nhật chiến dịch.', 'error');
      }
    } else {
      const res = await createActivity(activityData, true); // true = submit for review
      if (res.success) {
        showNotification('Tạo chiến dịch mới thành công! Đang chờ Admin duyệt.', 'success');
        resetForm();
        setActiveTab('my-campaigns');
        window.location.hash = '#/organizer/dashboard';
      } else {
        showNotification(res.error || 'Có lỗi xảy ra khi tạo chiến dịch.', 'error');
      }
    }
  };

  const handleApprove = (regId: string) => {
    approveRegistration(regId);
    showNotification('Đã duyệt tình nguyện viên này tham gia.', 'success');
  };

  const handleReject = (regId: string) => {
    showPrompt(
      'Nhập lý do từ chối đăng ký:',
      (reason) => {
        if (!reason.trim()) {
          showNotification('Vui lòng nhập lý do từ chối.', 'error');
          return;
        }
        cancelOrRejectRegistration(regId, reason);
        showNotification('Đã từ chối đơn đăng ký.', 'success');
      },
      'Từ chối đăng ký',
      'Lý do từ chối...'
    );
  };

  const handleCheckIn = (regId: string, status: 'Completed' | 'Absent') => {
    updateParticipation(regId, status);
    showNotification(`Đã điểm danh: ${status === 'Completed' ? 'Có mặt' : 'Vắng mặt'}`, 'success');
  };

  return (
    <div className="w-full bg-[#f8f9fa] min-h-screen pb-16">
      {/* Container */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-8 space-y-8 text-left">
        
        {/* Organizer Header/Profile banner */}
        <section className="bg-[#e8f5e9]/50 border border-surface-variant/40 rounded-3xl p-6 md:p-8 flex items-center gap-6 shadow-sm">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#006d37] bg-white shrink-0">
            <OrgAvatar 
              name={currentUser.profile.full_name} 
              src={currentUser.profile.avatar_url}
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-on-surface">{currentUser.profile.full_name}</h2>
              <span className="bg-[#006d37] text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                Ban tổ chức
              </span>
            </div>
            <p className="text-on-surface-variant text-sm mt-1">
              Đại diện Ban tổ chức hoạt động • Hoạt động uy tín
            </p>
          </div>
        </section>

        {/* 5-Tab Workspace panel links */}
        <div className="flex border-b border-surface-variant/40 pb-2 overflow-x-auto whitespace-nowrap scrollbar-thin">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2 px-4 font-semibold text-sm transition-all border-b-2 ${
              activeTab === 'overview'
                ? 'border-[#006d37] text-[#006d37]'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Tổng quan
          </button>
          <button
            onClick={() => setActiveTab('my-campaigns')}
            className={`pb-2 px-4 font-semibold text-sm transition-all border-b-2 ${
              activeTab === 'my-campaigns'
                ? 'border-[#006d37] text-[#006d37]'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Chiến dịch của tôi
          </button>
          <button
            onClick={() => {
              setActiveTab('create-campaign');
              setEditMode(false);
              resetForm();
            }}
            className={`pb-2 px-4 font-semibold text-sm transition-all border-b-2 ${
              activeTab === 'create-campaign'
                ? 'border-[#006d37] text-[#006d37]'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Tạo chiến dịch
          </button>
          <button
            onClick={() => setActiveTab('approve')}
            className={`pb-2 px-4 font-semibold text-sm transition-all border-b-2 ${
              activeTab === 'approve'
                ? 'border-[#006d37] text-[#006d37]'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Duyệt tình nguyện viên
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`pb-2 px-4 font-semibold text-sm transition-all border-b-2 ${
              activeTab === 'attendance'
                ? 'border-[#006d37] text-[#006d37]'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Điểm danh & check-in
          </button>
        </div>

        {/* TAB WORKSPACE CONTENT */}

        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white border border-surface-variant/40 rounded-2xl p-6 text-center shadow-sm">
                <h3 className="text-4xl font-bold text-[#006d37]">{totalCampaigns}</h3>
                <p className="text-on-surface-variant font-semibold text-sm mt-1">Tổng số chiến dịch</p>
              </div>
              <div className="bg-white border border-surface-variant/40 rounded-2xl p-6 text-center shadow-sm">
                <h3 className="text-4xl font-bold text-[#006d37]">{totalRecruited}</h3>
                <p className="text-on-surface-variant font-semibold text-sm mt-1">Tình nguyện viên đã tuyển</p>
              </div>
              <div className="bg-white border border-surface-variant/40 rounded-2xl p-6 text-center shadow-sm">
                <h3 className="text-4xl font-bold text-[#b06000]">{pendingApprovalCount}</h3>
                <p className="text-on-surface-variant font-semibold text-sm mt-1">Đăng ký đang chờ duyệt</p>
              </div>
              <div className="bg-white border border-surface-variant/40 rounded-2xl p-6 text-center shadow-sm">
                <h3 className="text-4xl font-bold text-[#1e429f]">{totalCompleted}</h3>
                <p className="text-on-surface-variant font-semibold text-sm mt-1">Chiến dịch hoàn thành</p>
              </div>
            </div>

            {/* Campaign Summary list inside Overview tab */}
            <div className="bg-white border border-surface-variant/40 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-on-surface border-b border-surface-variant/40 pb-3 mb-4">
                Chiến dịch đang mở tuyển gần đây
              </h3>
              {myCampaigns.length === 0 ? (
                <p className="text-sm text-on-surface-variant italic">Bạn chưa tạo chiến dịch nào. Bấm tab Tạo chiến dịch để bắt đầu.</p>
              ) : (
                <div className="space-y-4">
                  {myCampaigns.slice(0, 3).map(act => (
                    <div key={act._id} className="flex justify-between items-center border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
                      <div>
                        <h4 className="font-bold text-sm text-on-surface">{act.title}</h4>
                        <span className="text-xs text-on-surface-variant">
                          Tuyển dụng: {act.approved_volunteers_count}/{act.limit_volunteers} TNV
                        </span>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        act.status === 'Open' ? 'bg-[#e8f5e9] text-[#006d37]' :
                        act.status === 'Pending Review' ? 'bg-[#fef7e0] text-[#b06000]' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {translateActivityStatus(act.status)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. MY CAMPAIGNS TAB */}
        {activeTab === 'my-campaigns' && (
          <div className="bg-white border border-surface-variant/40 rounded-2xl shadow-sm overflow-hidden">
            {myCampaigns.length === 0 ? (
              <div className="p-16 text-center space-y-4">
                <span className="material-symbols-outlined text-outline text-5xl">campaign</span>
                <p className="text-sm text-on-surface-variant italic">Bạn chưa tạo chiến dịch nào.</p>
                <button 
                  onClick={() => setActiveTab('create-campaign')}
                  className="bg-[#006d37] hover:bg-emerald-800 text-white font-bold px-6 py-2.5 rounded-xl transition-all text-sm shadow-sm"
                >
                  Tạo hoạt động đầu tiên
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-[#f8f9fa] border-b border-surface-variant/40 text-on-surface-variant font-bold text-xs uppercase tracking-wider">
                      <th className="px-6 py-4">Tên chiến dịch</th>
                      <th className="px-6 py-4">Thời gian bắt đầu</th>
                      <th className="px-6 py-4">Địa điểm</th>
                      <th className="px-6 py-4">Trạng thái</th>
                      <th className="px-6 py-4">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-variant/30 text-on-surface">
                    {myCampaigns.map(act => (
                      <tr key={act._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-5 font-bold">{act.title}</td>
                        <td className="px-6 py-5 whitespace-nowrap text-on-surface-variant">
                          {new Date(act.start_date).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-6 py-5 text-on-surface-variant">
                          {act.location?.district || ''}, {act.location?.province || ''}
                        </td>
                        <td className="px-6 py-5">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            act.status === 'Open' ? 'bg-[#e8f5e9] text-[#006d37]' :
                            act.status === 'Pending Review' ? 'bg-[#fef7e0] text-[#b06000]' :
                            act.status === 'Completed' ? 'bg-[#e1effe] text-[#1e429f]' : 'bg-red-50 text-red-600'
                          }`}>
                            {translateActivityStatus(act.status)}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <button
                            onClick={() => handleEditCampaignClick(act)}
                            className="text-[#006d37] hover:underline font-bold"
                          >
                            Chỉnh sửa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 3. CREATE CAMPAIGN TAB */}
        {activeTab === 'create-campaign' && (
          <div className="bg-white border border-surface-variant/40 rounded-3xl p-6 md:p-8 max-w-[800px] mx-auto shadow-sm">
            <h2 className="text-xl font-bold text-on-surface mb-6 border-b border-surface-variant/40 pb-3">
              {editMode ? 'Chỉnh sửa hoạt động chiến dịch' : 'Tạo hoạt động mới'}
            </h2>

            <form onSubmit={handleSubmitActivity} className="space-y-6">
              {/* Tên chiến dịch */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Tên chiến dịch *</label>
                <input 
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Ví dụ: Chiến dịch dọn rác bờ biển Cần Giờ 2026..."
                  className="w-full px-4 py-2.5 border border-surface-variant rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-1 focus:ring-[#006d37] text-sm"
                />
              </div>

              {/* Lĩnh vực hoạt động & Số lượng */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Lĩnh vực hoạt động *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 border border-surface-variant rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-1 focus:ring-[#006d37] text-sm cursor-pointer bg-white"
                  >
                    <option value="Môi trường">Môi trường</option>
                    <option value="Giáo dục">Giáo dục</option>
                    <option value="Y tế">Y tế</option>
                    <option value="Từ thiện">Từ thiện</option>
                    <option value="Gây quỹ">Gây quỹ</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Số lượng tình nguyện viên cần tuyển *</label>
                  <input 
                    type="number"
                    value={limitVolunteers}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLimitVolunteers(val === '' ? '' : Number(val));
                    }}
                    required
                    min={1}
                    className="w-full px-4 py-2.5 border border-surface-variant rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-1 focus:ring-[#006d37] text-sm"
                  />
                </div>
              </div>

              {/* Start & End Datetime */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Thời gian bắt đầu *</label>
                  <input 
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-surface-variant rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-1 focus:ring-[#006d37] text-sm"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Thời gian kết thúc *</label>
                  <input 
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-surface-variant rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-1 focus:ring-[#006d37] text-sm"
                  />
                </div>
              </div>

              {/* Tỉnh thành, Quận huyện & Địa điểm chi tiết */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Tỉnh / Thành phố *</label>
                  <select
                    value={province}
                    onChange={(e) => {
                      const prov = e.target.value;
                      setProvince(prov);
                      const districts = LOCATION_DATA[prov] || [];
                      setDistrict(districts[0] || '');
                    }}
                    required
                    className="w-full px-4 py-2.5 border border-surface-variant rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-1 focus:ring-[#006d37] text-sm bg-white cursor-pointer"
                  >
                    {Object.keys(LOCATION_DATA).map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Quận / Huyện *</label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-surface-variant rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-1 focus:ring-[#006d37] text-sm bg-white cursor-pointer"
                  >
                    {(LOCATION_DATA[province] || []).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Địa chỉ chi tiết *</label>
                  <input 
                    type="text"
                    value={addressDetail}
                    onChange={(e) => setAddressDetail(e.target.value)}
                    required
                    placeholder="Ví dụ: Bãi biển 30/4"
                    className="w-full px-4 py-2.5 border border-surface-variant rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-1 focus:ring-[#006d37] text-sm"
                  />
                </div>
              </div>

              {/* Mô tả chi tiết */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Mô tả chi tiết chiến dịch *</label>
                <textarea 
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  placeholder="Mô tả nội dung chương trình, hành trình cụ thể, các lợi ích và đóng góp..."
                  className="w-full px-4 py-2.5 border border-surface-variant rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-1 focus:ring-[#006d37] text-sm"
                />
              </div>

              {/* Yêu cầu & ghi chú */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Yêu cầu & Ghi chú</label>
                <textarea 
                  rows={3}
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="Độ tuổi tối thiểu, trang phục yêu cầu, sức khỏe..."
                  className="w-full px-4 py-2.5 border border-surface-variant rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-1 focus:ring-[#006d37] text-sm"
                />
              </div>

              {/* Hình ảnh minh họa */}
              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Hình ảnh minh họa chiến dịch</label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {imageUrl ? (
                    <div className="relative w-40 h-28 rounded-xl overflow-hidden border border-surface-variant shrink-0 bg-slate-50 shadow-sm">
                      <img 
                        src={imageUrl} 
                        alt="Campaign illustration preview" 
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 cursor-pointer shadow flex items-center justify-center transition-colors"
                        title="Xóa hình ảnh"
                      >
                        <span className="material-symbols-outlined text-[14px] font-bold">close</span>
                      </button>
                    </div>
                  ) : (
                    <div className="w-40 h-28 rounded-xl border-2 border-dashed border-surface-variant flex flex-col items-center justify-center text-on-surface-variant shrink-0 bg-slate-50 text-[10px] font-semibold">
                      <span className="material-symbols-outlined text-xl mb-1 text-slate-400">image</span>
                      Chưa chọn ảnh
                    </div>
                  )}

                  <div className="flex-grow w-full">
                    <label className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 hover:bg-slate-50 text-on-surface rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm">
                      <span className="material-symbols-outlined text-[16px]">upload</span>
                      Tải ảnh từ thiết bị
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        className="hidden" 
                      />
                    </label>
                    <p className="text-[10px] text-on-surface-variant mt-1.5 font-semibold">
                      Hỗ trợ định dạng JPG, PNG dưới 5MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-4 border-t border-surface-variant/40 pt-6">
                <button 
                  type="button" 
                  onClick={resetForm}
                  className="px-6 py-2.5 border border-surface-variant text-on-surface-variant rounded-xl hover:bg-slate-50 transition-colors text-sm font-semibold"
                >
                  Hủy / Làm mới
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 bg-[#006d37] hover:bg-emerald-800 text-white rounded-xl transition-colors text-sm font-bold shadow-sm"
                >
                  {editMode ? 'Cập nhật chiến dịch' : 'Tạo hoạt động mới'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 4. APPROVE VOLUNTEERS TAB */}
        {activeTab === 'approve' && (
          <div className="space-y-6">
            {/* Sub-selector dropdown */}
            <div className="bg-white border border-surface-variant/40 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center gap-4">
              <label className="font-bold text-sm text-on-surface whitespace-nowrap shrink-0">Lựa chọn chiến dịch:</label>
              <select
                value={selectedActivityId}
                onChange={(e) => setSelectedActivityId(e.target.value)}
                className="flex-grow px-4 py-2.5 border border-surface-variant rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-1 focus:ring-[#006d37] text-sm bg-white"
              >
                {myCampaigns.map(act => (
                  <option key={act._id} value={act._id}>{act.title}</option>
                ))}
              </select>
            </div>

            {/* Table of applications */}
            <div className="bg-white border border-surface-variant/40 rounded-2xl shadow-sm overflow-hidden">
              {!selectedActivityId || selectedRegs.length === 0 ? (
                <div className="p-16 text-center">
                  <span className="material-symbols-outlined text-outline text-5xl">person_search</span>
                  <p className="text-sm text-on-surface-variant italic mt-3">Chưa có tình nguyện viên nào đăng ký chiến dịch này.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="bg-[#f8f9fa] border-b border-surface-variant/40 text-on-surface-variant font-bold text-xs uppercase tracking-wider">
                        <th className="px-6 py-4">Tên tình nguyện viên</th>
                        <th className="px-6 py-4">Số điện thoại</th>
                        <th className="px-6 py-4">Ngày đăng ký</th>
                        <th className="px-6 py-4">Trạng thái</th>
                        <th className="px-6 py-4">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-variant/30 text-on-surface">
                      {selectedRegs.map(reg => {
                        const isPending = reg.status === 'Pending';
                        return (
                          <tr key={reg._id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-5 font-bold">{reg.denormalized_volunteer.name}</td>
                            <td className="px-6 py-5 whitespace-nowrap text-on-surface-variant">
                              {reg.denormalized_volunteer.phone || '0987654321'}
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-on-surface-variant">
                              {new Date(reg.created_at).toLocaleDateString('vi-VN')}
                            </td>
                            <td className="px-6 py-5">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                reg.status === 'Approved' ? 'bg-[#e8f5e9] text-[#006d37]' :
                                reg.status === 'Pending' ? 'bg-[#fef7e0] text-[#b06000]' : 'bg-red-50 text-red-600'
                              }`}>
                                {reg.status === 'Pending' ? 'Đang chờ duyệt' : reg.status === 'Approved' ? 'Đã duyệt' : reg.status}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              {isPending ? (
                                <div className="flex gap-3">
                                  <button
                                    onClick={() => handleApprove(reg._id)}
                                    className="text-[#006d37] hover:underline font-bold"
                                  >
                                    Duyệt
                                  </button>
                                  <button
                                    onClick={() => handleReject(reg._id)}
                                    className="text-red-600 hover:underline font-bold"
                                  >
                                    Từ chối
                                  </button>
                                </div>
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
        )}

        {/* 5. ATTENDANCE CHECK-IN TAB */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            {/* Sub-selector dropdown */}
            <div className="bg-white border border-surface-variant/40 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center gap-4">
              <label className="font-bold text-sm text-on-surface whitespace-nowrap shrink-0">Lựa chọn chiến dịch:</label>
              <select
                value={selectedActivityId}
                onChange={(e) => setSelectedActivityId(e.target.value)}
                className="flex-grow px-4 py-2.5 border border-surface-variant rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-1 focus:ring-[#006d37] text-sm bg-white"
              >
                {myCampaigns.map(act => (
                  <option key={act._id} value={act._id}>{act.title}</option>
                ))}
              </select>
            </div>

            {/* Table of attendees */}
            <div className="bg-white border border-surface-variant/40 rounded-2xl shadow-sm overflow-hidden">
              {!selectedActivityId || selectedRegs.length === 0 ? (
                <div className="p-16 text-center">
                  <span className="material-symbols-outlined text-outline text-5xl">how_to_reg</span>
                  <p className="text-sm text-on-surface-variant italic mt-3">Chưa có tình nguyện viên nào đăng ký chiến dịch này.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="bg-[#f8f9fa] border-b border-surface-variant/40 text-on-surface-variant font-bold text-xs uppercase tracking-wider">
                        <th className="px-6 py-4">Họ và tên</th>
                        <th className="px-6 py-4">Số điện thoại</th>
                        <th className="px-6 py-4">Trạng thái đăng ký</th>
                        <th className="px-6 py-4">Điểm danh tham gia</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-variant/30 text-on-surface">
                      {selectedRegs.map(reg => {
                        const canCheckIn = reg.status === 'Approved';
                        const isCompleted = reg.status === 'Completed';
                        const isAbsent = reg.status === 'Absent';
                        
                        return (
                          <tr key={reg._id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-5 font-bold">{reg.denormalized_volunteer.name}</td>
                            <td className="px-6 py-5 text-on-surface-variant">
                              {reg.denormalized_volunteer.phone || '0987654321'}
                            </td>
                            <td className="px-6 py-5">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                reg.status === 'Approved' ? 'bg-[#e8f5e9] text-[#006d37]' :
                                reg.status === 'Completed' ? 'bg-[#e1effe] text-[#1e429f]' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {reg.status === 'Approved' ? 'Đã duyệt' : reg.status === 'Completed' ? 'Đã tham gia' : reg.status}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              {canCheckIn ? (
                                <div className="flex gap-3">
                                  <button
                                    onClick={() => handleCheckIn(reg._id, 'Completed')}
                                    className="bg-[#006d37] hover:bg-emerald-800 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm"
                                  >
                                    Điểm danh có mặt
                                  </button>
                                  <button
                                    onClick={() => handleCheckIn(reg._id, 'Absent')}
                                    className="border border-red-200 hover:bg-red-50 text-red-600 px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
                                  >
                                    Vắng mặt
                                  </button>
                                </div>
                              ) : isCompleted ? (
                                <span className="text-[#006d37] font-bold text-xs flex items-center gap-1">
                                  <span className="material-symbols-outlined text-sm font-bold">check_circle</span>
                                  Có mặt (Đã hoàn thành)
                                </span>
                              ) : isAbsent ? (
                                <span className="text-red-600 font-bold text-xs flex items-center gap-1">
                                  <span className="material-symbols-outlined text-sm font-bold">cancel</span>
                                  Vắng mặt
                                </span>
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
        )}

      </div>
    </div>
  );
};

export default OrganizerDashboard;
