-- ============================================================================
-- RCLIP — Phase 1 · Identity & Access — SEED
-- ----------------------------------------------------------------------------
-- Seeds the GLOBAL system permission catalog and default SYSTEM roles
-- (organization_id IS NULL, is_system = true) plus their role_permission grants.
-- No tenant/org data is seeded here (orgs are created during onboarding).
-- Idempotent: every INSERT uses ON CONFLICT ... DO NOTHING against a
-- unique index defined in the schema migration. Safe to re-run.
-- Runs with elevated privileges (service_role / migration role) → bypasses RLS.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. System permissions (resource.action)
-- ----------------------------------------------------------------------------
insert into public.permissions (code, resource, action, description, category) values
  -- organization
  ('org.read',          'organization', 'read',   'View organization profile',        'Organization'),
  ('org.manage',        'organization', 'manage', 'Edit organization settings',        'Organization'),
  -- branch
  ('branch.read',       'branch',       'read',   'View branches',                     'Organization'),
  ('branch.manage',     'branch',       'manage', 'Create / edit / close branches',    'Organization'),
  -- employee
  ('employee.read',     'employee',     'read',   'View employees',                    'People'),
  ('employee.manage',   'employee',     'manage', 'Create / edit employees',           'People'),
  -- user
  ('user.read',         'user',         'read',   'View users',                        'People'),
  ('user.manage',       'user',         'manage', 'Create / edit users, assign roles', 'People'),
  -- role & permission
  ('role.read',         'role',         'read',   'View roles',                        'Access Control'),
  ('role.manage',       'role',         'manage', 'Create / edit roles & grants',      'Access Control'),
  ('permission.read',   'permission',   'read',   'View permission catalog',           'Access Control')
on conflict (code) do nothing;

-- ----------------------------------------------------------------------------
-- 2. Default system roles (global; is_system = true; organization_id NULL)
-- ----------------------------------------------------------------------------
insert into public.roles (name, code, description, is_system, hierarchy_level) values
  ('Super Admin',    'super_admin',    'Platform-wide administrator (RCLIP operator)', true, 100),
  ('Master Admin',   'master_admin',   'Full administrator within an organization',    true,  90),
  ('Branch Manager', 'branch_manager', 'Manages a branch and its team',                true,  70),
  ('Team Lead',      'team_lead',      'Leads a team of executives',                   true,  60),
  ('Loan Officer',   'loan_officer',   'Front-line loan/sales executive',              true,  40),
  ('Credit Analyst', 'credit_analyst', 'Credit assessment and underwriting support',   true,  40),
  ('Read Only',      'read_only',      'View-only access',                             true,  10)
on conflict (code) where organization_id is null and is_system do nothing;

-- ----------------------------------------------------------------------------
-- 3. Role → permission grants
-- ----------------------------------------------------------------------------

-- super_admin & master_admin: ALL permissions.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.is_system and r.organization_id is null
  and r.code in ('super_admin', 'master_admin')
on conflict (role_id, permission_id) do nothing;

-- branch_manager: read everything + manage branch/employee/user.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.code in (
    'org.read','branch.read','branch.manage',
    'employee.read','employee.manage',
    'user.read','user.manage',
    'role.read','permission.read'
  )
where r.is_system and r.organization_id is null and r.code = 'branch_manager'
on conflict (role_id, permission_id) do nothing;

-- team_lead: read + limited user management.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.code in ('org.read','branch.read','employee.read','user.read','role.read')
where r.is_system and r.organization_id is null and r.code = 'team_lead'
on conflict (role_id, permission_id) do nothing;

-- loan_officer & credit_analyst: read-level identity visibility.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.code in ('org.read','branch.read','employee.read','user.read')
where r.is_system and r.organization_id is null
  and r.code in ('loan_officer','credit_analyst')
on conflict (role_id, permission_id) do nothing;

-- read_only: minimal read access.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.code in ('org.read','branch.read','employee.read','user.read')
where r.is_system and r.organization_id is null and r.code = 'read_only'
on conflict (role_id, permission_id) do nothing;
