import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export const ActivityListView: React.FC = () => {
  const { activities } = useApp();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [locationQuery, setLocationQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('Anytime');
  const [sortBy, setSortBy] = useState('Recommended');

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

  const handleCategoryChange = (category: string) => {
    if (category === 'All') {
      setSelectedCategories([]);
    } else {
      if (selectedCategories.includes(category)) {
        setSelectedCategories(selectedCategories.filter(c => c !== category));
      } else {
        setSelectedCategories([...selectedCategories, category]);
      }
    }
  };

  const handleResetFilters = () => {
    setSelectedCategories([]);
    setLocationQuery('');
    setSearchQuery('');
    setDateFilter('Anytime');
    setSortBy('Recommended');
    // Clear URL query
    window.location.hash = '#/activities';
  };

  // Filter activities: Volunteer sees 'Open' activities (or Full ones as they can join waitlist in UI)
  const filteredActivities = activities
    .filter(act => act.status === 'Open' || act.status === 'Full')
    .filter(act => {
      // Search text query (title & description)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = act.title.toLowerCase().includes(q);
        const matchesDesc = act.description.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }
      
      // Category filter
      if (selectedCategories.length > 0) {
        const matchesCategory = act.categories.some(cat => selectedCategories.includes(cat));
        if (!matchesCategory) return false;
      }

      // Location filter
      if (locationQuery.trim()) {
        const loc = locationQuery.toLowerCase();
        const matchesProvince = act.location.province.toLowerCase().includes(loc);
        const matchesDistrict = act.location.district.toLowerCase().includes(loc);
        const matchesAddress = act.location.address_detail.toLowerCase().includes(loc);
        if (!matchesProvince && !matchesDistrict && !matchesAddress) return false;
      }

      // Date Filter Simulation
      if (dateFilter !== 'Anytime') {
        const actDate = new Date(act.start_date);
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        if (dateFilter === 'Today') {
          const isToday = actDate.toDateString() === today.toDateString();
          if (!isToday) return false;
        } else if (dateFilter === 'This Weekend') {
          const day = actDate.getDay();
          const isWeekend = day === 0 || day === 6; // Sunday or Saturday
          if (!isWeekend) return false;
        } else if (dateFilter === 'Next Week') {
          const isNextWeek = actDate >= today && actDate <= nextWeek;
          if (!isNextWeek) return false;
        }
      }

      return true;
    });

  // Sort activities
  const sortedActivities = [...filteredActivities].sort((a, b) => {
    if (sortBy === 'Date (Soonest)') {
      return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
    }
    if (sortBy === 'Date (Latest)') {
      return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
    }
    // Default Recommended (Open first, then Full, then by newest)
    const scoreA = (a.status === 'Open' ? 10 : 0) - new Date(a.created_at).getTime() * 0.000000001;
    const scoreB = (b.status === 'Open' ? 10 : 0) - new Date(b.created_at).getTime() * 0.000000001;
    return scoreB - scoreA;
  });

  return (
    <div className="flex-grow w-full max-w-[1280px] mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col lg:flex-row gap-gutter text-left">
      {/* Sidebar Filters */}
      <aside className="w-full lg:w-64 flex-shrink-0 space-y-8">
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-surface-variant shadow-sm">
          <h2 className="font-headline-md text-xl font-bold text-on-surface mb-6 border-b border-surface-variant pb-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-xl">filter_alt</span>
            Bộ lọc tìm kiếm
          </h2>
          
          {/* Category Filter */}
          <div className="mb-6">
            <h3 className="font-label-sm text-xs text-on-surface-variant mb-4 uppercase tracking-wider font-bold">Thể loại</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox"
                  checked={selectedCategories.length === 0}
                  onChange={() => handleCategoryChange('All')}
                  className="form-checkbox h-5 w-5 text-primary border-outline rounded focus:ring-primary focus:ring-offset-0 transition-colors"
                />
                <span className="text-on-surface group-hover:text-primary transition-colors text-sm font-medium">Tất cả thể loại</span>
              </label>
              {['Môi trường', 'Giáo dục', 'Từ thiện', 'Gây quỹ', 'Hỗ trợ cộng đồng'].map(cat => (
                <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox"
                    checked={selectedCategories.includes(cat)}
                    onChange={() => handleCategoryChange(cat)}
                    className="form-checkbox h-5 w-5 text-primary border-outline rounded focus:ring-primary focus:ring-offset-0 transition-colors"
                  />
                  <span className="text-on-surface group-hover:text-primary transition-colors text-sm">{cat}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Location Filter */}
          <div className="mb-6">
            <h3 className="font-label-sm text-xs text-on-surface-variant mb-4 uppercase tracking-wider font-bold">Khu vực</h3>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">location_on</span>
              <input 
                type="text"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                placeholder="Nhập tỉnh, quận, địa chỉ..." 
                className="w-full pl-9 pr-4 py-2 border border-surface-variant rounded-md bg-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm placeholder-on-surface-variant text-on-surface transition-all"
              />
            </div>
          </div>

          {/* Date Filter */}
          <div className="mb-6">
            <h3 className="font-label-sm text-xs text-on-surface-variant mb-4 uppercase tracking-wider font-bold">Thời gian diễn ra</h3>
            <select 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full p-2 border border-surface-variant rounded-md bg-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-on-surface transition-all cursor-pointer"
            >
              <option value="Anytime">Tất cả thời gian</option>
              <option value="Today">Hôm nay</option>
              <option value="This Weekend">Cuối tuần này</option>
              <option value="Next Week">Trong tuần tới</option>
            </select>
          </div>

          <button 
            onClick={handleResetFilters}
            className="w-full font-label-sm text-xs bg-surface-container text-on-surface border border-outline-variant px-4 py-2 rounded-full hover:bg-surface-container-highest transition-colors active:scale-95 shadow-sm mt-4 font-semibold"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      </aside>

      {/* Activities Grid */}
      <section className="flex-grow">
        {/* Header/Sorting */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-surface-variant pb-4">
          <div>
            <h1 className="font-display-lg-mobile text-headline-md font-bold text-on-surface flex items-center gap-2">
              Khám Phá Chiến Dịch
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">Tìm kiếm chiến dịch thiện nguyện và cộng đồng phù hợp với bạn.</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-on-surface-variant text-xs font-semibold whitespace-nowrap">Sắp xếp:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="p-2 border border-surface-variant rounded-md bg-surface-container-lowest focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-xs text-on-surface transition-all cursor-pointer"
            >
              <option value="Recommended">Gợi ý tốt nhất</option>
              <option value="Date (Soonest)">Diễn ra sớm nhất</option>
              <option value="Date (Latest)">Diễn ra muộn nhất</option>
            </select>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative mb-6">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo tiêu đề hoạt động, mô tả, từ khóa..." 
            className="w-full pl-11 pr-4 py-3 border border-surface-variant rounded-xl bg-surface-container-lowest focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm placeholder-on-surface-variant text-on-surface transition-all shadow-sm"
          />
        </div>

        {/* Grid */}
        {sortedActivities.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl p-12 border border-surface-variant text-center space-y-4">
            <span className="material-symbols-outlined text-outline text-6xl">search_off</span>
            <h3 className="font-headline-md text-lg text-on-surface font-bold">Không tìm thấy hoạt động nào</h3>
            <p className="text-sm text-on-surface-variant max-w-md mx-auto">Thử thay đổi từ khóa tìm kiếm hoặc bấm Đặt lại bộ lọc để hiển thị toàn bộ hoạt động đang mở.</p>
            <button 
              onClick={handleResetFilters} 
              className="bg-primary text-on-primary hover:bg-tertiary px-6 py-2 rounded-lg font-medium text-xs shadow"
            >
              Xóa Bộ Lọc
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md">
            {sortedActivities.map(act => {
              const pctFull = Math.min(100, Math.round((act.approved_volunteers_count / act.limit_volunteers) * 100));
              return (
                <article key={act._id} className="bg-surface-container-lowest rounded-lg border border-surface-variant overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col group relative h-[435px]">
                  <div className="relative h-[192px] overflow-hidden bg-surface-container shrink-0">
                    <img 
                      alt={act.title} 
                      className="w-full h-full object-cover transition-transform duration-500" 
                      src={act.image_url || 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?q=80&w=600'}
                    />
                    <div className="absolute top-4 left-4 bg-secondary-fixed text-primary font-bold text-xs px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                      {act.categories[0] || 'Hoạt động'}
                    </div>
                    <div className={`absolute top-4 right-4 px-2 py-0.5 rounded font-bold text-xs flex items-center gap-1 shadow-sm ${
                      act.status === 'Open' ? 'bg-[#E6F4EA] text-[#137333]' : 'bg-red-50 text-red-600'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${act.status === 'Open' ? 'bg-[#137333]' : 'bg-red-600'}`}></span>
                      {act.status === 'Open' ? 'Đang Tuyển' : 'Đầy chỗ'}
                    </div>
                  </div>
                  
                  <div className="p-6 flex-grow flex flex-col justify-between">
                    <h3 className="font-headline-md text-on-surface text-base md:text-lg font-bold mb-3 line-clamp-2 leading-tight">
                      {act.title}
                    </h3>
                    
                    <div className="space-y-2.5 my-3 text-on-surface-variant text-sm">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-on-surface-variant text-base">calendar_month</span>
                        <span>
                          {new Date(act.start_date).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-on-surface-variant text-base">location_on</span>
                        <span className="line-clamp-1">{act.location.district}, {act.location.province}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-on-surface-variant text-base">group</span>
                        <span>Đã duyệt: <strong>{act.approved_volunteers_count}</strong> / {act.limit_volunteers}</span>
                      </div>

                      {/* Recruitment progress bar */}
                      <div className="pt-1">
                        <div className="progress-bar-track">
                          <div 
                            className="progress-bar-fill" 
                            style={{ width: `${pctFull}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-surface-variant pt-4 mt-auto">
                      <a 
                        href={`#/activity/${act._id}`}
                        className="w-full bg-primary hover:bg-primary/95 text-white font-bold h-[52px] rounded-lg transition-all duration-200 active:scale-95 flex justify-center items-center gap-2 shadow-sm text-sm"
                      >
                        Xem chi tiết
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
export default ActivityListView;
