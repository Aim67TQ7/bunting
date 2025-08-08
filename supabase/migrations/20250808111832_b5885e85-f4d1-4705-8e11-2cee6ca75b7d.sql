
-- 1) Issues table
create table if not exists public.issue_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  description text not null,
  status text not null default 'open',       -- open | in_progress | resolved | closed
  priority text not null default 'medium',   -- low | medium | high (free text for now)
  screenshot_path text,                      -- path in storage (issue-screenshots bucket)
  app_route text,                            -- where the issue occurred
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  assigned_to uuid                           -- admin user id (optional)
);

alter table public.issue_reports enable row level security;

-- Policies: users manage their own issues; admins can view/update/delete all
create policy if not exists "Users can create their own issues"
  on public.issue_reports
  for insert
  with check (auth.uid() = user_id);

create policy if not exists "Users can view their own issues"
  on public.issue_reports
  for select
  using (auth.uid() = user_id);

create policy if not exists "Admins can view all issues"
  on public.issue_reports
  for select
  using (has_user_role(auth.uid(), 'admin'));

create policy if not exists "Admins can update all issues"
  on public.issue_reports
  for update
  using (has_user_role(auth.uid(), 'admin'))
  with check (has_user_role(auth.uid(), 'admin'));

create policy if not exists "Admins can delete all issues"
  on public.issue_reports
  for delete
  using (has_user_role(auth.uid(), 'admin'));

-- Keep updated_at fresh
drop trigger if exists set_issue_reports_updated_at on public.issue_reports;
create trigger set_issue_reports_updated_at
  before update on public.issue_reports
  for each row execute function public.update_updated_at_timestamp();

-- Helpful index for user filtering and status
create index if not exists issue_reports_user_status_idx
  on public.issue_reports (user_id, status);


-- 2) Private storage bucket for screenshots
insert into storage.buckets (id, name, public)
values ('issue-screenshots', 'issue-screenshots', false)
on conflict (id) do nothing;

-- Storage RLS policies for the bucket (path convention: `${auth.uid()}/filename`)
-- Read: users can read their own files, admins can read all
create policy if not exists "Issue screenshots read access"
  on storage.objects
  for select
  using (
    bucket_id = 'issue-screenshots'
    and (
      has_user_role(auth.uid(), 'admin')
      or split_part(name, '/', 1) = auth.uid()::text
    )
  );

-- Insert: users can upload into their own folder only
create policy if not exists "Issue screenshots insert access"
  on storage.objects
  for insert
  with check (
    bucket_id = 'issue-screenshots'
    and split_part(name, '/', 1) = auth.uid()::text
  );

-- Update: users can modify their own files; admins can modify all
create policy if not exists "Issue screenshots update access"
  on storage.objects
  for update
  using (
    bucket_id = 'issue-screenshots'
    and (
      has_user_role(auth.uid(), 'admin')
      or split_part(name, '/', 1) = auth.uid()::text
    )
  )
  with check (
    bucket_id = 'issue-screenshots'
    and (
      has_user_role(auth.uid(), 'admin')
      or split_part(name, '/', 1) = auth.uid()::text
    )
  );

-- Delete: users can delete their own files; admins can delete all
create policy if not exists "Issue screenshots delete access"
  on storage.objects
  for delete
  using (
    bucket_id = 'issue-screenshots'
    and (
      has_user_role(auth.uid(), 'admin')
      or split_part(name, '/', 1) = auth.uid()::text
    )
  );


-- 3) Token usage tracking on profiles
alter table public.profiles
  add column if not exists token_usage_total bigint not null default 0,
  add column if not exists token_usage_month bigint not null default 0,
  add column if not exists token_usage_updated_at timestamptz not null default now(),
  add column if not exists token_usage_period_start date not null default (date_trunc('month', now())::date);
