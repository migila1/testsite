-- Mijn Uitgaven — basisschema met RLS (eigen data per gebruiker)

create extension if not exists "pgcrypto";

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  iban text,
  currency text not null default 'EUR',
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  color text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pattern text not null,
  match_type text not null default 'contains',
  category_id uuid references public.categories (id) on delete set null,
  priority int not null default 100,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete cascade,
  booking_date date not null,
  description text,
  counterparty_name text,
  counterparty_iban text,
  amount_cents bigint not null,
  mutation_type text,
  memo text,
  booking_time text,
  category_id uuid references public.categories (id) on delete set null,
  category_source text,
  rule_id uuid references public.rules (id) on delete set null,
  excluded boolean not null default false,
  is_internal_transfer boolean not null default false,
  fingerprint text not null,
  created_at timestamptz not null default now(),
  unique (user_id, account_id, fingerprint)
);

alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.rules enable row level security;
alter table public.transactions enable row level security;

create policy "accounts_own" on public.accounts for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "categories_own" on public.categories for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "rules_own" on public.rules for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "transactions_own" on public.transactions for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.category_adjustments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  month text not null,
  category_id uuid references public.categories (id) on delete set null,
  amount_cents bigint not null check (amount_cents > 0),
  label text,
  created_at timestamptz not null default now()
);

alter table public.category_adjustments enable row level security;

create policy "category_adjustments_own" on public.category_adjustments
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
