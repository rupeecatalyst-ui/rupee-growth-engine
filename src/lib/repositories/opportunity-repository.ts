// RCLIP — Opportunity Repository (Sprint 4.2, READ-ONLY).
// ----------------------------------------------------------------------------
// The ONLY module that talks to Supabase for the Opportunity Workspace.
// Components never import the Supabase client — they consume the typed domain
// objects returned here (via hooks). No CRUD, no editing, no workflow — reads
// only. Shapes intentionally mirror `src/components/opportunity/types.ts` so
// the frozen UI binds with zero redesign.
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type {
  Communication,
  DocumentItem,
  HealthStatus,
  InformationSheet,
  InstitutionTrack,
  OpportunityProduct,
  OpportunityStatus,
  PartyKind,
  PriorityCode,
  ReadinessDimension,
  StageHistoryEntry,
  StageStep,
  TaskItem,
  TimelineEvent,
  TrackStatus,
} from "@/components/opportunity/types";

// The generated `Database` type is an intentional empty placeholder until real
// types are generated (`npm run db:types`). We access tables through an untyped
// client here and map results into strict domain types below, so consumers stay
// fully typed while the schema types catch up.
const db = supabase as unknown as SupabaseClient;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* -------------------------------------------------------------------------- */
/* Domain return types (repository contract)                                  */
/* -------------------------------------------------------------------------- */

export interface OpportunityClientSummary {
  kind: PartyKind;
  name: string;
  classification?: string;
  strength?: string;
  industry?: string;
  city?: string;
  totalBusinessValue?: number;
  lastInteraction?: string;
}

export interface OpportunityCore {
  id: string;
  code: string;
  title: string;
  typeName: string;
  status: OpportunityStatus;
  health: HealthStatus;
  healthScore: number;
  priority: PriorityCode;
  engagementModel: string;
  objective: string;
  acquisitionChannel: string;
  introducedBy?: string;
  confidentiality: "standard" | "restricted";
  tags: string[];
  overallReadiness: number;
  expectedCloseDate?: string;
  client: OpportunityClientSummary;
  stages: StageStep[];
}

export interface ReadinessResult {
  dimensions: ReadinessDimension[];
  overall: number;
}

/* -------------------------------------------------------------------------- */
/* Wizard (write path) — catalog options, party search, create input          */
/* -------------------------------------------------------------------------- */

export interface CatalogOption {
  id: string;
  code?: string;
  name: string;
}

export interface ProductOption {
  id: string;
  name: string;
  type: string;
}

export interface PartyOption {
  id: string;
  kind: PartyKind;
  name: string;
  sublabel?: string;
}

export interface CreateOpportunityInput {
  title: string;
  opportunityTypeId: string;
  client: { kind: PartyKind; id: string };
  products: {
    productId: string;
    requestedAmount?: number;
    tenureMonths?: number;
    isPrimary: boolean;
  }[];
  institutions: { entityId: string; productId?: string }[];
  priorityId?: string;
  expectedCloseDate?: string;
  engagementTypeId?: string;
  objectiveId?: string;
  team: { memberContactId: string; teamRoleId: string; isPrimary: boolean }[];
}

export interface CreatedOpportunity {
  id: string;
  code: string;
}

/* -------------------------------------------------------------------------- */
/* Raw row shapes (only the columns we select)                                */
/* -------------------------------------------------------------------------- */

interface CatalogName {
  name?: string | null;
}
interface PriorityRow {
  code?: string | null;
  name?: string | null;
}
interface ContactRow {
  id?: string | null;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  company_name?: string | null;
  contact_type?: string | null;
}
interface EntityRow {
  display_name?: string | null;
  legal_name?: string | null;
  trade_name?: string | null;
  industry?: string | null;
}
interface StageRow {
  sequence?: number | null;
}

interface OpportunityRow {
  id: string;
  opportunity_code: string | null;
  title: string;
  status: string;
  health_status: string;
  health_score: number | null;
  overall_readiness: number | null;
  expected_close_date: string | null;
  metadata: Record<string, unknown> | null;
  opportunity_type_id: string;
  current_stage_id: string | null;
  primary_client_contact_id: string | null;
  primary_client_entity_id: string | null;
  opportunity_types?: CatalogName | null;
  opportunity_objectives?: CatalogName | null;
  opportunity_priorities?: PriorityRow | null;
  opportunity_engagement_types?: CatalogName | null;
  acquisition_channels?: CatalogName | null;
  primary_client_contact?: ContactRow | null;
  primary_client_entity?: EntityRow | null;
  introduced_contact?: ContactRow | null;
  introduced_entity?: EntityRow | null;
  current_stage?: StageRow | null;
}

interface TypeStageRow {
  stage_code: string;
  name: string;
  sequence: number | null;
}

interface RelationshipProfileRow {
  relationship_classification?: string | null;
  relationship_strength?: string | null;
}

interface RelationshipIntelligenceRow {
  total_business_value?: number | null;
  last_meeting_date?: string | null;
  last_communication_date?: string | null;
  last_deal_date?: string | null;
}

interface ProductRow {
  id: string;
  requested_amount: number | null;
  tenure_months: number | null;
  is_primary: boolean | null;
  sub_status: string | null;
  products?: { name?: string | null; product_type?: string | null } | null;
}

interface TrackRow {
  id: string;
  track_status: string;
  smart_match_score: number | null;
  is_selected: boolean | null;
  sanctioned_amount: number | null;
  roi: number | null;
  institution?: EntityRow | null;
  product?: { name?: string | null } | null;
}

interface ReadinessRow {
  score: number | null;
  opportunity_readiness_dimensions?: {
    code?: string | null;
    name?: string | null;
    pass_threshold?: number | null;
    is_gating?: boolean | null;
    weight?: number | null;
  } | null;
}

interface TaskRow {
  id: string;
  title: string;
  origin: string | null;
  status: string | null;
  due_date: string | null;
  assignee?: ContactRow | null;
  readiness_dimension?: { name?: string | null } | null;
  institution_track?: { institution?: EntityRow | null } | null;
}

interface TimelineRow {
  id: string;
  event_type: string;
  source: string;
  occurred_at: string;
  payload: Record<string, unknown> | null;
  actor?: ContactRow | null;
}

interface DocumentRow {
  id: string;
  document_name: string;
  status: string | null;
  metadata: Record<string, unknown> | null;
  requirement?: { category?: string | null; is_mandatory?: boolean | null } | null;
}

interface StageHistoryRow {
  id: string;
  reason: string | null;
  changed_at: string;
  from_stage?: { name?: string | null } | null;
  to_stage?: { name?: string | null } | null;
}

interface InformationSheetRow {
  sheet_version: number | null;
  status: string | null;
  is_current: boolean | null;
  generated_at: string;
  html_body: string | null;
}

interface CommunicationRow {
  id: string;
  channel: string;
  direction: string | null;
  subject: string | null;
  body_html: string | null;
  occurred_at: string;
  from_contact?: ContactRow | null;
  from_entity?: EntityRow | null;
  to_contact?: ContactRow | null;
  to_entity?: EntityRow | null;
  institution_track?: { institution?: EntityRow | null } | null;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function fail(message: string): never {
  throw new Error(message);
}

function toNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "string" ? Number(value) : (value as number);
  return Number.isFinite(n) ? (n as number) : fallback;
}

function capitalize(value?: string | null): string | undefined {
  if (!value) return undefined;
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ");
}

// PII shield: individuals never expose the full surname externally.
function maskSurname(last?: string | null): string {
  if (!last) return "";
  return `${last.charAt(0)}█████`;
}

function contactName(c?: ContactRow | null): string {
  if (!c) return "—";
  const first = c.first_name ?? "";
  const masked = maskSurname(c.last_name);
  const composed = [first, masked].filter(Boolean).join(" ").trim();
  return composed || c.company_name || c.display_name || "Contact";
}

function entityName(e?: EntityRow | null): string {
  if (!e) return "—";
  return e.display_name || e.trade_name || e.legal_name || "Entity";
}

// Internal actors/assignees are staff — shown in full inside the workspace
// (the PII shield only masks external-facing client identities).
function contactLabel(c?: ContactRow | null): string | undefined {
  if (!c) return undefined;
  const composed = [c.first_name, c.last_name].filter(Boolean).join(" ").trim();
  return c.display_name || composed || c.company_name || undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

// Communications are stored as HTML bodies; the list preview needs plain text.
function stripHtml(html?: string | null): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

// No dedicated status column exists on communications (frozen schema); a
// display status is derived from direction. Purely presentational.
const DIRECTION_STATUS: Record<string, string> = {
  outbound: "Sent",
  inbound: "Received",
  internal: "Logged",
};

function partyName(contact?: ContactRow | null, entity?: EntityRow | null): string | undefined {
  if (entity) return entityName(entity);
  if (contact) return contactName(contact);
  return undefined;
}

const DOCUMENT_CATEGORIES = new Set<DocumentItem["category"]>([
  "kyc",
  "income",
  "property",
  "banking",
  "business",
  "legal",
  "technical",
  "other",
]);

function normalizeCategory(value?: string | null): DocumentItem["category"] {
  return value && DOCUMENT_CATEGORIES.has(value as DocumentItem["category"])
    ? (value as DocumentItem["category"])
    : "other";
}

const PRIORITY_CODES: PriorityCode[] = ["critical", "high", "medium", "low"];

function mapPriority(row?: PriorityRow | null): PriorityCode {
  const code = (row?.code ?? "").toLowerCase();
  if ((PRIORITY_CODES as string[]).includes(code)) return code as PriorityCode;
  const name = (row?.name ?? "").toLowerCase();
  const match = PRIORITY_CODES.find((p) => name.includes(p));
  return match ?? "medium";
}

function latestDate(...dates: (string | null | undefined)[]): string | undefined {
  const valid = dates.filter((d): d is string => Boolean(d));
  if (valid.length === 0) return undefined;
  return valid.sort().at(-1);
}

const OPPORTUNITY_SELECT = `
  id, opportunity_code, title, status, health_status, health_score, overall_readiness,
  expected_close_date, metadata, opportunity_type_id, current_stage_id,
  primary_client_contact_id, primary_client_entity_id,
  opportunity_types(name),
  opportunity_objectives(name),
  opportunity_priorities(code, name),
  opportunity_engagement_types(name),
  acquisition_channels(name),
  primary_client_contact:contacts!fk_opportunities_client_contact(first_name, middle_name, last_name, display_name, company_name, contact_type),
  primary_client_entity:entities!fk_opportunities_client_entity(display_name, legal_name, trade_name, industry),
  introduced_contact:contacts!fk_opportunities_introduced_contact(first_name, last_name, display_name),
  introduced_entity:entities!fk_opportunities_introduced_entity(display_name, legal_name, trade_name),
  current_stage:opportunity_type_stages!fk_opportunities_stage(sequence)
`;

/* -------------------------------------------------------------------------- */
/* Repository                                                                 */
/* -------------------------------------------------------------------------- */

export const OpportunityRepository = {
  /** Header + Client Summary source. Accepts a UUID or an RC-OPP business code. */
  async getOpportunityById(idOrCode: string): Promise<OpportunityCore> {
    const base = db.from("opportunities").select(OPPORTUNITY_SELECT).is("deleted_at", null);
    const filtered = UUID_RE.test(idOrCode)
      ? base.eq("id", idOrCode)
      : base.eq("opportunity_code", idOrCode);

    const { data, error } = await filtered.maybeSingle();
    if (error) fail(error.message);
    const row = data as OpportunityRow | null;
    if (!row) fail(`Opportunity "${idOrCode}" was not found.`);

    const clientKind: PartyKind = row.primary_client_entity_id ? "entity" : "contact";
    const clientId = row.primary_client_entity_id ?? row.primary_client_contact_id;

    const [profile, intelligence, stages] = await Promise.all([
      this.getClientProfile(clientKind, clientId),
      this.getClientIntelligence(clientKind, clientId),
      this.getTypeStages(row.opportunity_type_id, row.current_stage?.sequence ?? null),
    ]);

    const metadata = row.metadata ?? {};
    const tags = Array.isArray(metadata.tags) ? (metadata.tags as string[]) : [];
    const confidentiality = metadata.confidentiality === "restricted" ? "restricted" : "standard";

    const introducedBy = row.introduced_entity
      ? entityName(row.introduced_entity)
      : row.introduced_contact
        ? contactName(row.introduced_contact)
        : undefined;

    return {
      id: row.id,
      code: row.opportunity_code ?? row.id,
      title: row.title,
      typeName: row.opportunity_types?.name ?? "—",
      status: (row.status as OpportunityStatus) ?? "open",
      health: (row.health_status as HealthStatus) ?? "healthy",
      healthScore: toNumber(row.health_score, 0),
      priority: mapPriority(row.opportunity_priorities),
      engagementModel: row.opportunity_engagement_types?.name ?? "—",
      objective: row.opportunity_objectives?.name ?? "—",
      acquisitionChannel: row.acquisition_channels?.name ?? "—",
      introducedBy,
      confidentiality,
      tags,
      overallReadiness: toNumber(row.overall_readiness, 0),
      expectedCloseDate: row.expected_close_date ?? undefined,
      client: {
        kind: clientKind,
        name:
          clientKind === "entity"
            ? entityName(row.primary_client_entity)
            : contactName(row.primary_client_contact),
        classification: capitalize(profile?.relationship_classification),
        strength: capitalize(profile?.relationship_strength),
        industry: row.primary_client_entity?.industry ?? undefined,
        city: undefined,
        totalBusinessValue: intelligence
          ? toNumber(intelligence.total_business_value, 0) || undefined
          : undefined,
        lastInteraction: latestDate(
          intelligence?.last_meeting_date,
          intelligence?.last_communication_date,
          intelligence?.last_deal_date,
        ),
      },
      stages,
    };
  },

  async getClientProfile(
    kind: PartyKind,
    clientId: string | null,
  ): Promise<RelationshipProfileRow | null> {
    if (!clientId) return null;
    const column = kind === "entity" ? "entity_id" : "contact_id";
    const { data, error } = await db
      .from("relationship_profiles")
      .select("relationship_classification, relationship_strength")
      .is("deleted_at", null)
      .eq(column, clientId)
      .limit(1)
      .maybeSingle();
    if (error) return null;
    return (data as RelationshipProfileRow | null) ?? null;
  },

  async getClientIntelligence(
    kind: PartyKind,
    clientId: string | null,
  ): Promise<RelationshipIntelligenceRow | null> {
    if (!clientId) return null;
    const column = kind === "entity" ? "entity_id" : "contact_id";
    const { data, error } = await db
      .from("relationship_intelligence")
      .select("total_business_value, last_meeting_date, last_communication_date, last_deal_date")
      .is("deleted_at", null)
      .eq(column, clientId)
      .limit(1)
      .maybeSingle();
    if (error) return null;
    return (data as RelationshipIntelligenceRow | null) ?? null;
  },

  async getTypeStages(typeId: string, currentSequence: number | null): Promise<StageStep[]> {
    const { data, error } = await db
      .from("opportunity_type_stages")
      .select("stage_code, name, sequence")
      .eq("opportunity_type_id", typeId)
      .is("deleted_at", null)
      .order("sequence", { ascending: true });
    if (error) return [];
    const rows = (data ?? []) as TypeStageRow[];
    return rows.map((s) => {
      const seq = s.sequence ?? 0;
      let state: StageStep["state"] = "upcoming";
      if (currentSequence != null) {
        if (seq < currentSequence) state = "done";
        else if (seq === currentSequence) state = "current";
      }
      return { code: s.stage_code, name: s.name, state };
    });
  },

  async getOpportunityProducts(opportunityId: string): Promise<OpportunityProduct[]> {
    const { data, error } = await db
      .from("opportunity_products")
      .select(
        "id, requested_amount, tenure_months, is_primary, sub_status, products(name, product_type)",
      )
      .eq("opportunity_id", opportunityId)
      .is("deleted_at", null)
      .order("is_primary", { ascending: false });
    if (error) fail(error.message);
    const rows = (data ?? []) as ProductRow[];
    return rows.map((p) => ({
      id: p.id,
      name: p.products?.name ?? "Product",
      type: p.products?.product_type ?? "other",
      requestedAmount: toNumber(p.requested_amount, 0),
      tenureMonths: p.tenure_months ?? undefined,
      isPrimary: p.is_primary ?? false,
      subStatus: (p.sub_status as OpportunityProduct["subStatus"]) ?? "active",
    }));
  },

  async getOpportunityInstitutionTracks(opportunityId: string): Promise<InstitutionTrack[]> {
    const { data, error } = await db
      .from("opportunity_institution_tracks")
      .select(
        `id, track_status, smart_match_score, is_selected, sanctioned_amount, roi,
         institution:entities!fk_oit_institution(display_name, legal_name, trade_name),
         product:products!fk_oit_product(name)`,
      )
      .eq("opportunity_id", opportunityId)
      .is("deleted_at", null)
      .order("smart_match_score", { ascending: false, nullsFirst: false });
    if (error) fail(error.message);
    const rows = (data ?? []) as TrackRow[];
    return rows.map((t) => ({
      id: t.id,
      institution: entityName(t.institution),
      product: t.product?.name ?? undefined,
      status: (t.track_status as TrackStatus) ?? "matched",
      matchScore: t.smart_match_score != null ? toNumber(t.smart_match_score) : undefined,
      sanctionedAmount: t.sanctioned_amount != null ? toNumber(t.sanctioned_amount) : undefined,
      roi: t.roi != null ? toNumber(t.roi) : undefined,
      selected: t.is_selected ?? false,
    }));
  },

  async getOpportunityReadiness(opportunityId: string): Promise<ReadinessResult> {
    const { data, error } = await db
      .from("opportunity_readiness")
      .select(
        "score, opportunity_readiness_dimensions(code, name, pass_threshold, is_gating, weight, sort_order)",
      )
      .eq("opportunity_id", opportunityId)
      .is("deleted_at", null);
    if (error) fail(error.message);
    const rows = (data ?? []) as ReadinessRow[];

    const dimensions: ReadinessDimension[] = rows.map((r) => ({
      code: r.opportunity_readiness_dimensions?.code ?? "dim",
      name: r.opportunity_readiness_dimensions?.name ?? "Dimension",
      score: toNumber(r.score, 0),
      passThreshold: toNumber(r.opportunity_readiness_dimensions?.pass_threshold, 100),
      gating: r.opportunity_readiness_dimensions?.is_gating ?? false,
    }));

    const weighted = rows.reduce(
      (acc, r) => {
        const w = toNumber(r.opportunity_readiness_dimensions?.weight, 1);
        acc.sum += toNumber(r.score, 0) * w;
        acc.weight += w;
        return acc;
      },
      { sum: 0, weight: 0 },
    );
    const overall = weighted.weight > 0 ? Math.round(weighted.sum / weighted.weight) : 0;

    return { dimensions, overall };
  },

  async getOpportunityTasks(opportunityId: string): Promise<TaskItem[]> {
    const { data, error } = await db
      .from("opportunity_tasks")
      .select(
        `id, title, origin, status, due_date,
         assignee:contacts!fk_ot_assignee(first_name, last_name, display_name, company_name),
         readiness_dimension:opportunity_readiness_dimensions!fk_ot_dimension(name),
         institution_track:opportunity_institution_tracks!fk_ot_institution_track(
           institution:entities!fk_oit_institution(display_name, legal_name, trade_name))`,
      )
      .eq("opportunity_id", opportunityId)
      .is("deleted_at", null)
      .order("due_date", { ascending: true, nullsFirst: false });
    if (error) fail(error.message);
    const rows = (data ?? []) as TaskRow[];
    return rows.map((t) => ({
      id: t.id,
      title: t.title,
      origin: (t.origin as TaskItem["origin"]) ?? "manual",
      status: (t.status as TaskItem["status"]) ?? "open",
      assignee: contactLabel(t.assignee) ?? "Unassigned",
      dueDate: t.due_date ?? undefined,
      // `opportunity_tasks` has no priority column in the frozen schema — omitted.
      institutionTrack: t.institution_track
        ? entityName(t.institution_track.institution)
        : undefined,
      readinessDimension: t.readiness_dimension?.name ?? undefined,
    }));
  },

  async getOpportunityTimeline(opportunityId: string, limit = 100): Promise<TimelineEvent[]> {
    const { data, error } = await db
      .from("opportunity_timeline")
      .select(
        `id, event_type, source, occurred_at, payload,
         actor:contacts!fk_otl_actor_contact(first_name, last_name, display_name, company_name)`,
      )
      .eq("opportunity_id", opportunityId)
      .order("occurred_at", { ascending: false })
      .limit(limit);
    if (error) fail(error.message);
    const rows = (data ?? []) as TimelineRow[];
    return rows.map((e) => {
      const payload = e.payload ?? {};
      const summary = asString(payload.summary) ?? e.event_type.replace(/[._]/g, " ");
      const institution = asString(payload.institution) ?? asString(payload.institution_name);
      const stage =
        asString(payload.stage) ?? asString(payload.to_stage) ?? asString(payload.to_stage_name);

      // Everything else in the payload becomes a generic preview, so new event
      // types render with zero UI changes.
      const preview: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(payload)) {
        if (
          [
            "summary",
            "institution",
            "institution_name",
            "stage",
            "to_stage",
            "to_stage_name",
          ].includes(key)
        ) {
          continue;
        }
        preview[key] = value;
      }

      return {
        id: e.id,
        eventType: e.event_type,
        source: (e.source as TimelineEvent["source"]) ?? "system",
        actor: contactLabel(e.actor) ?? "System",
        summary,
        occurredAt: e.occurred_at,
        institution,
        stage,
        payload: Object.keys(preview).length > 0 ? preview : undefined,
      };
    });
  },

  async getOpportunityCommunications(opportunityId: string, limit = 100): Promise<Communication[]> {
    const { data, error } = await db
      .from("opportunity_communications")
      .select(
        `id, channel, direction, subject, body_html, occurred_at,
         from_contact:contacts!fk_oc_from_contact(first_name, last_name, display_name, company_name),
         from_entity:entities!fk_oc_from_entity(display_name, legal_name, trade_name),
         to_contact:contacts!fk_oc_to_contact(first_name, last_name, display_name, company_name),
         to_entity:entities!fk_oc_to_entity(display_name, legal_name, trade_name),
         institution_track:opportunity_institution_tracks!fk_oc_track(
           institution:entities!fk_oit_institution(display_name, legal_name, trade_name))`,
      )
      .eq("opportunity_id", opportunityId)
      .is("deleted_at", null)
      .order("occurred_at", { ascending: false })
      .limit(limit);
    if (error) fail(error.message);
    const rows = (data ?? []) as CommunicationRow[];
    return rows.map((c) => {
      const direction = (c.direction as Communication["direction"]) ?? "internal";
      const fromParty = partyName(c.from_contact, c.from_entity);
      const toParty = partyName(c.to_contact, c.to_entity);
      const institution = c.institution_track
        ? entityName(c.institution_track.institution)
        : undefined;
      const party = [fromParty, toParty].filter(Boolean).join(" → ") || institution || "Internal";
      return {
        id: c.id,
        channel: c.channel,
        direction,
        party,
        subject: asString(c.subject) ?? c.channel.replace(/[._]/g, " "),
        preview: stripHtml(c.body_html),
        occurredAt: c.occurred_at,
        fromParty,
        toParty,
        institution,
        status: DIRECTION_STATUS[c.direction ?? ""] ?? undefined,
      };
    });
  },

  async getOpportunityDocuments(opportunityId: string): Promise<DocumentItem[]> {
    const { data, error } = await db
      .from("opportunity_documents")
      .select(
        `id, document_name, status, metadata,
         requirement:product_document_requirements!fk_od_requirement(category, is_mandatory)`,
      )
      .eq("opportunity_id", opportunityId)
      .is("deleted_at", null)
      .order("document_name", { ascending: true });
    if (error) fail(error.message);
    const rows = (data ?? []) as DocumentRow[];
    return rows.map((d) => {
      const metadata = d.metadata ?? {};
      const category = normalizeCategory(d.requirement?.category ?? asString(metadata.category));
      const mandatory = d.requirement?.is_mandatory ?? metadata.mandatory === true;
      return {
        id: d.id,
        name: d.document_name,
        category,
        status: (d.status as DocumentItem["status"]) ?? "pending",
        mandatory,
      };
    });
  },

  // Workflow (read-only): append-only stage transition history, newest first.
  async getOpportunityStageHistory(opportunityId: string): Promise<StageHistoryEntry[]> {
    const { data, error } = await db
      .from("opportunity_stage_history")
      .select(
        `id, reason, changed_at,
         from_stage:opportunity_type_stages!fk_osh_from_stage(name),
         to_stage:opportunity_type_stages!fk_osh_to_stage(name)`,
      )
      .eq("opportunity_id", opportunityId)
      .order("changed_at", { ascending: false });
    if (error) fail(error.message);
    const rows = (data ?? []) as StageHistoryRow[];
    return rows.map((h) => ({
      id: h.id,
      fromStage: asString(h.from_stage?.name),
      toStage: h.to_stage?.name ?? "—",
      reason: asString(h.reason),
      changedAt: h.changed_at,
    }));
  },

  // Latest generated Information Sheet (current version preferred). Read-only.
  async getOpportunityInformationSheet(opportunityId: string): Promise<InformationSheet | null> {
    const { data, error } = await db
      .from("opportunity_information_sheets")
      .select("sheet_version, status, is_current, generated_at, html_body")
      .eq("opportunity_id", opportunityId)
      .order("is_current", { ascending: false })
      .order("sheet_version", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) fail(error.message);
    const row = data as InformationSheetRow | null;
    if (!row) return null;
    return {
      version: row.sheet_version ?? 1,
      status: row.status === "sent" ? "sent" : "draft",
      isCurrent: row.is_current ?? false,
      generatedAt: row.generated_at,
      htmlBody: row.html_body ?? "",
    };
  },

  /* ------------------------------------------------------------------------ */
  /* WRITE PATH — Create Opportunity Wizard (Sprint 4.8)                       */
  /* ------------------------------------------------------------------------ */

  async listOpportunityTypes(): Promise<CatalogOption[]> {
    return this.listCatalog("opportunity_types", "sort_order");
  },
  async listPriorities(): Promise<CatalogOption[]> {
    return this.listCatalog("opportunity_priorities", "rank");
  },
  async listEngagementTypes(): Promise<CatalogOption[]> {
    return this.listCatalog("opportunity_engagement_types", "sort_order");
  },
  async listObjectives(): Promise<CatalogOption[]> {
    return this.listCatalog("opportunity_objectives", "sort_order");
  },
  async listTeamRoles(): Promise<CatalogOption[]> {
    return this.listCatalog("team_roles", "sort_order");
  },

  async listCatalog(table: string, orderColumn: string): Promise<CatalogOption[]> {
    const { data, error } = await db
      .from(table)
      .select("id, code, name")
      .is("deleted_at", null)
      .eq("is_active", true)
      .order(orderColumn, { ascending: true });
    if (error) fail(error.message);
    const rows = (data ?? []) as { id: string; code?: string | null; name: string }[];
    return rows.map((r) => ({ id: r.id, code: r.code ?? undefined, name: r.name }));
  },

  async listProducts(): Promise<ProductOption[]> {
    const { data, error } = await db
      .from("products")
      .select("id, name, product_type, status")
      .is("deleted_at", null)
      .order("name", { ascending: true });
    if (error) fail(error.message);
    const rows = (data ?? []) as { id: string; name: string; product_type: string }[];
    return rows.map((r) => ({ id: r.id, name: r.name, type: r.product_type }));
  },

  async searchContacts(query: string, limit = 10): Promise<PartyOption[]> {
    const term = `%${query}%`;
    const { data, error } = await db
      .from("contacts")
      .select("id, first_name, last_name, display_name, company_name, contact_type")
      .is("deleted_at", null)
      .or(
        `display_name.ilike.${term},first_name.ilike.${term},last_name.ilike.${term},company_name.ilike.${term}`,
      )
      .limit(limit);
    if (error) fail(error.message);
    const rows = (data ?? []) as ContactRow[];
    return rows
      .filter((c): c is ContactRow & { id: string } => Boolean(c.id))
      .map((c) => ({
        id: c.id,
        kind: "contact" as const,
        name: contactLabel(c) ?? "Contact",
        sublabel: c.company_name ?? c.contact_type ?? undefined,
      }));
  },

  async searchEntities(query: string, limit = 10): Promise<PartyOption[]> {
    const term = `%${query}%`;
    const { data, error } = await db
      .from("entities")
      .select("id, display_name, legal_name, trade_name, entity_types(name)")
      .is("deleted_at", null)
      .or(`display_name.ilike.${term},legal_name.ilike.${term},trade_name.ilike.${term}`)
      .limit(limit);
    if (error) fail(error.message);
    const rows = (data ?? []) as (EntityRow & {
      id: string;
      entity_types?: { name?: string | null } | null;
    })[];
    return rows.map((e) => ({
      id: e.id,
      kind: "entity" as const,
      name: entityName(e),
      sublabel: e.entity_types?.name ?? undefined,
    }));
  },

  // Institutions are Entities (Entity Type = Institution). Reuses entity search;
  // the entity type is surfaced as the sublabel so users pick the right party.
  async searchInstitutions(query: string, limit = 10): Promise<PartyOption[]> {
    return this.searchEntities(query, limit);
  },

  async resolveOrganizationId(): Promise<string> {
    const { data, error } = await db
      .from("organizations")
      .select("id")
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) fail(error.message);
    const row = data as { id?: string } | null;
    if (!row?.id) fail("No active organization found for this workspace.");
    return row.id as string;
  },

  // Create an Opportunity + its children + a timeline event. Supabase-JS has no
  // client-side multi-statement transaction (and we must not add a DB function),
  // so this runs sequentially with compensation: if any child insert fails after
  // the parent is created, the parent is soft-deleted and the error is rethrown.
  async createOpportunity(input: CreateOpportunityInput): Promise<CreatedOpportunity> {
    const organizationId = await this.resolveOrganizationId();

    const isEntity = input.client.kind === "entity";
    const { data: created, error: oppError } = await db
      .from("opportunities")
      .insert({
        organization_id: organizationId,
        title: input.title,
        opportunity_type_id: input.opportunityTypeId,
        objective_id: input.objectiveId ?? null,
        priority_id: input.priorityId ?? null,
        engagement_type_id: input.engagementTypeId ?? null,
        primary_client_contact_id: isEntity ? null : input.client.id,
        primary_client_entity_id: isEntity ? input.client.id : null,
        expected_close_date: input.expectedCloseDate ?? null,
        currency: "INR",
        status: "open",
      })
      .select("id, opportunity_code")
      .single();
    if (oppError) fail(oppError.message);
    const opportunity = created as { id: string; opportunity_code: string | null };
    const opportunityId = opportunity.id;

    try {
      if (input.products.length > 0) {
        const { error } = await db.from("opportunity_products").insert(
          input.products.map((p) => ({
            organization_id: organizationId,
            opportunity_id: opportunityId,
            product_id: p.productId,
            requested_amount: p.requestedAmount ?? null,
            tenure_months: p.tenureMonths ?? null,
            is_primary: p.isPrimary,
          })),
        );
        if (error) fail(error.message);
      }

      if (input.institutions.length > 0) {
        const { error } = await db.from("opportunity_institution_tracks").insert(
          input.institutions.map((t) => ({
            organization_id: organizationId,
            opportunity_id: opportunityId,
            institution_entity_id: t.entityId,
            product_id: t.productId ?? null,
            track_status: "matched",
          })),
        );
        if (error) fail(error.message);
      }

      if (input.team.length > 0) {
        const { error } = await db.from("opportunity_team").insert(
          input.team.map((m) => ({
            organization_id: organizationId,
            opportunity_id: opportunityId,
            team_role_id: m.teamRoleId,
            member_contact_id: m.memberContactId,
            is_primary: m.isPrimary,
          })),
        );
        if (error) fail(error.message);
      }

      // Universal Timeline event (append-only) — part of the create contract.
      const { error: timelineError } = await db.from("opportunity_timeline").insert({
        organization_id: organizationId,
        opportunity_id: opportunityId,
        event_type: "opportunity.created",
        source: "manual",
        payload: {
          summary: `Opportunity ${opportunity.opportunity_code ?? ""} created`.trim(),
          products: input.products.length,
          institutions: input.institutions.length,
        },
      });
      if (timelineError) fail(timelineError.message);
    } catch (err) {
      // Compensating action: soft-delete the orphaned parent so we don't leave
      // a half-created opportunity behind.
      await db
        .from("opportunities")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", opportunityId);
      throw err instanceof Error ? err : new Error("Failed to create opportunity.");
    }

    return { id: opportunityId, code: opportunity.opportunity_code ?? opportunityId };
  },
};

export type OpportunityRepositoryType = typeof OpportunityRepository;
