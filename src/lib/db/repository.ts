/**
 * RCLIP base repository pattern.
 *
 * Encapsulates the cross-cutting concerns shared by every tenant table:
 *   - tenant scoping (organization_id)
 *   - soft-delete filtering (deleted_at IS NULL) with opt-in inclusion
 *   - audit stamping (created_by / updated_by / deleted_by)
 *   - stable pagination + PostgREST error normalization
 *
 * Note on typing: the generated `Database` type (integrations/supabase/types.ts)
 * is regenerated with `npm run db:types` after each migration set. Until a table
 * exists there, domain repositories declare their own Row/Insert/Update shapes and
 * route through the thin, table-name-based `db()` accessor below.
 */
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { err, ok, type Result } from "@/lib/service/result";

export interface AuditContext {
  organizationId: string;
  userId?: string | null;
}

export interface ListOptions {
  page?: number;
  pageSize?: number;
  includeDeleted?: boolean;
  orderBy?: string;
  ascending?: boolean;
}

export interface Paginated<T> {
  rows: T[];
  page: number;
  pageSize: number;
  total: number;
}

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 200;

export function db(): SupabaseClient {
  return supabase as unknown as SupabaseClient;
}

function mapPgError<T>(error: PostgrestError): Result<T> {
  switch (error.code) {
    case "23505":
      return err("conflict", "That record already exists.", { cause: error });
    case "23503":
      return err("conflict", "A related record is missing or still in use.", { cause: error });
    case "23514":
      return err("validation", "A value violates a database constraint.", { cause: error });
    case "42501":
      return err("forbidden", "You do not have access to this resource.", { cause: error });
    default:
      return err("internal", error.message || "Database error", { cause: error });
  }
}

export abstract class BaseRepository<
  Row extends { id: string },
  Insert extends object,
  Update extends object,
> {
  protected abstract readonly table: string;
  protected abstract readonly defaultOrderBy: string;

  async list(ctx: AuditContext, options: ListOptions = {}): Promise<Result<Paginated<Row>>> {
    const page = Math.max(1, options.page ?? 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, options.pageSize ?? DEFAULT_PAGE_SIZE));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = db()
      .from(this.table)
      .select("*", { count: "exact" })
      .eq("organization_id", ctx.organizationId)
      .order(options.orderBy ?? this.defaultOrderBy, { ascending: options.ascending ?? true })
      .range(from, to);

    if (!options.includeDeleted) query = query.is("deleted_at", null);

    const { data, error, count } = await query;
    if (error) return mapPgError(error);
    return ok({ rows: (data ?? []) as Row[], page, pageSize, total: count ?? 0 });
  }

  async getById(ctx: AuditContext, id: string): Promise<Result<Row>> {
    const { data, error } = await db()
      .from(this.table)
      .select("*")
      .eq("organization_id", ctx.organizationId)
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) return mapPgError(error);
    if (!data) return err("not_found", "Record not found.");
    return ok(data as Row);
  }

  async insert(ctx: AuditContext, values: Insert): Promise<Result<Row>> {
    const payload = {
      ...values,
      organization_id: ctx.organizationId,
      created_by: ctx.userId ?? null,
    };
    const { data, error } = await db().from(this.table).insert(payload).select("*").single();
    if (error) return mapPgError(error);
    return ok(data as Row);
  }

  async update(ctx: AuditContext, id: string, values: Update): Promise<Result<Row>> {
    const payload = { ...values, updated_by: ctx.userId ?? null };
    const { data, error } = await db()
      .from(this.table)
      .update(payload)
      .eq("organization_id", ctx.organizationId)
      .eq("id", id)
      .is("deleted_at", null)
      .select("*")
      .maybeSingle();
    if (error) return mapPgError(error);
    if (!data) return err("not_found", "Record not found or already deleted.");
    return ok(data as Row);
  }

  async softDelete(ctx: AuditContext, id: string): Promise<Result<true>> {
    const { error } = await db()
      .from(this.table)
      .update({ deleted_at: new Date().toISOString(), deleted_by: ctx.userId ?? null })
      .eq("organization_id", ctx.organizationId)
      .eq("id", id)
      .is("deleted_at", null);
    if (error) return mapPgError(error);
    return ok(true);
  }
}
