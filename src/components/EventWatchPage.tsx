import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { fetchStreamAccess } from '../api/stream';
import Navbar from './Navbar';
import './EventWatchPage.css';

const EventWatchPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notLive, setNotLive] = useState(false);
  const [title, setTitle] = useState('');
  const [embedUrl, setEmbedUrl] = useState('');

  useEffect(() => {
    if (!id || !token) {
      setError('Invalid watch link. Open the link from your ticket email.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchStreamAccess(id, token);
        if (cancelled) return;
        if (data.error) {
          setNotLive(Boolean(data.notLive));
          setError(data.error);
          setTitle(data.eventTitle || '');
          return;
        }
        setTitle(data.eventTitle || 'Live event');
        setEmbedUrl(data.embedUrl || '');
      } catch {
        if (!cancelled) setError('Could not verify stream access.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [id, token]);

  return (
    <div className="event-watch-page">
      <Navbar />
      <main className="event-watch-main">
        {loading ? (
          <p className="event-watch-status">Verifying your ticket…</p>
        ) : error ? (
          <div className="event-watch-card event-watch-card--error">
            <h1>{title || 'Stream access'}</h1>
            <p>{error}</p>
            {notLive && (
              <p className="event-watch-hint">
                You will receive an email when the organizer goes live. Keep this link handy.
              </p>
            )}
            {id && <Link to={`/event/${id}`} className="event-watch-link">Back to event</Link>}
          </div>
        ) : (
          <div className="event-watch-card">
            <div className="event-watch-header">
              <span className="event-watch-live-pill">Live</span>
              <h1>{title}</h1>
            </div>
            <div className="event-watch-player">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  title={title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              ) : (
                <p className="event-watch-status">Stream unavailable.</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default EventWatchPage;
