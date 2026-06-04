import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './MerchImageLightbox.css';

const DISMISS_THRESHOLD = 72;

type Props = {
  src: string;
  alt?: string;
  onClose: () => void;
};

const MerchImageLightbox = ({ src, alt = '', onClose }: Props) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const startRef = useRef({ x: 0, y: 0, pointerX: 0, pointerY: 0 });

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const finishDrag = useCallback(
    (dx: number, dy: number) => {
      const dist = Math.hypot(dx, dy);
      if (dist >= DISMISS_THRESHOLD) {
        onClose();
        return;
      }
      setOffset({ x: 0, y: 0 });
    },
    [onClose]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    startRef.current = {
      x: offset.x,
      y: offset.y,
      pointerX: e.clientX,
      pointerY: e.clientY,
    };
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - startRef.current.pointerX;
    const dy = e.clientY - startRef.current.pointerY;
    setOffset({
      x: startRef.current.x + dx,
      y: startRef.current.y + dy,
    });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragging) return;
    setDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    const dx = e.clientX - startRef.current.pointerX;
    const dy = e.clientY - startRef.current.pointerY;
    finishDrag(dx, dy);
  };

  const dragDist = Math.hypot(offset.x, offset.y);
  const backdropOpacity = Math.max(0.35, 1 - dragDist / 280);

  return createPortal(
    <div
      className="merch-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Merch image preview"
      style={{ '--merch-lightbox-backdrop': String(backdropOpacity) } as React.CSSProperties}
      onClick={onClose}
    >
      <button
        type="button"
        className="merch-lightbox-close"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Close image"
      >
        ✕
      </button>
      <div
        className={`merch-lightbox-stage ${dragging ? 'is-dragging' : ''}`}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <img
          src={src}
          alt={alt}
          className="merch-lightbox-img"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${Math.max(0.88, 1 - dragDist / 900)})`,
          }}
          draggable={false}
        />
        <p className="merch-lightbox-hint">Drag to close</p>
      </div>
    </div>,
    document.body
  );
};

export default MerchImageLightbox;
