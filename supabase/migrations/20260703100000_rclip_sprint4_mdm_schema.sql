-- ============================================================================
-- RCLIP — Sprint 4 · Enterprise Master Data Platform (MDM) — SCHEMA
-- ----------------------------------------------------------------------------
-- Supersedes the Phase 2A "everything is a Contact" model. RCLIP now recognises
-- exactly FOUR business masters: Organization, Contact, Entity, Opportunity.
-- This migration delivers the CONTACT and ENTITY masters and the shared,
-- organization-owned relationship layer.
--
-- Principles enforced here:
--   • Contact  = every individual.            Entity = every legal organization.
--   • Institution is NOT a master: it is an Entity with entity_type = Institution.
--   • Business Roles are DYNAMIC (catalog), shared by Contacts AND Entities.
--   • Relationships belong to the ORGANIZATION. No employee owns a relationship
--     (ADR-007): there is NO owner_* column anywhere. Employees only appear as
--     reassignable, effective-dated COVERAGE TEAM assignments (operational).
--   • Relationship Source is split into Acquisition Channel + Introduced By.
--   • Payee is not modelled here; the party-reference pattern below supports it
--     later (Revenue engine) with zero redesign.
--
-- Party reference pattern (no 5th master): shared tables carry a mutually
-- exclusive (contact_id XOR entity_id) pair, giving real FKs + integrity while
-- referencing "Contact OR Entity" uniformly.
--
-- Conventions inherited from Phase 1/2A/2B: UUID PKs, audit set, soft delete,
-- version trigger (public.rc_set_updated_at_versioned), fk_/idx_/uq_/chk_/trg_
-- naming, effective dating, business codes. Fully idempotent & re-runnable.
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists citext  with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- ============================================================================
-- SECTION A · PHASE 2A REMEDIATION (align the shipped Relationship Engine)
-- ----------------------------------------------------------------------------
-- These objects were introduced by Phase 2A and are re-shaped for the MDM model.
-- Guarded + idempotent. Phase 1 is NOT touched.
-- ============================================================================

-- A.1 — ADR-007: remove relationship ownership from contacts.
--       Dropping the column also drops fk_contacts_owner_employee + idx_contacts_owner.
alter table public.contacts drop column if exists owner_employee_id;

-- A.2 — Shared Business Roles supersede the hardcoded contact_roles enum table.
--       (Phase 2A never seeded data into it.) Dependent policies/indexes/triggers
--       are removed automatically with the table.
drop table if exists public.contact_roles cascade;

-- ============================================================================
-- SECTION B · CODE SEQUENCES + FUNCTIONS
-- ============================================================================

-- Entity business code (RC-ENT-000001 ...)
create sequence if not exists public.rc_entity_code_seq;

create or replace function public.rc_generate_entity_code()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  if new.entity_code is null or new.entity_code = '' then
    new.entity_code := 'RC-ENT-' || lpad(nextval('public.rc_entity_code_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

-- Entity dedupe hash from statutory identifiers (PAN / GSTIN / CIN).
create or replace function public.rc_entities_compute_dedupe()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  new.dedupe_hash := md5(
    lower(coalesce(new.pan, ''))   || '|' ||
    lower(coalesce(new.gstin, '')) || '|' ||
    lower(coalesce(new.cin, ''))
  );
  return new;
end;
$$;

-- Validation: a business role may only be assigned to a party kind it applies to.
create or replace function public.rc_validate_business_role_party()
returns trigger language plpgsql
set search_path = public
as $$
declare
  v_applies text;
  v_kind    text;
begin
  if new.contact_id is not null then
    v_kind := 'contact';
  elsif new.entity_id is not null then
    v_kind := 'entity';
  else
    raise exception 'business_role_assignment requires exactly one of contact_id / entity_id';
  end if;

  select applies_to into v_applies from public.business_roles where id = new.business_role_id;
  if v_applies is null then
    raise exception 'business_role % not found', new.business_role_id;
  end if;
  if v_applies <> 'both' and v_applies <> v_kind then
    raise exception 'business_role % does not apply to a %', new.business_role_id, v_kind;
  end if;
  return new;
end;
$$;

-- ============================================================================
-- SECTION C · REFERENCE / CONFIGURATION CATALOGS
-- Global system rows have organization_id NULL + is_system = true (tenant rows
-- extend them). Same pattern as contact_tags / product_categories.
-- ============================================================================

-- C.1 entity_types — configurable classification of an Entity's nature.
create table if not exists public.entity_types (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid constraint fk_entity_types_organization references public.organizations(id) on delete cascade,
  code            text not null,
  name            text not null,
  description     text,
  sort_order      integer not null default 0,
  is_system       boolean not null default false,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid constraint fk_entity_types_created_by references public.users(id) on delete set null,
  updated_by      uuid constraint fk_entity_types_updated_by references public.users(id) on delete set null,
  deleted_at      timestamptz,
  deleted_by      uuid constraint fk_entity_types_deleted_by references public.users(id) on delete set null,
  version         integer not null default 1,
  constraint chk_entity_types_system_scope
    check ((is_system and organization_id is null) or (not is_system and organization_id is not null))
);

-- C.2 business_roles — DYNAMIC role catalog shared by Contacts AND Entities.
--     applies_to constrains which party kind may hold the role.
create table if not exists public.business_roles (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid constraint fk_business_roles_organization references public.organizations(id) on delete cascade,
  code            text not null,
  name            text not null,
  category        text,
  applies_to      text not null default 'both'
                    constraint chk_business_roles_applies_to check (applies_to in ('contact','entity','both')),
  description     text,
  sort_order      integer not null default 0,
  is_system       boolean not null default false,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid constraint fk_business_roles_created_by references public.users(id) on delete set null,
  updated_by      uuid constraint fk_business_roles_updated_by references public.users(id) on delete set null,
  deleted_at      timestamptz,
  deleted_by      uuid constraint fk_business_roles_deleted_by references public.users(id) on delete set null,
  version         integer not null default 1,
  constraint chk_business_roles_system_scope
    check ((is_system and organization_id is null) or (not is_system and organization_id is not null))
);

-- C.3 acquisition_channels — HOW a relationship was acquired (Relationship
--     Source, part 1). "Introduced By" (part 2) is a party ref on the profile.
create table if not exists public.acquisition_channels (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid constraint fk_acquisition_channels_organization references public.organizations(id) on delete cascade,
  code            text not null,
  name            text not null,
  category        text,
  description     text,
  sort_order      integer not null default 0,
  is_system       boolean not null default false,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid constraint fk_acquisition_channels_created_by references public.users(id) on delete set null,
  updated_by      uuid constraint fk_acquisition_channels_updated_by references public.users(id) on delete set null,
  deleted_at      timestamptz,
  deleted_by      uuid constraint fk_acquisition_channels_deleted_by references public.users(id) on delete set null,
  version         integer not null default 1,
  constraint chk_acquisition_channels_system_scope
    check ((is_system and organization_id is null) or (not is_system and organization_id is not null))
);

-- C.4 team_roles — GENERIC operational role catalog reused by Coverage Teams,
--     Opportunity Teams, Deal Teams, Collections, Projects, and future modules.
create table if not exists public.team_roles (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid constraint fk_team_roles_organization references public.organizations(id) on delete cascade,
  code            text not null,
  name            text not null,
  description     text,
  sort_order      integer not null default 0,
  is_system       boolean not null default false,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid constraint fk_team_roles_created_by references public.users(id) on delete set null,
  updated_by      uuid constraint fk_team_roles_updated_by references public.users(id) on delete set null,
  deleted_at      timestamptz,
  deleted_by      uuid constraint fk_team_roles_deleted_by references public.users(id) on delete set null,
  version         integer not null default 1,
  constraint chk_team_roles_system_scope
    check ((is_system and organization_id is null) or (not is_system and organization_id is not null))
);

-- ============================================================================
-- SECTION D · ENTITY MASTER
-- Every legal organization. Institution is just entity_type = Institution.
-- ============================================================================
create table if not exists public.entities (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null constraint fk_entities_organization references public.organizations(id) on delete cascade,
  entity_code          text,
  entity_type_id       uuid not null constraint fk_entities_type references public.entity_types(id),
  legal_name           text not null,
  display_name         text,
  trade_name           text,
  former_name          text,
  cin                  text,
  pan                  text,
  gstin                text,
  tan                  text,
  llpin                text,
  registration_number  text,
  incorporation_date   date,
  website              text,
  primary_email        text,
  primary_phone        text,
  industry             text,
  sub_industry         text,
  employee_count_band  text
                         constraint chk_entities_headcount
                         check (employee_count_band is null or employee_count_band in
                           ('1-10','11-50','51-200','201-500','501-1000','1001-5000','5000+')),
  turnover_band        text,
  logo_url             text,
  dedupe_hash          text,
  is_golden            boolean not null default true,
  lifecycle_stage      text not null default 'lead'
                         constraint chk_entities_lifecycle
                         check (lifecycle_stage in ('lead','prospect','active','dormant','archived')),
  merged_into_entity_id uuid constraint fk_entities_merged_into references public.entities(id) on delete set null,
  status               text not null default 'active'
                         constraint chk_entities_status
                         check (status in ('active','inactive','merged','blocked')),
  metadata             jsonb not null default '{}'::jsonb,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  created_by           uuid constraint fk_entities_created_by references public.users(id) on delete set null,
  updated_by           uuid constraint fk_entities_updated_by references public.users(id) on delete set null,
  deleted_at           timestamptz,
  deleted_by           uuid constraint fk_entities_deleted_by references public.users(id) on delete set null,
  version              integer not null default 1
);

-- D.1 — link a Contact's employment/affiliation to an Entity (institution
--       employees reference Contact Master; the employer is an Entity).
alter table public.contact_affiliations add column if not exists entity_id uuid;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'fk_contact_affiliations_entity_org') then
    alter table public.contact_affiliations
      add constraint fk_contact_affiliations_entity_org
      foreign key (entity_id) references public.entities(id) on delete set null;
  end if;
end
$$;

-- ============================================================================
-- SECTION E · SHARED RELATIONSHIP LAYER (party = Contact XOR Entity)
-- ============================================================================

-- E.1 business_role_assignments — dynamic roles held by a party (effective-dated).
create table if not exists public.business_role_assignments (
  id                     uuid primary key default gen_random_uuid(),
  organization_id        uuid not null constraint fk_bra_organization references public.organizations(id) on delete cascade,
  contact_id             uuid constraint fk_bra_contact references public.contacts(id) on delete cascade,
  entity_id              uuid constraint fk_bra_entity  references public.entities(id) on delete cascade,
  business_role_id       uuid not null constraint fk_bra_role references public.business_roles(id),
  is_primary             boolean not null default false,
  status                 text not null default 'active'
                           constraint chk_bra_status check (status in ('active','inactive','suspended')),
  attributes             jsonb not null default '{}'::jsonb,
  assigned_by_employee_id uuid constraint fk_bra_assigned_by references public.employees(id) on delete set null,
  effective_from         date not null default current_date,
  effective_to           date,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  created_by             uuid constraint fk_bra_created_by references public.users(id) on delete set null,
  updated_by             uuid constraint fk_bra_updated_by references public.users(id) on delete set null,
  deleted_at             timestamptz,
  deleted_by             uuid constraint fk_bra_deleted_by references public.users(id) on delete set null,
  version                integer not null default 1,
  constraint chk_bra_party_xor  check (num_nonnulls(contact_id, entity_id) = 1),
  constraint chk_bra_dates      check (effective_to is null or effective_to >= effective_from)
);

-- E.2 relationship_profiles — org-owned qualitative relationship knowledge.
--     One profile per party. NO owner column (ADR-007).
create table if not exists public.relationship_profiles (
  id                        uuid primary key default gen_random_uuid(),
  organization_id           uuid not null constraint fk_rp_organization references public.organizations(id) on delete cascade,
  contact_id                uuid constraint fk_rp_contact references public.contacts(id) on delete cascade,
  entity_id                 uuid constraint fk_rp_entity  references public.entities(id) on delete cascade,
  relationship_strength     text
                              constraint chk_rp_strength
                              check (relationship_strength is null or relationship_strength in ('excellent','good','average','weak')),
  strength_since            date,
  relationship_classification text
                              constraint chk_rp_classification
                              check (relationship_classification is null or relationship_classification in
                                ('strategic','preferred','active','dormant','prospect','blacklisted')),
  classification_since      date,
  acquisition_channel_id    uuid constraint fk_rp_channel references public.acquisition_channels(id) on delete set null,
  introduced_by_contact_id  uuid constraint fk_rp_introduced_contact references public.contacts(id) on delete set null,
  introduced_by_entity_id   uuid constraint fk_rp_introduced_entity  references public.entities(id) on delete set null,
  introduced_by_notes       text,
  relationship_notes        text,
  metadata                  jsonb not null default '{}'::jsonb,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  created_by                uuid constraint fk_rp_created_by references public.users(id) on delete set null,
  updated_by                uuid constraint fk_rp_updated_by references public.users(id) on delete set null,
  deleted_at                timestamptz,
  deleted_by                uuid constraint fk_rp_deleted_by references public.users(id) on delete set null,
  version                   integer not null default 1,
  constraint chk_rp_party_xor        check (num_nonnulls(contact_id, entity_id) = 1),
  constraint chk_rp_introduced_xor   check (num_nonnulls(introduced_by_contact_id, introduced_by_entity_id) <= 1)
);

-- E.3 coverage_team — Relationship Management Team (operational responsibility
--     ONLY). Members reference the Contact master (employees ARE Contacts — no
--     duplicate identity path). Assignments are reassignable + effective-dated.
--     This is the ONLY place a person touches a relationship, and it confers NO
--     ownership (ADR-007). team_role_id reuses the generic team_roles catalog.
create table if not exists public.coverage_team (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null constraint fk_ct_organization references public.organizations(id) on delete cascade,
  contact_id        uuid constraint fk_ct_contact references public.contacts(id) on delete cascade,
  entity_id         uuid constraint fk_ct_entity  references public.entities(id) on delete cascade,
  team_role_id      uuid not null constraint fk_ct_role references public.team_roles(id),
  member_contact_id uuid not null constraint fk_ct_member references public.contacts(id) on delete cascade,
  is_primary        boolean not null default false,
  status            text not null default 'active'
                      constraint chk_ct_status check (status in ('active','inactive')),
  remarks           text,
  effective_from    date not null default current_date,
  effective_to      date,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid constraint fk_ct_created_by references public.users(id) on delete set null,
  updated_by        uuid constraint fk_ct_updated_by references public.users(id) on delete set null,
  deleted_at        timestamptz,
  deleted_by        uuid constraint fk_ct_deleted_by references public.users(id) on delete set null,
  version           integer not null default 1,
  constraint chk_ct_party_xor check (num_nonnulls(contact_id, entity_id) = 1),
  constraint chk_ct_dates     check (effective_to is null or effective_to >= effective_from)
);

-- E.4 relationship_intelligence — org-owned, system-curated metrics. One row
--     per party. NEVER tied to an employee (no employee FK).
create table if not exists public.relationship_intelligence (
  id                     uuid primary key default gen_random_uuid(),
  organization_id        uuid not null constraint fk_ri_organization references public.organizations(id) on delete cascade,
  contact_id             uuid constraint fk_ri_contact references public.contacts(id) on delete cascade,
  entity_id              uuid constraint fk_ri_entity  references public.entities(id) on delete cascade,
  first_interaction_date date,
  last_meeting_date      date,
  last_communication_date date,
  last_deal_date         date,
  last_revenue_date      date,
  last_opportunity_id    uuid,  -- FK deferred until the Opportunity engine ships
  total_opportunities    integer not null default 0,
  total_business_value   numeric(18,2) not null default 0,
  approval_ratio         numeric(5,2),
  average_tat_hours      numeric(10,2),
  preferred_products     jsonb not null default '[]'::jsonb,
  preferred_communication_mode text
                           constraint chk_ri_comm_mode
                           check (preferred_communication_mode is null or preferred_communication_mode in
                             ('email','phone','whatsapp','in_person','video_call','postal')),
  preferred_meeting_frequency text
                           constraint chk_ri_meeting_freq
                           check (preferred_meeting_frequency is null or preferred_meeting_frequency in
                             ('weekly','fortnightly','monthly','quarterly','half_yearly','annually','ad_hoc')),
  escalation_contacts    jsonb not null default '[]'::jsonb,
  intelligence_notes     text,
  computed_at            timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  created_by             uuid constraint fk_ri_created_by references public.users(id) on delete set null,
  updated_by             uuid constraint fk_ri_updated_by references public.users(id) on delete set null,
  deleted_at             timestamptz,
  deleted_by             uuid constraint fk_ri_deleted_by references public.users(id) on delete set null,
  version                integer not null default 1,
  constraint chk_ri_party_xor        check (num_nonnulls(contact_id, entity_id) = 1),
  constraint chk_ri_approval_ratio   check (approval_ratio is null or (approval_ratio >= 0 and approval_ratio <= 100)),
  constraint chk_ri_totals           check (total_opportunities >= 0 and total_business_value >= 0)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- entity_types
create unique index if not exists uq_entity_types_org_code
  on public.entity_types (organization_id, code) where organization_id is not null and deleted_at is null;
create unique index if not exists uq_entity_types_system_code
  on public.entity_types (code) where organization_id is null and is_system;
create index if not exists idx_entity_types_org_active on public.entity_types (organization_id, is_active) where deleted_at is null;

-- business_roles
create unique index if not exists uq_business_roles_org_code
  on public.business_roles (organization_id, code) where organization_id is not null and deleted_at is null;
create unique index if not exists uq_business_roles_system_code
  on public.business_roles (code) where organization_id is null and is_system;
create index if not exists idx_business_roles_org_active on public.business_roles (organization_id, is_active) where deleted_at is null;
create index if not exists idx_business_roles_applies_to on public.business_roles (applies_to);

-- acquisition_channels
create unique index if not exists uq_acquisition_channels_org_code
  on public.acquisition_channels (organization_id, code) where organization_id is not null and deleted_at is null;
create unique index if not exists uq_acquisition_channels_system_code
  on public.acquisition_channels (code) where organization_id is null and is_system;
create index if not exists idx_acquisition_channels_org_active on public.acquisition_channels (organization_id, is_active) where deleted_at is null;

-- team_roles
create unique index if not exists uq_team_roles_org_code
  on public.team_roles (organization_id, code) where organization_id is not null and deleted_at is null;
create unique index if not exists uq_team_roles_system_code
  on public.team_roles (code) where organization_id is null and is_system;
create index if not exists idx_team_roles_org_active on public.team_roles (organization_id, is_active) where deleted_at is null;

-- entities
create unique index if not exists uq_entities_code on public.entities (entity_code);
create unique index if not exists uq_entities_org_pan
  on public.entities (organization_id, pan) where pan is not null and deleted_at is null;
create unique index if not exists uq_entities_org_gstin
  on public.entities (organization_id, gstin) where gstin is not null and deleted_at is null;
create unique index if not exists uq_entities_org_cin
  on public.entities (organization_id, cin) where cin is not null and deleted_at is null;
create index if not exists idx_entities_org_type_status on public.entities (organization_id, entity_type_id, status) where deleted_at is null;
create index if not exists idx_entities_dedupe_hash on public.entities (dedupe_hash) where deleted_at is null;
create index if not exists idx_entities_merged_into on public.entities (merged_into_entity_id);
create index if not exists idx_entities_trgm_legal_name on public.entities using gin (legal_name extensions.gin_trgm_ops);
create index if not exists idx_entities_trgm_display_name on public.entities using gin (display_name extensions.gin_trgm_ops);

-- contact_affiliations (entity target added in Section D.1)
create index if not exists idx_contact_affiliations_entity_org on public.contact_affiliations (entity_id) where entity_id is not null;

-- business_role_assignments
create unique index if not exists uq_bra_contact_role_current
  on public.business_role_assignments (contact_id, business_role_id)
  where contact_id is not null and effective_to is null and deleted_at is null;
create unique index if not exists uq_bra_entity_role_current
  on public.business_role_assignments (entity_id, business_role_id)
  where entity_id is not null and effective_to is null and deleted_at is null;
create index if not exists idx_bra_org_role_status on public.business_role_assignments (organization_id, business_role_id, status) where deleted_at is null;
create index if not exists idx_bra_contact on public.business_role_assignments (contact_id) where contact_id is not null;
create index if not exists idx_bra_entity  on public.business_role_assignments (entity_id) where entity_id is not null;

-- relationship_profiles (one per party)
create unique index if not exists uq_rp_contact on public.relationship_profiles (contact_id) where contact_id is not null and deleted_at is null;
create unique index if not exists uq_rp_entity  on public.relationship_profiles (entity_id)  where entity_id is not null and deleted_at is null;
create index if not exists idx_rp_org_classification on public.relationship_profiles (organization_id, relationship_classification) where deleted_at is null;
create index if not exists idx_rp_org_strength on public.relationship_profiles (organization_id, relationship_strength) where deleted_at is null;
create index if not exists idx_rp_channel on public.relationship_profiles (acquisition_channel_id);

-- coverage_team
create index if not exists idx_ct_contact on public.coverage_team (contact_id) where contact_id is not null and deleted_at is null;
create index if not exists idx_ct_entity  on public.coverage_team (entity_id)  where entity_id is not null and deleted_at is null;
create index if not exists idx_ct_member  on public.coverage_team (member_contact_id) where deleted_at is null;
create unique index if not exists uq_ct_contact_role_member_current
  on public.coverage_team (contact_id, team_role_id, member_contact_id)
  where contact_id is not null and effective_to is null and deleted_at is null;
create unique index if not exists uq_ct_entity_role_member_current
  on public.coverage_team (entity_id, team_role_id, member_contact_id)
  where entity_id is not null and effective_to is null and deleted_at is null;
create unique index if not exists uq_ct_contact_primary_current
  on public.coverage_team (contact_id, team_role_id)
  where contact_id is not null and is_primary and effective_to is null and deleted_at is null;
create unique index if not exists uq_ct_entity_primary_current
  on public.coverage_team (entity_id, team_role_id)
  where entity_id is not null and is_primary and effective_to is null and deleted_at is null;

-- relationship_intelligence (one per party)
create unique index if not exists uq_ri_contact on public.relationship_intelligence (contact_id) where contact_id is not null and deleted_at is null;
create unique index if not exists uq_ri_entity  on public.relationship_intelligence (entity_id)  where entity_id is not null and deleted_at is null;
create index if not exists idx_ri_org on public.relationship_intelligence (organization_id) where deleted_at is null;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- entities: business code (insert), dedupe hash (ins/upd), updated_at/version
drop trigger if exists trg_entities_code on public.entities;
create trigger trg_entities_code before insert on public.entities
  for each row execute function public.rc_generate_entity_code();

drop trigger if exists trg_entities_dedupe on public.entities;
create trigger trg_entities_dedupe before insert or update on public.entities
  for each row execute function public.rc_entities_compute_dedupe();

drop trigger if exists trg_entities_set_updated_at on public.entities;
create trigger trg_entities_set_updated_at before update on public.entities
  for each row execute function public.rc_set_updated_at_versioned();

-- business_role_assignments: applies_to validation + updated_at/version
drop trigger if exists trg_bra_validate on public.business_role_assignments;
create trigger trg_bra_validate before insert or update on public.business_role_assignments
  for each row execute function public.rc_validate_business_role_party();

drop trigger if exists trg_bra_set_updated_at on public.business_role_assignments;
create trigger trg_bra_set_updated_at before update on public.business_role_assignments
  for each row execute function public.rc_set_updated_at_versioned();

-- updated_at/version triggers for remaining versioned tables
drop trigger if exists trg_entity_types_set_updated_at on public.entity_types;
create trigger trg_entity_types_set_updated_at before update on public.entity_types
  for each row execute function public.rc_set_updated_at_versioned();

drop trigger if exists trg_business_roles_set_updated_at on public.business_roles;
create trigger trg_business_roles_set_updated_at before update on public.business_roles
  for each row execute function public.rc_set_updated_at_versioned();

drop trigger if exists trg_acquisition_channels_set_updated_at on public.acquisition_channels;
create trigger trg_acquisition_channels_set_updated_at before update on public.acquisition_channels
  for each row execute function public.rc_set_updated_at_versioned();

drop trigger if exists trg_team_roles_set_updated_at on public.team_roles;
create trigger trg_team_roles_set_updated_at before update on public.team_roles
  for each row execute function public.rc_set_updated_at_versioned();

drop trigger if exists trg_rp_set_updated_at on public.relationship_profiles;
create trigger trg_rp_set_updated_at before update on public.relationship_profiles
  for each row execute function public.rc_set_updated_at_versioned();

drop trigger if exists trg_ct_set_updated_at on public.coverage_team;
create trigger trg_ct_set_updated_at before update on public.coverage_team
  for each row execute function public.rc_set_updated_at_versioned();

drop trigger if exists trg_ri_set_updated_at on public.relationship_intelligence;
create trigger trg_ri_set_updated_at before update on public.relationship_intelligence
  for each row execute function public.rc_set_updated_at_versioned();

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================
comment on table public.entity_types is 'Configurable classification of an Entity (Institution, Corporate, Builder, ...). System rows have organization_id NULL.';
comment on table public.business_roles is 'Dynamic role catalog shared by Contacts AND Entities. applies_to constrains the party kind. Roles are NOT identity.';
comment on table public.acquisition_channels is 'Relationship Source (part 1): HOW a relationship was acquired. Institutional knowledge owned by the Organization.';
comment on table public.team_roles is 'Generic operational role catalog reused by Coverage Teams, Opportunity Teams, Deal Teams, Collections, Projects, and future modules.';
comment on table public.entities is 'ENTITY master: every legal organization. Institution is entity_type = Institution, never a separate master.';
comment on table public.business_role_assignments is 'Effective-dated business roles held by a party (contact XOR entity). One Contact/Entity, many roles.';
comment on table public.relationship_profiles is 'Org-owned qualitative relationship knowledge: strength, classification, acquisition channel, introduced-by. No owner (ADR-007).';
comment on table public.coverage_team is 'Relationship Management Team: operational, reassignable, effective-dated assignments. Members reference the Contact master (employees are Contacts). Confers NO ownership (ADR-007).';
comment on table public.relationship_intelligence is 'Org-owned, system-curated relationship metrics. Never tied to an employee.';
comment on column public.relationship_intelligence.last_opportunity_id is 'Soft reference; FK added when the Opportunity engine ships.';
comment on column public.contact_affiliations.entity_id is 'Employer/affiliated Entity (institution employees reference Contact Master; their employer is an Entity).';
