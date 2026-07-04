-- ============================================================================
-- RCLIP — Sprint 4 · Enterprise Master Data Platform (MDM) — ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
-- Reuses Phase 1 helpers rc_current_org_id() and rc_has_permission() (SECURITY
-- DEFINER), wrapped as (select fn()) for init-plan caching. SELECT policies
-- exclude soft-deleted rows. Writes are permission-gated. Reference catalogs
-- also expose global system rows (organization_id NULL) read-only.
-- Hard DELETE is denied to app users (soft delete only); service_role bypasses.
-- Idempotent: DROP POLICY IF EXISTS before each CREATE.
-- ============================================================================

alter table public.entity_types                enable row level security;
alter table public.business_roles              enable row level security;
alter table public.acquisition_channels        enable row level security;
alter table public.team_roles                  enable row level security;
alter table public.entities                    enable row level security;
alter table public.business_role_assignments   enable row level security;
alter table public.relationship_profiles       enable row level security;
alter table public.coverage_team               enable row level security;
alter table public.relationship_intelligence   enable row level security;

-- ============================================================================
-- REFERENCE CATALOGS (own-org rows + read-only global system rows)
-- read = relationship.read · write own-org non-system = mdm.config
-- ============================================================================

-- entity_types
drop policy if exists entity_types_select on public.entity_types;
create policy entity_types_select on public.entity_types
  for select to authenticated
  using ((organization_id = (select public.rc_current_org_id()) or organization_id is null)
         and deleted_at is null
         and (select public.rc_has_permission('relationship.read')));
drop policy if exists entity_types_insert on public.entity_types;
create policy entity_types_insert on public.entity_types
  for insert to authenticated
  with check (organization_id = (select public.rc_current_org_id())
              and is_system = false
              and (select public.rc_has_permission('mdm.config')));
drop policy if exists entity_types_update on public.entity_types;
create policy entity_types_update on public.entity_types
  for update to authenticated
  using (organization_id = (select public.rc_current_org_id())
         and is_system = false
         and (select public.rc_has_permission('mdm.config')))
  with check (organization_id = (select public.rc_current_org_id()) and is_system = false);

-- business_roles
drop policy if exists business_roles_select on public.business_roles;
create policy business_roles_select on public.business_roles
  for select to authenticated
  using ((organization_id = (select public.rc_current_org_id()) or organization_id is null)
         and deleted_at is null
         and (select public.rc_has_permission('relationship.read')));
drop policy if exists business_roles_insert on public.business_roles;
create policy business_roles_insert on public.business_roles
  for insert to authenticated
  with check (organization_id = (select public.rc_current_org_id())
              and is_system = false
              and (select public.rc_has_permission('mdm.config')));
drop policy if exists business_roles_update on public.business_roles;
create policy business_roles_update on public.business_roles
  for update to authenticated
  using (organization_id = (select public.rc_current_org_id())
         and is_system = false
         and (select public.rc_has_permission('mdm.config')))
  with check (organization_id = (select public.rc_current_org_id()) and is_system = false);

-- acquisition_channels
drop policy if exists acquisition_channels_select on public.acquisition_channels;
create policy acquisition_channels_select on public.acquisition_channels
  for select to authenticated
  using ((organization_id = (select public.rc_current_org_id()) or organization_id is null)
         and deleted_at is null
         and (select public.rc_has_permission('relationship.read')));
drop policy if exists acquisition_channels_insert on public.acquisition_channels;
create policy acquisition_channels_insert on public.acquisition_channels
  for insert to authenticated
  with check (organization_id = (select public.rc_current_org_id())
              and is_system = false
              and (select public.rc_has_permission('mdm.config')));
drop policy if exists acquisition_channels_update on public.acquisition_channels;
create policy acquisition_channels_update on public.acquisition_channels
  for update to authenticated
  using (organization_id = (select public.rc_current_org_id())
         and is_system = false
         and (select public.rc_has_permission('mdm.config')))
  with check (organization_id = (select public.rc_current_org_id()) and is_system = false);

-- team_roles
drop policy if exists team_roles_select on public.team_roles;
create policy team_roles_select on public.team_roles
  for select to authenticated
  using ((organization_id = (select public.rc_current_org_id()) or organization_id is null)
         and deleted_at is null
         and (select public.rc_has_permission('relationship.read')));
drop policy if exists team_roles_insert on public.team_roles;
create policy team_roles_insert on public.team_roles
  for insert to authenticated
  with check (organization_id = (select public.rc_current_org_id())
              and is_system = false
              and (select public.rc_has_permission('mdm.config')));
drop policy if exists team_roles_update on public.team_roles;
create policy team_roles_update on public.team_roles
  for update to authenticated
  using (organization_id = (select public.rc_current_org_id())
         and is_system = false
         and (select public.rc_has_permission('mdm.config')))
  with check (organization_id = (select public.rc_current_org_id()) and is_system = false);

-- ============================================================================
-- ENTITY MASTER  (read = entity.read · write = entity.manage)
-- ============================================================================
drop policy if exists entities_select on public.entities;
create policy entities_select on public.entities
  for select to authenticated
  using (organization_id = (select public.rc_current_org_id())
         and deleted_at is null
         and (select public.rc_has_permission('entity.read')));
drop policy if exists entities_insert on public.entities;
create policy entities_insert on public.entities
  for insert to authenticated
  with check (organization_id = (select public.rc_current_org_id())
              and (select public.rc_has_permission('entity.manage')));
drop policy if exists entities_update on public.entities;
create policy entities_update on public.entities
  for update to authenticated
  using (organization_id = (select public.rc_current_org_id())
         and (select public.rc_has_permission('entity.manage')))
  with check (organization_id = (select public.rc_current_org_id()));

-- ============================================================================
-- SHARED RELATIONSHIP LAYER  (read = relationship.read · write = relationship.manage)
-- ============================================================================

-- business_role_assignments
drop policy if exists bra_select on public.business_role_assignments;
create policy bra_select on public.business_role_assignments
  for select to authenticated
  using (organization_id = (select public.rc_current_org_id()) and deleted_at is null
         and (select public.rc_has_permission('relationship.read')));
drop policy if exists bra_insert on public.business_role_assignments;
create policy bra_insert on public.business_role_assignments
  for insert to authenticated
  with check (organization_id = (select public.rc_current_org_id())
              and (select public.rc_has_permission('relationship.manage')));
drop policy if exists bra_update on public.business_role_assignments;
create policy bra_update on public.business_role_assignments
  for update to authenticated
  using (organization_id = (select public.rc_current_org_id())
         and (select public.rc_has_permission('relationship.manage')))
  with check (organization_id = (select public.rc_current_org_id()));

-- relationship_profiles
drop policy if exists rp_select on public.relationship_profiles;
create policy rp_select on public.relationship_profiles
  for select to authenticated
  using (organization_id = (select public.rc_current_org_id()) and deleted_at is null
         and (select public.rc_has_permission('relationship.read')));
drop policy if exists rp_insert on public.relationship_profiles;
create policy rp_insert on public.relationship_profiles
  for insert to authenticated
  with check (organization_id = (select public.rc_current_org_id())
              and (select public.rc_has_permission('relationship.manage')));
drop policy if exists rp_update on public.relationship_profiles;
create policy rp_update on public.relationship_profiles
  for update to authenticated
  using (organization_id = (select public.rc_current_org_id())
         and (select public.rc_has_permission('relationship.manage')))
  with check (organization_id = (select public.rc_current_org_id()));

-- coverage_team
drop policy if exists ct_select on public.coverage_team;
create policy ct_select on public.coverage_team
  for select to authenticated
  using (organization_id = (select public.rc_current_org_id()) and deleted_at is null
         and (select public.rc_has_permission('relationship.read')));
drop policy if exists ct_insert on public.coverage_team;
create policy ct_insert on public.coverage_team
  for insert to authenticated
  with check (organization_id = (select public.rc_current_org_id())
              and (select public.rc_has_permission('relationship.manage')));
drop policy if exists ct_update on public.coverage_team;
create policy ct_update on public.coverage_team
  for update to authenticated
  using (organization_id = (select public.rc_current_org_id())
         and (select public.rc_has_permission('relationship.manage')))
  with check (organization_id = (select public.rc_current_org_id()));

-- relationship_intelligence
drop policy if exists ri_select on public.relationship_intelligence;
create policy ri_select on public.relationship_intelligence
  for select to authenticated
  using (organization_id = (select public.rc_current_org_id()) and deleted_at is null
         and (select public.rc_has_permission('relationship.read')));
drop policy if exists ri_insert on public.relationship_intelligence;
create policy ri_insert on public.relationship_intelligence
  for insert to authenticated
  with check (organization_id = (select public.rc_current_org_id())
              and (select public.rc_has_permission('relationship.manage')));
drop policy if exists ri_update on public.relationship_intelligence;
create policy ri_update on public.relationship_intelligence
  for update to authenticated
  using (organization_id = (select public.rc_current_org_id())
         and (select public.rc_has_permission('relationship.manage')))
  with check (organization_id = (select public.rc_current_org_id()));
