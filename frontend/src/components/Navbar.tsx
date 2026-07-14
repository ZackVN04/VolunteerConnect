import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import logoImg from '../assets/logo.png';

// Inline avatar fallback with initials
const NavAvatar: React.FC<{ name: string; src?: string | null }> = ({ name, src }) => {
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

export const Navbar: React.FC = () => {
  const { currentUser, setCurrentUser, organizerRequests } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const currentHash = window.location.hash || '#/feed';

  const userRequest = currentUser ? organizerRequests.find(r => r.volunteer_id === currentUser._id) : undefined;
  const isPending = userRequest?.status === 'Pending';
  const isRejected = userRequest?.status === 'Rejected';

  let inCooldown = false;
  if (isRejected && userRequest) {
    const diffHours = (new Date().getTime() - new Date(userRequest.created_at).getTime()) / (1000 * 60 * 60);
    if (diffHours < 24) {
      inCooldown = true;
    }
  }

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
          <a href="#/feed" className="font-headline-md text-xl text-[#006d37] font-bold flex items-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all">
            <img src={logoImg} alt="Volunteer Connect Logo" className="h-9 w-auto object-contain shrink-0" />
            <span className="tracking-tight select-none">Volunteer Connect</span>
          </a>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex flex-row items-center gap-3 shrink-0">
          <a className={navLinkClass('#/feed')} href="#/feed">Trang chủ</a>
          <a className={navLinkClass('#/activities')} href="#/activities">Hoạt động</a>
          <a className={navLinkClass('#/about')} href="#/about">Về chúng tôi</a>
          {currentUser && currentUser.role === 'Volunteer' && (
            <a className={navLinkClass('#/my-registrations')} href="#/my-registrations">Đăng ký của tôi</a>
          )}
        </nav>

        {/* Right side: Actions */}
        <div className="hidden lg:flex items-center gap-4 shrink-0">
          {currentUser ? (
            <>
              {/* Action button based on role */}
              {currentUser.role === 'Volunteer' && !isPending && !inCooldown && (
                <a 
                  href="#/request-organizer"
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
                    <NavAvatar 
                      name={currentUser.profile.full_name} 
                      src={currentUser.profile.avatar_url}
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
                      <a 
                        href="#/profile?tab=password" 
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-on-surface hover:bg-slate-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm text-on-surface-variant">vpn_key</span>
                        Đổi mật khẩu
                      </a>
                      <hr className="border-outline-variant/30 my-1" />
                      <button 
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          localStorage.removeItem('token');
                          setCurrentUser(null);
                          window.location.hash = '#/feed';
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors text-left font-semibold cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm text-red-500">logout</span>
                        Đăng xuất
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <a 
              href="#/login"
              className="bg-[#006d37] hover:bg-emerald-800 text-white px-5 py-2 rounded-full text-xs font-semibold transition-all active:scale-95 shadow-sm"
            >
              Đăng nhập
            </a>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="lg:hidden flex items-center gap-3">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-on-surface-variant hover:text-[#006d37] transition-colors p-2 rounded-full hover:bg-surface-container-low cursor-pointer"
          >
            <span className="material-symbols-outlined text-2xl">{mobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop overlay */}
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-[1000] bg-black/50 lg:hidden animate-fadeIn"
          ></div>
          
          {/* Drawer Panel */}
          <div className="fixed top-0 right-0 h-full w-[290px] bg-white z-[1001] shadow-2xl flex flex-col lg:hidden transition-transform duration-300 ease-out animate-slideInRight text-left border-l border-slate-100">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <span className="font-bold text-base text-[#006d37] flex items-center gap-1.5">
                <img src={logoImg} alt="Logo" className="h-7 w-auto object-contain" />
                Volunteer Connect
              </span>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-500 hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-slate-50 cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Profile Section inside Drawer */}
            {currentUser && (
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-[#006d37]/20 bg-white shrink-0">
                  <NavAvatar 
                    name={currentUser.profile.full_name} 
                    src={currentUser.profile.avatar_url}
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-sm text-slate-800 truncate leading-tight">
                    {currentUser.profile.full_name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold mt-1">
                    {currentUser.role === 'Admin' ? 'Quản trị viên' : (currentUser.role === 'Organizer' ? 'Ban tổ chức' : 'Tình nguyện viên')}
                  </span>
                </div>
              </div>
            )}

            {/* Drawer Menu Links */}
            <div className="flex-grow overflow-y-auto p-4 space-y-1.5 text-xs font-semibold">
              <a 
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 py-3 px-4 rounded-xl transition-all ${
                  isActive('#/feed') ? 'bg-[#e8f5e9] text-[#006d37] font-bold shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                }`} 
                href="#/feed"
              >
                <span className="material-symbols-outlined text-lg">home</span>
                Trang chủ
              </a>
              <a 
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 py-3 px-4 rounded-xl transition-all ${
                  isActive('#/activities') ? 'bg-[#e8f5e9] text-[#006d37] font-bold shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                }`} 
                href="#/activities"
              >
                <span className="material-symbols-outlined text-lg">explore</span>
                Hoạt động
              </a>
              <a 
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 py-3 px-4 rounded-xl transition-all ${
                  isActive('#/about') ? 'bg-[#e8f5e9] text-[#006d37] font-bold shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                }`} 
                href="#/about"
              >
                <span className="material-symbols-outlined text-lg">info</span>
                Về chúng tôi
              </a>
              
              {currentUser ? (
                <>
                  {currentUser.role === 'Volunteer' && (
                    <a 
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 py-3 px-4 rounded-xl transition-all ${
                        isActive('#/my-registrations') ? 'bg-[#e8f5e9] text-[#006d37] font-bold shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                      }`} 
                      href="#/my-registrations"
                    >
                      <span className="material-symbols-outlined text-lg">assignment</span>
                      Đăng ký của tôi
                    </a>
                  )}
                  {currentUser.role === 'Admin' && (
                    <a 
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 py-3 px-4 rounded-xl transition-all ${
                        isActive('#/admin/dashboard') ? 'bg-[#e8f5e9] text-[#006d37] font-bold shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                      }`} 
                      href="#/admin/dashboard"
                    >
                      <span className="material-symbols-outlined text-lg">dashboard</span>
                      Quản trị hệ thống
                    </a>
                  )}
                  <a 
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 py-3 px-4 rounded-xl transition-all ${
                      isActive('#/profile') && !window.location.hash.includes('tab=password') ? 'bg-[#e8f5e9] text-[#006d37] font-bold shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                    }`} 
                    href="#/profile"
                  >
                    <span className="material-symbols-outlined text-lg">person</span>
                    Hồ sơ cá nhân
                  </a>
                  <a 
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 py-3 px-4 rounded-xl transition-all ${
                      window.location.hash.includes('tab=password') ? 'bg-[#e8f5e9] text-[#006d37] font-bold shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                    }`} 
                    href="#/profile?tab=password"
                  >
                    <span className="material-symbols-outlined text-lg">vpn_key</span>
                    Đổi mật khẩu
                  </a>

                  <div className="pt-4 mt-2 border-t border-slate-100 space-y-3">
                    {currentUser.role === 'Volunteer' && !isPending && !inCooldown && (
                      <a 
                        onClick={() => setMobileMenuOpen(false)}
                        href="#/request-organizer"
                        className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-[#006d37] hover:bg-[#e8f5e9] rounded-lg transition-all border border-[#006d37] text-center shadow-sm"
                      >
                        <span className="material-symbols-outlined text-base">verified_user</span>
                        Xin quyền Tổ chức
                      </a>
                    )}
                    {currentUser.role === 'Organizer' && (
                      <a 
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-center gap-1.5 text-center border border-[#006d37] text-[#006d37] py-2.5 rounded-lg text-xs font-bold hover:bg-[#e8f5e9] transition-all shadow-sm"
                        href="#/organizer/dashboard"
                      >
                        <span className="material-symbols-outlined text-base">campaign</span>
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
                      className="w-full flex items-center justify-center gap-1.5 border border-red-200 text-red-600 py-2.5 rounded-lg text-xs font-bold bg-red-50 hover:bg-red-100 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">logout</span>
                      Đăng xuất
                    </button>
                  </div>
                </>
              ) : (
                <div className="pt-6">
                  <a 
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 bg-[#006d37] text-white py-3 rounded-lg text-xs font-bold hover:bg-emerald-800 transition-all shadow-md active:scale-95"
                    href="#/login"
                  >
                    <span className="material-symbols-outlined text-base">login</span>
                    Đăng nhập tài khoản
                  </a>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Navbar;
