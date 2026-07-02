/**
 * Zod validation for the Product Intelligence Engine.
 * Kept aligned with the DB CHECK constraints in the Phase 2B schema migration.
 */
import { z } from "zod";
import { code, isoDate, money, nonEmpty, uuid } from "@/lib/validation/primitives";
import { conditionSchema } from "@/lib/validation/condition-grammar";
import {
  APPLICANT_TYPES,
  FINANCIAL_RULE_TYPES,
  PRODUCT_STATUSES,
  PRODUCT_TYPES,
  RULE_SEVERITIES,
  STAGE_CATEGORIES,
  WORKFLOW_PHASES,
} from "@/types/product-intelligence";

const tenure = z.number().int().min(0).max(600);

export const productCategoryCreateSchema = z.object({
  code,
  name: nonEmpty.max(120),
  description: z.string().max(500).nullish(),
  icon: z.string().max(64).nullish(),
  sort_order: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
});
export const productCategoryUpdateSchema = productCategoryCreateSchema.partial();

export const productCreateSchema = z
  .object({
    category_id: uuid.nullish(),
    name: nonEmpty.max(160),
    product_type: z.enum(PRODUCT_TYPES),
    description: z.string().max(2000).nullish(),
    is_advisory: z.boolean().optional(),
    status: z.enum(PRODUCT_STATUSES).optional(),
    min_amount: money.nullish(),
    max_amount: money.nullish(),
    min_tenure_months: tenure.nullish(),
    max_tenure_months: tenure.nullish(),
    currency: z.string().length(3).optional(),
  })
  .refine((v) => v.min_amount == null || v.max_amount == null || v.max_amount >= v.min_amount, {
    message: "Maximum amount cannot be less than minimum amount",
    path: ["max_amount"],
  })
  .refine(
    (v) =>
      v.min_tenure_months == null ||
      v.max_tenure_months == null ||
      v.max_tenure_months >= v.min_tenure_months,
    { message: "Maximum tenure cannot be less than minimum tenure", path: ["max_tenure_months"] },
  );

export const productUpdateSchema = z
  .object({
    category_id: uuid.nullish(),
    name: nonEmpty.max(160).optional(),
    product_type: z.enum(PRODUCT_TYPES).optional(),
    description: z.string().max(2000).nullish(),
    is_advisory: z.boolean().optional(),
    status: z.enum(PRODUCT_STATUSES).optional(),
    min_amount: money.nullish(),
    max_amount: money.nullish(),
    min_tenure_months: tenure.nullish(),
    max_tenure_months: tenure.nullish(),
    currency: z.string().length(3).optional(),
  })
  .refine((v) => v.min_amount == null || v.max_amount == null || v.max_amount >= v.min_amount, {
    message: "Maximum amount cannot be less than minimum amount",
    path: ["max_amount"],
  });

export const workflowStageCreateSchema = z.object({
  product_id: uuid,
  phase: z.enum(WORKFLOW_PHASES),
  stage_code: code,
  name: nonEmpty.max(120),
  sequence: z.number().int().min(0).optional(),
  category: z.enum(STAGE_CATEGORIES).nullish(),
  is_initial: z.boolean().optional(),
  is_terminal: z.boolean().optional(),
  is_won: z.boolean().optional(),
  is_lost: z.boolean().optional(),
  sla_hours: z.number().int().min(0).nullish(),
  allowed_next_stages: z.array(code).optional(),
  is_active: z.boolean().optional(),
});

export const eligibilityRuleCreateSchema = z.object({
  product_id: uuid,
  rule_code: code,
  name: nonEmpty.max(160),
  applicant_type: z.enum(APPLICANT_TYPES).nullish(),
  criteria: conditionSchema,
  severity: z.enum(RULE_SEVERITIES).optional(),
  weight: z.number().min(0).max(9999).nullish(),
  error_message: z.string().max(300).nullish(),
  effective_from: isoDate.optional(),
  effective_to: isoDate.nullish(),
});

export const financialRuleCreateSchema = z.object({
  product_id: uuid,
  rule_type: z.enum(FINANCIAL_RULE_TYPES),
  name: nonEmpty.max(160),
  parameters: z.record(z.unknown()).optional(),
  slabs: z.array(z.record(z.unknown())).optional(),
  unit: z.string().max(32).nullish(),
  effective_from: isoDate.optional(),
  effective_to: isoDate.nullish(),
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type ProductCategoryCreateInput = z.infer<typeof productCategoryCreateSchema>;
export type WorkflowStageCreateInput = z.infer<typeof workflowStageCreateSchema>;
export type EligibilityRuleCreateInput = z.infer<typeof eligibilityRuleCreateSchema>;
export type FinancialRuleCreateInput = z.infer<typeof financialRuleCreateSchema>;
