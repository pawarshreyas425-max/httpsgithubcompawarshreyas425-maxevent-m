import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/Button'
import { Search, Plus, LogOut, User } from 'lucide-react'
import { Input } from '../ui/Input'

interface HeaderProps {
  onCreateEvent: () => void
}

export function Header({ onCreateEvent }: HeaderProps) {
  const { profile, signOut } = useAuth()

  return (
    <header className="h-16 bg-dark-800 border-b border-dark-700 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search..." className="pl-9" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        {profile?.role === 'organizer' && (
          <Button onClick={onCreateEvent} variant="primary-dark">
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        )}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center">
            <User className="w-4 h-4 text-gray-300" />
          </div>
          <div className="text-sm">
            <p className="font-semibold text-white">{profile?.full_name}</p>
            <p className="text-gray-400 capitalize">{profile?.role}</p>
          </div>
        </div>
        <Button variant="ghost-dark" size="sm" onClick={signOut} aria-label="Logout">
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </header>
  )
}
