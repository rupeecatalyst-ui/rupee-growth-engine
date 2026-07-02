/**
 * RCLIP Product Intelligence Engine — domain types (Phase 2B).
 *
 * These hand-authored Row/Insert/Update shapes mirror the
 * `20260702130000_rclip_phase2b_product_intelligence_*` migrations. They are the
 * interim source of truth for the app layer until `npm run db:types` regenerates
 * `integrations/supabase/types.ts` against a database that has these tables.
 */
import type { Json } from "@/integrations/supabase/types";
import type { Condition } from "@/lib/validation/condition-grammar";

// ----------------------------------------------------------------------------
// Enums (mirror the DB CHECK constraints)
// ----------------------------------------------------------------------------
export const PRODUCT_TYPES = [
  "home_loan",
  "home_loan_bt",
  "loan_against_property",
  "business_loan",
  "working_capital",
  "project_finance",
  "construction_finance",
  "equipment_finance",
  "lease_rental_discounting",
  "loan_against_securities",
  "structured_debt",
  "debt_syndication",
  "equity_raise",
  "private_equity",
  "venture_capital",
  "ipo_advisory",
  "ma_advisory",
  "other",
] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export const PRODUCT_STATUSES = ["draft", "active", "paused", "withdrawn"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const WORKFLOW_PHASES = ["opportunity", "transaction"] as const;
export type WorkflowPhase = (typeof WORKFLOW_PHASES)[number];

export const STAGE_CATEGORIES = [
  "open",
  "in_progress",
  "won",
  "lost",
  "on_hold",
  "sanctioned",
  "disbursed",
  "closed",
  "rejected",
  "custom",
] as const;
export type StageCategory = (typeof STAGE_CATEGORIES)[number];

export const APPLICANT_TYPES = ["individual", "company", "huf", "trust", "any"] as const;
export type ApplicantType = (typeof APPLICANT_TYPES)[number];

export const RULE_SEVERITIES = ["hard", "soft"] as const;
export type RuleSeverity = (typeof RULE_SEVERITIES)[number];

export const FINANCIAL_RULE_TYPES = [
  "ltv",
  "foir",
  "income_multiplier",
  "margin",
  "max_amount_band",
  "tenure_cap",
  "moratorium",
  "other",
] as const;
export type FinancialRuleType = (typeof FINANCIAL_RULE_TYPES)[number];

export const DOCUMENT_CATEGORIES = [
  "kyc",
  "income",
  "property",
  "banking",
  "business",
  "legal",
  "technical",
  "other",
] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const DYNAMIC_FIELD_TYPES = [
  "text",
  "textarea",
  "number",
  "currency",
  "date",
  "boolean",
  "select",
  "multiselect",
  "file",
] as const;
export type DynamicFieldType = (typeof DYNAMIC_FIELD_TYPES)[number];

export const AUTOMATION_TRIGGERS = [
  "created",
  "stage_enter",
  "stage_exit",
  "field_change",
  "sla_breach",
  "document_uploaded",
  "scheduled",
] as const;
export type AutomationTrigger = (typeof AUTOMATION_TRIGGERS)[number];

export const SMART_MATCH_ENGINES = ["rules", "ml", "hybrid"] as const;
export type SmartMatchEngine = (typeof SMART_MATCH_ENGINES)[number];

// ----------------------------------------------------------------------------
// Shared audit shape
// ----------------------------------------------------------------------------
export interface AuditFields {
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
  version: number;
}

type Identified = { id: string } & AuditFields;

/** Columns supplied by the base repository or the DB, not by callers. */
type ManagedKeys = "id" | "organization_id" | keyof AuditFields;

// ----------------------------------------------------------------------------
// Row types
// ----------------------------------------------------------------------------
export interface ProductCategoryRow extends Identified {
  organization_id: string | null;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_system: boolean;
  is_active: boolean;
}

export interface ProductRow extends Identified {
  organization_id: string;
  category_id: string | null;
  product_code: string | null;
  name: string;
  product_type: ProductType;
  description: string | null;
  is_advisory: boolean;
  status: ProductStatus;
  min_amount: number | null;
  max_amount: number | null;
  min_tenure_months: number | null;
  max_tenure_months: number | null;
  currency: string;
  config: Json;
}

export interface ProductWorkflowStageRow extends Identified {
  organization_id: string;
  product_id: string;
  phase: WorkflowPhase;
  stage_code: string;
  name: string;
  sequence: number;
  category: StageCategory | null;
  is_initial: boolean;
  is_terminal: boolean;
  is_won: boolean;
  is_lost: boolean;
  sla_hours: number | null;
  allowed_next_stages: Json;
  config: Json;
  is_active: boolean;
}

export interface ProductEligibilityRuleRow extends Identified {
  organization_id: string;
  product_id: string;
  rule_code: string;
  name: string;
  applicant_type: ApplicantType | null;
  criteria: Condition | Json;
  severity: RuleSeverity;
  weight: number | null;
  error_message: string | null;
  rule_version: number;
  is_active: boolean;
  effective_from: string;
  effective_to: string | null;
}

export interface ProductFinancialRuleRow extends Identified {
  organization_id: string;
  product_id: string;
  rule_type: FinancialRuleType;
  name: string;
  parameters: Json;
  slabs: Json;
  unit: string | null;
  rule_version: number;
  is_active: boolean;
  effective_from: string;
  effective_to: string | null;
}

export interface ProductDocumentRequirementRow extends Identified {
  organization_id: string;
  product_id: string;
  stage_id: string | null;
  document_code: string;
  name: string;
  applicant_type: ApplicantType | null;
  category: DocumentCategory | null;
  is_mandatory: boolean;
  sort_order: number;
  config: Json;
  is_active: boolean;
}

export interface ProductSlaRuleRow extends Identified {
  organization_id: string;
  product_id: string;
  stage_id: string | null;
  phase: WorkflowPhase | null;
  name: string;
  sla_hours: number;
  business_hours_only: boolean;
  escalation: Json;
  is_active: boolean;
}

export interface ProductDynamicFieldRow extends Identified {
  organization_id: string;
  product_id: string;
  field_code: string;
  label: string;
  field_type: DynamicFieldType;
  options: Json;
  is_required: boolean;
  validation: Json;
  applies_to: "opportunity" | "transaction" | "both";
  sort_order: number;
  is_active: boolean;
}

export interface ProductAutomationRuleRow extends Identified {
  organization_id: string;
  product_id: string;
  stage_id: string | null;
  rule_code: string;
  name: string;
  trigger_event: AutomationTrigger;
  conditions: Json;
  actions: Json;
  priority: number;
  is_active: boolean;
}

export interface ProductSmartMatchConfigRow extends Identified {
  organization_id: string;
  product_id: string;
  engine_type: SmartMatchEngine;
  acceptance_weights: Json;
  hard_filters: Json;
  min_confidence: number | null;
  config_version: number;
  is_active: boolean;
  effective_from: string;
  effective_to: string | null;
}

// ----------------------------------------------------------------------------
// Insert / Update payloads (managed columns stripped; DB-defaulted cols optional)
// ----------------------------------------------------------------------------
export interface ProductCategoryInsert {
  code: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  sort_order?: number;
  is_active?: boolean;
}
export type ProductCategoryUpdate = Partial<ProductCategoryInsert>;

export interface ProductInsert {
  category_id?: string | null;
  name: string;
  product_type: ProductType;
  description?: string | null;
  is_advisory?: boolean;
  status?: ProductStatus;
  min_amount?: number | null;
  max_amount?: number | null;
  min_tenure_months?: number | null;
  max_tenure_months?: number | null;
  currency?: string;
  config?: Json;
}
export type ProductUpdate = Partial<ProductInsert>;

export interface ProductWorkflowStageInsert {
  product_id: string;
  phase: WorkflowPhase;
  stage_code: string;
  name: string;
  sequence?: number;
  category?: StageCategory | null;
  is_initial?: boolean;
  is_terminal?: boolean;
  is_won?: boolean;
  is_lost?: boolean;
  sla_hours?: number | null;
  allowed_next_stages?: Json;
  config?: Json;
  is_active?: boolean;
}
export type ProductWorkflowStageUpdate = Partial<Omit<ProductWorkflowStageInsert, "product_id">>;

/** Utility to derive an insert payload type for the remaining config tables. */
export type InsertOf<Row> = Omit<Row, ManagedKeys>;
