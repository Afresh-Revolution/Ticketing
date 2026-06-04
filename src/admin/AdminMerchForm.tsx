import { useRef } from 'react';
import { apiUrl } from '../api/config';
import {
  MERCH_TYPE_OPTIONS,
  defaultMerchFormItem,
  type MerchFormItem,
  type MerchTypeOption,
} from '../types/merch';

type Props = {
  items: MerchFormItem[];
  onChange: (items: MerchFormItem[]) => void;
};

const AVAILABILITY_OPTIONS = [
  { value: 'online', label: 'Available Online' },
  { value: 'at_event', label: 'Available at Event' },
  { value: 'both', label: 'Both' },
] as const;

const AdminMerchForm = ({ items, onChange }: Props) => {
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const updateItem = (id: string, patch: Partial<MerchFormItem>) => {
    onChange(items.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  const uploadImage = async (merchId: string, imageId: string, file: File) => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;
    updateItem(merchId, {
      images: items
        .find((m) => m.id === merchId)!
        .images.map((img) =>
          img.id === imageId
            ? { ...img, uploading: true, uploadProgress: 0, uploadError: '' }
            : img
        ),
    });

    try {
      const data = new FormData();
      data.append('image', file);
      const payload = await new Promise<{ imageUrl?: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', apiUrl('/api/events/upload-image'));
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            onChange(
              items.map((m) =>
                m.id !== merchId
                  ? m
                  : {
                      ...m,
                      images: m.images.map((img) =>
                        img.id === imageId ? { ...img, uploadProgress: pct } : img
                      ),
                    }
              )
            );
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.onload = () => {
          const body = xhr.responseText ? JSON.parse(xhr.responseText) : {};
          if (xhr.status >= 200 && xhr.status < 300) resolve(body);
          else reject(new Error(body.error || 'Upload failed'));
        };
        xhr.send(data);
      });
      onChange(
        items.map((m) =>
          m.id !== merchId
            ? m
            : {
                ...m,
                images: m.images.map((img) =>
                  img.id === imageId
                    ? {
                        ...img,
                        imageUrl: payload.imageUrl ?? '',
                        uploading: false,
                        uploadProgress: 100,
                      }
                    : img
                ),
              }
        )
      );
    } catch (e) {
      onChange(
        items.map((m) =>
          m.id !== merchId
            ? m
            : {
                ...m,
                images: m.images.map((img) =>
                  img.id === imageId
                    ? {
                        ...img,
                        uploading: false,
                        uploadError: e instanceof Error ? e.message : 'Upload failed',
                      }
                    : img
                ),
              }
        )
      );
    }
  };

  const toggleType = (merchId: string, type: MerchTypeOption) => {
    const m = items.find((x) => x.id === merchId);
    if (!m) return;
    const next = m.types.includes(type)
      ? m.types.filter((t) => t !== type)
      : [...m.types, type];
    updateItem(merchId, { types: next });
  };

  const addImage = (merchId: string) => {
    const m = items.find((x) => x.id === merchId);
    if (!m || m.images.length >= 5) return;
    updateItem(merchId, {
      images: [
        ...m.images,
        {
          id: crypto.randomUUID(),
          imageUrl: '',
          quantity: '',
          amount: '',
        },
      ],
    });
  };

  return (
    <section className="admin-section admin-merch-section">
      <div className="admin-pools-heading">
        <h2 className="admin-section-title" style={{ margin: 0 }}>
          <span className="admin-section-icon" aria-hidden>👕</span>
          Event Merch
        </h2>
        <button
          type="button"
          className="admin-btn-add-ticket"
          onClick={() => onChange([...items, defaultMerchFormItem()])}
        >
          + Add Merch
        </button>
      </div>
      <p className="admin-input-hint">
        Configure merch for online sale, at-event pickup, or both. Up to 5 images per item.
      </p>

      {items.length === 0 && (
        <p className="admin-input-hint">No merch yet. Click &quot;+ Add Merch&quot; to add items.</p>
      )}

      {items.map((merch, idx) => (
        <div key={merch.id} className="admin-pool-card admin-merch-card">
          <div className="admin-pool-card-header">
            <span className="admin-pool-card-title">Merch #{idx + 1}</span>
            <button
              type="button"
              className="admin-pool-remove"
              onClick={() => onChange(items.filter((m) => m.id !== merch.id))}
            >
              Remove
            </button>
          </div>

          <label className="admin-label">Availability *</label>
          <select
            className="admin-select"
            value={merch.availability}
            onChange={(e) =>
              updateItem(merch.id, {
                availability: e.target.value as MerchFormItem['availability'],
              })
            }
            required
          >
            <option value="">Select availability</option>
            {AVAILABILITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {(merch.availability === 'online' ||
            merch.availability === 'at_event' ||
            merch.availability === 'both') && (
            <>
              <label className="admin-label">Merch type(s) *</label>
              <div className="admin-merch-types">
                {MERCH_TYPE_OPTIONS.map((t) => (
                  <label key={t} className="admin-merch-type-chip">
                    <input
                      type="checkbox"
                      checked={merch.types.includes(t)}
                      onChange={() => toggleType(merch.id, t)}
                    />
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </label>
                ))}
              </div>
              {merch.types.includes('other') && (
                <>
                  <label className="admin-label">Custom type *</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Describe merch type"
                    value={merch.customType}
                    onChange={(e) => updateItem(merch.id, { customType: e.target.value })}
                    required
                  />
                </>
              )}

              <label className="admin-label">Colors & stock</label>
              {merch.colors.map((c) => (
                <div key={c.id} className="admin-merch-color-row">
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Color name"
                    value={c.color}
                    onChange={(e) =>
                      updateItem(merch.id, {
                        colors: merch.colors.map((col) =>
                          col.id === c.id ? { ...col, color: e.target.value } : col
                        ),
                      })
                    }
                  />
                  <input
                    type="number"
                    className="admin-input"
                    placeholder="Qty available"
                    min={0}
                    value={c.quantity}
                    onChange={(e) =>
                      updateItem(merch.id, {
                        colors: merch.colors.map((col) =>
                          col.id === c.id ? { ...col, quantity: e.target.value } : col
                        ),
                      })
                    }
                  />
                  {merch.colors.length > 1 && (
                    <button
                      type="button"
                      className="admin-merch-remove-btn"
                      aria-label="Remove color"
                      title="Remove color"
                      onClick={() =>
                        updateItem(merch.id, {
                          colors: merch.colors.filter((col) => col.id !== c.id),
                        })
                      }
                    >
                      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path
                          d="M6 6l12 12M18 6L6 18"
                          stroke="currentColor"
                          strokeWidth="2.25"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="admin-btn-secondary admin-merch-add-row"
                onClick={() =>
                  updateItem(merch.id, {
                    colors: [
                      ...merch.colors,
                      { id: crypto.randomUUID(), color: '', quantity: '' },
                    ],
                  })
                }
              >
                + Add color
              </button>

              <label className="admin-label">Description *</label>
              <textarea
                className="admin-textarea"
                value={merch.description}
                onChange={(e) => updateItem(merch.id, { description: e.target.value })}
                required
                placeholder="Describe this merch item"
              />

              {(merch.availability === 'online' || merch.availability === 'both') && (
                <>
                  <label className="admin-label admin-merch-checkbox-label">
                    <input
                      type="checkbox"
                      checked={merch.sameAmount}
                      onChange={(e) => updateItem(merch.id, { sameAmount: e.target.checked })}
                    />
                    Same amount for all images?
                  </label>
                  {merch.sameAmount ? (
                    <div className="admin-form-row">
                      <div>
                        <label className="admin-label">Price (₦) *</label>
                        <input
                          type="number"
                          className="admin-input"
                          min={0}
                          value={merch.sharedAmount}
                          onChange={(e) =>
                            updateItem(merch.id, { sharedAmount: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div>
                        <label className="admin-label">Stock per image *</label>
                        <input
                          type="number"
                          className="admin-input"
                          min={0}
                          value={merch.sharedQuantity}
                          onChange={(e) =>
                            updateItem(merch.id, { sharedQuantity: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>
                  ) : null}
                </>
              )}

              <label className="admin-label">Images (max 5)</label>
              {merch.images.map((img) => (
                <div key={img.id} className="admin-merch-image-block">
                  <div className="admin-upload-zone admin-merch-upload-mini">
                    {img.imageUrl ? (
                      <img src={img.imageUrl} alt="" className="admin-merch-thumb" />
                    ) : (
                      <p>Upload image</p>
                    )}
                    <button
                      type="button"
                      className="admin-btn-secondary"
                      disabled={img.uploading}
                      onClick={() => fileRefs.current[`${merch.id}-${img.id}`]?.click()}
                    >
                      {img.uploading ? `${img.uploadProgress ?? 0}%` : 'Upload'}
                    </button>
                    <input
                      ref={(el) => {
                        fileRefs.current[`${merch.id}-${img.id}`] = el;
                      }}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void uploadImage(merch.id, img.id, f);
                        e.target.value = '';
                      }}
                    />
                  </div>
                  {!merch.sameAmount && (merch.availability === 'online' || merch.availability === 'both') && (
                    <div className="admin-form-row">
                      <div>
                        <label className="admin-label">Price (₦)</label>
                        <input
                          type="number"
                          className="admin-input"
                          min={0}
                          value={img.amount}
                          onChange={(e) =>
                            updateItem(merch.id, {
                              images: merch.images.map((i) =>
                                i.id === img.id ? { ...i, amount: e.target.value } : i
                              ),
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="admin-label">Stock</label>
                        <input
                          type="number"
                          className="admin-input"
                          min={0}
                          value={img.quantity}
                          onChange={(e) =>
                            updateItem(merch.id, {
                              images: merch.images.map((i) =>
                                i.id === img.id ? { ...i, quantity: e.target.value } : i
                              ),
                            })
                          }
                        />
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    className="admin-btn-secondary admin-merch-remove-image-btn"
                    onClick={() =>
                      updateItem(merch.id, {
                        images: merch.images.filter((i) => i.id !== img.id),
                      })
                    }
                  >
                    Remove image
                  </button>
                  {img.uploadError && (
                    <p className="admin-input-hint" style={{ color: '#fca5a5' }}>
                      {img.uploadError}
                    </p>
                  )}
                </div>
              ))}
              {merch.images.length < 5 && (
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => addImage(merch.id)}
                >
                  + Add image
                </button>
              )}
            </>
          )}
        </div>
      ))}
    </section>
  );
};

export default AdminMerchForm;
