import { useNavigate } from 'react-router-dom';
import './ProfileButton.css';

type ProfileButtonProps = {
  className?: string;
  'aria-label'?: string;
};

const ProfileButton = ({
  className = '',
  'aria-label': ariaLabel = 'Profile',
}: ProfileButtonProps) => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className={className || 'profile-btn-trigger'}
      aria-label={ariaLabel}
      onClick={() => navigate('/account')}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
      </svg>
    </button>
  );
};

export default ProfileButton;
