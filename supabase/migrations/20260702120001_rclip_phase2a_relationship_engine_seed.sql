-- ============================================================================
-- RCLIP — Phase 2A · Relationship Engine — SEED
-- ----------------------------------------------------------------------------
-- Seeds: contact permission catalog + grants to system roles, and GLOBAL
-- system contact_tags (organization_id NULL, is_system = true).
-- Contact "roles" are an enumerated CHECK on contact_roles (no catalog table),
-- so there is nothing to seed for them.
-- Idempotent: ON CONFLICT DO NOTHING against Phase 1 / 2A unique indexes.
-- Runs with elevated privileges (bypasses RLS).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Contact permissions
-- ----------------------------------------------------------------------------
insert into public.permissions (code, resource, action, description, category) values
  ('contact.read',     'contact', 'read',     'View contacts and related records',        'Relationship'),
  ('contact.manage',   'contact', 'manage',   'Create / edit contacts and related records','Relationship'),
  ('contact.pii.read', 'contact', 'pii_read', 'View sensitive identity documents (PII)',   'Relationship'),
  ('contact.merge',    'contact', 'merge',    'Merge duplicate contacts',                  'Relationship')
on conflict (code) do nothing;

-- ----------------------------------------------------------------------------
-- 2. Grant contact permissions to system roles
-- ----------------------------------------------------------------------------

-- master_admin: all contact permissions.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in ('contact.read','contact.manage','contact.pii.read','contact.merge')
where r.is_system and r.organization_id is null and r.code = 'master_admin'
on conflict (role_id, permission_id) do nothing;

-- branch_manager: read + manage + pii.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in ('contact.read','contact.manage','contact.pii.read')
where r.is_system and r.organization_id is null and r.code = 'branch_manager'
on conflict (role_id, permission_id) do nothing;

-- loan_officer: read + manage.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in ('contact.read','contact.manage')
where r.is_system and r.organization_id is null and r.code = 'loan_officer'
on conflict (role_id, permission_id) do nothing;

-- credit_analyst: read + pii (needs KYC visibility).
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in ('contact.read','contact.pii.read')
where r.is_system and r.organization_id is null and r.code = 'credit_analyst'
on conflict (role_id, permission_id) do nothing;

-- team_lead & read_only: read only.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code = 'contact.read'
where r.is_system and r.organization_id is null and r.code in ('team_lead','read_only')
on conflict (role_id, permission_id) do nothing;

-- ----------------------------------------------------------------------------
-- 3. Global system contact tags (organization_id NULL, is_system = true)
-- ----------------------------------------------------------------------------
insert into public.contact_tags (organization_id, code, name, category, color, description, is_system) values
  (null, 'lead_hot',        'Hot',             'temperature', '#ef4444', 'High-intent lead',                 true),
  (null, 'lead_warm',       'Warm',            'temperature', '#f59e0b', 'Moderate-intent lead',             true),
  (null, 'lead_cold',       'Cold',            'temperature', '#3b82f6', 'Low-intent lead',                  true),
  (null, 'vip',             'VIP',             'value',       '#a855f7', 'VIP / priority contact',           true),
  (null, 'high_value',      'High Value',      'value',       '#22c55e', 'High-value opportunity',           true),
  (null, 'nri',             'NRI',             'segment',     '#06b6d4', 'Non-resident Indian',              true),
  (null, 'repeat_customer', 'Repeat Customer', 'segment',     '#10b981', 'Existing / repeat customer',       true),
  (null, 'watchlist',       'Watchlist',       'risk',        '#dc2626', 'Flagged for risk / compliance',    true)
on conflict (code) where organization_id is null and is_system do nothing;
