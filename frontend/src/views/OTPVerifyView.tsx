import React, { useState } from 'react';
import { authService } from '../services/apiService';

const USE_REAL_BACKEND = true;

interface OTPVerifyViewProps {
  phoneNumber: string;
  email?: string;
  onVerifySuccess: () => void;
  onBackToLogin: () => void;
}

export const OTPVerifyView: React.FC<OTPVerifyViewProps> = ({
  phoneNumber,
  email,
  onVerifySuccess,
  onBackToLogin
}) => {
  const [otp, setOtp] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setErrorMsg('Mã OTP phải có độ dài đúng 6 ký tự.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      if (USE_REAL_BACKEND) {
        await authService.verifyOtp(email || phoneNumber, otp);
      } else {
        // Simulated mock OTP check
        await new Promise((resolve) => setTimeout(resolve, 800));
        if (otp !== '123456') {
          throw new Error('Mã OTP giả lập không chính xác. Vui lòng sử dụng mã 123456.');
        }
      }
      setSuccessMsg('Xác thực tài khoản thành công! Đang chuyển hướng...');
      setTimeout(() => {
        onVerifySuccess();
      }, 2000);
    } catch (err: any) {
      let msg = err.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.';
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === 'string') {
          msg = detail;
        } else if (Array.isArray(detail)) {
          msg = detail.map((d: any) => d.msg).join('\n');
        }
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full h-screen overflow-hidden text-left font-body-md bg-background">
      <div className="hidden lg:flex w-1/2 bg-surface-container-low h-full items-center justify-center relative overflow-hidden">
        <div 
          aria-hidden="true" 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105" 
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1544027993-37dbfe43562a?q=80&w=800")' }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent"></div>
        <div className="absolute bottom-12 left-12 right-12 text-white z-10 space-y-2">
          <h2 className="font-headline-md text-2xl font-bold">Xác Thực OTP</h2>
          <p className="text-sm opacity-90 leading-relaxed max-w-md">Vui lòng nhập mã OTP được gửi tới tài khoản của bạn để kích hoạt.</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 h-full flex flex-col items-center justify-center bg-surface px-6 relative overflow-y-auto">
        <div className="absolute top-8 left-6 md:left-12 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[32px] filled">volunteer_activism</span>
          <span className="font-headline-md text-lg text-primary font-bold tracking-tight">Volunteer Connect</span>
        </div>

        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl md:text-3xl text-on-surface font-bold">Nhập mã OTP</h1>
            <p className="text-sm text-on-surface-variant">Mã xác thực đã được gửi tới: <span className="font-bold text-primary">{email || phoneNumber}</span></p>
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

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label className="block text-xs text-on-surface font-semibold" htmlFor="otp">Mã xác thực (6 số)</label>
              <input 
                className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-center tracking-widest text-lg font-bold placeholder-on-surface-variant/35 focus:outline-none focus:border-primary" 
                id="otp" 
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000" 
                required 
                type="text"
                disabled={loading}
              />
            </div>

            <button 
              className="w-full bg-primary hover:bg-tertiary text-on-primary font-bold rounded-full py-3 px-6 transition-all disabled:opacity-50" 
              type="submit"
              disabled={loading}
            >
              {loading ? 'Đang xác thực...' : 'Xác nhận OTP'}
            </button>
          </form>

          <div className="text-center text-xs text-on-surface-variant">
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
export default OTPVerifyView;
