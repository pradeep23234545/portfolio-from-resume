# Database setup

The app stores everything in a [Supabase](https://supabase.com) PostgreSQL database.
It uses its **own email/password login** (bcrypt + JWT), not Supabase Auth.

## New project

1. Create a free project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Open **SQL Editor → New query**.
3. Paste the whole of [`supabase/setup.sql`](../supabase/setup.sql) and click **Run**.
   You should see *Success. No rows returned*.
4. Copy your keys from **Project Settings → API Keys** into `.env.local`
   (see the [README](../README.md#2-configure-environment-variables)).

`setup.sql` is the four files in [`supabase/migrations`](../supabase/migrations) combined:

| File | What it does |
| ---- | ------------ |
| `001_initial_schema.sql` | Tables: users, portfolios, projects, experiences, skills, education, analytics… |
| `002_rls_policies.sql` | Row-level security policies |
| `003_templates_data.sql` | Default templates |
| `004_custom_auth.sql` | Adapts `users` for the app's own login (adds `password_hash`, removes the link to `auth.users`) |

All four are safe to run again.

**Profile photos:** the `avatars` storage bucket is created automatically on the
first photo upload. You don't need to create it.

## Existing project

If you created your tables before `004_custom_auth.sql` existed, run just that file.
Sign-up fails without it.

## Keeping a free project awake

Free Supabase projects pause after about a week without activity. When deployed on
Vercel, the daily job in [`vercel.json`](../vercel.json) calls `/api/health`, which
queries the database and keeps it active. If a project does pause, open the
Supabase dashboard and click **Restore**.

## Troubleshooting

| Error | Fix |
| ----- | --- |
| `Could not find the table 'public.users' in the schema cache` | The tables don't exist yet: run `setup.sql`. |
| `duplicate key value violates unique constraint "templates_name_key"` | You're running an old copy of the SQL. Use the current `setup.sql`. |
| `policy ... already exists` | Same: use the current `setup.sql`, which drops policies before recreating them. |
| `violates foreign key constraint "users_id_fkey"` on sign-up | Run `004_custom_auth.sql`. |
| `Supabase is not configured` | `.env.local` is missing or still has placeholder values; restart `npm run dev` after editing it. |
| `fetch failed` | `NEXT_PUBLIC_SUPABASE_URL` is wrong, or the project is paused. |
