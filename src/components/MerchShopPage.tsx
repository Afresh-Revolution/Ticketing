import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import { fetchEventMerch } from '../api/merch';
import {
  type EventMerchDto,
  merchForChannel,
  type MerchCartLine,
} from '../types/merch';
import MerchImageLightbox from './MerchImageLightbox';
import './MerchShopPage.css';

type CartMap = Record<string, number>;

function formatNaira(amount: number): string {
  return `₦${Math.max(0, Number(amount) || 0).toLocaleString('en-NG')}`;
}

const MerchShopPage = () => {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const eventTitle = (location.state as { eventTitle?: string })?.eventTitle ?? 'Event';
  const filter = (location.state as { filter?: 'online' | 'at_event' })?.filter ?? 'online';

  const [merch, setMerch] = useState<EventMerchDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartMap>({});
  const [selectedColor, setSelectedColor] = useState<Record<string, string>>({});
  const [selectedType, setSelectedType] = useState<Record<string, string>>({});
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    fetchEventMerch(eventId)
      .then((list) => setMerch(merchForChannel(list, filter === 'at_event' ? 'at_event' : 'online')))
      .finally(() => setLoading(false));
  }, [eventId, filter]);

  const lines = useMemo(() => {
    const result: MerchCartLine[] = [];
    for (const m of merch) {
      for (const img of m.images) {
        const key = `${m.id}:${img.id}`;
        const qty = cart[key] ?? 0;
        if (qty <= 0) continue;
        const unitPrice =
          m.sameAmount && m.unitPrice != null ? m.unitPrice : img.unitPrice ?? m.unitPrice ?? 0;
        result.push({
          merchId: m.id,
          imageId: img.id,
          typeName: selectedType[m.id] || m.types[0] || 'Merch',
          colorName: selectedColor[m.id] || m.colors[0]?.colorName || '',
          quantity: qty,
          unitPrice,
          imageUrl: img.imageUrl,
          description: m.description,
        });
      }
    }
    return result;
  }, [merch, cart, selectedColor, selectedType]);

  const total = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);

  const setQty = (merchId: string, imageId: string, delta: number, max: number) => {
    const key = `${merchId}:${imageId}`;
    setCart((prev) => {
      const next = Math.min(max, Math.max(0, (prev[key] ?? 0) + delta));
      return { ...prev, [key]: next };
    });
  };

  if (loading) {
    return (
      <div className="merch-shop-page">
        <Navbar />
        <div className="merch-shop-loading">Loading merch…</div>
      </div>
    );
  }

  return (
    <div className="merch-shop-page">
      {lightboxSrc && (
        <MerchImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}
      <Navbar />
      <main className="merch-shop-main">
        <button type="button" className="merch-shop-back" onClick={() => navigate(`/event/${eventId}`)}>
          ← Back to event
        </button>
        <h1 className="merch-shop-title">{eventTitle} — Merch</h1>

        {merch.length === 0 ? (
          <p>No online merch available.</p>
        ) : (
          <div className="merch-shop-grid">
            {merch.map((m) => (
              <article key={m.id} className="merch-shop-item">
                <p className="merch-shop-desc">{m.description}</p>
                {m.types.length > 0 && (
                  <label className="merch-shop-label">
                    Type
                    <select
                      value={selectedType[m.id] ?? m.types[0]}
                      onChange={(e) =>
                        setSelectedType((prev) => ({ ...prev, [m.id]: e.target.value }))
                      }
                    >
                      {m.types.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {m.colors.length > 0 && (
                  <label className="merch-shop-label">
                    Color
                    <select
                      value={selectedColor[m.id] ?? m.colors[0]?.colorName ?? ''}
                      onChange={(e) =>
                        setSelectedColor((prev) => ({ ...prev, [m.id]: e.target.value }))
                      }
                    >
                      {m.colors.map((c) => (
                        <option key={c.id} value={c.colorName}>
                          {c.colorName} ({c.quantityAvailable} avail.)
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <div className="merch-shop-images">
                  {m.images.map((img) => {
                    const price =
                      m.sameAmount && m.unitPrice != null
                        ? m.unitPrice
                        : img.unitPrice ?? 0;
                    const key = `${m.id}:${img.id}`;
                    const qty = cart[key] ?? 0;
                    const soldOut = img.quantityAvailable <= 0;
                    return (
                      <div
                        key={img.id}
                        className={`merch-shop-variant ${soldOut ? 'merch-shop-variant-sold-out' : ''}`}
                      >
                        <div className="merch-shop-variant-media">
                          <button
                            type="button"
                            className="merch-shop-image-open"
                            onClick={() => setLightboxSrc(img.imageUrl)}
                            aria-label="View merch image full screen"
                          >
                            <img src={img.imageUrl} alt="" />
                          </button>
                          {soldOut && <span className="merch-shop-sold-badge">Sold out</span>}
                        </div>
                        <div className="merch-shop-variant-body">
                          <p className="merch-shop-variant-price">{formatNaira(price)}</p>
                          <p className="merch-shop-variant-stock">
                            {img.quantityAvailable} in stock
                          </p>
                          <div className="merch-shop-qty" role="group" aria-label="Quantity">
                            <button
                              type="button"
                              className="merch-shop-qty-btn"
                              onClick={() => setQty(m.id, img.id, -1, img.quantityAvailable)}
                              disabled={qty === 0 || soldOut}
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>
                            <span className="merch-shop-qty-value" aria-live="polite">
                              {qty}
                            </span>
                            <button
                              type="button"
                              className="merch-shop-qty-btn"
                              onClick={() => setQty(m.id, img.id, 1, img.quantityAvailable)}
                              disabled={qty >= img.quantityAvailable || soldOut}
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="merch-shop-footer">
          <span className="merch-shop-total">{formatNaira(total)}</span>
          <button
            type="button"
            className="merch-shop-checkout-btn"
            disabled={lines.length === 0}
            onClick={() =>
              navigate(`/event/${eventId}/merch/checkout`, {
                state: { eventTitle, lines, total },
              })
            }
          >
            Checkout
          </button>
        </div>
      </main>
    </div>
  );
};

export default MerchShopPage;
