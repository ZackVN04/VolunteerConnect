import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const FeedView: React.FC = () => {
  const { activities, users } = useApp();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 2;

  // Compute stats dynamically
  const totalCampaigns = activities.length;
  const totalVolunteers = users.filter(u => u.role === 'Volunteer').length;
  const totalOrganizers = users.filter(u => u.role === 'Organizer').length;
  const totalCompleted = activities.filter(a => a.status === 'Completed').length;

  // Filter activities to show those that are 'Open' or 'Full' on home page with pagination
  const featuredList = activities.filter(
    act => act.status === 'Open' || act.status === 'Full'
  );
  const totalPages = Math.ceil(featuredList.length / itemsPerPage);
  const featuredActivities = featuredList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="w-full bg-[#f8f9fa] min-h-screen pb-16">
      {/* Container */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-8 space-y-12 text-left">
        
        {/* Hero Section */}
        <section className="bg-[#f0f9f4] rounded-[2rem] p-8 md:p-12 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="lg:w-1/2 space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-on-surface leading-tight font-headline-md">
              Kết nối sức trẻ,<br />
              Kiến tạo <span className="text-[#006d37]">cộng đồng xanh</span>
            </h1>
            <p className="text-on-surface-variant text-base md:text-lg leading-relaxed">
              Chào mừng bạn đến với Volunteer Connect! Nơi hội tụ của những hoạt động tình nguyện ý nghĩa, kết nối trực tiếp tình nguyện viên với các tổ chức thiện nguyện uy tín tại Việt Nam. Đăng ký dễ dàng, lưu giữ hành trình ý nghĩa.
            </p>
            <div className="flex flex-wrap gap-4">
              <a 
                href="#/activities" 
                className="bg-[#006d37] hover:bg-emerald-800 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-sm"
              >
                Khám phá hoạt động
              </a>
              <a 
                href="#/profile" 
                className="bg-white hover:bg-surface-container-low border border-surface-variant text-on-surface-variant font-bold px-6 py-3 rounded-xl transition-all shadow-sm"
              >
                Tài khoản của tôi
              </a>
            </div>
          </div>
          <div className="lg:w-1/2 w-full flex justify-center">
            <div className="w-full max-w-[500px] h-[300px] rounded-3xl overflow-hidden shadow-md">
              <img 
                src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=800&q=80" 
                alt="Volunteer Community" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white border border-surface-variant/40 rounded-2xl p-6 text-center shadow-sm">
            <h3 className="text-4xl font-bold text-[#006d37]">{totalCampaigns}</h3>
            <p className="text-on-surface-variant font-semibold text-sm mt-1">Tổng chiến dịch</p>
          </div>
          <div className="bg-white border border-surface-variant/40 rounded-2xl p-6 text-center shadow-sm">
            <h3 className="text-4xl font-bold text-[#006d37]">{totalVolunteers}</h3>
            <p className="text-on-surface-variant font-semibold text-sm mt-1">Tình nguyện viên</p>
          </div>
          <div className="bg-white border border-surface-variant/40 rounded-2xl p-6 text-center shadow-sm">
            <h3 className="text-4xl font-bold text-[#006d37]">{totalOrganizers}</h3>
            <p className="text-on-surface-variant font-semibold text-sm mt-1">Nhà tổ chức</p>
          </div>
          <div className="bg-white border border-surface-variant/40 rounded-2xl p-6 text-center shadow-sm">
            <h3 className="text-4xl font-bold text-[#006d37]">{totalCompleted}</h3>
            <p className="text-on-surface-variant font-semibold text-sm mt-1">Đã hoàn thành</p>
          </div>
        </section>

        {/* Featured Activities */}
        <section className="space-y-6">
          <div className="flex justify-between items-end border-b border-surface-variant/40 pb-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-on-surface font-headline-md">Hoạt động nổi bật</h2>
              <p className="text-on-surface-variant text-sm">Tham gia các hoạt động xã hội đang diễn ra gần bạn</p>
            </div>
            <a 
              href="#/activities" 
              className="text-[#006d37] hover:underline font-bold text-sm flex items-center gap-1"
            >
              Xem tất cả &rarr;
            </a>
          </div>

          {/* Cards Grid */}
          {featuredActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 bg-white border border-slate-100 rounded-3xl">
              <span className="material-symbols-outlined text-5xl text-slate-300">volunteer_activism</span>
              <p className="text-slate-500 font-semibold text-sm">Hiện chưa có hoạt động nổi bật nào đang mở đăng ký.</p>
              <a href="#/activities" className="text-[#006d37] hover:underline font-bold text-sm">Xem tất cả hoạt động →</a>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {featuredActivities.map(act => (
                  <div 
                    key={act._id} 
                    className="bg-white border border-surface-variant/40 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col h-[520px]"
                  >
                    {/* Image Section */}
                    <div className="relative h-[280px] w-full shrink-0">
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

                    {/* Info Content */}
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
                              {act.location?.address_detail || `${act.location?.district || ''}, ${act.location?.province || ''}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Footer of card */}
                      <div className="border-t border-surface-variant/40 pt-4 flex items-center justify-between mt-auto">
                        <span className="bg-[#e8f5e9] text-[#006d37] font-bold text-xs px-3 py-1 rounded-full uppercase">
                          {act.status === 'Open' ? 'Đang mở đăng ký' : 'Đã đầy'}
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

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer bg-white"
                  >
                    <span className="material-symbols-outlined text-base">chevron_left</span>
                  </button>

                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    const isActive = pageNum === currentPage;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-9 h-9 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                          isActive 
                            ? 'bg-[#006d37] border-[#006d37] text-white shadow-sm' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer bg-white"
                  >
                    <span className="material-symbols-outlined text-base">chevron_right</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </section>


      </div>
    </div>
  );
};

export default FeedView;

