import React from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { CreateEventModal } from '../CreateEventModal'
import { useLocation, useNavigate } from 'react-router-dom'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [showCreateEvent, setShowCreateEvent] = React.useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const handleEventCreated = () => {
    setShowCreateEvent(false)
    if (location.pathname === '/events') {
      // A simple way to refresh data on the events page
      navigate(0)
    }
  }

  return (
    <div className="flex min-h-screen bg-dark-900 text-gray-200">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header onCreateEvent={() => setShowCreateEvent(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
      <CreateEventModal
        isOpen={showCreateEvent}
        onClose={() => setShowCreateEvent(false)}
        onEventCreated={handleEventCreated}
      />
    </div>
  )
}
