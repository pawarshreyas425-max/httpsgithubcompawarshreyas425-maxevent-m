import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { User, Save } from 'lucide-react'

export function ProfilePage() {
  const { profile, updateProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '', phone: profile?.phone || '', company: profile?.company || '',
    currentPassword: '', newPassword: '', confirmPassword: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    if (errors[e.target.name]) setErrors(prev => ({ ...prev, [e.target.name]: '' }))
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    try {
      await updateProfile({ full_name: formData.full_name, phone: formData.phone || null, company: formData.company || null })
      alert('Profile updated successfully!')
    } catch (error) {
      setErrors({ general: 'Failed to update profile' })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.newPassword !== formData.confirmPassword) { setErrors({ confirmPassword: 'Passwords do not match' }); return }
    if (formData.newPassword.length < 6) { setErrors({ newPassword: 'Password must be at least 6 characters' }); return }
    setLoading(true)
    setErrors({})
    try {
      alert('Password change functionality would be implemented with proper verification')
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }))
    } catch (error) { setErrors({ password: 'Failed to change password' }) } finally { setLoading(false) }
  }

  if (!profile) return <div className="flex justify-center items-center h-64"><LoadingSpinner size="lg" /></div>

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card>
        <div className="flex items-center mb-6">
          <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mr-4"><User className="w-8 h-8 text-gray-400" /></div>
          <div><h2 className="text-2xl font-bold text-white">Profile Information</h2><p className="text-gray-400">Update your account details</p></div>
        </div>
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Full Name" name="full_name" value={formData.full_name} onChange={handleChange} />
            <Input label="Email" type="email" value={profile.email} disabled className="bg-dark-700" />
            <Input label="Phone" name="phone" value={formData.phone} onChange={handleChange} />
            {profile.role === 'organizer' && <Input label="Company" name="company" value={formData.company} onChange={handleChange} />}
          </div>
          {errors.general && <div className="text-red-500 text-sm">{errors.general}</div>}
          <Button type="submit" variant="primary-dark" isLoading={loading} disabled={loading}><Save className="w-4 h-4 mr-2" />Save Changes</Button>
        </form>
      </Card>

      <Card>
        <h2 className="text-xl font-bold text-white mb-4">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Current Password" type="password" name="currentPassword" value={formData.currentPassword} onChange={handleChange} />
            <Input label="New Password" type="password" name="newPassword" value={formData.newPassword} onChange={handleChange} error={errors.newPassword} />
            <Input label="Confirm New Password" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} />
          </div>
          {errors.password && <div className="text-red-500 text-sm">{errors.password}</div>}
          <Button type="submit" variant="outline-dark" isLoading={loading} disabled={loading}>Change Password</Button>
        </form>
      </Card>
    </div>
  )
}
