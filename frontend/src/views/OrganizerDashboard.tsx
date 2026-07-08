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

// Status badge helper
const ActivityStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { label: string; cls: string }> = {
    'Draft':          { label: 'Bản nháp',      cls: 'bg-slate-100 text-slate-600' },
    'Pending Review': { label: 'Chờ duyệt',     cls: 'bg-amber-100 text-amber-800' },
    'Open':           { label: 'Đang tuyển',    cls: 'bg-emerald-100 text-emerald-800' },
    'Full':           { label: 'Đã đầy',        cls: 'bg-teal-100 text-teal-800' },
    'Ongoing':        { label: 'Đang diễn ra',  cls: 'bg-blue-100 text-blue-800' },
    'Completed':      { label: 'Đã kết thúc',   cls: 'bg-purple-100 text-purple-800' },
    'Rejected':       { label: 'Bị từ chối',    cls: 'bg-red-100 text-red-700' },
    'Cancelled':      { label: 'Đã hủy',        cls: 'bg-slate-200 text-slate-600' },
  };
  const s = map[status] || { label: status, cls: 'bg-slate-100 text-slate-600' };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.cls}`}>{s.label}</span>;
};

export const OrganizerDashboard: React.FC = () => {
  const {
    currentUser, activities, registrations,
    createActivity, editActivity,
    approveRegistration, cancelOrRejectRegistration, updateParticipation,
    showNotification, showPrompt
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

  // Tab button style helper
  const tabCls = (tab: string) =>
    `pb-3 px-1 font-semibold text-sm transition-all border-b-2 whitespace-nowrap ${
      activeTab === tab
        ? 'border-[#1a6c3a] text-[#1a6c3a]'
        : 'border-transparent text-gray-500 hover:text-gray-800'
    }`;

  return (
    <div className="w-full bg-[#f5f5f5] min-h-screen pb-16">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-8 space-y-6 text-left">

        {/* Page Title */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý tổ chức</h1>
          <p className="text-gray-500 text-sm mt-1">Không gian làm việc dành riêng cho ban tổ chức</p>
        </div>

        {/* Back button */}
        <div>
          <a
            href="#/profile"
            className="inline-flex items-center gap-1.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm px-4 py-2 rounded-lg transition-all"
          >
            ← Quay lại Hồ sơ cá nhân
          </a>
        </div>

        {/* Tabs + Create button */}
        <div className="flex items-end justify-between border-b border-gray-200">
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
            className="mb-3 bg-[#1a6c3a] hover:bg-[#155c30] text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-all shadow-sm"
          >
            + Tạo hoạt động
          </button>
        </div>

        {/* ===================== TAB: TỔNG QUAN ===================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats row */}
            <div className="bg-[#e8f5e9] rounded-2xl p-6 grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-[#1a6c3a]">{openCampaigns}</p>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">Chiến dịch mở</p>
              </div>
              <div className="text-center border-l border-r border-[#1a6c3a]/20">
                <p className="text-3xl font-bold text-[#1a6c3a]">{pendingApprovalCount}</p>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">Đăng ký chờ duyệt</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-[#1a6c3a]">{totalVolunteers}</p>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">Tình nguyện viên</p>
              </div>
            </div>

            {/* Two-column cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Việc cần xử lý ngay */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 text-base mb-4">Việc cần xử lý ngay</h3>
                {pendingApprovalCount === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">Không có việc cần xử lý ngay.</p>
                ) : (
                  <div className="space-y-3">
                    {organizerRegs.filter(r => r.status === 'Pending').slice(0, 5).map(reg => {
                      const act = activities.find(a => a._id === reg.activity_id);
                      return (
                        <div key={reg._id} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
                          <div>
                            <p className="font-semibold text-sm text-gray-800">{reg.denormalized_volunteer.name}</p>
                            <p className="text-xs text-gray-500">{act?.title || 'Hoạt động'}</p>
                          </div>
                          <button
                            onClick={() => handleApprove(reg._id)}
                            className="text-xs font-bold text-[#1a6c3a] hover:underline"
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
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-900 text-base">Hoạt động gần đây</h3>
                  <button
                    onClick={() => setActiveTab('activities')}
                    className="text-sm text-[#1a6c3a] hover:underline font-medium"
                  >
                    Xem tất cả →
                  </button>
                </div>
                {myCampaigns.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">Chưa có hoạt động nào.</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {myCampaigns.slice(0, 4).map(act => (
                      <div key={act._id} className="py-3">
                        <p className="font-semibold text-sm text-gray-900">{act.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
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
              <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 max-w-[800px] mx-auto shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-3">
                  {editMode ? 'Chỉnh sửa hoạt động' : 'Tạo hoạt động mới'}
                </h2>

                <form onSubmit={handleSubmitActivity} className="space-y-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Tên hoạt động *</label>
                    <input
                      type="text" value={title} onChange={e => setTitle(e.target.value)} required
                      placeholder="Ví dụ: Chiến dịch dọn rác bờ biển Cần Giờ 2026..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#1a6c3a] text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Lĩnh vực *</label>
                      <select value={category} onChange={e => setCategory(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#1a6c3a] text-sm bg-white">
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
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#1a6c3a] text-sm" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Thời gian bắt đầu *</label>
                      <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#1a6c3a] text-sm" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Thời gian kết thúc *</label>
                      <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#1a6c3a] text-sm" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Tỉnh / Thành phố *</label>
                      <select value={province} onChange={e => { const p = e.target.value; setProvince(p); setDistrict(LOCATION_DATA[p]?.[0] || ''); }} required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#1a6c3a] text-sm bg-white">
                        {Object.keys(LOCATION_DATA).map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Quận / Huyện *</label>
                      <select value={district} onChange={e => setDistrict(e.target.value)} required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#1a6c3a] text-sm bg-white">
                        {(LOCATION_DATA[province] || []).map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Địa chỉ chi tiết *</label>
                      <input type="text" value={addressDetail} onChange={e => setAddressDetail(e.target.value)} required
                        placeholder="Ví dụ: Bãi biển 30/4"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#1a6c3a] text-sm" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Mô tả chi tiết *</label>
                    <textarea rows={5} value={description} onChange={e => setDescription(e.target.value)} required
                      placeholder="Mô tả nội dung, hành trình, lợi ích và đóng góp..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#1a6c3a] text-sm" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Yêu cầu & Ghi chú</label>
                    <textarea rows={3} value={requirements} onChange={e => setRequirements(e.target.value)}
                      placeholder="Độ tuổi tối thiểu, trang phục yêu cầu, sức khỏe..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#1a6c3a] text-sm" />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Hình ảnh minh họa</label>
                    <div className="flex items-center gap-4">
                      {imageUrl ? (
                        <div className="relative w-36 h-24 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                          <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setImageUrl('')}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 shadow">
                            <span className="material-symbols-outlined text-[13px]">close</span>
                          </button>
                        </div>
                      ) : (
                        <div className="w-36 h-24 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 shrink-0 text-xs">
                          <span className="material-symbols-outlined text-xl mb-1">image</span>
                          Chưa chọn ảnh
                        </div>
                      )}
                      <label className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-bold cursor-pointer">
                        <span className="material-symbols-outlined text-sm">upload</span>
                        Tải ảnh lên
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
                    <button type="button" onClick={() => { resetForm(); setShowForm(false); }}
                      className="px-5 py-2.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-semibold">
                      Hủy
                    </button>
                    <button type="submit"
                      className="px-5 py-2.5 bg-[#1a6c3a] hover:bg-[#155c30] text-white rounded-lg text-sm font-bold shadow-sm">
                      {editMode ? 'Cập nhật hoạt động' : 'Tạo hoạt động mới'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* Activity List */
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                {/* List header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-gray-100 gap-3">
                  <h3 className="font-bold text-gray-900 text-base">Danh sách hoạt động đã tạo</h3>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={activitySearch}
                      onChange={e => setActivitySearch(e.target.value)}
                      placeholder="Tìm tên hoạt động..."
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6c3a] w-48"
                    />
                    <button className="flex items-center gap-1.5 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
                      <span className="material-symbols-outlined text-sm">filter_list</span>
                      Bộ lọc
                    </button>
                  </div>
                </div>

                {filteredCampaigns.length === 0 ? (
                  <div className="p-16 text-center">
                    <span className="material-symbols-outlined text-gray-300 text-5xl">campaign</span>
                    <p className="text-sm text-gray-400 italic mt-3">
                      {activitySearch ? 'Không tìm thấy hoạt động nào.' : 'Bạn chưa tạo hoạt động nào.'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredCampaigns.map(act => {
                      const isCompleted = act.status === 'Completed';
                      const isOpen = act.status === 'Open' || act.status === 'Full';
                      const isPending = act.status === 'Pending Review';
                      const approvedCount = registrations.filter(r => r.activity_id === act._id && (r.status === 'Approved' || r.status === 'Completed')).length;

                      return (
                        <div key={act._id} className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 gap-3 hover:bg-gray-50 transition-colors">
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <a href={`#/activity/${act._id}`}
                                className="font-semibold text-sm text-[#1a6c3a] hover:underline truncate max-w-[300px]">
                                {act.title}
                              </a>
                              <ActivityStatusBadge status={act.status} />
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">calendar_month</span>
                                {new Date(act.start_date).toLocaleDateString('vi-VN')}
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">group</span>
                                {approvedCount}/{act.limit_volunteers}
                              </span>
                            </div>
                          </div>

                          {/* Action buttons per status */}
                          <div className="flex items-center gap-2 shrink-0">
                            {isPending && (
                              <button onClick={() => handleEditCampaignClick(act)}
                                className="border border-gray-300 text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-semibold">
                                Sửa
                              </button>
                            )}
                            {isOpen && (
                              <>
                                <button
                                  onClick={() => { setActiveTab('registrations'); setRegSubTab('pending'); }}
                                  className="bg-[#1a6c3a] hover:bg-[#155c30] text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
                                  Duyệt đơn
                                </button>
                                <button onClick={() => handleEditCampaignClick(act)}
                                  className="border border-gray-300 text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-semibold">
                                  Sửa
                                </button>
                              </>
                            )}
                            {isCompleted && (
                              <button
                                onClick={() => { setActiveTab('attendance'); setSelectedActivityId(act._id); }}
                                className="bg-[#1a6c3a] hover:bg-[#155c30] text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
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
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            {/* Sub-tabs + Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-gray-100 gap-3">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setRegSubTab('pending')}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${regSubTab === 'pending' ? 'bg-[#1a6c3a] text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                >
                  Chờ duyệt ({pendingCount})
                </button>
                <button
                  onClick={() => setRegSubTab('approved')}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${regSubTab === 'approved' ? 'bg-[#1a6c3a] text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                >
                  Đã chấp nhận ({approvedCount})
                </button>
                <button
                  onClick={() => setRegSubTab('rejected')}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${regSubTab === 'rejected' ? 'bg-[#1a6c3a] text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
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
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a6c3a] w-52"
                />
                <button className="flex items-center gap-1.5 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
                  <span className="material-symbols-outlined text-sm">filter_list</span>
                  Bộ lọc
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold uppercase tracking-wider text-gray-500">
                    <th className="px-5 py-3">Tình nguyện viên</th>
                    <th className="px-5 py-3">Hoạt động đăng ký</th>
                    <th className="px-5 py-3">Khu vực</th>
                    <th className="px-5 py-3">Kỹ năng rút gọn</th>
                    <th className="px-5 py-3">Hồ sơ</th>
                    <th className="px-5 py-3">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-800">
                  {allOrgRegs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400">
                        Không có đơn đăng ký nào ở trạng thái này.
                      </td>
                    </tr>
                  ) : (
                    allOrgRegs.map(reg => {
                      const act = activities.find(a => a._id === reg.activity_id);
                      return (
                        <tr key={reg._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-4 font-semibold">{reg.denormalized_volunteer.name}</td>
                          <td className="px-5 py-4 text-gray-600 max-w-[200px] truncate">{act?.title || '—'}</td>
                          <td className="px-5 py-4 text-gray-500">{act?.location?.province || '—'}</td>
                          <td className="px-5 py-4 text-gray-500">—</td>
                          <td className="px-5 py-4">
                            <a href={`#/profile?userId=${reg.volunteer_id}`}
                              className="text-[#1a6c3a] hover:underline text-xs font-semibold">
                              Xem hồ sơ
                            </a>
                          </td>
                          <td className="px-5 py-4">
                            {reg.status === 'Pending' ? (
                              <div className="flex gap-2">
                                <button onClick={() => handleApprove(reg._id)}
                                  className="bg-[#1a6c3a] hover:bg-[#155c30] text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
                                  Duyệt
                                </button>
                                <button onClick={() => handleReject(reg._id)}
                                  className="border border-red-300 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-semibold">
                                  Từ chối
                                </button>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
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
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className="font-bold text-gray-900 text-base">Điểm danh tình nguyện viên</h3>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Chọn chiến dịch:</label>
                <select
                  value={selectedActivityId}
                  onChange={e => setSelectedActivityId(e.target.value)}
                  className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#1a6c3a] text-sm bg-white min-w-[240px]"
                >
                  <option value="">-- Chọn hoạt động để điểm danh --</option>
                  {completedCampaigns.map(act => (
                    <option key={act._id} value={act._id}>{act.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="border border-dashed border-gray-300 rounded-xl overflow-hidden">
              {!selectedActivityId ? (
                <p className="py-12 text-center text-sm text-gray-400">
                  Vui lòng chọn chiến dịch đã kết thúc để tiến hành điểm danh.
                </p>
              ) : selectedRegs.filter(r => r.status === 'Approved' || r.status === 'Completed' || r.status === 'Absent').length === 0 ? (
                <p className="py-12 text-center text-sm text-gray-400">
                  Chưa có tình nguyện viên đã được duyệt cho chiến dịch này.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold uppercase tracking-wider text-gray-500">
                        <th className="px-5 py-3">Họ và tên</th>
                        <th className="px-5 py-3">Số điện thoại</th>
                        <th className="px-5 py-3">Trạng thái đăng ký</th>
                        <th className="px-5 py-3">Điểm danh tham gia</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-800">
                      {selectedRegs.filter(r => r.status === 'Approved' || r.status === 'Completed' || r.status === 'Absent').map(reg => {
                        const canCheckIn = reg.status === 'Approved';
                        const isCompleted = reg.status === 'Completed';
                        const isAbsent = reg.status === 'Absent';
                        return (
                          <tr key={reg._id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-4 font-semibold">{reg.denormalized_volunteer.name}</td>
                            <td className="px-5 py-4 text-gray-500">{reg.denormalized_volunteer.phone || '—'}</td>
                            <td className="px-5 py-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                reg.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                                reg.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {reg.status === 'Approved' ? 'Đã duyệt' : reg.status === 'Completed' ? 'Đã tham gia' : 'Vắng mặt'}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              {canCheckIn ? (
                                <div className="flex gap-2">
                                  <button onClick={() => handleCheckIn(reg._id, 'Completed')}
                                    className="bg-[#1a6c3a] hover:bg-[#155c30] text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
                                    Có mặt
                                  </button>
                                  <button onClick={() => handleCheckIn(reg._id, 'Absent')}
                                    className="border border-red-300 hover:bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold">
                                    Vắng mặt
                                  </button>
                                </div>
                              ) : isCompleted ? (
                                <span className="text-[#1a6c3a] font-bold text-xs flex items-center gap-1">
                                  <span className="material-symbols-outlined text-sm">check_circle</span>
                                  Có mặt
                                </span>
                              ) : isAbsent ? (
                                <span className="text-red-600 font-bold text-xs flex items-center gap-1">
                                  <span className="material-symbols-outlined text-sm">cancel</span>
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
