import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { USE_REAL_BACKEND } from '../config/backend';
import { authService } from '../services/apiService';

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
        if (user.role === 'Admin') {
          window.location.hash = '#/admin/dashboard';
        } else {
          window.location.hash = '#/feed';
        }
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
      if (matchedUser.role === 'Admin') {
        window.location.hash = '#/admin/dashboard';
      } else {
        window.location.hash = '#/feed';
      }
    } else {
      setErrorMsg('Tài khoản không tồn tại. Vui lòng thử lại.');
    }
  };


  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-4 py-8 text-left font-body-md">
      {/* Center Card */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm w-full max-w-md px-8 py-10 space-y-6">
        
        {/* Logo and Brand Header */}
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#006d37] flex items-center justify-center text-white font-bold text-sm select-none">
              vc
            </div>
            <span className="text-[#006d37] font-bold text-lg tracking-tight font-headline-md">Volunteer Connect</span>
          </div>
          
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold text-gray-900 font-headline-md">Chào mừng trở lại</h1>
            <p className="text-sm text-gray-500 font-medium">Đăng nhập để tiếp tục hành trình</p>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs font-semibold leading-relaxed">
            {errorMsg}
            {showVerifyLink && (
              <button 
                type="button" 
                onClick={() => onNavigateToOTP && onNavigateToOTP(email.trim())}
                className="block mt-2 text-[#006d37] hover:underline font-bold cursor-pointer"
              >
                Nhấp vào đây để nhập mã OTP xác thực.
              </button>
            )}
          </div>
        )}

        {/* Login Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Email Field */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider" htmlFor="email">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-gray-400" style={{ fontSize: 18 }}>
                  mail
                </span>
              </div>
              <input
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#006d37] focus:ring-2 focus:ring-[#006d37]/20 placeholder-gray-400 transition-all font-semibold"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nguyenvana@gmail.com"
                required
                type="email"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider" htmlFor="password">
                Mật khẩu
              </label>
              <a className="text-xs text-[#006d37] hover:underline font-bold" href="#/forgot-password">
                Quên mật khẩu?
              </a>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-gray-400" style={{ fontSize: 18 }}>lock</span>
              </div>
              <input
                className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#006d37] focus:ring-2 focus:ring-[#006d37]/20 placeholder-gray-400 transition-all font-semibold"
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                type={showPassword ? "text" : "password"}
                disabled={loading}
              />
              {password && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    {showPassword ? "visibility" : "visibility_off"}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-2">
            <button
              className="bg-[#006d37] hover:bg-[#005027] text-white font-semibold rounded-full px-8 py-2.5 text-sm transition-all disabled:opacity-50 cursor-pointer shadow-sm flex items-center gap-1.5"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink mx-4 text-gray-400 text-xs font-semibold uppercase tracking-wider">hoặc</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        {/* Sign up Link */}
        <p className="text-center text-xs text-gray-500 font-semibold pt-1">
          Chưa có tài khoản?
          <button
            onClick={onNavigateToRegister}
            className="text-[#006d37] hover:underline font-bold ml-1 cursor-pointer"
          >
            Đăng ký ngay
          </button>
        </p>

      </div>
    </div>
  );
};

export default LoginView;
