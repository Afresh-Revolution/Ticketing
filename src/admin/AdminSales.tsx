import { useState, useEffect } from 'react';
import { apiUrl } from '../api/config';
import './admin.css';

interface Sale {
  id: string;
  buyer_name: string;
  buyer_email: string;
  amount: number;
  status: string;
  created_at: string;
  event_title: string;
}

const formatCurrency = (amount: number) =>
  `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

const AdminSales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiUrl('/api/admin/sales'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load sales');
      const data = await res.json();
      setSales(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sales');
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    const headers = ['Transaction ID', 'Event', 'Buyer', 'Email', 'Date', 'Amount', 'Status'];
    const rows = sales.map((s) => [
      s.id,
      `"${(s.event_title || '').replace(/"/g, '""')}"`,
      `"${(s.buyer_name || '').replace(/"/g, '""')}"`,
      `"${(s.buyer_email || '').replace(/"/g, '""')}"`,
      formatDate(s.created_at),
      s.amount,
      s.status,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-page">
      <div className="admin-sales-container">
        <div className="admin-page-header">
          <h1 className="admin-page-title">Sales Reports</h1>
          <button
            type="button"
            className="admin-btn-export"
            onClick={exportCsv}
            disabled={loading || sales.length === 0}
          >
            ↓ Export CSV
          </button>
        </div>

        {error && (
          <div className="admin-login-error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <div className="admin-table-wrap admin-table-wrap-inside">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Event</th>
                <th>Buyer</th>
                <th>Date</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="admin-table-empty">
                    Loading…
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="admin-table-empty">
                    No sales records found.
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="admin-sales-id">{sale.id}</td>
                    <td>{sale.event_title}</td>
                    <td>
                      <div>{sale.buyer_name}</div>
                      <div className="admin-sales-buyer-email">{sale.buyer_email}</div>
                    </td>
                    <td>{formatDate(sale.created_at)}</td>
                    <td>{formatCurrency(sale.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminSales;
