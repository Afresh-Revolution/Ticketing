import React from 'react';
import Modal from './Modal';
import './Modal.css'; // Reuse modal styles

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionId?: string; // To scroll to specific section
}

const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, sectionId }) => {
  // Effect to scroll to section if provided
  React.useEffect(() => {
    if (isOpen && sectionId) {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [isOpen, sectionId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Legal Information">
      <div className="legal-content">
        <section id="terms" className="modal-section">
          <h3>Terms & Conditions</h3>
          <p>
            Welcome to Gatewave. By using our platform, you agree to comply with and be bound by the following terms and conditions of use. 
            If you disagree with any part of these terms and conditions, please do not use our website.
          </p>
          <p>
            The content of the pages of this website is for your general information and use only. It is subject to change without notice.
          </p>
        </section>

        <section id="privacy" className="modal-section">
          <h3>Privacy Policy</h3>
          <p>
            Your privacy is important to us. This policy explains how we collect, use, and protect your personal data.
            We are committed to ensuring that your privacy is protected. Should we ask you to provide certain information by which you can be identified when using this website, then you can be assured that it will only be used in accordance with this privacy statement.
          </p>
        </section>

        <section id="refund" className="modal-section">
          <h3>Refund Policy</h3>
          <p>
            Refunds are handled on a case-by-case basis depending on the event organizer's policy. Gatewave facilitates the transaction but the organizer is responsible for setting and honoring their refund policy.
            Generally, tickets are non-refundable unless the event is cancelled or significantly rescheduled.
          </p>
        </section>

        <section id="cookie" className="modal-section">
          <h3>Cookie Policy</h3>
          <p>
            We use cookies to improve your experience. By continuing to visit this site you agree to our use of cookies.
            Cookies help us analyze web traffic and improve our website in order to tailor it to customer needs.
          </p>
        </section>
      </div>
    </Modal>
  );
};

export default LegalModal;
