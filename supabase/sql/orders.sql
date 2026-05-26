-- Campus Bite: orders + order_items
-- Run once in Supabase → SQL Editor (coordinator applies after merge).
-- Requires public.menu_items. Enable Realtime on public.orders when wiring live tracking.

-- JWT admin check (matches README: app_metadata.role = "admin")
-- Admin if JWT app_metadata.role = admin OR profiles.role = admin (Table Editor promotion).
create or replace function public.is_admin_jwt()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    or (
      auth.uid() is not null
      and exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.role = 'admin'
      )
    );
$$;

-- orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
  payment_method text not null
    check (payment_method in ('counter', 'razorpay')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'pending', 'paid', 'failed', 'refunded')),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  notes text,
  status_message text,
  estimated_ready_at timestamptz,
  status_updated_at timestamptz not null default now(),
  razorpay_order_id text,
  razorpay_payment_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_user_id_idx on public.orders (user_id);

-- order_items (price/name snapshot at order time)
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  menu_item_id uuid not null references public.menu_items (id) on delete restrict,
  name text not null,
  price_cents integer not null check (price_cents >= 0),
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);

-- updated_at on orders
create or replace function public.set_orders_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row
  execute function public.set_orders_updated_at();

-- RLS
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- orders: students insert/select own; admins select/update all
drop policy if exists orders_select_own on public.orders;
create policy orders_select_own on public.orders
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin_jwt());

drop policy if exists orders_insert_own on public.orders;
create policy orders_insert_own on public.orders
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists orders_update_admin on public.orders;
create policy orders_update_admin on public.orders
  for update
  to authenticated
  using (public.is_admin_jwt())
  with check (public.is_admin_jwt());

-- Students: mark own Razorpay order paid after checkout (payment verify API)
drop policy if exists orders_update_own_razorpay_payment on public.orders;
create policy orders_update_own_razorpay_payment on public.orders
  for update
  to authenticated
  using (
    user_id = auth.uid()
    and payment_method = 'razorpay'
    and payment_status = 'pending'
  )
  with check (
    user_id = auth.uid()
    and payment_method = 'razorpay'
    and payment_status = 'paid'
  );

-- order_items: select via order ownership; insert only into own orders
drop policy if exists order_items_select on public.order_items;
create policy order_items_select on public.order_items
  for select
  to authenticated
  using (
    public.is_admin_jwt()
    or exists (
      select 1
      from public.orders o
      where o.id = order_items.order_id
        and o.user_id = auth.uid()
    )
  );

drop policy if exists order_items_insert_own_order on public.order_items;
create policy order_items_insert_own_order on public.order_items
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.orders o
      where o.id = order_items.order_id
        and o.user_id = auth.uid()
    )
  );

-- Realtime (Dashboard → Database → Replication): enable `orders` when adding live tracking.
