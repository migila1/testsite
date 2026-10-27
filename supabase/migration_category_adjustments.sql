-- Eenmalige bedragen toevoegen aan een categorie per maand (dashboard)

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
