import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { resetPassword, forgotPassword } from '../api/authApi';
import { PASSWORD_RULE, PASSWORD_HELP, validateOtp } from '../utils/validation';
import { Eye, EyeOff } from '../lib/icons';
import TurnstileBox, { isTurnstileEnabled } from '../components/TurnstileBox';

function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email] = useState(location.state?.email || '');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileReset, setTurnstileReset] = useState(0);
  const humanReady = !isTurnstileEnabled() || Boolean(turnstileToken);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpError = validateOtp(otpCode);
    if (otpError) {
      setMessage(otpError);
      return;
    }
    if (!newPassword.trim()) {
      setMessage('Enter a new password.');
      return;
    }
    // The server accepts any new password on this step, so the same rules as registration are checked here.
    if (!PASSWORD_RULE.test(newPassword)) {
      setMessage(PASSWORD_HELP);
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      await resetPassword({ email, otpCode, newPassword });
      navigate('/login', { state: { message: 'Password reset successfully. Please log in.' } });
    } catch (error) {
      console.error('Reset password error:', error);
      setMessage(error.response?.data?.message || 'Invalid or expired code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setMessage('');

    try {
      // /resend-otp only works for accounts that are not verified yet. A password reset needs a fresh code from /forgot-password.
      await forgotPassword(email, turnstileToken);
      setMessage('A new code has been sent to your email.');
    } catch (error) {
      console.error('Resend error:', error);
      setMessage('Could not resend the code.');
    } finally {
      setIsResending(false);
      setTurnstileToken('');
      setTurnstileReset((count) => count + 1);
    }
  };

  const inputClass =
    'w-full border border-line bg-transparent px-3 py-2 text-ink focus:outline-none focus:border-signal';
  const labelClass = 'block font-mono text-xs uppercase tracking-widest text-muted mb-1';

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10">
        <p className="font-mono text-xs text-stamp">
          No email found. Please{' '}
          <a href="/forgot-password" className="underline">
            request a reset code
          </a>{' '}
          first.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm border border-line">
        <div className="px-6 py-8">
          <h1 className="font-display text-2xl font-bold mb-2">Reset Password</h1>
          <p className="text-sm text-muted mb-6">
            Enter the code sent to <span className="text-ink">{email}</span> and choose a new
            password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelClass}>Verification Code</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                disabled={isSubmitting}
                placeholder="123456"
                className={`${inputClass} text-center text-lg tracking-widest disabled:opacity-50`}
              />
            </div>

            <div>
              <label className={labelClass}>New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isSubmitting}
                  className={`${inputClass} pr-12 disabled:opacity-50`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="pw-eye"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
              <p className="field-hint">At least 8 characters with a capital letter, a number and a special character.</p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-ink text-paper font-mono text-xs uppercase tracking-widest py-3 hover:bg-signal transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <p className="field-hint">To get a new code, pass this check first.</p>
          <TurnstileBox onToken={setTurnstileToken} resetCounter={turnstileReset} />

          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || !humanReady}
            className="w-full mt-3 font-mono text-xs uppercase tracking-widest text-muted hover:text-signal underline disabled:opacity-50"
          >
            {isResending ? 'Sending...' : "Didn't receive a code? Resend"}
          </button>

          {message && (
            <p className="mt-4 font-mono text-xs text-stamp border-t border-line pt-3">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;