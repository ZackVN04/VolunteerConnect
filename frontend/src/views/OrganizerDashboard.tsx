import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { Activity } from '../context/AppContext';
import { mediaService } from '../services/apiService';

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
    'Draft': { label: 'Bản nháp', cls: 'bg-slate-100 text-slate-600 border border-slate-200/50' },
    'Pending Review': { label: 'Chờ duyệt', cls: 'bg-[#fef7e0] text-[#b06000] border border-[#b06000]/10' },
    'Open': { label: 'Đang tuyển', cls: 'bg-emerald-50 text-[#006d37] border border-emerald-100/50' },
    'Full': { label: 'Đã đầy', cls: 'bg-teal-50 text-teal-800 border border-teal-100/50' },
    'Ongoing': { label: 'Đang diễn ra', cls: 'bg-blue-50 text-blue-800 border border-blue-100/50' },
    'Completed': { label: 'Đã kết thúc', cls: 'bg-slate-100 text-slate-600 border border-slate-200/50' }, // gray background matches mockup
    'Rejected': { label: 'Bị từ chối', cls: 'bg-red-50 text-red-700 border border-red-200/50' },
    'Cancelled': { label: 'Đã hủy', cls: 'bg-slate-50 text-slate-500 border border-slate-100/50' },
  };
  const s = map[status] || { label: status, cls: 'bg-slate-100 text-slate-600' };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${s.cls}`}>{s.label}</span>;
};

const formatDateTimeToISO = (dateStr: string, defaultTime: string): string => {
  if (!dateStr) return '';
  if (dateStr.endsWith('Z') || dateStr.includes('+')) return dateStr;
  
  let normalized = dateStr.replace(' ', 'T');
  if (!normalized.includes('T')) {
    normalized = `${normalized}T${defaultTime}`;
  }
  
  const [datePart, timePart] = normalized.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  
  const localDate = new Date(year, month - 1, day, hours, minutes);
  return localDate.toISOString();
};

const formatISOToLocalInput = (isoStr: string): string => {
  if (!isoStr) return '';
  const date = new Date(isoStr);
  if (isNaN(date.getTime())) return '';
  
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const OrganizerDashboard: React.FC = () => {
  const {
    currentUser, activities, registrations,
    createActivity, editActivity,
    approveRegistration, cancelOrRejectRegistration, updateParticipation,
    bulkReviewRegistrations,
    showNotification, showPrompt, showConfirm
  } = useApp();

  // Tabs theo mockup: Tổng quan | Hoạt động | Đăng ký | Điểm danh
  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'registrations' | 'attendance'>('overview');
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');

  // Registration sub-tab filter
  const [regSubTab, setRegSubTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  // Search filter for activities tab
  const [activitySearch, setActivitySearch] = useState('');
  const [activityStatusFilter, setActivityStatusFilter] = useState<string>('All');
  const [activityCategoryFilter, setActivityCategoryFilter] = useState<string>('All');

  // Search filter for registrations tab
  const [regSearch, setRegSearch] = useState('');
  const [regActivityFilter, setRegActivityFilter] = useState<string>('All');

  const [showActivityFilters, setShowActivityFilters] = useState(false);
  const [showRegFilters, setShowRegFilters] = useState(false);
  const [checkedRegIds, setCheckedRegIds] = useState<string[]>([]);
  const [selectedRegIds, setSelectedRegIds] = useState<string[]>([]);
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState('All');

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
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showNotification('Dung lượng hình ảnh phải nhỏ hơn 2MB để upload!', 'error');
      return;
    }
    
    setIsUploadingImage(true);
    try {
      const res = await mediaService.upload(file);
      setImageUrl(res.url);
      showNotification('Tải ảnh lên thành công!', 'success');
    } catch (err: any) {
      console.error(err);
      showNotification(err.response?.data?.detail || 'Không thể tải ảnh lên. Vui lòng thử lại.', 'error');
    } finally {
      setIsUploadingImage(false);
    }
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

  useEffect(() => {
    setCheckedRegIds([]);
    setAttendanceSearch('');
    setAttendanceStatusFilter('All');
  }, [selectedActivityId]);

  useEffect(() => {
    setCheckedRegIds([]);
    setSelectedRegIds([]);
  }, [activeTab, regSubTab]);

  if (!currentUser) return null;

  // Stats
  const openCampaigns = myCampaigns.filter(a => a.status === 'Open' || a.status === 'Full' || a.status === 'Ongoing').length;
  const myCampaignIds = myCampaigns.map(c => c._id);
  const organizerRegs = registrations.filter(r => myCampaignIds.includes(r.activity_id));
  const pendingApprovalCount = organizerRegs.filter(r => r.status === 'Pending').length;
  const totalVolunteers = organizerRegs.filter(r => r.status === 'Approved' || r.status === 'Completed').length;

  // Filtered campaigns for activities tab
  const filteredCampaigns = myCampaigns
    .filter(a => a.title.toLowerCase().includes(activitySearch.toLowerCase()))
    .filter(a => {
      if (activityStatusFilter !== 'All') {
        if (activityStatusFilter === 'Open') {
          return a.status === 'Open' || a.status === 'Full' || a.status === 'Ongoing';
        }
        return a.status === activityStatusFilter;
      }
      return true;
    })
    .filter(a => {
      if (activityCategoryFilter !== 'All') {
        return a.categories.includes(activityCategoryFilter);
      }
      return true;
    });

  // All regs across organizer's campaigns, filtered by sub-tab
  const allOrgRegs = organizerRegs
    .filter(r => {
      if (regSubTab === 'pending') return r.status === 'Pending';
      if (regSubTab === 'approved') return r.status === 'Approved' || r.status === 'Completed';
      if (regSubTab === 'rejected') return r.status === 'Rejected' || r.status === 'Cancelled';
      return true;
    })
    .filter(r => r.denormalized_volunteer.name.toLowerCase().includes(regSearch.toLowerCase()))
    .filter(r => {
      if (regActivityFilter !== 'All') {
        return r.activity_id === regActivityFilter;
      }
      return true;
    });

  const pendingCount = organizerRegs.filter(r => r.status === 'Pending').length;
  const approvedCount = organizerRegs.filter(r => r.status === 'Approved' || r.status === 'Completed').length;
  const rejectedCount = organizerRegs.filter(r => r.status === 'Rejected' || r.status === 'Cancelled').length;

  // Selected activity regs for attendance
  const selectedRegs = registrations.filter(r => r.activity_id === selectedActivityId);
  // Completed/past campaigns for attendance
  const completedCampaigns = myCampaigns.filter(a => a.status === 'Completed' || a.status === 'Ongoing');

  const filteredAttendanceRegs = selectedRegs
    .filter(r => r.status === 'Approved' || r.status === 'Completed' || r.status === 'Absent')
    .filter(r => {
      const q = attendanceSearch.toLowerCase().trim();
      if (!q) return true;
      const nameMatch = r.denormalized_volunteer.name.toLowerCase().includes(q);
      const phoneMatch = (r.denormalized_volunteer.phone || '').toLowerCase().includes(q);
      return nameMatch || phoneMatch;
    })
    .filter(r => {
      if (attendanceStatusFilter === 'All') return true;
      if (attendanceStatusFilter === 'Approved') return r.status === 'Approved';
      if (attendanceStatusFilter === 'Completed') return r.status === 'Completed';
      if (attendanceStatusFilter === 'Absent') return r.status === 'Absent';
      return true;
    });

  const eligibleRegs = filteredAttendanceRegs.filter(r => r.status === 'Approved');

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
    setStartDate(formatISOToLocalInput(act.start_date));
    setEndDate(formatISOToLocalInput(act.end_date));
    setLimitVolunteers(act.limit_volunteers);
    setRequirements(act.requirements || '');
    setImageUrl(act.image_url || '');
    setShowForm(true);
    setActiveTab('activities');
  };



  const handleSubmitActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
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
        start_date: formatDateTimeToISO(startDate, '08:00'),
        end_date: formatDateTimeToISO(endDate, '17:00'),
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
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleApprove = async (regId: string) => {
    const res = await approveRegistration(regId);
    if (res && res.success) {
      showNotification('Đã duyệt tình nguyện viên này tham gia.', 'success');
    } else {
      showNotification(res?.error || 'Có lỗi xảy ra khi duyệt đăng ký.', 'error');
    }
  };

  const handleReject = (regId: string) => {
    showPrompt(
      'Nhập lý do từ chối đăng ký:',
      async (reason) => {
        if (!reason.trim()) { showNotification('Vui lòng nhập lý do từ chối.', 'error'); return; }
        const res = await cancelOrRejectRegistration(regId, reason);
        if (res && res.success) {
          showNotification('Đã từ chối đơn đăng ký.', 'success');
        } else {
          showNotification(res?.error || 'Có lỗi xảy ra khi từ chối đăng ký.', 'error');
        }
      },
      'Từ chối đăng ký',
      'Lý do từ chối...'
    );
  };

  const handleBulkApproveRegistrations = async () => {
    if (selectedRegIds.length === 0) return;
    const res = await bulkReviewRegistrations(selectedRegIds, true);
    if (res.success) {
      showNotification(res.error || 'Đã duyệt đơn đăng ký hàng loạt thành công.', 'success');
      setSelectedRegIds([]);
    } else {
      showNotification(res.error || 'Duyệt hàng loạt thất bại.', 'error');
    }
  };

  const handleBulkRejectRegistrations = () => {
    if (selectedRegIds.length === 0) return;
    showPrompt(
      'Nhập lý do từ chối đăng ký hàng loạt:',
      async (feedback) => {
        const trimmed = feedback.trim();
        if (trimmed.length < 5 || trimmed.length > 500) {
          showNotification('Lý do từ chối phải từ 5 đến 500 ký tự.', 'error');
          return;
        }
        const res = await bulkReviewRegistrations(selectedRegIds, false, trimmed);
        if (res.success) {
          showNotification(res.error || 'Đã từ chối hàng loạt thành công.', 'success');
          setSelectedRegIds([]);
        } else {
          showNotification(res.error || 'Từ chối hàng loạt thất bại.', 'error');
        }
      },
      'Từ chối đăng ký hàng loạt',
      'Lý do từ chối...'
    );
  };

  const handleCheckIn = (regId: string, status: 'Completed' | 'Absent') => {
    updateParticipation(regId, status);
    showNotification(`Đã điểm danh: ${status === 'Completed' ? 'Có mặt' : 'Vắng mặt'}`, 'success');
  };

  const handleBulkCheckIn = async (status: 'Completed' | 'Absent') => {
    if (checkedRegIds.length === 0) return;
    showConfirm(
      `Bạn có chắc chắn muốn điểm danh "${status === 'Completed' ? 'Có mặt' : 'Vắng mặt'}" cho ${checkedRegIds.length} tình nguyện viên đã chọn?`,
      async () => {
        let successCount = 0;
        let failCount = 0;
        let lastError = '';
        for (const regId of checkedRegIds) {
          const res = await updateParticipation(regId, status);
          if (res && res.success === false) {
            failCount++;
            lastError = res.error || 'Lỗi không xác định';
          } else {
            successCount++;
          }
        }
        setCheckedRegIds([]);
        if (failCount === 0) {
          showNotification(`Đã điểm danh thành công ${successCount} tình nguyện viên.`, 'success');
        } else {
          showNotification(`Thành công: ${successCount}, Thất bại: ${failCount}.${lastError ? ` Lỗi: ${lastError}` : ''}`, 'error');
        }
      },
      'Điểm danh hàng loạt'
    );
  };

  // Tab button style helper (Matches mockup style)
  const tabCls = (tab: string) =>
    `pb-3 px-1 font-bold text-sm transition-all border-b-2 whitespace-nowrap cursor-pointer ${activeTab === tab
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
            {/* Create/Edit Form as Modal */}
            {showForm && (
              <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 w-full max-w-[800px] shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto animate-scaleUp text-left">
                  {/* Close button */}
                  <button 
                    type="button"
                    onClick={() => { resetForm(); setShowForm(false); }}
                    className="absolute top-4 right-5 text-slate-400 hover:text-slate-650 text-2xl font-bold transition-colors cursor-pointer border-none bg-transparent"
                  >
                    ×
                  </button>
                  <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-slate-100 pb-3 font-headline-md">
                    {editMode ? 'Chỉnh sửa hoạt động' : 'Tạo hoạt động mới'}
                  </h2>

                  <form onSubmit={handleSubmitActivity} className="space-y-5" noValidate>
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
                      {isUploadingImage ? (
                        <div className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-400 rounded-xl text-xs font-bold bg-slate-50">
                          <span className="animate-spin text-sm">⌛</span>
                          Đang tải lên...
                        </div>
                      ) : (
                        <label className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm">
                          <span className="material-symbols-outlined text-sm text-slate-500">upload</span>
                          Tải ảnh lên
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
                    <button type="button" onClick={() => { resetForm(); setShowForm(false); }}
                      className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 text-sm font-bold cursor-pointer transition-all">
                      Hủy
                    </button>
                    <button type="submit" disabled={isSubmitting}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all ${
                        isSubmitting 
                          ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                          : 'bg-[#006d37] hover:bg-[#005027] text-white cursor-pointer'
                      }`}>
                      {isSubmitting ? 'Đang gửi...' : (editMode ? 'Cập nhật hoạt động' : 'Tạo hoạt động mới')}
                    </button>

                  </div>
                </form>
              </div>
            </div>
          )}

            {/* Activity List matching mockup */}
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
                    <button
                      type="button"
                      onClick={() => setShowActivityFilters(!showActivityFilters)}
                      className={`flex items-center gap-1.5 border rounded-xl px-4 py-2 text-xs font-bold cursor-pointer shadow-sm transition-all ${
                        showActivityFilters
                          ? 'border-[#006d37] bg-[#006d37] text-white'
                          : 'border-[#006d37] text-[#006d37] hover:bg-emerald-50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px] font-bold">filter_list</span>
                      Bộ lọc
                      {(activityStatusFilter !== 'All' || activityCategoryFilter !== 'All') && (
                        <span className={`w-1.5 h-1.5 rounded-full ${showActivityFilters ? 'bg-white' : 'bg-[#006d37]'}`} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Collapsible Filters Panel */}
                {showActivityFilters && (
                  <div className="flex flex-wrap items-center gap-4 px-5 py-4 bg-slate-50/50 border-b border-slate-100 animate-slideDown">
                    <div className="flex flex-col gap-1 text-left">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trạng thái</label>
                      <select
                        value={activityStatusFilter}
                        onChange={e => setActivityStatusFilter(e.target.value)}
                        className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#006d37] bg-white cursor-pointer shadow-sm text-slate-700 min-w-[150px]"
                      >
                        <option value="All">Tất cả trạng thái</option>
                        <option value="Draft">Bản nháp</option>
                        <option value="Pending Review">Chờ duyệt</option>
                        <option value="Open">Đang tuyển/diễn ra</option>
                        <option value="Completed">Đã kết thúc</option>
                        <option value="Rejected">Bị từ chối</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1 text-left">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lĩnh vực</label>
                      <select
                        value={activityCategoryFilter}
                        onChange={e => setActivityCategoryFilter(e.target.value)}
                        className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#006d37] bg-white cursor-pointer shadow-sm text-slate-700 min-w-[150px]"
                      >
                        <option value="All">Tất cả lĩnh vực</option>
                        <option value="Môi trường">Môi trường</option>
                        <option value="Giáo dục">Giáo dục</option>
                        <option value="Y tế">Y tế</option>
                        <option value="Từ thiện">Từ thiện</option>
                        <option value="Gây quỹ">Gây quỹ</option>
                      </select>
                    </div>
                    {(activitySearch || activityStatusFilter !== 'All' || activityCategoryFilter !== 'All') && (
                      <button
                        onClick={() => {
                          setActivitySearch('');
                          setActivityStatusFilter('All');
                          setActivityCategoryFilter('All');
                        }}
                        className="self-end mb-1 text-red-650 hover:text-red-700 font-bold text-xs flex items-center gap-0.5 cursor-pointer h-8"
                      >
                        <span className="material-symbols-outlined text-sm">clear</span>
                        Xóa lọc
                      </button>
                    )}
                  </div>
                )}

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
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${regSubTab === 'pending'
                      ? 'bg-white text-[#006d37] shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  Chờ duyệt ({pendingCount})
                </button>
                <button
                  onClick={() => setRegSubTab('approved')}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${regSubTab === 'approved'
                      ? 'bg-white text-[#006d37] shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  Đã chấp nhận ({approvedCount})
                </button>
                <button
                  onClick={() => setRegSubTab('rejected')}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${regSubTab === 'rejected'
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
                <button
                  type="button"
                  onClick={() => setShowRegFilters(!showRegFilters)}
                  className={`flex items-center gap-1.5 border rounded-xl px-4 py-2 text-xs font-bold cursor-pointer shadow-sm transition-all ${
                    showRegFilters
                      ? 'border-[#006d37] bg-[#006d37] text-white'
                      : 'border-[#006d37] text-[#006d37] hover:bg-emerald-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px] font-bold">filter_list</span>
                  Bộ lọc
                  {regActivityFilter !== 'All' && (
                    <span className={`w-1.5 h-1.5 rounded-full ${showRegFilters ? 'bg-white' : 'bg-[#006d37]'}`} />
                  )}
                </button>
              </div>
            </div>

            {/* Collapsible Filters Panel for Registrations */}
            {showRegFilters && (
              <div className="flex flex-wrap items-center gap-4 px-5 py-4 bg-slate-50/50 border-b border-slate-100 animate-slideDown">
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hoạt động đăng ký</label>
                  <select
                    value={regActivityFilter}
                    onChange={e => setRegActivityFilter(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#006d37] bg-white cursor-pointer shadow-sm text-slate-700 min-w-[240px] max-w-[360px]"
                  >
                    <option value="All">Tất cả hoạt động</option>
                    {myCampaigns.map(act => (
                      <option key={act._id} value={act._id}>{act.title}</option>
                    ))}
                  </select>
                </div>
                {(regSearch || regActivityFilter !== 'All') && (
                  <button
                    onClick={() => {
                      setRegSearch('');
                      setRegActivityFilter('All');
                    }}
                    className="self-end mb-1 text-red-650 hover:text-red-700 font-bold text-xs flex items-center gap-0.5 cursor-pointer h-8"
                  >
                    <span className="material-symbols-outlined text-sm">clear</span>
                    Xóa lọc
                  </button>
                )}
              </div>
            )}

            {/* Bulk actions bar */}
            {selectedRegIds.length > 0 && (
              <div className="bg-[#e8f5e9]/70 border-y border-emerald-100 px-6 py-4 flex items-center justify-between animate-fadeIn">
                <div className="text-xs text-[#004d40] font-bold">
                  Đã chọn <span className="text-[#00796b] text-sm">{selectedRegIds.length}</span> đơn đăng ký
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleBulkApproveRegistrations}
                    className="px-4 py-2 bg-[#006d37] text-white rounded-xl text-xs font-bold shadow hover:bg-[#005229] transition-colors cursor-pointer border-0"
                  >
                    Duyệt hàng loạt
                  </button>
                  <button
                    onClick={handleBulkRejectRegistrations}
                    className="px-4 py-2 bg-red-650 text-white rounded-xl text-xs font-bold shadow hover:bg-red-700 transition-colors cursor-pointer border-0"
                  >
                    Từ chối hàng loạt
                  </button>
                </div>
              </div>
            )}

            {/* Table with Uppercase headers */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    {regSubTab === 'pending' && allOrgRegs.length > 0 && (
                      <th className="px-6 py-4 w-12 text-center">
                        <input
                          type="checkbox"
                          checked={allOrgRegs.length > 0 && allOrgRegs.every(r => selectedRegIds.includes(r._id))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRegIds(allOrgRegs.map(r => r._id));
                            } else {
                              setSelectedRegIds([]);
                            }
                          }}
                          className="w-4 h-4 rounded text-[#006d37] border-slate-300 focus:ring-[#006d37] cursor-pointer"
                        />
                      </th>
                    )}
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
                      <td colSpan={regSubTab === 'pending' ? 7 : 6} className="px-6 py-12 text-center text-xs text-slate-400 font-semibold">
                        Không có đơn đăng ký nào ở trạng thái này.
                      </td>
                    </tr>
                  ) : (
                    allOrgRegs.map(reg => {
                      const act = activities.find(a => a._id === reg.activity_id);
                      return (
                        <tr key={reg._id} className="hover:bg-slate-50/50 transition-colors animate-fadeIn">
                          {regSubTab === 'pending' && (
                            <td className="px-6 py-4 text-center">
                              <input
                                type="checkbox"
                                checked={selectedRegIds.includes(reg._id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedRegIds(prev => [...prev, reg._id]);
                                  } else {
                                    setSelectedRegIds(prev => prev.filter(id => id !== reg._id));
                                  }
                                }}
                                className="w-4 h-4 rounded text-[#006d37] border-slate-300 focus:ring-[#006d37] cursor-pointer"
                              />
                            </td>
                          )}
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
            <div className="flex flex-col gap-4 pb-4 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

              {/* Filters & Bulk actions block */}
              {selectedActivityId && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 animate-fadeIn">
                  {/* Left: Bulk Action Buttons */}
                  <div className="flex items-center gap-2">
                    {checkedRegIds.length > 0 ? (
                      <>
                        <span className="text-xs font-bold text-[#006d37] bg-[#e8f5e9] px-3 py-1.5 rounded-xl border border-emerald-100 shadow-sm animate-fadeIn">
                          Đã chọn {checkedRegIds.length}
                        </span>
                        <button
                          onClick={() => handleBulkCheckIn('Completed')}
                          className="flex items-center gap-1.5 bg-[#006d37] hover:bg-[#005027] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px] font-bold">check_circle</span>
                          Có mặt hàng loạt
                        </button>
                        <button
                          onClick={() => handleBulkCheckIn('Absent')}
                          className="flex items-center gap-1.5 border border-red-300 text-red-650 hover:bg-red-50 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px] font-bold">cancel</span>
                          Vắng mặt hàng loạt
                        </button>
                      </>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400 italic">
                        Chọn tình nguyện viên để điểm danh hàng loạt
                      </span>
                    )}
                  </div>

                  {/* Right: Filters */}
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={attendanceSearch}
                      onChange={e => setAttendanceSearch(e.target.value)}
                      placeholder="Tìm tên hoặc SĐT..."
                      className="border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-[#006d37] focus:ring-2 focus:ring-[#006d37]/10 w-44 shadow-sm transition-all"
                    />
                    <select
                      value={attendanceStatusFilter}
                      onChange={e => setAttendanceStatusFilter(e.target.value)}
                      className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#006d37] bg-white cursor-pointer shadow-sm text-slate-700 w-36"
                    >
                      <option value="All">Tất cả trạng thái</option>
                      <option value="Approved">Chờ điểm danh</option>
                      <option value="Completed">Có mặt</option>
                      <option value="Absent">Vắng mặt</option>
                    </select>
                    {(attendanceSearch || attendanceStatusFilter !== 'All') && (
                      <button
                        onClick={() => {
                          setAttendanceSearch('');
                          setAttendanceStatusFilter('All');
                        }}
                        className="text-red-650 hover:text-red-700 font-bold text-xs flex items-center gap-0.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">clear</span>
                        Xóa lọc
                      </button>
                    )}
                  </div>
                </div>
              )}
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
              ) : filteredAttendanceRegs.length === 0 ? (
                <div className="border border-slate-150 rounded-2xl p-10 text-center text-xs text-slate-400 font-semibold bg-slate-50">
                  Không tìm thấy tình nguyện viên phù hợp với bộ lọc.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        <th className="pl-6 py-4 w-12 text-center">
                          <input
                            type="checkbox"
                            className="rounded text-[#006d37] focus:ring-[#006d37]/20 cursor-pointer w-4 h-4 animate-scaleIn"
                            checked={
                              eligibleRegs.length > 0 &&
                              eligibleRegs.every(r => checkedRegIds.includes(r._id))
                            }
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCheckedRegIds(eligibleRegs.map(r => r._id));
                              } else {
                                setCheckedRegIds([]);
                              }
                            }}
                          />
                        </th>
                        <th className="px-6 py-4">Họ và tên</th>
                        <th className="px-6 py-4">Số điện thoại</th>
                        <th className="px-6 py-4">Trạng thái đăng ký</th>
                        <th className="px-6 py-4">Điểm danh tham gia</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-750">
                      {filteredAttendanceRegs.map(reg => {
                        const canCheckIn = reg.status === 'Approved';
                        const isCompleted = reg.status === 'Completed';
                        const isAbsent = reg.status === 'Absent';
                        return (
                          <tr key={reg._id} className="hover:bg-slate-50/50 transition-colors animate-fadeIn">
                            <td className="pl-6 py-4 w-12 text-center">
                              {canCheckIn ? (
                                <input
                                  type="checkbox"
                                  className="rounded text-[#006d37] focus:ring-[#006d37]/20 cursor-pointer w-4 h-4"
                                  checked={checkedRegIds.includes(reg._id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setCheckedRegIds(prev => [...prev, reg._id]);
                                    } else {
                                      setCheckedRegIds(prev => prev.filter(id => id !== reg._id));
                                    }
                                  }}
                                />
                              ) : (
                                <input
                                  type="checkbox"
                                  disabled
                                  className="rounded text-slate-300 bg-slate-100 cursor-not-allowed w-4 h-4 opacity-50"
                                  checked={isCompleted}
                                />
                              )}
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-800">{reg.denormalized_volunteer.name}</td>
                            <td className="px-6 py-4 text-slate-500 font-semibold">{reg.denormalized_volunteer.phone || '—'}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${reg.status === 'Approved' ? 'bg-[#e8f5e9] text-[#006d37] border-emerald-100/50' :
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
