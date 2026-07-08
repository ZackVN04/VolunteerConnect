import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { authService } from '../services/apiService';

const USE_REAL_BACKEND = true;

interface ForgotPasswordViewProps {
  onBackToLogin: () => void;
}

export const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({ onBackToLogin }) => {
  const { users, showNotification } = useApp();
  const [email, setEmail] = useState('');
  // step 1: enter email & get OTP; step 2: reset password
  const [step, setStep] = useState<1 | 2>(1);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [simulatedOtp, setSimulatedOtp] = useState('');

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

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
  };

  const handleGoToReset = (e: React.FormEvent) => {
    e.preventDefault();
    const code = getOtpCode();
    if (code.length !== 6) {
      setErrorMsg('Vui lòng nhập đủ 6 chữ số mã xác nhận.');
      return;
    }
    setErrorMsg('');
    setStep(2);
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
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-sm px-8 py-10 space-y-6">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[#1a6c3a] flex items-center justify-center text-white font-bold text-sm select-none">
            VC
          </div>
          <span className="text-[#1a6c3a] font-bold text-lg tracking-tight">Volunteer Connect</span>
        </div>

        {step === 1 ? (
          <>
            {/* Step 1: Enter email + OTP boxes */}
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-bold text-gray-900">Khôi phục mật khẩu</h1>
              <p className="text-sm text-gray-500">Nhập địa chỉ Email đã đăng ký để nhận mã OTP</p>
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

            <form className="space-y-4" onSubmit={handleRequestReset}>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700" htmlFor="forgot-email">Email</label>
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
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1a6c3a] placeholder-gray-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1a6c3a] hover:bg-[#155c30] text-white font-semibold rounded-full py-2.5 text-sm transition-all disabled:opacity-50"
              >
                {loading ? 'Đang gửi...' : 'Gửi mã xác nhận'}
              </button>
            </form>

            {/* OTP Boxes */}
            <form className="space-y-3" onSubmit={handleGoToReset}>
              <label className="block text-sm font-medium text-gray-700">Mã xác minh</label>
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
                    className="w-10 h-12 text-center text-lg font-bold border border-gray-300 rounded-lg focus:outline-none focus:border-[#1a6c3a] bg-white"
                    disabled={loading}
                  />
                ))}
              </div>
              {successMsg && (
                <button
                  type="submit"
                  disabled={loading || getOtpCode().length !== 6}
                  className="w-full bg-[#1a6c3a] hover:bg-[#155c30] text-white font-semibold rounded-full py-2.5 text-sm transition-all disabled:opacity-50 mt-1"
                >
                  Xác nhận mã OTP
                </button>
              )}
            </form>

            <div className="text-center pt-1">
              <button
                onClick={onBackToLogin}
                className="text-sm text-[#1a6c3a] hover:underline font-medium"
              >
                ← Quay lại đăng nhập
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Step 2: Set new password */}
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-bold text-gray-900">Đặt lại mật khẩu</h1>
              <p className="text-sm text-gray-500">Nhập mật khẩu mới để tiếp tục đăng nhập</p>
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

            <form className="space-y-4" onSubmit={handleResetPassword}>
              {/* New Password */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700" htmlFor="new-password">Mật khẩu mới</label>
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
                    className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1a6c3a] placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(v => !v)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                      {showNewPw ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700" htmlFor="confirm-password">Nhập lại mật khẩu</label>
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
                    className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1a6c3a] placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(v => !v)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                      {showConfirmPw ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1a6c3a] hover:bg-[#155c30] text-white font-semibold rounded-full py-2.5 text-sm transition-all disabled:opacity-50"
              >
                {loading ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
              </button>
            </form>

            <div className="text-center pt-1">
              <button
                onClick={onBackToLogin}
                className="text-sm text-[#1a6c3a] hover:underline font-medium"
              >
                ← Quay lại đăng nhập
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordView;
