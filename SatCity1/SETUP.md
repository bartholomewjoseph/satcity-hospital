# SatCity Hospital — Full Stack Setup Guide

From empty folder → running production-ready hospital platform.

---

## Part 1: Create the Supabase Project (Database)

### Step 1 — Sign up for Supabase

1. Go to **https://supabase.com** and sign up (free tier is generous)
2. Click **"New Project"**
3. Fill in:
   - **Name:** `satcity-hospital`
   - **Database password:** (save this somewhere — you'll need it)
   - **Region:** Pick closest to your users (e.g. West Africa → `eu-west-1` or `us-east-1`)
4. Click **Create new project** (takes ~60 seconds)

### Step 2 — Run the database schema

1. In your project dashboard, click **SQL Editor** (left sidebar)
2. Click **New query**
3. Copy the entire contents of `supabase/schema.sql` from this project
4. Paste it into the SQL editor
5. Click **Run** (or press Ctrl+Enter)
6. You should see "Success. No rows returned"

### Step 3 — Get your API keys

1. Go to **Settings → API** (left sidebar)
2. You need three values:
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon public key:** starts with `eyJ...` (this is your `SUPABASE_ANON_KEY`)
   - **service_role key:** starts with `eyJ...` (this is your `SUPABASE_SERVICE_ROLE_KEY` — NEVER put this in frontend code)

### Step 4 — Enable realtime

1. Go to **Database → Replication**
2. Make sure the `notifications`, `emergency_requests`, and `ambulance_bookings` tables have the "Realtime" toggle ON (the schema already did this)

---

## Part 2: Deploy the Edge Functions

You need the Supabase CLI installed:

```bash
npm install -g supabase
```

### Step 1 — Log in to Supabase CLI

```bash
supabase login
```

This opens your browser — authorize the CLI.

### Step 2 — Link your project

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

Find your project ref in the Supabase dashboard URL:
`https://supabase.com/dashboard/project/xxxxxxxxxxxxx`
↑ That long string is your project ref.

### Step 3 — Deploy the four edge functions

```bash
supabase functions deploy assign-patient-to-doctor
supabase functions deploy accept-emergency-patient
supabase functions deploy check-available-doctors
supabase functions deploy notify-emergency-admins
```

### Step 4 — Set the service role secret for the functions

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
supabase secrets set SUPABASE_URL=https://xxxxx.supabase.co
```

### Step 5 — Create database webhooks to trigger them

In Supabase dashboard → **Database → Webhooks** → **New webhook**:

| Webhook name | Table | Event | Function |
|---|---|---|---|
| `on-lab-result-insert` | `lab_results` | INSERT | `assign-patient-to-doctor` |
| `on-doctor-status-change` | `doctors` | UPDATE | `check-available-doctors` |
| `on-emergency-request` | `emergency_requests` | INSERT | `notify-emergency-admins` |

The `accept-emergency-patient` function is called directly via HTTP POST from the doctor dashboard (no webhook needed).

---

## Part 3: Connect the Frontend

### Step 1 — Install the Supabase JS client

```bash
npm install @supabase/supabase-js
```

### Step 2 — Create `.env.local` in the project root

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key-here...
```

⚠️ **NEVER commit `.env.local` to git** — it's already in `.gitignore`.

### Step 3 — Create the Supabase client file

Create `src/lib/supabase.ts`:

```ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Step 4 — Generate TypeScript types from your schema

```bash
supabase gen types typescript --linked > src/lib/database.types.ts
```

This gives you full type safety for every table.

### Step 5 — Replace mock store calls with real Supabase

Example — replacing `login()`:

```ts
// Before (mock):
login: (email) => { ... }

// After (real):
login: async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  // Fetch user profile
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", data.user.id)
    .single();
  setState(s => ({ ...s, currentUser: profile }));
}
```

---

## Part 4: Run the Frontend Locally

```bash
npm install
npm run dev
```

Open http://localhost:5173

---

## Part 5: Deploy to Production

### Option A: Vercel (recommended, free)

1. Push your code to GitHub
2. Go to https://vercel.com → **New Project**
3. Import your GitHub repo
4. Add the env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in the Vercel dashboard
5. Click **Deploy**

### Option B: Netlify

1. Same as Vercel — import repo, add env vars, deploy

---

## Sanity CMS Setup (for Drug Catalog)

### Step 1 — Create Sanity project

```bash
npm create sanity@latest satcity-drugs
cd satcity-drugs
sanity start
```

### Step 2 — Define the drug schema

In `schemas/drug.ts`:

```ts
export default {
  name: 'drug',
  title: 'Drug',
  type: 'document',
  fields: [
    { name: 'drug_name', title: 'Drug name', type: 'string' },
    { name: 'category', title: 'Category', type: 'string' },
    { name: 'description', title: 'Description', type: 'text' },
    { name: 'usage', title: 'Usage instructions', type: 'text' },
    { name: 'side_effects', title: 'Side effects', type: 'text' },
  ]
}
```

### Step 3 — Sync Sanity → Supabase on publish

In `sanity.config.ts`, add a webhook that fires on `document.publish` and hits your own API route which writes to `drug_inventory` in Supabase.

Or simpler: use Sanity's built-in webhook feature at **sanity.io/manage → Webhooks**.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `vite is not recognized` | Run `npm install` first; on Windows run terminal as admin |
| `RLS policy violation` | Check user's role in `users` table; ensure they're `is_active=true` |
| Edge function times out | Check logs in Supabase dashboard → **Functions → Logs** |
| CORS errors | Add your domain in Supabase → **Authentication → URL Configuration** |
| Realtime not firing | Ensure publication enabled in **Database → Replication** |

---

## What happens when you create a user?

1. Frontend calls `supabase.auth.signUp({ email, password })`
2. Supabase Auth creates row in `auth.users` (internal)
3. Your code inserts a row in `public.users` with `id = auth.users.id`
4. Staff users get `is_active=false` (requires admin approval)
5. Patient users get `is_active=true` (auto-approved)

When admin activates a staff user → they flip `is_active=true` → staff can log in.

---

## File structure summary

```
satcity-hospital/
├── supabase/
│   ├── schema.sql                              ← Run in Supabase SQL editor
│   └── functions/
│       ├── assign-patient-to-doctor/index.ts   ← Deployed
│       ├── accept-emergency-patient/index.ts   ← Deployed
│       ├── check-available-doctors/index.ts    ← Deployed
│       └── notify-emergency-admins/index.ts    ← Deployed
├── src/
│   ├── lib/
│   │   ├── supabase.ts                         ← Your client (to create)
│   │   └── database.types.ts                   ← Generated
│   ├── pages/ ...
│   └── components/ ...
├── .env.local                                  ← Your keys (git-ignored)
└── SETUP.md                                    ← This file
```

---

## Quick checklist

- [ ] Supabase project created
- [ ] `supabase/schema.sql` executed
- [ ] API keys copied to `.env.local`
- [ ] Supabase CLI installed & logged in
- [ ] All 4 edge functions deployed
- [ ] All 3 webhooks created
- [ ] `@supabase/supabase-js` installed
- [ ] Mock store replaced with real Supabase calls
- [ ] Tested locally (`npm run dev`)
- [ ] Deployed to Vercel
