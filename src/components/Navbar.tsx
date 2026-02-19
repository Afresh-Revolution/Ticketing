import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isHomePage = location.pathname === '/';

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''} ${!isHomePage ? 'scrolled' : ''}`}>
      <div className={`nav-overlay ${mobileMenuOpen ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}></div>
      <div className="navbar-container">
        <div className="logo" onClick={() => navigate('/')}>
          <Logo variant="main" className="logo-img" height={26} />
        </div>

        <div className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
          <a onClick={() => navigate('/events')} className="nav-link">Explore Events</a>
          
          {isAuthenticated ? (
            <>
              <a onClick={() => navigate('/my-tickets')} className="nav-link">My Tickets</a>
              <div className="nav-user-info">
                 <span className="nav-user-name">Hi, {user?.name?.split(' ')[0] || 'User'}</span>
                 <button className="nav-btn-logout" onClick={handleLogout}>Logout</button>
              </div>
            </>
          ) : (
            <button className="nav-btn-signin" onClick={() => navigate('/login')}>
              Sign In
            </button>
          )}
        </div>

        <button 
          className="mobile-menu-btn" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}></span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
