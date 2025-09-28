import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Calendar, BarChart, User, Home, Ticket, Briefcase, Handshake } from 'lucide-react'

export function Sidebar() {
  const { profile } = useAuth()
  const location = useLocation()

  const getTabsForRole = () => {
    switch (profile?.role) {
      case 'organizer':
        return [
          { path: '/dashboard', label: 'Dashboard', icon: Home },
          { path: '/events', label: 'Events', icon: Calendar },
          { path: '/analysis', label: 'Reports', icon: BarChart },
          { path: '/profile', label: 'Settings', icon: User }
        ]
      case 'volunteer':
        return [
          { path: '/dashboard', label: 'Dashboard', icon: Home },
          { path: '/events', label: 'Browse Events', icon: Handshake },
          { path: '/profile', label: 'Profile', icon: User }
        ]
      case 'attendee':
        return [
          { path: '/dashboard', label: 'Dashboard', icon: Home },
          { path: '/events', label: 'Browse Events', icon: Calendar },
          { path: '/tickets', label: 'My Tickets', icon: Ticket },
          { path: '/profile', label: 'Profile', icon: User }
        ]
      default:
        return []
    }
  }

  const tabs = getTabsForRole()

  return (
    <aside className="w-64 bg-dark-800 border-r border-dark-700 flex flex-col">
      <div className="h-16 flex items-center justify-center border-b border-dark-700">
        <Link to="/dashboard">
          <h1 className="text-2xl font-bold text-white">EventHub</h1>
        </Link>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = location.pathname === tab.path
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-white text-black'
                  : 'text-gray-300 hover:bg-dark-700 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
