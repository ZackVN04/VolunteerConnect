import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { authService } from '../services/apiService';

const USE_REAL_BACKEND = import.meta.env.VITE_USE_REAL_BACKEND === 'true';

interface RegisterViewProps {
  onNavigateToLogin: () => void;
  onRegisterSuccess: (registeredPhone: string, email: string) => void;
}

const generateRandomPhoneE164 = (): string => {
  const digits = Math.floor(100000000 + Math.random() * 900000000).toString();
  return `+84${digits}`;
};

export const RegisterView: React.FC<RegisterViewProps> = ({ onNavigateToLogin, onRegisterSuccess }) => {
  const { users, setCurrentUser } = useApp();
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullname.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (password !== confirmPassword) {
      alert('Mật khẩu nhập lại không khớp.');
      return;
    }

    if (USE_REAL_BACKEND) {
      try {
        const randomPhone = generateRandomPhoneE164();
        await authService.register(email.trim(), randomPhone, password);
        alert('Đăng ký tài khoản thành công! Hệ thống đã gửi mã OTP xác thực tới số điện thoại ảo đăng ký.');
        onRegisterSuccess(randomPhone, email.trim());
      } catch (err: any) {
        let errorMsg = 'Đăng ký thất bại. Vui lòng thử lại.';
        const data = err.response?.data;
        if (data) {
          if (typeof data.detail === 'string') {
            errorMsg = data.detail;
          } else if (Array.isArray(data.detail)) {
            errorMsg = data.detail.map((d: any) => d.msg).join('\n');
          } else if (data.message) {
            errorMsg = data.message;
          }
        }
        alert(errorMsg);
      }
      return;
    }

    // Check if email already registered
    const emailExists = users.some(u => u.email === email.trim());
    if (emailExists) {
      alert('Email này đã được sử dụng');
      return;
    }

    // Simulating user creation
    const randomPhone = generateRandomPhoneE164();
    const newUser = {
      _id: `user_${Date.now()}`,
      phone: randomPhone,
      is_phone_verified: true,
      otp_code: null,
      otp_expires_at: null,
      otp_send_count: 0,
      otp_cooldown_until: null,
      email: email.trim(),
      password_hash: 'hashed_password',
      role: 'Volunteer' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profile: {
        full_name: fullname.trim(),
        bio: 'Tôi là thành viên mới tham gia cộng đồng Volunteer Connect.',
        area_of_interest: 'TP. Hồ Chí Minh',
        skills: [],
        joined_activity_count: 0
      }
    };

    // Update Simulated database users list
    users.push(newUser);
    setCurrentUser(newUser);

    alert('Đăng ký tài khoản thành công! Bạn đã được đăng nhập tự động.');
    window.location.hash = '#/feed';
  };

  return (
    <div className="bg-background text-on-surface antialiased min-h-screen flex flex-col md:flex-row text-left font-body-md">
      {/* Left Side: Illustration (Hidden on Mobile) */}
      <div className="hidden md:flex md:w-1/2 relative bg-secondary-container items-center justify-center overflow-hidden h-screen">
        <div className="absolute inset-0 bg-primary/5 z-10 mix-blend-multiply"></div>
        <img 
          alt="Volunteer Connect Illustration" 
          className="w-full h-full object-cover z-0 transition-transform duration-500 scale-105" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBnEQUP28LzxzBOwV3aI5ATee6zxKimNALIuGdcxn1IGeuXz0I-8pLcpXgqL-BT8nGX5h8Ykh3IwUkle1VDFkYZ4M9oY429ITgwQyf_iAOv3vkS5KNJF-G-jsudlsMC5hCuZTUItnzNXpQtno8LOyjSHs8HgLQqtNauvldRlaVoyywdr-Yd-_KiSmbSSldX7BYzT3dlL8rYfb8dBtscyLxVvYLd7_oCqFlQq5AaEPkH7oB0q16RRSv4cA"
        />
      </div>

      {/* Right Side: Registration Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-margin-mobile md:p-lg bg-surface h-screen overflow-y-auto">
        <div className="w-full max-w-[440px] space-y-6">
          
          {/* Brand Logo header */}
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[32px] filled">volunteer_activism</span>
            <span className="font-headline-md text-lg text-primary font-bold">Volunteer Connect</span>
          </div>

          {/* Header */}
          <div>
            <h1 className="font-display-lg-mobile text-2xl md:text-3xl font-bold text-on-surface mb-2">Tham gia cộng tác</h1>
            <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
              Tạo tài khoản để bắt đầu hành trình tình nguyện và kết nối với những người có cùng lý tưởng xã hội.
            </p>
          </div>

          {/* Registration Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Full Name Input */}
            <div className="space-y-1">
              <label className="block font-label-sm text-xs text-on-surface font-semibold" htmlFor="fullname">Họ và tên *</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">person</span>
                <input 
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-sm text-on-surface placeholder-outline-variant/60 focus:outline-none focus:border-primary" 
                  id="fullname" 
                  name="fullname" 
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  placeholder="Nguyễn Văn A" 
                  required
                  type="text" 
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-1">
              <label className="block font-label-sm text-xs text-on-surface font-semibold" htmlFor="email">Email đăng nhập *</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">mail</span>
                <input 
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-sm text-on-surface placeholder-outline-variant/60 focus:outline-none focus:border-primary" 
                  id="email" 
                  name="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ví dụ: nguyenvana@gmail.com" 
                  required
                  type="email" 
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label className="block font-label-sm text-xs text-on-surface font-semibold" htmlFor="password">Mật khẩu *</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">lock</span>
                <input 
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-sm text-on-surface placeholder-outline-variant/60 focus:outline-none focus:border-primary" 
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

            {/* Confirm Password Input */}
            <div className="space-y-1">
              <label className="block font-label-sm text-xs text-on-surface font-semibold" htmlFor="confirmPassword">Nhập lại mật khẩu *</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">lock_reset</span>
                <input 
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-sm text-on-surface placeholder-outline-variant/60 focus:outline-none focus:border-primary" 
                  id="confirmPassword" 
                  name="confirmPassword" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••" 
                  required
                  type="password" 
                />
              </div>
            </div>

            {/* Submit Button */}
            <button 
              className="w-full mt-4 bg-primary hover:bg-tertiary text-on-primary font-label-sm text-sm font-bold rounded-full py-3 px-6 transition-all active:scale-95 flex justify-center items-center gap-1.5 shadow-sm" 
              type="submit"
            >
              Đăng ký tài khoản
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </form>

          {/* Login Link */}
          <div className="text-center font-body-md text-xs text-on-surface-variant pt-2">
            Đã có tài khoản? 
            <button 
              onClick={onNavigateToLogin}
              className="text-primary font-bold hover:text-tertiary hover:underline transition-colors ml-1"
            >
              Đăng nhập ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default RegisterView;
