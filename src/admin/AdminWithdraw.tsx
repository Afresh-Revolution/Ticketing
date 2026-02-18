import { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '../api/config';
import './admin.css';

// ─── Types ───────────────────────────────────────────────────────────────────

interface EventRow {
  id: string;
  title: string;
  date: string;
  imageUrl: string | null;
  createdBy: string | null;
  gross_revenue: number;
  withdrawal_status: string | null;
  withdrawn_net: number | null;
  withdrawn_at: string | null;
}

interface WithdrawalRow {
  id: string;
  eventId: string;
  adminId: string;
  grossAmount: number;
  platformFee: number;
  netAmount: number;
  status: string;
  paystackReference: string | null;
  createdAt: string;
  event_title: string;
  admin_name: string | null;
  admin_email: string | null;
}

interface BankAccount {
  id: string;
  accountName: string;
  accountNumber: string;
  bankCode: string;
  bankName: string;
}

interface KPI {
  totalGross: number;
  availableToWithdraw: number;
  totalFees: number;
  membershipRevenue: number;
}

interface PageData {
  kpi: KPI;
  events: EventRow[];
  withdrawals: WithdrawalRow[];
  bankAccount: BankAccount | null;
  isSuperAdmin: boolean;
}

interface Bank {
  name: string;
  code: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  `₦${Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

function isEligible(event: EventRow): boolean {
  const eventDay = new Date(event.date);
  eventDay.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return eventDay <= today;
}

// ─── Bank Setup Modal ─────────────────────────────────────────────────────────

interface BankModalProps {
  onClose: () => void;
  onSaved: (ba: BankAccount) => void;
}

const BankSetupModal = ({ onClose, onSaved }: BankModalProps) => {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankCode, setBankCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    fetch(apiUrl('/api/admin/banks'), { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setBanks(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const handleBankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = banks.find((b) => b.code === e.target.value);
    setBankCode(e.target.value);
    setBankName(selected?.name || '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!bankCode || !accountNumber || !accountName) {
      setError('All fields are required');
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiUrl('/api/admin/bank-account'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ accountNumber, bankCode, accountName, bankName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save bank account');
      onSaved(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h2 className="admin-modal-title">Set Up Bank Account</h2>
          <button type="button" className="admin-modal-close" onClick={onClose}>×</button>
        </div>
        <form className="admin-modal-form" onSubmit={handleSubmit}>
          {error && <div className="admin-form-error">{error}</div>}

          <label className="admin-label">Bank</label>
          <select className="admin-select" value={bankCode} onChange={handleBankChange} required>
            <option value="">Select a bank…</option>
            {banks.map((b) => (
              <option key={b.code} value={b.code}>{b.name}</option>
            ))}
          </select>

          <label className="admin-label">Account Number</label>
          <input
            className="admin-input"
            type="text"
            maxLength={10}
            placeholder="0123456789"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
            required
          />

          <label className="admin-label">Account Name</label>
          <input
            className="admin-input"
            type="text"
            placeholder="As it appears on your bank account"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            required
          />

          <div className="admin-form-actions">
            <button type="button" className="admin-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="admin-btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Bank Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Event Card ───────────────────────────────────────────────────────────────

interface EventCardProps {
  event: EventRow;
  hasBankAccount: boolean;
  isSuperAdmin: boolean;
  onWithdraw: (eventId: string) => void;
  withdrawing: string | null;
}

const EventCard = ({ event, hasBankAccount, isSuperAdmin, onWithdraw, withdrawing }: EventCardProps) => {
  const eligible = isEligible(event);
  const alreadyWithdrawn = event.withdrawal_status === 'completed';
  const hasRevenue = Number(event.gross_revenue) > 0;
  const canWithdraw = eligible && !alreadyWithdrawn && hasRevenue && (isSuperAdmin || hasBankAccount);
  const isLoading = withdrawing === event.id;

  let statusChip: { label: string; cls: string };
  if (alreadyWithdrawn) statusChip = { label: '✓ Withdrawn', cls: 'chip-withdrawn' };
  else if (!eligible) statusChip = { label: '⏳ Not Yet', cls: 'chip-pending' };
  else if (!hasRevenue) statusChip = { label: 'No Revenue', cls: 'chip-pending' };
  else statusChip = { label: 'Eligible', cls: 'chip-eligible' };

  return (
    <div className="withdraw-event-card">
      <div className="withdraw-event-img">
        {event.imageUrl
          ? <img src={event.imageUrl} alt={event.title} />
          : <div className="withdraw-event-img-placeholder">🎟</div>}
      </div>
      <div className="withdraw-event-body">
        <div className="withdraw-event-header">
          <h3 className="withdraw-event-title">{event.title}</h3>
          <span className={`withdraw-chip ${statusChip.cls}`}>{statusChip.label}</span>
        </div>
        <p className="withdraw-event-date">{fmtDate(event.date)}</p>
        <div className="withdraw-event-revenue">
          <span className="withdraw-revenue-label">Total Revenue</span>
          <span className="withdraw-revenue-value">{fmt(event.gross_revenue)}</span>
        </div>
        {alreadyWithdrawn && event.withdrawn_net && (
          <div className="withdraw-event-revenue" style={{ marginTop: '0.25rem' }}>
            <span className="withdraw-revenue-label">Net Paid Out</span>
            <span className="withdraw-revenue-value" style={{ color: '#22c55e' }}>{fmt(event.withdrawn_net)}</span>
          </div>
        )}
        <button
          type="button"
          className={`withdraw-btn ${canWithdraw ? 'withdraw-btn-active' : 'withdraw-btn-disabled'}`}
          disabled={!canWithdraw || isLoading}
          onClick={() => canWithdraw && onWithdraw(event.id)}
          title={
            !eligible ? 'Available on or after the event date'
            : !hasRevenue ? 'No paid ticket revenue'
            : alreadyWithdrawn ? 'Already withdrawn'
            : !hasBankAccount && !isSuperAdmin ? 'Set up your bank account first'
            : 'Withdraw funds'
          }
        >
          {isLoading ? 'Processing…' : alreadyWithdrawn ? 'Withdrawn' : 'Withdraw'}
        </button>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const AdminWithdraw = () => {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'events' | 'history'>('events');
  const [showBankModal, setShowBankModal] = useState(false);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiUrl('/api/admin/withdraw'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load withdraw data');
      setData(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleWithdraw = async (eventId: string) => {
    setWithdrawing(eventId);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiUrl(`/api/admin/withdraw/${eventId}`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Withdrawal failed');
      showToast(`Withdrawal successful! Net: ${fmt(json.withdrawal.net)}`, 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setWithdrawing(null);
    }
  };

  const handleBankSaved = (ba: BankAccount) => {
    setShowBankModal(false);
    setData((prev) => prev ? { ...prev, bankAccount: ba } : prev);
    showToast('Bank account saved!', 'success');
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-empty-state">Loading withdraw data…</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="admin-page">
        <div className="admin-empty-state" style={{ color: '#f87171' }}>{error || 'No data'}</div>
      </div>
    );
  }

  const { kpi, events, withdrawals, bankAccount, isSuperAdmin } = data;

  return (
    <div className="admin-page">
      {/* Toast */}
      {toast && (
        <div className={`withdraw-toast ${toast.type === 'success' ? 'withdraw-toast-success' : 'withdraw-toast-error'}`}>
          {toast.msg}
        </div>
      )}

      {/* Page header */}
      <div className="admin-page-header">
        <h1 className="admin-page-title">Withdraw</h1>
        {!isSuperAdmin && (
          <button
            type="button"
            className={`admin-btn-primary ${bankAccount ? 'withdraw-bank-btn-saved' : ''}`}
            onClick={() => setShowBankModal(true)}
          >
            {bankAccount ? `🏦 ${bankAccount.bankName} ···${bankAccount.accountNumber.slice(-4)}` : '+ Set Up Bank Account'}
          </button>
        )}
      </div>

      {/* Bank account missing banner */}
      {!isSuperAdmin && !bankAccount && (
        <div className="withdraw-bank-banner">
          <span>⚠️ Set up your bank account to enable withdrawals.</span>
          <button type="button" className="admin-btn-primary" onClick={() => setShowBankModal(true)}>
            Set Up Now
          </button>
        </div>
      )}

      {/* KPI cards */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <div className="admin-kpi-icon" style={{ background: '#1e3a5f', color: '#93c5fd' }}>₦</div>
          <div className="admin-kpi-content">
            <span className="admin-kpi-label">Total Ticket Revenue</span>
            <span className="admin-kpi-value">{fmt(kpi.totalGross)}</span>
          </div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-icon" style={{ background: '#166534', color: '#86efac' }}>↑</div>
          <div className="admin-kpi-content">
            <span className="admin-kpi-label">Available to Withdraw</span>
            <span className="admin-kpi-value">{fmt(kpi.availableToWithdraw)}</span>
            {!isSuperAdmin && (
              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.15rem' }}>
                85% of unwithdraw revenue
              </span>
            )}
          </div>
        </div>
        {isSuperAdmin && (
          <>
            <div className="admin-kpi-card">
              <div className="admin-kpi-icon" style={{ background: '#4c1d95', color: '#c4b5fd' }}>%</div>
              <div className="admin-kpi-content">
                <span className="admin-kpi-label">Platform Fees Collected</span>
                <span className="admin-kpi-value">{fmt(kpi.totalFees)}</span>
                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.15rem' }}>
                  15% of all withdrawals
                </span>
              </div>
            </div>
            <div className="admin-kpi-card">
              <div className="admin-kpi-icon" style={{ background: '#7c2d12', color: '#fdba74' }}>★</div>
              <div className="admin-kpi-content">
                <span className="admin-kpi-label">Membership Revenue</span>
                <span className="admin-kpi-value">{fmt(kpi.membershipRevenue)}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="withdraw-tabs">
        <button
          type="button"
          className={`withdraw-tab ${activeTab === 'events' ? 'withdraw-tab-active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          Events
        </button>
        <button
          type="button"
          className={`withdraw-tab ${activeTab === 'history' ? 'withdraw-tab-active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Withdrawal History
          {withdrawals.length > 0 && (
            <span className="withdraw-tab-badge">{withdrawals.length}</span>
          )}
        </button>
      </div>

      {/* Events tab */}
      {activeTab === 'events' && (
        <div className="withdraw-events-grid">
          {events.length === 0 ? (
            <div className="admin-empty-state">No events found.</div>
          ) : (
            events.map((ev) => (
              <EventCard
                key={ev.id}
                event={ev}
                hasBankAccount={!!bankAccount}
                isSuperAdmin={isSuperAdmin}
                onWithdraw={handleWithdraw}
                withdrawing={withdrawing}
              />
            ))
          )}
        </div>
      )}

      {/* History tab */}
      {activeTab === 'history' && (
        <div className="admin-section" style={{ marginTop: 0 }}>
          {withdrawals.length === 0 ? (
            <div className="admin-empty-state">No withdrawals yet.</div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    {isSuperAdmin && <th>Admin</th>}
                    <th>Gross</th>
                    <th>Fee (15%)</th>
                    <th>Net Paid</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((w) => (
                    <tr key={w.id}>
                      <td>{w.event_title}</td>
                      {isSuperAdmin && (
                        <td>
                          <div>{w.admin_name || '—'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{w.admin_email}</div>
                        </td>
                      )}
                      <td>{fmt(w.grossAmount)}</td>
                      <td style={{ color: '#f87171' }}>{fmt(w.platformFee)}</td>
                      <td style={{ color: '#86efac' }}>{fmt(w.netAmount)}</td>
                      <td>
                        <span className={`admin-status-badge ${w.status === 'completed' ? 'admin-status-active' : 'admin-status-inactive'}`}>
                          {w.status}
                        </span>
                      </td>
                      <td>{fmtDate(w.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Bank setup modal */}
      {showBankModal && (
        <BankSetupModal onClose={() => setShowBankModal(false)} onSaved={handleBankSaved} />
      )}
    </div>
  );
};

export default AdminWithdraw;
