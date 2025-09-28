import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LoadingSpinner } from './components/ui/LoadingSpinner'
import { Layout } from './components/layout/Layout'
import { WelcomePage } from './pages/WelcomePage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ProfilePage } from './pages/ProfilePage'
import { EventDetailsPage } from './pages/EventDetailsPage'

// Organizer components
import { OrganizerHome } from './pages/organizer/OrganizerHome'
import { OrganizerEvents } from './pages/organizer/OrganizerEvents'
import { OrganizerAnalysis } from './pages/organizer/OrganizerAnalysis'

// Attendee components
import { AttendeeHome } from './pages/attendee/AttendeeHome'
import { AttendeeEvents } from './pages/attendee/AttendeeEvents'
import { AttendeeTickets } from './pages/attendee/AttendeeTickets'

// Volunteer components
import { VolunteerHome } from './pages/volunteer/VolunteerHome'
import { VolunteerEvents } from './pages/volunteer/VolunteerEvents'


function AppContent() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Show auth pages if not logged in
  if (!user || !profile) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<WelcomePage />} />
      </Routes>
    )
  }
  
  // Render role-based authenticated routes
  return (
    <Layout>
      <Routes>
        {profile.role === 'organizer' && (
          <>
            <Route path="/dashboard" element={<OrganizerHome />} />
            <Route path="/events" element={<OrganizerEvents />} />
            <Route path="/analysis" element={<OrganizerAnalysis />} />
          </>
        )}
        {profile.role === 'attendee' && (
          <>
            <Route path="/dashboard" element={<AttendeeHome />} />
            <Route path="/events" element={<AttendeeEvents />} />
            <Route path="/tickets" element={<AttendeeTickets />} />
          </>
        )}
        {profile.role === 'volunteer' && (
          <>
            <Route path="/dashboard" element={<VolunteerHome />} />
            <Route path="/events" element={<VolunteerEvents />} />
          </>
        )}
        
        {/* Shared routes */}
        <Route path="/events/:eventId" element={<EventDetailsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
