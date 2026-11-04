import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import {
  registerCandidate,
  registerRecruiter,
  getRegisterableRoles,
  googleLogin as googleLoginApi,
  googleRegister as googleRegisterApi,
} from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import GoogleRoleSelect from '../components/GoogleRoleSelect';
import ConsentCheckbox from '../components/ConsentCheckbox';
import FieldError from '../components/FieldError';
import TurnstileBox, { isTurnstileEnabled } from '../components/TurnstileBox';
import { validateRegisterForm } from '../utils/validation';
import { Eye, EyeOff } from '../lib/icons';

function RegisterPage() {
  const [roles, setRoles] = useState([]);
  const [role, setRole] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState({});
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileReset, setTurnstileReset] = useState(0);
  const humanReady = !isTurnstileEnabled() || Boolean(turnstileToken);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const [pendingGoogleUser, setPendingGoogleUser] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let timer = null;
    // The free server sleeps when nobody uses it, so the first tries can fail. Keep trying for about a minute before giving up.
    const load = (attempt) => {
      getRegisterableRoles()
        .then((response) => {
          if (cancelled) return;
          setMessage('');
          setRoles(response.data);
          if (response.data.length > 0) {
            setRole(response.data[0].roleName.toLowerCase());
          }
        })
        .catch(() => {
          if (cancelled) return;
          if (attempt < 12) {
            setMessage('Server is starting… this can take about a minute.');
            timer = setTimeout(() => load(attempt + 1), 6000);
          } else {
            setMessage('The server is not answering. Please try again in a minute.');
          }
        });
    };
    load(1);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) {
      setMessage('Please accept the Terms of Service and the Privacy Policy to continue.');
      return;
    }
    const fieldErrors = validateRegisterForm({ role, fullName, email, password, phone, companyName });
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      setMessage('Please fix the fields marked in red.');
      return;
    }
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setMessage('');

    try {
      if (role === 'candidate') {
        await registerCandidate({ fullName, email, password, phone, acceptedTerms: agreed, turnstileToken });
      } else {
        await registerRecruiter({ fullName, email, password, companyName, acceptedTerms: agreed, turnstileToken });
      }
      navigate('/verify-otp', { state: { email } });
    } catch (error) {
      console.error('Registration error:', error);
      const backendMessage = error.response?.data?.errors
        ? Object.values(error.response.data.errors).flat().join(' ')
        : error.response?.data?.message;
      setMessage(backendMessage || 'Registration failed. Try again.');
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
        setPendingGoogleUser({
          idToken,
          email: response.data.email,
          fullName: response.data.fullName,
        });
        return;
      }

      // Account already existed — this is really a login, not a sign-up.
      loginUser(response.data.loginResponse);
      navigate('/dashboard');
    } catch (error) {
      console.error('Google sign-up error:', error);
      setMessage('Google sign-up failed. Please try again.');
    }
  };

  const handleRoleConfirm = async ({ role: chosenRole, phone: chosenPhone, companyName: chosenCompany, acceptedTerms: chosenTerms }) => {
    try {
      const response = await googleRegisterApi(pendingGoogleUser.idToken, chosenRole, chosenPhone, chosenCompany, chosenTerms);
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

  const inputClass =
    'w-full border border-line bg-transparent px-3 py-2 text-ink focus:outline-none focus:border-signal';
  const labelClass = 'block font-mono text-xs uppercase tracking-widest text-muted mb-1';

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm border border-line">
        <div className="px-6 py-8">
          <h1 className="font-display text-2xl font-bold mb-6">Create account</h1>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className={labelClass}>Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={isSubmitting}
                className={`${inputClass} disabled:opacity-50`}
              >
                {roles.map((r) => (
                  <option key={r.roleId} value={r.roleName.toLowerCase()}>
                    {r.roleName}
                  </option>
                ))}
              </select>
              <FieldError message={errors.role} />
            </div>

            <div>
              <label className={labelClass}>Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isSubmitting}
                className={`${inputClass} disabled:opacity-50`}
              />
              <FieldError message={errors.fullName} />
            </div>

            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                className={`${inputClass} disabled:opacity-50`}
              />
              <FieldError message={errors.email} />
            </div>

            <div>
              <label className={labelClass}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              <FieldError message={errors.password} />
            </div>

            {role === 'candidate' && (
              <div>
                <label className={labelClass}>Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isSubmitting}
                  className={`${inputClass} disabled:opacity-50`}
                />
                <FieldError message={errors.phone} />
              </div>
            )}

            {role === 'recruiter' && (
              <div>
                <label className={labelClass}>Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={isSubmitting}
                  className={`${inputClass} disabled:opacity-50`}
                />
                <FieldError message={errors.companyName} />
              </div>
            )}

            <ConsentCheckbox checked={agreed} onChange={setAgreed} disabled={isSubmitting} />

            <TurnstileBox onToken={setTurnstileToken} resetCounter={turnstileReset} />

            <button
              type="submit"
              disabled={isSubmitting || !agreed || !humanReady}
              className="w-full bg-ink text-paper font-mono text-xs uppercase tracking-widest py-3 hover:bg-signal transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting && (
                <span className="inline-block w-3 h-3 border-2 border-paper border-t-transparent rounded-full animate-spin" />
              )}
              {isSubmitting ? 'Creating account...' : 'Create account'}
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
              onError={() => setMessage('Google sign-up failed. Please try again.')}
            />
          </div>

          {message && (
            <p className="mt-4 font-mono text-xs text-stamp border-t border-line pt-3">
              {message}
            </p>
          )}

          <p className="mt-6 text-center text-sm text-muted">
            Already have an account?{' '}
            <a href="/login" className="text-signal underline">
              Log in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;