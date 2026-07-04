-- ============================================================================
-- RCLIP — Opportunity Lifecycle Engine (ADR-008) — ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
-- Reuses Phase 1 helpers rc_current_org_id() / rc_has_permission(), wrapped as
-- (select fn()). SELECT excludes soft-deleted rows. Permission model:
--   • Config catalogs  : read = opportunity.read (+ global system rows) ·
--                        write own-org non-system = opportunity.config
--   • Master + txn      : read = opportunity.read · write = opportunity.manage
--   • Append-only       : select + insert only (stage_history, timeline,
--                         track_events, information_sheets)
--   • Approvals         : select read · insert manage · update approve
-- Hard DELETE denied to app users (soft delete only); service_role bypasses.
-- Idempotent: DROP POLICY IF EXISTS before each CREATE.
-- ============================================================================

alter table public.opportunity_types                    enable row level security;
alter table public.opportunity_type_stages              enable row level security;
alter table public.opportunity_objectives               enable row level security;
alter table public.opportunity_priorities               enable row level security;
alter table public.opportunity_engagement_types         enable row level security;
alter table public.opportunity_readiness_dimensions     enable row level security;
alter table public.opportunities                         enable row level security;
alter table public.opportunity_products                  enable row level security;
alter table public.opportunity_participants              enable row level security;
alter table public.opportunity_team                      enable row level security;
alter table public.opportunity_stage_history             enable row level security;
alter table public.opportunity_approvals                 enable row level security;
alter table public.opportunity_readiness                 enable row level security;
alter table public.opportunity_documents                 enable row level security;
alter table public.opportunity_tasks                     enable row level security;
alter table public.opportunity_notes                     enable row level security;
alter table public.opportunity_institution_tracks        enable row level security;
alter table public.opportunity_institution_track_events  enable row level security;
alter table public.opportunity_communications            enable row level security;
alter table public.opportunity_timeline                  enable row level security;
alter table public.opportunity_information_sheets        enable row level security;
alter table public.opportunity_financial_summary         enable row level security;

-- ============================================================================
-- CONFIG CATALOGS (own-org rows + read-only global system rows)
-- read = opportunity.read · write own-org non-system = opportunity.config
-- ============================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'opportunity_types','opportunity_type_stages','opportunity_objectives',
    'opportunity_priorities','opportunity_engagement_types','opportunity_readiness_dimensions'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t||'_select', t);
    execute format($f$create policy %I on public.%I
      for select to authenticated
      using ((organization_id = (select public.rc_current_org_id()) or organization_id is null)
             and deleted_at is null
             and (select public.rc_has_permission('opportunity.read')))$f$, t||'_select', t);

    execute format('drop policy if exists %I on public.%I', t||'_insert', t);
    execute format($f$create policy %I on public.%I
      for insert to authenticated
      with check (organization_id = (select public.rc_current_org_id())
                  and is_system = false
                  and (select public.rc_has_permission('opportunity.config')))$f$, t||'_insert', t);

    execute format('drop policy if exists %I on public.%I', t||'_update', t);
    execute format($f$create policy %I on public.%I
      for update to authenticated
      using (organization_id = (select public.rc_current_org_id())
             and is_system = false
             and (select public.rc_has_permission('opportunity.config')))
      with check (organization_id = (select public.rc_current_org_id()) and is_system = false)$f$, t||'_update', t);
  end loop;
end
$$;

-- ============================================================================
-- MASTER + TRANSACTION TABLES (read = opportunity.read · write = opportunity.manage)
-- ============================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'opportunities','opportunity_products','opportunity_participants','opportunity_team',
    'opportunity_readiness','opportunity_documents','opportunity_tasks','opportunity_notes',
    'opportunity_institution_tracks','opportunity_communications'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t||'_select', t);
    execute format($f$create policy %I on public.%I
      for select to authenticated
      using (organization_id = (select public.rc_current_org_id()) and deleted_at is null
             and (select public.rc_has_permission('opportunity.read')))$f$, t||'_select', t);

    execute format('drop policy if exists %I on public.%I', t||'_insert', t);
    execute format($f$create policy %I on public.%I
      for insert to authenticated
      with check (organization_id = (select public.rc_current_org_id())
                  and (select public.rc_has_permission('opportunity.manage')))$f$, t||'_insert', t);

    execute format('drop policy if exists %I on public.%I', t||'_update', t);
    execute format($f$create policy %I on public.%I
      for update to authenticated
      using (organization_id = (select public.rc_current_org_id())
             and (select public.rc_has_permission('opportunity.manage')))
      with check (organization_id = (select public.rc_current_org_id()))$f$, t||'_update', t);
  end loop;
end
$$;

-- opportunity_financial_summary (Revenue read model; no deleted_at column).
-- read = opportunity.read · write = opportunity.manage (service_role bypasses).
drop policy if exists opportunity_financial_summary_select on public.opportunity_financial_summary;
create policy opportunity_financial_summary_select on public.opportunity_financial_summary
  for select to authenticated
  using (organization_id = (select public.rc_current_org_id())
         and (select public.rc_has_permission('opportunity.read')));

drop policy if exists opportunity_financial_summary_insert on public.opportunity_financial_summary;
create policy opportunity_financial_summary_insert on public.opportunity_financial_summary
  for insert to authenticated
  with check (organization_id = (select public.rc_current_org_id())
              and (select public.rc_has_permission('opportunity.manage')));

drop policy if exists opportunity_financial_summary_update on public.opportunity_financial_summary;
create policy opportunity_financial_summary_update on public.opportunity_financial_summary
  for update to authenticated
  using (organization_id = (select public.rc_current_org_id())
         and (select public.rc_has_permission('opportunity.manage')))
  with check (organization_id = (select public.rc_current_org_id()));

-- ============================================================================
-- APPEND-ONLY TABLES (select = opportunity.read · insert = opportunity.manage)
-- No update / delete for app users. (stage_history, track_events, timeline,
-- information_sheets)
-- ============================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'opportunity_stage_history','opportunity_institution_track_events',
    'opportunity_timeline','opportunity_information_sheets'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t||'_select', t);
    execute format($f$create policy %I on public.%I
      for select to authenticated
      using (organization_id = (select public.rc_current_org_id())
             and (select public.rc_has_permission('opportunity.read')))$f$, t||'_select', t);

    execute format('drop policy if exists %I on public.%I', t||'_insert', t);
    execute format($f$create policy %I on public.%I
      for insert to authenticated
      with check (organization_id = (select public.rc_current_org_id())
                  and (select public.rc_has_permission('opportunity.manage')))$f$, t||'_insert', t);
  end loop;
end
$$;

-- ============================================================================
-- APPROVALS (select = read · insert = manage · update = approve)
-- ============================================================================
drop policy if exists opportunity_approvals_select on public.opportunity_approvals;
create policy opportunity_approvals_select on public.opportunity_approvals
  for select to authenticated
  using (organization_id = (select public.rc_current_org_id()) and deleted_at is null
         and (select public.rc_has_permission('opportunity.read')));

drop policy if exists opportunity_approvals_insert on public.opportunity_approvals;
create policy opportunity_approvals_insert on public.opportunity_approvals
  for insert to authenticated
  with check (organization_id = (select public.rc_current_org_id())
              and (select public.rc_has_permission('opportunity.manage')));

drop policy if exists opportunity_approvals_update on public.opportunity_approvals;
create policy opportunity_approvals_update on public.opportunity_approvals
  for update to authenticated
  using (organization_id = (select public.rc_current_org_id())
         and (select public.rc_has_permission('opportunity.approve')))
  with check (organization_id = (select public.rc_current_org_id()));
