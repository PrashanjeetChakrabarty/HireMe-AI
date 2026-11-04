import { Link } from 'react-router-dom';

// The box a person ticks to accept the Terms of Service and the Privacy Policy before an account is created.
export default function ConsentCheckbox({ checked, onChange, disabled }) {
  return (
    <label className="consent">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} disabled={disabled} />
      <span>
        I agree to the{' '}
        <Link to="/terms" target="_blank" rel="noopener noreferrer">
          Terms of Service
        </Link>{' '}
        and the{' '}
        <Link to="/privacy" target="_blank" rel="noopener noreferrer">
          Privacy Policy
        </Link>
        .
      </span>
    </label>
  );
}
