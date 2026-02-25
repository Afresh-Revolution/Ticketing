import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signIn, forgotPassword, resetPassword, resendVerification } from '../api/auth';
import '../login/page.css';

type View = 'login' | 'otp' | 'forgot-email' | 'forgot-otp' | 'forgot-password';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const from = (location.state as { from?: string } | null)?.from;
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent, withOtp?: string) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);
    try {
      const result = await signIn(email.trim(), password, withOtp);
      if ('requiresOtp' in result && result.requiresOtp) {
        setView('otp');
      } else if ('user' in result && 'token' in result) {
        login(result.user, result.token);
        navigate(from || '/events', { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSuccess('If an account exists, you will receive a reset code.');
      setView('forgot-otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!otp || !newPassword) {
      setError('Code and new password are required.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email.trim(), otp, newPassword);
      setSuccess('Password updated. Sign in with your new password.');
      setView('login');
      setOtp('');
      setNewPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-left">
          <div className="auth-container">
            <h1>
              {view === 'login' && 'Sign In'}
              {view === 'otp' && 'Verify Email'}
              {view === 'forgot-email' && 'Forgot Password'}
              {view === 'forgot-otp' && 'Enter Reset Code'}
              {view === 'forgot-password' && 'Set New Password'}
            </h1>

            {view === 'login' && (
              <form className="auth-form" onSubmit={(e) => handleLogin(e)}>
                {error && <p className="auth-error">{error}</p>}
                <div className="form-group">
                  <input
                    type="email"
                    id="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    disabled={loading}
                  />
                  <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                </div>
                <div className="form-group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
                <p className="auth-forgot">
                  <button type="button" className="auth-forgot-btn" onClick={() => { setView('forgot-email'); setError(''); setSuccess(''); }}>
                    Forgot password?
                  </button>
                </p>
              </form>
            )}

            {view === 'otp' && (
              <form className="auth-form" onSubmit={(e) => { e.preventDefault(); handleLogin(e as unknown as React.FormEvent<HTMLFormElement>, otp); }}>
                {error && <p className="auth-error">{error}</p>}
                {success && <p className="auth-success">{success}</p>}
                <p className="auth-otp-hint">Enter the 6-digit code sent to {email}</p>
                <div className="form-group">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    disabled={loading}
                    className="auth-otp-input"
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading || otp.length !== 6}>
                  {loading ? 'Verifying…' : 'Verify & Sign In'}
                </button>
                <button type="button" className="auth-forgot-btn" style={{ marginTop: '0.5rem', display: 'block' }} onClick={async () => { setError(''); try { await resendVerification(email); setSuccess('Code resent. Check your email.'); } catch (err) { setError(err instanceof Error ? err.message : 'Failed to resend'); } }}>
                  Resend code
                </button>
                <button type="button" className="auth-back-btn" onClick={() => { setView('login'); setOtp(''); setError(''); setSuccess(''); }}>
                  Back to login
                </button>
              </form>
            )}

            {view === 'forgot-email' && (
              <form className="auth-form" onSubmit={handleForgotEmail}>
                {error && <p className="auth-error">{error}</p>}
                <p className="auth-otp-hint">Enter your email to receive a reset code.</p>
                <div className="form-group">
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Sending…' : 'Send reset code'}
                </button>
                <button type="button" className="auth-back-btn" onClick={() => { setView('login'); setError(''); setSuccess(''); }}>
                  Back to login
                </button>
              </form>
            )}

            {view === 'forgot-otp' && (
              <>
                {success && <p className="auth-success">{success}</p>}
                <form className="auth-form" onSubmit={(e) => { e.preventDefault(); setView('forgot-password'); }}>
                  <div className="form-group">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Enter 6-digit code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      disabled={loading}
                      className="auth-otp-input"
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={otp.length !== 6}>
                    Continue
                  </button>
                  <button type="button" className="auth-back-btn" onClick={() => { setView('forgot-email'); setOtp(''); setSuccess(''); }}>
                    Back
                  </button>
                </form>
              </>
            )}

            {view === 'forgot-password' && (
              <form className="auth-form" onSubmit={handleResetPassword}>
                {error && <p className="auth-error">{error}</p>}
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Verification code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    disabled={loading}
                    className="auth-otp-input"
                  />
                </div>
                <div className="form-group">
                  <input
                    type="password"
                    placeholder="New password (min 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading || !otp || newPassword.length < 6}>
                  {loading ? 'Updating…' : 'Reset password'}
                </button>
                <button type="button" className="auth-back-btn" onClick={() => { setView('forgot-email'); setOtp(''); setNewPassword(''); setError(''); }}>
                  Back
                </button>
              </form>
            )}

            {view === 'login' && (
              <p className="auth-link">
                Don&apos;t have an account? <Link to="/signup" state={from ? { from } : undefined}>Sign Up</Link>
              </p>
            )}
          </div>
        </div>
        <div className="auth-right">
          <div className="auth-right-content">
            <h2><span>Welcome</span><span>back</span></h2>
            <p>Sign in to book tickets and manage your events.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
