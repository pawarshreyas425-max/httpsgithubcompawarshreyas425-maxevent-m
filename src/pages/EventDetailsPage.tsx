import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase, Event, ApplicationStatus } from '../lib/supabase'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Calendar, MapPin, Users, DollarSign, ArrowLeft, Handshake } from 'lucide-react'

export function EventDetailsPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [isBooked, setIsBooked] = useState(false)
  const [isBooking, setIsBooking] = useState(false)
  const [volunteerApplicationStatus, setVolunteerApplicationStatus] = useState<ApplicationStatus | null>(null)
  const [isApplying, setIsApplying] = useState(false)

  useEffect(() => {
    if (eventId && profile) {
      fetchEventDetails()
    }
  }, [eventId, profile])

  const fetchEventDetails = async () => {
    if (!eventId || !profile) return
    setLoading(true)
    try {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*, organizer:profiles(full_name), bookings_count:bookings(count)')
        .eq('id', eventId)
        .single()
      if (eventError) throw eventError
      
      const eventWithSeats = {
        ...eventData,
        available_seats: eventData.capacity - (eventData.bookings_count?.[0]?.count || 0)
      }
      setEvent(eventWithSeats)

      if (profile.role === 'attendee') {
        const { data: bookingData } = await supabase
          .from('bookings')
          .select('id')
          .eq('event_id', eventId)
          .eq('attendee_id', profile.id)
          .single()
        setIsBooked(!!bookingData)
      } else if (profile.role === 'volunteer') {
        const { data: applicationData } = await supabase
          .from('volunteer_applications')
          .select('status')
          .eq('event_id', eventId)
          .eq('volunteer_id', profile.id)
          .single()
        setVolunteerApplicationStatus(applicationData?.status || null)
      }

    } catch (error) {
      console.error('Error fetching event details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBookNow = async () => {
    if (!event || !profile) return
    setIsBooking(true)
    try {
      const { error } = await supabase.from('bookings').insert({
        event_id: event.id,
        attendee_id: profile.id,
        status: 'confirmed',
      })
      if (error) throw error
      alert('Booking successful!')
      setIsBooked(true)
      fetchEventDetails(); // Re-fetch to update available seats
    } catch (error) {
      console.error('Error booking event:', error)
      alert('Failed to book event. It might be full or an error occurred.')
    } finally {
      setIsBooking(false)
    }
  }

  const handleApplyToVolunteer = async () => {
    if (!event || !profile) return
    setIsApplying(true)
    try {
      const { error } = await supabase.from('volunteer_applications').insert({
        event_id: event.id,
        volunteer_id: profile.id,
        status: 'pending',
      })
      if (error) throw error
      alert('Application sent successfully!')
      setVolunteerApplicationStatus('pending')
    } catch (error) {
      console.error('Error applying to volunteer:', error)
      alert('Failed to send application.')
    } finally {
      setIsApplying(false)
    }
  }
  
  const renderActionButtons = () => {
    if (profile?.role === 'attendee') {
      return isBooked ? (
        <Button variant="outline-dark" className="w-full" disabled>Already Booked</Button>
      ) : event?.available_seats <= 0 ? (
        <Button variant="primary-dark" className="w-full" disabled>Event Full</Button>
      ) : (
        <Button variant="primary-dark" className="w-full" onClick={handleBookNow} isLoading={isBooking}>
          {isBooking ? 'Booking...' : 'Book Now'}
        </Button>
      )
    }
    if (profile?.role === 'volunteer') {
      if (volunteerApplicationStatus === 'pending') {
        return <Button variant="outline-dark" className="w-full" disabled>Application Pending</Button>
      }
      if (volunteerApplicationStatus === 'approved') {
        return <Button variant="outline-dark" className="w-full bg-green-800 border-green-700" disabled>Application Approved</Button>
      }
      if (volunteerApplicationStatus === 'rejected') {
        return <Button variant="outline-dark" className="w-full bg-red-800 border-red-700" disabled>Application Rejected</Button>
      }
      return (
        <Button variant="primary-dark" className="w-full" onClick={handleApplyToVolunteer} isLoading={isApplying}>
          {isApplying ? 'Submitting...' : 'Apply to Volunteer'}
        </Button>
      )
    }
    return null;
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner size="lg" /></div>
  }

  if (!event) {
    return <div className="text-center text-gray-400">Event not found.</div>
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost-dark" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Events
      </Button>

      {event.banner_url && (
        <img src={event.banner_url} alt={event.title} className="w-full h-64 md:h-96 object-cover rounded-lg" />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h1 className="text-4xl font-bold text-white">{event.title}</h1>
          <p className="text-gray-300">{event.description}</p>
        </div>
        <div className="space-y-4">
          <Card>
            <div className="space-y-3">
              <div className="flex items-center"><Calendar className="w-5 h-5 mr-3 text-gray-400" /> <span className="text-white">{new Date(event.date_time).toLocaleString()}</span></div>
              <div className="flex items-center"><MapPin className="w-5 h-5 mr-3 text-gray-400" /> <span className="text-white">{event.venue}</span></div>
              <div className="flex items-center"><Users className="w-5 h-5 mr-3 text-gray-400" /> <span className="text-white">{event.available_seats} / {event.capacity} seats available</span></div>
              {profile?.role === 'attendee' && <div className="flex items-center"><DollarSign className="w-5 h-5 mr-3 text-gray-400" /> <span className="text-white text-xl font-bold">{event.price > 0 ? `$${event.price.toFixed(2)}` : 'Free'}</span></div>}
              {profile?.role === 'volunteer' && <div className="flex items-center"><Handshake className="w-5 h-5 mr-3 text-gray-400" /> <span className="text-white">Volunteer Opportunity</span></div>}
            </div>
            <div className="mt-6">
              {renderActionButtons()}
            </div>
          </Card>
          <Card>
            <h3 className="font-bold text-white mb-2">Organizer</h3>
            <p className="text-gray-400">{event.organizer?.full_name}</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
