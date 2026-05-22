-- Fix: role column could not be updated from the Table Editor (or SQL) because
-- profiles_preserve_role_unless_admin() treated missing JWT as "not admin" and reverted every role change.
--
-- Run this once in Supabase → SQL Editor.
-- After promoting admins, also set auth.users.raw_app_meta_data.role = "admin" and have them sign out/in
-- so the app JWT matches (menu RLS uses the JWT).

create or replace function public.profiles_preserve_role_unless_admin()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  is_admin boolean;
  jwt_uid uuid;
begin
  if new.role is distinct from old.role then
    jwt_uid := auth.uid();

    -- No JWT context (e.g. Table Editor / SQL as postgres): allow changing role
    if jwt_uid is null then
      return new;
    end if;

    select coalesce(u.raw_app_meta_data ->> 'role', '') = 'admin'
    into is_admin
    from auth.users u
    where u.id = jwt_uid;

    if not coalesce(is_admin, false) then
      new.role := old.role;
    end if;
  end if;

  return new;
end;
$$;

-- Optional: promote one user in both places (replace email)
-- update public.profiles set role = 'admin' where lower(email) = lower('you@example.com');
-- update auth.users
-- set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
-- where lower(email) = lower('you@example.com');
