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
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const otpRefs = React.useRef<(HTMLInputElement | null)[]>([]);

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
            <h1 className="text-2xl font-bold text-gray-900 font-headline-md">Nhập mã OTP</h1>
            <p className="text-sm text-gray-500 font-medium">Mã xác thực đã được gửi tới: <span className="font-bold text-[#006d37]">{email || phoneNumber}</span></p>
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

        {/* OTP Input Form */}
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

          <div className="flex justify-center pt-2">
            <button
              className="bg-[#006d37] hover:bg-[#005027] text-white font-semibold rounded-full px-8 py-2.5 text-sm transition-all disabled:opacity-50 cursor-pointer shadow-sm flex items-center gap-1.5"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Đang xác thực...' : 'Xác nhận OTP'}
              <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
            </button>
          </div>
        </form>

        {/* Back Link */}
        <div className="text-center pt-2">
          <button
            onClick={onBackToLogin}
            className="text-xs text-[#006d37] hover:underline font-bold transition-all cursor-pointer"
          >
            Quay lại Đăng nhập
          </button>
        </div>

      </div>
    </div>
  );
};
export default OTPVerifyView;
