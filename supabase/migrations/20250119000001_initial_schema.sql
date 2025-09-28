/*
# Event Management System Database Schema
This migration creates the complete database structure for the event management system with support for organizers, volunteers, and attendees.

## Query Description: 
Creates the foundational tables for user profiles, events, bookings, and volunteer assignments. Establishes proper relationships and constraints to ensure data integrity. Sets up Row Level Security policies for secure multi-tenant access.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "High"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- profiles: User profile information linked to auth.users
- events: Event details created by organizers
- bookings: Attendee registrations for events
- volunteer_assignments: Volunteer task assignments
- tasks: Volunteer tasks for events

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes
- Auth Requirements: All tables require authentication

## Performance Impact:
- Indexes: Added for foreign keys and common queries
- Triggers: Profile creation trigger on auth.users
- Estimated Impact: Minimal performance impact
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('organizer', 'volunteer', 'attendee');
CREATE TYPE event_status AS ENUM ('draft', 'published', 'cancelled', 'completed');
CREATE TYPE booking_status AS ENUM ('confirmed', 'cancelled', 'checked_in');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed');

-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'attendee',
  company TEXT,
  skills TEXT[],
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organizer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  venue TEXT NOT NULL,
  date_time TIMESTAMP WITH TIME ZONE NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  banner_url TEXT,
  status event_status DEFAULT 'draft',
  price DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table
CREATE TABLE bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  attendee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status booking_status DEFAULT 'confirmed',
  seat_number TEXT,
  booking_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  check_in_time TIMESTAMP WITH TIME ZONE,
  feedback TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, attendee_id)
);

-- Tasks table
CREATE TABLE tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assigned_role TEXT,
  status task_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Volunteer assignments table
CREATE TABLE volunteer_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  volunteer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  shift_start TIMESTAMP WITH TIME ZONE,
  shift_end TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, volunteer_id, task_id)
);

-- Create indexes for better performance
CREATE INDEX idx_events_organizer_id ON events(organizer_id);
CREATE INDEX idx_events_date_time ON events(date_time);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_bookings_event_id ON bookings(event_id);
CREATE INDEX idx_bookings_attendee_id ON bookings(attendee_id);
CREATE INDEX idx_volunteer_assignments_event_id ON volunteer_assignments(event_id);
CREATE INDEX idx_volunteer_assignments_volunteer_id ON volunteer_assignments(volunteer_id);

-- Function to handle profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'attendee')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_assignments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Events policies
CREATE POLICY "Anyone can view published events" ON events
  FOR SELECT USING (status = 'published' OR organizer_id = auth.uid());

CREATE POLICY "Organizers can create events" ON events
  FOR INSERT WITH CHECK (organizer_id = auth.uid());

CREATE POLICY "Organizers can update their own events" ON events
  FOR UPDATE USING (organizer_id = auth.uid());

CREATE POLICY "Organizers can delete their own events" ON events
  FOR DELETE USING (organizer_id = auth.uid());

-- Bookings policies
CREATE POLICY "Users can view their own bookings" ON bookings
  FOR SELECT USING (attendee_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM events WHERE events.id = bookings.event_id AND events.organizer_id = auth.uid()));

CREATE POLICY "Attendees can create bookings" ON bookings
  FOR INSERT WITH CHECK (attendee_id = auth.uid());

CREATE POLICY "Users can update their own bookings" ON bookings
  FOR UPDATE USING (attendee_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM events WHERE events.id = bookings.event_id AND events.organizer_id = auth.uid()));

-- Tasks policies
CREATE POLICY "Users can view tasks for their events" ON tasks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = tasks.event_id AND events.organizer_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM volunteer_assignments WHERE volunteer_assignments.task_id = tasks.id AND volunteer_assignments.volunteer_id = auth.uid())
  );

CREATE POLICY "Organizers can manage tasks for their events" ON tasks
  FOR ALL USING (EXISTS (SELECT 1 FROM events WHERE events.id = tasks.event_id AND events.organizer_id = auth.uid()));

-- Volunteer assignments policies
CREATE POLICY "Users can view their assignments" ON volunteer_assignments
  FOR SELECT USING (
    volunteer_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM events WHERE events.id = volunteer_assignments.event_id AND events.organizer_id = auth.uid())
  );

CREATE POLICY "Organizers can manage volunteer assignments" ON volunteer_assignments
  FOR ALL USING (EXISTS (SELECT 1 FROM events WHERE events.id = volunteer_assignments.event_id AND events.organizer_id = auth.uid()));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
