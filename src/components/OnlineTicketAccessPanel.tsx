import { Link } from 'react-router-dom';
import {
  formatEventScheduleLines,
  getCountdownParts,
  parseEventStart,
} from '../utils/eventDates';
import type { OrderEvent } from '../api/orders';
import './OnlineTicketAccessPanel.css';

type OnlineTicketAccessPanelProps = {
  event: OrderEvent | null | undefined;
  eventId: string;
  now: Date;
};

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="online-ticket-countdown-unit">
      <span className="online-ticket-countdown-value">{String(value).padStart(2, '0')}</span>
      <span className="online-ticket-countdown-label">{label}</span>
    </div>
  );
}

export function OnlineTicketAccessPanel({ event, eventId, now }: OnlineTicketAccessPanelProps) {
  const start = parseEventStart(event?.date, event?.startTime);
  const { dayName, dateLine, timeLine } = formatEventScheduleLines(
    event?.date,
    event?.startTime,
    event?.endTime,
    event?.endDate,
  );
  const countdown = getCountdownParts(start, now);
  const isLive = Boolean(event?.isLive);

  return (
    <div className="online-ticket-access-panel">
      <p className="online-ticket-access-label">Online access</p>
      {isLive ? (
        <>
          <span className="online-ticket-live-pill">Live now</span>
          <p className="online-ticket-access-hint">
            The stream is live. Check your email for your private watch link.
          </p>
        </>
      ) : (
        <>
          {dayName && <p className="online-ticket-access-day">{dayName}</p>}
          {dateLine && <p className="online-ticket-access-date">{dateLine}</p>}
          {timeLine && (
            <p className="online-ticket-access-time">
              {timeLine} <span>WAT</span>
            </p>
          )}
          {countdown && !countdown.started && (
            <div className="online-ticket-countdown-grid" aria-label="Countdown to event start">
              <CountdownUnit value={countdown.days} label="Days" />
              <CountdownUnit value={countdown.hours} label="Hours" />
              <CountdownUnit value={countdown.minutes} label="Mins" />
              <CountdownUnit value={countdown.seconds} label="Secs" />
            </div>
          )}
          {countdown?.started && (
            <p className="online-ticket-countdown-soon">Starting soon</p>
          )}
          <p className="online-ticket-access-hint">
            Your private watch link will be emailed when the event goes live. No QR code is needed
            for online access.
          </p>
          {eventId && (
            <Link to={`/event/${eventId}`} className="online-ticket-access-link">
              View event page →
            </Link>
          )}
        </>
      )}
    </div>
  );
}
