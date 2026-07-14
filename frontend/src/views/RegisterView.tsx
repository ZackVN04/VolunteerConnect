import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { USE_REAL_BACKEND } from '../config/backend';
import { authService } from '../services/apiService';

interface RegisterViewProps {
  onNavigateToLogin: () => void;
  onRegisterSuccess: (registeredPhone: string, email: string) => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ onNavigateToLogin, onRegisterSuccess }) => {
  const { users } = useApp();
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
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

    if (!fullname.trim() || !email.trim() || !phone.trim() || !password.trim() || !confirmPassword.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ thông tin.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg('Email không hợp lệ. Vui lòng nhập đúng định dạng (ví dụ: name@example.com).');
      return;
    }

    const cleanPhone = phone.replace(/[\s.-]/g, '');
    const phoneRegex = /^(0|\+84)\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setErrorMsg('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại gồm 10 chữ số (ví dụ: 0789123456).');
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
        await authService.register(fullname.trim(), email.trim(), cleanPhone, password);
        setSuccessMsg('Đăng ký tài khoản thành công! Hệ thống đã gửi mã OTP xác thực tới địa chỉ email đăng ký.');

        setTimeout(() => {
          onRegisterSuccess(cleanPhone, email.trim());
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

    const newUser = {
      _id: `user_${Date.now()}`,
      phone: cleanPhone,
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
      onRegisterSuccess(cleanPhone, email.trim());
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-4 py-8 text-left font-body-md">
      {/* Center Card */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm w-full max-w-md px-8 py-10 space-y-6">
        
        {/* Brand Logo header */}
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#006d37] flex items-center justify-center text-white font-bold text-sm select-none">
              vc
            </div>
            <span className="text-[#006d37] font-bold text-lg tracking-tight font-headline-md">Volunteer Connect</span>
          </div>
          
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold text-gray-900 font-headline-md">Đăng ký tài khoản</h1>
            <p className="text-sm text-gray-500 font-medium">Bắt đầu hành trình kết nối và cống hiến vì cộng đồng</p>
          </div>
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
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider" htmlFor="fullname">Họ tên</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" style={{ fontSize: 18 }}>person</span>
              <input
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#006d37] focus:ring-2 focus:ring-[#006d37]/20 placeholder-gray-400 transition-all font-semibold"
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
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider" htmlFor="email">Email</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" style={{ fontSize: 18 }}>mail</span>
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

          {/* Số điện thoại Input */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider" htmlFor="phone">Số điện thoại</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" style={{ fontSize: 18 }}>phone</span>
              <input
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#006d37] focus:ring-2 focus:ring-[#006d37]/20 placeholder-gray-400 transition-all font-semibold"
                id="phone"
                name="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0789.xxx.xxx"
                required
                type="text"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider" htmlFor="password">Mật khẩu</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" style={{ fontSize: 18 }}>lock</span>
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

          {/* Confirm Password Input */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider" htmlFor="confirmPassword">Nhập lại mật khẩu *</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" style={{ fontSize: 18 }}>lock_reset</span>
              <input
                className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#006d37] focus:ring-2 focus:ring-[#006d37]/20 placeholder-gray-400 transition-all font-semibold"
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
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    {showConfirmPassword ? "visibility" : "visibility_off"}
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
              {loading ? 'Đang đăng ký tài khoản...' : 'Đăng ký'}
              <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
            </button>
          </div>
        </form>

        {/* Login Link */}
        <div className="text-center text-xs text-gray-500 font-semibold pt-1">
          Đã có tài khoản?
          <button
            onClick={onNavigateToLogin}
            className="text-[#006d37] hover:underline font-bold transition-colors ml-1 cursor-pointer"
            disabled={loading}
          >
            Đăng nhập
          </button>
        </div>
      </div>
    </div>
  );
};
export default RegisterView;
