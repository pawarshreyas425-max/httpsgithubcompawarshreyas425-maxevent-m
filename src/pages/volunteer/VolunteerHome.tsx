import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase, VolunteerApplication } from '../../lib/supabase'
import { Card } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { Button } from '../../components/ui/Button'
import { Handshake, CheckCircle, XCircle, Clock } from 'lucide-react'

type ApplicationWithEvent = VolunteerApplication & {
  event: {
    title: string
    date_time: string
  } | null
}

export function VolunteerHome() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<ApplicationWithEvent[]>([])

  useEffect(() => {
    if (profile) {
      fetchVolunteerData()
    }
  }, [profile])

  const fetchVolunteerData = async () => {
    if (!profile) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('volunteer_applications')
        .select('*, event:events(title, date_time)')
        .eq('volunteer_id', profile.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setApplications(data as ApplicationWithEvent[] || [])
    } catch (error) {
      console.error('Error fetching volunteer data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'approved': return { icon: CheckCircle, color: 'text-green-400', text: 'Approved' }
      case 'rejected': return { icon: XCircle, color: 'text-red-400', text: 'Rejected' }
      case 'pending': return { icon: Clock, color: 'text-yellow-400', text: 'Pending Review' }
      default: return { icon: Handshake, color: 'text-gray-400', text: 'Unknown' }
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner size="lg" /></div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">My Volunteer Applications</h2>
        {applications.length > 0 ? (
          <div className="space-y-4">
            {applications.map(app => {
              const StatusIcon = getStatusInfo(app.status).icon
              const statusColor = getStatusInfo(app.status).color
              const statusText = getStatusInfo(app.status).text
              return (
                <Card key={app.id}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-white text-lg">{app.event?.title}</h3>
                      <p className="text-sm text-gray-400">{new Date(app.event?.date_time || 0).toLocaleString()}</p>
                    </div>
                    <div className={`flex items-center gap-2 font-medium ${statusColor}`}>
                      <StatusIcon className="w-5 h-5" />
                      <span>{statusText}</span>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="text-center py-10">
            <Handshake className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">You haven't applied to any events yet.</p>
            <Link to="/events">
              <Button variant="primary-dark" className="mt-4">Browse Opportunities</Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  )
}
