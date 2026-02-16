import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import LoginPage from './components/LoginPage'
import SignupPage from './components/SignupPage'
import PaymentSuccess from './components/PaymentSuccess'
import EventsPage from './components/EventsPage'
import MyTicketsPage from './components/MyTicketsPage'
import AdminLayout from './admin/AdminLayout'
import AdminDashboard from './admin/AdminDashboard'
import AdminEvents from './admin/AdminEvents'
import AdminCreateEvent from './admin/AdminCreateEvent'
import AdminSales from './admin/AdminSales'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/my-tickets" element={<MyTicketsPage />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="events/create" element={<AdminCreateEvent />} />
          <Route path="sales" element={<AdminSales />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
