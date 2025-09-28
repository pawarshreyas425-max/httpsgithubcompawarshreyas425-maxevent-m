import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase, Event, Booking } from '../../lib/supabase'
import { Card } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { Calendar, MapPin, Ticket, Search } from 'lucide-react'
import { Button } from '../../components/ui/Button'

export function AttendeeHome() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [upcomingEvents, setUpcomingEvents] = useState<Booking[]>([])
  const [recommendedEvents, setRecommendedEvents] = useState<Event[]>([])

  useEffect(() => {
    if (profile) {
      fetchDashboardData()
    }
  }, [profile])

  const fetchDashboardData = async () => {
    if (!profile) return
    setLoading(true)
    try {
      // Fetch upcoming registered events
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*, event:events(*)')
        .eq('attendee_id', profile.id)
        .gte('event.date_time', new Date().toISOString())
        .order('created_at', { foreignTable: 'events', ascending: true })
        .limit(3)
      if (bookingsError) throw bookingsError
      setUpcomingEvents(bookings || [])

      const bookedEventIds = bookings?.map(b => b.event_id) || []

      // Fetch recommended events (latest published events not booked by user)
      let query = supabase
        .from('events')
        .select('*')
        .eq('status', 'published')
        .gte('date_time', new Date().toISOString())
        
      if(bookedEventIds.length > 0) {
        query = query.not('id', 'in', `(${bookedEventIds.join(',')})`)
      }

      const { data: recommendations, error: recError } = await query
        .order('created_at', { ascending: false })
        .limit(3)
      
      if (recError) throw recError
      setRecommendedEvents(recommendations || [])

    } catch (error) {
      console.error('Error fetching attendee dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner size="lg" /></div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">My Upcoming Events</h2>
        {upcomingEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map(({ event }) => event && (
              <Card key={event.id} className="p-0 overflow-hidden" hover>
                <Link to={`/events/${event.id}`}>
                  {event.banner_url && <img src={event.banner_url} alt={event.title} className="w-full h-40 object-cover" />}
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-white truncate">{event.title}</h3>
                    <p className="text-sm text-gray-400 flex items-center mt-2"><Calendar className="w-4 h-4 mr-2" /> {new Date(event.date_time).toLocaleString()}</p>
                    <p className="text-sm text-gray-400 flex items-center mt-1"><MapPin className="w-4 h-4 mr-2" /> {event.venue}</p>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-10">
            <Ticket className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">You have no upcoming events.</p>
            <Link to="/events">
              <Button variant="primary-dark" className="mt-4">Browse Events</Button>
            </Link>
          </Card>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Recommended For You</h2>
        {recommendedEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedEvents.map((event) => (
              <Card key={event.id} className="p-0 overflow-hidden" hover>
                <Link to={`/events/${event.id}`}>
                  {event.banner_url && <img src={event.banner_url} alt={event.title} className="w-full h-40 object-cover" />}
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-white truncate">{event.title}</h3>
                    <p className="text-sm text-gray-400 flex items-center mt-2"><Calendar className="w-4 h-4 mr-2" /> {new Date(event.date_time).toLocaleString()}</p>
                    <p className="text-sm text-gray-400 flex items-center mt-1"><MapPin className="w-4 h-4 mr-2" /> {event.venue}</p>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-10">
            <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No new events to recommend right now.</p>
          </Card>
        )}
      </div>
    </div>
  )
}
