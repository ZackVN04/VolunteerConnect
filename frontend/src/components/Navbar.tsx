import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const Navbar: React.FC = () => {
  const { currentUser, setCurrentUser } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentHash = window.location.hash || '#/feed';

  if (!currentUser) return null;

  const isActive = (hash: string) => currentHash.startsWith(hash);

  const navLinkClass = (hash: string) => 
    `font-label-sm text-body-md py-1.5 px-2 xl:px-2.5 rounded-lg transition-all duration-200 active:scale-95 whitespace-nowrap ${
      isActive(hash)
        ? 'text-primary dark:text-primary-fixed border-b-2 border-primary dark:border-primary-fixed font-bold bg-primary-container/20'
        : 'text-on-surface-variant hover:text-primary hover:bg-primary-container/10'
    }`;

  return (
    <header className="bg-surface sticky top-0 z-50 w-full border-b border-surface-variant shadow-sm transition-all duration-200">
      <div className="flex justify-between items-center px-4 md:px-8 py-4 w-full max-w-[1280px] mx-auto h-[72px]">
        {/* Brand/Logo */}
        <div className="flex items-center gap-2 xl:gap-4 shrink-0">
          <a href="#/feed" className="font-headline-md text-headline-md text-primary dark:text-primary-fixed font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl filled">diversity_3</span>
            <span className="tracking-tight select-none">Volunteer Connect</span>
          </a>
          
          {/* Quick indicator badge */}
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
            currentUser.role === 'Admin' ? 'bg-red-100 text-red-700' :
            currentUser.role === 'Organizer' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {currentUser.role}
          </span>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex flex-row items-center flex-nowrap gap-0.5 xl:gap-1.5 shrink-0">
          {/* General Common Link */}
          <a className={navLinkClass('#/feed')} href="#/feed">Bảng Tin</a>
          <a className={navLinkClass('#/activities')} href="#/activities">Khám Phá Hoạt Động</a>

          {/* Volunteer Specific Links */}
          {currentUser.role === 'Volunteer' && (
            <>
              <a className={navLinkClass('#/my-registrations')} href="#/my-registrations">Đơn Đăng Ký</a>
              <a className={navLinkClass('#/profile')} href="#/profile">Hồ Sơ</a>
            </>
          )}

          {/* Organizer Specific Links */}
          {currentUser.role === 'Organizer' && (
            <>
              <a className={navLinkClass('#/organizer/dashboard')} href="#/organizer/dashboard">Quản Lý Hoạt Động</a>
              <a className={navLinkClass('#/profile')} href="#/profile">Hồ Sơ</a>
            </>
          )}

          {/* Admin Specific Links */}
          {currentUser.role === 'Admin' && (
            <>
              <a className={navLinkClass('#/admin/dashboard')} href="#/admin/dashboard">Bảng Quản Trị</a>
            </>
          )}
        </nav>

        {/* Trailing Actions */}
        <div className="flex items-center gap-2 xl:gap-4 shrink-0">
          {/* Search bar placeholder (Desktop only) */}
          <div className="hidden xl:flex relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">search</span>
            <input 
              className="pl-9 pr-4 py-2 border border-outline-variant rounded-full bg-surface-container-low focus:outline-none focus:border-primary text-xs w-48 transition-all" 
              placeholder="Tìm kiếm..." 
              type="text"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const target = e.target as HTMLInputElement;
                  window.location.hash = `#/activities?search=${encodeURIComponent(target.value)}`;
                }
              }}
            />
          </div>

          {/* Create Opportunity button for Organizers */}
          {currentUser.role === 'Organizer' && (
            <a 
              href="#/organizer/dashboard?create=true"
              className="hidden sm:flex items-center gap-1.5 bg-primary text-on-primary hover:bg-tertiary px-3 py-1.5 rounded-lg font-label-sm text-xs transition-all duration-200 active:scale-95 shadow-sm font-bold"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Tạo Hoạt Động
            </a>
          )}

          {/* Logged in User Profile Info */}
          <div className="flex items-center gap-3 pl-2 border-l border-outline-variant/50">
            <a href="#/profile" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full border-2 border-primary-container overflow-hidden bg-surface-container-high shrink-0 hover:opacity-85 transition-opacity">
                <img 
                  alt="Avatar" 
                  className="w-full h-full object-cover" 
                  src={
                    currentUser.profile.avatar_url ||
                    (currentUser._id === 'user_vol_a_002' ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuB_PQBoM34v-KHc_RgV_5yx56GMnqxDEhWKCFYBFHs2DD_v0AfXxYHUzf2X3lHHgAe2vyMGRQql2_ip1v1PHVYhvFyoXhPynpBV2nxiOGxa8e8ofteEH-zmu0GxXB6A8jodf8hDo5WAuXJJrmVLLOR1IjbvdDXwj0qbFpahbPlbl0ck9hpAKNzpXmdr75nvpBMMDMs4UZOVhWf1sVfevY5pMMDMs4UZOVhWf1sVfevY5pMBzIvjY41MIz8mTplH5pZ7hrKQrRtevMrQ' :
                     currentUser._id === 'user_org_b_003' ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkQYvd65g9k6JOGizWiwW69fSLpWWr-F9ZrbB9rVITYy_HR6LpTrryKx45BWMirCv1Bl458Rn7xSD7iNoQiH2qr1i-zXYYpEOVAhyzlwAiSWYaeDSajjvTk79HCfIoD2bKu6PP-Ni7Rl8dNUcyusGXtwrW_leJf2pHSMyVYQ7GGycn96gK0LnhC85StwbzmSLfjRVsPGdPZvSyywYXC6R-9TA5TRIQ_rODyBNU7NlmuV4LUv8M9-3XUw' :
                     currentUser._id === 'user_admin_001' ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuCYcsfThBjqJ3O_WR02laZ868Vy0rbWRrqdcH5bE3iJVWcOgHMoh3CsowraUnMiJ6A8cGSGFjyuG_USGZmPk9q36M_dwSakgzQkp_8IfSXGp7yLav94zAH16CEYFw3LDkyEtm7yzOYC78AETUOiDy0IlPDic3zG1k8vpFwuKZ9138GaZWz-wC0CRMWAolLdDQkliuxw0LYkcJqLf-shkA2mNmKjWWYkkobzu4FtFN95KYT-bCJPwGNXzw' :
                     'https://lh3.googleusercontent.com/aida-public/AB6AXuCqR7c6MmYIK026t2CIKgJdzN-HVXJHuqj92skuH6GsQRsHvMxbEHHfJw4SZzJn1z7ycOuw65ul7NnXNvhBxovjiMraR3LbRNHHR4d6HmA29IW3oVGYPNSaG5QPYI0VCqShoV70UAg15BkVDPICUKrC5a1D4OhhpawjfyMo1BFfKacEJXqW3UQYfZvAq2O0roU323LKHahR9UoY_5rWFImGEoXmFIcsACP6G1q73EUHh8hTMmhtEEtQ8A')
                  }
                />
              </div>
              <div className="hidden xl:flex flex-col text-left">
                <span className="font-bold text-xs text-on-surface leading-tight hover:text-primary transition-colors">{currentUser.profile.full_name}</span>
                <span className="text-[10px] text-on-surface-variant font-medium mt-0.5">Level {currentUser.profile.joined_activity_count >= 5 ? 'Gold' : currentUser.profile.joined_activity_count >= 1 ? 'Silver' : 'Bronze'}</span>
              </div>
            </a>

            <button 
              onClick={() => {
                localStorage.removeItem('token');
                setCurrentUser(null);
              }}
              title="Đăng xuất"
              className="text-on-surface-variant hover:text-red-600 transition-colors p-1.5 rounded-full hover:bg-red-50 flex items-center justify-center ml-1"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined text-2xl">{mobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-surface-container border-b border-surface-variant px-margin-mobile py-4 space-y-2 animate-fadeIn">
          <a 
            onClick={() => setMobileMenuOpen(false)}
            className={`block py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
              isActive('#/feed') ? 'bg-primary text-on-primary' : 'text-on-surface hover:bg-surface-container-high'
            }`} 
            href="#/feed"
          >
            Bảng Tin
          </a>
          <a 
            onClick={() => setMobileMenuOpen(false)}
            className={`block py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
              isActive('#/activities') ? 'bg-primary text-on-primary' : 'text-on-surface hover:bg-surface-container-high'
            }`} 
            href="#/activities"
          >
            Khám Phá Hoạt Động
          </a>

          {currentUser.role === 'Volunteer' && (
            <>
              <a 
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                  isActive('#/my-registrations') ? 'bg-primary text-on-primary' : 'text-on-surface hover:bg-surface-container-high'
                }`} 
                href="#/my-registrations"
              >
                Đơn Đăng Ký
              </a>
              <a 
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                  isActive('#/profile') ? 'bg-primary text-on-primary' : 'text-on-surface hover:bg-surface-container-high'
                }`} 
                href="#/profile"
              >
                Hồ Sơ Cá Nhân
              </a>
            </>
          )}

          {currentUser.role === 'Organizer' && (
            <>
              <a 
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                  isActive('#/organizer/dashboard') ? 'bg-primary text-on-primary' : 'text-on-surface hover:bg-surface-container-high'
                }`} 
                href="#/organizer/dashboard"
              >
                Quản Lý Hoạt Động
              </a>
              <a 
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                  isActive('#/profile') ? 'bg-primary text-on-primary' : 'text-on-surface hover:bg-surface-container-high'
                }`} 
                href="#/profile"
              >
                Hồ Sơ Ban Tổ Chức
              </a>
            </>
          )}

          {currentUser.role === 'Admin' && (
            <>
              <a 
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                  isActive('#/admin/dashboard') ? 'bg-primary text-on-primary' : 'text-on-surface hover:bg-surface-container-high'
                }`} 
                href="#/admin/dashboard"
              >
                Bảng Quản Trị Admin
              </a>
            </>
          )}
        </div>
      )}
    </header>
  );
};
export default Navbar;
