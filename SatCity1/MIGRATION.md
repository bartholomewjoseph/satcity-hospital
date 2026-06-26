# Store.tsx — Mock → Real Supabase Migration

## What changed

The store (`src/lib/store.tsx`) has been rewritten to talk to your real Supabase database. **All consumer code (pages, dashboards, components) keeps working unchanged** — the store joins data internally so `patient.full_name`, `doctor.specialty`, etc. still work.

## ✅ What's wired up

| Feature | Status |
|---|---|
| `login(email, password)` | ✅ Real Supabase Auth |
| `logout()` | ✅ Real sign out |
| `registerUser({...})` | ✅ Creates auth user + trigger auto-creates profile row |
| `toggleUserActive(id)` | ✅ UPDATE on `users.is_active` |
| `deleteUser(id)` | ✅ Super-Admin only (enforced in code + RLS) |
| `updateDoctorStatus(id, status)` | ✅ UPDATE on `doctors.availability_status` |
| `uploadLabResult(r)` | ✅ INSERT into `lab_results` → webhook fires `assign-patient-to-doctor` |
| `addTreatment(t)` | ✅ INSERT into `treatments` |
| `bookAmbulance(b)` | ✅ INSERT into `ambulance_bookings` |
| `submitEmergency(b)` | ✅ INSERT into `emergency_requests` → webhook fires `notify-emergency-admins` |
| `addDrug(d)` / `updateDrugQty(id, qty)` | ✅ INSERT/UPDATE on `drug_inventory` |
| `markNotificationRead(id)` | ✅ UPDATE on `notifications.is_read` |
| `acceptEmergency(notifId, doctorId)` | ✅ Calls `accept-emergency-patient` edge function |
| **Realtime** | ✅ All tables subscribed — updates push to all clients |
| **Backward compatibility** | ✅ Same hook names (`useHospital`, `useStore`), same field shapes |

## 📁 Files changed

| File | Change |
|---|---|
| `src/lib/store.tsx` | **Complete rewrite** — Supabase-backed |
| `src/lib/supabaseClient.ts` | **New** — typed client + all row types |
| `src/vite-env.d.ts` | **New** — TypeScript types for `import.meta.env` |
| `src/pages/public.tsx` | `registerUser` now async |
| `supabase/auth-trigger.sql` | **New** — run once in SQL Editor |

## 🔧 Steps to finish setup

### 1. Install Supabase client (if you haven't)
```bash
npm install @supabase/supabase-js
```

### 2. Run the auth trigger SQL
Open Supabase Dashboard → SQL Editor → paste contents of `supabase/auth-trigger.sql` → **Run**.

This creates a trigger so every time someone signs up through Supabase Auth, a profile row is automatically created in `public.users` (plus a row in `doctors` or `patients` depending on role).

### 3. Create `.env.local`
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key...
```

### 4. Create your first Super Admin
The trigger sets `is_active=true` for `super_admin` role automatically. Sign up through the portal:

1. Go to `/login/portal/staff`
2. Register with role = **not applicable** — wait, staff portal doesn't have `super_admin` option.

**Use SQL Editor instead** to create your first super admin:

```sql
-- 1. Create auth user via SQL (or use Supabase Auth dashboard)
-- Simpler: go to Authentication → Users → Add user → enter email + password
-- 2. Then insert the profile row:
insert into public.users (id, full_name, email, role, is_active)
values (
  '<user-id-from-auth-dashboard>',
  'Your Name',
  'you@satcity.com',
  'super_admin',
  true
);
```

Get the `<user-id>` from **Supabase Dashboard → Authentication → Users**.

### 5. Deploy the 4 edge functions (if you haven't)
```bash
supabase functions deploy assign-patient-to-doctor
supabase functions deploy accept-emergency-patient
supabase functions deploy check-available-doctors
supabase functions deploy notify-emergency-admins
```

### 6. Create the 3 database webhooks
**Supabase Dashboard → Database → Webhooks → New webhook**:

| Name | Table | Event | Function |
|---|---|---|---|
| `on-lab-result-insert` | `lab_results` | INSERT | `assign-patient-to-doctor` |
| `on-doctor-status-change` | `doctors` | UPDATE | `check-available-doctors` |
| `on-emergency-request` | `emergency_requests` | INSERT | `notify-emergency-admins` |

### 7. Run the app
```bash
npm run dev
```

## 🔄 Demo-mode fallback

The store has a **smart fallback**: if you call `login(email)` without a password (like the demo accounts do), it uses the old in-memory user list. This means:

- ✅ Demo accounts (`super@satcity.com`, `emeka@satcity.com`, etc.) still work via click-to-autofill
- ✅ Real users sign up with password → go through Supabase Auth

When you're ready to remove demo mode entirely, delete the no-password branch in the `login` function.

## 🐛 Troubleshooting

| Problem | Fix |
|---|---|
| `Missing Supabase env vars` error | `.env.local` not in project root, or missing keys |
| Login fails with "invalid credentials" | User doesn't exist in `auth.users` — create via dashboard |
| Login works but dashboard is empty | Trigger from `auth-trigger.sql` didn't fire → run it |
| `deleteUser` doesn't work | Only `super_admin` role can delete; check user's `role` column |
| Realtime not updating | Verify publication in **Database → Replication** |

## 📝 Using the hook

```tsx
// Either name works
import { useHospital } from "@/lib/store";
// or
import { useStore } from "@/lib/store";

function MyComponent() {
  const { currentUser, patients, login, logout } = useHospital();
  // ...
}
```
