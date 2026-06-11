import './TicketDeliveryBadge.css';

type TicketDeliveryBadgeProps = {
  deliveryMode: 'in_person' | 'online';
  isLive?: boolean;
};

export function TicketDeliveryBadge({ deliveryMode, isLive = false }: TicketDeliveryBadgeProps) {
  if (deliveryMode !== 'online') return null;

  return (
    <span className={`ticket-delivery-badge ${isLive ? 'ticket-delivery-badge--live' : 'ticket-delivery-badge--online'}`}>
      {isLive ? (
        <>
          <span className="ticket-delivery-badge-dot" aria-hidden />
          Live
        </>
      ) : (
        'Online'
      )}
    </span>
  );
}
