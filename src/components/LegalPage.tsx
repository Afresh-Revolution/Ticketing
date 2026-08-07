import { Link, Navigate, useParams } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import './LegalPage.css';

export type LegalDoc = 'terms' | 'privacy' | 'refund' | 'cookie';

const LEGAL_DOCS: Record<
  LegalDoc,
  { title: string; updated: string; body: string[] }
> = {
  terms: {
    title: 'Terms & Conditions',
    updated: 'August 2026',
    body: [
      'Welcome to GateWav. By using our platform, you agree to comply with and be bound by the following terms and conditions of use. If you disagree with any part of these terms and conditions, please do not use our website or app.',
      'A service charge may be applied to ticket purchases as disclosed at checkout. Event content and ticket availability are provided by organizers and may change without notice.',
      'The content of the pages of this website is for your general information and use only. It is subject to change without notice.',
      'You are responsible for keeping your account credentials secure. Misuse of tickets or fraudulent activity may result in account suspension or termination.',
      'Tickets are generally non-refundable unless the event is cancelled or significantly rescheduled; refunds follow the organizer’s policy as described in our Refund Policy.',
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    updated: 'August 2026',
    body: [
      'Your privacy is important to us. This policy explains how we collect, use, and protect your personal data when you use GateWav.',
      'When you provide information by which you can be identified (such as name, email, phone, and purchase details), it is used to process ticket orders, authenticate your account, send confirmations, and improve the service.',
      'We do not sell your personal data. Payment card details are processed by Paystack and are not stored on GateWav servers.',
      'Session tokens are stored securely on your device. You may request account deletion at any time from your account settings in the app or website.',
      'Contact us at info@gatewav.com if you have questions about this policy or your data.',
    ],
  },
  refund: {
    title: 'Refund Policy',
    updated: 'August 2026',
    body: [
      'Refunds are handled on a case-by-case basis depending on the event organizer’s policy. GateWav facilitates the transaction but the organizer is responsible for setting and honoring their refund policy.',
      'Generally, tickets are non-refundable unless the event is cancelled or significantly rescheduled.',
      'To request assistance, contact support at info@gatewav.com with your order ID and details of the issue.',
    ],
  },
  cookie: {
    title: 'Cookie Policy',
    updated: 'August 2026',
    body: [
      'We use cookies and similar technologies to improve your experience on GateWav.',
      'Cookies help us keep you signed in, analyze traffic, remember preferences, and improve the site so we can tailor it to customer needs.',
      'By continuing to visit this site you agree to our use of cookies. You can control cookies through your browser settings; disabling some cookies may affect site functionality.',
    ],
  },
};

const NAV_ITEMS: { doc: LegalDoc; label: string }[] = [
  { doc: 'terms', label: 'Terms & Conditions' },
  { doc: 'privacy', label: 'Privacy Policy' },
  { doc: 'refund', label: 'Refund Policy' },
  { doc: 'cookie', label: 'Cookie Policy' },
];

function isLegalDoc(value: string | undefined): value is LegalDoc {
  return value === 'terms' || value === 'privacy' || value === 'refund' || value === 'cookie';
}

const LegalPage = () => {
  const { doc } = useParams<{ doc?: string }>();

  if (!doc) {
    return <Navigate to="/legal/terms" replace />;
  }
  if (!isLegalDoc(doc)) {
    return <Navigate to="/legal/terms" replace />;
  }

  const content = LEGAL_DOCS[doc];

  return (
    <div className="legal-page">
      <Navbar />
      <main className="legal-page-main">
        <aside className="legal-page-nav" aria-label="Legal documents">
          <p className="legal-page-nav-label">Legal</p>
          <ul>
            {NAV_ITEMS.map((item) => (
              <li key={item.doc}>
                <Link
                  to={`/legal/${item.doc}`}
                  className={item.doc === doc ? 'active' : undefined}
                  aria-current={item.doc === doc ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        <article className="legal-page-article">
          <h1>{content.title}</h1>
          <p className="legal-page-updated">Last updated: {content.updated}</p>
          {content.body.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default LegalPage;
