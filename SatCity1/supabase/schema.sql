-- ============================================================================
-- SatCity Hospital — Full PostgreSQL Schema + Row Level Security (RLS)
-- Run this in the Supabase SQL editor (supabase.com/dashboard → SQL Editor)
-- ============================================================================

-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. TABLES
-- ============================================================================

-- DEPARTMENTS
create table public.departments (
  id          text primary key,
  name        text not null,
  admin_id    uuid,
  created_at  timestamptz default now()
);

-- USERS (core table — auth.users is separate in Supabase, this is our profile table)
create table public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text not null,
  email         text not null unique,
  role          text not null check (role in ('super_admin','admin','doctor','lab_tech','pharmacist','patient')),
  department_id text references public.departments(id),
  is_active     boolean not null default false,
  created_at    timestamptz default now()
);

-- DOCTORS (extends users for clinical staff)
create table public.doctors (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid unique not null references public.users(id) on delete cascade,
  specialty             text[] not null default '{}',
  availability_status   text not null default 'off_duty'
                        check (availability_status in ('available','busy','off_duty')),
  bio                   text,
  active_patient_count  int not null default 0
);

-- PATIENTS (extends users for patients)
create table public.patients (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid unique not null references public.users(id) on delete cascade,
  date_of_birth       date not null,
  blood_type          text not null,
  emergency_contact   text,
  address             text,
  symptoms            jsonb not null default '[]'::jsonb,
  external_reports    jsonb not null default '[]'::jsonb
);

-- LAB RESULTS
create table public.lab_results (
  id                  uuid primary key default uuid_generate_v4(),
  patient_id          uuid not null references public.patients(id) on delete cascade,
  technician_id       uuid not null references public.users(id),
  diagnosed_condition text not null,
  result_file_url     text not null,
  uploaded_at         timestamptz default now()
);

-- TREATMENTS
create table public.treatments (
  id                  uuid primary key default uuid_generate_v4(),
  patient_id          uuid not null references public.patients(id) on delete cascade,
  doctor_id           uuid not null references public.users(id),
  illness_type        text not null,
  treatment_details   text not null,
  basis_type          text not null check (basis_type in ('lab_confirmed','doctor_experience','external_report')),
  administered_at     timestamptz default now()
);

-- PATIENT-DOCTOR ASSIGNMENTS
create table public.patient_doctor_assignments (
  id          uuid primary key default uuid_generate_v4(),
  patient_id  uuid not null references public.patients(id) on delete cascade,
  doctor_id   uuid not null references public.doctors(id) on delete cascade,
  assigned_at timestamptz default now(),
  status      text not null default 'active' check (status in ('active','resolved'))
);

-- AMBULANCE BOOKINGS
create table public.ambulance_bookings (
  id                uuid primary key default uuid_generate_v4(),
  patient_id        uuid references public.users(id) on delete set null,
  patient_name      text not null,
  type              text not null check (type in ('scheduled','emergency')),
  pickup_location   text not null,
  destination       text not null,
  scheduled_time    timestamptz not null,
  reason            text,
  caller_name       text,
  description       text,
  status            text not null default 'Pending'
                    check (status in ('Pending','Confirmed','En Route','Completed','Handled')),
  is_resolved       boolean default false,
  handled_by        uuid,
  created_at        timestamptz default now()
);

-- DRUG INVENTORY (synced with Sanity CMS)
create table public.drug_inventory (
  id              uuid primary key default uuid_generate_v4(),
  sanity_drug_id  text not null unique,
  drug_name       text not null,
  category        text,
  description     text,
  usage           text,
  side_effects    text,
  quantity        int not null default 0,
  status          text not null default 'available'
                  check (status in ('available','low','out_of_stock')),
  updated_at      timestamptz default now()
);

-- NOTIFICATIONS
create table public.notifications (
  id                 uuid primary key default uuid_generate_v4(),
  recipient_id       uuid not null references public.users(id) on delete cascade,
  type               text not null check (type in ('assignment','emergency_available_patient','emergency_request')),
  message            text not null,
  specialty_context  text,
  patient_id         uuid,
  is_read            boolean default false,
  is_resolved        boolean default false,
  created_at         timestamptz default now()
);

-- EMERGENCY REQUESTS (public form)
create table public.emergency_requests (
  id          uuid primary key default uuid_generate_v4(),
  caller_name text,
  location    text not null,
  description text,
  created_at  timestamptz default now(),
  handled_by  uuid references public.users(id),
  is_resolved boolean default false
);

-- ============================================================================
-- 2. ROW LEVEL SECURITY (RLS)
-- ============================================================================

alter table public.users enable row level security;
alter table public.departments enable row level security;
alter table public.doctors enable row level security;
alter table public.patients enable row level security;
alter table public.lab_results enable row level security;
alter table public.treatments enable row level security;
alter table public.patient_doctor_assignments enable row level security;
alter table public.ambulance_bookings enable row level security;
alter table public.drug_inventory enable row level security;
alter table public.notifications enable row level security;
alter table public.emergency_requests enable row level security;

-- Helper: get current user's role
create or replace function public.current_user_role()
returns text
language sql
security definer
as $$
  select role from public.users where id = auth.uid()
$$;

-- Helper: get current user's department
create or replace function public.current_user_department()
returns text
language sql
security definer
as $$
  select department_id from public.users where id = auth.uid()
$$;

-- ===================== USERS =====================
-- Patients: see only themselves
create policy "Patients see self"
  on public.users for select
  using (id = auth.uid());

-- Staff: see users in their department (admins) OR everyone (super admin)
create policy "Super admin sees all users"
  on public.users for select
  using (public.current_user_role() = 'super_admin');

create policy "Admin sees department users"
  on public.users for select
  using (
    public.current_user_role() = 'admin'
    and (department_id = public.current_user_department() or role = 'patient')
  );

-- Doctors, lab techs, pharmacists: read-only patient list
create policy "Staff sees patient profiles"
  on public.users for select
  using (public.current_user_role() in ('doctor','lab_tech','pharmacist') and role = 'patient');

-- Insert: only admins can create new users
create policy "Admins create users"
  on public.users for insert
  with check (public.current_user_role() in ('super_admin','admin'));

-- Update: super admin full, admin scoped
create policy "Super admin updates users"
  on public.users for update
  using (public.current_user_role() = 'super_admin');

create policy "Admin updates own department"
  on public.users for update
  using (
    public.current_user_role() = 'admin'
    and department_id = public.current_user_department()
  );

-- Delete: ONLY super admin
create policy "Only super admin deletes users"
  on public.users for delete
  using (public.current_user_role() = 'super_admin');

-- ===================== PATIENTS =====================
create policy "Patients see own profile"
  on public.patients for select
  using (user_id = auth.uid());

create policy "Staff sees patient records"
  on public.patients for select
  using (public.current_user_role() in ('super_admin','admin','doctor','lab_tech'));

create policy "Admins insert patients"
  on public.patients for insert
  with check (public.current_user_role() in ('super_admin','admin'));

-- ===================== DOCTORS =====================
create policy "All authenticated see doctors"
  on public.doctors for select
  using (auth.role() = 'authenticated');

create policy "Only admins insert doctors"
  on public.doctors for insert
  with check (public.current_user_role() in ('super_admin','admin'));

create policy "Doctors update own status"
  on public.doctors for update
  using (user_id = auth.uid());

-- ===================== LAB RESULTS =====================
create policy "Patients see own labs"
  on public.lab_results for select
  using (patient_id in (select id from public.patients where user_id = auth.uid()));

create policy "Doctors see assigned patient labs"
  on public.lab_results for select
  using (
    patient_id in (
      select patient_id from public.patient_doctor_assignments
      where doctor_id in (select id from public.doctors where user_id = auth.uid())
      and status = 'active'
    )
  );

create policy "Lab techs insert results"
  on public.lab_results for insert
  with check (public.current_user_role() = 'lab_tech' and technician_id = auth.uid());

-- ===================== TREATMENTS =====================
create policy "Patients see own treatments"
  on public.treatments for select
  using (patient_id in (select id from public.patients where user_id = auth.uid()));

create policy "Doctors manage assigned treatments"
  on public.treatments for all
  using (
    patient_id in (
      select patient_id from public.patient_doctor_assignments
      where doctor_id in (select id from public.doctors where user_id = auth.uid())
    )
  );

-- ===================== DRUG INVENTORY =====================
create policy "All authenticated read drugs"
  on public.drug_inventory for select
  using (auth.role() = 'authenticated');

create policy "Pharmacists manage drugs"
  on public.drug_inventory for all
  using (public.current_user_role() in ('pharmacist','super_admin'));

-- ===================== AMBULANCE BOOKINGS =====================
create policy "Public inserts emergency"
  on public.emergency_requests for insert
  with check (true);

create policy "Patients see own bookings"
  on public.ambulance_bookings for select
  using (patient_id = auth.uid());

create policy "Admins manage bookings"
  on public.ambulance_bookings for all
  using (public.current_user_role() in ('super_admin','admin'));

-- ===================== NOTIFICATIONS =====================
create policy "Users see own notifications"
  on public.notifications for all
  using (recipient_id = auth.uid());

-- ============================================================================
-- 3. REALTIME ENABLEMENT (for Supabase Realtime broadcast)
-- ============================================================================

alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.emergency_requests;
alter publication supabase_realtime add table public.ambulance_bookings;

-- ============================================================================
-- 4. INDEXES (performance)
-- ============================================================================

create index idx_users_role on public.users(role);
create index idx_users_department on public.users(department_id);
create index idx_notifications_recipient on public.notifications(recipient_id, is_read);
create index idx_lab_results_patient on public.lab_results(patient_id);
create index idx_assignments_doctor on public.patient_doctor_assignments(doctor_id, status);

-- ============================================================================
-- 5. STORAGE BUCKET (for lab result files)
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('lab-results', 'lab-results', false)
on conflict (id) do nothing;

-- RLS for storage
create policy "Lab techs upload results"
  on storage.objects for insert
  with check (bucket_id = 'lab-results' and auth.role() = 'authenticated');

create policy "Authorized users download results"
  on storage.objects for select
  using (bucket_id = 'lab-results' and auth.role() = 'authenticated');

-- ============================================================================
-- 6. SEED DATA (optional — super admin bootstrap)
-- ============================================================================

-- After running this schema, manually create the super admin user via
-- Supabase Auth dashboard, then insert their profile row into `users`
-- with role='super_admin' and is_active=true. From there, the super admin
-- can create all other users via the platform UI.
