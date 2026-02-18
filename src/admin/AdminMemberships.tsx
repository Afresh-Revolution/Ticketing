import { useState, useEffect } from 'react';
import { apiUrl } from '../api/config';
import { useAuth } from '../contexts/AuthContext';

interface Membership {
  id: string;
  userName: string;
  userEmail: string;
  planName: string;
  status: string;
  endDate: string;
  startDate: string;
}

const AdminMemberships = () => {
  const { token } = useAuth();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMemberships();
  }, []);

  const fetchMemberships = async () => {
    try {
      setLoading(true);
      const res = await fetch(apiUrl('/api/memberships'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch memberships');
      const data = await res.json();
      setMemberships(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'suspend' | 'extend') => {
    try {
      const body = action === 'extend' 
        ? { extendDays: 30 } 
        : { status: 'suspended' };

      const res = await fetch(apiUrl(`/api/memberships/${id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      
      if (!res.ok) throw new Error('Action failed');
      fetchMemberships();
    } catch (err) {
      alert('Failed to update membership');
    }
  };

  return (
    <div className="admin-memberships-container">
      <h1>User Memberships</h1>
      
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {memberships.map(m => (
                <tr key={m.id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-name">{m.userName || 'Unknown'}</div>
                      <div className="user-email">{m.userEmail}</div>
                    </div>
                  </td>
                  <td>{m.planName}</td>
                  <td>
                    <span className={`status-badge ${m.status}`}>
                      {m.status}
                    </span>
                  </td>
                  <td>{new Date(m.startDate).toLocaleDateString()}</td>
                  <td>{new Date(m.endDate).toLocaleDateString()}</td>
                  <td>
                    <button className="btn-action" onClick={() => handleAction(m.id, 'extend')}>Extend</button>
                    {m.status === 'active' && (
                        <button className="btn-action danger" onClick={() => handleAction(m.id, 'suspend')}>Suspend</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminMemberships;
