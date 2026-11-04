import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { forgotPassword } from '../api/authApi';
import { validateEmail } from '../utils/validation';
import TurnstileBox, { isTurnstileEnabled } from '../components/TurnstileBox';

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileReset, setTurnstileReset] = useState(0);
  const humanReady = !isTurnstileEnabled() || Boolean(turnstileToken);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailError = validateEmail(email);
    if (emailError) {
      setMessage(emailError);
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      await forgotPassword(email.trim(), turnstileToken);
      navigate('/reset-password', { state: { email: email.trim() } });
    } catch (error) {
      console.error('Forgot password error:', error);
      setMessage('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
      setTurnstileToken('');
      setTurnstileReset((count) => count + 1);
    }
  };

  const inputClass =
    'w-full border border-line bg-transparent px-3 py-2 text-ink focus:outline-none focus:border-signal';
  const labelClass = 'block font-mono text-xs uppercase tracking-widest text-muted mb-1';

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm border border-line">
        <div className="px-6 py-8">
          <h1 className="font-display text-2xl font-bold mb-2">Forgot Password</h1>
          <p className="text-sm text-muted mb-6">
            Enter your email and we'll send you a code to reset your password.
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                className={`${inputClass} disabled:opacity-50`}
              />
            </div>

            <TurnstileBox onToken={setTurnstileToken} resetCounter={turnstileReset} />

            <button
              type="submit"
              disabled={isSubmitting || !humanReady}
              className="w-full bg-ink text-paper font-mono text-xs uppercase tracking-widest py-3 hover:bg-signal transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting && (
                <span className="inline-block w-3 h-3 border-2 border-paper border-t-transparent rounded-full animate-spin" />
              )}
              {isSubmitting ? 'Sending...' : 'Send Reset Code'}
            </button>
          </form>

          {message && (
            <p className="mt-4 font-mono text-xs text-stamp border-t border-line pt-3">
              {message}
            </p>
          )}

          <p className="mt-6 text-center text-sm text-muted">
            Remembered your password?{' '}
            <a href="/login" className="text-signal underline">
              Log in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;