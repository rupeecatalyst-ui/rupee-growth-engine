/**
 * RCLIP shared Condition/Parameter Grammar.
 *
 * A single, config-driven grammar for expressing business rules as data — reused
 * by Product eligibility rules, Capital Provider rules, Opportunity/Transaction
 * stage gates, and Commission rules. Rules are stored as `jsonb` in the database
 * and evaluated by this pure, dependency-free evaluator.
 *
 * Design goals: no hardcoded business logic, deterministic evaluation, and a
 * schema (`conditionSchema`) that both the DB authoring UI and services validate
 * against before persistence.
 */
import { z } from "zod";

export const COMPARISON_OPS = [
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
  "in",
  "nin",
  "between",
  "contains",
  "exists",
] as const;

export type ComparisonOp = (typeof COMPARISON_OPS)[number];

export type Scalar = string | number | boolean | null;
export type ConditionValue = Scalar | Scalar[];

export interface Comparison {
  field: string;
  op: ComparisonOp;
  value?: ConditionValue;
}

export type Condition =
  Comparison | { all: Condition[] } | { any: Condition[] } | { not: Condition };

const scalarSchema: z.ZodType<Scalar> = z.union([z.string(), z.number(), z.boolean(), z.null()]);

const comparisonSchema: z.ZodType<Comparison> = z.object({
  field: z.string().min(1),
  op: z.enum(COMPARISON_OPS),
  value: z.union([scalarSchema, z.array(scalarSchema)]).optional(),
});

export const conditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.union([
    comparisonSchema,
    z.object({ all: z.array(conditionSchema).min(1) }),
    z.object({ any: z.array(conditionSchema).min(1) }),
    z.object({ not: conditionSchema }),
  ]),
);

/** Evaluation context: a flat map of field paths → runtime values. */
export type EvalContext = Record<string, unknown>;

function readField(ctx: EvalContext, path: string): unknown {
  if (path in ctx) return ctx[path];
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, ctx);
}

function asNumber(v: unknown): number | undefined {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  return undefined;
}

function compare(actual: unknown, op: ComparisonOp, value: ConditionValue | undefined): boolean {
  switch (op) {
    case "exists":
      return actual !== undefined && actual !== null;
    case "eq":
      return actual === value;
    case "neq":
      return actual !== value;
    case "in":
      return Array.isArray(value) && value.includes(actual as Scalar);
    case "nin":
      return Array.isArray(value) && !value.includes(actual as Scalar);
    case "contains":
      if (typeof actual === "string" && typeof value === "string") return actual.includes(value);
      if (Array.isArray(actual)) return (actual as Scalar[]).includes(value as Scalar);
      return false;
    case "between": {
      if (!Array.isArray(value) || value.length !== 2) return false;
      const a = asNumber(actual);
      const lo = asNumber(value[0]);
      const hi = asNumber(value[1]);
      return a !== undefined && lo !== undefined && hi !== undefined && a >= lo && a <= hi;
    }
    case "gt":
    case "gte":
    case "lt":
    case "lte": {
      const a = asNumber(actual);
      const b = asNumber(Array.isArray(value) ? value[0] : value);
      if (a === undefined || b === undefined) return false;
      if (op === "gt") return a > b;
      if (op === "gte") return a >= b;
      if (op === "lt") return a < b;
      return a <= b;
    }
  }
}

/** Deterministically evaluate a condition tree against a runtime context. */
export function evaluateCondition(node: Condition, ctx: EvalContext): boolean {
  if ("all" in node) return node.all.every((c) => evaluateCondition(c, ctx));
  if ("any" in node) return node.any.some((c) => evaluateCondition(c, ctx));
  if ("not" in node) return !evaluateCondition(node.not, ctx);
  return compare(readField(ctx, node.field), node.op, node.value);
}

/** Validate an untrusted JSON value as a Condition; returns a parse Result. */
export function parseCondition(input: unknown): z.SafeParseReturnType<unknown, Condition> {
  return conditionSchema.safeParse(input);
}
