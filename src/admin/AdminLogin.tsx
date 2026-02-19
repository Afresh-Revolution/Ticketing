import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { signIn, forgotPassword, resetPassword, type AuthResponse } from "../api/auth";
import Logo from "../components/Logo";
import "./admin.css";

type View = "login" | "forgot-email" | "forgot-otp" | "forgot-password";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await signIn(email, password);
      if ("requiresOtp" in response && response.requiresOtp) {
        setError("Please verify your email first. Use the main login page to enter your verification code.");
        return;
      }
      const { token, user } = response as AuthResponse;
      localStorage.setItem("adminToken", token);
      localStorage.setItem("adminUser", JSON.stringify(user));
      localStorage.setItem("adminRole", user.role || "admin");
      navigate("/admin");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Login failed. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotEmail = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSuccess("If an account exists, you will receive a reset code.");
      setView("forgot-otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!otp || !newPassword) {
      setError("Code and new password are required.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email.trim(), otp, newPassword);
      setSuccess("Password updated. Sign in with your new password.");
      setView("login");
      setOtp("");
      setNewPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  const titleByView =
    view === "login"
      ? "Admin Portal"
      : view === "forgot-email"
        ? "Forgot Password"
        : view === "forgot-otp"
          ? "Enter Reset Code"
          : "Set New Password";

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <div className="admin-login-logo">
            <Logo variant="main" className="admin-login-logo-img" height={72} />
          </div>
          <h1 className="admin-login-title">{titleByView}</h1>
          <p className="admin-login-subtitle">
            {view === "login"
              ? "Sign in to access the admin dashboard"
              : view === "forgot-email"
                ? "Enter your email to receive a reset code"
                : view === "forgot-otp"
                  ? "Enter the 6-digit code from your email"
                  : "Enter the code and your new password"}
          </p>
        </div>

        {view === "login" && (
          <form className="admin-login-form" onSubmit={handleSubmit}>
            {error && (
              <div className="admin-login-error">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                {error}
              </div>
            )}

            <div className="admin-login-field">
              <label htmlFor="email" className="admin-login-label">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className="admin-login-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@gatewave.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="admin-login-field" style={{ position: "relative" }}>
              <label htmlFor="password" className="admin-login-label">
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="admin-login-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: "40px" }}
                />
                <button
                  type="button"
                  className="admin-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="admin-login-button" disabled={loading}>
              {loading ? (
                <>
                  <span className="admin-login-spinner"></span>
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>

            <p className="admin-login-forgot-wrap">
              <button
                type="button"
                className="admin-login-forgot-link"
                onClick={() => {
                  setView("forgot-email");
                  setError("");
                  setSuccess("");
                }}
              >
                Forgot password?
              </button>
            </p>
          </form>
        )}

        {view === "forgot-email" && (
          <form className="admin-login-form" onSubmit={handleForgotEmail}>
            {error && (
              <div className="admin-login-error">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                {error}
              </div>
            )}
            <div className="admin-login-field">
              <label htmlFor="forgot-email" className="admin-login-label">
                Email Address
              </label>
              <input
                id="forgot-email"
                type="email"
                className="admin-login-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@gatewave.com"
                required
                autoComplete="email"
              />
            </div>
            <button type="submit" className="admin-login-button" disabled={loading}>
              {loading ? (
                <>
                  <span className="admin-login-spinner"></span>
                  Sending...
                </>
              ) : (
                "Send reset code"
              )}
            </button>
            <button type="button" className="admin-login-back" onClick={() => { setView("login"); setSuccess(""); }}>
              ← Back to sign in
            </button>
          </form>
        )}

        {view === "forgot-otp" && (
          <>
            {success && <div className="admin-login-success">{success}</div>}
            <form
              className="admin-login-form"
              onSubmit={(e) => {
                e.preventDefault();
                setView("forgot-password");
              }}
            >
              <div className="admin-login-field">
                <label htmlFor="forgot-otp" className="admin-login-label">
                  Verification code
                </label>
                <input
                  id="forgot-otp"
                  type="text"
                  inputMode="numeric"
                  className="admin-login-input admin-login-otp-input"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                />
              </div>
              <button type="submit" className="admin-login-button" disabled={otp.length !== 6}>
                Continue
              </button>
              <button type="button" className="admin-login-back" onClick={() => setView("forgot-email")}>
                ← Back
              </button>
            </form>
          </>
        )}

        {view === "forgot-password" && (
          <form className="admin-login-form" onSubmit={handleResetPassword}>
            {error && (
              <div className="admin-login-error">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                {error}
              </div>
            )}
            {success && <div className="admin-login-success">{success}</div>}
            <div className="admin-login-field">
              <label htmlFor="reset-otp" className="admin-login-label">
                Verification code
              </label>
              <input
                id="reset-otp"
                type="text"
                inputMode="numeric"
                className="admin-login-input admin-login-otp-input"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
              />
            </div>
            <div className="admin-login-field">
              <label htmlFor="new-password" className="admin-login-label">
                New password (min 6 characters)
              </label>
              <input
                id="new-password"
                type="password"
                className="admin-login-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                minLength={6}
              />
            </div>
            <button type="submit" className="admin-login-button" disabled={loading || !otp || newPassword.length < 6}>
              {loading ? (
                <>
                  <span className="admin-login-spinner"></span>
                  Updating...
                </>
              ) : (
                "Reset password"
              )}
            </button>
            <button type="button" className="admin-login-back" onClick={() => setView("forgot-email")}>
              ← Back
            </button>
          </form>
        )}

        <div className="admin-login-footer">
          <button type="button" className="admin-login-back" onClick={() => navigate("/")}>
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
