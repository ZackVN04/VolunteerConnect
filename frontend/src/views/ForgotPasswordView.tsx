import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { authService } from '../services/apiService';

const USE_REAL_BACKEND = true;

interface ForgotPasswordViewProps {
  onBackToLogin: () => void;
}

export const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({ onBackToLogin }) => {
  const { users, showNotification } = useApp();
  const [email, setEmail] = useState('');
  // step 1: enter email; step 2: enter OTP; step 3: reset password
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const getOtpCode = () => otpDigits.join('');

  // Countdown timer effect for Step 2
  useEffect(() => {
    if (step !== 2) return;

    setTimeLeft(300);
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const verifyOtpCode = async (code: string) => {
    setLoading(true);
    setErrorMsg('');
    try {
      if (USE_REAL_BACKEND) {
        await authService.verifyResetOtp(email.trim(), code);
      } else {
        if (code !== simulatedOtp) {
          throw new Error('Mã OTP không chính xác.');
        }
      }
      setStep(3); // transition to new password screen when OTP is verified
    } catch (err: any) {
      let msg = 'Mã OTP không chính xác hoặc đã hết hạn.';
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') msg = detail;
      else if (Array.isArray(detail)) msg = detail.map((d: any) => d.msg).join('\n');
      else if (err.response?.data?.message) msg = err.response.data.message;
      else if (err.message) msg = err.message;
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digits = value.replace(/\D/g, '');
    let newDigits = [...otpDigits];

    if (!digits) {
      newDigits[index] = '';
    } else if (digits.length > 1) {
      const chars = digits.split('').slice(0, 6);
      const startIdx = chars.length === 6 ? 0 : index;
      for (let i = 0; i < chars.length && startIdx + i < 6; i++) {
        newDigits[startIdx + i] = chars[i];
      }
      const nextFocus = chars.length === 6 ? 5 : Math.min(startIdx + chars.length, 5);
      setTimeout(() => otpRefs.current[nextFocus]?.focus(), 10);
    } else {
      newDigits[index] = digits;
      if (index < 5) {
        setTimeout(() => otpRefs.current[index + 1]?.focus(), 10);
      }
    }

    setOtpDigits(newDigits);

    const code = newDigits.join('');
    if (code.length === 6) {
      setErrorMsg('');
      verifyOtpCode(code); // API verify instead of setStep(3)
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
      setErrorMsg('');
      verifyOtpCode(pasted); // [FIXED] API verify instead of setStep(3)
    }
  };

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
        if (typeof detail === 'string') msg = detail;
        else if (Array.isArray(detail)) msg = detail.map((d: any) => d.msg).join('\n');
        else if (err.response?.data?.message) msg = err.response.data.message;
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
    const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setSimulatedOtp(mockOtp);
    showNotification(`[MÔ PHỎNG EMAIL] Mã OTP: ${mockOtp}`, 'info');
    setSuccessMsg('Mã OTP đã được gửi tới email giả lập của bạn.');
    setLoading(false);
    setStep(2);
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    if (USE_REAL_BACKEND) {
      try {
        const res = await authService.forgotPassword(email.trim());
        setSuccessMsg(res.message || 'Mã OTP đã được gửi lại về email của bạn.');
        setTimeLeft(300);
      } catch (err: any) {
        let msg = 'Không thể gửi lại mã OTP. Vui lòng thử lại.';
        const detail = err.response?.data?.detail;
        if (typeof detail === 'string') msg = detail;
        else if (err.response?.data?.message) msg = err.response.data.message;
        setErrorMsg(msg);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Simulate resend
    const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setSimulatedOtp(mockOtp);
    showNotification(`[MÔ PHỎNG EMAIL] Mã OTP gửi lại: ${mockOtp}`, 'info');
    setSuccessMsg('Mã OTP mới đã được gửi tới email giả lập của bạn.');
    setTimeLeft(300);
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setErrorMsg('Mật khẩu mới phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.');
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
        const res = await authService.resetPassword(email.trim(), getOtpCode(), newPassword);
        setSuccessMsg(res.message || 'Đặt lại mật khẩu thành công!');
        setTimeout(() => onBackToLogin(), 2000);
      } catch (err: any) {
        let msg = 'Mã OTP không chính xác hoặc đã hết hạn.';
        const detail = err.response?.data?.detail;
        if (typeof detail === 'string') msg = detail;
        else if (Array.isArray(detail)) msg = detail.map((d: any) => d.msg).join('\n');
        else if (err.response?.data?.message) msg = err.response.data.message;
        setErrorMsg(msg);
      } finally {
        setLoading(false);
      }
      return;
    }

    // SIMULATED OFFLINE MODE
    if (getOtpCode() !== simulatedOtp) {
      setErrorMsg('Mã OTP không chính xác.');
      setLoading(false);
      return;
    }
    const matchedUserIndex = users.findIndex(u => u.email === email.trim());
    if (matchedUserIndex !== -1) {
      users[matchedUserIndex].password_hash = 'simulated_' + newPassword;
      setSuccessMsg('Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.');
      setTimeout(() => onBackToLogin(), 2000);
    } else {
      setErrorMsg('Lỗi không xác định.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-4 py-8 text-left font-body-md">
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm w-full max-w-md px-8 py-10 space-y-6">

        {/* Logo Header */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[#006d37] flex items-center justify-center text-white font-bold text-sm select-none">
            vc
          </div>
          <span className="text-[#006d37] font-bold text-lg tracking-tight font-headline-md">Volunteer Connect</span>
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

        {step === 1 && (
          <>
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-bold text-gray-900 font-headline-md">Khôi phục mật khẩu</h1>
              <p className="text-sm text-gray-500 font-medium">Nhập địa chỉ Email đã đăng ký để nhận mã OTP</p>
            </div>

            <form className="space-y-5" onSubmit={handleRequestReset}>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider" htmlFor="forgot-email">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-gray-400" style={{ fontSize: 18 }}>mail</span>
                  </div>
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="nguyenvana@gmail.com"
                    required
                    disabled={loading}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#006d37] focus:ring-2 focus:ring-[#006d37]/20 placeholder-gray-400 transition-all font-semibold"
                  />
                </div>
              </div>

              <div className="flex justify-center pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#006d37] hover:bg-[#005027] text-white font-semibold rounded-full px-8 py-2.5 text-sm transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {loading ? 'Đang gửi...' : 'Gửi mã xác nhận'}
                </button>
              </div>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-bold text-gray-900 font-headline-md">Khôi phục mật khẩu</h1>
              <p className="text-sm text-gray-500 font-medium">Nhập mã OTP đã nhận được</p>
            </div>

            <form className="space-y-4 text-left" onSubmit={e => e.preventDefault()}>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Mã xác minh</label>
              <div className="flex gap-2 justify-between">
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    onPaste={i === 0 ? handleOtpPaste : undefined}
                    className="w-12 h-12 text-center text-lg font-bold border border-gray-300 rounded-xl focus:outline-none focus:border-[#006d37] focus:ring-2 focus:ring-[#006d37]/20 bg-white transition-all"
                    disabled={loading}
                  />
                ))}
              </div>

              {/* Expiry countdown */}
              <div className="text-right text-xs font-semibold">
                {timeLeft > 0 ? (
                  <span className="text-[#ba1a1a]">Mã hết hạn trong {formatTime(timeLeft)}</span>
                ) : (
                  <button 
                    type="button" 
                    onClick={handleResendOtp}
                    className="text-[#006d37] hover:underline font-bold"
                  >
                    Gửi lại mã OTP
                  </button>
                )}
              </div>
            </form>
          </>
        )}

        {step === 3 && (
          <>
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-bold text-gray-900 font-headline-md">Đặt lại mật khẩu</h1>
              <p className="text-sm text-gray-500 font-medium">Nhập mật khẩu mới để tiếp tục đăng nhập</p>
            </div>

            <form className="space-y-5" onSubmit={handleResetPassword}>
              {/* New Password */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider" htmlFor="new-password">Mật khẩu mới</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-gray-400" style={{ fontSize: 18 }}>lock</span>
                  </div>
                  <input
                    id="new-password"
                    type={showNewPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                    className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#006d37] focus:ring-2 focus:ring-[#006d37]/20 placeholder-gray-400 transition-all font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(v => !v)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                      {showNewPw ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider" htmlFor="confirm-password">Nhập lại mật khẩu</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-gray-400" style={{ fontSize: 18 }}>lock</span>
                  </div>
                  <input
                    id="confirm-password"
                    type={showConfirmPw ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                    className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#006d37] focus:ring-2 focus:ring-[#006d37]/20 placeholder-gray-400 transition-all font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(v => !v)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                      {showConfirmPw ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex justify-center pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#006d37] hover:bg-[#005027] text-white font-semibold rounded-full px-8 py-2.5 text-sm transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {loading ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
                </button>
              </div>
            </form>
          </>
        )}

        {/* Back Link */}
        <div className="text-center pt-2">
          <button
            onClick={onBackToLogin}
            className="text-xs text-[#006d37] hover:underline font-bold transition-all cursor-pointer"
          >
            ← Quay lại đăng nhập
          </button>
        </div>

      </div>
    </div>
  );
};

export default ForgotPasswordView;
