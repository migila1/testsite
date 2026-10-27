alter table public.transactions
  add column if not exists booking_time text;
