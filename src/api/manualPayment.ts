import { apiUrl } from './config';

export type ManualPaymentDetails = {
  accountName: string;
  accountNumber: string;
  bankName: string;
  contactUrl: string;
};

const EMPTY_DETAILS: ManualPaymentDetails = {
  accountName: '',
  accountNumber: '',
  bankName: '',
  contactUrl: '',
};

function normalizeDetails(data: unknown): ManualPaymentDetails {
  if (!data || typeof data !== 'object') return { ...EMPTY_DETAILS };
  const raw = data as Record<string, unknown>;
  return {
    accountName: String(raw.accountName ?? raw.account_name ?? '').trim(),
    accountNumber: String(raw.accountNumber ?? raw.account_number ?? '').trim(),
    bankName: String(raw.bankName ?? raw.bank_name ?? '').trim(),
    contactUrl: String(raw.contactUrl ?? raw.contact_url ?? '').trim(),
  };
}

/** Public bank-transfer details from Ticketing-back env (`MANUAL_PAYMENT_*`). */
export async function fetchManualPaymentDetails(): Promise<ManualPaymentDetails> {
  const res = await fetch(apiUrl('/api/orders/manual-payment-details'));
  if (!res.ok) {
    throw new Error('Could not load payment details');
  }
  const data = await res.json().catch(() => ({}));
  return normalizeDetails(data);
}
