/*
# [Fix] Update New User Trigger

This migration updates the `handle_new_user` function to be more robust. It adds default values for `full_name` and `role` to prevent insertion errors if these values are missing from the user's metadata during signup. This resolves the "Database error saving new user" issue.

## Query Description: [This operation modifies a database function to improve its error handling. It is a safe, non-destructive change and has no impact on existing user data. It only affects the creation of new users.]

## Metadata:
- Schema-Category: ["Safe"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Function modified: `public.handle_new_user()`

## Security Implications:
- RLS Status: [No Change]
- Policy Changes: [No]
- Auth Requirements: [None]

## Performance Impact:
- Indexes: [No Change]
- Triggers: [No Change]
- Estimated Impact: [None]
*/

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    new.email,
    new.raw_user_meta_data->>'phone',
    coalesce((new.raw_user_meta_data->>'role'), 'attendee')::public.user_role
  );
  return new;
end;
$$;
