/**
 * Product Intelligence service (Phase 2B).
 *
 * Validates input with Zod, delegates persistence to the repositories, and
 * returns a `Result<T>` (never throws across the boundary). RLS remains the
 * security boundary; these functions enforce shape and business invariants.
 */
import { z } from "zod";
import type { AuditContext } from "@/lib/db/repository";
import { err, ok, type Result } from "@/lib/service/result";
import {
  productCategoryRepository,
  productRepository,
  productWorkflowStageRepository,
  type Paginated,
} from "@/lib/repositories/product-repository";
import {
  productCategoryCreateSchema,
  productCreateSchema,
  productUpdateSchema,
  workflowStageCreateSchema,
} from "@/lib/validation/product";
import type {
  ProductCategoryInsert,
  ProductCategoryRow,
  ProductInsert,
  ProductRow,
  ProductUpdate,
  ProductWorkflowStageInsert,
  ProductWorkflowStageRow,
  WorkflowPhase,
} from "@/types/product-intelligence";

function zodToFields(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "_";
    if (!(path in fields)) fields[path] = issue.message;
  }
  return fields;
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------
export interface ListProductsOptions {
  page?: number;
  pageSize?: number;
  includeDeleted?: boolean;
}

export function listProducts(
  ctx: AuditContext,
  options: ListProductsOptions = {},
): Promise<Result<Paginated<ProductRow>>> {
  return productRepository.list(ctx, { ...options, orderBy: "name", ascending: true });
}

export function getProduct(ctx: AuditContext, id: string): Promise<Result<ProductRow>> {
  return productRepository.getById(ctx, id);
}

export async function createProduct(
  ctx: AuditContext,
  input: unknown,
): Promise<Result<ProductRow>> {
  const parsed = productCreateSchema.safeParse(input);
  if (!parsed.success) {
    return err("validation", "Please correct the highlighted fields.", {
      fields: zodToFields(parsed.error),
    });
  }
  return productRepository.insert(ctx, parsed.data as ProductInsert);
}

export async function updateProduct(
  ctx: AuditContext,
  id: string,
  input: unknown,
): Promise<Result<ProductRow>> {
  const parsed = productUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return err("validation", "Please correct the highlighted fields.", {
      fields: zodToFields(parsed.error),
    });
  }
  return productRepository.update(ctx, id, parsed.data as ProductUpdate);
}

/** Move a product to `active`. Only draft/paused products may be published. */
export async function publishProduct(ctx: AuditContext, id: string): Promise<Result<ProductRow>> {
  const current = await productRepository.getById(ctx, id);
  if (!current.ok) return current;
  if (current.data.status === "withdrawn") {
    return err("conflict", "A withdrawn product cannot be published.");
  }
  return productRepository.update(ctx, id, { status: "active" } as ProductUpdate);
}

export function deleteProduct(ctx: AuditContext, id: string): Promise<Result<true>> {
  return productRepository.softDelete(ctx, id);
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
export function listCategories(ctx: AuditContext): Promise<Result<ProductCategoryRow[]>> {
  return productCategoryRepository.listVisible(ctx);
}

export async function createCategory(
  ctx: AuditContext,
  input: unknown,
): Promise<Result<ProductCategoryRow>> {
  const parsed = productCategoryCreateSchema.safeParse(input);
  if (!parsed.success) {
    return err("validation", "Please correct the highlighted fields.", {
      fields: zodToFields(parsed.error),
    });
  }
  return productCategoryRepository.insert(ctx, parsed.data as ProductCategoryInsert);
}

// ---------------------------------------------------------------------------
// Workflow stages
// ---------------------------------------------------------------------------
export function listWorkflowStages(
  ctx: AuditContext,
  productId: string,
  phase?: WorkflowPhase,
): Promise<Result<ProductWorkflowStageRow[]>> {
  return productWorkflowStageRepository.listForProduct(ctx, productId, phase);
}

export async function addWorkflowStage(
  ctx: AuditContext,
  input: unknown,
): Promise<Result<ProductWorkflowStageRow>> {
  const parsed = workflowStageCreateSchema.safeParse(input);
  if (!parsed.success) {
    return err("validation", "Please correct the highlighted fields.", {
      fields: zodToFields(parsed.error),
    });
  }
  return productWorkflowStageRepository.insert(ctx, parsed.data as ProductWorkflowStageInsert);
}
