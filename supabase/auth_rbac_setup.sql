-- ==============================================================================
-- SUPABASE AUTH, ROLE-BASED ACCESS CONTROL (RBAC) & USER PROFILES SETUP
-- ==============================================================================
-- Description:
-- 1. Creates `public.profiles` table linked to Supabase `auth.users`
-- 2. Enforces `role` column ('user', 'admin', 'owner') with default 'user'
-- 3. Sets up automated trigger on `auth.users` to provision profile on signup
-- 4. Enables Row Level Security (RLS) for public view + secure self-update
-- 5. Implements security trigger to prevent unauthorized role escalation
-- ==============================================================================

-- 1. CREATE OR UPDATE PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  display_name text,
  username text unique,
  avatar_url text,
  bio text,
  role text not null default 'user' check (role in ('user', 'admin', 'owner')),
  skills text[] default '{}',
  social_links jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Index for fast role & username lookup
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_username on public.profiles(username);

-- 2. ENABLE ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;

-- Drop existing policies if any to ensure clean idempotent script
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Admins and owners can update any profile" on public.profiles;

-- RLS Policy: Anyone (authenticated or anonymous) can view profiles
create policy "Public profiles are viewable by everyone"
  on public.profiles
  for select
  using (true);

-- RLS Policy: Users can only update their own profile
create policy "Users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- RLS Policy: Allow insert for the user's own profile (fallback if trigger is bypassed)
create policy "Users can insert their own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- 3. TRIGGER FUNCTION: AUTOMATIC PROFILE PROVISIONING ON SIGNUP
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  default_name text;
  default_username text;
begin
  -- Derive default display name from metadata or email
  default_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'display_name',
    split_part(new.email, '@', 1)
  );

  -- Derive unique username handle
  default_username := coalesce(
    new.raw_user_meta_data->>'username',
    lower(split_part(new.email, '@', 1)) || '_' || substr(replace(new.id::text, '-', ''), 1, 6)
  );

  insert into public.profiles (
    id,
    email,
    display_name,
    username,
    avatar_url,
    role,
    skills,
    social_links,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.email,
    default_name,
    default_username,
    new.raw_user_meta_data->>'avatar_url',
    'user', -- Always default new signups to 'user' role for security
    '{}',
    '{}'::jsonb,
    now(),
    now()
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    updated_at = now();

  return new;
end;
$$;

-- Attach trigger to auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. SECURITY TRIGGER: PREVENT SELF-ROLE ESCALATION
-- Normal users must NOT be allowed to update their own `role` to 'admin' or 'owner'
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
as $$
begin
  if (new.role is distinct from old.role) then
    -- Allow change if executing as service_role (backend server admin) OR caller is already an admin/owner
    if not (
      coalesce(auth.jwt()->>'role', '') = 'service_role' or
      exists (
        select 1 from public.profiles
        where id = auth.uid() and role in ('admin', 'owner')
      )
    ) then
      raise exception 'Permission denied: Only an existing admin or owner can change account roles.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_profile_role_security on public.profiles;
create trigger enforce_profile_role_security
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- 5. HELPER FUNCTION: CHECK ADMIN STATUS IN SQL / RPC
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'owner')
  );
$$;

-- ==============================================================================
-- INSTRUCTIONS FOR INITIAL ADMIN / OWNER PROMOTION:
-- Run the following SQL query in your Supabase SQL Editor to make a user an Admin or Owner:
--
-- UPDATE public.profiles
-- SET role = 'owner'
-- WHERE email = 'your-email@example.com';
-- ==============================================================================
