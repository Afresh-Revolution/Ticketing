import { Navigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';

const ProtectedAdminRoute = () => {
  // Check if admin is authenticated
  const adminToken = localStorage.getItem('adminToken');

  // If not authenticated, redirect to admin login
  if (!adminToken) {
    return <Navigate to="/admin/login" replace />;
  }

  // If authenticated, render the admin layout
  return <AdminLayout />;
};

export default ProtectedAdminRoute;
