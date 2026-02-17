import './admin.css';

const AdminSales = () => {
  return (
    <div className="admin-page">
      <div className="admin-sales-container">
        <div className="admin-page-header">
          <h1 className="admin-page-title">Sales Reports</h1>
          <button type="button" className="admin-btn-export">
            ↓ Export CSV
          </button>
        </div>

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
              <tr>
                <td colSpan={5} className="admin-table-empty">
                  No sales records found.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminSales;
