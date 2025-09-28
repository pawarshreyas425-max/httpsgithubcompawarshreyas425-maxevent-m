import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/Button'
import { Calendar, Users, BarChart, User, LogOut, Home } from 'lucide-react'

interface NavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const { profile, signOut } = useAuth()

  const getTabsForRole = () => {
    switch (profile?.role) {
      case 'organizer':
        return [
          { id: 'home', label: 'Home', icon: Home },
          { id: 'events', label: 'Events', icon: Calendar },
          { id: 'analysis', label: 'Analysis', icon: BarChart },
          { id: 'profile', label: 'Profile', icon: User }
        ]
      case 'volunteer':
        return [
          { id: 'home', label: 'Home', icon: Home },
          { id: 'events', label: 'Events', icon: Calendar },
          { id: 'profile', label: 'Profile', icon: User }
        ]
      case 'attendee':
        return [
          { id: 'home', label: 'Home', icon: Home },
          { id: 'events', label: 'Events', icon: Calendar },
          { id: 'tickets', label: 'Tickets', icon: Users },
          { id: 'profile', label: 'Profile', icon: User }
        ]
      default:
        return []
    }
  }

  const tabs = getTabsForRole()

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold">EventHub</h1>
            </div>
            <div className="flex space-x-6">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-black border-b-2 border-black'
                        : 'text-gray-600 hover:text-black'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Welcome, {profile?.full_name}
            </span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
