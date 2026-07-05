import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { authService } from '../services/apiService';

const USE_REAL_BACKEND = import.meta.env.VITE_USE_REAL_BACKEND === 'true';

interface ForgotPasswordViewProps {
  onBackToLogin: () => void;
}

export const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({ onBackToLogin }) => {
  const { users } = useApp();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [simulatedOtp, setSimulatedOtp] = useState('');

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Vui lòng điền địa chỉ email.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (USE_REAL_BACKEND) {
      try {
        const res = await authService.forgotPassword(email.trim());
        setSuccessMsg(res.message || 'Mã OTP đã được gửi về email của bạn.');
        setStep(2);
      } catch (err: any) {
        let msg = 'Không thể yêu cầu mã OTP. Vui lòng kiểm tra lại email.';
        const detail = err.response?.data?.detail;
        if (typeof detail === 'string') {
          msg = detail;
        } else if (Array.isArray(detail)) {
          msg = detail.map((d: any) => d.msg).join('\n');
        } else if (err.response?.data?.message) {
          msg = err.response.data.message;
        }
        setErrorMsg(msg);
      } finally {
        setLoading(false);
      }
      return;
    }

    // SIMULATED OFFLINE MODE
    const userExists = users.some(u => u.email === email.trim());
    if (!userExists) {
      setErrorMsg('Email này không tồn tại trong hệ thống giả lập.');
      setLoading(false);
      return;
    }

    // Generate random 6 digit OTP code
    const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setSimulatedOtp(mockOtp);
    alert(`[MÔ PHỎNG EMAIL] Hệ thống đã gửi mã OTP khôi phục mật khẩu: ${mockOtp}`);
    setSuccessMsg('Mã OTP khôi phục mật khẩu đã được gửi tới email giả lập của bạn.');
    setStep(2);
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setErrorMsg('Mã OTP phải có đúng 6 chữ số.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('Mật khẩu mới phải từ 6 ký tự trở lên.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (USE_REAL_BACKEND) {
      try {
        const res = await authService.resetPassword(email.trim(), otpCode, newPassword);
        setSuccessMsg(res.message || 'Đặt lại mật khẩu thành công!');
        setTimeout(() => {
          onBackToLogin();
        }, 2000);
      } catch (err: any) {
        let msg = 'Mã OTP không chính xác hoặc đã hết hạn.';
        const detail = err.response?.data?.detail;
        if (typeof detail === 'string') {
          msg = detail;
        } else if (Array.isArray(detail)) {
          msg = detail.map((d: any) => d.msg).join('\n');
        } else if (err.response?.data?.message) {
          msg = err.response.data.message;
        }
        setErrorMsg(msg);
      } finally {
        setLoading(false);
      }
      return;
    }

    // SIMULATED OFFLINE MODE
    if (otpCode !== simulatedOtp) {
      setErrorMsg('Mã OTP không chính xác.');
      setLoading(false);
      return;
    }

    // Find and update user in simulation
    const matchedUserIndex = users.findIndex(u => u.email === email.trim());
    if (matchedUserIndex !== -1) {
      // Update simulated user password
      users[matchedUserIndex].password_hash = 'simulated_' + newPassword;
      setSuccessMsg('Đặt lại mật khẩu thành công! Bạn có thể sử dụng mật khẩu mới để đăng nhập.');
      setTimeout(() => {
        onBackToLogin();
      }, 2000);
    } else {
      setErrorMsg('Lỗi không xác định.');
    }
    setLoading(false);
  };

  return (
    <div className="flex w-full h-screen overflow-hidden text-left font-body-md bg-background">
      {/* Left Side: Illustration */}
      <div className="hidden lg:flex w-1/2 bg-surface-container-low h-full items-center justify-center relative overflow-hidden">
        <div 
          aria-hidden="true" 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105" 
          style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBnEQUP28LzxzBOwV3aI5ATee6zxKimNALIuGdcxn1IGeuXz0I-8pLcpXgqL-BT8nGX5h8Ykh3IwUkle1VDFkYZ4M9oY429ITgwQyf_iAOv3vkS5KNJF-G-jsudlsMC5hCuZTUItnzNXpQtno8LOyjSHs8HgLQqtNauvldRlaVoyywdr-Yd-_KiSmbSSldX7BYzT3dlL8rYfb8dBtscyLxVvYLd7_oCqFlQq5AaEPkH7oB0q16RRSv4cA")' }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent"></div>
        <div className="absolute bottom-12 left-12 right-12 text-white z-10 space-y-2">
          <h2 className="font-headline-md text-2xl font-bold">Khôi Phục Mật Khẩu</h2>
          <p className="text-sm opacity-90 leading-relaxed max-w-md">Lấy lại quyền truy cập vào tài khoản của bạn để tiếp tục tham gia các hoạt động cộng đồng ý nghĩa.</p>
        </div>
      </div>

      {/* Right Side: Step forms */}
      <div className="w-full lg:w-1/2 h-full flex flex-col items-center justify-center bg-surface px-6 relative overflow-y-auto">
        <div className="absolute top-8 left-6 md:left-12 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[32px] filled">volunteer_activism</span>
          <span className="font-headline-md text-lg text-primary font-bold tracking-tight">Volunteer Connect</span>
        </div>

        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl md:text-3xl text-on-surface font-bold">Quên mật khẩu</h1>
            <p className="text-sm text-on-surface-variant">
              {step === 1 
                ? 'Nhập địa chỉ email đăng ký để nhận mã OTP khôi phục mật khẩu.' 
                : `Nhập mã xác thực đã gửi đến email của bạn và mật khẩu mới.`
              }
            </p>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-xs font-semibold">
              {successMsg}
            </div>
          )}

          {step === 1 ? (
            /* STEP 1: Enter email */
            <form className="space-y-4" onSubmit={handleRequestReset}>
              <div className="space-y-1">
                <label className="block text-xs text-on-surface font-semibold" htmlFor="email">Email tài khoản</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline text-sm">mail</span>
                  </div>
                  <input 
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg focus:outline-none focus:border-primary text-sm placeholder-on-surface-variant/50 text-on-surface" 
                    id="email" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ví dụ: nguyenvana@gmail.com" 
                    required 
                    disabled={loading}
                  />
                </div>
              </div>

              <button 
                className="w-full bg-primary hover:bg-tertiary text-on-primary font-bold rounded-full py-3 px-6 transition-all disabled:opacity-50 mt-2" 
                type="submit"
                disabled={loading}
              >
                {loading ? 'Đang gửi mã...' : 'Gửi mã xác thực'}
              </button>
            </form>
          ) : (
            /* STEP 2: Verify code and set new password */
            <form className="space-y-4" onSubmit={handleResetPassword}>
              {/* OTP Code */}
              <div className="space-y-1">
                <label className="block text-xs text-on-surface font-semibold" htmlFor="otp">Mã xác thực (6 số)</label>
                <input 
                  className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-center tracking-widest text-lg font-bold placeholder-on-surface-variant/35 focus:outline-none focus:border-primary" 
                  id="otp" 
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000" 
                  required 
                  type="text"
                  disabled={loading}
                />
              </div>

              {/* New Password */}
              <div className="space-y-1">
                <label className="block text-xs text-on-surface font-semibold" htmlFor="newPassword">Mật khẩu mới</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline text-sm">lock</span>
                  </div>
                  <input 
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg focus:outline-none focus:border-primary text-sm placeholder-on-surface-variant/50 text-on-surface" 
                    id="newPassword" 
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••" 
                    required 
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="block text-xs text-on-surface font-semibold" htmlFor="confirmPassword">Nhập lại mật khẩu mới</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline text-sm">lock</span>
                  </div>
                  <input 
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg focus:outline-none focus:border-primary text-sm placeholder-on-surface-variant/50 text-on-surface" 
                    id="confirmPassword" 
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••" 
                    required 
                    disabled={loading}
                  />
                </div>
              </div>

              <button 
                className="w-full bg-primary hover:bg-tertiary text-on-primary font-bold rounded-full py-3 px-6 transition-all disabled:opacity-50 mt-2" 
                type="submit"
                disabled={loading}
              >
                {loading ? 'Đang cập nhật...' : 'Xác nhận đổi mật khẩu'}
              </button>

              <div className="text-center text-xs">
                <button
                  type="button"
                  onClick={handleRequestReset}
                  className="text-primary hover:underline font-bold"
                  disabled={loading}
                >
                  Gửi lại mã OTP
                </button>
              </div>
            </form>
          )}

          <div className="text-center text-xs text-on-surface-variant pt-2 border-t border-outline-variant/30">
            <button 
              onClick={onBackToLogin}
              className="text-primary font-bold hover:underline transition-colors"
            >
              Quay lại Đăng nhập
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordView;
