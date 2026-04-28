# SEO Task Management System

React + Tailwind + Supabase application converted from the Google Stitch UI exports.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example`:

```bash
VITE_SUPABASE_URL=https://ikwpbluhjrvloyejtiid.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-key
```

3. Run `supabase.schema.sql` in the Supabase SQL editor.

4. Create the first admin user in Supabase Auth, then insert or update its profile:

```sql
insert into public.profiles (id, full_name, email, role, status)
values ('AUTH_USER_ID', 'Admin User', 'admin@example.com', 'admin', 'approved')
on conflict (id) do update set role = 'admin', status = 'approved';
```

5. Start locally:

```bash
npm run dev
```

## Features

- Admin and student authentication through Supabase Auth.
- Student signup requests remain pending until admin approval.
- Role-protected admin and student routes.
- Student, project, task, submission, rating, and report workflows.
- PDF, Excel, and WhatsApp report exports.
- Supabase RLS policies for admin-wide access and student-owned access.
- Vercel-ready Vite build.

## Deployment

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel project environment variables, then deploy with the default Vite settings.
