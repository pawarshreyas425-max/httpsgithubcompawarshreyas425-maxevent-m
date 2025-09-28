/*
# [Fix] Correct Volunteer Applications Table Schema
This migration corrects syntax errors in the previous attempt to create the `volunteer_applications` table. Specifically, it assigns names to the indexes, which is required by PostgreSQL syntax.

## Query Description:
This script creates the `volunteer_applications` table to allow volunteers to apply for events. It includes columns for the application status, foreign keys to events and profiles, and enables Row Level Security with appropriate policies for volunteers and organizers. This operation is safe and will not affect existing data as it's creating a new table.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (the table can be dropped)

## Structure Details:
- Table: `public.volunteer_applications`
- Columns: `id`, `event_id`, `volunteer_id`, `status`, `notes`, `created_at`
- Indexes: `volunteer_applications_event_id_idx`, `volunteer_applications_volunteer_id_idx`, `volunteer_applications_event_volunteer_unique_idx`
- RLS Policies: Policies for SELECT, INSERT, UPDATE, DELETE for volunteers and organizers.

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes (New policies for the new table)
- Auth Requirements: Users must be authenticated.

## Performance Impact:
- Indexes: Added (on `event_id`, `volunteer_id`, and a unique composite key)
- Triggers: None
- Estimated Impact: Low. Indexes will improve query performance on the new table.
*/

-- Define application status enum
create type public.application_status as enum ('pending', 'approved', 'rejected');

-- Create the volunteer_applications table
create table if not exists public.volunteer_applications (
    id uuid not null default gen_random_uuid() primary key,
    event_id uuid not null references public.events(id) on delete cascade,
    volunteer_id uuid not null references public.profiles(id) on delete cascade,
    status public.application_status not null default 'pending',
    notes text,
    created_at timestamp with time zone not null default now()
);

-- Add comments to the table and columns
comment on table public.volunteer_applications is 'Tracks applications from volunteers for specific events.';
comment on column public.volunteer_applications.status is 'The current status of the volunteer application (pending, approved, rejected).';

-- Enable Row Level Security
alter table public.volunteer_applications enable row level security;

-- Create Indexes with explicit names
create index if not exists volunteer_applications_event_id_idx on public.volunteer_applications (event_id);
create index if not exists volunteer_applications_volunteer_id_idx on public.volunteer_applications (volunteer_id);
create unique index if not exists volunteer_applications_event_volunteer_unique_idx on public.volunteer_applications (event_id, volunteer_id);

-- RLS Policies
-- Volunteers can see their own applications.
create policy "Volunteers can view their own applications"
on public.volunteer_applications for select
to authenticated
using ( auth.uid() = volunteer_id );

-- Volunteers can create applications for themselves.
create policy "Volunteers can create their own applications"
on public.volunteer_applications for insert
to authenticated
with check ( auth.uid() = volunteer_id );

-- Volunteers can cancel (delete) their pending applications.
create policy "Volunteers can cancel pending applications"
on public.volunteer_applications for delete
to authenticated
using ( auth.uid() = volunteer_id and status = 'pending' );

-- Organizers can see all applications for their own events.
create policy "Organizers can view applications for their events"
on public.volunteer_applications for select
to authenticated
using (
  exists (
    select 1
    from public.events
    where events.id = volunteer_applications.event_id and events.organizer_id = auth.uid()
  )
);

-- Organizers can update the status of applications for their events.
create policy "Organizers can update application status for their events"
on public.volunteer_applications for update
to authenticated
using (
  exists (
    select 1
    from public.events
    where events.id = volunteer_applications.event_id and events.organizer_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.events
    where events.id = volunteer_applications.event_id and events.organizer_id = auth.uid()
  )
);
