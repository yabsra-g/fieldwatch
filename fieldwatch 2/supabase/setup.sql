-- FieldWatch: run once in the Supabase dashboard (SQL Editor).
-- Farmer sign in / sign up already works through Supabase Auth without this.
-- This adds the columns the app writes so farmers also show up in the Table Editor.

alter table public.farmer
  add column if not exists fieldwatch_id text unique,
  add column if not exists name text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists district text,
  add column if not exists village text,
  add column if not exists role text not null default 'farmer',
  add column if not exists status text not null default 'pending',
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by text;

-- Only the server (secret key) writes here; no public access.
alter table public.farmer enable row level security;
