import { useState } from 'react';
import ConsentCheckbox from './ConsentCheckbox';
import FieldError from './FieldError';
import { PHONE_RULE } from '../utils/validation';

// Shown right after a brand-new Google account signs in for the first
// time — asks which role to create the account as, then finishes
// registration.
function GoogleRoleSelect({ email, fullName, onConfirm, onCancel }) {
  const [role, setRole] = useState('candidate');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (!agreed) return;
    if (role === 'candidate' && phone.trim() && !PHONE_RULE.test(phone.trim())) {
      setError('Enter a valid 10-digit phone number starting with 6, 7, 8 or 9.');
      return;
    }
    if (role === 'recruiter' && !companyName.trim()) {
      setError('Enter your company name.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    await onConfirm({ role, phone, companyName, acceptedTerms: agreed });
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm border border-line">
        <div className="px-6 py-8">
          <h1 className="font-display text-2xl font-bold mb-2">Welcome, {fullName}</h1>
          <p className="font-mono text-xs text-muted mb-6">{email}</p>

          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={() => setRole('candidate')}
              className={`w-full border px-4 py-3 text-left font-mono text-xs uppercase tracking-widest ${
                role === 'candidate' ? 'border-signal text-signal' : 'border-line text-muted'
              }`}
            >
              Candidate — I'm looking for a job
            </button>
            <button
              type="button"
              onClick={() => setRole('recruiter')}
              className={`w-full border px-4 py-3 text-left font-mono text-xs uppercase tracking-widest ${
                role === 'recruiter' ? 'border-signal text-signal' : 'border-line text-muted'
              }`}
            >
              Recruiter — I'm hiring
            </button>
          </div>

          {role === 'candidate' && (
            <div className="mb-4">
              <label className="block font-mono text-xs uppercase tracking-widest text-muted mb-1">
                Phone (optional)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-line bg-transparent px-3 py-2 text-ink focus:outline-none focus:border-signal"
              />
            </div>
          )}

          {role === 'recruiter' && (
            <div className="mb-4">
              <label className="block font-mono text-xs uppercase tracking-widest text-muted mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full border border-line bg-transparent px-3 py-2 text-ink focus:outline-none focus:border-signal"
              />
            </div>
          )}

          <FieldError message={error} />

          <div className="mb-4">
            <ConsentCheckbox checked={agreed} onChange={setAgreed} disabled={isSubmitting} />
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting || !agreed}
            className="w-full bg-ink text-paper font-mono text-xs uppercase tracking-widest py-3 hover:bg-signal transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Creating account...' : 'Continue'}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full mt-2 font-mono text-xs text-muted underline"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default GoogleRoleSelect;