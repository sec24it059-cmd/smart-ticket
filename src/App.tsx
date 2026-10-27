import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ReservationProvider } from './context/ReservationContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';

// Pages
import { LandingPage } from './pages/LandingPage.tsx';
import { EventDiscoveryPage } from './pages/EventDiscoveryPage.tsx';
import { EventDetailPage } from './pages/EventDetailPage.tsx';
import { CheckoutPage } from './pages/CheckoutPage.tsx';
import { BookingConfirmationPage } from './pages/BookingConfirmationPage.tsx';
import { AuthPage } from './pages/AuthPage.tsx';
import { AttendeeDashboard } from './pages/AttendeeDashboard.tsx';
import { OrganizerDashboard } from './pages/OrganizerDashboard.tsx';
import { EventWizardPage } from './pages/EventWizardPage.tsx';
import { TicketManagementPage } from './pages/TicketManagementPage.tsx';
import { AnalyticsPage } from './pages/AnalyticsPage.tsx';
import { AdminDashboard } from './pages/AdminDashboard.tsx';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#ff5c5c] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth?mode=login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <ReservationProvider>
        <BrowserRouter>
          <div className="flex flex-col min-h-screen bg-[#faf8f5]">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* 1. Public Landing Page */}
                <Route path="/" element={<LandingPage />} />

                {/* 2. Event Discovery Page */}
                <Route path="/events" element={<EventDiscoveryPage />} />

                {/* 3 & 4. Event Details & Ticket Selection */}
                <Route path="/events/:id" element={<EventDetailPage />} />

                {/* 5 & 6. Checkout, Countdown, and Simulated Payment */}
                <Route
                  path="/checkout/:reservationId"
                  element={
                    <ProtectedRoute>
                      <CheckoutPage />
                    </ProtectedRoute>
                  }
                />

                {/* 7. Booking Confirmation & Digital Passes */}
                <Route
                  path="/confirmation/:orderId"
                  element={
                    <ProtectedRoute>
                      <BookingConfirmationPage />
                    </ProtectedRoute>
                  }
                />

                {/* 8. Authentication (Login / Register / 1-Click Demo) */}
                <Route path="/auth" element={<AuthPage />} />

                {/* 9. Attendee Dashboard */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <AttendeeDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* 10. Organizer Dashboard */}
                <Route
                  path="/organizer"
                  element={
                    <ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}>
                      <OrganizerDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* 11. Event Creation Wizard */}
                <Route
                  path="/organizer/events/new"
                  element={
                    <ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}>
                      <EventWizardPage />
                    </ProtectedRoute>
                  }
                />

                {/* 12. Ticket Tier Management */}
                <Route
                  path="/organizer/events/:eventId/tickets"
                  element={
                    <ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}>
                      <TicketManagementPage />
                    </ProtectedRoute>
                  }
                />

                {/* 13. Organizer Analytics */}
                <Route
                  path="/organizer/analytics"
                  element={
                    <ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}>
                      <AnalyticsPage />
                    </ProtectedRoute>
                  }
                />

                {/* 14. Administrator Dashboard */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Catch-all redirect to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </ReservationProvider>
    </AuthProvider>
  );
}
