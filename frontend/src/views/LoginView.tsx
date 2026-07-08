import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { authService } from '../services/apiService';
import { ASSETS } from '../constants/assets';

const USE_REAL_BACKEND = true;

interface LoginViewProps {
  onNavigateToRegister: () => void;
  onNavigateToOTP?: (email: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onNavigateToRegister, onNavigateToOTP }) => {
  const { users, loginAs, setCurrentUser } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showVerifyLink, setShowVerifyLink] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;
    setErrorMsg('');
    setShowVerifyLink(false);
    setLoading(true);

    if (USE_REAL_BACKEND) {
      try {
        const { token, user } = await authService.login(email.trim(), password);
        localStorage.setItem('token', token);
        setCurrentUser(user);
        window.location.hash = '#/feed';
      } catch (err: any) {
        let msg = 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
        const detail = err.response?.data?.detail;
        if (typeof detail === 'string') {
          msg = detail;
        } else if (Array.isArray(detail)) {
          msg = detail.map((d: any) => d.msg).join('\n');
        } else if (err.response?.data?.message) {
          msg = err.response.data.message;
        }
        setErrorMsg(msg);

        // Detect 403 activation required
        if (
          err.response?.status === 403 || 
          msg.toLowerCase().includes('xác thực') || 
          msg.toLowerCase().includes('otp')
        ) {
          setShowVerifyLink(true);
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    // Simulated login delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    setLoading(false);

    // Search user
    const matchedUser = users.find(u => u.email === email.trim());
    if (matchedUser) {
      loginAs(matchedUser._id);
      window.location.hash = '#/feed';
    } else {
      setErrorMsg('Tài khoản không tồn tại. Vui lòng thử lại.');
    }
  };


  return (
    <div className="flex w-full h-screen overflow-hidden text-left font-body-md bg-background">
      {/* Left Side: Illustration (Hidden on mobile/tablet) */}
      <div className="hidden lg:flex w-1/2 bg-surface-container-low h-full items-center justify-center relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-500 scale-105"
          style={{ backgroundImage: `url("${ASSETS.authBackground}")` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent"></div>
        <div className="absolute bottom-12 left-12 right-12 text-white z-10 space-y-2">
          <h2 className="font-headline-md text-2xl font-bold">Kết Nối Hoạt Động Cộng Đồng</h2>
          <p className="text-sm opacity-90 leading-relaxed max-w-md">Tham gia mạng lưới gắn kết tình nguyện viên và cùng nhau tạo dựng những tác động thiết thực cho xã hội.</p>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 h-full flex flex-col items-center justify-center bg-surface px-margin-mobile md:px-lg relative overflow-y-auto">

        {/* Logo / Brand Header */}
        <div className="absolute top-8 left-6 md:left-12 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[32px] filled">volunteer_activism</span>
          <span className="font-headline-md text-lg text-primary font-bold tracking-tight">Volunteer Connect</span>
        </div>

        {/* Back to Homepage Button */}
        <a 
          href="#/feed"
          className="absolute top-8 right-6 md:right-12 flex items-center gap-1 text-on-surface-variant hover:text-primary font-bold text-xs transition-colors py-1.5 px-3 rounded-xl border border-outline-variant/60 hover:bg-slate-50 cursor-pointer shadow-sm"
        >
          <span className="material-symbols-outlined text-sm font-bold">arrow_back</span>
          <span>Quay lại trang chủ</span>
        </a>

        <div className="w-full max-w-md space-y-6 mt-16 md:mt-0 py-6">
          {/* Header text */}
          <div className="text-center space-y-2">
            <h1 className="font-display-lg-mobile md:font-display-lg text-2xl md:text-3xl text-on-surface font-bold">Chào mừng trở lại</h1>
            <p className="font-body-md text-sm text-on-surface-variant">Đăng nhập để tiếp tục hành trình tình nguyện của bạn</p>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs font-semibold leading-relaxed">
              {errorMsg}
              {showVerifyLink && (
                <button 
                  type="button" 
                  onClick={() => onNavigateToOTP && onNavigateToOTP(email.trim())}
                  className="block mt-2 text-primary hover:text-tertiary font-bold underline cursor-pointer"
                >
                  Nhấp vào đây để nhập mã OTP xác thực.
                </button>
              )}
            </div>
          )}

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="space-y-1">
              <label className="block font-label-sm text-xs text-on-surface font-semibold" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline text-sm">
                    mail
                  </span>
                </div>
                <input
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg focus:outline-none focus:border-primary text-sm placeholder-on-surface-variant/50 text-on-surface"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  type="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block font-label-sm text-xs text-on-surface font-semibold" htmlFor="password">Mật khẩu</label>
                <a className="font-label-sm text-xs text-primary hover:text-tertiary font-bold" href="#/forgot-password">Quên mật khẩu?</a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline text-sm">lock</span>
                </div>
                <input
                  className="w-full pl-10 pr-10 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg focus:outline-none focus:border-primary text-sm placeholder-on-surface-variant/50 text-on-surface"
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  type={showPassword ? "text" : "password"}
                />
                {password && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline-variant hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">
                      {showPassword ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              className="w-full py-3 px-6 bg-primary text-on-primary rounded-full font-label-sm text-sm hover:bg-tertiary active:scale-[0.98] transition-all flex items-center justify-center gap-1 shadow-sm font-bold mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              <span className="material-symbols-outlined text-[20px]">login</span>
            </button>
          </form>

          {/* Sign up Link */}
          <p className="text-center font-body-md text-xs text-on-surface-variant pt-2">
            Chưa có tài khoản?
            <button
              onClick={onNavigateToRegister}
              className="font-label-sm text-xs text-primary hover:text-tertiary font-bold hover:underline ml-1"
            >
              Đăng ký ngay
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
export default LoginView;
