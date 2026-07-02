-- ============================================================================
-- RCLIP — Phase 1 · Identity & Access — ROLE HIERARCHY PATCH (incremental)
-- ----------------------------------------------------------------------------
-- Refines ONLY the role-assignment hierarchy rules. Nothing else from Phase 1
-- (schema, other RLS policies, protected-field guard, citext, comments) is
-- changed. Forward-only: the prior patch (…_identity_patch.sql) is left intact.
--
-- Rules enforced:
--   • Master Admin (holder of role.assign.master_admin) may assign/revoke ANY
--     role, including another Master Admin.
--   • All other users may assign/revoke only roles with a STRICTLY LOWER
--     hierarchy level than their own.
--   • No user other than a Master Admin may assign OR revoke the master_admin role.
--
-- Enforcement now also covers revocation (DELETE and soft-delete via UPDATE).
-- Server/service contexts (auth.uid() IS NULL) continue to bypass the guard.
-- Idempotent & re-runnable.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Dedicated permission
-- ----------------------------------------------------------------------------
insert into public.permissions (code, resource, action, description, category) values
  ('role.assign.master_admin', 'role', 'assign_master_admin',
   'Assign or revoke the Master Admin role and assign any role', 'Access Control')
on conflict (code) do nothing;

-- Grant it to the platform-level system roles (super_admin, master_admin).
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code = 'role.assign.master_admin'
where r.is_system and r.organization_id is null
  and r.code in ('super_admin', 'master_admin')
on conflict (role_id, permission_id) do nothing;

-- ----------------------------------------------------------------------------
-- 2. Redefine the hierarchy guard (handles INSERT / UPDATE / DELETE)
-- ----------------------------------------------------------------------------
create or replace function public.rc_guard_user_role_hierarchy()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role_id      uuid;
  v_target_level integer;
  v_target_code  text;
  v_actor_level  integer;
begin
  -- Server-side / service-role / migration contexts bypass the check.
  if auth.uid() is null then
    return coalesce(new, old);
  end if;

  -- Master Admins may assign/revoke ANY role (including master_admin).
  if public.rc_has_permission('role.assign.master_admin') then
    return coalesce(new, old);
  end if;

  -- Resolve the role being assigned (INSERT/UPDATE) or revoked (DELETE).
  v_role_id := case when tg_op = 'DELETE' then old.role_id else new.role_id end;

  select r.hierarchy_level, r.code
    into v_target_level, v_target_code
  from public.roles r
  where r.id = v_role_id;

  -- Only a Master Admin may assign or revoke the master_admin role.
  if v_target_code = 'master_admin' then
    raise exception
      'Only a Master Admin may assign or revoke the Master Admin role'
      using errcode = '42501';
  end if;

  -- Everyone else: target must be STRICTLY LOWER than the actor's max level.
  v_actor_level := public.rc_current_max_role_level();
  if v_target_level is not null and v_target_level >= v_actor_level then
    raise exception
      'You may only assign or revoke roles with a hierarchy level lower than your own (target %, your level %)',
      v_target_level, v_actor_level
      using errcode = '42501';
  end if;

  return coalesce(new, old);
end;
$$;

-- ----------------------------------------------------------------------------
-- 3. Recreate the trigger to also fire on DELETE (revocation)
-- ----------------------------------------------------------------------------
drop trigger if exists trg_user_roles_guard_hierarchy on public.user_roles;
create trigger trg_user_roles_guard_hierarchy
  before insert or update or delete on public.user_roles
  for each row execute function public.rc_guard_user_role_hierarchy();
