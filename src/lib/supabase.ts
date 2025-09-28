import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type UserRole = 'organizer' | 'volunteer' | 'attendee'
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed'
export type BookingStatus = 'confirmed' | 'cancelled' | 'checked_in'
export type TaskStatus = 'pending' | 'in_progress' | 'completed'
export type ApplicationStatus = 'pending' | 'approved' | 'rejected'

export interface Profile {
  id: string
  email: string
  full_name: string
  phone?: string
  role: UserRole
  company?: string
  skills?: string[]
  avatar_url?: string
  preferences?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  organizer_id: string
  title: string
  description?: string
  venue: string
  date_time: string
  capacity: number
  category?: string
  banner_url?: string
  status: EventStatus
  price: number
  created_at: string
  updated_at: string
  organizer?: Profile
  bookings_count?: number
  available_seats?: number
}

export interface Booking {
  id: string
  event_id: string
  attendee_id: string
  status: BookingStatus
  seat_number?: string
  booking_date: string
  check_in_time?: string
  feedback?: string
  rating?: number
  created_at: string
  event?: Event
  attendee?: Profile
}

export interface Task {
  id: string
  event_id: string
  title: string
  description?: string
  assigned_role?: string
  status: TaskStatus
  created_at: string
  updated_at: string
}

export interface VolunteerAssignment {
  id: string
  event_id: string
  volunteer_id: string
  task_id?: string
  shift_start?: string
  shift_end?: string
  notes?: string
  created_at: string
  event?: Event
  task?: Task
  volunteer?: Profile
}

export interface VolunteerApplication {
  id: string
  event_id: string
  volunteer_id: string
  status: ApplicationStatus
  notes?: string
  created_at: string
  event?: Event
  volunteer?: Profile
}
