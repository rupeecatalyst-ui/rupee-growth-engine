-- ============================================================================
-- RCLIP — Phase 2B · Product Intelligence Engine — SCHEMA
-- ----------------------------------------------------------------------------
-- Configuration-driven product master. The workflow is NOT a fixed enum: every
-- product defines its own stages (phase = opportunity | transaction) which the
-- Opportunity & Deal Execution Engine executes. All business rules are stored as
-- structured jsonb (shared Condition Grammar) — no hardcoded logic.
--
-- Tables:
--   product_categories, products, product_workflow_stages,
--   product_eligibility_rules, product_financial_rules,
--   product_document_requirements, product_sla_rules, product_dynamic_fields,
--   product_automation_rules, product_smart_match_config
--
-- Conventions inherited from Phase 1/2A: UUID PKs, audit set, soft delete,
-- version trigger (public.rc_set_updated_at_versioned), fk_/idx_/uq_/chk_/trg_
-- naming, effective dating, business codes (RC-PRD-######).
-- Fully idempotent & re-runnable.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Business code sequence + generator (RC-PRD-000001 ...)
-- ----------------------------------------------------------------------------
create sequence if not exists public.rc_product_code_seq;

create or replace function public.rc_generate_product_code()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  if new.product_code is null or new.product_code = '' then
    new.product_code := 'RC-PRD-' || lpad(nextval('public.rc_product_code_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

-- ============================================================================
-- 1. product_categories — product family catalog
--    Global system categories have organization_id NULL + is_system = true.
-- ============================================================================
create table if not exists public.product_categories (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid constraint fk_product_categories_organization references public.organizations(id) on delete cascade,
  code            text not null,
  name            text not null,
  description     text,
  icon            text,
  sort_order      integer not null default 0,
  is_system       boolean not null default false,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid constraint fk_product_categories_created_by references public.users(id) on delete set null,
  updated_by      uuid constraint fk_product_categories_updated_by references public.users(id) on delete set null,
  deleted_at      timestamptz,
  deleted_by      uuid constraint fk_product_categories_deleted_by references public.users(id) on delete set null,
  version         integer not null default 1,
  constraint chk_product_categories_system_scope
    check ((is_system and organization_id is null) or (not is_system and organization_id is not null))
);

-- ============================================================================
-- 2. products — the product master (per-tenant catalog)
-- ============================================================================
create table if not exists public.products (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null constraint fk_products_organization references public.organizations(id) on delete cascade,
  category_id        uuid constraint fk_products_category references public.product_categories(id) on delete set null,
  product_code       text,
  name               text not null,
  product_type       text not null
                       constraint chk_products_type
                       check (product_type in (
                         'home_loan','home_loan_bt','loan_against_property','business_loan',
                         'working_capital','project_finance','construction_finance','equipment_finance',
                         'lease_rental_discounting','loan_against_securities','structured_debt','debt_syndication',
                         'equity_raise','private_equity','venture_capital','ipo_advisory','ma_advisory','other')),
  description        text,
  is_advisory        boolean not null default false,
  status             text not null default 'draft'
                       constraint chk_products_status
                       check (status in ('draft','active','paused','withdrawn')),
  min_amount         numeric(15,2),
  max_amount         numeric(15,2),
  min_tenure_months  integer,
  max_tenure_months  integer,
  currency           text not null default 'INR',
  config             jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  created_by         uuid constraint fk_products_created_by references public.users(id) on delete set null,
  updated_by         uuid constraint fk_products_updated_by references public.users(id) on delete set null,
  deleted_at         timestamptz,
  deleted_by         uuid constraint fk_products_deleted_by references public.users(id) on delete set null,
  version            integer not null default 1,
  constraint chk_products_amounts check (max_amount is null or min_amount is null or max_amount >= min_amount),
  constraint chk_products_tenure  check (max_tenure_months is null or min_tenure_months is null or max_tenure_months >= min_tenure_months)
);

-- ============================================================================
-- 3. product_workflow_stages — config-driven pipeline (replaces fixed statuses)
--    phase discriminates the Opportunity pipeline vs the Transaction pipeline.
-- ============================================================================
create table if not exists public.product_workflow_stages (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null constraint fk_pws_organization references public.organizations(id) on delete cascade,
  product_id           uuid not null constraint fk_pws_product references public.products(id) on delete cascade,
  phase                text not null
                         constraint chk_pws_phase check (phase in ('opportunity','transaction')),
  stage_code           text not null,
  name                 text not null,
  sequence             integer not null default 0,
  category             text
                         constraint chk_pws_category
                         check (category is null or category in
                           ('open','in_progress','won','lost','on_hold','sanctioned','disbursed','closed','rejected','custom')),
  is_initial           boolean not null default false,
  is_terminal          boolean not null default false,
  is_won               boolean not null default false,
  is_lost              boolean not null default false,
  sla_hours            integer,
  allowed_next_stages  jsonb not null default '[]'::jsonb,
  config               jsonb not null default '{}'::jsonb,
  is_active            boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  created_by           uuid constraint fk_pws_created_by references public.users(id) on delete set null,
  updated_by           uuid constraint fk_pws_updated_by references public.users(id) on delete set null,
  deleted_at           timestamptz,
  deleted_by           uuid constraint fk_pws_deleted_by references public.users(id) on delete set null,
  version              integer not null default 1,
  constraint chk_pws_sla check (sla_hours is null or sla_hours >= 0)
);

-- ============================================================================
-- 4. product_eligibility_rules — structured eligibility (Condition Grammar)
-- ============================================================================
create table if not exists public.product_eligibility_rules (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null constraint fk_per_organization references public.organizations(id) on delete cascade,
  product_id      uuid not null constraint fk_per_product references public.products(id) on delete cascade,
  rule_code       text not null,
  name            text not null,
  applicant_type  text
                    constraint chk_per_applicant_type
                    check (applicant_type is null or applicant_type in ('individual','company','huf','trust','any')),
  criteria        jsonb not null default '{}'::jsonb,
  severity        text not null default 'hard'
                    constraint chk_per_severity check (severity in ('hard','soft')),
  weight          numeric(6,2),
  error_message   text,
  rule_version    integer not null default 1,
  is_active       boolean not null default true,
  effective_from  date not null default current_date,
  effective_to    date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid constraint fk_per_created_by references public.users(id) on delete set null,
  updated_by      uuid constraint fk_per_updated_by references public.users(id) on delete set null,
  deleted_at      timestamptz,
  deleted_by      uuid constraint fk_per_deleted_by references public.users(id) on delete set null,
  version         integer not null default 1,
  constraint chk_per_dates check (effective_to is null or effective_to >= effective_from)
);

-- ============================================================================
-- 5. product_financial_rules — LTV / FOIR / multipliers / margins (structured)
-- ============================================================================
create table if not exists public.product_financial_rules (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null constraint fk_pfr_organization references public.organizations(id) on delete cascade,
  product_id      uuid not null constraint fk_pfr_product references public.products(id) on delete cascade,
  rule_type       text not null
                    constraint chk_pfr_type
                    check (rule_type in ('ltv','foir','income_multiplier','margin','max_amount_band','tenure_cap','moratorium','other')),
  name            text not null,
  parameters      jsonb not null default '{}'::jsonb,
  slabs           jsonb not null default '[]'::jsonb,
  unit            text,
  rule_version    integer not null default 1,
  is_active       boolean not null default true,
  effective_from  date not null default current_date,
  effective_to    date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid constraint fk_pfr_created_by references public.users(id) on delete set null,
  updated_by      uuid constraint fk_pfr_updated_by references public.users(id) on delete set null,
  deleted_at      timestamptz,
  deleted_by      uuid constraint fk_pfr_deleted_by references public.users(id) on delete set null,
  version         integer not null default 1,
  constraint chk_pfr_dates check (effective_to is null or effective_to >= effective_from)
);

-- ============================================================================
-- 6. product_document_requirements — document checklists (optionally per stage)
-- ============================================================================
create table if not exists public.product_document_requirements (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null constraint fk_pdr_organization references public.organizations(id) on delete cascade,
  product_id      uuid not null constraint fk_pdr_product references public.products(id) on delete cascade,
  stage_id        uuid constraint fk_pdr_stage references public.product_workflow_stages(id) on delete set null,
  document_code   text not null,
  name            text not null,
  applicant_type  text
                    constraint chk_pdr_applicant_type
                    check (applicant_type is null or applicant_type in ('individual','company','huf','trust','any')),
  category        text
                    constraint chk_pdr_category
                    check (category is null or category in ('kyc','income','property','banking','business','legal','technical','other')),
  is_mandatory    boolean not null default true,
  sort_order      integer not null default 0,
  config          jsonb not null default '{}'::jsonb,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid constraint fk_pdr_created_by references public.users(id) on delete set null,
  updated_by      uuid constraint fk_pdr_updated_by references public.users(id) on delete set null,
  deleted_at      timestamptz,
  deleted_by      uuid constraint fk_pdr_deleted_by references public.users(id) on delete set null,
  version         integer not null default 1
);

-- ============================================================================
-- 7. product_sla_rules — SLA targets by stage / phase
-- ============================================================================
create table if not exists public.product_sla_rules (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null constraint fk_psr_organization references public.organizations(id) on delete cascade,
  product_id          uuid not null constraint fk_psr_product references public.products(id) on delete cascade,
  stage_id            uuid constraint fk_psr_stage references public.product_workflow_stages(id) on delete set null,
  phase               text
                        constraint chk_psr_phase check (phase is null or phase in ('opportunity','transaction')),
  name                text not null,
  sla_hours           integer not null,
  business_hours_only boolean not null default true,
  escalation          jsonb not null default '{}'::jsonb,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  created_by          uuid constraint fk_psr_created_by references public.users(id) on delete set null,
  updated_by          uuid constraint fk_psr_updated_by references public.users(id) on delete set null,
  deleted_at          timestamptz,
  deleted_by          uuid constraint fk_psr_deleted_by references public.users(id) on delete set null,
  version             integer not null default 1,
  constraint chk_psr_sla check (sla_hours >= 0)
);

-- ============================================================================
-- 8. product_dynamic_fields — configurable custom fields per product
-- ============================================================================
create table if not exists public.product_dynamic_fields (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null constraint fk_pdf_organization references public.organizations(id) on delete cascade,
  product_id      uuid not null constraint fk_pdf_product references public.products(id) on delete cascade,
  field_code      text not null,
  label           text not null,
  field_type      text not null
                    constraint chk_pdf_type
                    check (field_type in ('text','textarea','number','currency','date','boolean','select','multiselect','file')),
  options         jsonb not null default '[]'::jsonb,
  is_required     boolean not null default false,
  validation      jsonb not null default '{}'::jsonb,
  applies_to      text not null default 'both'
                    constraint chk_pdf_applies_to check (applies_to in ('opportunity','transaction','both')),
  sort_order      integer not null default 0,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid constraint fk_pdf_created_by references public.users(id) on delete set null,
  updated_by      uuid constraint fk_pdf_updated_by references public.users(id) on delete set null,
  deleted_at      timestamptz,
  deleted_by      uuid constraint fk_pdf_deleted_by references public.users(id) on delete set null,
  version         integer not null default 1
);

-- ============================================================================
-- 9. product_automation_rules — event-driven automation (config, not code)
-- ============================================================================
create table if not exists public.product_automation_rules (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null constraint fk_par_organization references public.organizations(id) on delete cascade,
  product_id      uuid not null constraint fk_par_product references public.products(id) on delete cascade,
  stage_id        uuid constraint fk_par_stage references public.product_workflow_stages(id) on delete set null,
  rule_code       text not null,
  name            text not null,
  trigger_event   text not null
                    constraint chk_par_trigger
                    check (trigger_event in ('created','stage_enter','stage_exit','field_change','sla_breach','document_uploaded','scheduled')),
  conditions      jsonb not null default '{}'::jsonb,
  actions         jsonb not null default '[]'::jsonb,
  priority        integer not null default 0,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid constraint fk_par_created_by references public.users(id) on delete set null,
  updated_by      uuid constraint fk_par_updated_by references public.users(id) on delete set null,
  deleted_at      timestamptz,
  deleted_by      uuid constraint fk_par_deleted_by references public.users(id) on delete set null,
  version         integer not null default 1
);

-- ============================================================================
-- 10. product_smart_match_config — per-product match tuning (AI-ready)
-- ============================================================================
create table if not exists public.product_smart_match_config (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null constraint fk_psmc_organization references public.organizations(id) on delete cascade,
  product_id         uuid not null constraint fk_psmc_product references public.products(id) on delete cascade,
  engine_type        text not null default 'rules'
                       constraint chk_psmc_engine check (engine_type in ('rules','ml','hybrid')),
  acceptance_weights jsonb not null default '{}'::jsonb,
  hard_filters       jsonb not null default '{}'::jsonb,
  min_confidence     numeric(5,2),
  config_version     integer not null default 1,
  is_active          boolean not null default true,
  effective_from     date not null default current_date,
  effective_to       date,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  created_by         uuid constraint fk_psmc_created_by references public.users(id) on delete set null,
  updated_by         uuid constraint fk_psmc_updated_by references public.users(id) on delete set null,
  deleted_at         timestamptz,
  deleted_by         uuid constraint fk_psmc_deleted_by references public.users(id) on delete set null,
  version            integer not null default 1,
  constraint chk_psmc_dates check (effective_to is null or effective_to >= effective_from),
  constraint chk_psmc_confidence check (min_confidence is null or (min_confidence >= 0 and min_confidence <= 100))
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- product_categories
create unique index if not exists uq_product_categories_org_code
  on public.product_categories (organization_id, code) where organization_id is not null and deleted_at is null;
create unique index if not exists uq_product_categories_system_code
  on public.product_categories (code) where organization_id is null and is_system;
create index if not exists idx_product_categories_org_active on public.product_categories (organization_id, is_active) where deleted_at is null;

-- products
create unique index if not exists uq_products_code on public.products (product_code);
create index if not exists idx_products_org_type_status on public.products (organization_id, product_type, status) where deleted_at is null;
create index if not exists idx_products_category on public.products (category_id);
create index if not exists idx_products_org_status on public.products (organization_id, status) where deleted_at is null;

-- product_workflow_stages
create unique index if not exists uq_pws_product_phase_code
  on public.product_workflow_stages (product_id, phase, stage_code) where deleted_at is null;
create index if not exists idx_pws_product_phase_seq on public.product_workflow_stages (product_id, phase, sequence) where deleted_at is null;
create unique index if not exists uq_pws_initial
  on public.product_workflow_stages (product_id, phase) where is_initial and deleted_at is null;

-- product_eligibility_rules
create unique index if not exists uq_per_product_code_current
  on public.product_eligibility_rules (product_id, rule_code) where effective_to is null and deleted_at is null;
create index if not exists idx_per_product_active on public.product_eligibility_rules (product_id, is_active) where deleted_at is null;

-- product_financial_rules
create index if not exists idx_pfr_product_type on public.product_financial_rules (product_id, rule_type) where deleted_at is null;
create index if not exists idx_pfr_product_active on public.product_financial_rules (product_id, is_active) where deleted_at is null;

-- product_document_requirements
create unique index if not exists uq_pdr_product_code
  on public.product_document_requirements (product_id, document_code) where deleted_at is null;
create index if not exists idx_pdr_product_stage on public.product_document_requirements (product_id, stage_id) where deleted_at is null;

-- product_sla_rules
create index if not exists idx_psr_product on public.product_sla_rules (product_id) where deleted_at is null;
create index if not exists idx_psr_stage on public.product_sla_rules (stage_id);

-- product_dynamic_fields
create unique index if not exists uq_pdf_product_code
  on public.product_dynamic_fields (product_id, field_code) where deleted_at is null;
create index if not exists idx_pdf_product_active on public.product_dynamic_fields (product_id, is_active) where deleted_at is null;

-- product_automation_rules
create unique index if not exists uq_par_product_code
  on public.product_automation_rules (product_id, rule_code) where deleted_at is null;
create index if not exists idx_par_product_trigger on public.product_automation_rules (product_id, trigger_event) where deleted_at is null;
create index if not exists idx_par_stage on public.product_automation_rules (stage_id);

-- product_smart_match_config
create unique index if not exists uq_psmc_product_active
  on public.product_smart_match_config (product_id) where is_active and deleted_at is null;
create index if not exists idx_psmc_product on public.product_smart_match_config (product_id) where deleted_at is null;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- products: business code (insert), updated_at/version
drop trigger if exists trg_products_code on public.products;
create trigger trg_products_code before insert on public.products
  for each row execute function public.rc_generate_product_code();

drop trigger if exists trg_products_set_updated_at on public.products;
create trigger trg_products_set_updated_at before update on public.products
  for each row execute function public.rc_set_updated_at_versioned();

-- updated_at/version triggers for the remaining tables
drop trigger if exists trg_product_categories_set_updated_at on public.product_categories;
create trigger trg_product_categories_set_updated_at before update on public.product_categories
  for each row execute function public.rc_set_updated_at_versioned();

drop trigger if exists trg_pws_set_updated_at on public.product_workflow_stages;
create trigger trg_pws_set_updated_at before update on public.product_workflow_stages
  for each row execute function public.rc_set_updated_at_versioned();

drop trigger if exists trg_per_set_updated_at on public.product_eligibility_rules;
create trigger trg_per_set_updated_at before update on public.product_eligibility_rules
  for each row execute function public.rc_set_updated_at_versioned();

drop trigger if exists trg_pfr_set_updated_at on public.product_financial_rules;
create trigger trg_pfr_set_updated_at before update on public.product_financial_rules
  for each row execute function public.rc_set_updated_at_versioned();

drop trigger if exists trg_pdr_set_updated_at on public.product_document_requirements;
create trigger trg_pdr_set_updated_at before update on public.product_document_requirements
  for each row execute function public.rc_set_updated_at_versioned();

drop trigger if exists trg_psr_set_updated_at on public.product_sla_rules;
create trigger trg_psr_set_updated_at before update on public.product_sla_rules
  for each row execute function public.rc_set_updated_at_versioned();

drop trigger if exists trg_pdf_set_updated_at on public.product_dynamic_fields;
create trigger trg_pdf_set_updated_at before update on public.product_dynamic_fields
  for each row execute function public.rc_set_updated_at_versioned();

drop trigger if exists trg_par_set_updated_at on public.product_automation_rules;
create trigger trg_par_set_updated_at before update on public.product_automation_rules
  for each row execute function public.rc_set_updated_at_versioned();

drop trigger if exists trg_psmc_set_updated_at on public.product_smart_match_config;
create trigger trg_psmc_set_updated_at before update on public.product_smart_match_config
  for each row execute function public.rc_set_updated_at_versioned();

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================
comment on table public.product_categories is 'Product family catalog; global system categories have organization_id NULL.';
comment on table public.products is 'Product master (per-tenant). product_type spans financing and future advisory/equity offerings.';
comment on table public.product_workflow_stages is 'Config-driven pipeline stages per product; phase = opportunity | transaction. Replaces fixed status enums.';
comment on table public.product_eligibility_rules is 'Structured eligibility rules evaluated via the shared Condition Grammar (jsonb criteria).';
comment on table public.product_financial_rules is 'LTV/FOIR/multiplier/margin rules with slab support (jsonb).';
comment on table public.product_document_requirements is 'Document checklist per product, optionally scoped to a workflow stage.';
comment on table public.product_sla_rules is 'SLA targets by stage/phase with escalation config.';
comment on table public.product_dynamic_fields is 'Configurable custom fields captured on opportunities/transactions for a product.';
comment on table public.product_automation_rules is 'Event-driven automation (trigger + conditions + actions) stored as config.';
comment on table public.product_smart_match_config is 'Per-product Smart Match tuning (weights/filters), AI-ready and effective-dated.';
