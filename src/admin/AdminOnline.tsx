import { useCallback, useEffect, useState } from 'react';
import {
  endLive,
  fetchStreamableEvents,
  fetchStreamEvent,
  goLive,
  updateStreamConfig,
  type StreamableEvent,
} from '../api/stream';
import { STREAM_PROVIDERS } from '../utils/eventStream';
import './admin.css';

const AdminOnline = () => {
  const [events, setEvents] = useState<StreamableEvent[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [selected, setSelected] = useState<StreamableEvent | null>(null);
  const [streamUrl, setStreamUrl] = useState('');
  const [streamProvider, setStreamProvider] = useState('youtube');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [goingLive, setGoingLive] = useState(false);
  const [ending, setEnding] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await fetchStreamableEvents();
      setEvents(list);
      if (!selectedId && list.length > 0) {
        setSelectedId(String(list[0].id));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const event = await fetchStreamEvent(selectedId);
        if (cancelled) return;
        setSelected(event);
        setStreamUrl(event.streamUrl || '');
        setStreamProvider(event.streamProvider || 'youtube');
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load event');
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const updated = await updateStreamConfig(selectedId, { streamUrl: streamUrl.trim(), streamProvider });
      setSelected(updated);
      setMessage('Stream settings saved.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleGoLive = async () => {
    if (!selectedId) return;
    setGoingLive(true);
    setError('');
    setMessage('');
    try {
      if (!streamUrl.trim()) {
        setError('Add a stream URL before going live.');
        return;
      }
      if (!selected?.streamUrl?.trim()) {
        await updateStreamConfig(selectedId, { streamUrl: streamUrl.trim(), streamProvider });
      }
      const result = await goLive(selectedId);
      setMessage(
        `You are live. Join links emailed to ${result.emailsSent} of ${result.attendeeCount} paid attendees.`,
      );
      const refreshed = await fetchStreamEvent(selectedId);
      setSelected(refreshed);
      void loadEvents();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Go live failed');
    } finally {
      setGoingLive(false);
    }
  };

  const handleEndLive = async () => {
    if (!selectedId) return;
    setEnding(true);
    setError('');
    setMessage('');
    try {
      const updated = await endLive(selectedId);
      setSelected(updated);
      setMessage('Stream ended.');
      void loadEvents();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to end stream');
    } finally {
      setEnding(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-events-container">
        <div className="admin-page-header">
          <div>
            <h1 className="admin-page-title">Online</h1>
            <p className="admin-page-desc" style={{ marginBottom: 0 }}>
              Stream online and hybrid events. OBS can push to YouTube — paste your live or embed URL below.
            </p>
          </div>
        </div>

        {error && <div className="admin-form-error">{error}</div>}
        {message && (
          <div className="admin-form-success" style={{ marginBottom: '0.75rem' }}>
            {message}
          </div>
        )}

        {loading ? (
          <p className="admin-input-hint">Loading online events…</p>
        ) : events.length === 0 ? (
          <div className="admin-empty-state">
            No online or hybrid events yet. Create an event and set its type to Online or Hybrid.
          </div>
        ) : (
          <div className="admin-online-layout">
            <section className="admin-section admin-online-picker">
              <h2 className="admin-section-title">Your online events</h2>
              <label className="admin-label" htmlFor="admin-online-event-select">
                Select event
              </label>
              <select
                id="admin-online-event-select"
                className="admin-select"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title}
                    {ev.isLive ? ' • LIVE' : ''} ({ev.eventType})
                  </option>
                ))}
              </select>
              {selected && (
                <p className="admin-input-hint" style={{ marginTop: '0.75rem' }}>
                  Paid attendees: <strong>{selected.paidAttendeeCount ?? 0}</strong>
                  {selected.isLive && selected.liveStartedAt && (
                    <>
                      {' '}
                      · Live since {new Date(selected.liveStartedAt).toLocaleString()}
                    </>
                  )}
                </p>
              )}
            </section>

            {selected && (
              <section className="admin-section admin-online-controls">
                <h2 className="admin-section-title">Stream setup</h2>
                <label className="admin-label" htmlFor="stream-provider">
                  Platform
                </label>
                <select
                  id="stream-provider"
                  className="admin-select"
                  value={streamProvider}
                  onChange={(e) => setStreamProvider(e.target.value)}
                >
                  {STREAM_PROVIDERS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>

                <label className="admin-label" htmlFor="stream-url">
                  Stream URL
                </label>
                <input
                  id="stream-url"
                  type="url"
                  className="admin-input"
                  placeholder="https://www.youtube.com/watch?v=… or embed URL from OBS/YouTube"
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                />
                <p className="admin-input-hint">
                  Use your YouTube live watch URL, Twitch channel, or a direct embed URL. Paid ticket holders receive a
                  private join link by email when you go live.
                </p>

                <div className="admin-online-actions">
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    onClick={() => void handleSave()}
                    disabled={saving || goingLive || ending}
                  >
                    {saving ? 'Saving…' : 'Save settings'}
                  </button>
                  {!selected.isLive ? (
                    <button
                      type="button"
                      className="admin-btn-danger"
                      onClick={() => void handleGoLive()}
                      disabled={goingLive || ending || saving}
                    >
                      {goingLive ? 'Going live…' : 'Go live & email attendees'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="admin-btn-secondary"
                      onClick={() => void handleEndLive()}
                      disabled={ending || goingLive}
                    >
                      {ending ? 'Ending…' : 'End stream'}
                    </button>
                  )}
                </div>

                {selected.isLive && streamUrl && (
                  <div className="admin-online-preview">
                    <p className="admin-label">Preview (admin)</p>
                    <div className="admin-online-preview-frame">
                      <p className="admin-input-hint">
                        Attendees watch via their emailed link — not this admin page.
                      </p>
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOnline;
