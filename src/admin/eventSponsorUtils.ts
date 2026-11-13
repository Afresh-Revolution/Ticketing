export type EventSponsorDraft = {
  key: string;
  name: string;
  imageUrl: string;
};

let sponsorKeySequence = 0;

function createSponsorDraft(name = '', imageUrl = ''): EventSponsorDraft {
  sponsorKeySequence += 1;
  return {
    key: `sponsor-${Date.now()}-${sponsorKeySequence}`,
    name,
    imageUrl,
  };
}

export function parseEventSponsorDrafts(value: unknown): EventSponsorDraft[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 8).flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const sponsor = item as { name?: unknown; imageUrl?: unknown };
    const name = typeof sponsor.name === 'string' ? sponsor.name : '';
    const imageUrl = typeof sponsor.imageUrl === 'string' ? sponsor.imageUrl : '';
    return name || imageUrl ? [createSponsorDraft(name, imageUrl)] : [];
  });
}

export function createEventSponsorDraft(): EventSponsorDraft {
  return createSponsorDraft();
}

export function eventSponsorsToPayload(sponsors: EventSponsorDraft[]) {
  return sponsors
    .filter((sponsor) => sponsor.name.trim())
    .map((sponsor) => ({
      name: sponsor.name.trim(),
      imageUrl: sponsor.imageUrl || null,
    }));
}

export function getEventSponsorFormError(sponsors: EventSponsorDraft[]): string | null {
  if (sponsors.some((sponsor) => sponsor.imageUrl && !sponsor.name.trim())) {
    return 'Add a name for each sponsor with a logo.';
  }
  return null;
}

export function getEventSponsorUploadError(data: unknown): string | undefined {
  if (!data || typeof data !== 'object' || !('error' in data)) return undefined;
  return typeof data.error === 'string' && data.error.trim() ? data.error : undefined;
}
