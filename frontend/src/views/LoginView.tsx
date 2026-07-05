import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { authService } from '../services/apiService';

const USE_REAL_BACKEND = true;

interface LoginViewProps {
  onNavigateToRegister: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onNavigateToRegister }) => {
  const { users, loginAs, setCurrentUser } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    if (USE_REAL_BACKEND) {
      try {
        const { token, user } = await authService.login(email.trim(), password);
        localStorage.setItem('token', token);
        setCurrentUser(user);
        window.location.hash = '#/feed';
      } catch (err: any) {
        setErrorMsg(err.response?.data?.detail || err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
      }
      return;
    }

    // Search user
    const matchedUser = users.find(u => u.email === email.trim());
    if (matchedUser) {
      loginAs(matchedUser._id);
      window.location.hash = '#/feed';
    } else {
      setErrorMsg('Tài khoản không tồn tại. Vui lòng thử lại hoặc chọn một tài khoản Demo có sẵn bên dưới.');
    }
  };


  return (
    <div className="flex w-full h-screen overflow-hidden text-left font-body-md bg-background">
      {/* Left Side: Illustration (Hidden on mobile/tablet) */}
      <div className="hidden lg:flex w-1/2 bg-surface-container-low h-full items-center justify-center relative overflow-hidden">
        <div 
          aria-hidden="true" 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-500 scale-105" 
          style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBnEQUP28LzxzBOwV3aI5ATee6zxKimNALIuGdcxn1IGeuXz0I-8pLcpXgqL-BT8nGX5h8Ykh3IwUkle1VDFkYZ4M9oY429ITgwQyf_iAOv3vkS5KNJF-G-jsudlsMC5hCuZTUItnzNXpQtno8LOyjSHs8HgLQqtNauvldRlaVoyywdr-Yd-_KiSmbSSldX7BYzT3dlL8rYfb8dBtscyLxVvYLd7_oCqFlQq5AaEPkH7oB0q16RRSv4cA")' }}
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

        <div className="w-full max-w-md space-y-6 mt-16 md:mt-0 py-6">
          {/* Header text */}
          <div className="text-center space-y-2">
            <h1 className="font-display-lg-mobile md:font-display-lg text-2xl md:text-3xl text-on-surface font-bold">Chào mừng trở lại</h1>
            <p className="font-body-md text-sm text-on-surface-variant">Đăng nhập để tiếp tục hành trình tình nguyện của bạn</p>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs font-semibold leading-relaxed">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="space-y-1">
              <label className="block font-label-sm text-xs text-on-surface font-semibold" htmlFor="email">
                Email đăng nhập
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
                  placeholder="Ví dụ: nguyenvana@gmail.com" 
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
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg focus:outline-none focus:border-primary text-sm placeholder-on-surface-variant/50 text-on-surface" 
                  id="password" 
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  required 
                  type="password"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button 
              className="w-full py-3 px-6 bg-primary text-on-primary rounded-full font-label-sm text-sm hover:bg-tertiary active:scale-[0.98] transition-all flex items-center justify-center gap-1 shadow-sm font-bold mt-4" 
              type="submit"
            >
              Đăng nhập
              <span className="material-symbols-outlined text-[20px]">login</span>
            </button>
          </form>

          {/* Divider and Demo Login Quick Switcher (Hidden in Real Backend mode) */}
          {!USE_REAL_BACKEND && (
            <>
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-outline-variant"></div>
                <span className="flex-shrink-0 mx-4 font-body-md text-xs text-on-surface-variant font-semibold">hoặc đăng nhập nhanh bằng các tài khoản Demo</span>
                <div className="flex-grow border-t border-outline-variant"></div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {users.slice(0, 4).map(u => (
                  <button
                    key={u._id}
                    onClick={() => {
                      loginAs(u._id);
                      window.location.hash = '#/feed';
                    }}
                    className="p-2 border border-outline-variant hover:bg-primary-container/10 hover:border-primary/50 rounded-lg text-left transition-colors flex flex-col justify-between text-xs bg-surface-container-low"
                  >
                    <span className="font-bold text-on-surface truncate w-full text-[11px]">{u.profile.full_name}</span>
                    <span className="text-[9px] text-primary font-bold uppercase mt-0.5">{u.role}</span>
                  </button>
                ))}
              </div>
            </>
          )}

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
