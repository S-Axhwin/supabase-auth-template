-- supabase/migrations/20240101000000_create_profiles.sql
--
-- Creates the public.profiles table used to:
--   1. Store user profile data (display name, etc.)
--   2. Detect whether a user is "new" (no row = onboarding required)
--
-- Run this via:
--   supabase db push          (local / CI)
--   Supabase Studio → SQL Editor (cloud)

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id           uuid        references auth.users (id) on delete cascade primary key,
  display_name text,
  created_at   timestamptz default now() not null
);

comment on table public.profiles is
  'One row per authenticated user. Absence of a row signals a new user who needs onboarding.';

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;

-- Users may only read their own profile
create policy "profiles: select own"
  on public.profiles
  for select
  using (auth.uid() = id);

-- Users may insert their own profile (onboarding upsert)
create policy "profiles: insert own"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- Users may update their own profile
create policy "profiles: update own"
  on public.profiles
  for update
  using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- Trigger: auto-create a profile row on first sign-in (optional)
-- ---------------------------------------------------------------------------
-- Uncomment the block below if you want a profile row created automatically
-- (without display_name) on first auth. This means ALL users will have a
-- profile row, so "new user" detection must instead rely on a separate
-- flag column (e.g. onboarding_complete boolean).
--
-- Leave commented (default) to use the "no row = new user" pattern.
-- ---------------------------------------------------------------------------

-- create or replace function public.handle_new_user()
-- returns trigger
-- language plpgsql
-- security definer set search_path = ''
-- as $$
-- begin
--   insert into public.profiles (id)
--   values (new.id)
--   on conflict (id) do nothing;
--   return new;
-- end;
-- $$;
--
-- create trigger on_auth_user_created
--   after insert on auth.users
--   for each row execute procedure public.handle_new_user();
