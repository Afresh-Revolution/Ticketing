import { type FormEvent, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { deleteAccount } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';
import './AccountPage.css';

const AccountPage = () => {
  const navigate = useNavigate();
  const { user, token, logout, isAuthenticated } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: '/account' }} />;
  }

  const displayName = user.name?.trim() || 'GateWav user';
  const initials = (displayName.charAt(0) || user.email?.charAt(0) || 'G').toUpperCase();
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
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="account-page">
      <Navbar />
      <main className="account-page-main">
        <header className="account-page-header">
          <h1>My Account</h1>
          <p className="account-page-lede">Manage your GateWav profile and account settings.</p>
        </header>

        <section className="account-card" aria-labelledby="account-profile-heading">
          <div className="account-profile">
            <div className="account-avatar" aria-hidden>
              {initials}
            </div>
            <div>
              <h2 id="account-profile-heading" className="account-name">
                {displayName}
              </h2>
              <p className="account-email">{user.email}</p>
            </div>
          </div>

          <div className="account-actions">
            <button
              type="button"
              className="account-chip-btn"
              onClick={() => navigate('/my-tickets')}
            >
              My tickets
            </button>
            <button
              type="button"
              className="account-chip-btn"
              onClick={() => {
                logout();
                navigate('/');
              }}
            >
              Sign out
            </button>
          </div>
        </section>

        <section className="account-danger" aria-labelledby="account-delete-heading">
          <h2 id="account-delete-heading" className="account-danger-title">
            Delete account
          </h2>
          <p className="account-danger-copy">
            Permanently delete your GateWav login. Ticket purchase records may be retained for legal
            and financial compliance. This cannot be undone.
          </p>

          {!showDelete ? (
            <button
              type="button"
              className="account-btn account-btn-danger"
              onClick={() => setShowDelete(true)}
            >
              Delete my account
            </button>
          ) : (
            <form className="account-delete-form" onSubmit={handleDelete}>
              <div className="account-field">
                <label htmlFor="delete-password">PASSWORD</label>
                <input
                  id="delete-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
              <div className="account-field">
                <label htmlFor="delete-confirm">TYPE DELETE TO CONFIRM</label>
                <input
                  id="delete-confirm"
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  autoCapitalize="characters"
                  required
                />
              </div>
              {error ? (
                <p className="account-form-error" role="alert">
                  {error}
                </p>
              ) : null}
              {info ? <p className="account-form-info">{info}</p> : null}
              <div className="account-form-actions">
                <button
                  type="button"
                  className="account-btn account-btn-cancel"
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
                  className="account-btn account-btn-danger"
                  disabled={!canDelete || loading}
                >
                  {loading ? 'Deleting…' : 'Delete permanently'}
                </button>
              </div>
            </form>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AccountPage;
