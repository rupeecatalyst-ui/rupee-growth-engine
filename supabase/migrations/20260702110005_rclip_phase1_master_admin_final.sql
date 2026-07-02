-- ============================================================================
-- RCLIP — Phase 1 · Identity & Access — MASTER ADMIN FINALIZATION (incremental)
-- ----------------------------------------------------------------------------
-- Final identity decision. Forward-only: prior migrations are left intact.
--
--   • Removes the super_admin concept entirely (role, its grants, hierarchy use).
--   • role.assign.master_admin is granted ONLY to master_admin, and a guard
--     keeps it exclusive to master_admin going forward.
--   • Business invariant: every organization must always retain at least one
--     ACTIVE Master Admin. Deletion, deactivation, soft-delete, demotion or
--     revocation of the last active Master Admin is blocked.
--
-- "Active Master Admin" = a non-deleted, is_active user holding a non-deleted,
-- currently-valid user_roles assignment to the system master_admin role.
--
-- App-user operations (JWT present) are guarded. Server/service/migration
-- contexts (auth.uid() IS NULL) bypass the invariant so org teardown and
-- trusted backend admin remain possible. Idempotent & re-runnable.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Remove super_admin (role delete cascades its role_permissions & user_roles)
-- ----------------------------------------------------------------------------
delete from public.roles
where code = 'super_admin' and is_system and organization_id is null;

-- Defensive: role.assign.master_admin must exist and belong only to master_admin.
insert into public.permissions (code, resource, action, description, category) values
  ('role.assign.master_admin', 'role', 'assign_master_admin',
   'Assign or revoke the Master Admin role and assign any role', 'Access Control')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code = 'role.assign.master_admin'
where r.is_system and r.organization_id is null and r.code = 'master_admin'
on conflict (role_id, permission_id) do nothing;

-- Strip the permission from any role other than master_admin (idempotent cleanup).
delete from public.role_permissions rp
using public.permissions p, public.roles r
where rp.permission_id = p.id
  and rp.role_id = r.id
  and p.code = 'role.assign.master_admin'
  and r.code is distinct from 'master_admin';

-- ----------------------------------------------------------------------------
-- 2. Keep role.assign.master_admin exclusive to master_admin going forward
-- ----------------------------------------------------------------------------
create or replace function public.rc_guard_master_admin_permission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_perm_code text;
  v_role_code text;
begin
  select code into v_perm_code from public.permissions where id = new.permission_id;
  if v_perm_code = 'role.assign.master_admin' then
    select code into v_role_code from public.roles where id = new.role_id;
    if v_role_code is distinct from 'master_admin' then
      raise exception
        'Permission role.assign.master_admin may only be granted to the Master Admin role'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_role_permissions_guard_master_admin on public.role_permissions;
create trigger trg_role_permissions_guard_master_admin
  before insert or update on public.role_permissions
  for each row execute function public.rc_guard_master_admin_permission();

-- ----------------------------------------------------------------------------
-- 3. Helpers for the last-active-Master-Admin invariant
-- ----------------------------------------------------------------------------
create or replace function public.rc_is_master_admin(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = p_user_id
      and r.code = 'master_admin' and r.is_system
      and ur.deleted_at is null
      and ur.valid_from <= now()
      and (ur.valid_until is null or ur.valid_until > now())
  )
$$;

create or replace function public.rc_count_active_master_admins(p_org uuid, p_exclude_user uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(distinct u.id)::int
  from public.users u
  join public.user_roles ur
    on ur.user_id = u.id
   and ur.deleted_at is null
   and ur.valid_from <= now()
   and (ur.valid_until is null or ur.valid_until > now())
  join public.roles r on r.id = ur.role_id
  where u.organization_id = p_org
    and u.deleted_at is null
    and u.is_active
    and r.code = 'master_admin' and r.is_system
    and (p_exclude_user is null or u.id <> p_exclude_user)
$$;

-- ----------------------------------------------------------------------------
-- 4a. Guard: revoking / demoting the last Master Admin via user_roles
-- ----------------------------------------------------------------------------
create or replace function public.rc_guard_last_master_admin_user_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old_is_active_ma boolean;
  v_removes          boolean;
  v_others           integer;
begin
  if auth.uid() is null then
    return coalesce(new, old);
  end if;

  -- Was OLD an active master_admin assignment held by an active user?
  v_old_is_active_ma :=
    exists (
      select 1 from public.roles r
      where r.id = old.role_id and r.code = 'master_admin' and r.is_system
    )
    and old.deleted_at is null
    and old.valid_from <= now()
    and (old.valid_until is null or old.valid_until > now())
    and exists (
      select 1 from public.users u
      where u.id = old.user_id and u.is_active and u.deleted_at is null
    );

  if not v_old_is_active_ma then
    return coalesce(new, old);
  end if;

  if tg_op = 'DELETE' then
    v_removes := true;
  else
    v_removes :=
         new.deleted_at is not null
      or new.role_id  is distinct from old.role_id
      or new.user_id  is distinct from old.user_id
      or (new.valid_until is not null and new.valid_until <= now());
  end if;

  if not v_removes then
    return coalesce(new, old);
  end if;

  v_others := public.rc_count_active_master_admins(old.organization_id, old.user_id);
  if v_others = 0 then
    raise exception
      'Cannot revoke or demote the last active Master Admin of the organization'
      using errcode = '42501';
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_user_roles_guard_last_master_admin on public.user_roles;
create trigger trg_user_roles_guard_last_master_admin
  before update or delete on public.user_roles
  for each row execute function public.rc_guard_last_master_admin_user_role();

-- ----------------------------------------------------------------------------
-- 4b. Guard: deactivating / deleting / moving the last Master Admin user
-- ----------------------------------------------------------------------------
create or replace function public.rc_guard_last_master_admin_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_was_active_ma boolean;
  v_removes       boolean;
  v_others        integer;
begin
  if auth.uid() is null then
    return coalesce(new, old);
  end if;

  v_was_active_ma :=
    old.is_active
    and old.deleted_at is null
    and public.rc_is_master_admin(old.id);

  if not v_was_active_ma then
    return coalesce(new, old);
  end if;

  if tg_op = 'DELETE' then
    v_removes := true;
  else
    v_removes :=
         new.is_active = false
      or new.deleted_at is not null
      or new.organization_id is distinct from old.organization_id;
  end if;

  if not v_removes then
    return coalesce(new, old);
  end if;

  v_others := public.rc_count_active_master_admins(old.organization_id, old.id);
  if v_others = 0 then
    raise exception
      'Cannot deactivate, delete or move the last active Master Admin of the organization'
      using errcode = '42501';
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_users_guard_last_master_admin on public.users;
create trigger trg_users_guard_last_master_admin
  before update or delete on public.users
  for each row execute function public.rc_guard_last_master_admin_user();
