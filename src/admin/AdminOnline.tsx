import { useCallback, useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import {
  endLive,
  fetchStreamableEvents,
  fetchStreamEvent,
  goLive,
  updateStreamConfig,
  type StreamableEvent,
} from '../api/stream';
import { STREAM_PROVIDERS, validateStreamUrl } from '../utils/eventStream';
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
  const [streamUrlError, setStreamUrlError] = useState('');
  const [guideOpen, setGuideOpen] = useState(false);

  const validateCurrentStreamUrl = (required: boolean) => {
    const result = validateStreamUrl(streamUrl, streamProvider, { allowEmpty: !required });
    if (!result.valid) {
      setStreamUrlError(result.error);
      return null;
    }
    setStreamUrlError('');
    return result.url;
  };

  const handleStreamUrlChange = (value: string) => {
    setStreamUrl(value);
    if (!value.trim()) {
      setStreamUrlError('');
      return;
    }
    const result = validateStreamUrl(value, streamProvider, { allowEmpty: true });
    setStreamUrlError(result.valid ? '' : result.error);
  };

  const handleStreamProviderChange = (value: string) => {
    setStreamProvider(value);
    if (streamUrl.trim()) {
      const result = validateStreamUrl(streamUrl, value, { allowEmpty: true });
      setStreamUrlError(result.valid ? '' : result.error);
    }
  };

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
        const provider = event.streamProvider || 'youtube';
        setStreamProvider(provider);
        if (event.streamUrl?.trim()) {
          const result = validateStreamUrl(event.streamUrl, provider, { allowEmpty: true });
          setStreamUrlError(result.valid ? '' : result.error);
        } else {
          setStreamUrlError('');
        }
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
    const safeUrl = validateCurrentStreamUrl(false);
    if (safeUrl === null) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const updated = await updateStreamConfig(selectedId, { streamUrl: safeUrl, streamProvider });
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
    const safeUrl = validateCurrentStreamUrl(true);
    if (safeUrl === null) return;
    setGoingLive(true);
    setError('');
    setMessage('');
    try {
      if (!selected?.streamUrl?.trim()) {
        await updateStreamConfig(selectedId, { streamUrl: safeUrl, streamProvider });
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
                <div className="admin-section-title-row">
                  <h2 className="admin-section-title">Stream setup</h2>
                  <button
                    type="button"
                    className="admin-guide-badge"
                    onClick={() => setGuideOpen(true)}
                    aria-label="Open stream setup guide"
                  >
                    <BookOpen size={14} strokeWidth={2.25} aria-hidden />
                    Guide
                  </button>
                </div>
                <label className="admin-label" htmlFor="stream-provider">
                  Platform
                </label>
                <select
                  id="stream-provider"
                  className="admin-select"
                  value={streamProvider}
                  onChange={(e) => handleStreamProviderChange(e.target.value)}
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
                  onChange={(e) => handleStreamUrlChange(e.target.value)}
                  aria-invalid={Boolean(streamUrlError)}
                  aria-describedby={streamUrlError ? 'stream-url-error' : undefined}
                />
                {streamUrlError ? (
                  <p id="stream-url-error" className="admin-input-hint" style={{ color: '#fca5a5' }}>
                    {streamUrlError}
                  </p>
                ) : (
                  <p className="admin-input-hint">
                    HTTPS links only — YouTube watch/live/embed URLs. Do not paste RTMP ingest links.
                  </p>
                )}

                <div className="admin-online-actions">
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    onClick={() => void handleSave()}
                    disabled={saving || goingLive || ending || Boolean(streamUrlError)}
                  >
                    {saving ? 'Saving…' : 'Save settings'}
                  </button>
                  {!selected.isLive ? (
                    <button
                      type="button"
                      className="admin-btn-danger"
                      onClick={() => void handleGoLive()}
                      disabled={goingLive || ending || saving || Boolean(streamUrlError) || !streamUrl.trim()}
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

      {guideOpen && (
        <div className="admin-modal-overlay" onClick={() => setGuideOpen(false)}>
          <div
            className="admin-modal-container admin-modal-container--stream-guide"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="stream-guide-title"
          >
            <div className="admin-modal-header">
              <h2 className="admin-modal-title" id="stream-guide-title">
                Stream setup guide
              </h2>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setGuideOpen(false)}
                aria-label="Close guide"
              >
                ×
              </button>
            </div>
            <div className="admin-modal-body admin-stream-guide-body">
              <div className="admin-stream-guide-callout">
                Set your YouTube live stream to <strong>Unlisted</strong> so only people with the link can find it on
                YouTube. GateWav ticket holders watch through their private emailed link.
              </div>
              <ol className="admin-stream-guide-steps">
                <li>
                  In YouTube Studio, create or schedule your live stream and set visibility to{' '}
                  <strong>Unlisted</strong>.
                </li>
                <li>
                  In OBS (or your streaming app), use the <strong>RTMP ingest URL</strong> and stream key from YouTube,
                  not in GateWav. Example ingest and Stream key: <code>rtmp://a.rtmp.youtube.com/live2</code> & <code>5fvy-at0h-9ibr-b3vz-e6797</code>.
                </li>
                <li>
                  Start streaming. Once live, open the stream on YouTube and copy the <strong>watch link</strong> (e.g.{' '}
                  <code>https://www.youtube.com/watch?v=…</code> or <code>/live/…</code>).
                </li>
                <li>
                  Paste that watch link into <strong>Stream URL</strong> above, save settings, then click{' '}
                  <strong>Go live &amp; email attendees</strong>.
                </li>
              </ol>
              <p className="admin-modal-muted admin-stream-guide-note">
                Do not paste the RTMP ingest URL into GateWav; browsers cannot play it. Attendees receive a private
                watch link by email when you go live.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOnline;
