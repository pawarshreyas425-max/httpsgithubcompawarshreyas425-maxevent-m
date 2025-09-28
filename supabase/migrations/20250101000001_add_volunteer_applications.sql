/*
# [Feature] Add Volunteer Applications Table
This migration introduces a new table `volunteer_applications` to manage requests from volunteers to participate in events. It links volunteers (from `profiles`) to `events` and tracks the status of their application.

## Query Description:
This script creates the `volunteer_applications` table and sets up Row-Level Security (RLS) to ensure data privacy and correct access control.
- **Data Impact:** No existing data is affected as this is a new table.
- **Risks:** None, as it's an additive change.
- **Precautions:** N/A.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (The table can be dropped)

## Structure Details:
- **Table Created:** `public.volunteer_applications`
- **Columns:** `id`, `event_id`, `volunteer_id`, `status`, `created_at`
- **Constraints:** Foreign keys to `events` and `profiles`.
- **Indexes:** Primary key on `id`, and indexes on `event_id` and `volunteer_id`.

## Security Implications:
- **RLS Status:** Enabled on the new table.
- **Policy Changes:** Yes, new policies are created for the `volunteer_applications` table to control access for volunteers and organizers.
  - Volunteers can manage their own applications.
  - Organizers can view and manage applications for events they own.
- **Auth Requirements:** Policies are based on `auth.uid()`.

## Performance Impact:
- **Indexes:** Added on foreign key columns (`event_id`, `volunteer_id`) to ensure efficient querying.
- **Triggers:** None.
- **Estimated Impact:** Low. The impact is limited to queries involving this new table.
*/

-- 1. Create the volunteer application status type if it doesn't exist
do $$
begin
  if not exists (select 1 from pg_type where typname = 'volunteer_application_status') then
    create type public.volunteer_application_status as enum ('pending', 'approved', 'rejected');
  end if;
end$$;

-- 2. Create the volunteer_applications table
create table if not exists public.volunteer_applications (
  id uuid not null default gen_random_uuid() primary key,
  event_id uuid not null references public.events(id) on delete cascade,
  volunteer_id uuid not null references public.profiles(id) on delete cascade,
  status public.volunteer_application_status not null default 'pending',
  created_at timestamp with time zone not null default now(),
  
  -- A volunteer can only apply to an event once
  unique (event_id, volunteer_id)
);

-- 3. Add comments to the table and columns
comment on table public.volunteer_applications is 'Tracks volunteer applications for events.';
comment on column public.volunteer_applications.status is 'The status of the volunteer''s application (pending, approved, or rejected).';

-- 4. Create indexes for performance
create index if not exists on public.volunteer_applications (event_id);
create index if not exists on public.volunteer_applications (volunteer_id);

-- 5. Enable Row-Level Security
alter table public.volunteer_applications enable row level security;

-- 6. Create RLS policies
drop policy if exists "Volunteers can view their own applications" on public.volunteer_applications;
create policy "Volunteers can view their own applications"
on public.volunteer_applications for select
using (auth.uid() = volunteer_id);

drop policy if exists "Volunteers can create applications for themselves" on public.volunteer_applications;
create policy "Volunteers can create applications for themselves"
on public.volunteer_applications for insert
with check (auth.uid() = volunteer_id);

drop policy if exists "Volunteers can cancel their pending applications" on public.volunteer_applications;
create policy "Volunteers can cancel their pending applications"
on public.volunteer_applications for delete
using (auth.uid() = volunteer_id and status = 'pending');

drop policy if exists "Organizers can view applications for their events" on public.volunteer_applications;
create policy "Organizers can view applications for their events"
on public.volunteer_applications for select
using (
  exists (
    select 1
    from public.events
    where events.id = volunteer_applications.event_id
      and events.organizer_id = auth.uid()
  )
);

drop policy if exists "Organizers can update application status for their events" on public.volunteer_applications;
create policy "Organizers can update application status for their events"
on public.volunteer_applications for update
using (
  exists (
    select 1
    from public.events
    where events.id = volunteer_applications.event_id
      and events.organizer_id = auth.uid()
  )
);
