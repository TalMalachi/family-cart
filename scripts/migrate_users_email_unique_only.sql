-- Safe migration: make only users.email unique.
-- Also add invitations.email for invite flow.

begin;

-- 1) Drop unique constraint/index on users.phone if it exists.
do $$
declare
  con_name text;
begin
  select c.conname into con_name
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  where t.relname = 'users'
    and c.contype = 'u'
    and c.conname = 'users_phone_key'
  limit 1;

  if con_name is not null then
    execute format('alter table users drop constraint %I', con_name);
  end if;
end $$;

-- 2) Add invitations.email if missing (nullable first for existing rows).
alter table invitations add column if not exists email text;

-- 3) Backfill invitation email from users by phone where possible.
update invitations i
set email = u.email
from users u
where i.email is null
  and i.phone = u.phone
  and u.email is not null;

-- 4) Keep column ready for app usage; keep nullable to avoid breaking old rows.
-- New rows from app now always provide email.

commit;

