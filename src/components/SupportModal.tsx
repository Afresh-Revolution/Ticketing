import React from 'react';
import Modal from './Modal';
import './Modal.css';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionId?: string;
}

const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose, sectionId }) => {
  React.useEffect(() => {
    if (isOpen && sectionId) {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [isOpen, sectionId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Support Center">
      <div className="support-content">
        <section id="faqs" className="modal-section">
          <h3>Frequently Asked Questions</h3>
          
          <div className="faq-item">
            <h4>How do I create an event?</h4>
            <p>To create an event, you need to sign up as an organizer and choose a membership plan. Once subscribed, you can access the creator dashboard to set up your event.</p>
          </div>
          
          <div className="faq-item">
            <h4>How do received my tickets?</h4>
            <p>Tickets are sent to your email address immediately after purchase. You can also view them in the "My Tickets" section if you have an account.</p>
          </div>

          <div className="faq-item">
             <h4>Can I transfer my ticket?</h4>
             <p>Yes, you can transfer your ticket to another user via the "My Tickets" dashboard, provided the event organizer allows transfers.</p>
           </div>
        </section>

        <section id="contact" className="modal-section">
          <h3>Contact Us</h3>
          <p>Need help? Reach out to our support team at <a href="mailto:support@gatewav.com" style={{color: '#791A94'}}>support@gatewav.com</a>.</p>
          <p>We typically respond within 24 hours.</p>
        </section>

        <section id="report" className="modal-section">
          <h3>Report an Issue</h3>
          <p>If you encounter any technical issues or need to report a violation of our terms, please contact us immediately with details of the issue.</p>
        </section>
      </div>
    </Modal>
  );
};

export default SupportModal;
