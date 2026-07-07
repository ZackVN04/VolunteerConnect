import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export const ActivityListView: React.FC = () => {
  const { activities } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Open/Full');

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

  // Filter activities
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
        <div className="bg-white border border-surface-variant/40 rounded-2xl shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Search Input */}
            <div className="flex flex-col gap-2">
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
            <div className="flex flex-col gap-2">
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
            <div className="flex flex-col gap-2">
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
          <span>Tìm thấy <strong>{filteredActivities.length}</strong> hoạt động phù hợp</span>
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

        {/* Cards Grid */}
        {filteredActivities.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 border border-surface-variant/40 text-center space-y-4 shadow-sm">
            <span className="material-symbols-outlined text-outline text-5xl">search_off</span>
            <p className="text-sm text-on-surface-variant italic">Không tìm thấy hoạt động nào phù hợp.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredActivities.map(act => (
              <div 
                key={act._id} 
                className="bg-white border border-surface-variant/40 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col h-[550px]"
              >
                {/* Image Section */}
                <div className="relative h-[250px] w-full shrink-0">
                  <img 
                    src={act.image_url || 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80&w=600'} 
                    alt={act.title} 
                    className="w-full h-full object-cover"
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
                          {act.location.address_detail}, {act.location.district}, {act.location.province}
                        </span>
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

      </div>
    </div>
  );
};

export default ActivityListView;

