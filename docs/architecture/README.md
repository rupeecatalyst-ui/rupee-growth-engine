# RCLIP Enterprise Architecture — Index

**RCLIP** is the Rupee Catalyst Investment Banking & Capital Advisory Platform. The
backend is organized into independent, dependency-ordered **engines**. Each engine
owns its tables, seed data, and RLS policies, and is delivered as a self-contained,
idempotent migration set.

## Engine status

| #   | Engine                                          | Phase | Migrations                | Status       |
| --- | ----------------------------------------------- | ----- | ------------------------- | ------------ |
| 1   | Identity & Access                               | P1    | `20260702110000`–`110005` | ✅ Shipped   |
| 2   | Relationship Engine ("Everything is a Contact") | P2A   | `20260702120000`–`120002` | ✅ Shipped   |
| 3   | Product Intelligence                            | P2B   | `20260702130000`–`130002` | 🟡 In review |
| 4   | Capital Provider Intelligence                   | P2C   | —                         | ⏳ Designed  |
| 5   | Financial Party                                 | P4-0  | —                         | ⏳ Designed  |
| 6   | Opportunity & Deal Execution                    | P3    | —                         | ⏳ Designed  |
| 7   | Revenue, Commission & Settlement                | P4    | —                         | ⏳ Designed  |
| 8   | Analytics & BI                                  | P5    | —                         | ⏳ Designed  |

## Global conventions

- **UUID** primary keys (`gen_random_uuid()`), `<referenced_singular>_id` foreign keys.
- **Multi-tenancy** via `organization_id` + Row Level Security on every tenant table.
- **Audit set** on every table: `created_at/by`, `updated_at/by`, `deleted_at/by`, `version`.
- **Soft delete** (`deleted_at`); SELECT policies always filter `deleted_at IS NULL`.
- **Effective dating** (`effective_from`/`effective_to`, `*_version`) on all rule/rate tables; history is never overwritten.
- **Config over code**: rules are stored as `jsonb` and evaluated by the shared
  [Condition Grammar](../../src/lib/validation/condition-grammar.ts). No business logic is hardcoded.
- **Money** as `numeric(15,2)`; timestamps as `timestamptz`.
- **Naming**: `fk_` / `idx_` / `uq_` / `chk_` / `trg_` prefixes; helper functions `rc_*`.
- **Business codes**: `RC-CNT-######` (contacts), `RC-PRD-######` (products), etc.

## Application layers

```
routes / loaders  →  services (Result<T>)  →  repositories (BaseRepository)  →  Supabase (RLS)
                         ↑ validation (Zod)        ↑ tenant scope + audit + soft delete
```

- `src/lib/service/result.ts` — `Result<T>` + `AppError` conventions.
- `src/lib/service/permissions.ts` — client-side permission catalog (RLS is the real boundary).
- `src/lib/db/repository.ts` — `BaseRepository` (tenant scope, audit, pagination, soft delete).
- `src/lib/validation/` — shared Zod primitives + the Condition Grammar.

See [engineering-standards.md](../engineering-standards.md) and
[migration-runbook.md](../migration-runbook.md).
