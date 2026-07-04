-- ============================================================================
-- RCLIP — Opportunity Lifecycle Engine (ADR-008) — SEED
-- ----------------------------------------------------------------------------
-- Seeds:
--   1. Opportunity permission catalog + grants to system roles.
--   2. Global system opportunity_types (drive workflow).
--   3. Standard system pipeline stages for every system type.
--   4. Global system opportunity_objectives.
--   5. Global system opportunity_priorities.
--   6. Global system opportunity_readiness_dimensions.
-- Idempotent: ON CONFLICT DO NOTHING against Phase 1 / ADR-008 unique indexes.
-- Runs with elevated privileges (bypasses RLS).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Permissions
-- ----------------------------------------------------------------------------
insert into public.permissions (code, resource, action, description, category) values
  ('opportunity.read',    'opportunity', 'read',    'View opportunities and related records',           'Opportunity'),
  ('opportunity.manage',  'opportunity', 'manage',  'Create / edit opportunities and related records',  'Opportunity'),
  ('opportunity.approve', 'opportunity', 'approve', 'Approve opportunity stage gates',                  'Opportunity'),
  ('opportunity.config',  'opportunity', 'config',  'Manage opportunity types/stages/objectives/etc.',  'Opportunity')
on conflict (code) do nothing;

-- ----------------------------------------------------------------------------
-- 2. Grants
-- ----------------------------------------------------------------------------
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r
join public.permissions p on p.code in ('opportunity.read','opportunity.manage','opportunity.approve','opportunity.config')
where r.is_system and r.organization_id is null and r.code = 'master_admin'
on conflict (role_id, permission_id) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r
join public.permissions p on p.code in ('opportunity.read','opportunity.manage','opportunity.approve','opportunity.config')
where r.is_system and r.organization_id is null and r.code = 'branch_manager'
on conflict (role_id, permission_id) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r
join public.permissions p on p.code in ('opportunity.read','opportunity.manage')
where r.is_system and r.organization_id is null and r.code = 'loan_officer'
on conflict (role_id, permission_id) do nothing;

-- credit_analyst: read + approve (credit sign-off).
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r
join public.permissions p on p.code in ('opportunity.read','opportunity.approve')
where r.is_system and r.organization_id is null and r.code = 'credit_analyst'
on conflict (role_id, permission_id) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r
join public.permissions p on p.code = 'opportunity.read'
where r.is_system and r.organization_id is null and r.code in ('team_lead','read_only')
on conflict (role_id, permission_id) do nothing;

-- ----------------------------------------------------------------------------
-- 3. Global system opportunity_types
-- ----------------------------------------------------------------------------
insert into public.opportunity_types (organization_id, code, name, category, is_advisory, sort_order, is_system) values
  (null, 'home_loan',            'Home Loan',                'retail_mortgage', false, 10, true),
  (null, 'loan_against_property','Loan Against Property',    'retail_mortgage', false, 11, true),
  (null, 'business_loan',        'Business Loan',            'business',        false, 20, true),
  (null, 'working_capital',      'Working Capital',          'business',        false, 21, true),
  (null, 'construction_finance', 'Construction Finance',     'project',         false, 30, true),
  (null, 'lease_rental_discounting','Lease Rental Discounting','project',       false, 31, true),
  (null, 'private_credit',       'Private Credit',           'structured',      false, 40, true),
  (null, 'insurance',            'Insurance',                'protection',      true,  50, true),
  (null, 'mutual_fund',          'Mutual Fund',              'wealth',          true,  51, true),
  (null, 'wealth_management',    'Wealth Management',        'wealth',          true,  52, true),
  (null, 'investment_advisory',  'Investment Advisory',      'advisory',        true,  53, true)
on conflict (code) where organization_id is null and is_system do nothing;

-- ----------------------------------------------------------------------------
-- 4. Standard system pipeline stages for every system opportunity type.
--    Orgs may add/override their own stages later.
-- ----------------------------------------------------------------------------
insert into public.opportunity_type_stages
  (organization_id, opportunity_type_id, stage_code, name, sequence, category, is_initial, is_terminal, is_won, is_lost, is_system)
select null, t.id, s.stage_code, s.name, s.sequence, s.category, s.is_initial, s.is_terminal, s.is_won, s.is_lost, true
from public.opportunity_types t
cross join (values
  ('lead',              'Lead',                10, 'open',        true,  false, false, false),
  ('qualification',     'Qualification',       20, 'in_progress', false, false, false, false),
  ('financial_analysis','Financial Analysis',  30, 'in_progress', false, false, false, false),
  ('presentation_ready','Presentation Ready',  40, 'in_progress', false, false, false, false),
  ('institution_match', 'Institution Matching',50, 'in_progress', false, false, false, false),
  ('proposal_sent',     'Proposal Sent',       60, 'in_progress', false, false, false, false),
  ('credit_review',     'Credit Review',       70, 'in_progress', false, false, false, false),
  ('sanction',          'Sanction',            80, 'sanctioned',  false, false, false, false),
  ('documentation',     'Documentation',       90, 'in_progress', false, false, false, false),
  ('disbursement',      'Disbursement',       100, 'disbursed',   false, false, false, false),
  ('revenue',           'Revenue',            110, 'in_progress', false, false, false, false),
  ('settlement',        'Settlement',         120, 'in_progress', false, false, false, false),
  ('closed',            'Closed',             130, 'won',         false, true,  true,  false),
  ('rejected',          'Rejected',           140, 'rejected',    false, true,  false, true),
  ('cancelled',         'Cancelled',          150, 'cancelled',   false, true,  false, true)
) as s(stage_code, name, sequence, category, is_initial, is_terminal, is_won, is_lost)
where t.is_system and t.organization_id is null
on conflict (opportunity_type_id, stage_code) where deleted_at is null do nothing;

-- ----------------------------------------------------------------------------
-- 5. Global system opportunity_objectives
-- ----------------------------------------------------------------------------
insert into public.opportunity_objectives (organization_id, code, name, sort_order, is_system) values
  (null, 'purchase',         'Purchase',              10, true),
  (null, 'refinance',        'Refinance',             11, true),
  (null, 'balance_transfer', 'Balance Transfer',      12, true),
  (null, 'expansion',        'Business Expansion',    20, true),
  (null, 'working_capital',  'Working Capital',       21, true),
  (null, 'project_funding',  'Project Funding',       30, true),
  (null, 'liquidity',        'Liquidity',             31, true),
  (null, 'investment',       'Investment',            40, true),
  (null, 'protection',       'Protection',            41, true),
  (null, 'wealth_creation',  'Wealth Creation',       42, true),
  (null, 'advisory',         'Advisory',              50, true),
  (null, 'other',            'Other',                 99, true)
on conflict (code) where organization_id is null and is_system do nothing;

-- ----------------------------------------------------------------------------
-- 6. Global system opportunity_priorities
-- ----------------------------------------------------------------------------
insert into public.opportunity_priorities (organization_id, code, name, rank, color, sort_order, is_system) values
  (null, 'critical', 'Critical', 40, '#dc2626', 10, true),
  (null, 'high',     'High',     30, '#f59e0b', 20, true),
  (null, 'medium',   'Medium',   20, '#3b82f6', 30, true),
  (null, 'low',      'Low',      10, '#10b981', 40, true)
on conflict (code) where organization_id is null and is_system do nothing;

-- ----------------------------------------------------------------------------
-- 6b. Global system opportunity_engagement_types
--     "Mandate" is simply ONE configurable value — not a separate engine.
-- ----------------------------------------------------------------------------
insert into public.opportunity_engagement_types (organization_id, code, name, sort_order, is_system) values
  (null, 'direct',                'Direct',                10, true),
  (null, 'referral',              'Referral',              20, true),
  (null, 'wealth_partner',        'Wealth Partner',        30, true),
  (null, 'institution_referral',  'Institution Referral',  40, true),
  (null, 'builder_referral',      'Builder Referral',      50, true),
  (null, 'professional_referral', 'Professional Referral', 60, true),
  (null, 'mandate',               'Mandate',               70, true),
  (null, 'exclusive_mandate',     'Exclusive Mandate',     80, true),
  (null, 'co_advisory',           'Co-Advisory',           90, true)
on conflict (code) where organization_id is null and is_system do nothing;

-- ----------------------------------------------------------------------------
-- 7. Global system opportunity_readiness_dimensions
--    is_gating dimensions must pass before the Information Sheet is available.
-- ----------------------------------------------------------------------------
insert into public.opportunity_readiness_dimensions
  (organization_id, code, name, weight, pass_threshold, is_gating, sort_order, is_system) values
  (null, 'client_information',    'Client Information',    2.0, 100, true,  10, true),
  (null, 'financial_information', 'Financial Information', 2.0, 100, true,  20, true),
  (null, 'documents',             'Documents',             2.0,  80, true,  30, true),
  (null, 'collateral',            'Collateral',            1.0,  60, false, 40, true),
  (null, 'compliance',            'Compliance',            1.5, 100, true,  50, true),
  (null, 'credit',                'Credit',                1.5,  60, false, 60, true),
  (null, 'legal',                 'Legal',                 1.0,  60, false, 70, true),
  (null, 'technical',             'Technical',             1.0,  60, false, 80, true),
  (null, 'communication',         'Communication',         1.0,  50, false, 90, true)
on conflict (code) where organization_id is null and is_system do nothing;
