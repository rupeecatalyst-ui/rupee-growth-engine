-- ============================================================================
-- RCLIP — Phase 1 · Identity & Access — REVIEW PATCH
-- ----------------------------------------------------------------------------
-- Applies ONLY the approved engineering-review items. Does NOT alter the
-- original Phase 1 migrations and introduces no new Phase 1 tables.
--
--   1. SELECT RLS policies exclude soft-deleted rows (deleted_at IS NULL).
--   2. BEFORE UPDATE guard blocks non-admins from editing protected user fields
--      (is_org_owner, is_active, organization_id, employee_id, auth_user_id).
--   3. Role-hierarchy enforcement: cannot assign a role above your own level.
--   4. RLS helper calls wrapped in (SELECT fn()) for single init-plan eval.
--   5. Case-insensitive organization slug + user email via citext.
--   6. (Optional) COMMENT ON for all Phase 1 tables & columns.
--
-- Fully idempotent & re-runnable. Server/service contexts (auth.uid() IS NULL)
-- bypass the guards so seeding, migrations and backend admin keep working.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ITEM 5 · Case-insensitive slug + email (citext)
-- ----------------------------------------------------------------------------
create extension if not exists citext with schema extensions;

-- organizations.slug -> citext (existing unique index rebuilds automatically)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'organizations'
      and column_name = 'slug' and udt_name <> 'citext'
  ) then
    alter table public.organizations alter column slug type extensions.citext;
  end if;
end $$;

-- users.email -> citext
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'users'
      and column_name = 'email' and udt_name <> 'citext'
  ) then
    alter table public.users alter column email type extensions.citext;
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- ITEM 2 & 3 · Guard helper functions
-- ----------------------------------------------------------------------------

-- Highest role hierarchy_level currently held by the calling user (-1 if none).
create or replace function public.rc_current_max_role_level()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(max(r.hierarchy_level), -1)
  from public.users u
  join public.user_roles ur
    on ur.user_id = u.id
   and ur.deleted_at is null
   and ur.valid_from <= now()
   and (ur.valid_until is null or ur.valid_until > now())
  join public.roles r on r.id = ur.role_id
  where u.auth_user_id = auth.uid()
    and u.deleted_at is null
    and u.is_active
$$;

-- Blocks non-privileged users from mutating protected columns on public.users.
create or replace function public.rc_guard_user_protected_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Server-side / service-role / migration contexts have no end-user JWT.
  if auth.uid() is null then
    return new;
  end if;

  -- Users with user.manage may modify protected fields.
  if public.rc_has_permission('user.manage') then
    return new;
  end if;

  if new.is_org_owner    is distinct from old.is_org_owner
     or new.is_active        is distinct from old.is_active
     or new.organization_id  is distinct from old.organization_id
     or new.employee_id      is distinct from old.employee_id
     or new.auth_user_id     is distinct from old.auth_user_id then
    raise exception
      'Insufficient privileges to modify protected user fields (is_org_owner, is_active, organization_id, employee_id, auth_user_id)'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

-- Prevents assigning a role whose hierarchy_level exceeds the assigner's max.
create or replace function public.rc_guard_user_role_hierarchy()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_target_level integer;
  v_actor_level  integer;
begin
  -- Server-side / service-role / migration contexts bypass the check.
  if auth.uid() is null then
    return new;
  end if;

  select r.hierarchy_level into v_target_level
  from public.roles r where r.id = new.role_id;

  v_actor_level := public.rc_current_max_role_level();

  if v_target_level is not null and v_target_level > v_actor_level then
    raise exception
      'Cannot assign a role with hierarchy level % which exceeds your own maximum level %',
      v_target_level, v_actor_level
      using errcode = '42501';
  end if;

  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- Attach guard triggers (idempotent)
-- ----------------------------------------------------------------------------
drop trigger if exists trg_users_guard_protected on public.users;
create trigger trg_users_guard_protected
  before update on public.users
  for each row execute function public.rc_guard_user_protected_fields();

drop trigger if exists trg_user_roles_guard_hierarchy on public.user_roles;
create trigger trg_user_roles_guard_hierarchy
  before insert or update on public.user_roles
  for each row execute function public.rc_guard_user_role_hierarchy();

-- ============================================================================
-- ITEMS 1 & 4 · Recreate RLS policies
--   - SELECT policies add `deleted_at is null`
--   - all helper calls wrapped as (select fn()) for planner init-plan caching
-- ============================================================================

-- organizations --------------------------------------------------------------
drop policy if exists organizations_select on public.organizations;
create policy organizations_select on public.organizations
  for select to authenticated
  using (id = (select public.rc_current_org_id()) and deleted_at is null);

drop policy if exists organizations_update on public.organizations;
create policy organizations_update on public.organizations
  for update to authenticated
  using (id = (select public.rc_current_org_id()) and (select public.rc_has_permission('org.manage')))
  with check (id = (select public.rc_current_org_id()));

-- branches --------------------------------------------------------------------
drop policy if exists branches_select on public.branches;
create policy branches_select on public.branches
  for select to authenticated
  using (organization_id = (select public.rc_current_org_id()) and deleted_at is null);

drop policy if exists branches_insert on public.branches;
create policy branches_insert on public.branches
  for insert to authenticated
  with check (organization_id = (select public.rc_current_org_id())
              and (select public.rc_has_permission('branch.manage')));

drop policy if exists branches_update on public.branches;
create policy branches_update on public.branches
  for update to authenticated
  using (organization_id = (select public.rc_current_org_id())
         and (select public.rc_has_permission('branch.manage')))
  with check (organization_id = (select public.rc_current_org_id()));

-- employees -------------------------------------------------------------------
drop policy if exists employees_select on public.employees;
create policy employees_select on public.employees
  for select to authenticated
  using (organization_id = (select public.rc_current_org_id()) and deleted_at is null);

drop policy if exists employees_insert on public.employees;
create policy employees_insert on public.employees
  for insert to authenticated
  with check (organization_id = (select public.rc_current_org_id())
              and (select public.rc_has_permission('employee.manage')));

drop policy if exists employees_update on public.employees;
create policy employees_update on public.employees
  for update to authenticated
  using (organization_id = (select public.rc_current_org_id())
         and (select public.rc_has_permission('employee.manage')))
  with check (organization_id = (select public.rc_current_org_id()));

-- users -----------------------------------------------------------------------
drop policy if exists users_select on public.users;
create policy users_select on public.users
  for select to authenticated
  using (organization_id = (select public.rc_current_org_id()) and deleted_at is null);

drop policy if exists users_insert on public.users;
create policy users_insert on public.users
  for insert to authenticated
  with check (organization_id = (select public.rc_current_org_id())
              and (select public.rc_has_permission('user.manage')));

-- Self-service edits allowed; protected columns are enforced by the BEFORE UPDATE guard.
drop policy if exists users_update on public.users;
create policy users_update on public.users
  for update to authenticated
  using (
    organization_id = (select public.rc_current_org_id())
    and (auth_user_id = (select auth.uid()) or (select public.rc_has_permission('user.manage')))
  )
  with check (organization_id = (select public.rc_current_org_id()));

-- roles -----------------------------------------------------------------------
drop policy if exists roles_select on public.roles;
create policy roles_select on public.roles
  for select to authenticated
  using ((organization_id = (select public.rc_current_org_id()) or organization_id is null)
         and deleted_at is null);

drop policy if exists roles_insert on public.roles;
create policy roles_insert on public.roles
  for insert to authenticated
  with check (
    organization_id = (select public.rc_current_org_id())
    and is_system = false
    and (select public.rc_has_permission('role.manage'))
  );

drop policy if exists roles_update on public.roles;
create policy roles_update on public.roles
  for update to authenticated
  using (
    organization_id = (select public.rc_current_org_id())
    and is_system = false
    and (select public.rc_has_permission('role.manage'))
  )
  with check (organization_id = (select public.rc_current_org_id()) and is_system = false);

-- permissions (global catalog: read-only; unchanged semantics, recreated for consistency)
drop policy if exists permissions_select on public.permissions;
create policy permissions_select on public.permissions
  for select to authenticated
  using (true);

-- role_permissions (scoped through parent role; excludes soft-deleted roles) --
drop policy if exists role_permissions_select on public.role_permissions;
create policy role_permissions_select on public.role_permissions
  for select to authenticated
  using (exists (
    select 1 from public.roles r
    where r.id = role_id
      and (r.organization_id = (select public.rc_current_org_id()) or r.organization_id is null)
      and r.deleted_at is null
  ));

drop policy if exists role_permissions_insert on public.role_permissions;
create policy role_permissions_insert on public.role_permissions
  for insert to authenticated
  with check (
    (select public.rc_has_permission('role.manage'))
    and exists (
      select 1 from public.roles r
      where r.id = role_id
        and r.organization_id = (select public.rc_current_org_id())
        and r.is_system = false
        and r.deleted_at is null
    )
  );

drop policy if exists role_permissions_delete on public.role_permissions;
create policy role_permissions_delete on public.role_permissions
  for delete to authenticated
  using (
    (select public.rc_has_permission('role.manage'))
    and exists (
      select 1 from public.roles r
      where r.id = role_id
        and r.organization_id = (select public.rc_current_org_id())
        and r.is_system = false
        and r.deleted_at is null
    )
  );

-- user_roles ------------------------------------------------------------------
drop policy if exists user_roles_select on public.user_roles;
create policy user_roles_select on public.user_roles
  for select to authenticated
  using (organization_id = (select public.rc_current_org_id()) and deleted_at is null);

drop policy if exists user_roles_insert on public.user_roles;
create policy user_roles_insert on public.user_roles
  for insert to authenticated
  with check (organization_id = (select public.rc_current_org_id())
              and (select public.rc_has_permission('user.manage')));

drop policy if exists user_roles_update on public.user_roles;
create policy user_roles_update on public.user_roles
  for update to authenticated
  using (organization_id = (select public.rc_current_org_id())
         and (select public.rc_has_permission('user.manage')))
  with check (organization_id = (select public.rc_current_org_id()));

drop policy if exists user_roles_delete on public.user_roles;
create policy user_roles_delete on public.user_roles
  for delete to authenticated
  using (organization_id = (select public.rc_current_org_id())
         and (select public.rc_has_permission('user.manage')));

-- ============================================================================
-- ITEM 6 (optional) · Documentation comments
-- ============================================================================

-- organizations
comment on table public.organizations is 'Root tenant. Every business record belongs to one organization.';
comment on column public.organizations.id is 'Primary key (UUID).';
comment on column public.organizations.name is 'Display name of the organization.';
comment on column public.organizations.legal_name is 'Registered legal entity name.';
comment on column public.organizations.slug is 'Unique URL-safe identifier (case-insensitive / citext).';
comment on column public.organizations.gstin is 'GST identification number (India).';
comment on column public.organizations.pan is 'Permanent Account Number of the entity.';
comment on column public.organizations.rbi_registration_no is 'RBI registration number, if applicable.';
comment on column public.organizations.logo_url is 'URL of the organization logo.';
comment on column public.organizations.primary_email is 'Primary contact email.';
comment on column public.organizations.primary_phone is 'Primary contact phone.';
comment on column public.organizations.address is 'Structured postal address (jsonb).';
comment on column public.organizations.timezone is 'IANA timezone; default Asia/Kolkata.';
comment on column public.organizations.currency is 'ISO currency code; default INR.';
comment on column public.organizations.status is 'active | suspended | closed.';
comment on column public.organizations.settings is 'Arbitrary org-level feature flags / settings (jsonb).';

-- branches
comment on table public.branches is 'Physical/operational branch unit within an organization.';
comment on column public.branches.id is 'Primary key (UUID).';
comment on column public.branches.organization_id is 'Owning organization (tenant boundary).';
comment on column public.branches.parent_branch_id is 'Parent branch for region->branch hierarchy.';
comment on column public.branches.branch_manager_employee_id is 'Employee acting as branch manager.';
comment on column public.branches.branch_code is 'Human-readable code, unique per organization.';
comment on column public.branches.name is 'Branch display name.';
comment on column public.branches.address is 'Structured postal address (jsonb).';
comment on column public.branches.city is 'City.';
comment on column public.branches.state is 'State / province.';
comment on column public.branches.pincode is 'Postal / PIN code.';
comment on column public.branches.phone is 'Branch contact phone.';
comment on column public.branches.email is 'Branch contact email.';
comment on column public.branches.branch_type is 'head_office | regional | branch | virtual.';
comment on column public.branches.status is 'active | inactive | closed.';
comment on column public.branches.go_live_date is 'Date the branch became operational.';

-- employees
comment on table public.employees is 'Internal staff/executives; may exist before/without a login user.';
comment on column public.employees.id is 'Primary key (UUID).';
comment on column public.employees.organization_id is 'Owning organization (tenant boundary).';
comment on column public.employees.branch_id is 'Branch the employee belongs to.';
comment on column public.employees.reporting_manager_id is 'Self-referencing reporting hierarchy.';
comment on column public.employees.user_id is 'Linked login identity (1:1, optional).';
comment on column public.employees.employee_code is 'Human-readable code, unique per organization.';
comment on column public.employees.first_name is 'Given name.';
comment on column public.employees.last_name is 'Family name.';
comment on column public.employees.designation is 'Job title.';
comment on column public.employees.department is 'sales | credit | operations | marketing | management.';
comment on column public.employees.official_email is 'Official work email.';
comment on column public.employees.official_phone is 'Official work phone.';
comment on column public.employees.date_of_joining is 'Joining date.';
comment on column public.employees.date_of_exit is 'Exit date (>= joining date).';
comment on column public.employees.status is 'active | on_leave | inactive | terminated.';

-- users
comment on table public.users is 'Application login identity mapped to Supabase auth.users.';
comment on column public.users.id is 'Primary key (UUID).';
comment on column public.users.organization_id is 'Owning organization (tenant boundary).';
comment on column public.users.auth_user_id is 'FK to auth.users(id); links Supabase auth to app profile.';
comment on column public.users.employee_id is 'Linked employee record (1:1, optional).';
comment on column public.users.primary_branch_id is 'Primary branch for scoping.';
comment on column public.users.email is 'Login email, unique per org (case-insensitive / citext).';
comment on column public.users.phone is 'Contact phone.';
comment on column public.users.display_name is 'Display name.';
comment on column public.users.avatar_url is 'Avatar image URL.';
comment on column public.users.is_active is 'Whether the user may authenticate/operate. Protected field.';
comment on column public.users.is_org_owner is 'Bootstrap organization owner flag. Protected field.';
comment on column public.users.last_login_at is 'Timestamp of last successful login.';
comment on column public.users.locale is 'UI locale; default en.';
comment on column public.users.mfa_enabled is 'Multi-factor authentication enabled.';

-- roles
comment on table public.roles is 'Named role definitions; system roles are global (organization_id IS NULL).';
comment on column public.roles.id is 'Primary key (UUID).';
comment on column public.roles.organization_id is 'Owning organization; NULL for global system roles.';
comment on column public.roles.name is 'Human-readable role name.';
comment on column public.roles.code is 'Machine code; unique per org, or unique globally for system roles.';
comment on column public.roles.description is 'Role description.';
comment on column public.roles.is_system is 'Protected platform-managed role when true.';
comment on column public.roles.hierarchy_level is 'Precedence; higher levels cannot be assigned by lower-level users.';

-- permissions
comment on table public.permissions is 'Global capability catalog (resource.action). Not tenant-scoped.';
comment on column public.permissions.id is 'Primary key (UUID).';
comment on column public.permissions.code is 'Unique permission code in resource.action format.';
comment on column public.permissions.resource is 'Resource name (e.g. lead, branch).';
comment on column public.permissions.action is 'Action name (e.g. read, manage).';
comment on column public.permissions.description is 'Human-readable description.';
comment on column public.permissions.category is 'Grouping category for UI.';

-- role_permissions
comment on table public.role_permissions is 'Junction granting permissions to roles.';
comment on column public.role_permissions.id is 'Primary key (UUID).';
comment on column public.role_permissions.role_id is 'Role receiving the permission.';
comment on column public.role_permissions.permission_id is 'Granted permission.';
comment on column public.role_permissions.granted_at is 'When the grant was created.';

-- user_roles
comment on table public.user_roles is 'Junction assigning roles to users (multi-role, optionally scoped/time-bound).';
comment on column public.user_roles.id is 'Primary key (UUID).';
comment on column public.user_roles.organization_id is 'Owning organization (tenant boundary).';
comment on column public.user_roles.user_id is 'User receiving the role.';
comment on column public.user_roles.role_id is 'Assigned role.';
comment on column public.user_roles.scope is 'Optional branch/team scoping (jsonb).';
comment on column public.user_roles.valid_from is 'Assignment start time.';
comment on column public.user_roles.valid_until is 'Assignment expiry (NULL = no expiry).';
comment on column public.user_roles.assigned_by is 'User who created the assignment.';
