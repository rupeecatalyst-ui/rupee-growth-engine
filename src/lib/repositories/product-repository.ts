/**
 * Product Intelligence repositories (Phase 2B).
 * Extend BaseRepository for tenant scoping, audit stamping, soft delete and
 * pagination. Domain-specific reads are added on top.
 */
import { BaseRepository, db, type AuditContext, type Paginated } from "@/lib/db/repository";
import { err, ok, type Result } from "@/lib/service/result";
import type {
  ProductCategoryInsert,
  ProductCategoryRow,
  ProductCategoryUpdate,
  ProductInsert,
  ProductRow,
  ProductUpdate,
  ProductWorkflowStageInsert,
  ProductWorkflowStageRow,
  ProductWorkflowStageUpdate,
  WorkflowPhase,
} from "@/types/product-intelligence";

class ProductCategoryRepository extends BaseRepository<
  ProductCategoryRow,
  ProductCategoryInsert,
  ProductCategoryUpdate
> {
  protected readonly table = "product_categories";
  protected readonly defaultOrderBy = "sort_order";

  /** Own-org categories plus read-only global system categories. */
  async listVisible(ctx: AuditContext): Promise<Result<ProductCategoryRow[]>> {
    const { data, error } = await db()
      .from(this.table)
      .select("*")
      .or(`organization_id.eq.${ctx.organizationId},organization_id.is.null`)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true });
    if (error) return err("internal", error.message, { cause: error });
    return ok((data ?? []) as ProductCategoryRow[]);
  }
}

class ProductRepository extends BaseRepository<ProductRow, ProductInsert, ProductUpdate> {
  protected readonly table = "products";
  protected readonly defaultOrderBy = "name";

  async findByCode(ctx: AuditContext, productCode: string): Promise<Result<ProductRow>> {
    const { data, error } = await db()
      .from(this.table)
      .select("*")
      .eq("organization_id", ctx.organizationId)
      .eq("product_code", productCode)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) return err("internal", error.message, { cause: error });
    if (!data) return err("not_found", "Product not found.");
    return ok(data as ProductRow);
  }
}

class ProductWorkflowStageRepository extends BaseRepository<
  ProductWorkflowStageRow,
  ProductWorkflowStageInsert,
  ProductWorkflowStageUpdate
> {
  protected readonly table = "product_workflow_stages";
  protected readonly defaultOrderBy = "sequence";

  /** Ordered stages for a product, optionally filtered by phase. */
  async listForProduct(
    ctx: AuditContext,
    productId: string,
    phase?: WorkflowPhase,
  ): Promise<Result<ProductWorkflowStageRow[]>> {
    let query = db()
      .from(this.table)
      .select("*")
      .eq("organization_id", ctx.organizationId)
      .eq("product_id", productId)
      .is("deleted_at", null)
      .order("phase", { ascending: true })
      .order("sequence", { ascending: true });
    if (phase) query = query.eq("phase", phase);
    const { data, error } = await query;
    if (error) return err("internal", error.message, { cause: error });
    return ok((data ?? []) as ProductWorkflowStageRow[]);
  }
}

export const productCategoryRepository = new ProductCategoryRepository();
export const productRepository = new ProductRepository();
export const productWorkflowStageRepository = new ProductWorkflowStageRepository();

export type { Paginated };
