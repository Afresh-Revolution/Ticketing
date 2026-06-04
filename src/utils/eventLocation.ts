export const NIGERIAN_STATES = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'FCT',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
] as const;

export type NigerianState = (typeof NIGERIAN_STATES)[number];

const STATE_ALIASES: Record<string, NigerianState> = {
  la: 'Lagos',
  lag: 'Lagos',
  fct: 'FCT',
  abuja: 'FCT',
  'federal capital territory': 'FCT',
  ph: 'Rivers',
  'port harcourt': 'Rivers',
  'cross-river': 'Cross River',
  'akwa-ibom': 'Akwa Ibom',
};

const CITY_TO_STATE: Record<string, NigerianState> = {
  lagos: 'Lagos',
  jos: 'Plateau',
  abuja: 'FCT',
  'port harcourt': 'Rivers',
  kano: 'Kano',
  ibadan: 'Oyo',
  enugu: 'Enugu',
  benin: 'Edo',
  calabar: 'Cross River',
  uyo: 'Akwa Ibom',
  abeokuta: 'Ogun',
  kaduna: 'Kaduna',
  maiduguri: 'Borno',
  'victoria island': 'Lagos',
  vi: 'Lagos',
  lekki: 'Lagos',
  ikeja: 'Lagos',
};

export function normalizeState(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const alias = STATE_ALIASES[trimmed.toLowerCase()];
  if (alias) return alias;

  const match = NIGERIAN_STATES.find((s) => s.toLowerCase() === trimmed.toLowerCase());
  return match ?? trimmed;
}

export function resolveEventState(data: {
  state?: string | null;
  city?: string | null;
  location?: string | null;
  venue?: string | null;
}): string {
  if (typeof data.state === 'string' && data.state.trim()) {
    return normalizeState(data.state);
  }

  const city = typeof data.city === 'string' ? data.city.trim() : '';
  if (city) {
    const fromCityField = CITY_TO_STATE[city.toLowerCase()];
    if (fromCityField) return fromCityField;
  }

  const location = (data.location || data.venue || '').trim();
  if (!location) return '';

  const parts = location.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 3) {
    const last = parts[parts.length - 1];
    if (city && last.toLowerCase() === city.toLowerCase()) {
      return normalizeState(parts[parts.length - 2]);
    }
    if (parts.length === 3) {
      return normalizeState(parts[1]);
    }
  }

  const lastPart = parts[parts.length - 1];
  if (lastPart) {
    const fromLastPart = CITY_TO_STATE[lastPart.toLowerCase()];
    if (fromLastPart) return fromLastPart;

    const asState = normalizeState(lastPart);
    if (NIGERIAN_STATES.some((s) => s.toLowerCase() === asState.toLowerCase())) {
      return asState;
    }
  }

  return '';
}

export function eventMatchesState(eventState: string, selectedState: string): boolean {
  if (!selectedState || selectedState === 'All') return true;
  if (!eventState) return false;
  return eventState.toLowerCase() === selectedState.toLowerCase();
}
