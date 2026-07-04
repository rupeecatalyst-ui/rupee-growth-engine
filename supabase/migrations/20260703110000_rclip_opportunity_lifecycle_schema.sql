-- ============================================================================
-- RCLIP — Opportunity Lifecycle Engine (ADR-008) — SCHEMA
-- ----------------------------------------------------------------------------
-- The core transaction engine of the Investment Banking Operating System.
-- Opportunity is the 4th business master. It REUSES the frozen masters/catalogs
-- and introduces NO new master:
--   • Parties      → contacts / entities (Contact XOR Entity pattern)
--   • Roles        → business_roles (participants) · team_roles (opportunity team)
--   • Documents    → product_document_requirements (definitions, not duplicated)
--   • Channels     → acquisition_channels
--
-- ADR-008 refinements baked in:
--   • Multi-product is the STANDARD model (opportunity_products, many).
--   • WORKFLOW is driven by a configurable opportunity_types catalog + per-type
--     stages (NOT a single primary product). Products link independently.
--   • Opportunity Objective + Priority are configurable catalogs.
--   • Calculated Opportunity Health indicator (health_status/health_score).
--   • Institution Tracks have a full institution-specific lifecycle + history.
--   • RC-OPP-###### business codes.
--   • NO ownership anywhere (Org owns every Opportunity). Timeline / stage
--     history / track events / information sheets are APPEND-ONLY.
--
-- Conventions inherited from Phase 1/2A/2B/Sprint 4: UUID PKs, audit set, soft
-- delete, version trigger, fk_/idx_/uq_/chk_/trg_ naming, effective dating,
-- (contact_id XOR entity_id) party pattern. Fully idempotent & re-runnable.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Business code sequence + generator (RC-OPP-000001 ...)
-- ----------------------------------------------------------------------------
create sequence if not exists public.rc_opportunity_code_seq;

create or replace function public.rc_generate_opportunity_code()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  if new.opportunity_code is null or new.opportunity_code = '' then
    new.opportunity_code := 'RC-OPP-' || lpad(nextval('public.rc_opportunity_code_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

-- Validation: current_stage must belong to the opportunity's type.
create or replace function public.rc_validate_opportunity_stage()
returns trigger language plpgsql
set search_path = public
as $$
declare
  v_stage_type uuid;
begin
  if new.current_stage_id is null then
    return new;
  end if;
  select opportunity_type_id into v_stage_type
  from public.opportunity_type_stages where id = new.current_stage_id;
  if v_stage_type is null then
    raise exception 'opportunity_type_stage % not found', new.current_stage_id;
  end if;
  if v_stage_type <> new.opportunity_type_id then
    raise exception 'stage % does not belong to opportunity_type %', new.current_stage_id, new.opportunity_type_id;
  end if;
  return new;
end;
$$;

-- ============================================================================
-- SECTION A · CONFIGURATION CATALOGS (org + global system rows)
-- ============================================================================

-- A.1 opportunity_types — drives the workflow. (Home Loan, LAP, Business Loan,
--     Working Capital, Construction Finance, Private Credit, Insurance, ...)
create table if not exists public.opportunity_types (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid constraint fk_opp_types_organization references public.organizations(id) on delete cascade,
  code            text not null,
  name            text not null,
  category        text,
  description     text,
  is_advisory     boolean not null default false,
  sort_order      integer not null default 0,
  is_system       boolean not null default false,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid constraint fk_opp_types_created_by references public.users(id) on delete set null,
  updated_by      uuid constraint fk_opp_types_updated_by references public.users(id) on delete set null,
  deleted_at      timestamptz,
  deleted_by      uuid constraint fk_opp_types_deleted_by references public.users(id) on delete set null,
  version         integer not null default 1,
  constraint chk_opp_types_system_scope
    check ((is_system and organization_id is null) or (not is_system and organization_id is not null))
);

-- A.2 opportunity_type_stages — configurable pipeline per type (no hardcoded
--     enums). config jsonb holds mandatory docs/participants/readiness/approvals/tasks.
create table if not exists public.opportunity_type_stages (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid constraint fk_ots_organization references public.organizations(id) on delete cascade,
  opportunity_type_id uuid not null constraint fk_ots_type references public.opportunity_types(id) on delete cascade,
  stage_code          text not null,
  name                text not null,
  sequence            integer not null default 0,
  category            text
                        constraint chk_ots_category
                        check (category is null or category in
                          ('open','in_progress','won','lost','on_hold','sanctioned','disbursed','closed','rejected','cancelled','custom')),
  is_initial          boolean not null default false,
  is_terminal         boolean not null default false,
  is_won              boolean not null default false,
  is_lost             boolean not null default false,
  sla_hours           integer,
  allowed_next_stages jsonb not null default '[]'::jsonb,
  config              jsonb not null default '{}'::jsonb,
  is_system           boolean not null default false,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  created_by          uuid constraint fk_ots_created_by references public.users(id) on delete set null,
  updated_by          uuid constraint fk_ots_updated_by references public.users(id) on delete set null,
  deleted_at          timestamptz,
  deleted_by          uuid constraint fk_ots_deleted_by references public.users(id) on delete set null,
  version             integer not null default 1,
  constraint chk_ots_sla check (sla_hours is null or sla_hours >= 0),
  constraint chk_ots_system_scope
    check ((is_system and organization_id is null) or (not is_system and organization_id is not null))
);

-- A.3 opportunity_objectives — configurable business objective of the deal.
create table if not exists public.opportunity_objectives (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid constraint fk_opp_obj_organization references public.organizations(id) on delete cascade,
  code            text not null,
  name            text not null,
  description     text,
  sort_order      integer not null default 0,
  is_system       boolean not null default false,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid constraint fk_opp_obj_created_by references public.users(id) on delete set null,
  updated_by      uuid constraint fk_opp_obj_updated_by references public.users(id) on delete set null,
  deleted_at      timestamptz,
  deleted_by      uuid constraint fk_opp_obj_deleted_by references public.users(id) on delete set null,
  version         integer not null default 1,
  constraint chk_opp_obj_system_scope
    check ((is_system and organization_id is null) or (not is_system and organization_id is not null))
);

-- A.4 opportunity_priorities — configurable priority (rank drives ordering/SLA).
create table if not exists public.opportunity_priorities (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid constraint fk_opp_pri_organization references public.organizations(id) on delete cascade,
  code            text not null,
  name            text not null,
  rank            integer not null default 0,
  color           text,
  sla_hours       integer,
  sort_order      integer not null default 0,
  is_system       boolean not null default false,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid constraint fk_opp_pri_created_by references public.users(id) on delete set null,
  updated_by      uuid constraint fk_opp_pri_updated_by references public.users(id) on delete set null,
  deleted_at      timestamptz,
  deleted_by      uuid constraint fk_opp_pri_deleted_by references public.users(id) on delete set null,
  version         integer not null default 1,
  constraint chk_opp_pri_sla check (sla_hours is null or sla_hours >= 0),
  constraint chk_opp_pri_system_scope
    check ((is_system and organization_id is null) or (not is_system and organization_id is not null))
);

-- A.5 opportunity_readiness_dimensions — configurable readiness axes + weights.
create table if not exists public.opportunity_readiness_dimensions (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid constraint fk_ord_organization references public.organizations(id) on delete cascade,
  code            text not null,
  name            text not null,
  description     text,
  weight          numeric(6,2) not null default 1,
  pass_threshold  numeric(5,2) not null default 100,
  is_gating       boolean not null default false,
  sort_order      integer not null default 0,
  is_system       boolean not null default false,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid constraint fk_ord_created_by references public.users(id) on delete set null,
  updated_by      uuid constraint fk_ord_updated_by references public.users(id) on delete set null,
  deleted_at      timestamptz,
  deleted_by      uuid constraint fk_ord_deleted_by references public.users(id) on delete set null,
  version         integer not null default 1,
  constraint chk_ord_threshold check (pass_threshold >= 0 and pass_threshold <= 100),
  constraint chk_ord_weight check (weight >= 0),
  constraint chk_ord_system_scope
    check ((is_system and organization_id is null) or (not is_system and organization_id is not null))
);

-- A.6 opportunity_engagement_types — configurable Engagement Type/Model.
--     "Mandate" is simply ONE value here — NOT a master, lifecycle, or engine.
--     Seed defaults: Direct, Referral, Wealth Partner, Institution Referral,
--     Builder Referral, Professional Referral, Mandate, Exclusive Mandate,
--     Co-Advisory. Fully configurable — orgs may add/edit/deactivate.
create table if not exists public.opportunity_engagement_types (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid constraint fk_opp_eng_organization references public.organizations(id) on delete cascade,
  code            text not null,
  name            text not null,
  description     text,
  sort_order      integer not null default 0,
  is_system       boolean not null default false,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid constraint fk_opp_eng_created_by references public.users(id) on delete set null,
  updated_by      uuid constraint fk_opp_eng_updated_by references public.users(id) on delete set null,
  deleted_at      timestamptz,
  deleted_by      uuid constraint fk_opp_eng_deleted_by references public.users(id) on delete set null,
  version         integer not null default 1,
  constraint chk_opp_eng_system_scope
    check ((is_system and organization_id is null) or (not is_system and organization_id is not null))
);

-- ============================================================================
-- SECTION B · OPPORTUNITY MASTER
-- ============================================================================
create table if not exists public.opportunities (
  id                        uuid primary key default gen_random_uuid(),
  organization_id           uuid not null constraint fk_opportunities_organization references public.organizations(id) on delete cascade,
  opportunity_code          text,
  title                     text not null,
  opportunity_type_id       uuid not null constraint fk_opportunities_type references public.opportunity_types(id),
  objective_id              uuid constraint fk_opportunities_objective references public.opportunity_objectives(id) on delete set null,
  priority_id               uuid constraint fk_opportunities_priority references public.opportunity_priorities(id) on delete set null,
  engagement_type_id        uuid constraint fk_opportunities_engagement references public.opportunity_engagement_types(id) on delete set null,
  current_stage_id          uuid constraint fk_opportunities_stage references public.opportunity_type_stages(id) on delete set null,
  primary_client_contact_id uuid constraint fk_opportunities_client_contact references public.contacts(id) on delete set null,
  primary_client_entity_id  uuid constraint fk_opportunities_client_entity references public.entities(id) on delete set null,
  acquisition_channel_id    uuid constraint fk_opportunities_channel references public.acquisition_channels(id) on delete set null,
  introduced_by_contact_id  uuid constraint fk_opportunities_introduced_contact references public.contacts(id) on delete set null,
  introduced_by_entity_id   uuid constraint fk_opportunities_introduced_entity references public.entities(id) on delete set null,
  pipeline_value            numeric(18,2),
  expected_revenue          numeric(18,2),
  currency                  text not null default 'INR',
  overall_readiness         numeric(5,2) not null default 0,
  health_status             text not null default 'healthy'
                              constraint chk_opportunities_health
                              check (health_status in ('healthy','watch','at_risk','critical')),
  health_score              numeric(5,2),
  status                    text not null default 'open'
                              constraint chk_opportunities_status
                              check (status in ('open','on_hold','won','lost','cancelled')),
  expected_close_date       date,
  actual_close_date         date,
  lost_reason               text,
  metadata                  jsonb not null default '{}'::jsonb,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  created_by                uuid constraint fk_opportunities_created_by references public.users(id) on delete set null,
  updated_by                uuid constraint fk_opportunities_updated_by references public.users(id) on delete set null,
  deleted_at                timestamptz,
  deleted_by                uuid constraint fk_opportunities_deleted_by references public.users(id) on delete set null,
  version                   integer not null default 1,
  constraint chk_opportunities_client_xor     check (num_nonnulls(primary_client_contact_id, primary_client_entity_id) = 1),
  constraint chk_opportunities_introduced_xor check (num_nonnulls(introduced_by_contact_id, introduced_by_entity_id) <= 1),
  constraint chk_opportunities_health_score   check (health_score is null or (health_score >= 0 and health_score <= 100)),
  constraint chk_opportunities_readiness      check (overall_readiness >= 0 and overall_readiness <= 100)
);

-- ============================================================================
-- SECTION C · MULTI-PRODUCT (standard model — many products per opportunity)
-- ============================================================================
create table if not exists public.opportunity_products (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null constraint fk_opp_products_organization references public.organizations(id) on delete cascade,
  opportunity_id    uuid not null constraint fk_opp_products_opportunity references public.opportunities(id) on delete cascade,
  product_id        uuid not null constraint fk_opp_products_product references public.products(id),
  requested_amount  numeric(18,2),
  tenure_months     integer,
  is_primary        boolean not null default false,
  sub_status        text not null default 'active'
                      constraint chk_opp_products_sub_status check (sub_status in ('active','dropped','converted')),
  notes             text,
  config            jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid constraint fk_opp_products_created_by references public.users(id) on delete set null,
  updated_by        uuid constraint fk_opp_products_updated_by references public.users(id) on delete set null,
  deleted_at        timestamptz,
  deleted_by        uuid constraint fk_opp_products_deleted_by references public.users(id) on delete set null,
  version           integer not null default 1
);

-- ============================================================================
-- SECTION D · PARTICIPANTS (Contact XOR Entity + business_roles) · no duplication
-- ============================================================================
create table if not exists public.opportunity_participants (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null constraint fk_opp_participants_organization references public.organizations(id) on delete cascade,
  opportunity_id    uuid not null constraint fk_opp_participants_opportunity references public.opportunities(id) on delete cascade,
  contact_id        uuid constraint fk_opp_participants_contact references public.contacts(id) on delete cascade,
  entity_id         uuid constraint fk_opp_participants_entity  references public.entities(id) on delete cascade,
  business_role_id  uuid not null constraint fk_opp_participants_role references public.business_roles(id),
  is_primary_client boolean not null default false,
  attributes        jsonb not null default '{}'::jsonb,
  participation_from date not null default current_date,
  participation_to  date,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid constraint fk_opp_participants_created_by references public.users(id) on delete set null,
  updated_by        uuid constraint fk_opp_participants_updated_by references public.users(id) on delete set null,
  deleted_at        timestamptz,
  deleted_by        uuid constraint fk_opp_participants_deleted_by references public.users(id) on delete set null,
  version           integer not null default 1,
  constraint chk_opp_participants_party_xor check (num_nonnulls(contact_id, entity_id) = 1),
  constraint chk_opp_participants_dates     check (participation_to is null or participation_to >= participation_from)
);

-- ============================================================================
-- SECTION E · OPPORTUNITY TEAM (reuse team_roles; member = Contact; no owner)
-- ============================================================================
create table if not exists public.opportunity_team (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null constraint fk_opp_team_organization references public.organizations(id) on delete cascade,
  opportunity_id    uuid not null constraint fk_opp_team_opportunity references public.opportunities(id) on delete cascade,
  team_role_id      uuid not null constraint fk_opp_team_role references public.team_roles(id),
  member_contact_id uuid not null constraint fk_opp_team_member references public.contacts(id) on delete cascade,
  is_primary        boolean not null default false,
  status            text not null default 'active'
                      constraint chk_opp_team_status check (status in ('active','inactive')),
  remarks           text,
  effective_from    date not null default current_date,
  effective_to      date,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid constraint fk_opp_team_created_by references public.users(id) on delete set null,
  updated_by        uuid constraint fk_opp_team_updated_by references public.users(id) on delete set null,
  deleted_at        timestamptz,
  deleted_by        uuid constraint fk_opp_team_deleted_by references public.users(id) on delete set null,
  version           integer not null default 1,
  constraint chk_opp_team_dates check (effective_to is null or effective_to >= effective_from)
);

-- ============================================================================
-- SECTION F · STAGE HISTORY (APPEND-ONLY) + APPROVALS + READINESS
-- ============================================================================
create table if not exists public.opportunity_stage_history (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null constraint fk_osh_organization references public.organizations(id) on delete cascade,
  opportunity_id  uuid not null constraint fk_osh_opportunity references public.opportunities(id) on delete cascade,
  from_stage_id   uuid constraint fk_osh_from_stage references public.opportunity_type_stages(id) on delete set null,
  to_stage_id     uuid not null constraint fk_osh_to_stage references public.opportunity_type_stages(id) on delete set null,
  reason          text,
  changed_at      timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  created_by      uuid constraint fk_osh_created_by references public.users(id) on delete set null
);

create table if not exists public.opportunity_approvals (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null constraint fk_oa_organization references public.organizations(id) on delete cascade,
  opportunity_id     uuid not null constraint fk_oa_opportunity references public.opportunities(id) on delete cascade,
  stage_id           uuid constraint fk_oa_stage references public.opportunity_type_stages(id) on delete set null,
  approval_type      text not null,
  status             text not null default 'pending'
                       constraint chk_oa_status check (status in ('pending','approved','rejected')),
  approver_contact_id uuid constraint fk_oa_approver references public.contacts(id) on delete set null,
  decided_at         timestamptz,
  remarks            text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  created_by         uuid constraint fk_oa_created_by references public.users(id) on delete set null,
  updated_by         uuid constraint fk_oa_updated_by references public.users(id) on delete set null,
  deleted_at         timestamptz,
  deleted_by         uuid constraint fk_oa_deleted_by references public.users(id) on delete set null,
  version            integer not null default 1
);

create table if not exists public.opportunity_readiness (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null constraint fk_orr_organization references public.organizations(id) on delete cascade,
  opportunity_id  uuid not null constraint fk_orr_opportunity references public.opportunities(id) on delete cascade,
  dimension_id    uuid not null constraint fk_orr_dimension references public.opportunity_readiness_dimensions(id) on delete cascade,
  score           numeric(5,2) not null default 0,
  is_ready        boolean not null default false,
  evidence        jsonb not null default '{}'::jsonb,
  computed_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid constraint fk_orr_created_by references public.users(id) on delete set null,
  updated_by      uuid constraint fk_orr_updated_by references public.users(id) on delete set null,
  deleted_at      timestamptz,
  deleted_by      uuid constraint fk_orr_deleted_by references public.users(id) on delete set null,
  version         integer not null default 1,
  constraint chk_orr_score check (score >= 0 and score <= 100)
);

-- ============================================================================
-- SECTION G · DOCUMENTS (reuse product_document_requirements) · TASKS · NOTES
-- ============================================================================
create table if not exists public.opportunity_documents (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null constraint fk_od_organization references public.organizations(id) on delete cascade,
  opportunity_id  uuid not null constraint fk_od_opportunity references public.opportunities(id) on delete cascade,
  requirement_id  uuid constraint fk_od_requirement references public.product_document_requirements(id) on delete set null,
  product_id      uuid constraint fk_od_product references public.products(id) on delete set null,
  document_name   text not null,
  status          text not null default 'pending'
                    constraint chk_od_status check (status in ('pending','received','verified','waived','rejected')),
  storage_ref     text,
  uploaded_by_contact_id uuid constraint fk_od_uploaded_by references public.contacts(id) on delete set null,
  verified_by_contact_id uuid constraint fk_od_verified_by references public.contacts(id) on delete set null,
  received_at     timestamptz,
  verified_at     timestamptz,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid constraint fk_od_created_by references public.users(id) on delete set null,
  updated_by      uuid constraint fk_od_updated_by references public.users(id) on delete set null,
  deleted_at      timestamptz,
  deleted_by      uuid constraint fk_od_deleted_by references public.users(id) on delete set null,
  version         integer not null default 1
);

create table if not exists public.opportunity_tasks (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null constraint fk_ot_organization references public.organizations(id) on delete cascade,
  opportunity_id        uuid not null constraint fk_ot_opportunity references public.opportunities(id) on delete cascade,
  title                 text not null,
  description           text,
  origin                text not null default 'manual'
                          constraint chk_ot_origin
                          check (origin in ('manual','workflow','institution_reply','missing_documents','ai')),
  status                text not null default 'open'
                          constraint chk_ot_status check (status in ('open','in_progress','done','cancelled')),
  assignee_contact_id   uuid constraint fk_ot_assignee references public.contacts(id) on delete set null,
  readiness_dimension_id uuid constraint fk_ot_dimension references public.opportunity_readiness_dimensions(id) on delete set null,
  institution_track_id  uuid,  -- set below (FK added after tracks table exists)
  due_date              date,
  completed_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid constraint fk_ot_created_by references public.users(id) on delete set null,
  updated_by            uuid constraint fk_ot_updated_by references public.users(id) on delete set null,
  deleted_at            timestamptz,
  deleted_by            uuid constraint fk_ot_deleted_by references public.users(id) on delete set null,
  version               integer not null default 1
);

create table if not exists public.opportunity_notes (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null constraint fk_on_organization references public.organizations(id) on delete cascade,
  opportunity_id    uuid not null constraint fk_on_opportunity references public.opportunities(id) on delete cascade,
  body_html         text not null,
  is_internal       boolean not null default true,
  author_contact_id uuid constraint fk_on_author references public.contacts(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid constraint fk_on_created_by references public.users(id) on delete set null,
  updated_by        uuid constraint fk_on_updated_by references public.users(id) on delete set null,
  deleted_at        timestamptz,
  deleted_by        uuid constraint fk_on_deleted_by references public.users(id) on delete set null,
  version           integer not null default 1
);

-- ============================================================================
-- SECTION H · INSTITUTION TRACKS (interface) + full lifecycle history
-- ============================================================================
create table if not exists public.opportunity_institution_tracks (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null constraint fk_oit_organization references public.organizations(id) on delete cascade,
  opportunity_id       uuid not null constraint fk_oit_opportunity references public.opportunities(id) on delete cascade,
  institution_entity_id uuid not null constraint fk_oit_institution references public.entities(id),
  product_id           uuid constraint fk_oit_product references public.products(id) on delete set null,
  track_status         text not null default 'matched'
                         constraint chk_oit_status
                         check (track_status in ('matched','shortlisted','application_sent','documents_pending',
                                'credit_discussion','sanction','documentation','disbursement','rejected','withdrawn')),
  smart_match_score    numeric(5,2),
  is_selected          boolean not null default false,
  offered_terms        jsonb not null default '{}'::jsonb,
  sanctioned_amount    numeric(18,2),
  roi                  numeric(6,3),
  override_reason      text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  created_by           uuid constraint fk_oit_created_by references public.users(id) on delete set null,
  updated_by           uuid constraint fk_oit_updated_by references public.users(id) on delete set null,
  deleted_at           timestamptz,
  deleted_by           uuid constraint fk_oit_deleted_by references public.users(id) on delete set null,
  version              integer not null default 1,
  constraint chk_oit_match_score check (smart_match_score is null or (smart_match_score >= 0 and smart_match_score <= 100))
);

-- Append-only institution-specific lifecycle history.
create table if not exists public.opportunity_institution_track_events (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null constraint fk_oite_organization references public.organizations(id) on delete cascade,
  track_id        uuid not null constraint fk_oite_track references public.opportunity_institution_tracks(id) on delete cascade,
  from_status     text,
  to_status       text not null,
  notes           text,
  occurred_at     timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  created_by      uuid constraint fk_oite_created_by references public.users(id) on delete set null
);

-- Deferred FK: opportunity_tasks.institution_track_id -> tracks.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'fk_ot_institution_track') then
    alter table public.opportunity_tasks
      add constraint fk_ot_institution_track
      foreign key (institution_track_id) references public.opportunity_institution_tracks(id) on delete set null;
  end if;
end
$$;

-- ============================================================================
-- SECTION I · COMMUNICATIONS + TIMELINE (APPEND-ONLY) + INFORMATION SHEETS
-- ============================================================================
create table if not exists public.opportunity_communications (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null constraint fk_oc_organization references public.organizations(id) on delete cascade,
  opportunity_id     uuid not null constraint fk_oc_opportunity references public.opportunities(id) on delete cascade,
  institution_track_id uuid constraint fk_oc_track references public.opportunity_institution_tracks(id) on delete set null,
  channel            text not null
                       constraint chk_oc_channel
                       check (channel in ('email','phone_call','meeting','visit','video_conference','internal_note',
                              'institution_reply','document_request','clarification','escalation')),
  direction          text not null
                       constraint chk_oc_direction check (direction in ('inbound','outbound','internal')),
  from_contact_id    uuid constraint fk_oc_from_contact references public.contacts(id) on delete set null,
  from_entity_id     uuid constraint fk_oc_from_entity  references public.entities(id) on delete set null,
  to_contact_id      uuid constraint fk_oc_to_contact   references public.contacts(id) on delete set null,
  to_entity_id       uuid constraint fk_oc_to_entity    references public.entities(id) on delete set null,
  subject            text,
  body_html          text,
  thread_id          text,
  provider_message_id text,
  occurred_at        timestamptz not null default now(),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  created_by         uuid constraint fk_oc_created_by references public.users(id) on delete set null,
  updated_by         uuid constraint fk_oc_updated_by references public.users(id) on delete set null,
  deleted_at         timestamptz,
  deleted_by         uuid constraint fk_oc_deleted_by references public.users(id) on delete set null,
  version            integer not null default 1
);

create table if not exists public.opportunity_timeline (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null constraint fk_otl_organization references public.organizations(id) on delete cascade,
  opportunity_id  uuid not null constraint fk_otl_opportunity references public.opportunities(id) on delete cascade,
  event_type      text not null,
  source          text not null default 'system'
                    constraint chk_otl_source check (source in ('manual','workflow','institution','ai','system')),
  actor_contact_id uuid constraint fk_otl_actor_contact references public.contacts(id) on delete set null,
  actor_user_id    uuid constraint fk_otl_actor_user references public.users(id) on delete set null,
  correlation_id   uuid,
  payload          jsonb not null default '{}'::jsonb,
  occurred_at      timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  created_by       uuid constraint fk_otl_created_by references public.users(id) on delete set null
);

create table if not exists public.opportunity_information_sheets (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null constraint fk_ois_organization references public.organizations(id) on delete cascade,
  opportunity_id    uuid not null constraint fk_ois_opportunity references public.opportunities(id) on delete cascade,
  sheet_version     integer not null default 1,
  html_body         text not null,
  readiness_snapshot jsonb not null default '{}'::jsonb,
  status            text not null default 'draft'
                      constraint chk_ois_status check (status in ('draft','sent')),
  is_current        boolean not null default true,
  generated_at      timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  created_by        uuid constraint fk_ois_created_by references public.users(id) on delete set null
);

-- ============================================================================
-- SECTION J · FINANCIAL SUMMARY (Revenue integration read model)
-- ----------------------------------------------------------------------------
-- Contract populated by the future Revenue engine. Soft reference only.
-- ============================================================================
create table if not exists public.opportunity_financial_summary (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null constraint fk_ofs_organization references public.organizations(id) on delete cascade,
  opportunity_id        uuid not null constraint fk_ofs_opportunity references public.opportunities(id) on delete cascade,
  expected_revenue      numeric(18,2) not null default 0,
  actual_revenue        numeric(18,2) not null default 0,
  institution_receivable numeric(18,2) not null default 0,
  payables              numeric(18,2) not null default 0,
  profitability         numeric(18,2),
  currency              text not null default 'INR',
  updated_at            timestamptz not null default now(),
  created_at            timestamptz not null default now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- config catalogs
create unique index if not exists uq_opp_types_org_code on public.opportunity_types (organization_id, code) where organization_id is not null and deleted_at is null;
create unique index if not exists uq_opp_types_system_code on public.opportunity_types (code) where organization_id is null and is_system;
create index if not exists idx_opp_types_org_active on public.opportunity_types (organization_id, is_active) where deleted_at is null;

create unique index if not exists uq_ots_type_code on public.opportunity_type_stages (opportunity_type_id, stage_code) where deleted_at is null;
create index if not exists idx_ots_type_seq on public.opportunity_type_stages (opportunity_type_id, sequence) where deleted_at is null;
create unique index if not exists uq_ots_initial on public.opportunity_type_stages (opportunity_type_id) where is_initial and deleted_at is null;

create unique index if not exists uq_opp_obj_org_code on public.opportunity_objectives (organization_id, code) where organization_id is not null and deleted_at is null;
create unique index if not exists uq_opp_obj_system_code on public.opportunity_objectives (code) where organization_id is null and is_system;

create unique index if not exists uq_opp_pri_org_code on public.opportunity_priorities (organization_id, code) where organization_id is not null and deleted_at is null;
create unique index if not exists uq_opp_pri_system_code on public.opportunity_priorities (code) where organization_id is null and is_system;

create unique index if not exists uq_ord_org_code on public.opportunity_readiness_dimensions (organization_id, code) where organization_id is not null and deleted_at is null;
create unique index if not exists uq_ord_system_code on public.opportunity_readiness_dimensions (code) where organization_id is null and is_system;

create unique index if not exists uq_opp_eng_org_code on public.opportunity_engagement_types (organization_id, code) where organization_id is not null and deleted_at is null;
create unique index if not exists uq_opp_eng_system_code on public.opportunity_engagement_types (code) where organization_id is null and is_system;

-- opportunities
create unique index if not exists uq_opportunities_code on public.opportunities (opportunity_code);
create index if not exists idx_opportunities_org_status on public.opportunities (organization_id, status) where deleted_at is null;
create index if not exists idx_opportunities_org_type on public.opportunities (organization_id, opportunity_type_id) where deleted_at is null;
create index if not exists idx_opportunities_stage on public.opportunities (current_stage_id);
create index if not exists idx_opportunities_priority on public.opportunities (priority_id);
create index if not exists idx_opportunities_engagement on public.opportunities (engagement_type_id);
create index if not exists idx_opportunities_health on public.opportunities (organization_id, health_status) where deleted_at is null;
create index if not exists idx_opportunities_client_contact on public.opportunities (primary_client_contact_id) where primary_client_contact_id is not null;
create index if not exists idx_opportunities_client_entity on public.opportunities (primary_client_entity_id) where primary_client_entity_id is not null;
create index if not exists idx_opportunities_channel on public.opportunities (acquisition_channel_id);

-- opportunity_products
create unique index if not exists uq_opp_products_opp_product on public.opportunity_products (opportunity_id, product_id) where deleted_at is null;
create index if not exists idx_opp_products_product on public.opportunity_products (product_id);
create unique index if not exists uq_opp_products_primary on public.opportunity_products (opportunity_id) where is_primary and deleted_at is null;

-- opportunity_participants
create unique index if not exists uq_opp_participants_contact_role on public.opportunity_participants (opportunity_id, contact_id, business_role_id) where contact_id is not null and deleted_at is null;
create unique index if not exists uq_opp_participants_entity_role on public.opportunity_participants (opportunity_id, entity_id, business_role_id) where entity_id is not null and deleted_at is null;
create index if not exists idx_opp_participants_opp on public.opportunity_participants (opportunity_id) where deleted_at is null;
create index if not exists idx_opp_participants_contact on public.opportunity_participants (contact_id) where contact_id is not null;
create index if not exists idx_opp_participants_entity on public.opportunity_participants (entity_id) where entity_id is not null;
create index if not exists idx_opp_participants_role on public.opportunity_participants (business_role_id);

-- opportunity_team
create index if not exists idx_opp_team_opp on public.opportunity_team (opportunity_id) where deleted_at is null;
create index if not exists idx_opp_team_member on public.opportunity_team (member_contact_id) where deleted_at is null;
create unique index if not exists uq_opp_team_role_member_current on public.opportunity_team (opportunity_id, team_role_id, member_contact_id) where effective_to is null and deleted_at is null;
create unique index if not exists uq_opp_team_primary_current on public.opportunity_team (opportunity_id, team_role_id) where is_primary and effective_to is null and deleted_at is null;

-- history / approvals / readiness
create index if not exists idx_osh_opp on public.opportunity_stage_history (opportunity_id, changed_at desc);
create index if not exists idx_oa_opp on public.opportunity_approvals (opportunity_id) where deleted_at is null;
create index if not exists idx_oa_status on public.opportunity_approvals (organization_id, status) where deleted_at is null;
create unique index if not exists uq_orr_opp_dimension on public.opportunity_readiness (opportunity_id, dimension_id) where deleted_at is null;
create index if not exists idx_orr_opp on public.opportunity_readiness (opportunity_id) where deleted_at is null;

-- documents / tasks / notes
create index if not exists idx_od_opp_status on public.opportunity_documents (opportunity_id, status) where deleted_at is null;
create index if not exists idx_od_requirement on public.opportunity_documents (requirement_id);
create index if not exists idx_ot_opp_status on public.opportunity_tasks (opportunity_id, status) where deleted_at is null;
create index if not exists idx_ot_assignee on public.opportunity_tasks (assignee_contact_id) where deleted_at is null;
create index if not exists idx_ot_due on public.opportunity_tasks (due_date) where deleted_at is null;
create index if not exists idx_on_opp on public.opportunity_notes (opportunity_id) where deleted_at is null;

-- institution tracks
create index if not exists idx_oit_opp_status on public.opportunity_institution_tracks (opportunity_id, track_status) where deleted_at is null;
create index if not exists idx_oit_institution on public.opportunity_institution_tracks (institution_entity_id);
create unique index if not exists uq_oit_opp_institution_product on public.opportunity_institution_tracks (opportunity_id, institution_entity_id, product_id) where deleted_at is null;
create index if not exists idx_oite_track on public.opportunity_institution_track_events (track_id, occurred_at desc);

-- communications / timeline / sheets
create index if not exists idx_oc_opp on public.opportunity_communications (opportunity_id, occurred_at desc) where deleted_at is null;
create index if not exists idx_oc_thread on public.opportunity_communications (thread_id);
create index if not exists idx_oc_provider_msg on public.opportunity_communications (provider_message_id);
create index if not exists idx_oc_track on public.opportunity_communications (institution_track_id);
create index if not exists idx_otl_opp on public.opportunity_timeline (opportunity_id, occurred_at desc);
create index if not exists idx_otl_event on public.opportunity_timeline (organization_id, event_type);
create unique index if not exists uq_ois_current on public.opportunity_information_sheets (opportunity_id) where is_current;
create index if not exists idx_ois_opp on public.opportunity_information_sheets (opportunity_id, sheet_version desc);

-- financial summary
create unique index if not exists uq_ofs_opp on public.opportunity_financial_summary (opportunity_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- opportunities: code (insert), stage validation (ins/upd), updated_at/version
drop trigger if exists trg_opportunities_code on public.opportunities;
create trigger trg_opportunities_code before insert on public.opportunities
  for each row execute function public.rc_generate_opportunity_code();

drop trigger if exists trg_opportunities_validate_stage on public.opportunities;
create trigger trg_opportunities_validate_stage before insert or update on public.opportunities
  for each row execute function public.rc_validate_opportunity_stage();

drop trigger if exists trg_opportunities_set_updated_at on public.opportunities;
create trigger trg_opportunities_set_updated_at before update on public.opportunities
  for each row execute function public.rc_set_updated_at_versioned();

-- participants: reuse the shared business-role/party validator + updated_at
drop trigger if exists trg_opp_participants_validate on public.opportunity_participants;
create trigger trg_opp_participants_validate before insert or update on public.opportunity_participants
  for each row execute function public.rc_validate_business_role_party();

-- updated_at/version triggers for versioned tables
drop trigger if exists trg_opp_types_set_updated_at on public.opportunity_types;
create trigger trg_opp_types_set_updated_at before update on public.opportunity_types for each row execute function public.rc_set_updated_at_versioned();
drop trigger if exists trg_ots_set_updated_at on public.opportunity_type_stages;
create trigger trg_ots_set_updated_at before update on public.opportunity_type_stages for each row execute function public.rc_set_updated_at_versioned();
drop trigger if exists trg_opp_obj_set_updated_at on public.opportunity_objectives;
create trigger trg_opp_obj_set_updated_at before update on public.opportunity_objectives for each row execute function public.rc_set_updated_at_versioned();
drop trigger if exists trg_opp_pri_set_updated_at on public.opportunity_priorities;
create trigger trg_opp_pri_set_updated_at before update on public.opportunity_priorities for each row execute function public.rc_set_updated_at_versioned();
drop trigger if exists trg_opp_eng_set_updated_at on public.opportunity_engagement_types;
create trigger trg_opp_eng_set_updated_at before update on public.opportunity_engagement_types for each row execute function public.rc_set_updated_at_versioned();
drop trigger if exists trg_ord_set_updated_at on public.opportunity_readiness_dimensions;
create trigger trg_ord_set_updated_at before update on public.opportunity_readiness_dimensions for each row execute function public.rc_set_updated_at_versioned();
drop trigger if exists trg_opp_products_set_updated_at on public.opportunity_products;
create trigger trg_opp_products_set_updated_at before update on public.opportunity_products for each row execute function public.rc_set_updated_at_versioned();
drop trigger if exists trg_opp_participants_set_updated_at on public.opportunity_participants;
create trigger trg_opp_participants_set_updated_at before update on public.opportunity_participants for each row execute function public.rc_set_updated_at_versioned();
drop trigger if exists trg_opp_team_set_updated_at on public.opportunity_team;
create trigger trg_opp_team_set_updated_at before update on public.opportunity_team for each row execute function public.rc_set_updated_at_versioned();
drop trigger if exists trg_oa_set_updated_at on public.opportunity_approvals;
create trigger trg_oa_set_updated_at before update on public.opportunity_approvals for each row execute function public.rc_set_updated_at_versioned();
drop trigger if exists trg_orr_set_updated_at on public.opportunity_readiness;
create trigger trg_orr_set_updated_at before update on public.opportunity_readiness for each row execute function public.rc_set_updated_at_versioned();
drop trigger if exists trg_od_set_updated_at on public.opportunity_documents;
create trigger trg_od_set_updated_at before update on public.opportunity_documents for each row execute function public.rc_set_updated_at_versioned();
drop trigger if exists trg_ot_set_updated_at on public.opportunity_tasks;
create trigger trg_ot_set_updated_at before update on public.opportunity_tasks for each row execute function public.rc_set_updated_at_versioned();
drop trigger if exists trg_on_set_updated_at on public.opportunity_notes;
create trigger trg_on_set_updated_at before update on public.opportunity_notes for each row execute function public.rc_set_updated_at_versioned();
drop trigger if exists trg_oit_set_updated_at on public.opportunity_institution_tracks;
create trigger trg_oit_set_updated_at before update on public.opportunity_institution_tracks for each row execute function public.rc_set_updated_at_versioned();
drop trigger if exists trg_oc_set_updated_at on public.opportunity_communications;
create trigger trg_oc_set_updated_at before update on public.opportunity_communications for each row execute function public.rc_set_updated_at_versioned();

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================
comment on table public.opportunity_types is 'Configurable Opportunity Type catalog; DRIVES the workflow (per-type stages). System rows have organization_id NULL.';
comment on table public.opportunity_type_stages is 'Configurable pipeline stages per opportunity type. config jsonb defines mandatory docs/participants/readiness/approvals/tasks. Replaces hardcoded status enums.';
comment on table public.opportunity_objectives is 'Configurable business objective of an opportunity.';
comment on table public.opportunity_priorities is 'Configurable opportunity priority (rank drives ordering/SLA).';
comment on table public.opportunity_engagement_types is 'Configurable Engagement Type/Model. Seed defaults: Direct, Referral, Wealth Partner, Institution Referral, Builder Referral, Professional Referral, Mandate, Exclusive Mandate, Co-Advisory. Mandate is one value here — never a separate master, lifecycle, or engine. Fully configurable per org.';
comment on table public.opportunity_readiness_dimensions is 'Configurable readiness axes with weight + pass threshold; is_gating gates the Information Sheet.';
comment on table public.opportunities is 'Opportunity master (4th business master). Workflow driven by opportunity_type; products linked independently and multiply. Organization owns it (no owner column).';
comment on table public.opportunity_products is 'Products attached to an opportunity (multi-product is the standard model).';
comment on table public.opportunity_participants is 'Parties on an opportunity (contact XOR entity) with a business_role. References golden masters; no duplication.';
comment on table public.opportunity_team is 'Opportunity team assignments (reuse team_roles; member = Contact). Operational, reassignable, effective-dated. No ownership (ADR-007).';
comment on table public.opportunity_stage_history is 'Append-only stage transition history.';
comment on table public.opportunity_approvals is 'Stage-gate approvals.';
comment on table public.opportunity_readiness is 'Per-dimension readiness scores; roll up to opportunities.overall_readiness.';
comment on table public.opportunity_documents is 'Document instances; definitions reused from product_document_requirements (never duplicated).';
comment on table public.opportunity_tasks is 'Opportunity tasks; completion recomputes the linked readiness dimension.';
comment on table public.opportunity_notes is 'Free-form opportunity notes.';
comment on table public.opportunity_institution_tracks is 'INTERFACE to the future Institution engine: one track per institution (+optional product), full institution-specific lifecycle. Multiple simultaneous tracks supported.';
comment on table public.opportunity_institution_track_events is 'Append-only institution track lifecycle history.';
comment on table public.opportunity_communications is 'All communications belong to the opportunity; each writes a timeline event. Inbound institution replies auto-attach via thread/provider ids.';
comment on table public.opportunity_timeline is 'Append-only universal event log for the opportunity. Nothing edits history.';
comment on table public.opportunity_information_sheets is 'Dynamically generated HTML email body (NOT PDF, NOT attachment); readiness-gated; versioned.';
comment on table public.opportunity_financial_summary is 'Revenue integration read model (contract). Populated by the future Revenue engine.';
