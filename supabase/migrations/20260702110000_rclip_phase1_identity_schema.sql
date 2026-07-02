-- ============================================================================
-- RCLIP — Rupee Catalyst Loan Intelligence Platform
-- Phase 1 · Identity & Access + Organization Structure — SCHEMA
-- ----------------------------------------------------------------------------
-- Tables: organizations, branches, employees, users, roles, permissions,
--         role_permissions, user_roles
-- Properties: UUID PKs, audit columns, soft delete, optimized indexes,
--             updated_at/version triggers. Fully idempotent & re-runnable.
-- NOTE: RLS policies live in the *_rls migration; seed data in the *_seed one.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Trigger functions (updated_at maintenance + optimistic version bump)
-- ----------------------------------------------------------------------------
create or replace function public.rc_set_updated_at_versioned()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' then
    new.version := coalesce(old.version, 1) + 1;
  end if;
  return new;
end;
$$;

create or replace function public.rc_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Idempotent FK helper: adds a constraint only if it does not already exist.
create or replace function public.rc_add_fk(p_constraint text, p_ddl text)
returns void
language plpgsql
as $$
begin
  if not exists (select 1 from pg_constraint where conname = p_constraint) then
    execute p_ddl;
  end if;
end;
$$;

-- ============================================================================
-- TABLES (columns first; circular / audit FKs added afterwards)
-- ============================================================================

-- 1. organizations -----------------------------------------------------------
create table if not exists public.organizations (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  legal_name          text,
  slug                text not null,
  gstin               text,
  pan                 text,
  rbi_registration_no text,
  logo_url            text,
  primary_email       text,
  primary_phone       text,
  address             jsonb,
  timezone            text not null default 'Asia/Kolkata',
  currency            text not null default 'INR',
  status              text not null default 'active'
                        constraint chk_organizations_status
                        check (status in ('active','suspended','closed')),
  settings            jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  created_by          uuid,
  updated_by          uuid,
  deleted_at          timestamptz,
  deleted_by          uuid,
  version             integer not null default 1
);

-- 2. branches ----------------------------------------------------------------
create table if not exists public.branches (
  id                         uuid primary key default gen_random_uuid(),
  organization_id            uuid not null,
  parent_branch_id           uuid,
  branch_manager_employee_id uuid,
  branch_code                text not null,
  name                       text not null,
  address                    jsonb,
  city                       text,
  state                      text,
  pincode                    text,
  phone                      text,
  email                      text,
  branch_type                text not null default 'branch'
                               constraint chk_branches_type
                               check (branch_type in ('head_office','regional','branch','virtual')),
  status                     text not null default 'active'
                               constraint chk_branches_status
                               check (status in ('active','inactive','closed')),
  go_live_date               date,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),
  created_by                 uuid,
  updated_by                 uuid,
  deleted_at                 timestamptz,
  deleted_by                 uuid,
  version                    integer not null default 1
);

-- 3. employees ---------------------------------------------------------------
create table if not exists public.employees (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null,
  branch_id            uuid,
  reporting_manager_id uuid,
  user_id              uuid,
  employee_code        text not null,
  first_name           text not null,
  last_name            text,
  designation          text,
  department           text
                         constraint chk_employees_department
                         check (department is null or department in
                           ('sales','credit','operations','marketing','management')),
  official_email       text,
  official_phone       text,
  date_of_joining      date,
  date_of_exit         date,
  status               text not null default 'active'
                         constraint chk_employees_status
                         check (status in ('active','on_leave','inactive','terminated')),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  created_by           uuid,
  updated_by           uuid,
  deleted_at           timestamptz,
  deleted_by           uuid,
  version              integer not null default 1,
  constraint chk_employees_exit_after_join
    check (date_of_exit is null or date_of_joining is null or date_of_exit >= date_of_joining)
);

-- 4. users -------------------------------------------------------------------
create table if not exists public.users (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null,
  auth_user_id      uuid,
  employee_id       uuid,
  primary_branch_id uuid,
  email             text not null,
  phone             text,
  display_name      text,
  avatar_url        text,
  is_active         boolean not null default true,
  is_org_owner      boolean not null default false,
  last_login_at     timestamptz,
  locale            text not null default 'en',
  mfa_enabled       boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid,
  updated_by        uuid,
  deleted_at        timestamptz,
  deleted_by        uuid,
  version           integer not null default 1
);

-- 5. roles -------------------------------------------------------------------
create table if not exists public.roles (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid,
  name            text not null,
  code            text not null,
  description     text,
  is_system       boolean not null default false,
  hierarchy_level integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid,
  updated_by      uuid,
  deleted_at      timestamptz,
  deleted_by      uuid,
  version         integer not null default 1,
  constraint chk_roles_system_scope
    check ((is_system and organization_id is null) or (not is_system and organization_id is not null))
);

-- 6. permissions (global reference catalog; no org, no soft delete) ----------
create table if not exists public.permissions (
  id          uuid primary key default gen_random_uuid(),
  code        text not null,
  resource    text not null,
  action      text not null,
  description text,
  category    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 7. role_permissions (junction) --------------------------------------------
create table if not exists public.role_permissions (
  id            uuid primary key default gen_random_uuid(),
  role_id       uuid not null,
  permission_id uuid not null,
  granted_at    timestamptz not null default now(),
  created_by    uuid
);

-- 8. user_roles (junction) ---------------------------------------------------
create table if not exists public.user_roles (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  user_id         uuid not null,
  role_id         uuid not null,
  scope           jsonb not null default '{}'::jsonb,
  valid_from      timestamptz not null default now(),
  valid_until     timestamptz,
  assigned_by     uuid,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid,
  updated_by      uuid,
  deleted_at      timestamptz,
  deleted_by      uuid,
  version         integer not null default 1,
  constraint chk_user_roles_validity
    check (valid_until is null or valid_until >= valid_from)
);

-- ============================================================================
-- FOREIGN KEYS (idempotent via rc_add_fk)
-- ============================================================================

-- organization_id -> organizations (tenant boundary, cascade on tenant teardown)
select public.rc_add_fk('fk_branches_organization',
  'alter table public.branches add constraint fk_branches_organization
     foreign key (organization_id) references public.organizations(id) on delete cascade');
select public.rc_add_fk('fk_employees_organization',
  'alter table public.employees add constraint fk_employees_organization
     foreign key (organization_id) references public.organizations(id) on delete cascade');
select public.rc_add_fk('fk_users_organization',
  'alter table public.users add constraint fk_users_organization
     foreign key (organization_id) references public.organizations(id) on delete cascade');
select public.rc_add_fk('fk_roles_organization',
  'alter table public.roles add constraint fk_roles_organization
     foreign key (organization_id) references public.organizations(id) on delete cascade');
select public.rc_add_fk('fk_user_roles_organization',
  'alter table public.user_roles add constraint fk_user_roles_organization
     foreign key (organization_id) references public.organizations(id) on delete cascade');

-- branch hierarchy + manager
select public.rc_add_fk('fk_branches_parent',
  'alter table public.branches add constraint fk_branches_parent
     foreign key (parent_branch_id) references public.branches(id) on delete set null');
select public.rc_add_fk('fk_branches_manager',
  'alter table public.branches add constraint fk_branches_manager
     foreign key (branch_manager_employee_id) references public.employees(id) on delete set null');

-- employees relationships
select public.rc_add_fk('fk_employees_branch',
  'alter table public.employees add constraint fk_employees_branch
     foreign key (branch_id) references public.branches(id) on delete set null');
select public.rc_add_fk('fk_employees_manager',
  'alter table public.employees add constraint fk_employees_manager
     foreign key (reporting_manager_id) references public.employees(id) on delete set null');
select public.rc_add_fk('fk_employees_user',
  'alter table public.employees add constraint fk_employees_user
     foreign key (user_id) references public.users(id) on delete set null');

-- users relationships
select public.rc_add_fk('fk_users_employee',
  'alter table public.users add constraint fk_users_employee
     foreign key (employee_id) references public.employees(id) on delete set null');
select public.rc_add_fk('fk_users_primary_branch',
  'alter table public.users add constraint fk_users_primary_branch
     foreign key (primary_branch_id) references public.branches(id) on delete set null');
select public.rc_add_fk('fk_users_auth_user',
  'alter table public.users add constraint fk_users_auth_user
     foreign key (auth_user_id) references auth.users(id) on delete cascade');

-- junctions
select public.rc_add_fk('fk_role_permissions_role',
  'alter table public.role_permissions add constraint fk_role_permissions_role
     foreign key (role_id) references public.roles(id) on delete cascade');
select public.rc_add_fk('fk_role_permissions_permission',
  'alter table public.role_permissions add constraint fk_role_permissions_permission
     foreign key (permission_id) references public.permissions(id) on delete cascade');
select public.rc_add_fk('fk_user_roles_user',
  'alter table public.user_roles add constraint fk_user_roles_user
     foreign key (user_id) references public.users(id) on delete cascade');
select public.rc_add_fk('fk_user_roles_role',
  'alter table public.user_roles add constraint fk_user_roles_role
     foreign key (role_id) references public.roles(id) on delete cascade');
select public.rc_add_fk('fk_user_roles_assigned_by',
  'alter table public.user_roles add constraint fk_user_roles_assigned_by
     foreign key (assigned_by) references public.users(id) on delete set null');

-- audit actor FKs (created_by / updated_by / deleted_by -> users)
select public.rc_add_fk('fk_organizations_created_by',
  'alter table public.organizations add constraint fk_organizations_created_by
     foreign key (created_by) references public.users(id) on delete set null');
select public.rc_add_fk('fk_organizations_updated_by',
  'alter table public.organizations add constraint fk_organizations_updated_by
     foreign key (updated_by) references public.users(id) on delete set null');
select public.rc_add_fk('fk_organizations_deleted_by',
  'alter table public.organizations add constraint fk_organizations_deleted_by
     foreign key (deleted_by) references public.users(id) on delete set null');

select public.rc_add_fk('fk_branches_created_by',
  'alter table public.branches add constraint fk_branches_created_by
     foreign key (created_by) references public.users(id) on delete set null');
select public.rc_add_fk('fk_branches_updated_by',
  'alter table public.branches add constraint fk_branches_updated_by
     foreign key (updated_by) references public.users(id) on delete set null');
select public.rc_add_fk('fk_branches_deleted_by',
  'alter table public.branches add constraint fk_branches_deleted_by
     foreign key (deleted_by) references public.users(id) on delete set null');

select public.rc_add_fk('fk_employees_created_by',
  'alter table public.employees add constraint fk_employees_created_by
     foreign key (created_by) references public.users(id) on delete set null');
select public.rc_add_fk('fk_employees_updated_by',
  'alter table public.employees add constraint fk_employees_updated_by
     foreign key (updated_by) references public.users(id) on delete set null');
select public.rc_add_fk('fk_employees_deleted_by',
  'alter table public.employees add constraint fk_employees_deleted_by
     foreign key (deleted_by) references public.users(id) on delete set null');

select public.rc_add_fk('fk_users_created_by',
  'alter table public.users add constraint fk_users_created_by
     foreign key (created_by) references public.users(id) on delete set null');
select public.rc_add_fk('fk_users_updated_by',
  'alter table public.users add constraint fk_users_updated_by
     foreign key (updated_by) references public.users(id) on delete set null');
select public.rc_add_fk('fk_users_deleted_by',
  'alter table public.users add constraint fk_users_deleted_by
     foreign key (deleted_by) references public.users(id) on delete set null');

select public.rc_add_fk('fk_roles_created_by',
  'alter table public.roles add constraint fk_roles_created_by
     foreign key (created_by) references public.users(id) on delete set null');
select public.rc_add_fk('fk_roles_updated_by',
  'alter table public.roles add constraint fk_roles_updated_by
     foreign key (updated_by) references public.users(id) on delete set null');
select public.rc_add_fk('fk_roles_deleted_by',
  'alter table public.roles add constraint fk_roles_deleted_by
     foreign key (deleted_by) references public.users(id) on delete set null');

select public.rc_add_fk('fk_role_permissions_created_by',
  'alter table public.role_permissions add constraint fk_role_permissions_created_by
     foreign key (created_by) references public.users(id) on delete set null');

select public.rc_add_fk('fk_user_roles_created_by',
  'alter table public.user_roles add constraint fk_user_roles_created_by
     foreign key (created_by) references public.users(id) on delete set null');
select public.rc_add_fk('fk_user_roles_updated_by',
  'alter table public.user_roles add constraint fk_user_roles_updated_by
     foreign key (updated_by) references public.users(id) on delete set null');
select public.rc_add_fk('fk_user_roles_deleted_by',
  'alter table public.user_roles add constraint fk_user_roles_deleted_by
     foreign key (deleted_by) references public.users(id) on delete set null');

-- ============================================================================
-- INDEXES (unique + performance; partial to skip soft-deleted rows)
-- ============================================================================

-- organizations
create unique index if not exists uq_organizations_slug
  on public.organizations (slug) where deleted_at is null;
create unique index if not exists uq_organizations_gstin
  on public.organizations (gstin) where gstin is not null and deleted_at is null;

-- branches
create unique index if not exists uq_branches_org_code
  on public.branches (organization_id, branch_code) where deleted_at is null;
create index if not exists idx_branches_org_status
  on public.branches (organization_id, status) where deleted_at is null;
create index if not exists idx_branches_manager
  on public.branches (branch_manager_employee_id);
create index if not exists idx_branches_parent
  on public.branches (parent_branch_id);

-- employees
create unique index if not exists uq_employees_org_code
  on public.employees (organization_id, employee_code) where deleted_at is null;
create unique index if not exists uq_employees_user
  on public.employees (user_id) where user_id is not null;
create index if not exists idx_employees_org_status
  on public.employees (organization_id, status) where deleted_at is null;
create index if not exists idx_employees_branch
  on public.employees (branch_id);
create index if not exists idx_employees_manager
  on public.employees (reporting_manager_id);

-- users
create unique index if not exists uq_users_auth_user
  on public.users (auth_user_id) where auth_user_id is not null;
create unique index if not exists uq_users_org_email
  on public.users (organization_id, email) where deleted_at is null;
create unique index if not exists uq_users_employee
  on public.users (employee_id) where employee_id is not null;
create index if not exists idx_users_org_active
  on public.users (organization_id, is_active) where deleted_at is null;
create index if not exists idx_users_primary_branch
  on public.users (primary_branch_id);

-- roles
create unique index if not exists uq_roles_org_code
  on public.roles (organization_id, code) where organization_id is not null and deleted_at is null;
create unique index if not exists uq_roles_system_code
  on public.roles (code) where organization_id is null and is_system;
create index if not exists idx_roles_is_system
  on public.roles (is_system);

-- permissions
create unique index if not exists uq_permissions_code
  on public.permissions (code);
create index if not exists idx_permissions_resource
  on public.permissions (resource);

-- role_permissions
create unique index if not exists uq_role_permissions_role_perm
  on public.role_permissions (role_id, permission_id);
create index if not exists idx_role_permissions_permission
  on public.role_permissions (permission_id);

-- user_roles
create unique index if not exists uq_user_roles_user_role
  on public.user_roles (user_id, role_id) where deleted_at is null;
create index if not exists idx_user_roles_role
  on public.user_roles (role_id);
create index if not exists idx_user_roles_org_user
  on public.user_roles (organization_id, user_id);

-- ============================================================================
-- TRIGGERS (updated_at + version)
-- ============================================================================
drop trigger if exists trg_organizations_set_updated_at on public.organizations;
create trigger trg_organizations_set_updated_at before update on public.organizations
  for each row execute function public.rc_set_updated_at_versioned();

drop trigger if exists trg_branches_set_updated_at on public.branches;
create trigger trg_branches_set_updated_at before update on public.branches
  for each row execute function public.rc_set_updated_at_versioned();

drop trigger if exists trg_employees_set_updated_at on public.employees;
create trigger trg_employees_set_updated_at before update on public.employees
  for each row execute function public.rc_set_updated_at_versioned();

drop trigger if exists trg_users_set_updated_at on public.users;
create trigger trg_users_set_updated_at before update on public.users
  for each row execute function public.rc_set_updated_at_versioned();

drop trigger if exists trg_roles_set_updated_at on public.roles;
create trigger trg_roles_set_updated_at before update on public.roles
  for each row execute function public.rc_set_updated_at_versioned();

drop trigger if exists trg_user_roles_set_updated_at on public.user_roles;
create trigger trg_user_roles_set_updated_at before update on public.user_roles
  for each row execute function public.rc_set_updated_at_versioned();

-- permissions has updated_at but no version column
drop trigger if exists trg_permissions_set_updated_at on public.permissions;
create trigger trg_permissions_set_updated_at before update on public.permissions
  for each row execute function public.rc_set_updated_at();

-- ----------------------------------------------------------------------------
-- Clean up the one-shot FK helper.
-- ----------------------------------------------------------------------------
drop function if exists public.rc_add_fk(text, text);
