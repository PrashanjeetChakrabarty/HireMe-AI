import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { deleteAccount, requestDeleteOtp } from '../api/authApi';
import { changePassword, getProfile, requestPasswordCode, updateProfile } from '../api/userApi';
import { getErrorMessage } from '../utils/errors';
import { validateOtp, validatePassword, validateProfile } from '../utils/validation';
import { Avatar, Badge, Card, CardHead, Notice, PageHead, Skeleton } from '../components/ui';

function ProfilePage() {
  const { user, loginUser, logout } = useAuth();
  const navigate = useNavigate();

  // What the server has for this person: full name, phone and address.
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ fullName: '', phone: '', address: '' });
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteOtp, setDeleteOtp] = useState('');
  const [deleteMessage, setDeleteMessage] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // Change password: first a code is emailed, then the code and the new password are sent together.
  const [pwStep, setPwStep] = useState('idle');
  const [pwOtp, setPwOtp] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwShow, setPwShow] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMessage, setPwMessage] = useState('');
  const [pwDone, setPwDone] = useState(false);

  useEffect(() => {
    if (!user) return undefined;
    let alive = true;
    getProfile(user.userId)
      .then(response => {
        if (alive) setProfile(response.data);
      })
      .catch(error => {
        console.error('Load profile error:', error);
        if (alive) setMessage(getErrorMessage(error, 'Could not load your profile.'));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [user]);

  if (!user) {
    return <p className="u-gate">Please login first.</p>;
  }

  const isCandidate = user.roleName === 'Candidate';

  const handleEdit = () => {
    // The server overwrites phone and address with whatever is sent, so the form starts from the saved values.
    setForm({
      fullName: profile?.fullName || user.fullName || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
    });
    setMessage('');
    setEditing(true);
  };

  const handleSave = async event => {
    event.preventDefault();
    const problem = validateProfile(form, { isCandidate });
    if (problem) {
      setMessage(problem);
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const saved = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
      };
      await updateProfile(user.userId, saved);
      setProfile(previous => ({ ...previous, ...saved }));
      // The name shown in the navbar comes from the saved login, so refresh it too.
      loginUser({ ...user, fullName: saved.fullName });
      setEditing(false);
      setMessage('Profile updated.');
    } catch (error) {
      console.error('Save profile error:', error);
      setMessage(getErrorMessage(error, 'Could not save your profile.'));
    } finally {
      setSaving(false);
    }
  };

  const handleStartDelete = async () => {
    setIsSendingOtp(true);
    setDeleteMessage('');
    try {
      await requestDeleteOtp();
      setShowDeleteConfirm(true);
    } catch (error) {
      console.error('Request delete OTP error:', error);
      setDeleteMessage('Could not send a verification code. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleDeleteAccount = async event => {
    event.preventDefault();
    if (!deleteOtp.trim()) {
      setDeleteMessage('Please enter the verification code sent to your email.');
      return;
    }
    setIsDeleting(true);
    setDeleteMessage('');
    try {
      await deleteAccount(deleteOtp);
      // The account is gone from the database now, so clear the session and go to the login page.
      logout();
      navigate('/login', { state: { message: 'Your account has been deleted.' } });
    } catch (error) {
      console.error('Delete account error:', error);
      setDeleteMessage(getErrorMessage(error, 'Could not delete account.'));
      setIsDeleting(false);
    }
  };

  const handleSendPasswordCode = async () => {
    setPwBusy(true);
    setPwMessage('');
    setPwDone(false);
    try {
      await requestPasswordCode();
      setPwStep('code');
    } catch (error) {
      console.error('Request password code error:', error);
      setPwMessage(getErrorMessage(error, 'Could not send a verification code. Please try again.'));
    } finally {
      setPwBusy(false);
    }
  };

  const resetPasswordForm = () => {
    setPwStep('idle');
    setPwOtp('');
    setPwNew('');
    setPwConfirm('');
    setPwShow(false);
  };

  const handleChangePassword = async event => {
    event.preventDefault();
    const problem = validateOtp(pwOtp) || validatePassword(pwNew) || (pwNew !== pwConfirm ? 'The two passwords do not match.' : '');
    if (problem) {
      setPwMessage(problem);
      return;
    }
    setPwBusy(true);
    setPwMessage('');
    try {
      await changePassword({ otpCode: pwOtp.trim(), newPassword: pwNew });
      resetPasswordForm();
      setPwDone(true);
      setPwMessage('Your password was changed. We also sent you an email about it.');
    } catch (error) {
      console.error('Change password error:', error);
      setPwMessage(getErrorMessage(error, 'Could not change your password.'));
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <div className="app-wrap">
      <PageHead title="My profile" sub="See and update your details, or delete your account." />
      <Notice message={message} />

      <div className="u-stack u-gap">
        <Card>
          <CardHead title="Your details" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            <Avatar name={user.fullName} size={56} />
            <div style={{ minWidth: 0 }}>
              <b style={{ fontFamily: 'var(--f-display)', fontSize: 18 }}>{user.fullName}</b>
              <div className="u-hint" style={{ wordBreak: 'break-all' }}>
                {user.email}
              </div>
            </div>
            <Badge tone="info" dot>
              {user.roleName}
            </Badge>
          </div>

          {loading ? (
            <Skeleton rows={2} />
          ) : editing ? (
            <form onSubmit={handleSave} className="u-stack" aria-label="Edit profile">
              <div className="u-field">
                <label className="u-label" htmlFor="pf-name">Full name</label>
                <input id="pf-name" className="u-input" value={form.fullName} maxLength={100} disabled={saving} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} />
              </div>
              {isCandidate && (
                <>
                  <div className="u-field">
                    <label className="u-label" htmlFor="pf-phone">Phone</label>
                    <input id="pf-phone" className="u-input" inputMode="numeric" placeholder="10-digit mobile number" value={form.phone} maxLength={10} disabled={saving} onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))} />
                  </div>
                  <div className="u-field">
                    <label className="u-label" htmlFor="pf-address">Address</label>
                    <input id="pf-address" className="u-input" value={form.address} disabled={saving} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                  </div>
                </>
              )}
              <div className="u-actions">
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                  {saving ? 'Saving...' : 'Save profile'}
                </button>
                <button type="button" className="btn btn-ghost btn-sm" disabled={saving} onClick={() => { setEditing(false); setMessage(''); }}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <dl className="u-kv">
                <div>
                  <dt>Full name</dt>
                  <dd>{profile?.fullName || user.fullName}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{user.email}</dd>
                </div>
                {isCandidate && (
                  <>
                    <div>
                      <dt>Phone</dt>
                      <dd>{profile?.phone || 'Not added'}</dd>
                    </div>
                    <div>
                      <dt>Address</dt>
                      <dd>{profile?.address || 'Not added'}</dd>
                    </div>
                  </>
                )}
              </dl>
              <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={handleEdit}>
                Edit profile
              </button>
            </>
          )}
        </Card>

        <Card>
          <CardHead title="Change password" />
          {pwStep === 'idle' ? (
            <>
              <p className="u-hint">
                We email a verification code to {user.email}. Enter it with your new password. This also works if you sign in with Google.
              </p>
              <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={handleSendPasswordCode} disabled={pwBusy}>
                {pwBusy ? 'Sending code...' : 'Send verification code'}
              </button>
            </>
          ) : (
            <form onSubmit={handleChangePassword} className="u-stack" aria-label="Change password">
              <div className="u-field">
                <label className="u-label" htmlFor="pw-otp">Verification code</label>
                <input id="pw-otp" className="u-input" inputMode="numeric" maxLength={6} autoComplete="one-time-code" placeholder="123456" value={pwOtp} disabled={pwBusy} onChange={e => setPwOtp(e.target.value.replace(/\D/g, ''))} />
              </div>
              <div className="u-field">
                <label className="u-label" htmlFor="pw-new">New password</label>
                <input id="pw-new" className="u-input" type={pwShow ? 'text' : 'password'} autoComplete="new-password" value={pwNew} disabled={pwBusy} onChange={e => setPwNew(e.target.value)} />
                <p className="u-hint">At least 8 characters with a capital letter, a number and a special character.</p>
              </div>
              <div className="u-field">
                <label className="u-label" htmlFor="pw-confirm">Confirm new password</label>
                <input id="pw-confirm" className="u-input" type={pwShow ? 'text' : 'password'} autoComplete="new-password" value={pwConfirm} disabled={pwBusy} onChange={e => setPwConfirm(e.target.value)} />
              </div>
              <label className="u-check">
                <input type="checkbox" checked={pwShow} onChange={e => setPwShow(e.target.checked)} />
                Show passwords
              </label>
              <div className="u-actions">
                <button type="submit" className="btn btn-primary btn-sm" disabled={pwBusy}>
                  {pwBusy ? 'Saving...' : 'Change password'}
                </button>
                <button type="button" className="btn btn-ghost btn-sm" disabled={pwBusy} onClick={() => { resetPasswordForm(); setPwMessage(''); }}>
                  Cancel
                </button>
              </div>
            </form>
          )}
          {pwMessage && (
            <p className="u-hint" role="status" style={{ marginTop: 10, color: pwDone ? 'var(--mint)' : 'var(--danger)' }}>
              {pwMessage}
            </p>
          )}
        </Card>

        <Card>
          <CardHead title="Delete account" />
          <div className="u-danger" style={{ marginTop: 0 }}>
            <span className="u-label" style={{ color: 'var(--danger)' }}>
              Danger zone
            </span>
            {!showDeleteConfirm ? (
              <>
                <p className="t">
                  {isCandidate
                    ? 'This permanently deletes your account, your resumes and all your applications.'
                    : 'This permanently deletes your account, all your jobs, and every application and interview on them.'}
                </p>
                <button type="button" className="btn btn-danger btn-sm" onClick={handleStartDelete} disabled={isSendingOtp}>
                  {isSendingOtp ? 'Sending code...' : 'Delete Account'}
                </button>
                {deleteMessage && <p className="u-hint" style={{ color: 'var(--danger)', marginTop: 10 }}>{deleteMessage}</p>}
              </>
            ) : (
              <form onSubmit={handleDeleteAccount} style={{ display: 'grid', gap: 12 }}>
                <p className="t">
                  Enter the verification code we emailed to {user.email} to confirm.
                </p>
                <input
                  type="text"
                  className="u-input"
                  value={deleteOtp}
                  onChange={e => setDeleteOtp(e.target.value)}
                  disabled={isDeleting}
                  placeholder="Verification Code"
                  autoComplete="one-time-code"
                />
                <div className="u-actions">
                  <button type="submit" className="btn btn-danger btn-sm" disabled={isDeleting} style={{ flex: 1 }}>
                    {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={isDeleting}
                    style={{ flex: 1 }}
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteOtp('');
                      setDeleteMessage('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
                {deleteMessage && <p className="u-hint" style={{ color: 'var(--danger)' }}>{deleteMessage}</p>}
              </form>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default ProfilePage;
