import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase, Booking } from '../../lib/supabase'
import { Card } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { Button } from '../../components/ui/Button'
import { Ticket, Calendar, MapPin, Download, XCircle } from 'lucide-react'

export function AttendeeTickets() {
  const { profile } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) fetchBookings()
  }, [profile])

  const fetchBookings = async () => {
    if (!profile) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, event:events(*)')
        .eq('attendee_id', profile.id)
        .order('created_at', { foreignTable: 'events', ascending: false })
      if (error) throw error
      setBookings(data || [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return
    try {
      const { error } = await supabase.from('bookings').delete().eq('id', bookingId)
      if (error) throw error
      setBookings(bookings.filter(b => b.id !== bookingId))
      alert('Booking cancelled successfully.')
    } catch (error) {
      console.error('Error cancelling booking:', error)
      alert('Failed to cancel booking.')
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner size="lg" /></div>
  }

  const upcomingBookings = bookings.filter(b => new Date(b.event?.date_time || 0) >= new Date())
  const pastBookings = bookings.filter(b => new Date(b.event?.date_time || 0) < new Date())

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">My Upcoming Tickets</h2>
        {upcomingBookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {upcomingBookings.map(booking => booking.event && (
              <Card key={booking.id} className="flex flex-col sm:flex-row gap-4">
                <div className="flex-grow">
                  <h3 className="text-lg font-bold text-white">{booking.event.title}</h3>
                  <p className="text-sm text-gray-400 flex items-center mt-2"><Calendar className="w-4 h-4 mr-2" /> {new Date(booking.event.date_time).toLocaleString()}</p>
                  <p className="text-sm text-gray-400 flex items-center mt-1"><MapPin className="w-4 h-4 mr-2" /> {booking.event.venue}</p>
                  <p className="text-sm text-gray-400 mt-1">Status: <span className="font-medium text-green-400">{booking.status}</span></p>
                </div>
                <div className="flex sm:flex-col items-center justify-center gap-2">
                  <Button variant="outline-dark" size="sm" onClick={() => alert('PDF download coming soon!')}><Download className="w-4 h-4" /></Button>
                  <Button variant="outline-dark" size="sm" onClick={() => handleCancelBooking(booking.id)}><XCircle className="w-4 h-4 text-red-400" /></Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-10"><Ticket className="w-12 h-12 text-gray-600 mx-auto mb-4" /><p className="text-gray-400">You have no upcoming tickets.</p></Card>
        )}
      </div>
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Past Bookings</h2>
        {pastBookings.length > 0 ? (
          <div className="space-y-3">
            {pastBookings.map(booking => booking.event && (
              <Card key={booking.id} className="flex items-center justify-between">
                <div>
                  <h3 className="text-md font-semibold text-white">{booking.event.title}</h3>
                  <p className="text-sm text-gray-500">{new Date(booking.event.date_time).toLocaleDateString()}</p>
                </div>
                <Button variant="ghost-dark" size="sm" onClick={() => alert('Feedback form coming soon!')}>Leave Feedback</Button>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-10"><p className="text-gray-500">No past bookings found.</p></Card>
        )}
      </div>
    </div>
  )
}
