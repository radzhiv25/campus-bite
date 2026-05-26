-- Re-run if orders.sql was applied before profiles.role was included in is_admin_jwt().
-- Fixes: student orders exist in DB but admin queue is empty (RLS blocked SELECT).

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
