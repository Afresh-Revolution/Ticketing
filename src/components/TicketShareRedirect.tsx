import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Handles /ticket/:orderId share links:
 * - If not authenticated → redirect to login (with return path so after login we come back and then go to ticket).
 * - If authenticated → redirect to My Tickets and highlight the order.
 */
const TicketShareRedirect = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!orderId) {
      navigate('/');
      return;
    }
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/ticket/${orderId}` }, replace: true });
      return;
    }
    navigate('/my-tickets', { state: { highlightOrderId: orderId }, replace: true });
  }, [orderId, isAuthenticated, navigate]);

  return (
    <div className="ticket-share-redirect" aria-live="polite">
      <p>Taking you to your ticket…</p>
    </div>
  );
};

export default TicketShareRedirect;
