import React, { useState, useEffect } from 'react';
import { AppContextProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import FeedView from './views/FeedView';
import ActivityListView from './views/ActivityListView';
import ActivityDetailView from './views/ActivityDetailView';
import ProfileView from './views/ProfileView';
import MyRegistrationsView from './views/MyRegistrationsView';
import OrganizerDashboard from './views/OrganizerDashboard';
import AdminDashboard from './views/AdminDashboard';
import LoginView from './views/LoginView';
import RegisterView from './views/RegisterView';
import OTPVerifyView from './views/OTPVerifyView';
import ForgotPasswordView from './views/ForgotPasswordView';
import PostsView from './views/PostsView';
import RequestOrganizerView from './views/RequestOrganizerView';
import './App.css';


const PromptModalWrapper: React.FC<{
  dialog: { message: string; title?: string; placeholder?: string; onConfirm: (val: string) => void };
  close: () => void;
}> = ({ dialog, close }) => {
  const [value, setValue] = useState('');
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 text-left animate-fadeIn">
      <div className="bg-white border border-surface-variant/40 rounded-3xl p-6 shadow-xl w-full max-w-sm space-y-4 animate-scaleUp">
        <div>
          <h3 className="text-base font-bold text-on-surface">
            {dialog.title || "Nhập thông tin"}
          </h3>
          <p className="text-xs text-on-surface-variant mt-2 font-medium leading-relaxed">
            {dialog.message}
          </p>
        </div>
        <textarea
          rows={2}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={dialog.placeholder || "Nhập tại đây..."}
          className="w-full px-3 py-2 border border-outline-variant rounded-xl text-sm leading-relaxed text-justify focus:outline-none focus:border-primary text-on-surface resize-y min-h-[64px] max-h-[132px] overflow-y-auto"
          autoFocus
        />
        <div className="flex justify-end gap-2 text-xs font-semibold">
          <button
            onClick={close}
            className="px-4 py-2 border border-surface-variant rounded-xl text-on-surface-variant hover:bg-slate-50 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={() => {
              dialog.onConfirm(value);
              close();
            }}
            className="px-4 py-2 bg-primary text-on-primary rounded-xl hover:bg-tertiary transition-colors"
          >
            Đồng ý
          </button>
        </div>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const {
    currentUser,
    isAuthLoading,
    notification,
    confirmDialog, closeConfirm,
    promptDialog, closePrompt
  } = useApp();
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/feed');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [otpVerifyPhone, setOtpVerifyPhone] = useState<string | null>(null);
  const [otpVerifyEmail, setOtpVerifyEmail] = useState<string | null>(null);
  const [showIncompleteBanner, setShowIncompleteBanner] = useState(false);

  // Hash Routing Listener
  useEffect(() => {
    const handleHashChange = () => {
      // Normalize base hash path
      const hash = window.location.hash || '#/feed';
      setCurrentHash(hash);
      window.scrollTo(0, 0); // scroll to top on navigate
    };

    // Set default route if none exists
    if (!window.location.hash) {
      window.location.hash = '#/feed';
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Redirect logged-in users away from auth routes
  useEffect(() => {
    if (isAuthLoading) return;
    if (currentUser) {
      const cleanHash = window.location.hash.split('?')[0];
      if (['#/login', '#/register', '#/forgot-password'].includes(cleanHash)) {
        if (currentUser.role === 'Admin') {
          window.location.hash = '#/admin/dashboard';
        } else {
          window.location.hash = '#/feed';
        }
      }
    }
  }, [currentUser, currentHash]);

  // Check if profile is incomplete and banner is not dismissed in current session
  useEffect(() => {
    if (currentUser) {
      const isDismissed = sessionStorage.getItem('dismissedProfileReminder') === 'true';
      const isIncomplete = !currentUser.phone ||
        !currentUser.profile.area_of_interest ||
        !currentUser.profile.skills ||
        currentUser.profile.skills.length === 0;
      
      const isFeedPage = currentHash.split('?')[0] === '#/feed';

      setShowIncompleteBanner(isIncomplete && !isDismissed && isFeedPage);
    } else {
      setShowIncompleteBanner(false);
    }
  }, [currentUser, currentHash]);

  // Parse Hash Route
  const getRouteView = () => {
    // Render normally with stale data while auth is checking
    const cleanHash = currentHash.split('?')[0]; // strip params

    if (cleanHash === '#/feed') {
      return <FeedView />;
    }

    if (cleanHash === '#/activities') {
      return <ActivityListView />;
    }

    // Hash details path matcher: #/activity/act_001
    if (cleanHash.startsWith('#/activity/')) {
      const parts = cleanHash.split('/');
      const id = parts[2];
      return <ActivityDetailView activityId={id} />;
    }

    if (cleanHash === '#/posts') {
      return <PostsView />;
    }

    // Protected Routes Check
    if (!currentUser) {
      if (isAuthLoading) {
        return (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        );
      }
      window.location.hash = '#/login';
      return <FeedView />;
    }

    if (cleanHash === '#/my-registrations') {
      if (currentUser?.role !== 'Volunteer') {
        window.location.hash = '#/feed';
        return <FeedView />;
      }
      return <MyRegistrationsView />;
    }

    if (cleanHash === '#/profile') {
      return <ProfileView />;
    }

    if (cleanHash === '#/request-organizer') {
      if (currentUser?.role !== 'Volunteer') {
        window.location.hash = '#/feed';
        return <FeedView />;
      }
      return <RequestOrganizerView />;
    }

    if (cleanHash === '#/organizer/dashboard') {
      if (currentUser?.role !== 'Organizer') {
        window.location.hash = '#/feed';
        return <FeedView />;
      }
      return <OrganizerDashboard />;
    }

    if (cleanHash === '#/admin/dashboard') {
      if (currentUser?.role !== 'Admin') {
        window.location.hash = '#/feed';
        return <FeedView />;
      }
      return <AdminDashboard />;
    }

    // Default Fallback
    return <FeedView />;
  };

  const cleanHash = currentHash.split('?')[0];
  const isAdminDashboard = cleanHash === '#/admin/dashboard' && currentUser?.role === 'Admin';

  const renderMainContent = () => {
    // If not logged in, allow viewing public pages, but show auth views if path matches
    if (!currentUser) {
      const isAuthRoute = ['#/login', '#/register', '#/forgot-password'].includes(cleanHash) || otpVerifyPhone || otpVerifyEmail;

      if (isAuthRoute) {
        if (currentHash === '#/forgot-password') {
          return (
            <ForgotPasswordView
              onBackToLogin={() => {
                window.location.hash = '#/login';
              }}
            />
          );
        }
        if (otpVerifyPhone || otpVerifyEmail) {
          return (
            <OTPVerifyView
              phoneNumber={otpVerifyPhone || otpVerifyEmail || ""}
              email={otpVerifyEmail || undefined}
              onVerifySuccess={() => {
                setOtpVerifyPhone(null);
                setOtpVerifyEmail(null);
                setIsRegisterMode(false); // take back to login page
                window.location.hash = '#/login';
              }}
              onBackToLogin={() => {
                setOtpVerifyPhone(null);
                setOtpVerifyEmail(null);
                window.location.hash = '#/login';
              }}
            />
          );
        }
        if (isRegisterMode || currentHash === '#/register') {
          return (
            <RegisterView
              onNavigateToLogin={() => {
                setIsRegisterMode(false);
                window.location.hash = '#/login';
              }}
              onRegisterSuccess={(registeredPhone: string, email: string) => {
                setOtpVerifyPhone(registeredPhone);
                setOtpVerifyEmail(email);
              }}
            />
          );
        }
        return (
          <LoginView
            onNavigateToRegister={() => {
              setIsRegisterMode(true);
              window.location.hash = '#/register';
            }}
            onNavigateToOTP={(email) => {
              setOtpVerifyEmail(email);
            }}
          />
        );
      }
    }

    if (isAdminDashboard) {
      return <AdminDashboard />;
    }

    return (
      <div className="min-h-screen flex flex-col bg-background text-on-surface antialiased transition-all">
        {/* Top Loading Bar Overlay */}
        {isAuthLoading && (
          <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-[9999] overflow-hidden">
            <div className="h-full bg-[#006d37] w-1/2 animate-pulse rounded-r-full"></div>
          </div>
        )}
        
        {/* Top Navigation Bar */}
        <Navbar />

        {/* Profile Incomplete Banner - Toast Style */}
        {showIncompleteBanner && (
          <div className="fixed top-[88px] right-4 md:right-8 z-40 w-[calc(100%-2rem)] md:w-[360px] animate-fadeIn shadow-2xl rounded-2xl overflow-hidden border border-amber-100">
            <div className="bg-white p-4 flex items-start gap-3.5 relative">
              <div className="bg-amber-100/80 text-amber-600 p-2 rounded-full shrink-0 flex items-center justify-center">
                 <span className="material-symbols-outlined text-[20px]">warning</span>
              </div>
              <div className="flex-grow pr-5">
                <h4 className="text-sm font-bold text-slate-800 mb-1">Thiếu thông tin</h4>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">Hồ sơ của bạn chưa hoàn thiện. Hãy cập nhật để dễ dàng ứng tuyển các hoạt động nhé.</p>
                <button 
                  onClick={() => { window.location.hash = '#/profile'; }}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors shadow-sm"
                >
                  Cập nhật ngay
                </button>
              </div>
              <button 
                onClick={() => {
                  sessionStorage.setItem('dismissedProfileReminder', 'true');
                  setShowIncompleteBanner(false);
                }}
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-lg transition-colors flex items-center justify-center"
                aria-label="Đóng thông báo"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-grow w-full">
          {getRouteView()}
        </main>

        {/* Footer (Matching design mockup styles) */}
        <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 w-full mt-auto py-12">
          <div className="max-w-[1280px] mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            
            {/* Column 1: Brand & Info */}
            <div className="space-y-4 md:col-span-1">
              <span className="font-headline-md text-xl text-white font-bold flex items-center gap-2 select-none">
                <span className="material-symbols-outlined text-[#10b981]">diversity_3</span>
                Volunteer Connect
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Nền tảng kết nối tình nguyện cộng đồng, cầu nối giữa những tấm lòng nhân ái và các tổ chức hoạt động xã hội ý nghĩa trên khắp cả nước.
              </p>
              <div className="flex items-center gap-3.5 pt-2">
                <a href="#" className="w-8 h-8 rounded-full bg-slate-800 hover:bg-[#10b981] hover:text-white flex items-center justify-center transition-all text-slate-400">
                  <span className="material-symbols-outlined text-sm">public</span>
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-slate-800 hover:bg-[#10b981] hover:text-white flex items-center justify-center transition-all text-slate-400">
                  <span className="material-symbols-outlined text-sm">mail</span>
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-slate-800 hover:bg-[#10b981] hover:text-white flex items-center justify-center transition-all text-slate-400">
                  <span className="material-symbols-outlined text-sm">call</span>
                </a>
              </div>
            </div>

            {/* Column 2: Navigation Links */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">Khám Phá</h4>
              <nav className="flex flex-col gap-2.5 text-xs font-semibold">
                <a className="hover:text-[#10b981] transition-colors" href="#/feed">Bảng Tin Cộng Đồng</a>
                <a className="hover:text-[#10b981] transition-colors" href="#/activities">Danh Sách Hoạt Động</a>
                <a className="hover:text-[#10b981] transition-colors" href="#/posts">Bài Viết Nổi Bật</a>
                <a className="hover:text-[#10b981] transition-colors" href="#/organizer/dashboard">Bảng Tổ Chức</a>
              </nav>
            </div>

            {/* Column 3: Contact Info & Support */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">Liên Hệ & Hỗ Trợ</h4>
              <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-xs mt-0.5 text-[#10b981]">location_on</span>
                  <span>123 Đường Nguyễn Văn Cừ, Quận 5, TP. Hồ Chí Minh</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-xs text-[#10b981]">mail</span>
                  <span>support@volunteerconnect.vn</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-xs text-[#10b981]">call</span>
                  <span>+84 (28) 3835 4409</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="max-w-[1280px] mx-auto px-4 md:px-8 mt-12 pt-6 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500 font-medium">
            <span>
              © 2026 Volunteer Connect. Tất cả các quyền được bảo lưu.
            </span>
            <div className="flex gap-4">
              <a className="hover:text-slate-400 transition-colors" href="#/terms">Chính Sách Bảo Mật</a>
              <a className="hover:text-slate-400 transition-colors" href="#/terms">Điều Khoản Sử Dụng</a>
            </div>
          </div>
        </footer>
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Toast Alert */}
      {notification && (
        <div className={`fixed top-24 right-8 z-[9999] p-4 rounded-xl shadow-lg border text-sm font-semibold flex items-center gap-2 animate-fadeIn ${notification.type === 'success'
          ? 'bg-[#e8f5e9] text-[#006d37] border-[#006d37]/20 shadow-[#006d37]/5'
          : notification.type === 'error'
            ? 'bg-red-50 text-red-700 border-red-200 shadow-red-200/5'
            : 'bg-blue-50 text-blue-700 border-blue-200 shadow-blue-200/5'
          }`}>
          <span className="material-symbols-outlined text-lg">
            {notification.type === 'success' ? 'check_circle' : notification.type === 'error' ? 'error' : 'info'}
          </span>
          {notification.message}
        </div>
      )}

      {/* Confirm Modal Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/45 backdrop-blur-[2px] p-4 text-left animate-fadeIn">
          <div className="bg-white border border-surface-variant/40 rounded-3xl p-6 shadow-xl w-full max-w-sm space-y-4 animate-scaleUp">
            <div>
              <h3 className="text-base font-bold text-on-surface">
                {confirmDialog.title || "Xác nhận hành động"}
              </h3>
              <p className="text-xs text-on-surface-variant mt-2 font-semibold leading-relaxed">
                {confirmDialog.message}
              </p>
            </div>
            <div className="flex justify-end gap-2 text-xs font-semibold pt-2">
              <button
                onClick={closeConfirm}
                className="px-4 py-2 border border-surface-variant rounded-xl text-on-surface-variant hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  try {
                    confirmDialog.onConfirm();
                  } catch (e) {
                    console.error("Error during confirm action:", e);
                  }
                  closeConfirm();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors cursor-pointer"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prompt Modal Dialog */}
      {promptDialog && <PromptModalWrapper dialog={promptDialog} close={closePrompt} />}

      {renderMainContent()}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppContextProvider>
      <AppContent />
    </AppContextProvider>
  );
};

export default App;
