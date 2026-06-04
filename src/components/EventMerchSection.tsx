import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  type EventMerchDto,
  getMerchDisplayPrice,
  merchForChannel,
} from '../types/merch';
import { submitMerchSaveRequest } from '../api/merch';
import './EventMerchSection.css';

type Props = {
  eventId: string;
  eventTitle: string;
  merch: EventMerchDto[];
};

const CAROUSEL_MS = 3000;

function MerchCarousel({ images, merch }: { images: EventMerchDto['images']; merch: EventMerchDto }) {
  const [index, setIndex] = useState(0);
  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);

  useEffect(() => {
    if (sorted.length <= 1) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % sorted.length);
    }, CAROUSEL_MS);
    return () => window.clearInterval(t);
  }, [sorted.length]);

  if (sorted.length === 0) return null;
  const current = sorted[index] ?? sorted[0];
  const price =
    merch.sameAmount && merch.unitPrice != null
      ? merch.unitPrice
      : current.unitPrice ?? merch.unitPrice ?? 0;

  return (
    <div className="event-merch-carousel">
      <div className="event-merch-carousel-track">
        {sorted.map((img, i) => (
          <button
            key={img.id}
            type="button"
            className={`event-merch-carousel-slide ${i === index ? 'active' : ''}`}
            onClick={() => setIndex(i)}
            aria-label={`View image ${i + 1}`}
          >
            <img src={img.imageUrl} alt="" />
          </button>
        ))}
      </div>
      <div className="event-merch-carousel-meta">
        <p className="event-merch-carousel-desc">{merch.description}</p>
        <span className="event-merch-carousel-stock">
          {current.quantityAvailable} left · ₦{Number(price).toLocaleString()}
        </span>
        {sorted.length > 1 && (
          <div className="event-merch-carousel-dots">
            {sorted.map((_, i) => (
              <button
                key={i}
                type="button"
                className={i === index ? 'active' : ''}
                onClick={() => setIndex(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AtEventSaveForm({
  eventId,
  merch,
}: {
  eventId: string;
  merch: EventMerchDto;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState('');
  const [err, setErr] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr('');
    try {
      const data = await submitMerchSaveRequest({
        eventId,
        merchId: merch.id,
        fullName: name.trim(),
        email: email.trim(),
        message: message.trim() || undefined,
      });
      setDone(data.message || 'Request sent!');
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  if (done) return <p className="event-merch-save-done">{done}</p>;

  return (
    <form className="event-merch-save-form" onSubmit={submit}>
      <p className="event-merch-save-hint">
        Save this merch for pickup at the event. Your request is confirmed after you purchase a ticket.
      </p>
      <input
        type="text"
        className="event-merch-save-input"
        placeholder="Full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        type="email"
        className="event-merch-save-input"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <textarea
        className="event-merch-save-input"
        placeholder="Note (optional)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={2}
      />
      {err && <p className="event-merch-save-error">{err}</p>}
      <button type="submit" className="event-merch-cta" disabled={loading}>
        {loading ? 'Sending…' : 'Send save request'}
      </button>
    </form>
  );
}

const EventMerchSection = ({ eventId, eventTitle, merch }: Props) => {
  const navigate = useNavigate();
  const online = merchForChannel(merch, 'online');
  const atEvent = merchForChannel(merch, 'at_event');

  const goShop = useCallback(
    (filter?: 'online' | 'at_event') => {
      navigate(`/event/${eventId}/merch`, {
        state: { eventTitle, filter },
      });
    },
    [eventId, eventTitle, navigate]
  );

  if (online.length === 0 && atEvent.length === 0) return null;

  return (
    <section className="event-merch-section" aria-labelledby="event-merch-heading">
      <h2 id="event-merch-heading" className="event-detail-tickets-heading">
        Merch
      </h2>

      {online.length > 0 && (
        <div className="event-merch-block">
          <h3 className="event-merch-subheading">Shop online</h3>
          <div className="event-merch-cards">
            {online.map((m) => {
              const price = getMerchDisplayPrice(m);
              const multi = online.length > 1;
              return (
                <article key={m.id} className="event-merch-card">
                  {m.images.length > 2 ? (
                    <MerchCarousel images={m.images} merch={m} />
                  ) : m.images.length > 0 ? (
                    <div className="event-merch-static-images">
                      {m.images.slice(0, 2).map((img) => (
                        <img key={img.id} src={img.imageUrl} alt="" />
                      ))}
                      <p className="event-merch-card-desc">{m.description}</p>
                    </div>
                  ) : (
                    <p className="event-merch-card-desc">{m.description}</p>
                  )}
                  <button
                    type="button"
                    className="event-merch-cta"
                    onClick={() => goShop('online')}
                  >
                    {multi ? 'Select Merch' : `Pay ₦${Number(price).toLocaleString()}`}
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {atEvent.length > 0 && (
        <div className="event-merch-block">
          <h3 className="event-merch-subheading">At the event</h3>
          <div className="event-merch-cards">
            {atEvent.map((m) => (
              <article key={m.id} className="event-merch-card event-merch-card-at-event">
                {m.images.length > 0 && (
                  <div className="event-merch-static-images">
                    {m.images.slice(0, 3).map((img) => (
                      <img key={img.id} src={img.imageUrl} alt="" />
                    ))}
                  </div>
                )}
                <p className="event-merch-card-desc">{m.description}</p>
                <AtEventSaveForm eventId={eventId} merch={m} />
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default EventMerchSection;
