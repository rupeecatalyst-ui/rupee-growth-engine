-- ============================================================================
-- RCLIP — Phase 2A · Relationship Engine — ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
-- Reuses Phase 1 helpers rc_current_org_id() and rc_has_permission() (SECURITY
-- DEFINER). All calls wrapped as (SELECT fn()) for planner init-plan caching.
-- SELECT policies exclude soft-deleted rows. Writes are permission-gated.
-- Identity documents (PII) require the dedicated contact.pii.read permission.
-- Hard DELETE is denied to app users (soft delete only); service_role bypasses.
-- Idempotent: DROP POLICY IF EXISTS before each CREATE.
-- ============================================================================

alter table public.contacts                          enable row level security;
alter table public.contact_roles                     enable row level security;
alter table public.contact_affiliations              enable row level security;
alter table public.contact_relationships             enable row level security;
alter table public.contact_addresses                 enable row level security;
alter table public.contact_identity_documents        enable row level security;
alter table public.contact_phone_numbers             enable row level security;
alter table public.contact_emails                    enable row level security;
alter table public.contact_tags                      enable row level security;
alter table public.contact_tag_mapping               enable row level security;
alter table public.contact_communication_preferences enable row level security;
alter table public.contact_merge_log                 enable row level security;

-- ============================================================================
-- contacts
-- ============================================================================
drop policy if exists contacts_select on public.contacts;
create policy contacts_select on public.contacts
  for select to authenticated
  using (organization_id = (select public.rc_current_org_id())
         and deleted_at is null
         and (select public.rc_has_permission('contact.read')));

drop policy if exists contacts_insert on public.contacts;
create policy contacts_insert on public.contacts
  for insert to authenticated
  with check (organization_id = (select public.rc_current_org_id())
              and (select public.rc_has_permission('contact.manage')));

drop policy if exists contacts_update on public.contacts;
create policy contacts_update on public.contacts
  for update to authenticated
  using (organization_id = (select public.rc_current_org_id())
         and (select public.rc_has_permission('contact.manage')))
  with check (organization_id = (select public.rc_current_org_id()));

-- ----------------------------------------------------------------------------
-- Standard child tables (read = contact.read, write = contact.manage)
-- ----------------------------------------------------------------------------

-- contact_roles
drop policy if exists contact_roles_select on public.contact_roles;
create policy contact_roles_select on public.contact_roles
  for select to authenticated
  using (organization_id = (select public.rc_current_org_id()) and deleted_at is null
         and (select public.rc_has_permission('contact.read')));
drop policy if exists contact_roles_insert on public.contact_roles;
create policy contact_roles_insert on public.contact_roles
  for insert to authenticated
  with check (organization_id = (select public.rc_current_org_id())
              and (select public.rc_has_permission('contact.manage')));
drop policy if exists contact_roles_update on public.contact_roles;
create policy contact_roles_update on public.contact_roles
  for update to authenticated
  using (organization_id = (select public.rc_current_org_id())
         and (select public.rc_has_permission('contact.manage')))
  with check (organization_id = (select public.rc_current_org_id()));

-- contact_affiliations
drop policy if exists contact_affiliations_select on public.contact_affiliations;
create policy contact_affiliations_select on public.contact_affiliations
  for select to authenticated
  using (organization_id = (select public.rc_current_org_id()) and deleted_at is null
         and (select public.rc_has_permission('contact.read')));
drop policy if exists contact_affiliations_insert on public.contact_affiliations;
create policy contact_affiliations_insert on public.contact_affiliations
  for insert to authenticated
  with check (organization_id = (select public.rc_current_org_id())
              and (select public.rc_has_permission('contact.manage')));
drop policy if exists contact_affiliations_update on public.contact_affiliations;
create policy contact_affiliations_update on public.contact_affiliations
  for update to authenticated
  using (organization_id = (select public.rc_current_org_id())
         and (select public.rc_has_permission('contact.manage')))
  with check (organization_id = (select public.rc_current_org_id()));

-- contact_relationships
drop policy if exists contact_relationships_select on public.contact_relationships;
create policy contact_relationships_select on public.contact_relationships
  for select to authenticated
  using (organization_id = (select public.rc_current_org_id()) and deleted_at is null
         and (select public.rc_has_permission('contact.read')));
drop policy if exists contact_relationships_insert on public.contact_relationships;
create policy contact_relationships_insert on public.contact_relationships
  for insert to authenticated
  with check (organization_id = (select public.rc_current_org_id())
              and (select public.rc_has_permission('contact.manage')));
drop policy if exists contact_relationships_update on public.contact_relationships;
create policy contact_relationships_update on public.contact_relationships
  for update to authenticated
  using (organization_id = (select public.rc_current_org_id())
         and (select public.rc_has_permission('contact.manage')))
  with check (organization_id = (select public.rc_current_org_id()));

-- contact_addresses
drop policy if exists contact_addresses_select on public.contact_addresses;
create policy contact_addresses_select on public.contact_addresses
  for select to authenticated
  using (organization_id = (select public.rc_current_org_id()) and deleted_at is null
         and (select public.rc_has_permission('contact.read')));
drop policy if exists contact_addresses_insert on public.contact_addresses;
create policy contact_addresses_insert on public.contact_addresses
  for insert to authenticated
  with check (organization_id = (select public.rc_current_org_id())
              and (select public.rc_has_permission('contact.manage')));
drop policy if exists contact_addresses_update on public.contact_addresses;
create policy contact_addresses_update on public.contact_addresses
  for update to authenticated
  using (organization_id = (select public.rc_current_org_id())
         and (select public.rc_has_permission('contact.manage')))
  with check (organization_id = (select public.rc_current_org_id()));

-- contact_identity_documents (PII — read requires contact.pii.read)
drop policy if exists contact_iddocs_select on public.contact_identity_documents;
create policy contact_iddocs_select on public.contact_identity_documents
  for select to authenticated
  using (organization_id = (select public.rc_current_org_id()) and deleted_at is null
         and (select public.rc_has_permission('contact.pii.read')));
drop policy if exists contact_iddocs_insert on public.contact_identity_documents;
create policy contact_iddocs_insert on public.contact_identity_documents
  for insert to authenticated
  with check (organization_id = (select public.rc_current_org_id())
              and (select public.rc_has_permission('contact.manage')));
drop policy if exists contact_iddocs_update on public.contact_identity_documents;
create policy contact_iddocs_update on public.contact_identity_documents
  for update to authenticated
  using (organization_id = (select public.rc_current_org_id())
         and (select public.rc_has_permission('contact.manage')))
  with check (organization_id = (select public.rc_current_org_id()));

-- contact_phone_numbers
drop policy if exists contact_phones_select on public.contact_phone_numbers;
create policy contact_phones_select on public.contact_phone_numbers
  for select to authenticated
  using (organization_id = (select public.rc_current_org_id()) and deleted_at is null
         and (select public.rc_has_permission('contact.read')));
drop policy if exists contact_phones_insert on public.contact_phone_numbers;
create policy contact_phones_insert on public.contact_phone_numbers
  for insert to authenticated
  with check (organization_id = (select public.rc_current_org_id())
              and (select public.rc_has_permission('contact.manage')));
drop policy if exists contact_phones_update on public.contact_phone_numbers;
create policy contact_phones_update on public.contact_phone_numbers
  for update to authenticated
  using (organization_id = (select public.rc_current_org_id())
         and (select public.rc_has_permission('contact.manage')))
  with check (organization_id = (select public.rc_current_org_id()));

-- contact_emails
drop policy if exists contact_emails_select on public.contact_emails;
create policy contact_emails_select on public.contact_emails
  for select to authenticated
  using (organization_id = (select public.rc_current_org_id()) and deleted_at is null
         and (select public.rc_has_permission('contact.read')));
drop policy if exists contact_emails_insert on public.contact_emails;
create policy contact_emails_insert on public.contact_emails
  for insert to authenticated
  with check (organization_id = (select public.rc_current_org_id())
              and (select public.rc_has_permission('contact.manage')));
drop policy if exists contact_emails_update on public.contact_emails;
create policy contact_emails_update on public.contact_emails
  for update to authenticated
  using (organization_id = (select public.rc_current_org_id())
         and (select public.rc_has_permission('contact.manage')))
  with check (organization_id = (select public.rc_current_org_id()));

-- contact_tags (own-org tags + read-only global system tags)
drop policy if exists contact_tags_select on public.contact_tags;
create policy contact_tags_select on public.contact_tags
  for select to authenticated
  using ((organization_id = (select public.rc_current_org_id()) or organization_id is null)
         and deleted_at is null
         and (select public.rc_has_permission('contact.read')));
drop policy if exists contact_tags_insert on public.contact_tags;
create policy contact_tags_insert on public.contact_tags
  for insert to authenticated
  with check (organization_id = (select public.rc_current_org_id())
              and is_system = false
              and (select public.rc_has_permission('contact.manage')));
drop policy if exists contact_tags_update on public.contact_tags;
create policy contact_tags_update on public.contact_tags
  for update to authenticated
  using (organization_id = (select public.rc_current_org_id())
         and is_system = false
         and (select public.rc_has_permission('contact.manage')))
  with check (organization_id = (select public.rc_current_org_id()) and is_system = false);

-- contact_tag_mapping
drop policy if exists contact_tag_mapping_select on public.contact_tag_mapping;
create policy contact_tag_mapping_select on public.contact_tag_mapping
  for select to authenticated
  using (organization_id = (select public.rc_current_org_id()) and deleted_at is null
         and (select public.rc_has_permission('contact.read')));
drop policy if exists contact_tag_mapping_insert on public.contact_tag_mapping;
create policy contact_tag_mapping_insert on public.contact_tag_mapping
  for insert to authenticated
  with check (organization_id = (select public.rc_current_org_id())
              and (select public.rc_has_permission('contact.manage')));
drop policy if exists contact_tag_mapping_update on public.contact_tag_mapping;
create policy contact_tag_mapping_update on public.contact_tag_mapping
  for update to authenticated
  using (organization_id = (select public.rc_current_org_id())
         and (select public.rc_has_permission('contact.manage')))
  with check (organization_id = (select public.rc_current_org_id()));
drop policy if exists contact_tag_mapping_delete on public.contact_tag_mapping;
create policy contact_tag_mapping_delete on public.contact_tag_mapping
  for delete to authenticated
  using (organization_id = (select public.rc_current_org_id())
         and (select public.rc_has_permission('contact.manage')));

-- contact_communication_preferences
drop policy if exists contact_comm_prefs_select on public.contact_communication_preferences;
create policy contact_comm_prefs_select on public.contact_communication_preferences
  for select to authenticated
  using (organization_id = (select public.rc_current_org_id()) and deleted_at is null
         and (select public.rc_has_permission('contact.read')));
drop policy if exists contact_comm_prefs_insert on public.contact_communication_preferences;
create policy contact_comm_prefs_insert on public.contact_communication_preferences
  for insert to authenticated
  with check (organization_id = (select public.rc_current_org_id())
              and (select public.rc_has_permission('contact.manage')));
drop policy if exists contact_comm_prefs_update on public.contact_communication_preferences;
create policy contact_comm_prefs_update on public.contact_communication_preferences
  for update to authenticated
  using (organization_id = (select public.rc_current_org_id())
         and (select public.rc_has_permission('contact.manage')))
  with check (organization_id = (select public.rc_current_org_id()));

-- contact_merge_log (append-only: select + insert only)
drop policy if exists contact_merge_log_select on public.contact_merge_log;
create policy contact_merge_log_select on public.contact_merge_log
  for select to authenticated
  using (organization_id = (select public.rc_current_org_id())
         and (select public.rc_has_permission('contact.read')));
drop policy if exists contact_merge_log_insert on public.contact_merge_log;
create policy contact_merge_log_insert on public.contact_merge_log
  for insert to authenticated
  with check (organization_id = (select public.rc_current_org_id())
              and (select public.rc_has_permission('contact.merge')));
