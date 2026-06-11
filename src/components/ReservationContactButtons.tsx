import './ReservationContactButtons.css';

type Props = {
  email?: string;
  phone?: string;
  className?: string;
};

const ReservationContactButtons = ({ email, phone, className = '' }: Props) => {
  const hasEmail = Boolean(email?.trim());
  const hasPhone = Boolean(phone?.trim());
  if (!hasEmail && !hasPhone) return null;

  const cleanPhone = phone?.trim() ?? '';
  const telHref = `tel:${cleanPhone.replace(/\s/g, '')}`;
  const smsHref = `sms:${cleanPhone.replace(/\s/g, '')}`;

  return (
    <div className={`reservation-contact-actions ${className}`.trim()}>
      {hasEmail && (
        <a className="reservation-contact-btn" href={`mailto:${email!.trim()}`}>
          {email!.trim()}
        </a>
      )}
      {hasPhone && (
        <>
          <a className="reservation-contact-btn" href={telHref}>
            Call {cleanPhone}
          </a>
          <a className="reservation-contact-btn" href={smsHref}>
            Text {cleanPhone}
          </a>
        </>
      )}
    </div>
  );
};

export default ReservationContactButtons;
