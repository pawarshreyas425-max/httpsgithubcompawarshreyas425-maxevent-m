import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { supabase, Event } from '../../lib/supabase'
import { Plus, Search, Edit, Trash2, Users, Calendar, MapPin, Handshake } from 'lucide-react'
import { ManageVolunteersModal } from '../../components/organizer/ManageVolunteersModal'

export function OrganizerEvents() {
  const { profile } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showAttendeesModal, setShowAttendeesModal] = useState(false)
  const [showVolunteersModal, setShowVolunteersModal] = useState(false)
  const [attendees, setAttendees] = useState<any[]>([])

  useEffect(() => {
    fetchEvents()
  }, [profile])

  useEffect(() => {
    filterEvents()
  }, [events, searchTerm, statusFilter])

  const fetchEvents = async () => {
    if (!profile) return
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`*, bookings_count:bookings(count)`)
        .eq('organizer_id', profile.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      const eventsWithCounts = data?.map(event => ({
        ...event,
        bookings_count: event.bookings_count?.[0]?.count || 0,
        available_seats: event.capacity - (event.bookings_count?.[0]?.count || 0)
      })) || []
      setEvents(eventsWithCounts)
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
    if (statusFilter !== 'all') {
      filtered = filtered.filter(event => event.status === statusFilter)
    }
    setFilteredEvents(filtered)
  }

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return
    try {
      await supabase.from('bookings').delete().eq('event_id', selectedEvent.id)
      await supabase.from('volunteer_applications').delete().eq('event_id', selectedEvent.id)
      await supabase.from('events').delete().eq('id', selectedEvent.id)
      setEvents(events.filter(event => event.id !== selectedEvent.id))
      setShowDeleteModal(false)
      setSelectedEvent(null)
    } catch (error) {
      console.error('Error deleting event:', error)
    }
  }

  const fetchAttendees = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`*, attendee:profiles!inner(full_name, email, phone)`)
        .eq('event_id', eventId)
      if (error) throw error
      setAttendees(data || [])
      setShowAttendeesModal(true)
    } catch (error) {
      console.error('Error fetching attendees:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-300 bg-green-900'
      case 'draft': return 'text-yellow-300 bg-yellow-900'
      case 'cancelled': return 'text-red-300 bg-red-900'
      case 'completed': return 'text-gray-300 bg-gray-700'
      default: return 'text-gray-300 bg-gray-700'
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner size="lg" /></div>
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input placeholder="Search events..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-md bg-dark-800 border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-white">
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="overflow-hidden flex flex-col p-0">
              {event.banner_url && <img src={event.banner_url} alt={event.title} className="w-full h-48 object-cover" />}
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-white truncate">{event.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(event.status)}`}>{event.status}</span>
                </div>
                <div className="space-y-2 mb-4 text-gray-400 text-sm flex-grow">
                  <div className="flex items-center"><Calendar className="w-4 h-4 mr-2" />{new Date(event.date_time).toLocaleString()}</div>
                  <div className="flex items-center"><MapPin className="w-4 h-4 mr-2" />{event.venue}</div>
                  <div className="flex items-center"><Users className="w-4 h-4 mr-2" />{event.bookings_count}/{event.capacity} attendees</div>
                </div>
                <div className="flex space-x-2 mt-auto">
                  <Button variant="outline-dark" size="sm" onClick={() => alert('Edit functionality would be implemented')}><Edit className="w-4 h-4" /></Button>
                  <Button variant="outline-dark" size="sm" onClick={() => fetchAttendees(event.id)}><Users className="w-4 h-4" /></Button>
                  <Button variant="outline-dark" size="sm" onClick={() => { setSelectedEvent(event); setShowVolunteersModal(true); }}><Handshake className="w-4 h-4" /></Button>
                  <Button variant="outline-dark" size="sm" onClick={() => { setSelectedEvent(event); setShowDeleteModal(true); }}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12"><Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" /><h3 className="text-lg font-medium text-white mb-2">No events found</h3><p className="text-gray-400 mb-6">There are no events matching your criteria.</p></div>
      )}

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Event">
        <div className="space-y-4"><p className="text-gray-400">Are you sure you want to delete "{selectedEvent?.title}"? This action will also remove all associated bookings and cannot be undone.</p><div className="flex space-x-3"><Button variant="outline-dark" onClick={() => setShowDeleteModal(false)} className="flex-1">Cancel</Button><Button onClick={handleDeleteEvent} className="flex-1 bg-red-600 hover:bg-red-700 text-white">Delete</Button></div></div>
      </Modal>

      <Modal isOpen={showAttendeesModal} onClose={() => setShowAttendeesModal(false)} title="Event Attendees" maxWidth="max-w-2xl">
        <div className="space-y-4">
          {attendees.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {attendees.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                  <div><p className="font-medium text-white">{booking.attendee?.full_name}</p><p className="text-sm text-gray-400">{booking.attendee?.email}</p></div>
                  <span className={`px-2 py-1 text-xs rounded-full ${booking.status === 'checked_in' ? 'bg-green-900 text-green-300' : 'bg-gray-600 text-gray-300'}`}>{booking.status}</span>
                </div>
              ))}
            </div>
          ) : (<p className="text-center text-gray-500 py-4">No attendees registered yet</p>)}
        </div>
      </Modal>

      {selectedEvent && (
        <ManageVolunteersModal 
          isOpen={showVolunteersModal} 
          onClose={() => setShowVolunteersModal(false)} 
          eventId={selectedEvent.id}
          eventName={selectedEvent.title}
        />
      )}
    </div>
  )
}
