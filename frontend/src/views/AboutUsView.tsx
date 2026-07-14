import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { statsService } from '../services/apiService';
import { AnimatedCounter } from '../components/AnimatedCounter';
import luongDuyKhangImg from '../assets/Team/Luong_Duy_Khang.jpg';
import nguyenChauTruongHuyImg from '../assets/Team/Nguyen_Chau_Truong_Huy.jpg';
import nguyenThanhThietImg from '../assets/Team/Nguyen_Thanh_Thiet.jpg';
import nguyenTrongHieuImg from '../assets/Team/Nguyen_Trong_Hieu.png';
import voVanKhanhImg from '../assets/Team/Vo_Van_Khanh.jpg';
import doThanhNhanTaiImg from '../assets/Team/Do_Thanh_Nhan_Tai.jpg';
import nguyenDinhThaiImg from '../assets/Team/Nguyen_Dinh_Thai.jpg';
import nguyenNgocTrucPhuongImg from '../assets/Team/Nguyen_Ngoc_Truc_Phuong.jpg';
import chauThiThuyVyImg from '../assets/Team/Chau_Thi_Thuy_Vi.jpg';
import leCongVinhImg from '../assets/Team/Le_Cong_Vinh.jpg';

export const AboutUsView: React.FC = () => {
    const { currentUser, organizerRequests } = useApp();

    const [stats, setStats] = useState({
        totalCampaigns: 0,
        totalVolunteers: 0,
        totalOrganizers: 0,
        totalCompleted: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await statsService.getGlobalStats();
                setStats({
                    totalCampaigns: data.totalCampaigns || 0,
                    totalVolunteers: data.totalVolunteers || 0,
                    totalOrganizers: data.totalOrganizers || 0,
                    totalCompleted: data.totalCompleted || 0
                });
            } catch (err) {
                console.error("Failed to fetch stats:", err);
            }
        };
        fetchStats();
    }, []);

    let showOrganizerButton = false;
    if (currentUser && currentUser.role === 'Volunteer') {
        const userRequest = organizerRequests.find(r => r.volunteer_id === currentUser._id);
        const isPending = userRequest?.status === 'Pending';
        const isRejected = userRequest?.status === 'Rejected';

        let inCooldown = false;
        if (isRejected && userRequest) {
            const diffHours = (new Date().getTime() - new Date(userRequest.created_at).getTime()) / (1000 * 60 * 60);
            if (diffHours < 24) {
                inCooldown = true;
            }
        }

        if (!isPending && !inCooldown) {
            showOrganizerButton = true;
        }
    }

    return (
        <>
            <style>
                {`
          @keyframes scroll {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
          }
          .animate-scroll {
              display: flex;
              width: max-content;
              animation: scroll 30s linear infinite;
          }
          .animate-scroll:hover {
              animation-play-state: paused;
          }
          .hide-scroll-bar::-webkit-scrollbar {
              display: none;
          }
          .hide-scroll-bar {
              -ms-overflow-style: none;
              scrollbar-width: none;
          }
        `}
            </style>

            <div className="w-full bg-[#f8f9fa] min-h-screen pb-16 text-left antialiased">
                <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-8 space-y-10">

                    {/* 1. Hero Section */}
                    <section className="relative rounded-2xl bg-gradient-to-br from-[#1a56db] via-[#2563eb] to-[#006d37] overflow-hidden p-8 md:p-14 text-center shadow-lg">
                        <div className="absolute inset-0 bg-white/10 mix-blend-overlay"></div>
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
                        <div className="relative z-10 space-y-4 max-w-3xl mx-auto">
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white font-headline-md tracking-tight leading-tight">
                                Kết nối sức trẻ<br />
                                <span className="text-emerald-300">Kiến tạo tương lai</span>
                            </h1>
                            <p className="text-white/90 text-base md:text-lg font-medium max-w-2xl mx-auto leading-relaxed">
                                Nơi hội tụ những trái tim nhiệt huyết, cùng chung tay lan tỏa giá trị nhân văn và xây dựng cộng đồng phát triển bền vững.
                            </p>
                        </div>
                    </section>

                    {/* 2. Our Story */}
                    <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100/60 hover:shadow-md transition-shadow duration-300">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                            <div>
                                <span className="text-[#006d37] font-bold uppercase tracking-widest mb-3 block text-xs">Câu chuyện của chúng tôi</span>
                                <h2 className="text-[1.35rem] sm:text-2xl md:text-[1.65rem] lg:text-3xl font-bold text-[#1a56db] mb-4 font-headline-md whitespace-nowrap tracking-tight">Hành trình kết nối cộng đồng</h2>
                                <p className="text-gray-600 mb-6 leading-relaxed text-justify">
                                    Volunteer Connector bắt đầu từ một ý tưởng đơn giản: Làm sao để việc giúp đỡ người khác trở nên dễ dàng và minh bạch hơn? Chúng tôi nhận thấy có hàng ngàn bạn trẻ khao khát cống hiến nhưng không biết bắt đầu từ đâu, trong khi các tổ chức xã hội lại gặp khó khăn trong việc tìm kiếm nguồn lực tin cậy.
                                </p>
                                <p className="text-gray-600 leading-relaxed text-justify">
                                    Đó là lý do chúng tôi xây dựng nền tảng này — một không gian nơi mỗi hành động nhỏ bé đều được trân trọng và ghi nhận, nơi tình nguyện không chỉ là công việc, mà là một hành trình khám phá bản thân và kết nối cộng đồng.
                                </p>
                            </div>
                            <div className="rounded-2xl overflow-hidden shadow-xl aspect-video lg:aspect-auto lg:h-full min-h-[300px]">
                                <img
                                    alt="Co-founder at work"
                                    className="w-full h-full object-cover"
                                    src="https://toplist.vn/images/800px/ban-se-thay-doi-cuoc-doi-nguoi-khac-va-chinh-ban-85433.jpg"
                                />
                            </div>
                        </div>
                    </section>

                    {/* 3. Our Mission & Vision */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gradient-to-br from-[#1a56db] to-[#3b82f6] p-6 md:p-8 rounded-2xl text-white shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-5 backdrop-blur-sm">
                                <span className="material-symbols-outlined text-white text-xl">flag</span>
                            </div>
                            <h3 className="text-xl font-bold mb-2 font-headline-md">Sứ mệnh</h3>
                            <p className="opacity-95 leading-relaxed text-sm md:text-base">
                                Kết nối con người với những mục đích ý nghĩa, hỗ trợ các tổ chức tối ưu hóa nguồn lực và xây dựng một cộng đồng phát triển bền vững dựa trên tinh thần tự nguyện.
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-[#006d37] to-[#10b981] p-6 md:p-8 rounded-2xl text-white shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-5 backdrop-blur-sm">
                                <span className="material-symbols-outlined text-white text-xl">visibility</span>
                            </div>
                            <h3 className="text-xl font-bold mb-2 font-headline-md">Tầm nhìn</h3>
                            <p className="opacity-95 leading-relaxed text-sm md:text-base">
                                Trở thành nền tảng tình nguyện hàng đầu khu vực, nơi ứng dụng công nghệ để nâng tầm các hoạt động xã hội và lan tỏa giá trị nhân văn đến mọi ngóc ngách của đời sống.
                            </p>
                        </div>
                    </section>

                    {/* 4. What We Do */}
                    <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100/60">
                        <h2 className="text-2xl font-bold text-[#1a56db] text-center mb-8 font-headline-md">Chúng tôi làm gì?</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* For Volunteers */}
                            <div className="bg-gradient-to-br from-[#eef4ff] to-white p-6 md:p-8 rounded-2xl border border-[#1a56db]/10 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-14 h-14 bg-[#1a56db]/10 rounded-xl flex items-center justify-center text-[#1a56db]">
                                        <span className="material-symbols-outlined text-[28px]">person_check</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-[#1a56db] font-headline-md">Dành cho Tình nguyện viên</h3>
                                </div>
                                <ul className="space-y-6">
                                    <li className="flex gap-3">
                                        <span className="material-symbols-outlined text-[#006d37] mt-0.5 text-xl">check_circle</span>
                                        <div>
                                            <strong className="block text-base mb-1">Tìm kiếm thông minh</strong>
                                            <p className="text-gray-600 text-sm">Dễ dàng lọc các dự án theo vị trí, sở thích và kỹ năng.</p>
                                        </div>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="material-symbols-outlined text-[#006d37] mt-0.5 text-xl">check_circle</span>
                                        <div>
                                            <strong className="block text-base mb-1">Đăng ký nhanh chóng</strong>
                                            <p className="text-gray-600 text-sm">Tham gia dự án chỉ với một vài thao tác chạm.</p>
                                        </div>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="material-symbols-outlined text-[#006d37] mt-0.5 text-xl">check_circle</span>
                                        <div>
                                            <strong className="block text-base mb-1">Theo dõi hành trình</strong>
                                            <p className="text-gray-600 text-sm">Ghi lại lịch sử tham gia và nhật ký hoạt động.</p>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                            {/* For Organizations */}
                            <div className="bg-gradient-to-br from-[#e8f5e9] to-white p-6 md:p-8 rounded-2xl border border-[#006d37]/10 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-14 h-14 bg-[#006d37]/10 rounded-xl flex items-center justify-center text-[#006d37]">
                                        <span className="material-symbols-outlined text-[28px]">corporate_fare</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-[#006d37] font-headline-md">Dành cho Tổ chức</h3>
                                </div>
                                <ul className="space-y-6">
                                    <li className="flex gap-3">
                                        <span className="material-symbols-outlined text-[#1a56db] mt-0.5 text-xl">check_circle</span>
                                        <div>
                                            <strong className="block text-base mb-1">Đăng tải hoạt động</strong>
                                            <p className="text-gray-600 text-sm">Tạo và quản lý các chiến dịch tình nguyện chuyên nghiệp.</p>
                                        </div>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="material-symbols-outlined text-[#1a56db] mt-0.5 text-xl">check_circle</span>
                                        <div>
                                            <strong className="block text-base mb-1">Quản lý nhân sự</strong>
                                            <p className="text-gray-600 text-sm">Theo dõi danh sách và tương tác trực tiếp với tình nguyện viên.</p>
                                        </div>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="material-symbols-outlined text-[#1a56db] mt-0.5 text-xl">check_circle</span>
                                        <div>
                                            <strong className="block text-base mb-1">Báo cáo tác động</strong>
                                            <p className="text-gray-600 text-sm">Tự động xuất báo cáo số liệu và hiệu quả chiến dịch.</p>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* 5. Why Choose Us */}
                    <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100/60 text-center">
                        <h2 className="text-2xl font-bold text-[#1a56db] mb-8 font-headline-md">Tại sao chọn Volunteer Connector?</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                            <div className="p-5 bg-[#f8f9ff] rounded-2xl shadow-sm border border-[#1a56db]/10 hover:shadow-md hover:-translate-y-0.5 hover:border-[#1a56db]/30 transition-all duration-300 group">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-3 shadow-sm group-hover:scale-105 transition-transform duration-300">
                                    <span className="material-symbols-outlined text-[#1a56db] text-xl">verified_user</span>
                                </div>
                                <h4 className="font-bold text-base mb-1.5 text-slate-800">Hoạt động uy tín</h4>
                                <p className="text-slate-500 text-sm leading-relaxed">Mọi tổ chức và dự án đều được xác thực nghiêm ngặt để đảm bảo tính minh bạch và an toàn.</p>
                            </div>
                            <div className="p-5 bg-[#f8f9ff] rounded-2xl shadow-sm border border-[#1a56db]/10 hover:shadow-md hover:-translate-y-0.5 hover:border-[#1a56db]/30 transition-all duration-300 group">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-3 shadow-sm group-hover:scale-105 transition-transform duration-300">
                                    <span className="material-symbols-outlined text-[#1a56db] text-xl">bolt</span>
                                </div>
                                <h4 className="font-bold text-base mb-1.5 text-slate-800">Đăng ký dễ dàng</h4>
                                <p className="text-slate-500 text-sm leading-relaxed">Tiết kiệm thời gian với quy trình tối giản hóa, kết nối nhanh chóng chỉ với vài cú click chuột.</p>
                            </div>
                            <div className="p-5 bg-[#f8f9ff] rounded-2xl shadow-sm border border-[#1a56db]/10 hover:shadow-md hover:-translate-y-0.5 hover:border-[#1a56db]/30 transition-all duration-300 group">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-3 shadow-sm group-hover:scale-105 transition-transform duration-300">
                                    <span className="material-symbols-outlined text-[#1a56db] text-xl">history_edu</span>
                                </div>
                                <h4 className="font-bold text-base mb-1.5 text-slate-800">Hồ sơ tình nguyện</h4>
                                <p className="text-slate-500 text-sm leading-relaxed">Lưu trữ toàn bộ thành tích, giấy chứng nhận và quá trình rèn luyện cá nhân của bạn một cách chuyên nghiệp.</p>
                            </div>
                        </div>
                    </section>

                    {/* 5.5 Team Section */}
                    <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100/60 text-center">
                        <h2 className="text-2xl font-bold text-[#1a56db] mb-4 font-headline-md">Đội ngũ thực hiện dự án</h2>
                        <p className="text-slate-500 mb-8 max-w-2xl mx-auto leading-relaxed text-sm md:text-base">Đứng sau Volunteer Connect là những bạn trẻ đam mê công nghệ và khao khát mang lại những giá trị tích cực cho cộng đồng. Chúng tôi luôn nỗ lực không ngừng để tạo ra một nền tảng hữu ích nhất.</p>
                        <div className="relative overflow-hidden w-full py-4">
                            {/* Gradient overlay for smooth edges (optional, but looks good) */}
                            <div className="absolute top-0 bottom-0 left-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
                            <div className="absolute top-0 bottom-0 right-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

                            <div className="animate-scroll gap-8 md:gap-12 pl-4">
                                {/* Set 1 */}
                                <div className="flex flex-col items-center group shrink-0 min-w-[140px]">
                                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-200 mb-3 overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:-translate-y-1 ring-2 ring-transparent group-hover:ring-[#1a56db]/20">
                                        <img src={leCongVinhImg} alt="Team Member" className="w-full h-full object-cover" />
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm md:text-base text-center">Lê Công Vinh</h4>
                                    <span className="text-xs text-[#1a56db] font-semibold mt-1 text-center">BA</span>
                                </div>
                                <div className="flex flex-col items-center group shrink-0 min-w-[140px]">
                                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-200 mb-3 overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:-translate-y-1 ring-2 ring-transparent group-hover:ring-[#1a56db]/20">
                                        <img src={nguyenThanhThietImg} alt="Team Member" className="w-full h-full object-cover" />
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm md:text-base text-center">Nguyễn Thanh Thiệt</h4>
                                    <span className="text-xs text-[#006d37] font-semibold mt-1 text-center">BE</span>
                                </div>
                                <div className="flex flex-col items-center group shrink-0 min-w-[140px]">
                                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-200 mb-3 overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:-translate-y-1 ring-2 ring-transparent group-hover:ring-[#1a56db]/20">
                                        <img src={voVanKhanhImg} alt="Team Member" className="w-full h-full object-cover" />
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm md:text-base text-center">Võ Văn Khanh</h4>
                                    <span className="text-xs text-[#006d37] font-semibold mt-1 text-center">BE</span>
                                </div>
                                <div className="flex flex-col items-center group shrink-0 min-w-[140px]">
                                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-200 mb-3 overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:-translate-y-1 ring-2 ring-transparent group-hover:ring-[#1a56db]/20">
                                        <img src={nguyenChauTruongHuyImg} alt="Team Member" className="w-full h-full object-cover" />
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm md:text-base text-center">Nguyễn Châu Trường Huy</h4>
                                    <span className="text-xs text-[#006d37] font-semibold mt-1 text-center">BE</span>
                                </div>
                                <div className="flex flex-col items-center group shrink-0 min-w-[140px]">
                                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-200 mb-3 overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:-translate-y-1 ring-2 ring-transparent group-hover:ring-[#1a56db]/20">
                                        <img src={nguyenTrongHieuImg} alt="Team Member" className="w-full h-full object-cover" />
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm md:text-base text-center">Nguyễn Trọng Hiếu</h4>
                                    <span className="text-xs text-[#006d37] font-semibold mt-1 text-center">BE </span>
                                </div>
                                <div className="flex flex-col items-center group shrink-0 min-w-[140px]">
                                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-200 mb-3 overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:-translate-y-1 ring-2 ring-transparent group-hover:ring-[#1a56db]/20">
                                        <img src={doThanhNhanTaiImg} alt="Team Member" className="w-full h-full object-cover" />
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm md:text-base text-center">Đỗ Thành Nhân Tài</h4>
                                    <span className="text-xs text-[#1a56db] font-semibold mt-1 text-center">FE</span>
                                </div>
                                <div className="flex flex-col items-center group shrink-0 min-w-[140px]">
                                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-200 mb-3 overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:-translate-y-1 ring-2 ring-transparent group-hover:ring-[#1a56db]/20">
                                        <img src={luongDuyKhangImg} alt="Team Member" className="w-full h-full object-cover" />
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm md:text-base text-center">Lương Duy Khang</h4>
                                    <span className="text-xs text-amber-600 font-semibold mt-1 text-center">UI/UX</span>
                                </div>
                                <div className="flex flex-col items-center group shrink-0 min-w-[140px]">
                                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-200 mb-3 overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:-translate-y-1 ring-2 ring-transparent group-hover:ring-[#1a56db]/20">
                                        <img src={nguyenNgocTrucPhuongImg} alt="Team Member" className="w-full h-full object-cover" />
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm md:text-base text-center">Nguyễn Ngọc Trúc Phương</h4>
                                    <span className="text-xs text-amber-600 font-semibold mt-1 text-center">UI/UX</span>
                                </div>
                                <div className="flex flex-col items-center group shrink-0 min-w-[140px]">
                                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-200 mb-3 overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:-translate-y-1 ring-2 ring-transparent group-hover:ring-[#1a56db]/20">
                                        <img src={luongDuyKhangImg} alt="Team Member" className="w-full h-full object-cover" />
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm md:text-base text-center">Nguyễn Đăng Khoa</h4>
                                    <span className="text-xs text-purple-600 font-semibold mt-1 text-center">QA</span>
                                </div>
                                <div className="flex flex-col items-center group shrink-0 min-w-[140px]">
                                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-200 mb-3 overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:-translate-y-1 ring-2 ring-transparent group-hover:ring-[#1a56db]/20">
                                        <img src={luongDuyKhangImg} alt="Team Member" className="w-full h-full object-cover" />
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm md:text-base text-center">Nguyễn Quỳnh Thảo Trang</h4>
                                    <span className="text-xs text-purple-600 font-semibold mt-1 text-center">QA</span>
                                </div>
                                <div className="flex flex-col items-center group shrink-0 min-w-[140px]">
                                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-200 mb-3 overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:-translate-y-1 ring-2 ring-transparent group-hover:ring-[#1a56db]/20">
                                        <img src={chauThiThuyVyImg} alt="Team Member" className="w-full h-full object-cover" />
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm md:text-base text-center">Châu Thị Thúy Vy</h4>
                                    <span className="text-xs text-purple-600 font-semibold mt-1 text-center">QA</span>
                                </div>
                                <div className="flex flex-col items-center group shrink-0 min-w-[140px]">
                                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-200 mb-3 overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:-translate-y-1 ring-2 ring-transparent group-hover:ring-[#1a56db]/20">
                                        <img src={nguyenDinhThaiImg} alt="Team Member" className="w-full h-full object-cover" />
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm md:text-base text-center">Nguyễn Đình Thái</h4>
                                    <span className="text-xs text-purple-600 font-semibold mt-1 text-center">QA</span>
                                </div>

                                {/* Set 2 */}
                                <div className="flex flex-col items-center group shrink-0 min-w-[140px]">
                                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-200 mb-3 overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:-translate-y-1 ring-2 ring-transparent group-hover:ring-[#1a56db]/20">
                                        <img src={leCongVinhImg} alt="Team Member" className="w-full h-full object-cover" />
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm md:text-base text-center">Lê Công Vinh</h4>
                                    <span className="text-xs text-[#1a56db] font-semibold mt-1 text-center">BA</span>
                                </div>
                                <div className="flex flex-col items-center group shrink-0 min-w-[140px]">
                                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-200 mb-3 overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:-translate-y-1 ring-2 ring-transparent group-hover:ring-[#1a56db]/20">
                                        <img src={nguyenThanhThietImg} alt="Team Member" className="w-full h-full object-cover" />
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm md:text-base text-center">Nguyễn Thanh Thiệt</h4>
                                    <span className="text-xs text-[#006d37] font-semibold mt-1 text-center">BE</span>
                                </div>
                                <div className="flex flex-col items-center group shrink-0 min-w-[140px]">
                                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-200 mb-3 overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:-translate-y-1 ring-2 ring-transparent group-hover:ring-[#1a56db]/20">
                                        <img src={voVanKhanhImg} alt="Team Member" className="w-full h-full object-cover" />
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm md:text-base text-center">Võ Văn Khanh</h4>
                                    <span className="text-xs text-[#006d37] font-semibold mt-1 text-center">BE</span>
                                </div>
                                <div className="flex flex-col items-center group shrink-0 min-w-[140px]">
                                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-200 mb-3 overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:-translate-y-1 ring-2 ring-transparent group-hover:ring-[#1a56db]/20">
                                        <img src={nguyenChauTruongHuyImg} alt="Team Member" className="w-full h-full object-cover" />
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm md:text-base text-center">Nguyễn Châu Trường Huy</h4>
                                    <span className="text-xs text-[#006d37] font-semibold mt-1 text-center">BE</span>
                                </div>
                                <div className="flex flex-col items-center group shrink-0 min-w-[140px]">
                                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-200 mb-3 overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:-translate-y-1 ring-2 ring-transparent group-hover:ring-[#1a56db]/20">
                                        <img src={nguyenTrongHieuImg} alt="Team Member" className="w-full h-full object-cover" />
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm md:text-base text-center">Nguyễn Trọng Hiếu</h4>
                                    <span className="text-xs text-[#006d37] font-semibold mt-1 text-center">BE</span>
                                </div>
                                <div className="flex flex-col items-center group shrink-0 min-w-[140px]">
                                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-200 mb-3 overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:-translate-y-1 ring-2 ring-transparent group-hover:ring-[#1a56db]/20">
                                        <img src={doThanhNhanTaiImg} alt="Team Member" className="w-full h-full object-cover" />
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm md:text-base text-center">Đỗ Thành Nhân Tài</h4>
                                    <span className="text-xs text-[#1a56db] font-semibold mt-1 text-center">FE</span>
                                </div>
                                <div className="flex flex-col items-center group shrink-0 min-w-[140px]">
                                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-200 mb-3 overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:-translate-y-1 ring-2 ring-transparent group-hover:ring-[#1a56db]/20">
                                        <img src={luongDuyKhangImg} alt="Team Member" className="w-full h-full object-cover" />
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm md:text-base text-center">Lương Duy Khang</h4>
                                    <span className="text-xs text-amber-600 font-semibold mt-1 text-center">UX/UI</span>
                                </div>
                                <div className="flex flex-col items-center group shrink-0 min-w-[140px]">
                                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-200 mb-3 overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:-translate-y-1 ring-2 ring-transparent group-hover:ring-[#1a56db]/20">
                                        <img src={nguyenNgocTrucPhuongImg} alt="Team Member" className="w-full h-full object-cover" />
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm md:text-base text-center">Nguyễn Ngọc Trúc Phương</h4>
                                    <span className="text-xs text-amber-600 font-semibold mt-1 text-center">UX/UI</span>
                                </div>
                                <div className="flex flex-col items-center group shrink-0 min-w-[140px]">
                                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-200 mb-3 overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:-translate-y-1 ring-2 ring-transparent group-hover:ring-[#1a56db]/20">
                                        <img src={luongDuyKhangImg} alt="Team Member" className="w-full h-full object-cover" />
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm md:text-base text-center">Nguyễn Đăng Khoa</h4>
                                    <span className="text-xs text-purple-600 font-semibold mt-1 text-center">QA</span>
                                </div>
                                <div className="flex flex-col items-center group shrink-0 min-w-[140px]">
                                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-200 mb-3 overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:-translate-y-1 ring-2 ring-transparent group-hover:ring-[#1a56db]/20">
                                        <img src={luongDuyKhangImg} alt="Team Member" className="w-full h-full object-cover" />
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm md:text-base text-center">Nguyễn Quỳnh Thảo Trang</h4>
                                    <span className="text-xs text-purple-600 font-semibold mt-1 text-center">QA</span>
                                </div>
                                <div className="flex flex-col items-center group shrink-0 min-w-[140px]">
                                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-200 mb-3 overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:-translate-y-1 ring-2 ring-transparent group-hover:ring-[#1a56db]/20">
                                        <img src={chauThiThuyVyImg} alt="Team Member" className="w-full h-full object-cover" />
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm md:text-base text-center">Châu Thị Thúy Vy</h4>
                                    <span className="text-xs text-purple-600 font-semibold mt-1 text-center">QA</span>
                                </div>
                                <div className="flex flex-col items-center group shrink-0 min-w-[140px]">
                                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-200 mb-3 overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:-translate-y-1 ring-2 ring-transparent group-hover:ring-[#1a56db]/20">
                                        <img src={nguyenDinhThaiImg} alt="Team Member" className="w-full h-full object-cover" />
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm md:text-base text-center">Nguyễn Đình Thái</h4>
                                    <span className="text-xs text-purple-600 font-semibold mt-1 text-center">QA</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 6. Impact Section */}
                    <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100/60 text-center">
                        <h2 className="text-2xl font-bold text-[#1a56db] mb-8 font-headline-md">Cộng đồng đang lớn mạnh</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                                <div className="text-3xl md:text-4xl font-extrabold text-[#1a56db] mb-1"><AnimatedCounter target={stats.totalVolunteers} />+</div>
                                <div className="text-gray-500 font-bold text-sm">Tình nguyện viên</div>
                            </div>
                            <div>
                                <div className="text-3xl md:text-4xl font-extrabold text-[#1a56db] mb-1"><AnimatedCounter target={stats.totalCampaigns} />+</div>
                                <div className="text-gray-500 font-bold text-sm">Hoạt động đã đăng</div>
                            </div>
                            <div>
                                <div className="text-3xl md:text-4xl font-extrabold text-[#1a56db] mb-1"><AnimatedCounter target={stats.totalOrganizers} />+</div>
                                <div className="text-gray-500 font-bold text-sm">Tổ chức đối tác</div>
                            </div>
                            <div>
                                <div className="text-3xl md:text-4xl font-extrabold text-[#1a56db] mb-1"><AnimatedCounter target={stats.totalCompleted * 4} />+</div>
                                <div className="text-gray-500 font-bold text-sm">Giờ tình nguyện</div>
                            </div>
                        </div>
                    </section>

                    {/* 7. Interactive Image Slider */}
                    <section className="bg-white rounded-2xl py-8 shadow-sm border border-slate-100/60 overflow-hidden relative">
                        {/* Gradient overlay for smooth edges */}
                        <div className="absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
                        <div className="absolute top-0 bottom-0 right-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

                        <h2 className="text-2xl font-bold text-[#1a56db] text-center mb-8 font-headline-md px-6 relative z-20">Khoảnh khắc ý nghĩa</h2>
                        <div className="relative">
                            <div className="animate-scroll gap-6 pl-6">
                                <img alt="Gallery 1" className="h-64 w-96 object-cover rounded-2xl shadow-md shrink-0" src="https://giadinh.mediacdn.vn/296230595582509056/2023/3/16/29758555948863256548065021203756630498811309n-16789314515301413580564.jpg" />
                                <img alt="Gallery 2" className="h-64 w-96 object-cover rounded-2xl shadow-md shrink-0" src="https://i.pinimg.com/736x/d2/ba/98/d2ba9820fb03dcaa38825311ebf91c8e.jpg" />
                                <img alt="Gallery 3" className="h-64 w-96 object-cover rounded-2xl shadow-md shrink-0" src="https://toplist.vn/images/800px/ban-se-gay-anh-huong-cho-nhung-nguoi-xung-quanh-85438.jpg" />
                                <img alt="Gallery 4" className="h-64 w-96 object-cover rounded-2xl shadow-md shrink-0" src="https://thanhnien.mediacdn.vn/Uploaded/duyphuc/2022_08_15/1-6736.jpg" />
                                <img alt="Gallery 1" className="h-64 w-96 object-cover rounded-2xl shadow-md shrink-0" src="https://tse2.mm.bing.net/th/id/OIP.y1c7U2CizsmCAJ4jk4pASwHaE8?r=0&rs=1&pid=ImgDetMain&o=7&rm=3" />
                                <img alt="Gallery 2" className="h-64 w-96 object-cover rounded-2xl shadow-md shrink-0" src="https://thanhnien.mediacdn.vn/Uploaded/trongnth/2022_07_08/sang-4-1505.jpg" />

                                <img alt="Gallery 2" className="h-64 w-96 object-cover rounded-2xl shadow-md shrink-0" src="https://kienthuctonghop.vn/wp-content/uploads/2023/04/tinh-nguyen-vien-giup-do-nguoi-ngheo.jpg" />
                                <img alt="Gallery 3" className="h-64 w-96 object-cover rounded-2xl shadow-md shrink-0" src="https://image.vietnamnews.vn/uploadvnnews/Article/2021/4/4/145238_8.jpg" />
                                <img alt="Gallery 4" className="h-64 w-96 object-cover rounded-2xl shadow-md shrink-0" src="https://thanhnien.mediacdn.vn/Uploaded/duyphuc/2022_08_15/1-6736.jpg" />
                                <img alt="Gallery 1" className="h-64 w-96 object-cover rounded-2xl shadow-md shrink-0" src="https://tse2.mm.bing.net/th/id/OIP.y1c7U2CizsmCAJ4jk4pASwHaE8?r=0&rs=1&pid=ImgDetMain&o=7&rm=3" />
                                <img alt="Gallery 2" className="h-64 w-96 object-cover rounded-2xl shadow-md shrink-0" src="https://tse2.mm.bing.net/th/id/OIP.T0yM_BFOaDylwi0KEL-_uQHaFj?r=0&rs=1&pid=ImgDetMain&o=7&rm=3" />
                                <img alt="Gallery 1" className="h-64 w-96 object-cover rounded-2xl shadow-md shrink-0" src="https://giadinh.mediacdn.vn/296230595582509056/2023/3/16/29758555948863256548065021203756630498811309n-16789314515301413580564.jpg" />

                            </div>
                        </div>
                    </section>

                    {/* 8. Call to Action */}
                    <section className="relative rounded-2xl bg-gradient-to-br from-[#1a56db] via-[#2563eb] to-[#006d37] overflow-hidden p-8 md:p-10 text-center text-white shadow-xl">
                        <div className="absolute inset-0 bg-white/10 mix-blend-overlay"></div>
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
                        <div className="relative z-10">
                            <h2 className="text-2xl font-bold mb-3 font-headline-md">Bạn đã sẵn sàng tạo nên sự khác biệt?</h2>
                            <p className="text-base mb-8 text-white/90 max-w-2xl mx-auto leading-relaxed">Hãy bắt đầu hành trình của bạn ngay hôm nay, đóng góp những giá trị nhỏ bé để tạo nên một cộng đồng vững mạnh.</p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                <a href="#/activities" className="bg-[#006d37] hover:bg-emerald-700 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 w-full sm:w-auto">Tham gia làm Tình nguyện viên</a>
                                {showOrganizerButton && (
                                    <a href="#/request-organizer" className="bg-white text-[#1a56db] hover:bg-slate-50 px-6 py-3 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 w-full sm:w-auto">Đăng ký cho Tổ chức</a>
                                )}
                            </div>
                        </div>
                    </section>

                </div>
            </div>
        </>
    );
};

export default AboutUsView;
