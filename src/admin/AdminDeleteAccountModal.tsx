import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import { deleteAccount } from '../api/auth';
import './admin.css';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const AdminDeleteAccountModal = ({ isOpen, onClose }: Props) => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setConfirmText('');
      setLoading(false);
      setError('');
    }
  }, [isOpen]);

  const canSubmit =
    password.length >= 6 && confirmText.trim().toUpperCase() === 'DELETE';

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    if (!token || !canSubmit) return;
    setLoading(true);
    setError('');
    try {
      await deleteAccount(token, password);
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      localStorage.removeItem('adminRole');
      onClose();
      navigate('/admin/login', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete organizer account">
      <form className="admin-modal-form" onSubmit={onSubmit}>
        <p className="admin-delete-confirm-message">
          This permanently deletes your organizer login. Events you created stay on GateWav but are
          unlinked from your account. Type DELETE and enter your password to confirm.
        </p>
        <label className="admin-field-label" htmlFor="admin-delete-password">
          Password
        </label>
        <input
          id="admin-delete-password"
          type="password"
          className="admin-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        <label className="admin-field-label" htmlFor="admin-delete-confirm">
          Type DELETE
        </label>
        <input
          id="admin-delete-confirm"
          type="text"
          className="admin-input"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          required
        />
        {error ? <p className="admin-form-error" role="alert">{error}</p> : null}
        <div className="admin-modal-actions">
          <button type="button" className="admin-btn admin-btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            type="submit"
            className="admin-btn admin-btn-danger"
            disabled={!canSubmit || loading}
          >
            {loading ? 'Deleting…' : 'Delete account'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AdminDeleteAccountModal;
