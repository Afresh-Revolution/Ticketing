import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import LandingPage from './components/LandingPage'
import LoginPage from './components/LoginPage'
import SignupPage from './components/SignupPage'
import PaymentSuccess from './components/PaymentSuccess'
import EventsPage from './components/EventsPage'
import MyTicketsPage from './components/MyTicketsPage'
import EventDetailPage from './components/EventDetailPage'
import CheckoutPage from './components/CheckoutPage'
import AdminLogin from './admin/AdminLogin'
import ProtectedAdminRoute from './admin/ProtectedAdminRoute'
import AdminDashboard from './admin/AdminDashboard'
import AdminEvents from './admin/AdminEvents'
import AdminCreateEvent from './admin/AdminCreateEvent'
import AdminSales from './admin/AdminSales'
import './App.css'

function App() {
  return (
    <AuthProvider>
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/event/:id" element={<EventDetailPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/my-tickets" element={<MyTicketsPage />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<ProtectedAdminRoute />}>
          <Route index element={<AdminDashboard />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="events/create" element={<AdminCreateEvent />} />
          <Route path="sales" element={<AdminSales />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </Router>
    </AuthProvider>
  )
}

export default App
