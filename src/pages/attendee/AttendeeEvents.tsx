import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase, Event } from '../../lib/supabase'
import { Card } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Calendar, MapPin, Search, Users } from 'lucide-react'

export function AttendeeEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    filterEvents()
  }, [events, searchTerm, categoryFilter])

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*, bookings_count:bookings(count)')
        .eq('status', 'published')
        .gte('date_time', new Date().toISOString())
        .order('date_time', { ascending: true })
      if (error) throw error
      const eventsWithSeats = data?.map(event => ({
        ...event,
        available_seats: event.capacity - (event.bookings_count?.[0]?.count || 0)
      })) || []
      setEvents(eventsWithSeats)
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterEvents = () => {
    let filtered = events
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.venue.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(event => event.category === categoryFilter)
    }
    setFilteredEvents(filtered)
  }

  const categories = ['all', ...Array.from(new Set(events.map(e => e.category).filter(Boolean) as string[]))]

  if (loading) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner size="lg" /></div>
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input placeholder="Search events by title or venue..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 border rounded-md bg-dark-800 border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-white">
          {categories.map(cat => <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>)}
        </select>
      </div>

      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="p-0 overflow-hidden flex flex-col" hover>
              <Link to={`/events/${event.id}`} className="flex flex-col h-full">
                {event.banner_url && <img src={event.banner_url} alt={event.title} className="w-full h-40 object-cover" />}
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="font-bold text-lg text-white truncate">{event.title}</h3>
                  <div className="text-sm text-gray-400 space-y-1 mt-2 flex-grow">
                    <p className="flex items-center"><Calendar className="w-4 h-4 mr-2" /> {new Date(event.date_time).toLocaleDateString()}</p>
                    <p className="flex items-center"><MapPin className="w-4 h-4 mr-2" /> {event.venue}</p>
                    <p className="flex items-center"><Users className="w-4 h-4 mr-2" /> {event.available_seats} seats left</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-lg font-bold text-white">{event.price > 0 ? `$${event.price.toFixed(2)}` : 'Free'}</span>
                    <Button variant="primary-dark" size="sm">View Details</Button>
                  </div>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12"><Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" /><h3 className="text-lg font-medium text-white mb-2">No Events Found</h3><p className="text-gray-400">Try adjusting your search or filters.</p></div>
      )}
    </div>
  )
}
