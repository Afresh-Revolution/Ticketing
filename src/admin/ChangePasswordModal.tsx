import { useState, useEffect, type FormEvent } from 'react';
import {
  getPasswordChangeStatus,
  verifyAdminPassword,
  changeAdminPassword,
} from '../api/auth';
import './admin.css';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'status' | 'current' | 'verified' | 'done';

const ChangePasswordModal = ({ isOpen, onClose, onSuccess }: ChangePasswordModalProps) => {
  const [step, setStep] = useState<Step>('status');
  const [canChange, setCanChange] = useState(true);
  const [nextChangeAllowedAt, setNextChangeAllowedAt] = useState<string | null>(null);
  const [reason, setReason] = useState<string | undefined>();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const eyeOpen = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  const eyeClosed = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  useEffect(() => {
    if (!isOpen) return;
    setStep('status');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    let cancelled = false;
    getPasswordChangeStatus()
      .then((s) => {
        if (cancelled) return;
        setCanChange(s.canChange);
        setNextChangeAllowedAt(s.nextChangeAllowedAt);
        setReason(s.reason);
        setStep('current');
      })
      .catch(() => {
        if (cancelled) return;
        setCanChange(true);
        setStep('current');
      });
    return () => { cancelled = true; };
  }, [isOpen]);

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!currentPassword.trim()) {
      setError('Enter your current password');
      return;
    }
    setLoading(true);
    try {
      await verifyAdminPassword(currentPassword);
      setStep('verified');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid current password');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match');
      return;
    }
    setLoading(true);
    try {
      await changeAdminPassword(currentPassword, newPassword, confirmPassword);
      setStep('done');
      onSuccess();
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) onClose();
  };

  if (!isOpen) return null;

  const nextAllowedDate = nextChangeAllowedAt
    ? new Date(nextChangeAllowedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })
    : '';

  return (
    <div className="admin-modal-overlay" onClick={handleClose}>
      <div className="admin-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h2 className="admin-modal-title">Change password</h2>
          <button
            type="button"
            className="admin-modal-close"
            onClick={handleClose}
            disabled={loading}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {step === 'status' && (
          <div className="admin-modal-body">
            <p className="admin-modal-muted">Checking…</p>
          </div>
        )}

        {step === 'current' && !canChange && (
          <div className="admin-modal-body">
            <p className="admin-modal-muted">
              {reason === 'super_admin'
                ? 'Super admin password cannot be changed here.'
                : (
                  <>
                    You can only change your password once per month.
                    {nextAllowedDate && (
                      <> Next change allowed: <strong>{nextAllowedDate}</strong></>
                    )}
                  </>
                )}
            </p>
            <button type="button" className="admin-btn admin-btn-primary" onClick={handleClose}>
              Close
            </button>
          </div>
        )}

        {step === 'current' && canChange && (
          <form className="admin-modal-form" onSubmit={handleVerify}>
            {error && (
              <div className="admin-modal-error">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                {error}
              </div>
            )}
            <p className="admin-modal-muted" style={{ marginBottom: '1rem' }}>
              Enter your current password to continue. You can only change your password once per month.
            </p>
            <div className="admin-modal-field">
              <label htmlFor="current-password" className="admin-modal-label">Current password</label>
              <div className="admin-change-password-input-wrap">
                <input
                  id="current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  className="admin-login-input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="admin-password-toggle"
                  onClick={() => setShowCurrentPassword((v) => !v)}
                  aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                >
                  {showCurrentPassword ? eyeClosed : eyeOpen}
                </button>
              </div>
            </div>
            <button type="submit" className="admin-btn admin-btn-primary" disabled={loading}>
              {loading ? 'Verifying…' : 'Verify'}
            </button>
          </form>
        )}

        {step === 'verified' && (
          <form className="admin-modal-form" onSubmit={handleChangePassword}>
            <p className="admin-modal-success" style={{ marginBottom: '1rem' }}>
              ✓ Verified
            </p>
            {error && (
              <div className="admin-modal-error">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                {error}
              </div>
            )}
            <div className="admin-modal-field">
              <label htmlFor="new-password" className="admin-modal-label">New password (min 6 characters)</label>
              <div className="admin-change-password-input-wrap">
                <input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  className="admin-login-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  minLength={6}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="admin-password-toggle"
                  onClick={() => setShowNewPassword((v) => !v)}
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? eyeClosed : eyeOpen}
                </button>
              </div>
            </div>
            <div className="admin-modal-field">
              <label htmlFor="confirm-password" className="admin-modal-label">Confirm new password</label>
              <div className="admin-change-password-input-wrap">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="admin-login-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="admin-password-toggle"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? eyeClosed : eyeOpen}
                </button>
              </div>
            </div>
            <button type="submit" className="admin-btn admin-btn-primary" disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}>
              {loading ? 'Changing…' : 'Change password'}
            </button>
          </form>
        )}

        {step === 'done' && (
          <div className="admin-modal-body">
            <p className="admin-modal-success">Password changed successfully.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChangePasswordModal;
