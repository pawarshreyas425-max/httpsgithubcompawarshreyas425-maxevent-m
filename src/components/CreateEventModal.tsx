import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { supabase } from '../lib/supabase'

interface CreateEventModalProps {
  isOpen: boolean
  onClose: () => void
  onEventCreated: () => void
}

export function CreateEventModal({ isOpen, onClose, onEventCreated }: CreateEventModalProps) {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '', description: '', venue: '', date: '', time: '', capacity: '', category: '', price: '', banner_url: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    if (errors[e.target.name]) setErrors(prev => ({ ...prev, [e.target.name]: '' }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.venue.trim()) newErrors.venue = 'Venue is required'
    if (!formData.date) newErrors.date = 'Date is required'
    if (!formData.time) newErrors.time = 'Time is required'
    if (!formData.capacity || parseInt(formData.capacity) <= 0) newErrors.capacity = 'Capacity must be positive'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm() || !profile) return
    setLoading(true)

    try {
      const dateTime = new Date(`${formData.date}T${formData.time}`).toISOString()
      const { error } = await supabase.from('events').insert({
        organizer_id: profile.id, title: formData.title, description: formData.description || null,
        venue: formData.venue, date_time: dateTime, capacity: parseInt(formData.capacity),
        category: formData.category || null, price: parseFloat(formData.price || '0'),
        banner_url: formData.banner_url || null, status: 'published'
      })
      if (error) throw error
      setFormData({ title: '', description: '', venue: '', date: '', time: '', capacity: '', category: '', price: '', banner_url: '' })
      onEventCreated()
      onClose()
    } catch (error) {
      console.error('Error creating event:', error)
      setErrors({ general: 'Failed to create event.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Event" maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Event Title" name="title" value={formData.title} onChange={handleChange} error={errors.title} placeholder="Enter event title" />
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-400">Description</label>
          <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full px-3 py-2 border rounded-md bg-dark-800 border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white" placeholder="Describe your event..." />
        </div>
        <Input label="Venue" name="venue" value={formData.venue} onChange={handleChange} error={errors.venue} placeholder="Event location" />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Date" name="date" type="date" value={formData.date} onChange={handleChange} error={errors.date} />
          <Input label="Time" name="time" type="time" value={formData.time} onChange={handleChange} error={errors.time} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Capacity" name="capacity" type="number" min="1" value={formData.capacity} onChange={handleChange} error={errors.capacity} placeholder="Max attendees" />
          <Input label="Price ($)" name="price" type="number" min="0" step="0.01" value={formData.price} onChange={handleChange} placeholder="0.00" />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-400">Category</label>
          <select name="category" value={formData.category} onChange={handleChange} className="w-full px-3 py-2 border rounded-md bg-dark-800 border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-white">
            <option value="">Select category</option>
            <option value="Conference">Conference</option><option value="Workshop">Workshop</option><option value="Meetup">Meetup</option>
            <option value="Social">Social</option><option value="Sports">Sports</option><option value="Arts">Arts</option>
            <option value="Music">Music</option><option value="Other">Other</option>
          </select>
        </div>
        <Input label="Banner Image URL (Optional)" name="banner_url" type="url" value={formData.banner_url} onChange={handleChange} placeholder="https://example.com/image.jpg" />
        {errors.general && <div className="text-red-500 text-sm">{errors.general}</div>}
        <div className="flex space-x-3 pt-4">
          <Button type="button" variant="outline-dark" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" variant="primary-dark" isLoading={loading} disabled={loading} className="flex-1">{loading ? <LoadingSpinner size="sm" /> : 'Create Event'}</Button>
        </div>
      </form>
    </Modal>
  )
}
