import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { authService, formatPhoneE164 } from '../services/apiService';
import { ASSETS } from '../constants/assets';

const USE_REAL_BACKEND = true;

interface RegisterViewProps {
  onNavigateToLogin: () => void;
  onRegisterSuccess: (registeredPhone: string, email: string) => void;
}

const generateRandomPhoneE164 = (): string => {
  const digits = Math.floor(100000000 + Math.random() * 900000000).toString();
  return `+84${digits}`;
};

export const RegisterView: React.FC<RegisterViewProps> = ({ onNavigateToLogin, onRegisterSuccess }) => {
  const { users } = useApp();
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Alert and loading states
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setErrorMsg('');
    setSuccessMsg('');

    if (!fullname.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ thông tin.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg('Email không hợp lệ. Vui lòng nhập đúng định dạng (ví dụ: name@example.com).');
      return;
    }

    // Quy tắc mật khẩu mạnh: ít nhất 8 ký tự, 1 chữ hoa, 1 chữ thường, 1 chữ số, 1 ký tự đặc biệt
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setErrorMsg('Mật khẩu phải có độ dài tối thiểu 8 ký tự và bao gồm ít nhất 1 chữ cái viết hoa, 1 chữ cái viết thường, 1 chữ số và 1 ký tự đặc biệt.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu nhập lại không khớp.');
      return;
    }

    setLoading(true);

    if (USE_REAL_BACKEND) {
      try {
        const randomPhone = generateRandomPhoneE164();
        await authService.register(fullname.trim(), email.trim(), randomPhone, password);
        setSuccessMsg('Đăng ký tài khoản thành công! Hệ thống đã gửi mã OTP xác thực tới địa chỉ email đăng ký.');

        setTimeout(() => {
          onRegisterSuccess(randomPhone, email.trim());
        }, 2000);
      } catch (err: any) {
        let msg = 'Đăng ký thất bại. Vui lòng thử lại.';
        const data = err.response?.data;
        if (data) {
          if (typeof data.detail === 'string') {
            msg = data.detail;
          } else if (Array.isArray(data.detail)) {
            msg = data.detail.map((d: any) => d.msg).join('\n');
          } else if (data.message) {
            msg = data.message;
          }
        }
        setErrorMsg(msg);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Check if email already registered in simulated DB
    const emailExists = users.some(u => u.email === email.trim());
    if (emailExists) {
      setErrorMsg('Email này đã được sử dụng.');
      setLoading(false);
      return;
    }

    // Simulating delay for user creation
    await new Promise((resolve) => setTimeout(resolve, 800));

    const randomPhone = generateRandomPhoneE164();
    const newUser = {
      _id: `user_${Date.now()}`,
      phone: randomPhone,
      is_phone_verified: false,
      otp_code: '123456',
      otp_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      otp_send_count: 1,
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

    users.push(newUser);
    setSuccessMsg('Đăng ký tài khoản thành công! Mã OTP xác thực (giả lập) đã được gửi tới địa chỉ email của bạn. Vui lòng sử dụng mã 123456 để xác thực.');
    setLoading(false);

    setTimeout(() => {
      onRegisterSuccess(randomPhone, email.trim());
    }, 2000);
  };

  return (
    <div className="bg-background text-on-surface antialiased min-h-screen flex flex-col md:flex-row text-left font-body-md">
      {/* Left Side: Illustration (Hidden on Mobile) */}
      <div className="hidden md:flex md:w-1/2 relative bg-secondary-container items-center justify-center overflow-hidden h-screen">
        <div className="absolute inset-0 bg-primary/5 z-10 mix-blend-multiply"></div>
        <img
          alt="Volunteer Connect Illustration"
          className="w-full h-full object-cover z-0 transition-transform duration-500 scale-105"
          src={ASSETS.authBackground}
        />
      </div>

      {/* Right Side: Registration Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-margin-mobile md:p-lg bg-surface h-screen overflow-y-auto">
        <div className="w-full max-w-[440px] space-y-6">

          {/* Brand Logo header */}
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[32px] filled">volunteer_activism</span>
            <span className="font-headline-md text-lg text-primary font-bold tracking-tight">Volunteer Connect</span>
          </div>

          {/* Header titles */}
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl text-on-surface font-bold">Đăng ký tài khoản</h1>
            <p className="font-body-md text-sm text-on-surface-variant">Bắt đầu hành trình kết nối và cống hiến vì cộng đồng</p>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs font-semibold leading-relaxed">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-xs font-semibold leading-relaxed">
              {successMsg}
            </div>
          )}

          {/* Register Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Họ và tên Input */}
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
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-1">
              <label className="block font-label-sm text-xs text-on-surface font-semibold" htmlFor="email">Email *</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">mail</span>
                <input
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-sm text-on-surface placeholder-outline-variant/60 focus:outline-none focus:border-primary"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder=" Email"
                  required
                  type="email"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label className="block font-label-sm text-xs text-on-surface font-semibold" htmlFor="password">Mật khẩu *</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">lock</span>
                <input
                  className="w-full pl-10 pr-10 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-sm text-on-surface placeholder-outline-variant/60 focus:outline-none focus:border-primary"
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
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline-variant hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">
                      {showPassword ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-1">
              <label className="block font-label-sm text-xs text-on-surface font-semibold" htmlFor="confirmPassword">Nhập lại mật khẩu *</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">lock_reset</span>
                <input
                  className="w-full pl-10 pr-10 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-sm text-on-surface placeholder-outline-variant/60 focus:outline-none focus:border-primary"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  type={showConfirmPassword ? "text" : "password"}
                  disabled={loading}
                />
                {confirmPassword && (
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline-variant hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">
                      {showConfirmPassword ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              className="w-full mt-4 bg-primary hover:bg-tertiary text-on-primary font-label-sm text-sm font-bold rounded-full py-3 px-6 transition-all active:scale-95 flex justify-center items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Đang đăng ký tài khoản...' : 'Đăng ký tài khoản'}
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </form>

          {/* Login Link */}
          <div className="text-center font-body-md text-xs text-on-surface-variant pt-2">
            Đã có tài khoản?
            <button
              onClick={onNavigateToLogin}
              className="text-primary font-bold hover:text-tertiary hover:underline transition-colors ml-1"
              disabled={loading}
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
