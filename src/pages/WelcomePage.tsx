import React from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Users, MapPin } from 'lucide-react'
import { Button } from '../components/ui/Button'

export function WelcomePage() {
  return (
    <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center px-4 relative">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">EventHub</h1>
          <p className="text-xl text-gray-400">Plan, manage, and attend events effortlessly.</p>
        </div>

        <div className="mb-12">
          <div className="flex items-center justify-center space-x-8 mb-8">
            <div className="p-6 border-2 border-gray-600 rounded-full">
              <Calendar className="w-12 h-12 text-white" />
            </div>
            <div className="p-6 border-2 border-gray-600 rounded-full">
              <Users className="w-12 h-12 text-white" />
            </div>
            <div className="p-6 border-2 border-gray-600 rounded-full">
              <MapPin className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
          <Link to="/login" className="w-full sm:w-auto">
            <Button variant="primary-dark" size="lg" className="w-full">
              Login
            </Button>
          </Link>
          <Link to="/register" className="w-full sm:w-auto">
            <Button variant="outline-dark" size="lg" className="w-full">
              Register
            </Button>
          </Link>
        </div>
      </div>
      <div className="absolute bottom-4 left-4 text-xs text-gray-500">
        website by shrspwr
      </div>
    </div>
  )
}
