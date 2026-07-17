export type TicketDiscountTier = {
  minimumQuantity: number;
  discountPercent: number;
};

export type TicketDiscountTierInput = {
  minimumQuantity?: number | string | null;
  discountPercent?: number | string | null;
};

export function normalizeDiscountTiers(
  tiers: TicketDiscountTierInput[] | null | undefined,
): TicketDiscountTier[] {
  if (!Array.isArray(tiers)) return [];

  return tiers
    .map((tier) => ({
      minimumQuantity: Math.trunc(Number(tier.minimumQuantity)),
      discountPercent: Number(tier.discountPercent),
    }))
    .filter(
      (tier) =>
        Number.isFinite(tier.minimumQuantity) &&
        tier.minimumQuantity >= 2 &&
        Number.isFinite(tier.discountPercent) &&
        tier.discountPercent > 0 &&
        tier.discountPercent <= 100,
    )
    .sort((a, b) => a.minimumQuantity - b.minimumQuantity);
}

export function validateDiscountTiers(
  tiers: TicketDiscountTierInput[] | null | undefined,
): string | null {
  if (!tiers?.length) return null;
  const quantities = new Set<number>();
  let previousPercent = 0;
  const sortedTiers = tiers
    .map((tier) => ({
      minimumQuantity: Number(tier.minimumQuantity),
      discountPercent: Number(tier.discountPercent),
    }))
    .sort((a, b) => a.minimumQuantity - b.minimumQuantity);

  for (const tier of sortedTiers) {
    const { minimumQuantity, discountPercent } = tier;
    if (!Number.isInteger(minimumQuantity) || minimumQuantity < 2) {
      return "Discount minimum quantity must be a whole number of at least 2.";
    }
    if (!Number.isFinite(discountPercent) || discountPercent <= 0 || discountPercent > 100) {
      return "Discount percentage must be greater than 0 and no more than 100.";
    }
    if (quantities.has(minimumQuantity)) {
      return `Only one discount can use a minimum quantity of ${minimumQuantity}.`;
    }
    if (discountPercent <= previousPercent) {
      return "Discount percentages must increase as the minimum quantity increases.";
    }
    quantities.add(minimumQuantity);
    previousPercent = discountPercent;
  }
  return null;
}

export function getApplicableDiscountTier(
  quantity: number,
  tiers: TicketDiscountTierInput[] | null | undefined,
): TicketDiscountTier | null {
  const normalized = normalizeDiscountTiers(tiers);
  let applicable: TicketDiscountTier | null = null;
  for (const tier of normalized) {
    if (quantity < tier.minimumQuantity) break;
    applicable = tier;
  }
  return applicable;
}

export function calculateTicketLinePrice(
  unitPrice: number,
  quantity: number,
  tiers: TicketDiscountTierInput[] | null | undefined,
) {
  const originalAmount = Math.max(0, unitPrice) * Math.max(0, quantity);
  const tier = getApplicableDiscountTier(quantity, tiers);
  const discountAmount = tier
    ? Math.round((originalAmount * tier.discountPercent) / 100)
    : 0;
  return {
    originalAmount,
    discountAmount,
    finalAmount: Math.max(0, originalAmount - discountAmount),
    appliedTier: tier,
  };
}
