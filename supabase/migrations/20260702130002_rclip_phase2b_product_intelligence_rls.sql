-- ============================================================================
-- RCLIP — Phase 2B · Product Intelligence Engine — ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
-- Reuses Phase 1 helpers rc_current_org_id() and rc_has_permission() (SECURITY
-- DEFINER), wrapped as (SELECT fn()) for planner init-plan caching.
-- SELECT policies exclude soft-deleted rows. Reads gated by product.read,
-- writes by product.manage. product_categories additionally exposes read-only
-- GLOBAL system categories (organization_id IS NULL). Hard DELETE is denied to
-- app users (soft delete only); service_role bypasses RLS.
-- Idempotent: DROP POLICY IF EXISTS before each CREATE.
-- ============================================================================

alter table public.product_categories          enable row level security;
alter table public.products                     enable row level security;
alter table public.product_workflow_stages      enable row level security;
alter table public.product_eligibility_rules    enable row level security;
alter table public.product_financial_rules      enable row level security;
alter table public.product_document_requirements enable row level security;
alter table public.product_sla_rules            enable row level security;
alter table public.product_dynamic_fields       enable row level security;
alter table public.product_automation_rules     enable row level security;
alter table public.product_smart_match_config   enable row level security;

-- ============================================================================
-- product_categories (own-org rows + read-only global system categories)
-- ============================================================================
drop policy if exists product_categories_select on public.product_categories;
create policy product_categories_select on public.product_categories
  for select to authenticated
  using ((organization_id = (select public.rc_current_org_id()) or organization_id is null)
         and deleted_at is null
         and (select public.rc_has_permission('product.read')));
drop policy if exists product_categories_insert on public.product_categories;
create policy product_categories_insert on public.product_categories
  for insert to authenticated
  with check (organization_id = (select public.rc_current_org_id())
              and is_system = false
              and (select public.rc_has_permission('product.manage')));
drop policy if exists product_categories_update on public.product_categories;
create policy product_categories_update on public.product_categories
  for update to authenticated
  using (organization_id = (select public.rc_current_org_id())
         and is_system = false
         and (select public.rc_has_permission('product.manage')))
  with check (organization_id = (select public.rc_current_org_id()) and is_system = false);

-- ============================================================================
-- products
-- ============================================================================
drop policy if exists products_select on public.products;
create policy products_select on public.products
  for select to authenticated
  using (organization_id = (select public.rc_current_org_id()) and deleted_at is null
         and (select public.rc_has_permission('product.read')));
drop policy if exists products_insert on public.products;
create policy products_insert on public.products
  for insert to authenticated
  with check (organization_id = (select public.rc_current_org_id())
              and (select public.rc_has_permission('product.manage')));
drop policy if exists products_update on public.products;
create policy products_update on public.products
  for update to authenticated
  using (organization_id = (select public.rc_current_org_id())
         and (select public.rc_has_permission('product.manage')))
  with check (organization_id = (select public.rc_current_org_id()));

-- ============================================================================
-- product_workflow_stages
-- ============================================================================
drop policy if exists pws_select on public.product_workflow_stages;
create policy pws_select on public.product_workflow_stages
  for select to authenticated
  using (organization_id = (select public.rc_current_org_id()) and deleted_at is null
         and (select public.rc_has_permission('product.read')));
drop policy if exists pws_insert on public.product_workflow_stages;
create policy pws_insert on public.product_workflow_stages
  for insert to authenticated
  with check (organization_id = (select public.rc_current_org_id())
              and (select public.rc_has_permission('product.manage')));
drop policy if exists pws_update on public.product_workflow_stages;
create policy pws_update on public.product_workflow_stages
  for update to authenticated
  using (organization_id = (select public.rc_current_org_id())
         and (select public.rc_has_permission('product.manage')))
  with check (organization_id = (select public.rc_current_org_id()));

-- ============================================================================
-- product_eligibility_rules
-- ============================================================================
drop policy if exists per_select on public.product_eligibility_rules;
create policy per_select on public.product_eligibility_rules
  for select to authenticated
  using (organization_id = (select public.rc_current_org_id()) and deleted_at is null
         and (select public.rc_has_permission('product.read')));
drop policy if exists per_insert on public.product_eligibility_rules;
create policy per_insert on public.product_eligibility_rules
  for insert to authenticated
  with check (organization_id = (select public.rc_current_org_id())
              and (select public.rc_has_permission('product.manage')));
drop policy if exists per_update on public.product_eligibility_rules;
create policy per_update on public.product_eligibility_rules
  for update to authenticated
  using (organization_id = (select public.rc_current_org_id())
         and (select public.rc_has_permission('product.manage')))
  with check (organization_id = (select public.rc_current_org_id()));

-- ============================================================================
-- product_financial_rules
-- ============================================================================
drop policy if exists pfr_select on public.product_financial_rules;
create policy pfr_select on public.product_financial_rules
  for select to authenticated
  using (organization_id = (select public.rc_current_org_id()) and deleted_at is null
         and (select public.rc_has_permission('product.read')));
drop policy if exists pfr_insert on public.product_financial_rules;
create policy pfr_insert on public.product_financial_rules
  for insert to authenticated
  with check (organization_id = (select public.rc_current_org_id())
              and (select public.rc_has_permission('product.manage')));
drop policy if exists pfr_update on public.product_financial_rules;
create policy pfr_update on public.product_financial_rules
  for update to authenticated
  using (organization_id = (select public.rc_current_org_id())
         and (select public.rc_has_permission('product.manage')))
  with check (organization_id = (select public.rc_current_org_id()));

-- ============================================================================
-- product_document_requirements
-- ============================================================================
drop policy if exists pdr_select on public.product_document_requirements;
create policy pdr_select on public.product_document_requirements
  for select to authenticated
  using (organization_id = (select public.rc_current_org_id()) and deleted_at is null
         and (select public.rc_has_permission('product.read')));
drop policy if exists pdr_insert on public.product_document_requirements;
create policy pdr_insert on public.product_document_requirements
  for insert to authenticated
  with check (organization_id = (select public.rc_current_org_id())
              and (select public.rc_has_permission('product.manage')));
drop policy if exists pdr_update on public.product_document_requirements;
create policy pdr_update on public.product_document_requirements
  for update to authenticated
  using (organization_id = (select public.rc_current_org_id())
         and (select public.rc_has_permission('product.manage')))
  with check (organization_id = (select public.rc_current_org_id()));

-- ============================================================================
-- product_sla_rules
-- ============================================================================
drop policy if exists psr_select on public.product_sla_rules;
create policy psr_select on public.product_sla_rules
  for select to authenticated
  using (organization_id = (select public.rc_current_org_id()) and deleted_at is null
         and (select public.rc_has_permission('product.read')));
drop policy if exists psr_insert on public.product_sla_rules;
create policy psr_insert on public.product_sla_rules
  for insert to authenticated
  with check (organization_id = (select public.rc_current_org_id())
              and (select public.rc_has_permission('product.manage')));
drop policy if exists psr_update on public.product_sla_rules;
create policy psr_update on public.product_sla_rules
  for update to authenticated
  using (organization_id = (select public.rc_current_org_id())
         and (select public.rc_has_permission('product.manage')))
  with check (organization_id = (select public.rc_current_org_id()));

-- ============================================================================
-- product_dynamic_fields
-- ============================================================================
drop policy if exists pdf_select on public.product_dynamic_fields;
create policy pdf_select on public.product_dynamic_fields
  for select to authenticated
  using (organization_id = (select public.rc_current_org_id()) and deleted_at is null
         and (select public.rc_has_permission('product.read')));
drop policy if exists pdf_insert on public.product_dynamic_fields;
create policy pdf_insert on public.product_dynamic_fields
  for insert to authenticated
  with check (organization_id = (select public.rc_current_org_id())
              and (select public.rc_has_permission('product.manage')));
drop policy if exists pdf_update on public.product_dynamic_fields;
create policy pdf_update on public.product_dynamic_fields
  for update to authenticated
  using (organization_id = (select public.rc_current_org_id())
         and (select public.rc_has_permission('product.manage')))
  with check (organization_id = (select public.rc_current_org_id()));

-- ============================================================================
-- product_automation_rules
-- ============================================================================
drop policy if exists par_select on public.product_automation_rules;
create policy par_select on public.product_automation_rules
  for select to authenticated
  using (organization_id = (select public.rc_current_org_id()) and deleted_at is null
         and (select public.rc_has_permission('product.read')));
drop policy if exists par_insert on public.product_automation_rules;
create policy par_insert on public.product_automation_rules
  for insert to authenticated
  with check (organization_id = (select public.rc_current_org_id())
              and (select public.rc_has_permission('product.manage')));
drop policy if exists par_update on public.product_automation_rules;
create policy par_update on public.product_automation_rules
  for update to authenticated
  using (organization_id = (select public.rc_current_org_id())
         and (select public.rc_has_permission('product.manage')))
  with check (organization_id = (select public.rc_current_org_id()));

-- ============================================================================
-- product_smart_match_config
-- ============================================================================
drop policy if exists psmc_select on public.product_smart_match_config;
create policy psmc_select on public.product_smart_match_config
  for select to authenticated
  using (organization_id = (select public.rc_current_org_id()) and deleted_at is null
         and (select public.rc_has_permission('product.read')));
drop policy if exists psmc_insert on public.product_smart_match_config;
create policy psmc_insert on public.product_smart_match_config
  for insert to authenticated
  with check (organization_id = (select public.rc_current_org_id())
              and (select public.rc_has_permission('product.manage')));
drop policy if exists psmc_update on public.product_smart_match_config;
create policy psmc_update on public.product_smart_match_config
  for update to authenticated
  using (organization_id = (select public.rc_current_org_id())
         and (select public.rc_has_permission('product.manage')))
  with check (organization_id = (select public.rc_current_org_id()));
