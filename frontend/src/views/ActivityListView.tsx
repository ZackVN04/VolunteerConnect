import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { Activity } from '../context/AppContext';
import { activityService } from '../services/apiService';
import { USE_REAL_BACKEND } from '../config/backend';

export const ActivityListView: React.FC = () => {
  const { activities } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Open/Full');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const [serverActivities, setServerActivities] = useState<Activity[]>([]);
  const [totalServerCount, setTotalServerCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, statusFilter]);

  // Load navbar search query if present in URL hash params
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.includes('?')) {
        const queryParams = new URLSearchParams(hash.split('?')[1]);
        const search = queryParams.get('search');
        if (search) {
          setSearchQuery(decodeURIComponent(search));
        }
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Fetch activities from backend if using real backend
  useEffect(() => {
    if (USE_REAL_BACKEND) {
      setLoading(true);
      activityService.list({
        search: searchQuery,
        category: selectedCategory,
        page: currentPage,
        limit: itemsPerPage
      }).then(res => {
        let list = res.activities;
        if (statusFilter === 'Open') {
          list = list.filter(a => a.status === 'Open');
        } else if (statusFilter === 'Full') {
          list = list.filter(a => a.status === 'Full');
        } else if (statusFilter === 'Completed') {
          list = list.filter(a => a.status === 'Completed');
        }
        setServerActivities(list);
        setTotalServerCount(res.total);
        setLoading(false);
      }).catch(err => {
        console.error("Lỗi lấy danh sách hoạt động từ server:", err);
        setLoading(false);
      });
    }
  }, [searchQuery, selectedCategory, statusFilter, currentPage]);

  // Filter activities for local mock simulation mode
  const filteredActivities = activities.filter(act => {
    // Search query match (title, location district/province, address)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = act.title.toLowerCase().includes(q);
      const matchDesc = act.description.toLowerCase().includes(q);
      const matchLoc = (act.location.district + ' ' + act.location.province + ' ' + act.location.address_detail).toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchLoc) return false;
    }

    // Category match
    if (selectedCategory !== 'All') {
      const matchCategory = act.categories.includes(selectedCategory);
      if (!matchCategory) return false;
    }

    // Status match
    if (statusFilter === 'Open/Full') {
      if (act.status !== 'Open' && act.status !== 'Full') return false;
    } else if (statusFilter === 'Open') {
      if (act.status !== 'Open') return false;
    } else if (statusFilter === 'Full') {
      if (act.status !== 'Full') return false;
    } else if (statusFilter === 'Completed') {
      if (act.status !== 'Completed') return false;
    }

    return true;
  });

  const totalPages = USE_REAL_BACKEND 
    ? Math.ceil(totalServerCount / itemsPerPage)
    : Math.ceil(filteredActivities.length / itemsPerPage);

  const paginatedActivities = USE_REAL_BACKEND
    ? serverActivities
    : filteredActivities.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      );

  return (
    <div className="w-full bg-[#f8f9fa] min-h-screen pb-16">
      {/* Container */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-8 space-y-8 text-left">
        
        {/* Title Block */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-on-surface font-headline-md">
            Khám phá hoạt động
          </h1>
          <p className="text-on-surface-variant text-sm md:text-base mt-1.5">
            Tìm kiếm các chiến dịch tình nguyện phù hợp với sở trường và quỹ thời gian của bạn
          </p>
        </div>

        {/* Filter Bar Card */}
        <div className="bg-white border border-emerald-500/20 hover:border-emerald-500/40 focus-within:border-[#006d37] transition-all duration-300 ring-offset-2 focus-within:ring-2 focus-within:ring-[#006d37]/20 rounded-2xl shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Search Input */}
            <div className="flex flex-col gap-2 md:col-span-6">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Tìm kiếm</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">search</span>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tên hoạt động hoặc địa điểm..."
                  className="w-full pl-9 pr-4 py-2.5 border border-surface-variant rounded-xl bg-surface focus:outline-none focus:border-[#006d37] focus:ring-1 focus:ring-[#006d37] text-sm text-on-surface transition-all"
                />
              </div>
            </div>

            {/* Category Dropdown */}
            <div className="flex flex-col gap-2 md:col-span-3">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Lĩnh vực hoạt động</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2.5 border border-surface-variant rounded-xl bg-surface focus:outline-none focus:border-[#006d37] focus:ring-1 focus:ring-[#006d37] text-sm text-on-surface transition-all cursor-pointer"
              >
                <option value="All">Tất cả lĩnh vực</option>
                <option value="Môi trường">Môi trường</option>
                <option value="Giáo dục">Giáo dục</option>
                <option value="Y tế">Y tế</option>
                <option value="Từ thiện">Từ thiện</option>
                <option value="Gây quỹ">Gây quỹ</option>
              </select>
            </div>

            {/* Status Dropdown */}
            <div className="flex flex-col gap-2 md:col-span-3">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Trạng thái</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-surface-variant rounded-xl bg-surface focus:outline-none focus:border-[#006d37] focus:ring-1 focus:ring-[#006d37] text-sm text-on-surface transition-all cursor-pointer"
              >
                <option value="Open/Full">Đang tuyển (Open/Full)</option>
                <option value="Open">Đang mở (Open)</option>
                <option value="Full">Đã đầy chỗ (Full)</option>
                <option value="Completed">Đã kết thúc (Completed)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count & Reset Filter */}
        <div className="flex justify-between items-center text-sm text-on-surface-variant">
          <span>Tìm thấy <strong>{USE_REAL_BACKEND ? totalServerCount : filteredActivities.length}</strong> hoạt động phù hợp</span>
          {(searchQuery || selectedCategory !== 'All' || statusFilter !== 'Open/Full') && (
            <button 
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setStatusFilter('Open/Full');
                window.location.hash = '#/activities';
              }}
              className="text-[#006d37] hover:underline font-bold"
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#006d37]"></div>
          </div>
        ) : (USE_REAL_BACKEND ? paginatedActivities.length === 0 : filteredActivities.length === 0) ? (
          <div className="bg-white rounded-3xl p-16 border border-surface-variant/40 text-center space-y-4 shadow-sm">
            <span className="material-symbols-outlined text-outline text-5xl">search_off</span>
            <p className="text-sm text-on-surface-variant italic">Không tìm thấy hoạt động nào phù hợp.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedActivities.map(act => (
              <div 
                key={act._id} 
                onClick={() => { window.location.hash = `#/activity/${act._id}`; }}
                className="bg-white border border-surface-variant/40 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col h-[550px] cursor-pointer"
              >
                {/* Image Section */}
                <div className="relative h-[250px] w-full shrink-0">
                  <img 
                    src={act.image_url || 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80&w=600'} 
                    alt={act.title} 
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80&w=600'; }}
                  />
                  {/* Floating Category Badge */}
                  <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-[#006d37] font-bold text-xs px-3 py-1 rounded-full uppercase border border-[#006d37]/20 shadow-sm">
                    {act.categories[0] || 'Tình nguyện'}
                  </span>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col justify-between flex-grow">
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-on-surface line-clamp-1 leading-tight">
                       {act.title}
                     </h3>
                    
                    <div className="space-y-2 text-sm text-on-surface-variant">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#006d37] text-lg font-bold">calendar_month</span>
                        <span>{new Date(act.start_date).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#006d37] text-lg font-bold">location_on</span>
                        <span className="line-clamp-1">
                          {act.location?.address_detail || 'Chưa cập nhật'}, {act.location?.district || ''}, {act.location?.province || ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#006d37] text-lg font-bold">group</span>
                        <span>{act.approved_volunteers_count || 0}/{act.limit_volunteers} đã duyệt</span>
                      </div>
                    </div>

                    <p className="text-on-surface-variant text-sm leading-relaxed line-clamp-3">
                      {act.description}
                    </p>
                  </div>

                  {/* Card Footer */}
                  <div className="border-t border-surface-variant/40 pt-4 flex items-center justify-between mt-auto">
                    <span className="bg-[#e8f5e9] text-[#006d37] font-bold text-xs px-3 py-1 rounded-full uppercase">
                      {act.status === 'Open' ? 'Đang mở' : act.status === 'Full' ? 'Đã đầy chỗ' : act.status}
                    </span>
                    <a 
                      href={`#/activity/${act._id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-[#006d37] hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-full transition-all text-sm shadow-sm"
                    >
                      Xem chi tiết
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-6">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => {
                  setCurrentPage(i + 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`w-8 h-8 rounded-full text-sm font-bold transition-all ${
                  currentPage === i + 1
                    ? 'bg-[#006d37] text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default ActivityListView;

