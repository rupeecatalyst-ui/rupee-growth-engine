-- ============================================================================
-- RCLIP — Phase 2B · Product Intelligence Engine — SEED
-- ----------------------------------------------------------------------------
-- Seeds: product permission catalog + grants to system roles, and GLOBAL system
-- product_categories (organization_id NULL, is_system = true).
--
-- Workflow stages, rules, and dynamic fields are per-product (tenant-owned) and
-- are provisioned at product-creation time by the service layer (from templates),
-- so there is nothing global to seed for them here.
--
-- Idempotent: ON CONFLICT ... DO NOTHING. Runs with elevated privileges.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Product permissions
-- ----------------------------------------------------------------------------
insert into public.permissions (code, resource, action, description, category) values
  ('product.read',   'product', 'read',   'View products and their configuration', 'Product'),
  ('product.manage', 'product', 'manage', 'Create / edit products, rules, stages',  'Product')
on conflict (code) do nothing;

-- ----------------------------------------------------------------------------
-- 2. Grant product permissions to system roles
-- ----------------------------------------------------------------------------

-- master_admin: read + manage.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in ('product.read', 'product.manage')
where r.is_system and r.organization_id is null and r.code = 'master_admin'
on conflict (role_id, permission_id) do nothing;

-- branch_manager: read + manage.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in ('product.read', 'product.manage')
where r.is_system and r.organization_id is null and r.code = 'branch_manager'
on conflict (role_id, permission_id) do nothing;

-- team_lead, loan_officer, credit_analyst, read_only: read only.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code = 'product.read'
where r.is_system and r.organization_id is null
  and r.code in ('team_lead', 'loan_officer', 'credit_analyst', 'read_only')
on conflict (role_id, permission_id) do nothing;

-- ----------------------------------------------------------------------------
-- 3. Global system product categories (organization_id NULL, is_system = true)
-- ----------------------------------------------------------------------------
insert into public.product_categories (organization_id, code, name, description, icon, sort_order, is_system) values
  (null, 'retail_mortgage',           'Retail Mortgages',            'Home loans, balance transfer, loan against property', 'home',        10, true),
  (null, 'business_finance',          'Business Finance',            'Business loans and working capital facilities',       'briefcase',   20, true),
  (null, 'structured_project_finance','Structured & Project Finance','Project, construction and structured debt',           'building',    30, true),
  (null, 'specialized_finance',       'Specialized Finance',         'Equipment finance, LRD, loan against securities',     'layers',      40, true),
  (null, 'wholesale_syndication',     'Wholesale & Syndicated Debt', 'Debt syndication and wholesale capital',              'network',     50, true),
  (null, 'capital_markets_advisory',  'Capital Markets & Advisory',  'Equity raise, PE/VC, IPO and M&A advisory',           'trending-up', 60, true)
on conflict (code) where organization_id is null and is_system do nothing;
