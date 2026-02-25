import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { PWAProvider } from './contexts/PWAContext'
import PWABadges from './components/PWABadges'
import PullToRefresh from './components/PullToRefresh'
import LandingPage from './components/LandingPage'
import LoginPage from './components/LoginPage'
import SignupPage from './components/SignupPage'
import PaymentSuccess from './components/PaymentSuccess'
import EventsPage from './components/EventsPage'
import MyTicketsPage from './components/MyTicketsPage'
import TicketShareRedirect from './components/TicketShareRedirect'
import EventDetailPage from './components/EventDetailPage'
import CheckoutPage from './components/CheckoutPage'
import AdminLogin from './admin/AdminLogin'
import ProtectedAdminRoute from './admin/ProtectedAdminRoute'
import AdminDashboard from './admin/AdminDashboard'
import AdminEvents from './admin/AdminEvents'
import AdminCreateEvent from './admin/AdminCreateEvent'
import AdminEditEvent from './admin/AdminEditEvent'
import AdminSales from './admin/AdminSales'
import AdminAdmins from './admin/AdminAdmins'
import AdminScanner from './admin/AdminScanner'
import AdminMemberships from './admin/AdminMemberships'
import AdminMembershipPlans from './admin/AdminMembershipPlans'
import AdminWithdraw from './admin/AdminWithdraw'
import AdminTopUsers from './admin/AdminTopUsers'
import './App.css'

function App() {
  return (
    <AuthProvider>
    <PWAProvider>
    <PullToRefresh />
    <PWABadges />
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/event/:id" element={<EventDetailPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/my-tickets" element={<MyTicketsPage />} />
        <Route path="/ticket/:orderId" element={<TicketShareRedirect />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<ProtectedAdminRoute />}>
          <Route index element={<AdminDashboard />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="events/create" element={<AdminCreateEvent />} />
          <Route path="events/edit/:id" element={<AdminEditEvent />} />
          <Route path="sales" element={<AdminSales />} />
          <Route path="memberships" element={<AdminMemberships />} />
          <Route path="membership-plans" element={<AdminMembershipPlans />} />
          <Route path="withdraw" element={<AdminWithdraw />} />
          <Route path="admins" element={<AdminAdmins />} />
          <Route path="scanner" element={<AdminScanner />} />
          <Route path="top-users" element={<AdminTopUsers />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </Router>
    </PWAProvider>
    </AuthProvider>
  )
}

export default App
