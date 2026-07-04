// RCLIP — Opportunity Workspace · shared UI types (frontend shell only).
// These mirror the Opportunity Lifecycle engine shape so the shell can later
// bind to real data with minimal change. No business logic lives here.

export type HealthStatus = "healthy" | "watch" | "at_risk" | "critical";
export type OpportunityStatus = "open" | "on_hold" | "won" | "lost" | "cancelled";
export type PriorityCode = "critical" | "high" | "medium" | "low";
export type PartyKind = "contact" | "entity";

export interface StageStep {
  code: string;
  name: string;
  state: "done" | "current" | "upcoming";
}

export interface CoverageMember {
  id: string;
  name: string;
  initials: string;
  teamRole: string;
  isPrimary?: boolean;
}

export interface OpportunityProduct {
  id: string;
  name: string;
  type: string;
  requestedAmount: number;
  tenureMonths?: number;
  isPrimary?: boolean;
  subStatus: "active" | "dropped" | "converted";
}

export interface Participant {
  id: string;
  kind: PartyKind;
  name: string; // surname already masked for individuals in the shell
  role: string;
  isPrimaryClient?: boolean;
}

export type TrackStatus =
  | "matched"
  | "shortlisted"
  | "application_sent"
  | "documents_pending"
  | "credit_discussion"
  | "sanction"
  | "documentation"
  | "disbursement"
  | "rejected"
  | "withdrawn";

export interface InstitutionTrack {
  id: string;
  institution: string;
  product?: string;
  status: TrackStatus;
  matchScore?: number;
  sanctionedAmount?: number;
  roi?: number;
  selected?: boolean;
}

export interface ReadinessDimension {
  code: string;
  name: string;
  score: number;
  passThreshold: number;
  gating: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  origin: "manual" | "workflow" | "institution_reply" | "missing_documents" | "ai";
  status: "open" | "in_progress" | "done" | "cancelled";
  assignee: string;
  dueDate?: string;
  priority?: PriorityCode;
  institutionTrack?: string;
  readinessDimension?: string;
}

export interface TimelineEvent {
  id: string;
  eventType: string;
  source: "manual" | "workflow" | "institution" | "ai" | "system";
  actor: string;
  summary: string;
  occurredAt: string;
  institution?: string;
  stage?: string;
  payload?: Record<string, unknown>;
}

export type CommChannel =
  | "email"
  | "phone_call"
  | "meeting"
  | "visit"
  | "video_conference"
  | "internal_note"
  | "institution_reply"
  | "document_request"
  | "clarification"
  | "escalation";

export interface Communication {
  // `channel` is config-driven: known channels get rich icons/labels, unknown /
  // future channels still render via a humanized fallback. Kept as a string so
  // no schema/enum change is needed when new channels appear.
  id: string;
  channel: CommChannel | (string & {});
  direction: "inbound" | "outbound" | "internal";
  party: string;
  subject: string;
  preview: string;
  occurredAt: string;
  fromParty?: string;
  toParty?: string;
  institution?: string;
  status?: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  category: "kyc" | "income" | "property" | "banking" | "business" | "legal" | "technical" | "other";
  status: "pending" | "received" | "verified" | "waived" | "rejected";
  mandatory: boolean;
}

export interface FinancialSummary {
  pipelineValue: number;
  expectedRevenue: number;
  actualRevenue: number;
  institutionReceivable: number;
  payables: number;
  profitability: number;
  currency: string;
}

export interface AISuggestion {
  id: string;
  kind: "summary" | "missing" | "recommendation" | "risk" | "follow_up";
  title: string;
  body: string;
}

export interface Watcher {
  id: string;
  name: string;
  initials: string;
}

export interface StageHistoryEntry {
  id: string;
  fromStage?: string;
  toStage: string;
  reason?: string;
  changedAt: string;
}

export interface InformationSheet {
  version: number;
  status: "draft" | "sent";
  isCurrent: boolean;
  generatedAt: string;
  htmlBody: string;
}

export interface Opportunity {
  code: string;
  title: string;
  type: string;
  status: OpportunityStatus;
  health: HealthStatus;
  healthScore: number;
  priority: PriorityCode;
  engagementModel: string;
  objective: string;
  acquisitionChannel: string;
  introducedBy?: string;
  expectedCloseDate: string;
  overallReadiness: number;
  confidentiality: "standard" | "restricted";
  tags: string[];
  client: {
    kind: PartyKind;
    name: string;
    classification?: string;
    strength?: string;
    industry?: string;
    city?: string;
    totalBusinessValue?: number;
    lastInteraction?: string;
  };
  stages: StageStep[];
  coverageTeam: CoverageMember[];
  products: OpportunityProduct[];
  participants: Participant[];
  institutionTracks: InstitutionTrack[];
  readiness: ReadinessDimension[];
  tasks: TaskItem[];
  timeline: TimelineEvent[];
  communications: Communication[];
  documents: DocumentItem[];
  financials: FinancialSummary;
  ai: AISuggestion[];
  watchers: Watcher[];
  createdAt: string;
  updatedAt: string;
  version: number;
}
