import type { TicketDiscountTier } from '../utils/ticketDiscounts';

type Props = {
  tiers: TicketDiscountTier[];
  onChange: (tiers: TicketDiscountTier[]) => void;
};

export default function TicketDiscountTierEditor({ tiers, onChange }: Props) {
  const updateTier = (
    index: number,
    field: keyof TicketDiscountTier,
    value: string,
  ) => {
    const parsed = Number(value);
    onChange(
      tiers.map((tier, tierIndex) =>
        tierIndex === index ? { ...tier, [field]: parsed } : tier,
      ),
    );
  };

  return (
    <div className="admin-discount-tiers">
      <div className="admin-pool-card-header">
        <div>
          <span className="admin-pool-card-title">Quantity discounts</span>
          <p className="admin-input-hint">
            The highest eligible tier applies to this ticket type.
          </p>
        </div>
        <button
          type="button"
          className="admin-btn-add-ticket"
          onClick={() =>
            onChange([
              ...tiers,
              {
                minimumQuantity:
                  tiers.length > 0
                    ? Math.max(...tiers.map((tier) => tier.minimumQuantity)) + 1
                    : 2,
                discountPercent:
                  tiers.length > 0
                    ? Math.min(100, Math.max(...tiers.map((tier) => tier.discountPercent)) + 5)
                    : 10,
              },
            ])
          }
        >
          + Add discount
        </button>
      </div>

      {tiers.map((tier, index) => (
        <div className="admin-form-row" key={`${index}-${tier.minimumQuantity}`}>
          <div>
            <label className="admin-label">Buy at least</label>
            <input
              className="admin-input"
              type="number"
              min={2}
              step={1}
              value={Number.isFinite(tier.minimumQuantity) ? tier.minimumQuantity : ''}
              onChange={(event) => updateTier(index, 'minimumQuantity', event.target.value)}
              required
            />
          </div>
          <div>
            <label className="admin-label">Discount (%)</label>
            <input
              className="admin-input"
              type="number"
              min={0.01}
              max={100}
              step={0.01}
              value={Number.isFinite(tier.discountPercent) ? tier.discountPercent : ''}
              onChange={(event) => updateTier(index, 'discountPercent', event.target.value)}
              required
            />
          </div>
          <div>
            <button
              type="button"
              className="admin-pool-remove"
              onClick={() => onChange(tiers.filter((_, tierIndex) => tierIndex !== index))}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
