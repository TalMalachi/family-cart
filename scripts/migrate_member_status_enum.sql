-- Safe migration for existing environments:
-- member_status: pending|active|suspended  -> register|active|suspended|deleted

begin;

-- 1) Rename legacy status value if still present.
do $$
begin
  if exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'member_status'
      and e.enumlabel = 'pending'
  ) then
    alter type member_status rename value 'pending' to 'register';
  end if;
end $$;

-- 2) Ensure register exists (for environments that never had pending).
do $$
begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'member_status'
      and e.enumlabel = 'register'
  ) then
    alter type member_status add value 'register' before 'active';
  end if;
end $$;

-- 3) Ensure deleted exists.
do $$
begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'member_status'
      and e.enumlabel = 'deleted'
  ) then
    alter type member_status add value 'deleted';
  end if;
end $$;

-- 4) Set default for new rows.
alter table family_members
  alter column status set default 'register';

commit;

