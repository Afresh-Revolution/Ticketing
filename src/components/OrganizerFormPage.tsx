import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { organizerSignup, organizerVerifyOtp } from '../api/auth';
import Logo from './Logo';
import './OrganizerFormPage.css';

type Step = 'form' | 'otp' | 'verified';

const OrganizerFormPage = () => {
  const [step, setStep] = useState<Step>('form');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitForm = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const user = (username || '').trim();
    const em = (email || '').trim();
    if (!user) {
      setError('Username is required.');
      return;
    }
    if (!em || !em.includes('@')) {
      setError('A valid email is required.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await organizerSignup(user, em, password);
      setStep('otp');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const code = otp.replace(/\D/g, '').slice(0, 6);
    if (code.length !== 6) {
      setError('Please enter the 6-digit code.');
      return;
    }
    setLoading(true);
    try {
      await organizerVerifyOtp(email.trim(), code);
      setStep('verified');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="organizer-form-page">
      <div className="organizer-form-card">
        <div className="organizer-form-header">
          <Logo variant="main" className="organizer-form-logo" height={56} />
          <h1 className="organizer-form-title">Become an Organizer</h1>
          <p className="organizer-form-subtitle">
            {step === 'form' && 'Create your organizer account to host events. Enter your details below.'}
            {step === 'otp' && 'Enter the 6-digit code sent to your email.'}
            {step === 'verified' && 'You’re all set. Sign in to the admin dashboard with your email and password.'}
          </p>
        </div>

        {step === 'form' && (
          <form className="organizer-form" onSubmit={handleSubmitForm}>
            {error && <div className="organizer-form-error">{error}</div>}
            <div className="organizer-form-field">
              <label htmlFor="organizer-username">Username</label>
              <input
                id="organizer-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your username"
                required
                disabled={loading}
                autoComplete="username"
              />
            </div>
            <div className="organizer-form-field">
              <label htmlFor="organizer-email">Email</label>
              <input
                id="organizer-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>
            <div className="organizer-form-field">
              <label htmlFor="organizer-password">Password</label>
              <input
                id="organizer-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>
            <div className="organizer-form-field">
              <label htmlFor="organizer-confirm">Confirm password</label>
              <input
                id="organizer-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>
            <button type="submit" className="organizer-form-btn" disabled={loading}>
              {loading ? 'Sending code…' : 'Continue'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form className="organizer-form" onSubmit={handleVerifyOtp}>
            {error && <div className="organizer-form-error">{error}</div>}
            <div className="organizer-form-field">
              <label htmlFor="organizer-otp">Verification code</label>
              <input
                id="organizer-otp"
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                disabled={loading}
                autoComplete="one-time-code"
              />
              <p className="organizer-form-hint">Code sent to {email}</p>
            </div>
            <button type="submit" className="organizer-form-btn" disabled={loading || otp.length !== 6}>
              {loading ? 'Verifying…' : 'Verify'}
            </button>
            <button
              type="button"
              className="organizer-form-back"
              onClick={() => setStep('form')}
              disabled={loading}
            >
              ← Back
            </button>
          </form>
        )}

        {step === 'verified' && (
          <div className="organizer-form-verified">
            <div className="organizer-form-success-icon">✓</div>
            <Link to="/admin/login" className="organizer-form-btn organizer-form-btn-primary">
              Login to Admin Dashboard
            </Link>
            <Link to="/" className="organizer-form-back">← Back to Home</Link>
          </div>
        )}

        <div className="organizer-form-footer">
          <p className="organizer-form-signin">
            Already have an account? <Link to="/admin/login">Sign in</Link>
          </p>
          <Link to="/" className="organizer-form-footer-link">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default OrganizerFormPage;
