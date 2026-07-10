import React, { useState, useEffect } from 'react';
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
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const otpRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  const getOtpCode = () => otpDigits.join('');

  const handleOtpChange = (index: number, value: string) => {
    const v = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = v;
    setOtpDigits(newDigits);
    if (v && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtpDigits(pasted.split(''));
      otpRefs.current[5]?.focus();
      e.preventDefault();
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0 || loading) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      if (USE_REAL_BACKEND) {
        await authService.resendOtp(email || phoneNumber);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
      setSuccessMsg('Mã OTP mới đã được gửi! Vui lòng kiểm tra email/điện thoại.');
      setCountdown(60);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || err.message || 'Không thể gửi lại mã OTP lúc này.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = getOtpCode();
    if (code.length !== 6) {
      setErrorMsg('Mã OTP phải có độ dài đúng 6 ký tự.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      if (USE_REAL_BACKEND) {
        await authService.verifyOtp(email || phoneNumber, code);
      } else {
        // Simulated mock OTP check
        await new Promise((resolve) => setTimeout(resolve, 800));
        if (code !== '123456') {
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
          <span className="material-symbols-outlined text-[#006d37] text-[32px] filled">volunteer_activism</span>
          <span className="font-headline-md text-lg text-[#006d37] font-bold tracking-tight">Volunteer Connect</span>
        </div>

        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900 font-headline-md">Nhập mã OTP</h1>
            <p className="text-sm text-gray-500 font-medium">Mã xác thực đã được gửi tới: <span className="font-bold text-[#006d37]">{email || phoneNumber}</span></p>
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

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2 text-left">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Mã xác minh</label>
              <div className="flex gap-2 justify-between">
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    onPaste={i === 0 ? handleOtpPaste : undefined}
                    className="w-12 h-12 text-center text-lg font-bold border border-gray-300 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-2 focus:ring-[#006d37]/20 bg-white transition-all animate-fadeIn"
                    disabled={loading}
                  />
                ))}
              </div>
            </div>

            <button
              className="w-full bg-[#006d37] hover:bg-[#005027] text-white font-bold rounded-full py-3 px-6 transition-all disabled:opacity-50 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Đang xác thực...' : 'Xác nhận OTP'}
              <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
            </button>

            <div className="flex justify-between items-center text-xs px-2 pt-2">
              <button
                onClick={onBackToLogin}
                type="button"
                className="text-[#006d37] font-bold hover:underline transition-colors cursor-pointer"
              >
                Quay lại Đăng nhập
              </button>
              <button
                onClick={handleResendOTP}
                type="button"
                disabled={countdown > 0 || loading}
                className={`font-bold transition-colors ${countdown > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-[#006d37] hover:underline cursor-pointer'}`}
              >
                {countdown > 0 ? `Gửi lại mã sau ${countdown}s` : 'Gửi lại mã OTP'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OTPVerifyView;
