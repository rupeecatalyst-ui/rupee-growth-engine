-- ============================================================================
-- RCLIP — Phase 2A · Enterprise Relationship Engine — SCHEMA
-- ----------------------------------------------------------------------------
-- "Everything is a Contact." Tables:
--   contacts, contact_roles, contact_affiliations, contact_relationships,
--   contact_addresses, contact_identity_documents, contact_phone_numbers,
--   contact_emails, contact_tags, contact_tag_mapping,
--   contact_communication_preferences, contact_merge_log
--
-- Conventions inherited from Phase 1: UUID PKs, audit set, soft delete,
-- version trigger (public.rc_set_updated_at_versioned), fk_/idx_/uq_/chk_/trg_
-- naming, effective dating, business codes (RC-CNT-######), dedupe + merge
-- foundations. Fully idempotent & re-runnable.
-- ============================================================================

create extension if not exists citext  with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- ----------------------------------------------------------------------------
-- Business code sequence + generator (RC-CNT-000001 ...)
-- ----------------------------------------------------------------------------
create sequence if not exists public.rc_contact_code_seq;

create or replace function public.rc_generate_contact_code()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  if new.contact_code is null or new.contact_code = '' then
    new.contact_code := 'RC-CNT-' || lpad(nextval('public.rc_contact_code_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

-- Normalizers / dedupe foundations
create or replace function public.rc_normalize_phone(p text)
returns text language sql immutable
set search_path = ''
as $$
  select nullif(regexp_replace(coalesce(p, ''), '\D', '', 'g'), '')
$$;

create or replace function public.rc_contacts_compute_dedupe()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  new.dedupe_hash := md5(
    coalesce(public.rc_normalize_phone(new.primary_phone), '') || '|' ||
    lower(coalesce(new.primary_email, ''))
  );
  return new;
end;
$$;

create or replace function public.rc_phone_set_e164()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  new.phone_e164 := public.rc_normalize_phone(new.phone_raw);
  return new;
end;
$$;

create or replace function public.rc_email_set_normalized()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  new.email_normalized := lower(btrim(new.email_raw));
  return new;
end;
$$;

-- ============================================================================
-- 1. contacts — the golden record (people AND companies)
-- ============================================================================
create table if not exists public.contacts (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null
                          constraint fk_contacts_organization
                          references public.organizations(id) on delete cascade,
  contact_code          text,
  contact_type          text not null default 'individual'
                          constraint chk_contacts_type
                          check (contact_type in ('individual','company','huf','trust','government','other')),
  salutation            text,
  first_name            text,
  middle_name           text,
  last_name             text,
  display_name          text,
  company_name          text,
  legal_name            text,
  gender                text
                          constraint chk_contacts_gender
                          check (gender is null or gender in ('male','female','other','undisclosed')),
  date_of_birth         date,
  primary_phone         text,
  primary_email         text,
  photo_url             text,
  dedupe_hash           text,
  is_golden             boolean not null default true,
  lifecycle_stage       text not null default 'lead'
                          constraint chk_contacts_lifecycle
                          check (lifecycle_stage in ('lead','prospect','active','dormant','archived')),
  owner_employee_id     uuid
                          constraint fk_contacts_owner_employee
                          references public.employees(id) on delete set null,
  merged_into_contact_id uuid
                          constraint fk_contacts_merged_into
                          references public.contacts(id) on delete set null,
  status                text not null default 'active'
                          constraint chk_contacts_status
                          check (status in ('active','inactive','merged','blocked')),
  metadata              jsonb not null default '{}'::jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid constraint fk_contacts_created_by references public.users(id) on delete set null,
  updated_by            uuid constraint fk_contacts_updated_by references public.users(id) on delete set null,
  deleted_at            timestamptz,
  deleted_by            uuid constraint fk_contacts_deleted_by references public.users(id) on delete set null,
  version               integer not null default 1,
  constraint chk_contacts_name check (
    (contact_type = 'company' and company_name is not null)
    or (contact_type <> 'company' and (first_name is not null or last_name is not null or display_name is not null))
  )
);

-- ============================================================================
-- 2. contact_roles — what a contact is/does (effective-dated)
-- ============================================================================
create table if not exists public.contact_roles (
  id                     uuid primary key default gen_random_uuid(),
  organization_id        uuid not null constraint fk_contact_roles_organization references public.organizations(id) on delete cascade,
  contact_id             uuid not null constraint fk_contact_roles_contact references public.contacts(id) on delete cascade,
  role                   text not null
                           constraint chk_contact_roles_role
                           check (role in ('customer','applicant','co_applicant','guarantor','lender_employee',
                                           'builder','channel_partner','dsa','vendor','rc_employee','ca',
                                           'architect','referral_partner','investor','other')),
  is_primary             boolean not null default false,
  status                 text not null default 'active'
                           constraint chk_contact_roles_status
                           check (status in ('active','inactive','suspended')),
  attributes             jsonb not null default '{}'::jsonb,
  assigned_by_employee_id uuid constraint fk_contact_roles_assigned_by references public.employees(id) on delete set null,
  effective_from         date not null default current_date,
  effective_to           date,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  created_by             uuid constraint fk_contact_roles_created_by references public.users(id) on delete set null,
  updated_by             uuid constraint fk_contact_roles_updated_by references public.users(id) on delete set null,
  deleted_at             timestamptz,
  deleted_by             uuid constraint fk_contact_roles_deleted_by references public.users(id) on delete set null,
  version                integer not null default 1,
  constraint chk_contact_roles_dates check (effective_to is null or effective_to >= effective_from)
);

-- ============================================================================
-- 3. contact_affiliations — where a contact belongs, over time (history)
-- ============================================================================
create table if not exists public.contact_affiliations (
  id                        uuid primary key default gen_random_uuid(),
  organization_id           uuid not null constraint fk_contact_affiliations_organization references public.organizations(id) on delete cascade,
  contact_id                uuid not null constraint fk_contact_affiliations_contact references public.contacts(id) on delete cascade,
  affiliated_contact_id     uuid constraint fk_contact_affiliations_entity references public.contacts(id) on delete set null,
  predecessor_affiliation_id uuid constraint fk_contact_affiliations_predecessor references public.contact_affiliations(id) on delete set null,
  affiliation_type          text not null default 'employment'
                              constraint chk_contact_affiliations_type
                              check (affiliation_type in ('employment','partnership','ownership','directorship','membership','representation')),
  designation               text,
  department                text,
  employee_code_at_entity   text,
  city                      text,
  location                  text,
  is_primary                boolean not null default false,
  is_current                boolean not null default true,
  effective_from            date not null default current_date,
  effective_to              date,
  change_reason             text
                              constraint chk_contact_affiliations_reason
                              check (change_reason is null or change_reason in
                                ('joined','promoted','transferred','resigned','terminated','firm_changed')),
  remarks                   text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  created_by                uuid constraint fk_contact_affiliations_created_by references public.users(id) on delete set null,
  updated_by                uuid constraint fk_contact_affiliations_updated_by references public.users(id) on delete set null,
  deleted_at                timestamptz,
  deleted_by                uuid constraint fk_contact_affiliations_deleted_by references public.users(id) on delete set null,
  version                   integer not null default 1,
  constraint chk_contact_affiliations_dates check (effective_to is null or effective_to >= effective_from),
  constraint chk_contact_affiliations_self check (affiliated_contact_id is null or affiliated_contact_id <> contact_id)
);

-- ============================================================================
-- 4. contact_relationships — contact <-> contact edges
-- ============================================================================
create table if not exists public.contact_relationships (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null constraint fk_contact_relationships_organization references public.organizations(id) on delete cascade,
  from_contact_id   uuid not null constraint fk_contact_relationships_from references public.contacts(id) on delete cascade,
  to_contact_id     uuid not null constraint fk_contact_relationships_to references public.contacts(id) on delete cascade,
  relationship_type text not null
                      constraint chk_contact_relationships_type
                      check (relationship_type in ('spouse','parent','child','sibling','business_partner',
                             'guarantor_of','referred_by','reports_to','colleague_of','director_of',
                             'promoter_of','introduced_by')),
  strength          text constraint chk_contact_relationships_strength
                      check (strength is null or strength in ('weak','normal','strong')),
  notes             text,
  effective_from    date not null default current_date,
  effective_to      date,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid constraint fk_contact_relationships_created_by references public.users(id) on delete set null,
  updated_by        uuid constraint fk_contact_relationships_updated_by references public.users(id) on delete set null,
  deleted_at        timestamptz,
  deleted_by        uuid constraint fk_contact_relationships_deleted_by references public.users(id) on delete set null,
  version           integer not null default 1,
  constraint chk_contact_relationships_self check (from_contact_id <> to_contact_id),
  constraint chk_contact_relationships_dates check (effective_to is null or effective_to >= effective_from)
);

-- ============================================================================
-- 5. contact_addresses
-- ============================================================================
create table if not exists public.contact_addresses (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null constraint fk_contact_addresses_organization references public.organizations(id) on delete cascade,
  contact_id      uuid not null constraint fk_contact_addresses_contact references public.contacts(id) on delete cascade,
  address_type    text not null default 'residential'
                    constraint chk_contact_addresses_type
                    check (address_type in ('residential','permanent','office','registered','communication','property','billing')),
  line1           text,
  line2           text,
  landmark        text,
  city            text,
  district        text,
  state           text,
  pincode         text,
  country         text not null default 'IN',
  latitude        numeric(9,6),
  longitude       numeric(9,6),
  is_primary      boolean not null default false,
  is_verified     boolean not null default false,
  verified_at     timestamptz,
  valid_from      date not null default current_date,
  valid_to        date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid constraint fk_contact_addresses_created_by references public.users(id) on delete set null,
  updated_by      uuid constraint fk_contact_addresses_updated_by references public.users(id) on delete set null,
  deleted_at      timestamptz,
  deleted_by      uuid constraint fk_contact_addresses_deleted_by references public.users(id) on delete set null,
  version         integer not null default 1,
  constraint chk_contact_addresses_dates check (valid_to is null or valid_to >= valid_from)
);

-- ============================================================================
-- 6. contact_identity_documents (sensitive; tokenized/masked)
-- ============================================================================
create table if not exists public.contact_identity_documents (
  id                     uuid primary key default gen_random_uuid(),
  organization_id        uuid not null constraint fk_contact_identity_documents_organization references public.organizations(id) on delete cascade,
  contact_id             uuid not null constraint fk_contact_identity_documents_contact references public.contacts(id) on delete cascade,
  document_type          text not null
                           constraint chk_contact_identity_documents_type
                           check (document_type in ('pan','aadhaar','passport','voter_id','driving_license','gstin','cin','udyam','other')),
  document_number_token  text,
  document_number_masked text,
  holder_name            text,
  issuing_authority      text,
  issue_date             date,
  expiry_date            date,
  verification_status    text not null default 'pending'
                           constraint chk_contact_identity_documents_status
                           check (verification_status in ('pending','verified','rejected','expired')),
  verified_at            timestamptz,
  verified_by_employee_id uuid constraint fk_contact_identity_documents_verified_by references public.employees(id) on delete set null,
  is_primary             boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  created_by             uuid constraint fk_contact_identity_documents_created_by references public.users(id) on delete set null,
  updated_by             uuid constraint fk_contact_identity_documents_updated_by references public.users(id) on delete set null,
  deleted_at             timestamptz,
  deleted_by             uuid constraint fk_contact_identity_documents_deleted_by references public.users(id) on delete set null,
  version                integer not null default 1
);

-- ============================================================================
-- 7. contact_phone_numbers
-- ============================================================================
create table if not exists public.contact_phone_numbers (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null constraint fk_contact_phone_numbers_organization references public.organizations(id) on delete cascade,
  contact_id      uuid not null constraint fk_contact_phone_numbers_contact references public.contacts(id) on delete cascade,
  phone_raw       text not null,
  phone_e164      text,
  country_code    text,
  phone_type      text not null default 'mobile'
                    constraint chk_contact_phone_numbers_type
                    check (phone_type in ('mobile','landline','work','home','whatsapp','other')),
  label           text,
  is_primary      boolean not null default false,
  is_whatsapp     boolean not null default false,
  is_verified     boolean not null default false,
  verified_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid constraint fk_contact_phone_numbers_created_by references public.users(id) on delete set null,
  updated_by      uuid constraint fk_contact_phone_numbers_updated_by references public.users(id) on delete set null,
  deleted_at      timestamptz,
  deleted_by      uuid constraint fk_contact_phone_numbers_deleted_by references public.users(id) on delete set null,
  version         integer not null default 1
);

-- ============================================================================
-- 8. contact_emails
-- ============================================================================
create table if not exists public.contact_emails (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null constraint fk_contact_emails_organization references public.organizations(id) on delete cascade,
  contact_id       uuid not null constraint fk_contact_emails_contact references public.contacts(id) on delete cascade,
  email_raw        text not null,
  email_normalized extensions.citext,
  email_type       text not null default 'personal'
                     constraint chk_contact_emails_type
                     check (email_type in ('personal','work','billing','other')),
  label            text,
  is_primary       boolean not null default false,
  is_verified      boolean not null default false,
  verified_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       uuid constraint fk_contact_emails_created_by references public.users(id) on delete set null,
  updated_by       uuid constraint fk_contact_emails_updated_by references public.users(id) on delete set null,
  deleted_at       timestamptz,
  deleted_by       uuid constraint fk_contact_emails_deleted_by references public.users(id) on delete set null,
  version          integer not null default 1
);

-- ============================================================================
-- 9. contact_tags (catalog; global system tags have organization_id NULL)
-- ============================================================================
create table if not exists public.contact_tags (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid constraint fk_contact_tags_organization references public.organizations(id) on delete cascade,
  code            text not null,
  name            text not null,
  category        text,
  color           text,
  description     text,
  is_system       boolean not null default false,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid constraint fk_contact_tags_created_by references public.users(id) on delete set null,
  updated_by      uuid constraint fk_contact_tags_updated_by references public.users(id) on delete set null,
  deleted_at      timestamptz,
  deleted_by      uuid constraint fk_contact_tags_deleted_by references public.users(id) on delete set null,
  version         integer not null default 1,
  constraint chk_contact_tags_system_scope
    check ((is_system and organization_id is null) or (not is_system and organization_id is not null))
);

-- ============================================================================
-- 10. contact_tag_mapping (junction)
-- ============================================================================
create table if not exists public.contact_tag_mapping (
  id                     uuid primary key default gen_random_uuid(),
  organization_id        uuid not null constraint fk_contact_tag_mapping_organization references public.organizations(id) on delete cascade,
  contact_id             uuid not null constraint fk_contact_tag_mapping_contact references public.contacts(id) on delete cascade,
  tag_id                 uuid not null constraint fk_contact_tag_mapping_tag references public.contact_tags(id) on delete cascade,
  assigned_by_employee_id uuid constraint fk_contact_tag_mapping_assigned_by references public.employees(id) on delete set null,
  assigned_at            timestamptz not null default now(),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  created_by             uuid constraint fk_contact_tag_mapping_created_by references public.users(id) on delete set null,
  updated_by             uuid constraint fk_contact_tag_mapping_updated_by references public.users(id) on delete set null,
  deleted_at             timestamptz,
  deleted_by             uuid constraint fk_contact_tag_mapping_deleted_by references public.users(id) on delete set null,
  version                integer not null default 1
);

-- ============================================================================
-- 11. contact_communication_preferences (per-channel consent; DPDP-ready)
-- ============================================================================
create table if not exists public.contact_communication_preferences (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null constraint fk_contact_comm_prefs_organization references public.organizations(id) on delete cascade,
  contact_id            uuid not null constraint fk_contact_comm_prefs_contact references public.contacts(id) on delete cascade,
  channel               text not null
                          constraint chk_contact_comm_prefs_channel
                          check (channel in ('email','sms','whatsapp','voice_call','push','postal')),
  opt_status            text not null default 'unknown'
                          constraint chk_contact_comm_prefs_opt
                          check (opt_status in ('opted_in','opted_out','unknown')),
  is_dnd                boolean not null default false,
  consent_source        text
                          constraint chk_contact_comm_prefs_source
                          check (consent_source is null or consent_source in ('web_form','otp','verbal','import','api')),
  consent_at            timestamptz,
  consent_expires_at    timestamptz,
  frequency_cap_per_week integer,
  preferred_time_window jsonb,
  preferred_language    text,
  last_updated_reason   text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid constraint fk_contact_comm_prefs_created_by references public.users(id) on delete set null,
  updated_by            uuid constraint fk_contact_comm_prefs_updated_by references public.users(id) on delete set null,
  deleted_at            timestamptz,
  deleted_by            uuid constraint fk_contact_comm_prefs_deleted_by references public.users(id) on delete set null,
  version               integer not null default 1,
  constraint chk_contact_comm_prefs_freq check (frequency_cap_per_week is null or frequency_cap_per_week >= 0)
);

-- ============================================================================
-- 12. contact_merge_log (append-only merge audit / reversibility)
-- ============================================================================
create table if not exists public.contact_merge_log (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null constraint fk_contact_merge_log_organization references public.organizations(id) on delete cascade,
  surviving_contact_id uuid constraint fk_contact_merge_log_surviving references public.contacts(id) on delete set null,
  merged_contact_id    uuid constraint fk_contact_merge_log_merged references public.contacts(id) on delete set null,
  merged_by_user_id    uuid constraint fk_contact_merge_log_merged_by references public.users(id) on delete set null,
  reason               text,
  field_survivorship   jsonb,
  merged_at            timestamptz not null default now(),
  created_at           timestamptz not null default now(),
  created_by           uuid constraint fk_contact_merge_log_created_by references public.users(id) on delete set null,
  constraint chk_contact_merge_log_distinct
    check (surviving_contact_id is null or merged_contact_id is null or surviving_contact_id <> merged_contact_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- contacts
create unique index if not exists uq_contacts_code on public.contacts (contact_code);
create index if not exists idx_contacts_org_phone   on public.contacts (organization_id, primary_phone) where deleted_at is null;
create index if not exists idx_contacts_org_email   on public.contacts (organization_id, primary_email) where deleted_at is null;
create index if not exists idx_contacts_dedupe_hash on public.contacts (dedupe_hash) where deleted_at is null;
create index if not exists idx_contacts_org_type_status on public.contacts (organization_id, contact_type, status) where deleted_at is null;
create index if not exists idx_contacts_owner       on public.contacts (owner_employee_id);
create index if not exists idx_contacts_merged_into on public.contacts (merged_into_contact_id);
create index if not exists idx_contacts_trgm_name   on public.contacts using gin (display_name extensions.gin_trgm_ops);
create index if not exists idx_contacts_trgm_phone  on public.contacts using gin (primary_phone extensions.gin_trgm_ops);

-- contact_roles
create unique index if not exists uq_contact_roles_current
  on public.contact_roles (contact_id, role) where effective_to is null and deleted_at is null;
create index if not exists idx_contact_roles_org_role on public.contact_roles (organization_id, role, status) where deleted_at is null;
create index if not exists idx_contact_roles_contact  on public.contact_roles (contact_id);

-- contact_affiliations
create index if not exists idx_contact_affiliations_contact_current on public.contact_affiliations (contact_id, is_current) where deleted_at is null;
create index if not exists idx_contact_affiliations_entity on public.contact_affiliations (affiliated_contact_id);
create index if not exists idx_contact_affiliations_org_from on public.contact_affiliations (organization_id, effective_from desc);
create unique index if not exists uq_contact_affiliations_primary_current
  on public.contact_affiliations (contact_id) where is_primary and is_current and deleted_at is null;

-- contact_relationships
create unique index if not exists uq_contact_relationships_current
  on public.contact_relationships (from_contact_id, to_contact_id, relationship_type)
  where effective_to is null and deleted_at is null;
create index if not exists idx_contact_relationships_to on public.contact_relationships (to_contact_id);
create index if not exists idx_contact_relationships_org_type on public.contact_relationships (organization_id, relationship_type);

-- contact_addresses
create index if not exists idx_contact_addresses_contact_type on public.contact_addresses (contact_id, address_type) where deleted_at is null;
create unique index if not exists uq_contact_addresses_primary
  on public.contact_addresses (contact_id) where is_primary and valid_to is null and deleted_at is null;
create index if not exists idx_contact_addresses_pincode on public.contact_addresses (pincode);
create index if not exists idx_contact_addresses_org_city on public.contact_addresses (organization_id, city);

-- contact_identity_documents
create index if not exists idx_contact_iddocs_contact_type on public.contact_identity_documents (contact_id, document_type) where deleted_at is null;
create unique index if not exists uq_contact_iddocs_number
  on public.contact_identity_documents (organization_id, document_type, document_number_token)
  where document_number_token is not null and deleted_at is null;
create index if not exists idx_contact_iddocs_status on public.contact_identity_documents (verification_status);
create index if not exists idx_contact_iddocs_expiry on public.contact_identity_documents (expiry_date) where deleted_at is null;

-- contact_phone_numbers
create unique index if not exists uq_contact_phones_contact_e164
  on public.contact_phone_numbers (contact_id, phone_e164) where phone_e164 is not null and deleted_at is null;
create index if not exists idx_contact_phones_org_e164 on public.contact_phone_numbers (organization_id, phone_e164) where deleted_at is null;
create unique index if not exists uq_contact_phones_primary
  on public.contact_phone_numbers (contact_id) where is_primary and deleted_at is null;
create index if not exists idx_contact_phones_trgm on public.contact_phone_numbers using gin (phone_e164 extensions.gin_trgm_ops);

-- contact_emails
create unique index if not exists uq_contact_emails_contact_norm
  on public.contact_emails (contact_id, email_normalized) where email_normalized is not null and deleted_at is null;
create index if not exists idx_contact_emails_org_norm on public.contact_emails (organization_id, email_normalized) where deleted_at is null;
create unique index if not exists uq_contact_emails_primary
  on public.contact_emails (contact_id) where is_primary and deleted_at is null;

-- contact_tags
create unique index if not exists uq_contact_tags_org_code
  on public.contact_tags (organization_id, code) where organization_id is not null and deleted_at is null;
create unique index if not exists uq_contact_tags_system_code
  on public.contact_tags (code) where organization_id is null and is_system;
create index if not exists idx_contact_tags_org_active on public.contact_tags (organization_id, is_active);
create index if not exists idx_contact_tags_category on public.contact_tags (category);

-- contact_tag_mapping
create unique index if not exists uq_contact_tag_mapping
  on public.contact_tag_mapping (contact_id, tag_id) where deleted_at is null;
create index if not exists idx_contact_tag_mapping_tag on public.contact_tag_mapping (tag_id);

-- contact_communication_preferences
create unique index if not exists uq_contact_comm_prefs_channel
  on public.contact_communication_preferences (contact_id, channel) where deleted_at is null;
create index if not exists idx_contact_comm_prefs_org_channel on public.contact_communication_preferences (organization_id, channel, opt_status);
create index if not exists idx_contact_comm_prefs_dnd on public.contact_communication_preferences (is_dnd);

-- contact_merge_log
create index if not exists idx_contact_merge_log_surviving on public.contact_merge_log (surviving_contact_id);
create index if not exists idx_contact_merge_log_merged on public.contact_merge_log (merged_contact_id);
create index if not exists idx_contact_merge_log_org_at on public.contact_merge_log (organization_id, merged_at desc);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- contacts: business code (insert), dedupe hash (ins/upd), updated_at/version
drop trigger if exists trg_contacts_code on public.contacts;
create trigger trg_contacts_code before insert on public.contacts
  for each row execute function public.rc_generate_contact_code();

drop trigger if exists trg_contacts_dedupe on public.contacts;
create trigger trg_contacts_dedupe before insert or update on public.contacts
  for each row execute function public.rc_contacts_compute_dedupe();

drop trigger if exists trg_contacts_set_updated_at on public.contacts;
create trigger trg_contacts_set_updated_at before update on public.contacts
  for each row execute function public.rc_set_updated_at_versioned();

-- phones: normalize e164 + updated_at/version
drop trigger if exists trg_contact_phones_e164 on public.contact_phone_numbers;
create trigger trg_contact_phones_e164 before insert or update on public.contact_phone_numbers
  for each row execute function public.rc_phone_set_e164();

-- emails: normalize + updated_at/version
drop trigger if exists trg_contact_emails_norm on public.contact_emails;
create trigger trg_contact_emails_norm before insert or update on public.contact_emails
  for each row execute function public.rc_email_set_normalized();

-- updated_at/version triggers for the remaining versioned tables
drop trigger if exists trg_contact_roles_set_updated_at on public.contact_roles;
create trigger trg_contact_roles_set_updated_at before update on public.contact_roles
  for each row execute function public.rc_set_updated_at_versioned();

drop trigger if exists trg_contact_affiliations_set_updated_at on public.contact_affiliations;
create trigger trg_contact_affiliations_set_updated_at before update on public.contact_affiliations
  for each row execute function public.rc_set_updated_at_versioned();

drop trigger if exists trg_contact_relationships_set_updated_at on public.contact_relationships;
create trigger trg_contact_relationships_set_updated_at before update on public.contact_relationships
  for each row execute function public.rc_set_updated_at_versioned();

drop trigger if exists trg_contact_addresses_set_updated_at on public.contact_addresses;
create trigger trg_contact_addresses_set_updated_at before update on public.contact_addresses
  for each row execute function public.rc_set_updated_at_versioned();

drop trigger if exists trg_contact_iddocs_set_updated_at on public.contact_identity_documents;
create trigger trg_contact_iddocs_set_updated_at before update on public.contact_identity_documents
  for each row execute function public.rc_set_updated_at_versioned();

drop trigger if exists trg_contact_phones_set_updated_at on public.contact_phone_numbers;
create trigger trg_contact_phones_set_updated_at before update on public.contact_phone_numbers
  for each row execute function public.rc_set_updated_at_versioned();

drop trigger if exists trg_contact_emails_set_updated_at on public.contact_emails;
create trigger trg_contact_emails_set_updated_at before update on public.contact_emails
  for each row execute function public.rc_set_updated_at_versioned();

drop trigger if exists trg_contact_tags_set_updated_at on public.contact_tags;
create trigger trg_contact_tags_set_updated_at before update on public.contact_tags
  for each row execute function public.rc_set_updated_at_versioned();

drop trigger if exists trg_contact_tag_mapping_set_updated_at on public.contact_tag_mapping;
create trigger trg_contact_tag_mapping_set_updated_at before update on public.contact_tag_mapping
  for each row execute function public.rc_set_updated_at_versioned();

drop trigger if exists trg_contact_comm_prefs_set_updated_at on public.contact_communication_preferences;
create trigger trg_contact_comm_prefs_set_updated_at before update on public.contact_communication_preferences
  for each row execute function public.rc_set_updated_at_versioned();

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================
comment on table public.contacts is 'Golden record: every person or company originates here (Relationship Engine).';
comment on table public.contact_roles is 'Effective-dated business roles a contact plays (customer, guarantor, lender RM, CA, ...).';
comment on table public.contact_affiliations is 'Historical employment/membership of a contact with an entity (company contact), effective-dated, no overwrite.';
comment on table public.contact_relationships is 'Directed contact-to-contact relationship graph.';
comment on table public.contact_addresses is 'Multiple typed, effective-dated addresses per contact.';
comment on table public.contact_identity_documents is 'KYC/identity documents (tokenized/masked, sensitive).';
comment on table public.contact_phone_numbers is 'Multiple phone numbers per contact with normalized E.164.';
comment on table public.contact_emails is 'Multiple emails per contact with normalized (citext) value.';
comment on table public.contact_tags is 'Tag catalog; global system tags have organization_id NULL.';
comment on table public.contact_tag_mapping is 'Junction assigning tags to contacts.';
comment on table public.contact_communication_preferences is 'Per-channel consent and communication preferences (DPDP-ready).';
comment on table public.contact_merge_log is 'Append-only audit of contact merges for reversibility.';
