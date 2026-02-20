import { useState, useEffect } from 'react';
import { usePaystackPayment } from 'react-paystack';
import { useAuth } from '../contexts/AuthContext';
import { apiUrl } from '../api/config';
import Modal from './Modal';
import './MembershipPlanModal.css';

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  duration: string;
  description: string;
}

interface MembershipPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MembershipPlanModal = ({ isOpen, onClose }: MembershipPlanModalProps) => {
  const { user, token } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
    }
  }, [isOpen]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await fetch(apiUrl('/api/memberships/plans'));
      if (!res.ok) throw new Error('Failed to fetch plans');
      const data = await res.json();
      setPlans(data);
    } catch (err) {
      setError('Could not load membership plans.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = async (reference: any) => {
    if (!selectedPlan || !user || !token) return;

    try {
      setLoading(true);
      const res = await fetch(apiUrl('/api/memberships'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
          paystackReference: reference.reference
        })
      });

      if (!res.ok) throw new Error('Failed to process membership');
      
      alert('Membership activated successfully!');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Payment verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    console.log('Payment closed');
    setLoading(false);
  };

  const PayButton = ({ plan }: { plan: Plan }) => {
    const config = {
      reference: (new Date()).getTime().toString(),
      email: user?.email || '',
      amount: plan.price, // Amount is in kobo from backend/database
      publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string,
    };

    const initializePayment = usePaystackPayment(config);

    return (
      <button
        className="plan-select-btn"
        onClick={() => {
            setSelectedPlan(plan);
            initializePayment({ onSuccess: handleSuccess, onClose: handleClose });
        }}
        disabled={loading}
      >
        Select {plan.name}
      </button>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Become an Organizer" className="modal-top-aligned">
      <p className="modal-subtitle">Choose a plan to start hosting events on Gatewav.</p>

      {error && <div className="modal-error">{error}</div>}
      
      {loading && !plans.length ? (
        <div className="modal-loading">Loading plans...</div>
      ) : (
        <div className="plans-grid">
          {plans.map(plan => (
            <div key={plan.id} className="plan-card">
              <h3 className="plan-name">{plan.name}</h3>
              <div className="plan-price">
                {plan.currency} {(plan.price / 100).toLocaleString()}
                <span className="plan-duration">/{plan.duration}</span>
              </div>
              <p className="plan-desc">{plan.description}</p>
              {user ? (
                 <PayButton plan={plan} />
              ) : (
                  <div className="login-prompt">Please login to subscribe</div>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

export default MembershipPlanModal;


