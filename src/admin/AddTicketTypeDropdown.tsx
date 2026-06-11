import { useEffect, useRef, useState } from 'react';
import type { DeliveryMode, EventFormat } from '../utils/eventStream';

const HYBRID_OPTIONS: { value: DeliveryMode; label: string }[] = [
  { value: 'in_person', label: 'In person' },
  { value: 'online', label: 'Online' },
];

type AddTicketTypeControlProps = {
  eventFormat: EventFormat;
  onAdd: (deliveryMode: DeliveryMode) => void;
};

function AddTicketTypeDropdown({ onAdd }: { onAdd: (deliveryMode: DeliveryMode) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleSelect = (deliveryMode: DeliveryMode) => {
    onAdd(deliveryMode);
    setOpen(false);
  };

  return (
    <div className="admin-add-ticket-dropdown" ref={rootRef}>
      <button
        type="button"
        className="admin-btn-add-ticket admin-add-ticket-dropdown-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((prev) => !prev)}
      >
        + Add Ticket Type
        <span className="admin-add-ticket-dropdown-chevron" aria-hidden>
          ▾
        </span>
      </button>
      {open && (
        <div className="admin-add-ticket-dropdown-menu" role="menu">
          {HYBRID_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="menuitem"
              className="admin-add-ticket-dropdown-item"
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Hybrid events: dropdown to pick access. Other formats: single add button. */
export function AddTicketTypeControl({ eventFormat, onAdd }: AddTicketTypeControlProps) {
  if (eventFormat === 'hybrid') {
    return <AddTicketTypeDropdown onAdd={onAdd} />;
  }

  const deliveryMode: DeliveryMode = eventFormat === 'online' ? 'online' : 'in_person';
  return (
    <button
      type="button"
      className="admin-btn-add-ticket"
      onClick={() => onAdd(deliveryMode)}
    >
      + Add Ticket Type
    </button>
  );
}
