-- ============================================================================
-- RCLIP — Sprint 4 · Enterprise Master Data Platform (MDM) — SEED
-- ----------------------------------------------------------------------------
-- Seeds:
--   1. MDM permission catalog + grants to system roles.
--   2. Global system entity_types      (organization_id NULL, is_system).
--   3. Global system business_roles     (with applies_to).
--   4. Global system acquisition_channels.
--   5. Global system team_roles.
-- Idempotent: ON CONFLICT DO NOTHING against Phase 1 / Sprint 4 unique indexes.
-- Runs with elevated privileges (bypasses RLS).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Permissions
-- ----------------------------------------------------------------------------
insert into public.permissions (code, resource, action, description, category) values
  ('entity.read',        'entity',       'read',    'View entities (legal organizations)',                  'MasterData'),
  ('entity.manage',      'entity',       'manage',  'Create / edit entities',                               'MasterData'),
  ('relationship.read',  'relationship', 'read',    'View relationship profile, roles, coverage, intel',    'Relationship'),
  ('relationship.manage','relationship', 'manage',  'Manage relationship profile, roles, coverage, intel',  'Relationship'),
  ('mdm.config',         'mdm',          'config',  'Manage MDM reference catalogs (types, roles, channels)','MasterData')
on conflict (code) do nothing;

-- ----------------------------------------------------------------------------
-- 2. Grant MDM permissions to system roles
-- ----------------------------------------------------------------------------

-- master_admin: everything.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in ('entity.read','entity.manage','relationship.read','relationship.manage','mdm.config')
where r.is_system and r.organization_id is null and r.code = 'master_admin'
on conflict (role_id, permission_id) do nothing;

-- branch_manager: full entity + relationship + config.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in ('entity.read','entity.manage','relationship.read','relationship.manage','mdm.config')
where r.is_system and r.organization_id is null and r.code = 'branch_manager'
on conflict (role_id, permission_id) do nothing;

-- loan_officer: entity + relationship (no catalog config).
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in ('entity.read','entity.manage','relationship.read','relationship.manage')
where r.is_system and r.organization_id is null and r.code = 'loan_officer'
on conflict (role_id, permission_id) do nothing;

-- credit_analyst: read entity + relationship.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in ('entity.read','relationship.read')
where r.is_system and r.organization_id is null and r.code = 'credit_analyst'
on conflict (role_id, permission_id) do nothing;

-- team_lead & read_only: read only.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in ('entity.read','relationship.read')
where r.is_system and r.organization_id is null and r.code in ('team_lead','read_only')
on conflict (role_id, permission_id) do nothing;

-- ----------------------------------------------------------------------------
-- 3. Global system entity_types
-- ----------------------------------------------------------------------------
insert into public.entity_types (organization_id, code, name, description, sort_order, is_system) values
  (null, 'institution',  'Institution',          'Capital provider: bank / NBFC / HFC / fund',   10, true),
  (null, 'bank',          'Bank',                 'Scheduled / commercial bank',                  11, true),
  (null, 'nbfc',          'NBFC',                 'Non-banking financial company',                12, true),
  (null, 'hfc',           'HFC',                  'Housing finance company',                      13, true),
  (null, 'aif',           'AIF',                  'Alternative investment fund',                  14, true),
  (null, 'pe_fund',       'PE Fund',              'Private equity fund',                          15, true),
  (null, 'corporate',     'Corporate',            'Corporate / company client',                   20, true),
  (null, 'msme',          'MSME',                 'Micro, small & medium enterprise',             21, true),
  (null, 'builder',       'Builder',              'Real-estate builder',                          30, true),
  (null, 'developer',     'Developer',            'Real-estate developer',                        31, true),
  (null, 'insurance',     'Insurance Company',    'Insurance provider',                           40, true),
  (null, 'amc',           'AMC',                  'Asset management company',                     41, true),
  (null, 'ca_firm',       'CA Firm',              'Chartered accountancy firm',                   50, true),
  (null, 'law_firm',      'Law Firm',             'Legal / advocacy firm',                        51, true),
  (null, 'vendor',        'Vendor',               'Service / product vendor',                     60, true),
  (null, 'government',    'Government',           'Government department / authority',            70, true),
  (null, 'trust',         'Trust',                'Trust',                                        80, true),
  (null, 'partnership',   'Partnership',          'Partnership firm',                             81, true),
  (null, 'llp',           'LLP',                  'Limited liability partnership',                82, true),
  (null, 'other',         'Other',                'Other entity type',                            99, true)
on conflict (code) where organization_id is null and is_system do nothing;

-- ----------------------------------------------------------------------------
-- 4. Global system business_roles (shared by Contacts and/or Entities)
--    applies_to ∈ contact | entity | both
-- ----------------------------------------------------------------------------
insert into public.business_roles (organization_id, code, name, category, applies_to, sort_order, is_system) values
  -- shared (contact or entity)
  (null, 'client',                  'Client',                   'client',       'both',    10, true),
  (null, 'borrower',                'Borrower',                 'financing',    'both',    11, true),
  (null, 'guarantor',               'Guarantor',                'financing',    'both',    12, true),
  (null, 'payee',                   'Payee',                    'commercial',   'both',    13, true),
  (null, 'referral_partner',        'Referral Partner',         'channel',      'both',    14, true),
  (null, 'strategic_partner',       'Strategic Partner',        'channel',      'both',    15, true),
  (null, 'vendor',                  'Vendor',                   'vendor',       'both',    16, true),
  -- individual (contact) roles
  (null, 'co_applicant',            'Co-Applicant',             'financing',    'contact', 20, true),
  (null, 'director',                'Director',                 'stakeholder',  'contact', 21, true),
  (null, 'partner',                 'Partner',                  'stakeholder',  'contact', 22, true),
  (null, 'proprietor',              'Proprietor',               'stakeholder',  'contact', 23, true),
  (null, 'shareholder',             'Shareholder',              'stakeholder',  'contact', 24, true),
  (null, 'institution_rm',          'Institution RM',           'institution',  'contact', 30, true),
  (null, 'institution_credit',      'Institution Credit Mgr',   'institution',  'contact', 31, true),
  (null, 'institution_legal',       'Institution Legal',        'institution',  'contact', 32, true),
  (null, 'institution_operations',  'Institution Operations',   'institution',  'contact', 33, true),
  (null, 'builder_executive',       'Builder Executive',        'builder',      'contact', 40, true),
  (null, 'builder_director',        'Builder Director',         'builder',      'contact', 41, true),
  (null, 'architect',               'Architect',                'professional', 'contact', 50, true),
  (null, 'valuer',                  'Valuer',                   'professional', 'contact', 51, true),
  (null, 'ca',                      'Chartered Accountant',     'professional', 'contact', 52, true),
  (null, 'cs',                      'Company Secretary',        'professional', 'contact', 53, true),
  (null, 'advocate',                'Advocate',                 'professional', 'contact', 54, true),
  (null, 'insurance_advisor',       'Insurance Advisor',        'professional', 'contact', 55, true),
  (null, 'mf_advisor',              'Mutual Fund Advisor',      'professional', 'contact', 56, true),
  (null, 'employee',                'Employee',                 'internal',     'contact', 60, true),
  -- organization (entity) roles
  (null, 'institution',             'Institution',              'institution',  'entity',  70, true),
  (null, 'builder',                 'Builder',                  'builder',      'entity',  71, true),
  (null, 'developer',               'Developer',                'builder',      'entity',  72, true),
  (null, 'corporate',               'Corporate',                'client',       'entity',  73, true),
  (null, 'msme',                    'MSME',                     'client',       'entity',  74, true),
  (null, 'insurance_company',       'Insurance Company',        'institution',  'entity',  75, true),
  (null, 'amc',                     'AMC',                      'institution',  'entity',  76, true),
  (null, 'ca_firm',                 'CA Firm',                  'professional', 'entity',  77, true),
  (null, 'law_firm',                'Law Firm',                 'professional', 'entity',  78, true)
on conflict (code) where organization_id is null and is_system do nothing;

-- ----------------------------------------------------------------------------
-- 5. Global system acquisition_channels (Relationship Source, part 1)
-- ----------------------------------------------------------------------------
insert into public.acquisition_channels (organization_id, code, name, category, sort_order, is_system) values
  (null, 'existing_client',   'Existing Client',   'relationship', 10, true),
  (null, 'referral',          'Referral',          'relationship', 11, true),
  (null, 'builder',           'Builder',           'partner',      20, true),
  (null, 'institution',       'Institution',       'partner',      21, true),
  (null, 'ca',                'CA',                'professional', 22, true),
  (null, 'advocate',          'Advocate',          'professional', 23, true),
  (null, 'digital_campaign',  'Digital Campaign',  'digital',      30, true),
  (null, 'website',           'Website',           'digital',      31, true),
  (null, 'linkedin',          'LinkedIn',          'digital',      32, true),
  (null, 'walk_in',           'Walk-in',           'direct',       40, true),
  (null, 'networking_event',  'Networking Event',  'direct',       41, true),
  (null, 'other',             'Other',             'other',        99, true)
on conflict (code) where organization_id is null and is_system do nothing;

-- ----------------------------------------------------------------------------
-- 6. Global system team_roles (generic operational roles reused across modules:
--    Coverage Teams, Opportunity Teams, Deal Teams, Collections, Projects, ...)
-- ----------------------------------------------------------------------------
insert into public.team_roles (organization_id, code, name, description, sort_order, is_system) values
  (null, 'primary_ib',        'Primary Investment Banker',    'Primary operational lead on the working relationship',  10, true),
  (null, 'supporting_ib',     'Supporting Investment Banker', 'Supports the primary IB',                               11, true),
  (null, 'operations_exec',   'Operations Executive',         'Operational execution / coordination',                  12, true),
  (null, 'credit_coordinator','Credit Coordinator',           'Coordinates credit / institution interface',            13, true),
  (null, 'relationship_mgr',  'Relationship Manager',         'General relationship management',                       14, true)
on conflict (code) where organization_id is null and is_system do nothing;
