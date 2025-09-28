import React, { useState, useEffect, useCallback } from 'react'
import { supabase, VolunteerApplication } from '../../lib/supabase'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { LoadingSpinner } from '../ui/LoadingSpinner'

interface ManageVolunteersModalProps {
  isOpen: boolean
  onClose: () => void
  eventId: string
  eventName: string
}

type ApplicationWithProfile = VolunteerApplication & {
  volunteer: {
    full_name: string
    email: string
  } | null
}

export function ManageVolunteersModal({ isOpen, onClose, eventId, eventName }: ManageVolunteersModalProps) {
  const [applications, setApplications] = useState<ApplicationWithProfile[]>([])
  const [loading, setLoading] = useState(true)

  const fetchApplications = useCallback(async () => {
    if (!eventId) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('volunteer_applications')
        .select(`*, volunteer:profiles(full_name, email)`)
        .eq('event_id', eventId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setApplications(data as ApplicationWithProfile[])
    } catch (error) {
      console.error('Error fetching volunteer applications:', error)
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    if (isOpen) {
      fetchApplications()
    }
  }, [isOpen, fetchApplications])

  const handleUpdateStatus = async (applicationId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('volunteer_applications')
        .update({ status })
        .eq('id', applicationId)

      if (error) throw error
      
      // This is a placeholder for sending an email.
      // For a real application, this should trigger a Supabase Edge Function.
      alert(`The volunteer's application has been ${status}. A notification would be sent.`)

      fetchApplications() // Refresh the list
    } catch (error) {
      console.error('Error updating application status:', error)
      alert('Failed to update status.')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-900 text-green-300'
      case 'rejected': return 'bg-red-900 text-red-300'
      case 'pending': return 'bg-yellow-900 text-yellow-300'
      default: return 'bg-gray-700 text-gray-300'
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Volunteer Applications for ${eventName}`} maxWidth="max-w-3xl">
      {loading ? (
        <div className="flex justify-center items-center h-48"><LoadingSpinner /></div>
      ) : applications.length > 0 ? (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          {applications.map(app => (
            <div key={app.id} className="p-4 bg-dark-700 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-bold text-white">{app.volunteer?.full_name}</p>
                <p className="text-sm text-gray-400">{app.volunteer?.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(app.status)}`}>
                  {app.status}
                </span>
                {app.status === 'pending' && (
                  <>
                    <Button size="sm" variant="outline-dark" className="border-green-600 text-green-400 hover:bg-green-900" onClick={() => handleUpdateStatus(app.id, 'approved')}>Approve</Button>
                    <Button size="sm" variant="outline-dark" className="border-red-600 text-red-400 hover:bg-red-900" onClick={() => handleUpdateStatus(app.id, 'rejected')}>Reject</Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 py-10">No volunteer applications for this event yet.</p>
      )}
    </Modal>
  )
}
