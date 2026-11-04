import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { login as loginApi, googleLogin as googleLoginApi, googleRegister as googleRegisterApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import GoogleRoleSelect from '../components/GoogleRoleSelect';
import { Eye, EyeOff } from '../lib/icons';
import FieldError from '../components/FieldError';
import TurnstileBox, { isTurnstileEnabled } from '../components/TurnstileBox';
import { validateLoginForm } from '../utils/validation';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileReset, setTurnstileReset] = useState(0);
  const humanReady = !isTurnstileEnabled() || Boolean(turnstileToken);
  const location = useLocation();
  const [message, setMessage] = useState(location.state?.message || '');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [accountNotFound, setAccountNotFound] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  // When a brand-new Google account signs in, we hold onto the ID
  // token + their Google profile here and show the role picker
  // instead of logging them in immediately.
  const [pendingGoogleUser, setPendingGoogleUser] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fieldErrors = validateLoginForm({ email, password });
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      setMessage('Please fix the fields marked in red.');
      return;
    }
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setNeedsVerification(false);
    setAccountNotFound(false);
    setMessage('');

    try {
      const response = await loginApi({ email, password, turnstileToken });

      // No OTP step anymore — a successful response means the user is
      // logged in immediately.
      loginUser(response.data);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setMessage(error.response?.data?.message || 'Login failed. Check email/password.');
      if (error.response?.data?.needsVerification) {
        setNeedsVerification(true);
      }
      if (error.response?.data?.accountNotFound) {
        setAccountNotFound(true);
      }
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      setTurnstileToken('');
      setTurnstileReset((count) => count + 1);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setMessage('');
    try {
      const idToken = credentialResponse.credential;
      const response = await googleLoginApi(idToken);

      if (response.data.requiresRoleSelection) {
        // Brand-new Google account — ask for Candidate/Recruiter before creating it.
        setPendingGoogleUser({
          idToken,
          email: response.data.email,
          fullName: response.data.fullName,
        });
        return;
      }

      loginUser(response.data.loginResponse);
      navigate('/dashboard');
    } catch (error) {
      console.error('Google login error:', error);
      setMessage('Google login failed. Please try again.');
    }
  };

  const handleRoleConfirm = async ({ role, phone, companyName, acceptedTerms }) => {
    try {
      const response = await googleRegisterApi(pendingGoogleUser.idToken, role, phone, companyName, acceptedTerms);
      loginUser(response.data);
      navigate('/dashboard');
    } catch (error) {
      console.error('Google registration error:', error);
      setMessage('Could not finish creating your account. Please try again.');
      setPendingGoogleUser(null);
    }
  };

  if (pendingGoogleUser) {
    return (
      <GoogleRoleSelect
        email={pendingGoogleUser.email}
        fullName={pendingGoogleUser.fullName}
        onConfirm={handleRoleConfirm}
        onCancel={() => setPendingGoogleUser(null)}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm border border-line">
        <div className="px-6 py-8">
          <h1 className="font-display text-2xl font-bold mb-6">Log in</h1>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="block font-mono text-xs uppercase tracking-widest text-muted mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                className="w-full border border-line bg-transparent px-3 py-2 text-ink focus:outline-none focus:border-signal disabled:opacity-50"
              />
              <FieldError message={errors.email} />
            </div>

            <div>
              <label className="block font-mono text-xs uppercase tracking-widest text-muted mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full border border-line bg-transparent px-3 py-2 pr-12 text-ink focus:outline-none focus:border-signal disabled:opacity-50"
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
              <FieldError message={errors.password} />
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
              {isSubmitting ? 'Logging in...' : 'Log in'}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 border-t border-line" />
            <span className="font-mono text-xs uppercase tracking-widest text-muted">Or</span>
            <div className="flex-1 border-t border-line" />
          </div>

          <div className="mt-4 flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setMessage('Google login failed. Please try again.')}
            />
          </div>

          {needsVerification && (
            <button
              type="button"
              onClick={() => navigate('/verify-otp', { state: { email } })}
              className="w-full mt-3 border border-signal text-signal font-mono text-xs uppercase tracking-widest py-2 hover:bg-signal hover:text-paper transition-colors"
            >
              Verify Email Now
            </button>
          )}

          {accountNotFound && (
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="w-full mt-3 border border-signal text-signal font-mono text-xs uppercase tracking-widest py-2 hover:bg-signal hover:text-paper transition-colors"
            >
              Register Now
            </button>
          )}

          {message && (
            <p className="mt-4 font-mono text-xs text-stamp border-t border-line pt-3">
              {message}
            </p>
          )}

          <div className="mt-6 flex items-center justify-between text-sm">
            <a href="/register" className="text-muted">
              No account?{' '}
              <span className="text-signal underline">Create account</span>
            </a>
            <a href="/forgot-password" className="text-signal underline">
              Forgot Password?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;