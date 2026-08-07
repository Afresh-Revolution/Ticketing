import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import { deleteAccount } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';
import './ProfileModal.css';

type ProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const ProfileModal = ({ isOpen, onClose }: ProfileModalProps) => {
  const navigate = useNavigate();
  const { user, token, logout, isAuthenticated } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setConfirmText('');
      setShowDelete(false);
      setLoading(false);
      setError('');
      setInfo('');
    }
  }, [isOpen]);

  const displayName = user?.name?.trim() || 'GateWav user';
  const initials = (displayName.charAt(0) || user?.email?.charAt(0) || 'G').toUpperCase();
  const canDelete =
    password.length >= 6 && confirmText.trim().toUpperCase() === 'DELETE' && !!token;

  const handleDelete = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !canDelete) return;
    setLoading(true);
    setError('');
    setInfo('');
    try {
      const res = await deleteAccount(token, password);
      setInfo(res.message);
      logout();
      onClose();
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Account">
        <div className="profile-modal-body profile-modal-body-single">
          <p className="profile-account-copy">Sign in to manage your GateWav account.</p>
          <div className="profile-modal-actions">
            <button
              type="button"
              className="profile-btn profile-btn-save"
              onClick={() => {
                onClose();
                navigate('/login');
              }}
            >
              Sign in
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="My Account" className="profile-modal-container">
      <div className="profile-modal-body profile-modal-body-single">
        <div className="profile-account-header">
          <div className="profile-avatar" aria-hidden>
            {initials}
          </div>
          <div>
            <p className="profile-account-name">{displayName}</p>
            <p className="profile-account-email">{user.email}</p>
          </div>
        </div>

        <div className="profile-account-links">
          <button
            type="button"
            className="profile-link-btn"
            onClick={() => {
              onClose();
              navigate('/my-tickets');
            }}
          >
            My tickets
          </button>
          <button
            type="button"
            className="profile-link-btn"
            onClick={() => {
              logout();
              onClose();
              navigate('/');
            }}
          >
            Sign out
          </button>
        </div>

        <div className="profile-danger-zone">
          <h3 className="profile-danger-title">Delete account</h3>
          <p className="profile-account-copy">
            Permanently delete your GateWav login. Ticket purchase records may be retained for
            legal and financial compliance. This cannot be undone.
          </p>

          {!showDelete ? (
            <button
              type="button"
              className="profile-btn profile-btn-danger"
              onClick={() => setShowDelete(true)}
            >
              Delete my account
            </button>
          ) : (
            <form className="profile-delete-form" onSubmit={handleDelete}>
              <div className="profile-field">
                <label htmlFor="delete-password">PASSWORD</label>
                <input
                  id="delete-password"
                  type="password"
                  className="profile-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
              <div className="profile-field">
                <label htmlFor="delete-confirm">TYPE DELETE TO CONFIRM</label>
                <input
                  id="delete-confirm"
                  type="text"
                  className="profile-input"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  autoCapitalize="characters"
                  required
                />
              </div>
              {error ? <p className="profile-form-error" role="alert">{error}</p> : null}
              {info ? <p className="profile-form-info">{info}</p> : null}
              <div className="profile-modal-actions">
                <button
                  type="button"
                  className="profile-btn profile-btn-cancel"
                  onClick={() => {
                    setShowDelete(false);
                    setPassword('');
                    setConfirmText('');
                    setError('');
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="profile-btn profile-btn-danger"
                  disabled={!canDelete || loading}
                >
                  {loading ? 'Deleting…' : 'Delete permanently'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ProfileModal;
