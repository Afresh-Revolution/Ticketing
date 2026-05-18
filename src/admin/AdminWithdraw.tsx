import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  tickets_sold: number;
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
  bankName?: string | null;
  bankCode?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
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
}

interface PageData {
  kpi: KPI;
  events: EventRow[];
  withdrawals: WithdrawalRow[];
  pendingRequests: WithdrawalRow[];
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

function hasSoldTickets(event: EventRow): boolean {
  return Number(event.tickets_sold) > 0 || Number(event.gross_revenue) > 0;
}

// ─── Searchable bank picker (inline — pushes form fields down when open) ─────

interface SearchableBankSelectProps {
  banks: Bank[];
  loading: boolean;
  value: string;
  onChange: (bank: Bank) => void;
  onOpenChange?: (open: boolean) => void;
}

const SearchableBankSelect = ({
  banks,
  loading,
  value,
  onChange,
  onOpenChange,
}: SearchableBankSelectProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = banks.find((b) => b.code === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return banks;
    return banks.filter(
      (b) => b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q)
    );
  }, [banks, query]);

  const setOpenState = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
    if (!next) setQuery('');
  };

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => searchRef.current?.focus(), 0);
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpenState(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener('mousedown', onDoc);
    };
  }, [open]);

  const handleSelect = (bank: Bank) => {
    onChange(bank);
    setOpenState(false);
  };

  return (
    <div className="bank-select" ref={rootRef}>
      <button
        type="button"
        className={`bank-select-trigger admin-select ${open ? 'bank-select-trigger-open' : ''}`}
        onClick={() => !loading && setOpenState(!open)}
        disabled={loading}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="bank-select-trigger-label">
          {loading ? 'Loading banks…' : selected?.name || 'Select a bank…'}
        </span>
        <span className="bank-select-chevron" aria-hidden>{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="bank-select-panel">
          <input
            ref={searchRef}
            type="search"
            className="admin-input bank-select-search"
            placeholder="Search banks (e.g. OPay, GTBank)…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            aria-label="Search banks"
          />
          <ul className="bank-select-list" role="listbox" aria-label="Banks">
            {filtered.length === 0 ? (
              <li className="bank-select-empty">No banks match &ldquo;{query}&rdquo;</li>
            ) : (
              filtered.map((b) => (
                <li key={b.code} role="none">
                  <button
                    type="button"
                    role="option"
                    aria-selected={b.code === value}
                    className={`bank-select-option ${b.code === value ? 'is-selected' : ''}`}
                    onClick={() => handleSelect(b)}
                  >
                    {b.name}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

// ─── Bank Setup Modal ─────────────────────────────────────────────────────────

interface BankModalProps {
  onClose: () => void;
  onSaved: (ba: BankAccount) => void;
}

const BankSetupModal = ({ onClose, onSaved }: BankModalProps) => {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [bankPickerOpen, setBankPickerOpen] = useState(false);
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
      .then((data) => {
        if (!Array.isArray(data)) {
          setBanks([]);
          return;
        }
        const normalized = data
          .map((b: { code?: string; bank_code?: string; name?: string; bank_name?: string }) => ({
            code: String(b.code ?? b.bank_code ?? '').trim(),
            name: String(b.name ?? b.bank_name ?? '').trim(),
          }))
          .filter((b) => b.code && b.name);
        const byCode = new Map<string, Bank>();
        for (const b of normalized) {
          if (!byCode.has(b.code)) byCode.set(b.code, b);
        }
        setBanks([...byCode.values()].sort((a, b) => a.name.localeCompare(b.name)));
      })
      .catch(() => setBanks([]))
      .finally(() => setBanksLoading(false));
  }, []);

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
      const saved = await res.json();
      if (!res.ok) throw new Error(saved.error || 'Failed to save bank account');
      if (!saved.id) throw new Error('Bank account did not save. Please try again.');
      onSaved({
        id: String(saved.id),
        accountName: saved.accountName || accountName,
        accountNumber: saved.accountNumber || accountNumber,
        bankCode: saved.bankCode || bankCode,
        bankName: saved.bankName || bankName,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save bank account');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-modal-overlay admin-modal-overlay--bank-setup" onClick={onClose}>
      <div
        className={`admin-modal-container admin-modal-container--bank-setup${bankPickerOpen ? ' is-bank-picker-open' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-modal-header">
          <h2 className="admin-modal-title">Set Up Bank Account</h2>
          <button type="button" className="admin-modal-close" onClick={onClose}>×</button>
        </div>
        <form className="admin-modal-form admin-modal-form--bank-setup" onSubmit={handleSubmit}>
          {error && <div className="admin-form-error">{error}</div>}

          <label className="admin-label">Bank</label>
          <SearchableBankSelect
            banks={banks}
            loading={banksLoading}
            value={bankCode}
            onChange={(b) => {
              setBankCode(b.code);
              setBankName(b.name);
            }}
            onOpenChange={setBankPickerOpen}
          />
          {!banksLoading && banks.length === 0 && (
            <p className="admin-form-hint">Could not load banks. Refresh the page or contact support.</p>
          )}

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
  const isPending = event.withdrawal_status === 'pending';
  const isRejected = event.withdrawal_status === 'rejected';
  const alreadyWithdrawn = event.withdrawal_status === 'completed';
  const sold = hasSoldTickets(event);
  const canWithdraw =
    !isSuperAdmin &&
    sold &&
    !alreadyWithdrawn &&
    !isPending &&
    hasBankAccount;
  const isLoading = withdrawing === event.id;

  let statusChip: { label: string; cls: string };
  if (alreadyWithdrawn) statusChip = { label: '✓ Withdrawn', cls: 'chip-withdrawn' };
  else if (isPending) statusChip = { label: '⏳ Pending approval', cls: 'chip-pending' };
  else if (isRejected) statusChip = { label: 'Not approved', cls: 'chip-rejected' };
  else if (!sold) statusChip = { label: 'No tickets sold', cls: 'chip-pending' };
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
            !sold ? 'No sold tickets for this event yet'
            : alreadyWithdrawn ? 'Already withdrawn'
            : !hasBankAccount && !isSuperAdmin ? 'Set up your bank account first'
            : 'Request withdrawal'
          }
        >
          {isLoading
            ? 'Sending…'
            : alreadyWithdrawn
              ? 'Withdrawn'
              : isPending
                ? 'Request pending'
                : 'Withdraw'}
        </button>
      </div>
    </div>
  );
};

// ─── Pending request card (super admin) ──────────────────────────────────────

interface PendingRequestCardProps {
  request: WithdrawalRow;
  reviewing: string | null;
  onReview: (withdrawalId: string, action: 'approve' | 'disapprove') => void;
}

const PendingRequestCard = ({ request, reviewing, onReview }: PendingRequestCardProps) => {
  const busy = reviewing === request.id;
  return (
    <div className="withdraw-pending-card">
      <div className="withdraw-pending-header">
        <div>
          <h3 className="withdraw-pending-title">{request.event_title || 'Event'}</h3>
          <p className="withdraw-pending-admin">
            {request.admin_name || 'Admin'}
            {request.admin_email ? ` · ${request.admin_email}` : ''}
          </p>
        </div>
        <span className="withdraw-chip chip-pending">Pending</span>
      </div>

      <div className="withdraw-pending-details">
        <div className="withdraw-pending-detail-row">
          <span className="withdraw-pending-label">Gross revenue</span>
          <span>{fmt(request.grossAmount)}</span>
        </div>
        <div className="withdraw-pending-detail-row">
          <span className="withdraw-pending-label">Platform fee (15%)</span>
          <span style={{ color: '#f87171' }}>{fmt(request.platformFee)}</span>
        </div>
        <div className="withdraw-pending-detail-row">
          <span className="withdraw-pending-label">Net payout</span>
          <span style={{ color: '#86efac', fontWeight: 700 }}>{fmt(request.netAmount)}</span>
        </div>
        <div className="withdraw-pending-bank">
          <span className="withdraw-pending-label">Bank details</span>
          <p className="withdraw-pending-bank-line">
            <strong>{request.bankName || '—'}</strong>
          </p>
          <p className="withdraw-pending-bank-line">{request.accountName || '—'}</p>
          <p className="withdraw-pending-bank-line">{request.accountNumber || '—'}</p>
        </div>
      </div>

      <div className="withdraw-pending-actions">
        <button
          type="button"
          className="admin-btn-secondary withdraw-disapprove-btn"
          disabled={busy}
          onClick={() => onReview(request.id, 'disapprove')}
        >
          {busy ? '…' : 'Disapprove'}
        </button>
        <button
          type="button"
          className="admin-btn-primary"
          disabled={busy}
          onClick={() => onReview(request.id, 'approve')}
        >
          {busy ? '…' : 'Approve'}
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
  const [activeTab, setActiveTab] = useState<'events' | 'history' | 'requests'>('events');
  const [showBankModal, setShowBankModal] = useState(false);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<string | null>(null);
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!data?.isSuperAdmin) return;
    if ((data.pendingRequests?.length ?? 0) > 0) {
      setActiveTab('requests');
    } else if (activeTab === 'events') {
      setActiveTab('history');
    }
  }, [data?.isSuperAdmin, data?.pendingRequests?.length, activeTab]);

  useEffect(() => {
    const layout = document.querySelector('.admin-layout');
    const adminBody = document.querySelector('.admin-body');
    const main = document.querySelector('.admin-main');
    layout?.classList.add('admin-layout--withdraw');
    adminBody?.classList.add('admin-body--withdraw');
    main?.classList.add('admin-main--withdraw');
    return () => {
      layout?.classList.remove('admin-layout--withdraw');
      adminBody?.classList.remove('admin-body--withdraw');
      main?.classList.remove('admin-main--withdraw');
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('admin-bank-modal-open', showBankModal);
    return () => document.documentElement.classList.remove('admin-bank-modal-open');
  }, [showBankModal]);

  const handleWithdraw = async (eventId: string) => {
    if (!data?.bankAccount?.accountNumber || !data?.bankAccount?.bankCode) {
      showToast('Set up your bank account before requesting a withdrawal', 'error');
      setShowBankModal(true);
      return;
    }
    setWithdrawing(eventId);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiUrl(`/api/admin/withdraw/${eventId}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bankAccount: data.bankAccount }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Withdrawal failed');
      showToast(json.message || 'Withdrawal request submitted for approval', 'success');
      fetchData();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Withdrawal failed', 'error');
    } finally {
      setWithdrawing(null);
    }
  };

  const handleReview = async (withdrawalId: string, action: 'approve' | 'disapprove') => {
    setReviewing(withdrawalId);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiUrl(`/api/admin/withdraw/${withdrawalId}/review`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Review failed');
      showToast(
        json.message || (action === 'approve' ? 'Withdrawal approved' : 'Withdrawal disapproved'),
        'success'
      );
      fetchData();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Review failed', 'error');
    } finally {
      setReviewing(null);
    }
  };

  const handleBankSaved = (ba: BankAccount) => {
    setShowBankModal(false);
    setData((prev) => prev ? { ...prev, bankAccount: ba } : prev);
    showToast('Bank account saved!', 'success');
    fetchData();
  };

  if (loading) {
    return (
      <div className="admin-page admin-withdraw-page">
        <div className="admin-withdraw-scroll">
          <div className="admin-empty-state">Loading withdraw data…</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="admin-page admin-withdraw-page">
        <div className="admin-withdraw-scroll">
          <div className="admin-empty-state" style={{ color: '#f87171' }}>{error || 'No data'}</div>
        </div>
      </div>
    );
  }

  const { kpi, events, withdrawals, pendingRequests = [], bankAccount, isSuperAdmin } = data;

  return (
    <div className="admin-page admin-withdraw-page">
      {/* Toast */}
      {toast && (
        <div className={`withdraw-toast ${toast.type === 'success' ? 'withdraw-toast-success' : 'withdraw-toast-error'}`}>
          {toast.msg}
        </div>
      )}

      <div className="admin-withdraw-scroll">
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
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="withdraw-tabs">
        {isSuperAdmin && (
          <button
            type="button"
            className={`withdraw-tab ${activeTab === 'requests' ? 'withdraw-tab-active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            Pending Requests
            {pendingRequests.length > 0 && (
              <span className="withdraw-tab-badge">{pendingRequests.length}</span>
            )}
          </button>
        )}
        {!isSuperAdmin && (
          <button
            type="button"
            className={`withdraw-tab ${activeTab === 'events' ? 'withdraw-tab-active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            Events
          </button>
        )}
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

      {isSuperAdmin && activeTab === 'requests' && (
        <div className="withdraw-pending-grid">
          {pendingRequests.length === 0 ? (
            <div className="admin-empty-state">No pending withdrawal requests.</div>
          ) : (
            pendingRequests.map((req) => (
              <PendingRequestCard
                key={req.id}
                request={req}
                reviewing={reviewing}
                onReview={handleReview}
              />
            ))
          )}
        </div>
      )}

      {/* Events tab */}
      {activeTab === 'events' && !isSuperAdmin && (
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
      </div>

      {/* Bank setup modal */}
      {showBankModal && (
        <BankSetupModal onClose={() => setShowBankModal(false)} onSaved={handleBankSaved} />
      )}
    </div>
  );
};

export default AdminWithdraw;
