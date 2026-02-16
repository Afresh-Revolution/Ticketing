import { useNavigate } from 'react-router-dom';
import '../signup/page.css';

const SignupPage = () => {
  const navigate = useNavigate();

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>Sign Up</h1>
        <p>Create a new account to get started.</p>
        <form className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input type="text" id="name" placeholder="Enter your full name" />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" placeholder="Enter your email" />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" placeholder="Create a password" />
          </div>
          <button type="submit" className="btn btn-primary">Sign Up</button>
        </form>
        <p className="auth-link">
          Already have an account? <button onClick={() => navigate('/login')}>Login</button>
        </p>
        <button onClick={() => navigate('/')} className="back-link">← Back to Home</button>
      </div>
    </div>
  );
};

export default SignupPage;
