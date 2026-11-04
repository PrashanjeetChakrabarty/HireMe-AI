import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyOtp, resendOtp } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { validateOtp } from '../utils/validation';
import TurnstileBox, { isTurnstileEnabled } from '../components/TurnstileBox';

function OtpVerifyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser } = useAuth();
  const [email] = useState(location.state?.email || '');
  const [otpCode, setOtpCode] = useState('');
  const [message, setMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileReset, setTurnstileReset] = useState(0);
  const humanReady = !isTurnstileEnabled() || Boolean(turnstileToken);
  const isVerifyingRef = useRef(false);
  const isResendingRef = useRef(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isVerifyingRef.current) return;
    const otpError = validateOtp(otpCode);
    if (otpError) {
      setMessage(otpError);
      return;
    }

    isVerifyingRef.current = true;
    setIsVerifying(true);
    setMessage('');

    try {
      const response = await verifyOtp({ email, otpCode });
      loginUser(response.data);
      navigate('/dashboard');
    } catch (error) {
      console.error('OTP verify error:', error);
      setMessage(error.response?.data?.message || 'Invalid or expired verification code.');
    } finally {
      isVerifyingRef.current = false;
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (isResendingRef.current) return;
    isResendingRef.current = true;
    setIsResending(true);
    setMessage('');

    try {
      await resendOtp(email, turnstileToken);
      setMessage('A new verification code has been sent to your email.');
    } catch (error) {
      console.error('Resend OTP error:', error);
      const errorMessage = error.response?.data?.message || 'Could not resend the code.';

      if (errorMessage.includes('already verified')) {
        navigate('/login', { state: { message: 'Your account is already verified. Please log in.' } });
        return;
      }

      setMessage(errorMessage);
    } finally {
      isResendingRef.current = false;
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
          <a href="/register" className="underline">
            register
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
          <h1 className="font-display text-2xl font-bold mb-2">Verify Your Email</h1>
          <p className="text-sm text-muted mb-6">
            We sent a 6-digit code to <span className="text-ink">{email}</span>. Enter it below to
            activate your account.
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
                disabled={isVerifying}
                placeholder="123456"
                className={`${inputClass} text-center text-lg tracking-widest disabled:opacity-50`}
              />
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full bg-ink text-paper font-mono text-xs uppercase tracking-widest py-3 hover:bg-signal transition-colors disabled:opacity-50"
            >
              {isVerifying ? 'Verifying...' : 'Verify'}
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

export default OtpVerifyPage;