import { useState } from "react";
import "./ProfileModal.css";

const DEFAULT_PROFILE = {
  firstName: "Alex",
  lastName: "Johnson",
  phone: "+234 485983385",
  email: "sarah.anderson@email.com",
  address: "123 Market Street, Jos, Plateau State",
};

type ProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const ProfileModal = ({ isOpen, onClose }: ProfileModalProps) => {
  const [form, setForm] = useState(DEFAULT_PROFILE);

  if (!isOpen) return null;

  const initials =
    (form.firstName?.charAt(0) || "") + (form.lastName?.charAt(0) || "") || "?";

  const handleChange = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
  };

  return (
    <div className="profile-modal-backdrop" onClick={onClose}>
      <div
        className="profile-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="profile-modal-title"
        aria-modal="true"
      >
        <header className="profile-modal-header">
          <h2 id="profile-modal-title" className="profile-modal-title">
            My Profile
          </h2>
          <button
            type="button"
            className="profile-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </header>

        <div className="profile-modal-body">
          <div className="profile-modal-left">
            <div className="profile-avatar">{initials.toUpperCase()}</div>
            <button type="button" className="profile-edit-photo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit
            </button>
          </div>

          <form className="profile-modal-form" onSubmit={handleSave}>
            <div className="profile-form-row">
              <div className="profile-field">
                <label htmlFor="profile-first">FIRST NAME</label>
                <input
                  id="profile-first"
                  type="text"
                  value={form.firstName}
                  onChange={handleChange("firstName")}
                  className="profile-input"
                />
              </div>
              <div className="profile-field">
                <label htmlFor="profile-last">LAST NAME</label>
                <input
                  id="profile-last"
                  type="text"
                  value={form.lastName}
                  onChange={handleChange("lastName")}
                  className="profile-input"
                />
              </div>
            </div>
            <div className="profile-form-row">
              <div className="profile-field">
                <label htmlFor="profile-phone">PHONE</label>
                <input
                  id="profile-phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange("phone")}
                  className="profile-input"
                />
              </div>
              <div className="profile-field">
                <label htmlFor="profile-email">EMAIL ADDRESS</label>
                <input
                  id="profile-email"
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  className="profile-input"
                />
              </div>
            </div>
            <div className="profile-field profile-field-address">
              <label htmlFor="profile-address">ADDRESS</label>
              <textarea
                id="profile-address"
                value={form.address}
                onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                className="profile-input"
                rows={3}
              />
            </div>

            <div className="profile-modal-actions">
              <button type="button" className="profile-btn profile-btn-cancel" onClick={onClose}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Cancel
              </button>
              <button type="submit" className="profile-btn profile-btn-save">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
