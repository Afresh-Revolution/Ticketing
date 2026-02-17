import { useState } from "react";
import ProfileModal from "./ProfileModal";
import "./ProfileButton.css";

type ProfileButtonProps = {
  className?: string;
  "aria-label"?: string;
};

const ProfileButton = ({
  className = "",
  "aria-label": ariaLabel = "Profile",
}: ProfileButtonProps) => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={className || "profile-btn-trigger"}
        aria-label={ariaLabel}
        onClick={() => setModalOpen(true)}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
        </svg>
      </button>
      <ProfileModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
};

export default ProfileButton;
