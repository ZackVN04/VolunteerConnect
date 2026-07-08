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

// Status badge helper matches mockup badge designs
const ActivityStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { label: string; cls: string }> = {
    'Draft':          { label: 'Bản nháp',      cls: 'bg-slate-100 text-slate-600 border border-slate-200/50' },
    'Pending Review': { label: 'Chờ duyệt',     cls: 'bg-[#fef7e0] text-[#b06000] border border-[#b06000]/10' },
    'Open':           { label: 'Đang tuyển',    cls: 'bg-emerald-50 text-[#006d37] border border-emerald-100/50' },
    'Full':           { label: 'Đã đầy',        cls: 'bg-teal-50 text-teal-800 border border-teal-100/50' },
    'Ongoing':        { label: 'Đang diễn ra',  cls: 'bg-blue-50 text-blue-800 border border-blue-100/50' },
    'Completed':      { label: 'Đã kết thúc',   cls: 'bg-slate-100 text-slate-600 border border-slate-200/50' }, // gray background matches mockup
    'Rejected':       { label: 'Bị từ chối',    cls: 'bg-red-50 text-red-700 border border-red-200/50' },
    'Cancelled':      { label: 'Đã hủy',        cls: 'bg-slate-50 text-slate-500 border border-slate-100/50' },
  };
  const s = map[status] || { label: status, cls: 'bg-slate-100 text-slate-600' };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${s.cls}`}>{s.label}</span>;
};

export const OrganizerDashboard: React.FC = () => {
  const {
    currentUser, activities, registrations,
    createActivity, editActivity,
    approveRegistration, cancelOrRejectRegistration, updateParticipation,
    showNotification, showPrompt, showConfirm
  } = useApp();

  // Tabs theo mockup: Tổng quan | Hoạt động | Đăng ký | Điểm danh
  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'registrations' | 'attendance'>('overview');
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');

  // Registration sub-tab filter
  const [regSubTab, setRegSubTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  // Search filter for activities tab
  const [activitySearch, setActivitySearch] = useState('');

  // Search filter for registrations tab
  const [regSearch, setRegSearch] = useState('');

  // Show create/edit form
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);

  // Form Fields State
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

  // Auto-fill if hash says create=true
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash.includes('create=true')) {
        setActiveTab('activities');
        setShowForm(true);
        setEditMode(false);
        resetForm();
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const myCampaigns = currentUser ? activities.filter(a => a.organizer_id === currentUser._id) : [];

  useEffect(() => {
    if (myCampaigns.length > 0 && !selectedActivityId) {
      setSelectedActivityId(myCampaigns[0]._id);
    }
  }, [myCampaigns, selectedActivityId]);

  if (!currentUser) return null;

  // Stats
  const openCampaigns = myCampaigns.filter(a => a.status === 'Open' || a.status === 'Full' || a.status === 'Ongoing').length;
  const myCampaignIds = myCampaigns.map(c => c._id);
  const organizerRegs = registrations.filter(r => myCampaignIds.includes(r.activity_id));
  const pendingApprovalCount = organizerRegs.filter(r => r.status === 'Pending').length;
  const totalVolunteers = organizerRegs.filter(r => r.status === 'Approved' || r.status === 'Completed').length;

  // Filtered campaigns for activities tab
  const filteredCampaigns = myCampaigns.filter(a =>
    a.title.toLowerCase().includes(activitySearch.toLowerCase())
  );

  // All regs across organizer's campaigns, filtered by sub-tab
  const allOrgRegs = organizerRegs.filter(r => {
    if (regSubTab === 'pending') return r.status === 'Pending';
    if (regSubTab === 'approved') return r.status === 'Approved' || r.status === 'Completed';
    if (regSubTab === 'rejected') return r.status === 'Rejected' || r.status === 'Cancelled';
    return true;
  }).filter(r =>
    r.denormalized_volunteer.name.toLowerCase().includes(regSearch.toLowerCase())
  );

  const pendingCount = organizerRegs.filter(r => r.status === 'Pending').length;
  const approvedCount = organizerRegs.filter(r => r.status === 'Approved' || r.status === 'Completed').length;
  const rejectedCount = organizerRegs.filter(r => r.status === 'Rejected' || r.status === 'Cancelled').length;

  // Selected activity regs for attendance
  const selectedRegs = registrations.filter(r => r.activity_id === selectedActivityId);
  // Completed/past campaigns for attendance
  const completedCampaigns = myCampaigns.filter(a => a.status === 'Completed' || a.status === 'Ongoing');

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
    setStartDate(act.start_date.substring(0, 16));
    setEndDate(act.end_date.substring(0, 16));
    setLimitVolunteers(act.limit_volunteers);
    setRequirements(act.requirements || '');
    setImageUrl(act.image_url || '');
    setShowForm(true);
    setActiveTab('activities');
  };

  const handleEndActivity = (activityId: string) => {
    showConfirm(
      'Bạn có chắc chắn muốn kết thúc chiến dịch này? Trạng thái sẽ được chuyển sang Đã kết thúc và tình nguyện viên có thể tiến hành điểm danh.',
      async () => {
        const res = await editActivity(activityId, { status: 'Completed' });
        if (res.success) {
          showNotification('Đã kết thúc chiến dịch thành công!', 'success');
        } else {
          showNotification(res.error || 'Có lỗi xảy ra khi kết thúc chiến dịch.', 'error');
        }
      },
      'Kết thúc hoạt động'
    );
  };

  const handleSubmitActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!title.trim() || !description.trim() || !district.trim() || !addressDetail.trim() || !startDate || !endDate) {
        showNotification('Vui lòng điền đầy đủ các thông tin bắt buộc', 'error');
        return;
      }
      if (title.trim().length < 5) { showNotification('Tiêu đề phải có ít nhất 5 ký tự', 'error'); return; }
      if (description.trim().length < 20) { showNotification('Mô tả phải có ít nhất 20 ký tự', 'error'); return; }
      if (new Date(endDate) <= new Date(startDate)) { showNotification('Ngày kết thúc phải sau ngày bắt đầu', 'error'); return; }
      const limitNum = Number(limitVolunteers);
      if (isNaN(limitNum) || limitNum < 1) { showNotification('Số lượng tình nguyện viên tối thiểu là 1', 'error'); return; }

      const activityData: Partial<Activity> = {
        title,
        description,
        categories: [category],
        location: { province, district, address_detail: addressDetail },
        start_date: startDate.includes('T') ? `${startDate}:00.000Z` : `${startDate}T08:00:00.000Z`,
        end_date: endDate.includes('T') ? `${endDate}:00.000Z` : `${endDate}T17:00:00.000Z`,
        limit_volunteers: limitNum,
        requirements: requirements.trim() || null,
        image_url: imageUrl.trim() || 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?q=80&w=600',
        status: 'Pending Review'
      };

      if (editMode && editingActivityId) {
        const res = await editActivity(editingActivityId, activityData);
        if (res.success) {
          showNotification('Đã cập nhật hoạt động và gửi yêu cầu duyệt lại!', 'success');
          resetForm();
          setShowForm(false);
        } else {
          showNotification(res.error || 'Có lỗi xảy ra khi cập nhật.', 'error');
        }
      } else {
        const res = await createActivity(activityData, true);
        if (res.success) {
          showNotification('Tạo hoạt động mới thành công! Đang chờ Admin duyệt.', 'success');
          resetForm();
          setShowForm(false);
        } else {
          showNotification(res.error || 'Có lỗi xảy ra khi tạo hoạt động.', 'error');
        }
      }
    } catch (err: any) {
      console.error('Lỗi không mong muốn:', err);
      showNotification('Có lỗi không mong muốn. Vui lòng thử lại.', 'error');
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
        if (!reason.trim()) { showNotification('Vui lòng nhập lý do từ chối.', 'error'); return; }
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

  // Tab button style helper (Matches mockup style)
  const tabCls = (tab: string) =>
    `pb-3 px-1 font-bold text-sm transition-all border-b-2 whitespace-nowrap cursor-pointer ${
      activeTab === tab
        ? 'border-[#006d37] text-[#006d37]'
        : 'border-transparent text-gray-500 hover:text-gray-800'
    }`;

  return (
    <div className="w-full bg-[#f8f9fa] min-h-screen pb-16">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-8 space-y-6 text-left">

        {/* Page Title */}
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 font-headline-md">Quản lý tổ chức</h1>
          <p className="text-gray-500 text-sm mt-1 font-semibold">Không gian làm việc dành riêng cho ban tổ chức</p>
        </div>

        {/* Back button */}
        <div>
          <a
            href="#/profile"
            className="inline-flex items-center gap-1.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm"
          >
            ← Quay lại Hồ sơ cá nhân
          </a>
        </div>

        {/* Tabs + Create button */}
        <div className="flex items-end justify-between border-b border-gray-200 pb-px">
          <div className="flex gap-6">
            <button onClick={() => setActiveTab('overview')} className={tabCls('overview')}>Tổng quan</button>
            <button onClick={() => { setActiveTab('activities'); setShowForm(false); }} className={tabCls('activities')}>Hoạt động</button>
            <button onClick={() => setActiveTab('registrations')} className={tabCls('registrations')}>Đăng ký</button>
            <button onClick={() => setActiveTab('attendance')} className={tabCls('attendance')}>Điểm danh</button>
          </div>
          <button
            onClick={() => {
              setActiveTab('activities');
              setShowForm(true);
              setEditMode(false);
              resetForm();
            }}
            className="mb-3 bg-[#006d37] hover:bg-[#005027] text-white font-bold text-xs px-5 py-2.5 rounded-full transition-all shadow-sm cursor-pointer"
          >
            + Tạo hoạt động
          </button>
        </div>

        {/* ===================== TAB: TỔNG QUAN ===================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats row */}
            <div className="bg-[#e8f5e9]/70 rounded-2xl p-6 grid grid-cols-3 gap-4 border border-emerald-100/50">
              <div className="text-center">
                <p className="text-4xl font-extrabold text-[#006d37] font-headline-md">{openCampaigns}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1.5">CHIẾN DỊCH MỞ</p>
              </div>
              <div className="text-center border-l border-r border-[#006d37]/15">
                <p className="text-4xl font-extrabold text-[#006d37] font-headline-md">{pendingApprovalCount}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1.5">ĐĂNG KÝ CHỜ DUYỆT</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-extrabold text-[#006d37] font-headline-md">{totalVolunteers}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1.5">TÌNH NGUYỆN VIÊN</p>
              </div>
            </div>

            {/* Two-column cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Việc cần xử lý ngay */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 text-sm pb-3 border-b border-slate-100 font-headline-md">Việc cần xử lý ngay</h3>
                {pendingApprovalCount === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-10 font-semibold">Không có việc cần xử lý ngay.</p>
                ) : (
                  <div className="space-y-3 pt-4">
                    {organizerRegs.filter(r => r.status === 'Pending').slice(0, 5).map(reg => {
                      const act = activities.find(a => a._id === reg.activity_id);
                      return (
                        <div key={reg._id} className="flex items-center justify-between p-3 bg-amber-50/50 rounded-xl border border-amber-100/50 animate-fadeIn">
                          <div>
                            <p className="font-bold text-xs text-gray-800">{reg.denormalized_volunteer.name}</p>
                            <p className="text-[10px] text-gray-500 font-medium">{act?.title || 'Hoạt động'}</p>
                          </div>
                          <button
                            onClick={() => handleApprove(reg._id)}
                            className="text-xs font-bold text-[#006d37] hover:underline cursor-pointer"
                          >
                            Duyệt ngay
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Hoạt động gần đây */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-gray-900 text-sm font-headline-md">Hoạt động gần đây</h3>
                  <button
                    onClick={() => setActiveTab('activities')}
                    className="text-xs text-[#006d37] hover:underline font-bold cursor-pointer"
                  >
                    Xem tất cả →
                  </button>
                </div>
                {myCampaigns.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-10 font-semibold">Chưa có hoạt động nào.</p>
                ) : (
                  <div className="divide-y divide-slate-100 pt-1">
                    {myCampaigns.slice(0, 4).map(act => (
                      <div key={act._id} className="py-3 flex flex-col gap-0.5 animate-fadeIn">
                        <p className="font-bold text-xs text-gray-900">{act.title}</p>
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                          Ngày bắt đầu: {new Date(act.start_date).toLocaleDateString('vi-VN')} | Trạng thái: {act.status}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB: HOẠT ĐỘNG ===================== */}
        {activeTab === 'activities' && (
          <div className="space-y-6">
            {/* Create/Edit Form */}
            {showForm ? (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 max-w-[800px] mx-auto shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-slate-100 pb-3 font-headline-md">
                  {editMode ? 'Chỉnh sửa hoạt động' : 'Tạo hoạt động mới'}
                </h2>

                <form onSubmit={handleSubmitActivity} className="space-y-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Tên hoạt động *</label>
                    <input
                      type="text" value={title} onChange={e => setTitle(e.target.value)} required
                      placeholder="Ví dụ: Chiến dịch dọn rác bờ biển Cần Giờ 2026..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-2 focus:ring-[#006d37]/20 text-sm font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Lĩnh vực *</label>
                      <select value={category} onChange={e => setCategory(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-[#006d37] text-sm font-semibold bg-white cursor-pointer">
                        <option value="Môi trường">Môi trường</option>
                        <option value="Giáo dục">Giáo dục</option>
                        <option value="Y tế">Y tế</option>
                        <option value="Từ thiện">Từ thiện</option>
                        <option value="Gây quỹ">Gây quỹ</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Số lượng tình nguyện viên *</label>
                      <input type="number" value={limitVolunteers}
                        onChange={e => setLimitVolunteers(e.target.value === '' ? '' : Number(e.target.value))}
                        required min={1}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-2 focus:ring-[#006d37]/20 text-sm font-semibold" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Thời gian bắt đầu *</label>
                      <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-2 focus:ring-[#006d37]/20 text-sm font-semibold cursor-pointer" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Thời gian kết thúc *</label>
                      <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-2 focus:ring-[#006d37]/20 text-sm font-semibold cursor-pointer" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Tỉnh / Thành phố *</label>
                      <select value={province} onChange={e => { const p = e.target.value; setProvince(p); setDistrict(LOCATION_DATA[p]?.[0] || ''); }} required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-[#006d37] text-sm font-semibold bg-white cursor-pointer">
                        {Object.keys(LOCATION_DATA).map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Quận / Huyện *</label>
                      <select value={district} onChange={e => setDistrict(e.target.value)} required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-[#006d37] text-sm font-semibold bg-white cursor-pointer">
                        {(LOCATION_DATA[province] || []).map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Địa chỉ chi tiết *</label>
                      <input type="text" value={addressDetail} onChange={e => setAddressDetail(e.target.value)} required
                        placeholder="Ví dụ: Bãi biển 30/4"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-2 focus:ring-[#006d37]/20 text-sm font-semibold" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Mô tả chi tiết *</label>
                    <textarea rows={5} value={description} onChange={e => setDescription(e.target.value)} required
                      placeholder="Mô tả nội dung, hành trình, lợi ích và đóng góp..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-2 focus:ring-[#006d37]/20 text-sm font-semibold" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Yêu cầu & Ghi chú</label>
                    <textarea rows={3} value={requirements} onChange={e => setRequirements(e.target.value)}
                      placeholder="Độ tuổi tối thiểu, trang phục yêu cầu, sức khỏe..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-2 focus:ring-[#006d37]/20 text-sm font-semibold" />
                  </div>

                  <div className="flex flex-col gap-2 text-left">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Hình ảnh minh họa</label>
                    <div className="flex items-center gap-4 pt-1">
                      {imageUrl ? (
                        <div className="relative w-36 h-24 rounded-xl overflow-hidden border border-gray-200 shrink-0 shadow-sm">
                          <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setImageUrl('')}
                            className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full p-0.5 shadow transition-all cursor-pointer">
                            <span className="material-symbols-outlined text-[13px]">close</span>
                          </button>
                        </div>
                      ) : (
                        <div className="w-36 h-24 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 shrink-0 text-xs font-semibold">
                          <span className="material-symbols-outlined text-xl mb-1">image</span>
                          Chưa chọn ảnh
                        </div>
                      )}
                      <label className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm">
                        <span className="material-symbols-outlined text-sm text-slate-500">upload</span>
                        Tải ảnh lên
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
                    <button type="button" onClick={() => { resetForm(); setShowForm(false); }}
                      className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 text-sm font-bold cursor-pointer transition-all">
                      Hủy
                    </button>
                    <button type="submit"
                      className="px-5 py-2.5 bg-[#006d37] hover:bg-[#005027] text-white rounded-xl text-sm font-bold shadow-sm cursor-pointer transition-all">
                      {editMode ? 'Cập nhật hoạt động' : 'Tạo hoạt động mới'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* Activity List matching mockup */
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm">
                {/* List header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-slate-100 gap-3">
                  <h3 className="font-bold text-gray-900 text-sm font-headline-md">Danh sách hoạt động đã tạo</h3>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={activitySearch}
                      onChange={e => setActivitySearch(e.target.value)}
                      placeholder="Tìm tên hoạt động..."
                      className="border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-[#006d37] focus:ring-2 focus:ring-[#006d37]/10 w-48 shadow-sm transition-all"
                    />
                    <button className="flex items-center gap-1.5 border border-[#006d37] rounded-xl px-4 py-2 text-xs text-[#006d37] hover:bg-emerald-50 transition-all font-bold cursor-pointer shadow-sm">
                      <span className="material-symbols-outlined text-[15px] font-bold">filter_list</span>
                      Bộ lọc
                    </button>
                  </div>
                </div>

                {filteredCampaigns.length === 0 ? (
                  <div className="p-16 text-center">
                    <span className="material-symbols-outlined text-gray-300 text-5xl">campaign</span>
                    <p className="text-xs text-gray-400 italic mt-3 font-semibold">
                      {activitySearch ? 'Không tìm thấy hoạt động nào.' : 'Bạn chưa tạo hoạt động nào.'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredCampaigns.map(act => {
                      const isCompleted = act.status === 'Completed';
                      const isOpen = act.status === 'Open' || act.status === 'Full' || act.status === 'Ongoing';
                      const isPending = act.status === 'Pending Review';
                      const approvedCount = registrations.filter(r => r.activity_id === act._id && (r.status === 'Approved' || r.status === 'Completed')).length;

                      // Format date
                      const dateObj = new Date(act.start_date);
                      const formattedDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;

                      return (
                        <div key={act._id} className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-5 gap-3 hover:bg-slate-50/50 transition-colors animate-fadeIn">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <a href={`#/activity/${act._id}`}
                                className="font-bold text-sm text-[#006d37] hover:underline truncate max-w-[420px]">
                                {act.title}
                              </a>
                              <ActivityStatusBadge status={act.status} />
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-500 font-semibold">
                              <span className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-sm text-slate-400">calendar_month</span>
                                <span>{formattedDate}</span>
                              </span>
                              <span className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-sm text-slate-400">group</span>
                                <span>{approvedCount}/{act.limit_volunteers}</span>
                              </span>
                            </div>
                          </div>

                          {/* Action buttons per status matching mockup designs */}
                          <div className="flex items-center gap-2 shrink-0">
                            {isPending && (
                              <button onClick={() => handleEditCampaignClick(act)}
                                className="border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer">
                                Sửa
                              </button>
                            )}
                            {isOpen && (
                              <>
                                <button
                                  onClick={() => { setActiveTab('registrations'); setRegSubTab('pending'); }}
                                  className="bg-[#006d37] hover:bg-[#005027] text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer">
                                  Duyệt đơn
                                </button>
                                <button onClick={() => handleEditCampaignClick(act)}
                                  className="border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer">
                                  Sửa
                                </button>
                                <button onClick={() => handleEndActivity(act._id)}
                                  className="border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer">
                                  Kết thúc
                                </button>
                              </>
                            )}
                            {isCompleted && (
                              <button
                                onClick={() => { setActiveTab('attendance'); setSelectedActivityId(act._id); }}
                                className="bg-[#006d37] hover:bg-[#005027] text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer">
                                Điểm danh
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB: ĐĂNG KÝ ===================== */}
        {activeTab === 'registrations' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm">
            {/* Sub-tabs Segmented Control + Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-slate-100 gap-3">
              
              {/* Segmented style filter buttons matching mockup */}
              <div className="bg-[#e8f5e9]/50 p-1 rounded-2xl flex gap-1 border border-emerald-100/50">
                <button
                  onClick={() => setRegSubTab('pending')}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    regSubTab === 'pending'
                      ? 'bg-white text-[#006d37] shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Chờ duyệt ({pendingCount})
                </button>
                <button
                  onClick={() => setRegSubTab('approved')}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    regSubTab === 'approved'
                      ? 'bg-white text-[#006d37] shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Đã chấp nhận ({approvedCount})
                </button>
                <button
                  onClick={() => setRegSubTab('rejected')}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    regSubTab === 'rejected'
                      ? 'bg-white text-[#006d37] shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Từ chối ({rejectedCount})
                </button>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={regSearch}
                  onChange={e => setRegSearch(e.target.value)}
                  placeholder="Tìm tên tình nguyện viên..."
                  className="border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-[#006d37] focus:ring-2 focus:ring-[#006d37]/10 w-48 shadow-sm transition-all"
                />
                <button className="flex items-center gap-1.5 border border-[#006d37] rounded-xl px-4 py-2 text-xs text-[#006d37] hover:bg-emerald-50 transition-all font-bold cursor-pointer shadow-sm">
                  <span className="material-symbols-outlined text-[15px] font-bold">filter_list</span>
                  Bộ lọc
                </button>
              </div>
            </div>

            {/* Table with Uppercase headers */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-4">TÌNH NGUYỆN VIÊN</th>
                    <th className="px-6 py-4">HOẠT ĐỘNG ĐĂNG KÝ</th>
                    <th className="px-6 py-4">KHU VỰC</th>
                    <th className="px-6 py-4">KỸ NĂNG RÚT GỌN</th>
                    <th className="px-6 py-4">HỒ SƠ</th>
                    <th className="px-6 py-4">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-750">
                  {allOrgRegs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-xs text-slate-400 font-semibold">
                        Không có đơn đăng ký nào ở trạng thái này.
                      </td>
                    </tr>
                  ) : (
                    allOrgRegs.map(reg => {
                      const act = activities.find(a => a._id === reg.activity_id);
                      return (
                        <tr key={reg._id} className="hover:bg-slate-50/50 transition-colors animate-fadeIn">
                          <td className="px-6 py-4 font-bold text-slate-800">{reg.denormalized_volunteer.name}</td>
                          <td className="px-6 py-4 text-slate-500 font-medium max-w-[200px] truncate">{act?.title || '—'}</td>
                          <td className="px-6 py-4 text-slate-500 font-semibold">{act?.location?.province || '—'}</td>
                          <td className="px-6 py-4 text-slate-400 font-medium">—</td>
                          <td className="px-6 py-4">
                            <a href={`#/profile?userId=${reg.volunteer_id}`}
                              className="text-[#006d37] hover:underline text-xs font-bold">
                              Xem hồ sơ
                            </a>
                          </td>
                          <td className="px-6 py-4">
                            {reg.status === 'Pending' ? (
                              <div className="flex gap-2">
                                <button onClick={() => handleApprove(reg._id)}
                                  className="bg-[#006d37] hover:bg-[#005027] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer">
                                  Duyệt
                                </button>
                                <button onClick={() => handleReject(reg._id)}
                                  className="border border-red-300 text-red-650 hover:bg-red-50 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer">
                                  Từ chối
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs font-semibold">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================== TAB: ĐIỂM DANH ===================== */}
        {activeTab === 'attendance' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <h3 className="font-bold text-gray-900 text-sm font-headline-md">Điểm danh tình nguyện viên</h3>
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Chọn chiến dịch:</label>
                <select
                  value={selectedActivityId}
                  onChange={e => setSelectedActivityId(e.target.value)}
                  className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-2 focus:ring-[#006d37]/10 text-xs font-semibold bg-white min-w-[240px] cursor-pointer shadow-sm transition-all"
                >
                  <option value="">-- Chọn hoạt động để điểm danh --</option>
                  {completedCampaigns.map(act => (
                    <option key={act._id} value={act._id}>{act.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Attendance area */}
            <div className="rounded-2xl overflow-hidden">
              {!selectedActivityId ? (
                // Dashed border card container matching mockup
                <div className="border-2 border-dashed border-slate-200/80 rounded-2xl p-12 text-center bg-slate-50/50">
                  <p className="text-xs font-bold text-slate-500">
                    Vui lòng chọn chiến dịch đã kết thúc để tiến hành điểm danh.
                  </p>
                </div>
              ) : selectedRegs.filter(r => r.status === 'Approved' || r.status === 'Completed' || r.status === 'Absent').length === 0 ? (
                <div className="border border-slate-150 rounded-2xl p-10 text-center text-xs text-slate-400 font-semibold bg-slate-50">
                  Chưa có tình nguyện viên đã được duyệt cho chiến dịch này.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        <th className="px-6 py-4">Họ và tên</th>
                        <th className="px-6 py-4">Số điện thoại</th>
                        <th className="px-6 py-4">Trạng thái đăng ký</th>
                        <th className="px-6 py-4">Điểm danh tham gia</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-750">
                      {selectedRegs.filter(r => r.status === 'Approved' || r.status === 'Completed' || r.status === 'Absent').map(reg => {
                        const canCheckIn = reg.status === 'Approved';
                        const isCompleted = reg.status === 'Completed';
                        const isAbsent = reg.status === 'Absent';
                        return (
                          <tr key={reg._id} className="hover:bg-slate-50/50 transition-colors animate-fadeIn">
                            <td className="px-6 py-4 font-bold text-slate-800">{reg.denormalized_volunteer.name}</td>
                            <td className="px-6 py-4 text-slate-500 font-semibold">{reg.denormalized_volunteer.phone || '—'}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                                reg.status === 'Approved' ? 'bg-emerald-50 text-[#006d37] border-emerald-100/50' :
                                reg.status === 'Completed' ? 'bg-blue-50 text-blue-800 border-blue-100/50' :
                                'bg-red-50 text-red-750 border-red-100/50'
                              }`}>
                                {reg.status === 'Approved' ? 'Đã duyệt' : reg.status === 'Completed' ? 'Đã tham gia' : 'Vắng mặt'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {canCheckIn ? (
                                <div className="flex gap-2">
                                  <button onClick={() => handleCheckIn(reg._id, 'Completed')}
                                    className="bg-[#006d37] hover:bg-[#005027] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer">
                                    Có mặt
                                  </button>
                                  <button onClick={() => handleCheckIn(reg._id, 'Absent')}
                                    className="border border-red-300 hover:bg-red-50 text-red-600 px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer">
                                    Vắng mặt
                                  </button>
                                </div>
                              ) : isCompleted ? (
                                <span className="text-[#006d37] font-bold text-xs flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-sm font-bold">check_circle</span>
                                  Có mặt
                                </span>
                              ) : isAbsent ? (
                                <span className="text-red-650 font-bold text-xs flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-sm font-bold">cancel</span>
                                  Vắng mặt
                                </span>
                              ) : (
                                <span className="text-gray-400">—</span>
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
