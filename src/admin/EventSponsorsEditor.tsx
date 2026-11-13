import { useRef, useState, type ChangeEvent, type Dispatch, type SetStateAction } from 'react';
import { apiUrl } from '../api/config';
import {
  createEventSponsorDraft,
  getEventSponsorUploadError,
  type EventSponsorDraft,
} from './eventSponsorUtils';

type Props = {
  sponsors: EventSponsorDraft[];
  onChange: Dispatch<SetStateAction<EventSponsorDraft[]>>;
  onUploadingChange: (uploading: boolean) => void;
  disabled?: boolean;
};

export default function EventSponsorsEditor({
  sponsors,
  onChange,
  onUploadingChange,
  disabled = false,
}: Props) {
  const [uploadingKey, setUploadingKey] = useState('');
  const [error, setError] = useState('');
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const uploadLogo = async (key: string, file: File) => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setError('You must be logged in to upload a sponsor logo.');
      return;
    }

    setError('');
    setUploadingKey(key);
    onUploadingChange(true);
    try {
      const body = new FormData();
      body.append('image', file);
      const response = await fetch(apiUrl('/api/events/upload-image'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(getEventSponsorUploadError(data) || 'Sponsor logo upload failed.');
      }
      const imageUrl =
        data && typeof data === 'object' && 'imageUrl' in data && typeof data.imageUrl === 'string'
          ? data.imageUrl
          : '';
      if (!imageUrl) throw new Error('Sponsor logo upload failed.');
      onChange((current) =>
        current.map((sponsor) => (sponsor.key === key ? { ...sponsor, imageUrl } : sponsor))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sponsor logo upload failed.');
    } finally {
      setUploadingKey('');
      onUploadingChange(false);
    }
  };

  const handleFileChange = (key: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (file) void uploadLogo(key, file);
    event.currentTarget.value = '';
  };

  return (
    <section className="admin-section" aria-labelledby="event-sponsors-heading">
      <h2 id="event-sponsors-heading" className="admin-section-title">Sponsors</h2>
      <p className="admin-input-hint">
        Optional. Add up to 8 sponsor names and logos. Attendees will see them on the event page.
      </p>
      {sponsors.map((sponsor, index) => (
        <div key={sponsor.key} className="admin-pool-card">
          <label className="admin-label" htmlFor={`${sponsor.key}-name`}>Sponsor name</label>
          <input
            id={`${sponsor.key}-name`}
            className="admin-input"
            value={sponsor.name}
            maxLength={100}
            onChange={(event) =>
              onChange((current) =>
                current.map((item) =>
                  item.key === sponsor.key ? { ...item, name: event.target.value } : item
                )
              )
            }
            placeholder="Brand or partner"
            disabled={disabled || Boolean(uploadingKey)}
          />
          <input
            ref={(element) => { inputRefs.current[sponsor.key] = element; }}
            type="file"
            accept="image/*"
            hidden
            disabled={disabled || Boolean(uploadingKey)}
            onChange={(event) => handleFileChange(sponsor.key, event)}
          />
          {sponsor.imageUrl ? (
            <div className="admin-event-images-grid">
              <div className="admin-event-image-thumb">
                <img src={sponsor.imageUrl} alt={`${sponsor.name || 'Sponsor'} logo`} />
                <button
                  type="button"
                  className="admin-event-image-remove"
                  aria-label={`Remove ${sponsor.name || `sponsor ${index + 1}`} logo`}
                  disabled={disabled || Boolean(uploadingKey)}
                  onClick={() => onChange((current) =>
                    current.map((item) =>
                      item.key === sponsor.key ? { ...item, imageUrl: '' } : item
                    )
                  )}
                >
                  ✕
                </button>
              </div>
            </div>
          ) : null}
          <div className="admin-form-actions">
            <button
              type="button"
              className="admin-btn-secondary"
              disabled={disabled || Boolean(uploadingKey)}
              onClick={() => inputRefs.current[sponsor.key]?.click()}
            >
              {uploadingKey === sponsor.key ? 'Uploading logo…' : sponsor.imageUrl ? 'Replace logo' : 'Add logo'}
            </button>
            <button
              type="button"
              className="admin-btn-danger"
              disabled={disabled || Boolean(uploadingKey)}
              onClick={() => onChange((current) => current.filter((item) => item.key !== sponsor.key))}
            >
              Remove sponsor
            </button>
          </div>
        </div>
      ))}
      {sponsors.length < 8 ? (
        <button
          type="button"
          className="admin-btn-secondary"
          disabled={disabled || Boolean(uploadingKey)}
          onClick={() => onChange((current) => [...current, createEventSponsorDraft()])}
        >
          Add sponsor
        </button>
      ) : null}
      {error ? <p className="admin-input-hint" role="alert" style={{ color: '#fca5a5' }}>{error}</p> : null}
    </section>
  );
}
