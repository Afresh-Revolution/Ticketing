import { useEffect, useState } from 'react'
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { PWAProvider } from './contexts/PWAContext'
import PWABadges from './components/PWABadges'
import PullToRefresh from './components/PullToRefresh'
import LandingPage from './components/LandingPage'
import LoginPage from './components/LoginPage'
import SignupPage from './components/SignupPage'
import PaymentSuccess from './components/PaymentSuccess'
import OrganizerFormPage from './components/OrganizerFormPage'
import EventsPage from './components/EventsPage'
import MyTicketsPage from './components/MyTicketsPage'
import TicketShareRedirect from './components/TicketShareRedirect'
import EventDetailPage from './components/EventDetailPage'
import CheckoutPage from './components/CheckoutPage'
import MerchShopPage from './components/MerchShopPage'
import MerchCheckoutPage from './components/MerchCheckoutPage'
import AdminLogin from './admin/AdminLogin'
import ProtectedAdminRoute from './admin/ProtectedAdminRoute'
import AdminDashboard from './admin/AdminDashboard'
import AdminEvents from './admin/AdminEvents'
import AdminCreateEvent from './admin/AdminCreateEvent'
import AdminEditEvent from './admin/AdminEditEvent'
import AdminSales from './admin/AdminSales'
import AdminAdmins from './admin/AdminAdmins'
import AdminScanner from './admin/AdminScanner'
import AdminWithdraw from './admin/AdminWithdraw'
import AdminTopUsers from './admin/AdminTopUsers'
import AdminCoupons from './admin/AdminCoupons'
import './App.css'
import { getRouteTransitionVariant, type RouteTransitionVariant } from './routeTransitions'

function AnimatedRoutes() {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)
  const [transitionStage, setTransitionStage] = useState<'fade-in' | 'fade-out'>('fade-in')
  const [transitionVariant, setTransitionVariant] = useState<RouteTransitionVariant>(() =>
    getRouteTransitionVariant(location.pathname)
  )

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      const id = window.setTimeout(() => {
        setTransitionVariant(getRouteTransitionVariant(location.pathname))
        setTransitionStage('fade-out')
      }, 0)
      return () => window.clearTimeout(id)
    }
    return undefined
  }, [location.pathname, displayLocation.pathname])

  return (
    <div
      className={`route-fade-wrap route-t-${transitionVariant} ${transitionStage}`}
      onAnimationEnd={() => {
        if (transitionStage === 'fade-out') {
          setDisplayLocation(location)
          setTransitionStage('fade-in')
        }
      }}
    >
      <Routes location={displayLocation}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/event/:id" element={<EventDetailPage />} />
        <Route path="/event/:id/merch" element={<MerchShopPage />} />
        <Route path="/event/:id/merch/checkout" element={<MerchCheckoutPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/my-tickets" element={<MyTicketsPage />} />
        <Route path="/ticket/:orderId" element={<TicketShareRedirect />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/organizer-form" element={<OrganizerFormPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<ProtectedAdminRoute />}>
          <Route index element={<AdminDashboard />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="events/create" element={<AdminCreateEvent />} />
          <Route path="events/edit/:id" element={<AdminEditEvent />} />
          <Route path="sales" element={<AdminSales />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="withdraw" element={<AdminWithdraw />} />
          <Route path="admins" element={<AdminAdmins />} />
          <Route path="scanner" element={<AdminScanner />} />
          <Route path="top-users" element={<AdminTopUsers />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
    <PWAProvider>
    <PullToRefresh />
    <PWABadges />
    <Router>
      <AnimatedRoutes />
    </Router>
    </PWAProvider>
    </AuthProvider>
  )
}

export default App
