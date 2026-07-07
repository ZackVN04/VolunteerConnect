import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const Navbar: React.FC = () => {
  const { currentUser, setCurrentUser } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const currentHash = window.location.hash || '#/feed';

  if (!currentUser) return null;

  const isActive = (hash: string) => currentHash.startsWith(hash);

  const navLinkClass = (hash: string) => 
    `font-semibold py-1.5 px-3 rounded-full transition-all duration-200 ${
      isActive(hash)
        ? 'text-[#006d37] bg-[#e8f5e9]'
        : 'text-on-surface-variant hover:text-[#006d37] hover:bg-surface-container-low'
    }`;

  return (
    <header className="bg-surface sticky top-0 z-50 w-full border-b border-surface-variant shadow-sm transition-all duration-200">
      <div className="flex justify-between items-center px-4 md:px-8 py-4 w-full max-w-[1280px] mx-auto h-[72px]">
        {/* Left: Brand/Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <a href="#/feed" className="font-headline-md text-xl text-[#006d37] font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-[#006d37] text-3xl filled">diversity_3</span>
            <span className="tracking-tight select-none">Volunteer Connect</span>
          </a>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex flex-row items-center gap-3 shrink-0">
          <a className={navLinkClass('#/feed')} href="#/feed">Trang chủ</a>
          <a className={navLinkClass('#/activities')} href="#/activities">Hoạt động</a>
          {currentUser.role === 'Volunteer' && (
            <a className={navLinkClass('#/my-registrations')} href="#/my-registrations">Đăng ký của tôi</a>
          )}
        </nav>

        {/* Right side: Actions */}
        <div className="hidden lg:flex items-center gap-4 shrink-0">
          {/* Action button based on role */}
          {currentUser.role === 'Volunteer' && (
            <a 
              href="#/profile?tab=upgrade"
              className="border border-[#006d37] text-[#006d37] hover:bg-[#e8f5e9] px-4 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 shadow-sm"
            >
              Xin quyền Tổ chức
            </a>
          )}
          {currentUser.role === 'Organizer' && (
            <a 
              href="#/organizer/dashboard"
              className="border border-[#006d37] text-[#006d37] hover:bg-[#e8f5e9] px-4 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 shadow-sm"
            >
              Khu vực Tổ chức
            </a>
          )}

          {/* User profile & Avatar Dropdown Trigger */}
          <div className="relative">
            <button 
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2.5 pl-2 border-l border-outline-variant/50 focus:outline-none cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full border-2 border-primary-container overflow-hidden bg-surface-container-high shrink-0 hover:scale-105 active:scale-95 transition-all">
                <img 
                  alt="Avatar" 
                  className="w-full h-full object-cover" 
                  src={currentUser.profile.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80"}
                />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-bold text-xs text-on-surface leading-tight">
                  {currentUser.profile.full_name}
                </span>
                <span className="text-[10px] text-on-surface-variant font-semibold mt-0.5 flex items-center gap-0.5">
                  {currentUser.role === 'Admin' ? 'Quản trị viên' : (currentUser.role === 'Organizer' ? 'Ban tổ chức' : 'Tình nguyện viên')}
                  <span className="material-symbols-outlined text-[12px] text-outline-variant">keyboard_arrow_down</span>
                </span>
              </div>
            </button>

            {/* Dropdown Menu */}
            {profileDropdownOpen && (
              <>
                {/* Backdrop overlay */}
                <div 
                  onClick={() => setProfileDropdownOpen(false)}
                  className="fixed inset-0 z-40 bg-transparent"
                ></div>
                
                {/* Menu list */}
                <div className="absolute right-0 mt-2 w-48 bg-white border border-surface-variant rounded-xl shadow-lg py-2 z-50 animate-fadeIn text-left text-xs font-semibold">
                  {currentUser.role === 'Admin' && (
                    <>
                      <a 
                        href="#/admin/dashboard" 
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-on-surface hover:bg-slate-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm text-on-surface-variant">dashboard</span>
                        Quản trị hệ thống
                      </a>
                      <hr className="border-outline-variant/30 my-1" />
                    </>
                  )}
                  <a 
                    href="#/profile" 
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-on-surface hover:bg-slate-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm text-on-surface-variant">account_circle</span>
                    Hồ sơ cá nhân
                  </a>
                  <hr className="border-outline-variant/30 my-1" />
                  <button 
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      localStorage.removeItem('token');
                      setCurrentUser(null);
                      window.location.hash = '#/feed';
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors text-left font-semibold"
                  >
                    <span className="material-symbols-outlined text-sm text-red-500">logout</span>
                    Đăng xuất
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu toggle */}
        <div className="lg:hidden flex items-center gap-3">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-on-surface-variant hover:text-[#006d37] transition-colors p-2 rounded-full hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined text-2xl">{mobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-surface-container border-b border-surface-variant px-4 py-4 space-y-2 animate-fadeIn text-left">
          <a 
            onClick={() => setMobileMenuOpen(false)}
            className={`block py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
              isActive('#/feed') ? 'bg-[#006d37] text-white' : 'text-on-surface hover:bg-surface-container-high'
            }`} 
            href="#/feed"
          >
            Trang chủ
          </a>
          <a 
            onClick={() => setMobileMenuOpen(false)}
            className={`block py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
              isActive('#/activities') ? 'bg-[#006d37] text-white' : 'text-on-surface hover:bg-surface-container-high'
            }`} 
            href="#/activities"
          >
            Hoạt động
          </a>
          {currentUser.role === 'Volunteer' && (
            <a 
              onClick={() => setMobileMenuOpen(false)}
              className={`block py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                isActive('#/my-registrations') ? 'bg-[#006d37] text-white' : 'text-on-surface hover:bg-surface-container-high'
              }`} 
              href="#/my-registrations"
            >
              Đăng ký của tôi
            </a>
          )}
          {currentUser.role === 'Admin' && (
            <a 
              onClick={() => setMobileMenuOpen(false)}
              className={`block py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                isActive('#/admin/dashboard') ? 'bg-[#006d37] text-white' : 'text-on-surface hover:bg-surface-container-high'
              }`} 
              href="#/admin/dashboard"
            >
              Quản trị hệ thống
            </a>
          )}
          <a 
            onClick={() => setMobileMenuOpen(false)}
            className={`block py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
              isActive('#/profile') ? 'bg-[#006d37] text-white' : 'text-on-surface hover:bg-surface-container-high'
            }`} 
            href="#/profile"
          >
            Hồ sơ cá nhân
          </a>
          <hr className="border-surface-variant my-2" />
          {currentUser.role === 'Volunteer' && (
            <a 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-center border border-[#006d37] text-[#006d37] py-2 rounded-lg text-sm font-semibold hover:bg-emerald-50"
              href="#/profile?tab=upgrade"
            >
              Xin quyền Tổ chức
            </a>
          )}
          {currentUser.role === 'Organizer' && (
            <a 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-center border border-[#006d37] text-[#006d37] py-2 rounded-lg text-sm font-semibold hover:bg-emerald-50"
              href="#/organizer/dashboard"
            >
              Khu vực Tổ chức
            </a>
          )}
          <button 
            onClick={() => {
              setMobileMenuOpen(false);
              localStorage.removeItem('token');
              setCurrentUser(null);
              window.location.hash = '#/feed';
            }}
            className="w-full text-center border border-red-200 text-red-600 py-2 rounded-lg text-sm font-semibold bg-red-50 hover:bg-red-100 mt-2"
          >
            Đăng xuất
          </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;
