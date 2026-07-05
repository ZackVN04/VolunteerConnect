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
import './App.css';

const AppContent: React.FC = () => {
  const { currentUser } = useApp();
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/feed');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [otpVerifyPhone, setOtpVerifyPhone] = useState<string | null>(null);
  const [otpVerifyEmail, setOtpVerifyEmail] = useState<string | null>(null);

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

  // If not logged in, show Login, Register, Forgot Password, or OTP verification screens
  if (!currentUser) {
    if (currentHash === '#/forgot-password') {
      return (
        <ForgotPasswordView 
          onBackToLogin={() => {
            window.location.hash = '#/feed';
          }}
        />
      );
    }
    if (otpVerifyPhone) {
      return (
        <OTPVerifyView 
          phoneNumber={otpVerifyPhone}
          email={otpVerifyEmail || undefined}
          onVerifySuccess={() => {
            setOtpVerifyPhone(null);
            setOtpVerifyEmail(null);
            setIsRegisterMode(false); // take back to login page
          }}
          onBackToLogin={() => {
            setOtpVerifyPhone(null);
            setOtpVerifyEmail(null);
          }}
        />
      );
    }
    if (isRegisterMode) {
      return (
        <RegisterView 
          onNavigateToLogin={() => setIsRegisterMode(false)} 
          onRegisterSuccess={(registeredPhone: string, email: string) => {
            setOtpVerifyPhone(registeredPhone);
            setOtpVerifyEmail(email);
          }}
        />
      );
    }
    return <LoginView onNavigateToRegister={() => setIsRegisterMode(true)} />;
  }

  // Parse Hash Route
  const getRouteView = () => {
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

    if (cleanHash === '#/my-registrations') {
      if (currentUser.role !== 'Volunteer') {
        window.location.hash = '#/feed';
        return <FeedView />;
      }
      return <MyRegistrationsView />;
    }

    if (cleanHash === '#/profile') {
      return <ProfileView />;
    }

    if (cleanHash === '#/organizer/dashboard') {
      if (currentUser.role !== 'Organizer') {
        window.location.hash = '#/feed';
        return <FeedView />;
      }
      return <OrganizerDashboard />;
    }

    if (cleanHash === '#/admin/dashboard') {
      if (currentUser.role !== 'Admin') {
        window.location.hash = '#/feed';
        return <FeedView />;
      }
      return <AdminDashboard />;
    }

    // Default Fallback
    return <FeedView />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface antialiased transition-all">
      {/* Top Navigation Bar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-grow w-full">
        {getRouteView()}
      </main>

      {/* Footer (Matching design mockup styles) */}
      <footer className="bg-surface-container-low dark:bg-inverse-surface border-t border-surface-variant w-full mt-auto py-8">
        <div className="w-full py-2 px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-6 max-w-[1280px] mx-auto text-left">
          <div className="flex flex-col gap-2">
            <span className="font-headline-md text-base text-primary dark:text-primary-fixed font-bold flex items-center gap-1.5 select-none">
              <span className="material-symbols-outlined text-sm">diversity_3</span>
              Volunteer Connect
            </span>
            <span className="text-xs text-on-surface-variant">
              © 2026 Volunteer Connect. Nền tảng kết nối tình nguyện cộng đồng.
            </span>
          </div>
          
          <nav className="flex flex-wrap gap-4 text-xs font-semibold">
            <a className="text-on-surface-variant hover:text-primary transition-colors" href="#/feed">Bảng Tin</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors" href="#/activities">Khám Phá</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors" href="#/profile">Hồ Sơ</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors" href="#/terms">Chính Sách Bảo Mật</a>
          </nav>
        </div>
      </footer>
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
