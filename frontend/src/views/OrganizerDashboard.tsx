import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { Activity } from '../context/AppContext';

export const OrganizerDashboard: React.FC = () => {
  const { 
    currentUser, activities, registrations, 
    createActivity, editActivity, cancelActivity,
    approveRegistration, cancelOrRejectRegistration, updateParticipation 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'my-activities' | 'registrations' | 'attendance'>('my-activities');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  
  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);

  // Form Fields State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Môi trường');
  const [province, setProvince] = useState('TP. Hồ Chí Minh');
  const [district, setDistrict] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('17:00');
  const [limitVolunteers, setLimitVolunteers] = useState(10);
  const [requirements, setRequirements] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Rejection Dialog State
  const [rejectingRegId, setRejectingRegId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Listen to create=true parameter in URL
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash.includes('create=true')) {
        setShowCreateModal(true);
        setEditMode(false);
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (!currentUser) return null;

  // Filter activities created by this organizer
  const myActs = activities.filter(a => a.organizer_id === currentUser._id);

  // Filter registrations for selected activity
  const actRegs = registrations.filter(r => r.activity_id === selectedActivity?._id);

  // Filter approved attendees for attendance tab
  const approvedAttendees = actRegs.filter(r => r.status === 'Approved');

  const handleOpenCreateModal = () => {
    setEditMode(false);
    setTitle('');
    setDescription('');
    setCategory('Môi trường');
    setProvince('TP. Hồ Chí Minh');
    setDistrict('');
    setAddressDetail('');
    setStartDate('');
    setStartTime('08:00');
    setEndDate('');
    setEndTime('17:00');
    setLimitVolunteers(10);
    setRequirements('');
    setImageUrl('');
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (act: Activity) => {
    setEditMode(true);
    setEditingActivityId(act._id);
    setTitle(act.title);
    setDescription(act.description);
    setCategory(act.categories[0] || 'Môi trường');
    setProvince(act.location.province);
    setDistrict(act.location.district);
    setAddressDetail(act.location.address_detail);
    
    // Split ISO Dates
    const sDate = act.start_date.split('T')[0];
    const sTime = act.start_date.split('T')[1]?.substring(0, 5) || '08:00';
    const eDate = act.end_date.split('T')[0];
    const eTime = act.end_date.split('T')[1]?.substring(0, 5) || '17:00';

    setStartDate(sDate);
    setStartTime(sTime);
    setEndDate(eDate);
    setEndTime(eTime);
    setLimitVolunteers(act.limit_volunteers);
    setRequirements(act.requirements || '');
    setImageUrl(act.image_url || '');
    setShowCreateModal(true);
  };

  const handleSubmitActivity = (submitForReview: boolean) => {
    if (!title.trim() || !description.trim() || !district.trim() || !addressDetail.trim() || !startDate) {
      alert('Vui lòng điền đầy đủ các thông tin bắt buộc');
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
      start_date: `${startDate}T${startTime}:00.000Z`,
      end_date: `${endDate || startDate}T${endTime}:00.000Z`,
      limit_volunteers: Number(limitVolunteers),
      requirements: requirements || null,
      image_url: imageUrl.trim() || 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?q=80&w=600'
    };

    if (editMode && editingActivityId) {
      editActivity(editingActivityId, activityData);
      // If submitting, change status
      if (submitForReview) {
        editActivity(editingActivityId, { status: 'Pending Review' });
      }
    } else {
      createActivity(activityData, submitForReview);
    }

    setShowCreateModal(false);
    window.location.hash = '#/organizer/dashboard';
  };

  const handleOpenRegistrations = (act: Activity) => {
    setSelectedActivity(act);
    setActiveTab('registrations');
  };

  const handleOpenAttendance = (act: Activity) => {
    setSelectedActivity(act);
    setActiveTab('attendance');
  };

  const handleConfirmReject = (regId: string) => {
    if (!rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối');
      return;
    }
    cancelOrRejectRegistration(regId, rejectReason);
    setRejectingRegId(null);
    setRejectReason('');
  };

  return (
    <div className="flex-grow w-full max-w-[1280px] mx-auto px-4 md:px-8 py-8 text-left space-y-6">
      {/* Dashboard Top Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-surface-variant pb-4">
        <div>
          <h1 className="font-display-lg-mobile md:font-display-lg text-primary font-bold">Ban Tổ Chức Console</h1>
          <p className="text-sm text-on-surface-variant mt-1">Quản lý chiến dịch tình nguyện của bạn, phê duyệt đơn đăng ký và điểm danh thành viên.</p>
        </div>
        <button 
          onClick={handleOpenCreateModal}
          className="bg-primary text-on-primary hover:bg-tertiary px-6 py-3 rounded-lg font-label-sm text-xs transition-all duration-200 active:scale-95 shadow-sm flex items-center gap-1.5 font-bold"
        >
          <span className="material-symbols-outlined text-sm font-bold">add</span>
          Tạo hoạt động mới
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4">
        <button
          onClick={() => {
            setActiveTab('my-activities');
            setSelectedActivity(null);
          }}
          className={`py-2 px-4 rounded-lg font-semibold text-xs transition-all ${
            activeTab === 'my-activities'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
          }`}
        >
          Hoạt động của tôi ({myActs.length})
        </button>
        {selectedActivity && (
          <>
            <button
              onClick={() => setActiveTab('registrations')}
              className={`py-2 px-4 rounded-lg font-semibold text-xs transition-all ${
                activeTab === 'registrations'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
              }`}
            >
              Duyệt Đăng Ký ({actRegs.length})
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`py-2 px-4 rounded-lg font-semibold text-xs transition-all ${
                activeTab === 'attendance'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
              }`}
            >
              Điểm Danh ({approvedAttendees.length})
            </button>
          </>
        )}
      </div>

      {/* --- Tab 1: My Activities --- */}
      {activeTab === 'my-activities' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {myActs.length === 0 ? (
            <div className="bg-surface-container-lowest col-span-full rounded-xl p-12 border border-surface-variant text-center space-y-3">
              <span className="material-symbols-outlined text-outline text-5xl">campaign</span>
              <p className="text-sm text-on-surface-variant italic">Bạn chưa tạo hoạt động nào.</p>
              <button 
                onClick={handleOpenCreateModal} 
                className="bg-primary text-on-primary hover:bg-tertiary px-5 py-2 rounded-lg font-medium text-xs shadow"
              >
                Tạo hoạt động đầu tiên
              </button>
            </div>
          ) : (
            myActs.map(act => {
              const countPending = registrations.filter(r => r.activity_id === act._id && r.status === 'Pending').length;
              return (
                <div key={act._id} className="bg-surface-container-lowest rounded-lg border border-surface-variant overflow-hidden hover:shadow-sm transition-all flex flex-col justify-between h-[435px]">
                  <div>
                    <div className="h-[192px] w-full bg-surface-container relative shrink-0">
                      <img src={act.image_url || ''} alt="" className="w-full h-full object-cover" />
                      <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold uppercase shadow-sm ${
                        act.status === 'Open' ? 'bg-[#E6F4EA] text-[#137333]' :
                        act.status === 'Draft' ? 'bg-slate-200 text-slate-800' :
                        act.status === 'Pending Review' ? 'bg-amber-100 text-amber-800' :
                        act.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {act.status === 'Open' ? 'Đang Tuyển' : act.status}
                      </div>
                    </div>
                    
                    <div className="p-6 space-y-2">
                      <h4 className="font-headline-md text-on-surface text-base md:text-lg font-bold line-clamp-2 leading-tight mb-2">{act.title}</h4>
                      <div className="space-y-1.5 text-sm text-on-surface-variant">
                        <p className="font-medium flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-base">location_on</span>
                          <span>Khu vực: {act.location.district}, {act.location.province}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-base">group</span>
                          <span>Đăng ký: <strong>{act.approved_volunteers_count}</strong> / {act.limit_volunteers} (Chờ duyệt: {countPending})</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border-t border-surface-variant flex flex-wrap gap-2 mt-auto">
                    {/* Management and approval actions */}
                    {(act.status === 'Draft' || act.status === 'Rejected') && (
                      <button 
                        onClick={() => handleOpenEditModal(act)}
                        className="flex-grow bg-primary text-on-primary hover:bg-tertiary h-[40px] rounded-lg font-bold text-xs transition-colors"
                      >
                        Sửa Nháp
                      </button>
                    )}
                    
                    {act.status !== 'Draft' && act.status !== 'Pending Review' && act.status !== 'Rejected' && (
                      <>
                        <button
                          onClick={() => handleOpenRegistrations(act)}
                          className="flex-grow bg-primary text-on-primary hover:bg-tertiary h-[40px] rounded-lg font-bold text-xs transition-colors relative"
                        >
                          Duyệt Đơn
                          {countPending > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold">
                              {countPending}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => handleOpenAttendance(act)}
                          className="flex-grow bg-secondary-container text-on-secondary-container hover:bg-secondary-fixed h-[40px] rounded-lg font-bold text-xs transition-colors"
                        >
                          Điểm danh
                        </button>
                        {(act.status === 'Open' || act.status === 'Full') && (
                          <button
                            onClick={() => {
                              if (confirm('Bạn có chắc muốn Hủy hoạt động này? Mọi đơn đăng ký liên quan sẽ chuyển sang trạng thái Hủy.')) {
                                cancelActivity(act._id);
                              }
                            }}
                            className="text-red-600 hover:bg-red-50 border border-red-200 px-3 h-[40px] rounded-lg text-xs flex items-center justify-center shrink-0"
                            title="Hủy hoạt động"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* --- Tab 2: Approve registrations --- */}
      {activeTab === 'registrations' && selectedActivity && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-surface-container-lowest p-4 rounded-xl border border-surface-variant">
            <div>
              <span className="text-xs text-on-surface-variant font-bold uppercase">Đang duyệt cho hoạt động:</span>
              <h3 className="font-bold text-on-surface text-base">{selectedActivity.title}</h3>
            </div>
            <button 
              onClick={() => {
                setActiveTab('my-activities');
                setSelectedActivity(null);
              }}
              className="text-xs font-bold text-primary hover:underline"
            >
              Quay lại danh sách
            </button>
          </div>

          <div className="space-y-3">
            {actRegs.length === 0 ? (
              <p className="text-sm text-on-surface-variant italic text-center p-8 bg-surface-container-lowest rounded-xl border border-surface-variant">
                Chưa có tình nguyện viên nào đăng ký hoạt động này.
              </p>
            ) : (
              actRegs.map(reg => {
                const isPending = reg.status === 'Pending';
                const isRejecting = rejectingRegId === reg._id;

                return (
                  <div key={reg._id} className="bg-surface-container-lowest p-5 rounded-xl border border-surface-variant shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Volunteer Details */}
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold">
                          {reg.denormalized_volunteer.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-on-surface text-base">{reg.denormalized_volunteer.name}</h4>
                          <p className="text-xs text-on-surface-variant">SĐT: {reg.denormalized_volunteer.phone} • Email: {reg.denormalized_volunteer.email}</p>
                          <p className="text-[10px] text-outline mt-0.5">Ngày đăng ký: {new Date(reg.created_at).toLocaleDateString('vi-VN')}</p>
                        </div>
                      </div>

                      {/* Registration State */}
                      <div className="flex gap-2">
                        {isPending && !isRejecting && (
                          <>
                            <button
                              onClick={() => setRejectingRegId(reg._id)}
                              className="border border-red-600 text-red-600 hover:bg-red-50 py-1.5 px-4 rounded-full font-bold text-xs transition-colors"
                            >
                              Từ chối
                            </button>
                            <button
                              onClick={() => approveRegistration(reg._id)}
                              className="bg-primary text-on-primary hover:bg-tertiary py-1.5 px-4 rounded-full font-bold text-xs shadow transition-colors"
                            >
                              Duyệt nhận
                            </button>
                          </>
                        )}
                        {!isPending && (
                          <span className={`px-3 py-1 rounded text-xs font-bold uppercase ${
                            reg.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                            reg.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                            reg.status === 'Completed' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {reg.status}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Rejection input sub-panel (Implementing 12-Quản lý dăng ký.html detail) */}
                    {isRejecting && (
                      <div className="bg-surface-container-low p-4 rounded-xl border border-red-200">
                        <label className="block text-xs font-bold text-red-800 mb-2 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">info</span>
                          Lý do từ chối đăng ký (Bắt buộc)
                        </label>
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Nhập lý do từ chối để gửi thông báo cho tình nguyện viên..."
                          rows={2}
                          className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-2.5 text-xs outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                        ></textarea>
                        <div className="flex justify-end gap-2 mt-3 text-xs">
                          <button
                            onClick={() => {
                              setRejectingRegId(null);
                              setRejectReason('');
                            }}
                            className="py-1.5 px-3 rounded hover:bg-surface-variant transition-colors"
                          >
                            Hủy bỏ
                          </button>
                          <button
                            onClick={() => handleConfirmReject(reg._id)}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-4 rounded shadow transition-colors"
                          >
                            Xác nhận từ chối
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* --- Tab 3: Attendance Update --- */}
      {activeTab === 'attendance' && selectedActivity && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-surface-container-lowest p-4 rounded-xl border border-surface-variant">
            <div>
              <span className="text-xs text-on-surface-variant font-bold uppercase">Điểm danh hoạt động kết thúc:</span>
              <h3 className="font-bold text-on-surface text-base">{selectedActivity.title}</h3>
            </div>
            <button 
              onClick={() => {
                setActiveTab('my-activities');
                setSelectedActivity(null);
              }}
              className="text-xs font-bold text-primary hover:underline"
            >
              Quay lại danh sách
            </button>
          </div>

          <div className="space-y-3">
            {approvedAttendees.length === 0 ? (
              <p className="text-sm text-on-surface-variant italic text-center p-8 bg-surface-container-lowest rounded-xl border border-surface-variant">
                Chưa có tình nguyện viên nào được duyệt tham gia để tiến hành điểm danh.
              </p>
            ) : (
              approvedAttendees.map(reg => {
                return (
                  <div key={reg._id} className="bg-surface-container-lowest p-5 rounded-xl border border-surface-variant shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold">
                        {reg.denormalized_volunteer.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-on-surface text-base">{reg.denormalized_volunteer.name}</h4>
                        <p className="text-xs text-on-surface-variant">SĐT: {reg.denormalized_volunteer.phone} • Email: {reg.denormalized_volunteer.email}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          const res = updateParticipation(reg._id, 'Absent');
                          const result = res instanceof Promise ? await res : res;
                          if (!result.success) alert(result.error);
                        }}
                        className="border border-amber-600 text-amber-600 hover:bg-amber-50 py-1.5 px-4 rounded-full font-bold text-xs transition-colors"
                      >
                        Vắng mặt (Absent)
                      </button>
                      <button
                        onClick={async () => {
                          const res = updateParticipation(reg._id, 'Completed');
                          const result = res instanceof Promise ? await res : res;
                          if (!result.success) alert(result.error);
                        }}
                        className="bg-primary text-on-primary hover:bg-tertiary py-1.5 px-4 rounded-full font-bold text-xs shadow transition-colors"
                      >
                        Hoàn thành (Completed)
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* --- CREATE / EDIT ACTIVITY MODAL (11-Tạo hoạt động mới.html layout) --- */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] modal-overlay flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-3xl rounded-lg shadow-2xl flex flex-col overflow-hidden max-h-[90vh] animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between px-md py-sm border-b border-surface-variant">
              <h2 className="font-headline-md text-lg text-on-surface font-bold">
                {editMode ? 'Chỉnh sửa hoạt động nháp' : 'Tạo hoạt động cộng đồng'}
              </h2>
              <button 
                onClick={() => {
                  setShowCreateModal(false);
                  window.location.hash = '#/organizer/dashboard';
                }}
                className="p-1 hover:bg-surface-variant rounded-full text-on-surface-variant"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="p-6 overflow-y-auto flex-grow space-y-4">
              
              {/* Activity Image Link */}
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">Ảnh bìa hoạt động</label>
                <input 
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Nhập link ảnh (ví dụ: https://images.unsplash.com/...)"
                  className="input-field w-full border border-outline-variant rounded-lg px-4 py-2.5 bg-surface-bright text-on-surface text-sm"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">Tên hoạt động *</label>
                <input 
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập tiêu đề hoạt động..."
                  className="input-field w-full border border-outline-variant rounded-lg px-4 py-2.5 bg-surface-bright text-on-surface text-sm"
                  required
                />
              </div>

              {/* Category & Members Count Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">Loại hoạt động *</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input-field w-full border border-outline-variant rounded-lg px-4 py-2.5 bg-surface-bright text-on-surface text-sm cursor-pointer"
                  >
                    <option value="Môi trường">Môi trường</option>
                    <option value="Giáo dục">Giáo dục</option>
                    <option value="Từ thiện">Từ thiện</option>
                    <option value="Gây quỹ">Gây quỹ</option>
                    <option value="Hỗ trợ cộng đồng">Hỗ trợ cộng đồng</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">Số lượng tuyển dụng *</label>
                  <input 
                    type="number"
                    value={limitVolunteers}
                    onChange={(e) => setLimitVolunteers(Number(e.target.value))}
                    min={1}
                    className="input-field w-full border border-outline-variant rounded-lg px-4 py-2.5 bg-surface-bright text-on-surface text-sm"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">Mô tả chi tiết *</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả công việc, mục tiêu dự án..."
                  rows={4}
                  className="input-field w-full border border-outline-variant rounded-lg px-4 py-2.5 bg-surface-bright text-on-surface text-sm"
                  required
                ></textarea>
              </div>

              {/* Start & End Date Time Picker */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                {/* Start */}
                <div className="grid grid-cols-2 gap-sm">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">Ngày bắt đầu *</label>
                    <input 
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="input-field w-full border border-outline-variant rounded-lg p-2 bg-surface-bright text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">Giờ bắt đầu</label>
                    <input 
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="input-field w-full border border-outline-variant rounded-lg p-2 bg-surface-bright text-sm"
                    />
                  </div>
                </div>
                {/* End */}
                <div className="grid grid-cols-2 gap-sm">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">Ngày kết thúc *</label>
                    <input 
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="input-field w-full border border-outline-variant rounded-lg p-2 bg-surface-bright text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">Giờ kết thúc</label>
                    <input 
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="input-field w-full border border-outline-variant rounded-lg p-2 bg-surface-bright text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Location Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-sm">
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">Tỉnh / Thành phố *</label>
                  <select 
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="input-field w-full border border-outline-variant rounded-lg px-3 py-2.5 bg-surface-bright text-sm"
                  >
                    <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="Đà Nẵng">Đà Nẵng</option>
                    <option value="Lào Cai">Lào Cai</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">Quận / Huyện *</label>
                  <input 
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="ví dụ: Quận 1"
                    className="input-field w-full border border-outline-variant rounded-lg px-3 py-2.5 bg-surface-bright text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">Địa chỉ chi tiết *</label>
                  <input 
                    type="text"
                    value={addressDetail}
                    onChange={(e) => setAddressDetail(e.target.value)}
                    placeholder="ví dụ: Số 123 Đường Nguyễn Huệ"
                    className="input-field w-full border border-outline-variant rounded-lg px-3 py-2.5 bg-surface-bright text-sm"
                    required
                  />
                </div>
              </div>

              {/* Requirements */}
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">Yêu cầu & Ghi chú</label>
                <textarea 
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="ví dụ: Mang theo khẩu trang, giày thể thao..."
                  rows={2}
                  className="input-field w-full border border-outline-variant rounded-lg px-4 py-2.5 bg-surface-bright text-on-surface text-sm"
                ></textarea>
              </div>

            </div>

            {/* Actions footer */}
            <div className="p-6 border-t border-surface-variant flex justify-end items-center gap-sm bg-surface-bright">
              <button 
                onClick={() => {
                  setShowCreateModal(false);
                  window.location.hash = '#/organizer/dashboard';
                }}
                className="px-6 h-[48px] border border-outline-variant text-on-surface-variant rounded-lg hover:bg-surface-variant transition-colors font-semibold text-sm flex items-center justify-center"
              >
                Hủy
              </button>
              <button 
                onClick={() => handleSubmitActivity(false)}
                className="px-6 h-[48px] bg-surface-container-high text-on-surface hover:bg-surface-variant rounded-lg font-bold text-sm transition-colors shadow-sm flex items-center justify-center"
              >
                Lưu Nháp
              </button>
              <button 
                onClick={() => handleSubmitActivity(true)}
                className="px-8 h-[48px] bg-primary text-on-primary hover:bg-tertiary rounded-lg font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base font-bold">publish</span>
                Gửi Phê Duyệt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default OrganizerDashboard;
