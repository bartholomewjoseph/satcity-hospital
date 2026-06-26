-- ============================================================================
-- Run this ONCE in Supabase SQL Editor after schema.sql
-- It creates a trigger that auto-creates a row in public.users whenever
-- a new row is added to auth.users (Supabase's internal auth table).
-- ============================================================================

-- Function that creates the public.users profile row
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, full_name, email, role, is_active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'patient'),
    case
      when coalesce(new.raw_user_meta_data->>'role', 'patient') in ('patient', 'super_admin')
      then true
      else false
    end
  );

  -- If this user is a doctor, also create their doctors row
  if coalesce(new.raw_user_meta_data->>'role', '') = 'doctor' then
    insert into public.doctors (user_id, specialty, bio, availability_status, active_patient_count)
    values (
      new.id,
      coalesce(string_to_array(new.raw_user_meta_data->>'specialty', ','), array['General']),
      coalesce(new.raw_user_meta_data->>'bio', ''),
      'off_duty',
      0
    );
  end if;

  -- If this user is a patient, also create their patients row
  if coalesce(new.raw_user_meta_data->>'role', '') = 'patient' then
    insert into public.patients (user_id, date_of_birth, blood_type, emergency_contact, address)
    values (
      new.id,
      coalesce((new.raw_user_meta_data->>'date_of_birth')::date, '2000-01-01'::date),
      coalesce(new.raw_user_meta_data->>'blood_type', 'O+'),
      coalesce(new.raw_user_meta_data->>'emergency_contact', ''),
      coalesce(new.raw_user_meta_data->>'address', '')
    );
  end if;

  return new;
end;
$$;

-- Trigger: fires after every INSERT into auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================================
-- Enable email confirmation to be OPTIONAL during development
-- (In production you'll want to turn this back ON)
-- ============================================================================
-- Run this in SQL Editor to skip email verification during testing:
-- update auth.users set email_confirmed_at = now() where email_confirmed_at is null;
