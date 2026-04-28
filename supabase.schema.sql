create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  role text default 'student' check (role in ('admin', 'student')),
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  skill_level text,
  message text,
  created_at timestamptz default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  project_name text not null,
  website_url text,
  category text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.profiles(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  task_title text not null,
  task_type text,
  target_url text,
  posting_url text,
  instructions text,
  approx_time text,
  deadline timestamptz,
  priority text,
  status text default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade,
  submission_url text,
  screenshot_url text,
  notes text,
  time_spent text,
  status text default 'submitted',
  submitted_at timestamptz default now()
);

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade,
  rating numeric check (rating >= 0 and rating <= 5),
  remarks text,
  created_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    email,
    phone,
    role,
    status,
    skill_level,
    message,
    created_at
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    coalesce(new.raw_user_meta_data->>'status', 'pending'),
    new.raw_user_meta_data->>'skill_level',
    new.raw_user_meta_data->>'message',
    now()
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    email = excluded.email,
    phone = excluded.phone,
    skill_level = excluded.skill_level,
    message = excluded.message;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.submissions enable row level security;
alter table public.ratings enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'approved'
  );
$$;

drop policy if exists "profiles read own or admin" on public.profiles;
create policy "profiles read own or admin" on public.profiles
for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles insert own signup" on public.profiles;
create policy "profiles insert own signup" on public.profiles
for insert with check (id = auth.uid());

drop policy if exists "profiles update own basic or admin" on public.profiles;
create policy "profiles update own basic or admin" on public.profiles
for update using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "profiles delete admin" on public.profiles;
create policy "profiles delete admin" on public.profiles
for delete using (public.is_admin());

drop policy if exists "projects read approved or admin" on public.projects;
create policy "projects read approved or admin" on public.projects
for select using (
  public.is_admin()
  or exists (select 1 from public.profiles where id = auth.uid() and status = 'approved')
);

drop policy if exists "projects admin write" on public.projects;
create policy "projects admin write" on public.projects
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "tasks read own or admin" on public.tasks;
create policy "tasks read own or admin" on public.tasks
for select using (student_id = auth.uid() or public.is_admin());

drop policy if exists "tasks admin write" on public.tasks;
create policy "tasks admin write" on public.tasks
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "tasks student start own" on public.tasks;
create policy "tasks student start own" on public.tasks
for update using (student_id = auth.uid()) with check (student_id = auth.uid());

drop policy if exists "submissions read own or admin" on public.submissions;
create policy "submissions read own or admin" on public.submissions
for select using (student_id = auth.uid() or public.is_admin());

drop policy if exists "submissions student insert own" on public.submissions;
create policy "submissions student insert own" on public.submissions
for insert with check (student_id = auth.uid());

drop policy if exists "submissions admin update" on public.submissions;
create policy "submissions admin update" on public.submissions
for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "ratings read own or admin" on public.ratings;
create policy "ratings read own or admin" on public.ratings
for select using (student_id = auth.uid() or public.is_admin());

drop policy if exists "ratings admin write" on public.ratings;
create policy "ratings admin write" on public.ratings
for all using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('submission-screenshots', 'submission-screenshots', true)
on conflict (id) do nothing;

drop policy if exists "screenshots own upload" on storage.objects;
create policy "screenshots own upload" on storage.objects
for insert with check (bucket_id = 'submission-screenshots' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "screenshots public read" on storage.objects;
create policy "screenshots public read" on storage.objects
for select using (bucket_id = 'submission-screenshots');
