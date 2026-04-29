-- Run this after the original schema. It upgrades Student terminology/workflow
-- to Admin -> Manager -> Employee with weekly task progress and payments.

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('admin', 'manager', 'employee', 'student'));

update public.profiles
set role = 'employee'
where role = 'student';

alter table public.profiles drop constraint if exists profiles_status_check;
alter table public.profiles
  add constraint profiles_status_check check (status in ('pending', 'approved', 'rejected', 'inactive'));

alter table public.tasks
  add column if not exists assigned_by uuid references public.profiles(id) on delete set null,
  add column if not exists manager_id uuid references public.profiles(id) on delete set null,
  add column if not exists payment_amount numeric default 0,
  add column if not exists payment_status text default 'pending',
  add column if not exists week_start date,
  add column if not exists week_end date,
  add column if not exists progress_percent numeric default 0,
  add column if not exists final_forwarded_to_admin boolean default false,
  add column if not exists manager_remarks text,
  add column if not exists manager_reviewed_at timestamp,
  add column if not exists admin_remarks text,
  add column if not exists admin_reviewed_at timestamp,
  add column if not exists revision_notes text,
  add column if not exists revision_due_at timestamp,
  add column if not exists revision_requested_by uuid references public.profiles(id) on delete set null,
  add column if not exists revision_requested_at timestamp,
  add column if not exists manager_forward_summary text;

alter table public.tasks drop constraint if exists tasks_payment_status_check;
alter table public.tasks
  add constraint tasks_payment_status_check check (payment_status in ('pending', 'released'));

create table if not exists public.task_progress_updates (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id) on delete cascade,
  employee_id uuid references public.profiles(id) on delete cascade,
  progress_percent numeric default 0 check (progress_percent >= 0 and progress_percent <= 100),
  notes text,
  update_date date default current_date,
  created_at timestamptz default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id) on delete cascade,
  employee_id uuid references public.profiles(id) on delete cascade,
  released_by uuid references public.profiles(id) on delete set null,
  amount numeric default 0,
  method text,
  transaction_number text,
  screenshot_url text,
  status text default 'released',
  released_at timestamptz default now()
);

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.profiles(id) on delete cascade,
  attendance_date date not null default current_date,
  check_in_at timestamptz,
  check_out_at timestamptz,
  work_minutes integer default 0 check (work_minutes >= 0),
  status text default 'present' check (status in ('present', 'late', 'absent')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (employee_id, attendance_date)
);

alter table public.task_progress_updates enable row level security;
alter table public.payments enable row level security;
alter table public.attendance_records enable row level security;

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

create or replace function public.is_manager()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'manager' and status = 'approved'
  );
$$;

drop policy if exists "profiles read own or admin" on public.profiles;
create policy "profiles read own admin manager" on public.profiles
for select using (
  id = auth.uid()
  or public.is_admin()
  or public.is_manager()
);

drop policy if exists "profiles update own basic or admin" on public.profiles;
create policy "profiles update own admin manager" on public.profiles
for update using (
  id = auth.uid()
  or public.is_admin()
  or public.is_manager()
)
with check (
  id = auth.uid()
  or public.is_admin()
  or public.is_manager()
);

drop policy if exists "projects read approved or admin" on public.projects;
create policy "projects read approved users" on public.projects
for select using (
  public.is_admin()
  or public.is_manager()
  or exists (select 1 from public.profiles where id = auth.uid() and status = 'approved')
);

drop policy if exists "tasks read own or admin" on public.tasks;
create policy "tasks read assigned chain" on public.tasks
for select using (
  public.is_admin()
  or manager_id = auth.uid()
  or student_id = auth.uid()
);

drop policy if exists "tasks admin write" on public.tasks;
create policy "tasks admin manager insert update" on public.tasks
for all using (
  public.is_admin()
  or (public.is_manager() and assigned_by = auth.uid())
  or (public.is_manager() and manager_id = auth.uid())
) with check (
  public.is_admin()
  or (
    public.is_manager()
    and assigned_by = auth.uid()
    and manager_id = auth.uid()
    and student_id is not null
  )
);

drop policy if exists "tasks student start own" on public.tasks;
create policy "tasks employee update own progress" on public.tasks
for update using (student_id = auth.uid()) with check (student_id = auth.uid());

drop policy if exists "progress read assigned chain" on public.task_progress_updates;
create policy "progress read assigned chain" on public.task_progress_updates
for select using (
  public.is_admin()
  or employee_id = auth.uid()
  or exists (
    select 1 from public.tasks
    where tasks.id = task_progress_updates.task_id
    and tasks.manager_id = auth.uid()
  )
);

drop policy if exists "progress employee insert own" on public.task_progress_updates;
create policy "progress employee insert own" on public.task_progress_updates
for insert with check (employee_id = auth.uid());

drop policy if exists "payments read assigned chain" on public.payments;
create policy "payments read assigned chain" on public.payments
for select using (
  public.is_admin()
  or employee_id = auth.uid()
  or exists (
    select 1 from public.tasks
    where tasks.id = payments.task_id
    and tasks.manager_id = auth.uid()
  )
);

drop policy if exists "payments admin write" on public.payments;
create policy "payments admin write" on public.payments
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "attendance read assigned chain" on public.attendance_records;
create policy "attendance read assigned chain" on public.attendance_records
for select using (
  public.is_admin()
  or employee_id = auth.uid()
  or exists (
    select 1 from public.tasks
    where tasks.student_id = attendance_records.employee_id
    and (tasks.manager_id = auth.uid() or tasks.assigned_by = auth.uid())
  )
);

drop policy if exists "attendance employee insert own" on public.attendance_records;
create policy "attendance employee insert own" on public.attendance_records
for insert with check (employee_id = auth.uid() or public.is_admin());

drop policy if exists "attendance employee update own" on public.attendance_records;
create policy "attendance employee update own" on public.attendance_records
for update using (employee_id = auth.uid() or public.is_admin())
with check (employee_id = auth.uid() or public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit)
values ('payment-proofs', 'payment-proofs', true, 102400)
on conflict (id) do update set file_size_limit = 102400, public = true;

drop policy if exists "payment proofs admin upload" on storage.objects;
create policy "payment proofs admin upload" on storage.objects
for insert with check (bucket_id = 'payment-proofs' and public.is_admin());

drop policy if exists "payment proofs public read" on storage.objects;
create policy "payment proofs public read" on storage.objects
for select using (bucket_id = 'payment-proofs');
