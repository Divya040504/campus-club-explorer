# Campus Club Explorer

Campus Club Explorer is a web application designed to help students discover, explore, and engage with various campus clubs and organizations.

## Features

- **Club Directory:** Browse and filter campus clubs by category or interest.
- **Detailed Profiles:** View club details, meeting schedules, and contact info.
- **Interactive Interface:** Fast and responsive user experience built with React.

## Tech Stack

- **Frontend:** React, JavaScript, HTML5, CSS3
- **Build Tool:** Vite

## Local setup

1. Install Node.js 18 or newer.
2. Create a free project at [supabase.com](https://supabase.com).
3. In Supabase, open **Project settings → API** and copy the **Project URL** and the public **anon key**.
4. Copy `.env.example` to `.env.local` and replace both placeholder values:

   ```text
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-public-anon-key
   ```

5. Install dependencies and start the app:

   ```bash
   npm install
   npm run dev
   ```

`.env.local` is not committed. The anon key is designed for browser use, but never put a Supabase service-role key in the frontend.

The current first phase provides Supabase email/password registration, login, session persistence, and sign out. The database foundation for club requests, help desk contacts, roles, and event scheduling is included in the migration; the matching student and staff screens will be added next.

The core MVP now includes database-backed events. Students can browse the event calendar, club leads can create events for assigned clubs, and administrators can create or delete events. Supabase rejects overlapping events for the same venue and time range. Students also have direct email links for club contacts and general help desk support.

## Supabase database

The database schema is stored in [supabase/migrations/20261105170000_initial_schema.sql](./supabase/migrations/20261105170000_initial_schema.sql). After creating the Supabase project, open **SQL Editor**, paste the migration contents, and run it. This creates profiles, clubs, membership requests, help desk messages, events, role helpers, Row Level Security policies, and a database-level venue conflict constraint.

The migration uses `btree_gist` and a PostgreSQL exclusion constraint to reject overlapping events in the same venue. This protects scheduling even if events are created outside the frontend.

The starter club records are in [supabase/migrations/20261105192000_seed_clubs.sql](./supabase/migrations/20261105192000_seed_clubs.sql). Run this migration after the initial schema migration to populate the `clubs` table.

If Supabase reports `permission denied for table clubs`, run [supabase/migrations/20261105194000_grant_app_access.sql](./supabase/migrations/20261105194000_grant_app_access.sql) in the SQL Editor while signed-in users are present in the app.

The administrator dashboard also requires [supabase/migrations/20261105215000_grant_admin_updates.sql](./supabase/migrations/20261105215000_grant_admin_updates.sql) so authenticated requests can reach the existing admin-only update policies for profiles and clubs.

If an account was created before the schema migration, run [supabase/migrations/20261105225500_backfill_existing_profiles.sql](./supabase/migrations/20261105225500_backfill_existing_profiles.sql) once to create its missing profile row.

To grant an existing account administrator access, run this in Supabase SQL Editor, replacing the email:

```sql
update public.profiles
set role = 'admin', updated_at = now()
where id = (select id from auth.users where email = 'admin@example.com');
```

The portal choice at sign-in is checked against this database role; selecting Administrator alone does not grant administrator access.

The profile and event attendance foundation is in [supabase/migrations/20261107210000_profiles_and_event_attendance.sql](./supabase/migrations/20261107210000_profiles_and_event_attendance.sql). Run this new migration after the existing migrations to add editable profile details and secure event attendance requests. Existing migrations should not be edited or rerun.

The avatar upload and help-desk persistence foundation is in [supabase/migrations/20261110010000_avatar_storage_and_helpdesk.sql](./supabase/migrations/20261110010000_avatar_storage_and_helpdesk.sql). Run it once after the profile migration to create the public `avatars` bucket, secure per-user storage policies, and authenticated help-desk access.
