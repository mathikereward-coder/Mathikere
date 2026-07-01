-- ============================================================
-- Mathikere Ward Voter CRM  —  Supabase database schema
-- Run this ONCE in: Supabase Dashboard -> SQL Editor -> New query -> paste -> Run.
-- It creates tables, security rules (so supporters only see their own/assigned
-- booths), and an auto-profile trigger for new logins.
-- ============================================================

-- ---------- TABLES ----------

-- One row per app user (mirrors the login). role = 'admin' or 'supporter'.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'supporter' check (role in ('admin','supporter')),
  created_at timestamptz default now()
);

-- Which booths a supporter is allowed to see (admins see all).
create table if not exists public.supporter_booths (
  user_id uuid references public.profiles(id) on delete cascade,
  booth_number int not null check (booth_number between 1 and 23),
  primary key (user_id, booth_number)
);

-- One row per HOUSEHOLD visited.
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  client_uuid uuid unique,            -- idempotency key from the offline device (prevents double-sync)
  booth_number int not null check (booth_number between 1 and 23),
  part_number text,
  door_no text,
  street text,                        -- main & cross road
  landmark text,
  ration_card text check (ration_card in ('APL','BPL','None')),
  schemes text[] default '{}',        -- Shakti, Gruha Jyothi, Anna Bhagya, Gruha Lakshmi, Yuva Nidhi
  issues text[] default '{}',         -- Road, BWSSB, Garbage, Others
  issue_note text,
  latitude double precision,
  longitude double precision,
  collected_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- One row per VOTER, linked to a household (this is the "no. of voters in family").
create table if not exists public.voters (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.households(id) on delete cascade,
  name text not null,
  age int,
  voter_id text,
  contact text,
  created_at timestamptz default now()
);

create index if not exists idx_voters_voter_id on public.voters(voter_id);
create index if not exists idx_voters_household on public.voters(household_id);
create index if not exists idx_households_booth on public.households(booth_number);
create index if not exists idx_households_collected_by on public.households(collected_by);

-- ---------- HELPERS ----------

-- True if the current logged-in user is an admin.
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Auto-create a profile row whenever a new user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), 'supporter')
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- ROW-LEVEL SECURITY ----------

alter table public.profiles enable row level security;
alter table public.supporter_booths enable row level security;
alter table public.households enable row level security;
alter table public.voters enable row level security;

-- profiles
drop policy if exists p_profiles_select on public.profiles;
create policy p_profiles_select on public.profiles for select
  using (id = auth.uid() or public.is_admin());
drop policy if exists p_profiles_update_self on public.profiles;
create policy p_profiles_update_self on public.profiles for update
  using (id = auth.uid() or public.is_admin());

-- supporter_booths
drop policy if exists p_sb_select on public.supporter_booths;
create policy p_sb_select on public.supporter_booths for select
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists p_sb_admin on public.supporter_booths;
create policy p_sb_admin on public.supporter_booths for all
  using (public.is_admin()) with check (public.is_admin());

-- households: anyone logged in inserts their own; reads limited to own + assigned booths; admin everything
drop policy if exists p_hh_insert on public.households;
create policy p_hh_insert on public.households for insert
  with check (collected_by = auth.uid());
drop policy if exists p_hh_select on public.households;
create policy p_hh_select on public.households for select using (
  public.is_admin()
  or collected_by = auth.uid()
  or booth_number in (select booth_number from public.supporter_booths where user_id = auth.uid())
);
drop policy if exists p_hh_update on public.households;
create policy p_hh_update on public.households for update using (public.is_admin());
drop policy if exists p_hh_delete on public.households;
create policy p_hh_delete on public.households for delete using (public.is_admin());

-- voters: follow the parent household's access
drop policy if exists p_v_insert on public.voters;
create policy p_v_insert on public.voters for insert with check (
  exists (select 1 from public.households h
          where h.id = household_id and (h.collected_by = auth.uid() or public.is_admin()))
);
drop policy if exists p_v_select on public.voters;
create policy p_v_select on public.voters for select using (
  exists (select 1 from public.households h where h.id = household_id and (
    public.is_admin()
    or h.collected_by = auth.uid()
    or h.booth_number in (select booth_number from public.supporter_booths where user_id = auth.uid())
  ))
);
drop policy if exists p_v_update on public.voters;
create policy p_v_update on public.voters for update using (public.is_admin());
drop policy if exists p_v_delete on public.voters;
create policy p_v_delete on public.voters for delete using (public.is_admin());

-- ============================================================
-- AFTER you create your own login, make yourself admin by running:
--   update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'YOUR-EMAIL');
-- ============================================================
