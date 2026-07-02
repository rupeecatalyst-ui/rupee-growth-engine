-- ============================================================================
-- RCLIP — Phase 1 · Identity & Access — ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
-- Multi-tenant isolation via organization_id + permission-gated writes.
-- Helper functions are SECURITY DEFINER (fixed search_path) so RLS policies
-- can query identity tables without recursing into their own policies.
-- The `service_role` bypasses RLS and is used for seeding / admin / bootstrap.
-- Idempotent: functions use CREATE OR REPLACE; policies DROP ... IF EXISTS.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helper: current app user's organization_id (from Supabase auth.uid()).
-- ----------------------------------------------------------------------------
create or replace function public.rc_current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id
  from public.users
  where auth_user_id = auth.uid()
    and deleted_at is null
  limit 1
$$;

-- ----------------------------------------------------------------------------
-- Helper: does the current user hold a given permission code?
-- Resolves users -> user_roles (active, unexpired) -> role_permissions -> permissions.
-- ----------------------------------------------------------------------------
create or replace function public.rc_has_permission(p_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    join public.user_roles ur
      on ur.user_id = u.id
     and ur.deleted_at is null
     and ur.valid_from <= now()
     and (ur.valid_until is null or ur.valid_until > now())
    join public.role_permissions rp on rp.role_id = ur.role_id
    join public.permissions p on p.id = rp.permission_id
    where u.auth_user_id = auth.uid()
      and u.deleted_at is null
      and u.is_active
      and p.code = p_code
  )
$$;

-- ============================================================================
-- Enable RLS
-- ============================================================================
alter table public.organizations   enable row level security;
alter table public.branches        enable row level security;
alter table public.employees       enable row level security;
alter table public.users           enable row level security;
alter table public.roles           enable row level security;
alter table public.permissions     enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles      enable row level security;

-- ============================================================================
-- organizations
-- ============================================================================
drop policy if exists organizations_select on public.organizations;
create policy organizations_select on public.organizations
  for select to authenticated
  using (id = public.rc_current_org_id());

drop policy if exists organizations_update on public.organizations;
create policy organizations_update on public.organizations
  for update to authenticated
  using (id = public.rc_current_org_id() and public.rc_has_permission('org.manage'))
  with check (id = public.rc_current_org_id());

-- ============================================================================
-- branches
-- ============================================================================
drop policy if exists branches_select on public.branches;
create policy branches_select on public.branches
  for select to authenticated
  using (organization_id = public.rc_current_org_id());

drop policy if exists branches_insert on public.branches;
create policy branches_insert on public.branches
  for insert to authenticated
  with check (organization_id = public.rc_current_org_id() and public.rc_has_permission('branch.manage'));

drop policy if exists branches_update on public.branches;
create policy branches_update on public.branches
  for update to authenticated
  using (organization_id = public.rc_current_org_id() and public.rc_has_permission('branch.manage'))
  with check (organization_id = public.rc_current_org_id());

-- ============================================================================
-- employees
-- ============================================================================
drop policy if exists employees_select on public.employees;
create policy employees_select on public.employees
  for select to authenticated
  using (organization_id = public.rc_current_org_id());

drop policy if exists employees_insert on public.employees;
create policy employees_insert on public.employees
  for insert to authenticated
  with check (organization_id = public.rc_current_org_id() and public.rc_has_permission('employee.manage'));

drop policy if exists employees_update on public.employees;
create policy employees_update on public.employees
  for update to authenticated
  using (organization_id = public.rc_current_org_id() and public.rc_has_permission('employee.manage'))
  with check (organization_id = public.rc_current_org_id());

-- ============================================================================
-- users
-- ============================================================================
drop policy if exists users_select on public.users;
create policy users_select on public.users
  for select to authenticated
  using (organization_id = public.rc_current_org_id());

drop policy if exists users_insert on public.users;
create policy users_insert on public.users
  for insert to authenticated
  with check (organization_id = public.rc_current_org_id() and public.rc_has_permission('user.manage'));

-- A user may update their own profile; user.manage covers managing others.
drop policy if exists users_update on public.users;
create policy users_update on public.users
  for update to authenticated
  using (
    organization_id = public.rc_current_org_id()
    and (auth_user_id = auth.uid() or public.rc_has_permission('user.manage'))
  )
  with check (organization_id = public.rc_current_org_id());

-- ============================================================================
-- roles  (own-org roles + read-only visibility of global system roles)
-- ============================================================================
drop policy if exists roles_select on public.roles;
create policy roles_select on public.roles
  for select to authenticated
  using (organization_id = public.rc_current_org_id() or organization_id is null);

drop policy if exists roles_insert on public.roles;
create policy roles_insert on public.roles
  for insert to authenticated
  with check (
    organization_id = public.rc_current_org_id()
    and is_system = false
    and public.rc_has_permission('role.manage')
  );

drop policy if exists roles_update on public.roles;
create policy roles_update on public.roles
  for update to authenticated
  using (
    organization_id = public.rc_current_org_id()
    and is_system = false
    and public.rc_has_permission('role.manage')
  )
  with check (organization_id = public.rc_current_org_id() and is_system = false);

-- ============================================================================
-- permissions  (global catalog: read-only to all authenticated; writes = service_role)
-- ============================================================================
drop policy if exists permissions_select on public.permissions;
create policy permissions_select on public.permissions
  for select to authenticated
  using (true);

-- ============================================================================
-- role_permissions  (scoped through the parent role)
-- ============================================================================
drop policy if exists role_permissions_select on public.role_permissions;
create policy role_permissions_select on public.role_permissions
  for select to authenticated
  using (exists (
    select 1 from public.roles r
    where r.id = role_id
      and (r.organization_id = public.rc_current_org_id() or r.organization_id is null)
  ));

drop policy if exists role_permissions_insert on public.role_permissions;
create policy role_permissions_insert on public.role_permissions
  for insert to authenticated
  with check (
    public.rc_has_permission('role.manage')
    and exists (
      select 1 from public.roles r
      where r.id = role_id
        and r.organization_id = public.rc_current_org_id()
        and r.is_system = false
    )
  );

drop policy if exists role_permissions_delete on public.role_permissions;
create policy role_permissions_delete on public.role_permissions
  for delete to authenticated
  using (
    public.rc_has_permission('role.manage')
    and exists (
      select 1 from public.roles r
      where r.id = role_id
        and r.organization_id = public.rc_current_org_id()
        and r.is_system = false
    )
  );

-- ============================================================================
-- user_roles
-- ============================================================================
drop policy if exists user_roles_select on public.user_roles;
create policy user_roles_select on public.user_roles
  for select to authenticated
  using (organization_id = public.rc_current_org_id());

drop policy if exists user_roles_insert on public.user_roles;
create policy user_roles_insert on public.user_roles
  for insert to authenticated
  with check (organization_id = public.rc_current_org_id() and public.rc_has_permission('user.manage'));

drop policy if exists user_roles_update on public.user_roles;
create policy user_roles_update on public.user_roles
  for update to authenticated
  using (organization_id = public.rc_current_org_id() and public.rc_has_permission('user.manage'))
  with check (organization_id = public.rc_current_org_id());

drop policy if exists user_roles_delete on public.user_roles;
create policy user_roles_delete on public.user_roles
  for delete to authenticated
  using (organization_id = public.rc_current_org_id() and public.rc_has_permission('user.manage'));
