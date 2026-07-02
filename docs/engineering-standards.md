# RCLIP Engineering Standards

## Migrations (Supabase / PostgreSQL)

1. **One engine, one set**: `schema` → `seed` → `rls` (→ `patch` only if a shipped set needs a fix).
   File name: `<timestamp>_rclip_<phase>_<engine>_<part>.sql`.
2. **Idempotent & re-runnable**: `create table if not exists`, `create index if not exists`,
   `create or replace function`, `drop policy if exists` before `create policy`,
   `on conflict ... do nothing` for seeds. Never assume a clean database.
3. **Circular / audit FKs**: create all tables first, then add FKs via the
   `public.rc_add_fk(constraint_name, ddl)` helper.
4. **Triggers**: use `public.rc_set_updated_at_versioned()` for `updated_at` + optimistic `version`.
   Business codes and normalization run in dedicated `before insert/update` triggers.
5. **RLS**: enable on every table. Wrap helper calls as `(select public.rc_has_permission('x'))`
   for planner init-plan caching. SELECT policies must include `deleted_at is null`.
   Deny hard `DELETE` to app users (soft delete only); `service_role` bypasses RLS.
6. **Never edit a shipped migration** — add a new patch migration instead (protects Lovable sync
   and any already-applied environments).

## TypeScript / App layer

- **Types**: regenerate `src/integrations/supabase/types.ts` via `npm run db:types` after each
  migration set. Until a table is in the generated type, declare domain Row/Insert/Update shapes
  under `src/types/<engine>.ts` and access through the `db()` accessor in `repository.ts`.
- **Services return `Result<T>`** — never throw across the service boundary; normalize infra
  faults with `toAppError`.
- **Repositories extend `BaseRepository`** — tenant scope, audit stamping, soft delete, pagination
  are inherited; don't re-implement them.
- **Validation with Zod** — reuse `src/lib/validation/primitives.ts` and the Condition Grammar;
  keep client validation aligned with DB CHECK constraints.
- **Permissions**: client checks (`can(...)`) are UX affordances only. RLS is the security boundary.
- **No `any`** (enforced by ESLint). Prefer `unknown` + narrowing. Prettier: 100 cols, double
  quotes, semicolons, trailing commas.

## Deployability

- The public marketing site must never break. CRM features live under `/crm` behind auth guards.
- Every commit leaves `npm run build` and `npm run lint` green.
- Backend engine work (migrations + types + repo/service) ships independently of UI surface.
