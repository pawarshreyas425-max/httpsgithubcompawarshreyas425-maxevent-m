import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

export function RegisterPage() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'attendee' as 'organizer' | 'volunteer' | 'attendee'
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.full_name.trim()) newErrors.full_name = 'Name is required'
    if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid'
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({}); // Clear previous errors
    if (!validateForm()) return
    setLoading(true)

    try {
      const { error } = await signUp(formData.email, formData.password, {
        full_name: formData.full_name,
        phone: formData.phone,
        role: formData.role
      })

      if (error) {
        setErrors({ general: error.message })
      } else {
        alert('Registration successful! Please check your email to confirm your account.')
        navigate('/login')
      }
    } catch (err: any) {
      setErrors({ general: err.message || 'An unexpected error occurred' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">Create Account</h2>
          <p className="mt-2 text-gray-400">Join EventHub today</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <Input label="Full Name" name="full_name" value={formData.full_name} onChange={handleChange} error={errors.full_name} placeholder="Enter your full name" />
            <Input label="Email" type="email" name="email" value={formData.email} onChange={handleChange} error={errors.email} placeholder="Enter your email" />
            <Input label="Phone (Optional)" type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Enter your phone number" />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-400">Role</label>
              <select name="role" value={formData.role} onChange={handleChange} className="w-full px-3 py-2 border rounded-md bg-dark-800 border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-white">
                <option value="attendee">Attendee</option>
                <option value="volunteer">Volunteer</option>
                <option value="organizer">Organizer</option>
              </select>
            </div>
            <Input label="Password" type="password" name="password" value={formData.password} onChange={handleChange} error={errors.password} placeholder="Enter your password" />
            <Input label="Confirm Password" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} placeholder="Confirm your password" />
          </div>

          {errors.general && <div className="text-red-500 text-sm text-center">{errors.general}</div>}

          <Button type="submit" variant="primary-dark" className="w-full" isLoading={loading} disabled={loading}>
            {loading ? <LoadingSpinner size="sm" /> : 'Create Account'}
          </Button>

          <div className="text-center">
            <div className="text-sm text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-white hover:underline font-medium">
                Login here
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
