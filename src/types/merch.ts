export type MerchAvailability = 'online' | 'at_event' | 'both';

export const MERCH_TYPE_OPTIONS = [
  'shirts',
  'mugs',
  'caps',
  'jugs',
  'flasks',
  'laptops',
  'phones',
  'other',
] as const;

export type MerchTypeOption = (typeof MERCH_TYPE_OPTIONS)[number];

export type MerchColorInput = {
  id: string;
  color: string;
  quantity: string;
};

export type MerchImageInput = {
  id: string;
  imageUrl: string;
  quantity: string;
  amount: string;
  uploading?: boolean;
  uploadProgress?: number;
  uploadError?: string;
};

export type MerchFormItem = {
  id: string;
  availability: MerchAvailability | '';
  types: MerchTypeOption[];
  customType: string;
  colors: MerchColorInput[];
  description: string;
  sameAmount: boolean;
  sharedAmount: string;
  sharedQuantity: string;
  images: MerchImageInput[];
};

export type MerchColorDto = {
  id: string;
  colorName: string;
  quantityAvailable: number;
};

export type MerchImageDto = {
  id: string;
  imageUrl: string;
  quantityAvailable: number;
  unitPrice: number | null;
  sortOrder: number;
};

export type EventMerchDto = {
  id: string;
  eventId: string;
  availability: MerchAvailability;
  description: string;
  types: string[];
  customType: string | null;
  sameAmount: boolean;
  unitPrice: number | null;
  colors: MerchColorDto[];
  images: MerchImageDto[];
};

export type MerchCartLine = {
  merchId: string;
  imageId: string;
  typeName: string;
  colorName: string;
  quantity: number;
  unitPrice: number;
  imageUrl: string;
  description: string;
};

export const defaultMerchFormItem = (): MerchFormItem => ({
  id: crypto.randomUUID(),
  availability: '',
  types: [],
  customType: '',
  colors: [{ id: crypto.randomUUID(), color: '', quantity: '' }],
  description: '',
  sameAmount: true,
  sharedAmount: '',
  sharedQuantity: '',
  images: [],
});

export function merchFormToPayload(items: MerchFormItem[]) {
  return items
    .filter((m) => m.availability)
    .map((m, index) => ({
      availability: m.availability,
      description: m.description.trim(),
      types: m.types.map((t) => (t === 'other' && m.customType.trim() ? m.customType.trim() : t)),
      customType: m.types.includes('other') ? m.customType.trim() || null : null,
      sameAmount: m.sameAmount,
      unitPrice: m.sameAmount ? parseFloat(m.sharedAmount) || 0 : null,
      sortOrder: index,
      colors: m.colors
        .filter((c) => c.color.trim())
        .map((c) => ({
          colorName: c.color.trim(),
          quantityAvailable: parseInt(c.quantity, 10) || 0,
        })),
      images: m.images
        .filter((img) => img.imageUrl)
        .slice(0, 5)
        .map((img, i) => ({
          imageUrl: img.imageUrl,
          quantityAvailable: parseInt(
            m.sameAmount ? m.sharedQuantity : img.quantity,
            10
          ) || 0,
          unitPrice: m.sameAmount ? null : parseFloat(img.amount) || 0,
          sortOrder: i,
        })),
    }));
}

export function normalizeEventMerch(raw: unknown): EventMerchDto[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((m: Record<string, unknown>) => ({
    id: String(m.id ?? ''),
    eventId: String(m.eventId ?? m.event_id ?? ''),
    availability: (m.availability as MerchAvailability) ?? 'online',
    description: String(m.description ?? ''),
    types: Array.isArray(m.types) ? m.types.map(String) : [],
    customType: m.customType != null ? String(m.customType) : m.custom_type != null ? String(m.custom_type) : null,
    sameAmount: Boolean(m.sameAmount ?? m.same_amount ?? true),
    unitPrice:
      m.unitPrice != null
        ? Number(m.unitPrice)
        : m.unit_price != null
          ? Number(m.unit_price)
          : null,
    colors: (Array.isArray(m.colors) ? m.colors : []).map((c: Record<string, unknown>) => ({
      id: String(c.id ?? ''),
      colorName: String(c.colorName ?? c.color_name ?? ''),
      quantityAvailable: Number(c.quantityAvailable ?? c.quantity_available ?? 0),
    })),
    images: (Array.isArray(m.images) ? m.images : []).map((img: Record<string, unknown>, i: number) => ({
      id: String(img.id ?? ''),
      imageUrl: String(img.imageUrl ?? img.image_url ?? ''),
      quantityAvailable: Number(img.quantityAvailable ?? img.quantity_available ?? 0),
      unitPrice:
        img.unitPrice != null
          ? Number(img.unitPrice)
          : img.unit_price != null
            ? Number(img.unit_price)
            : null,
      sortOrder: Number(img.sortOrder ?? img.sort_order ?? i),
    })),
  }));
}

export function getMerchDisplayPrice(merch: EventMerchDto): number {
  if (merch.sameAmount && merch.unitPrice != null) return merch.unitPrice;
  const prices = merch.images
    .map((img) => img.unitPrice)
    .filter((p): p is number => p != null && p > 0);
  if (prices.length === 0) return 0;
  return Math.min(...prices);
}

export function merchDtoToFormItem(dto: EventMerchDto): MerchFormItem {
  const types = dto.types.filter((t) =>
    MERCH_TYPE_OPTIONS.includes(t as MerchTypeOption)
  ) as MerchTypeOption[];
  const hasOther = dto.types.some(
    (t) => !MERCH_TYPE_OPTIONS.includes(t as MerchTypeOption)
  );
  return {
    id: dto.id || crypto.randomUUID(),
    availability: dto.availability,
    types: hasOther ? [...types.filter((t) => t !== 'other'), 'other'] : types,
    customType: dto.customType || (hasOther ? dto.types.find((t) => !MERCH_TYPE_OPTIONS.includes(t as MerchTypeOption)) || '' : ''),
    colors:
      dto.colors.length > 0
        ? dto.colors.map((c) => ({
            id: c.id || crypto.randomUUID(),
            color: c.colorName,
            quantity: String(c.quantityAvailable),
          }))
        : [{ id: crypto.randomUUID(), color: '', quantity: '' }],
    description: dto.description,
    sameAmount: dto.sameAmount,
    sharedAmount: dto.unitPrice != null ? String(dto.unitPrice) : '',
    sharedQuantity:
      dto.images[0] != null ? String(dto.images[0].quantityAvailable) : '',
    images: dto.images.map((img) => ({
      id: img.id || crypto.randomUUID(),
      imageUrl: img.imageUrl,
      quantity: String(img.quantityAvailable),
      amount: img.unitPrice != null ? String(img.unitPrice) : '',
    })),
  };
}

export function merchForChannel(
  items: EventMerchDto[],
  channel: 'online' | 'at_event'
): EventMerchDto[] {
  return items.filter(
    (m) =>
      m.availability === channel ||
      m.availability === 'both'
  );
}
