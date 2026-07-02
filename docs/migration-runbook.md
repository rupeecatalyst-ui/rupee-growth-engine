# RCLIP Migration Runbook

Migrations live in `supabase/migrations/` and are applied in filename (timestamp) order.

## Apply migrations

### Against the linked cloud project

```bash
supabase link --project-ref <your-project-ref>   # once
supabase db push                                  # applies pending migrations
```

### Against a local stack (for testing)

```bash
supabase start
supabase db reset      # re-runs every migration from scratch (verifies idempotency)
```

## Regenerate TypeScript types (after every migration set)

```bash
npm run db:types          # linked cloud project
npm run db:types:local    # local stack
```

> **Windows / PowerShell caveat:** PowerShell's `>` writes UTF‑16, which corrupts
> `types.ts`. Run the script in **Git Bash / WSL**, or pipe explicitly:
> `supabase gen types typescript --linked --schema public | Out-File -Encoding utf8 src/integrations/supabase/types.ts`.

## Verify before committing

```bash
npm run lint
npm run typecheck
npm run build
```

## Current sets

| Order | Set                             | Files                     |
| ----- | ------------------------------- | ------------------------- |
| 1     | Phase 1 · Identity & Access     | `20260702110000`–`110005` |
| 2     | Phase 2A · Relationship Engine  | `20260702120000`–`120002` |
| 3     | Phase 2B · Product Intelligence | `20260702130000`–`130002` |

## Notes

- Migrations are idempotent; re-running is safe.
- Never rewrite a shipped migration — add a `*_patch.sql` follow-up.
- Secrets: `.env` is gitignored. The `SUPABASE_SERVICE_ROLE_KEY` is server-only and must
  never be committed or exposed to the client bundle.
