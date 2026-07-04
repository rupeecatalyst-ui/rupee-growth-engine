// RCLIP — Live data states (Sprint 4.2).
// Loading skeletons + friendly error cards shown while the five live sections
// fetch from Supabase. They reuse the same WorkspaceCard/header chrome so the
// frozen layout never shifts between loading, error, and loaded states.
import type { ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkspaceCard } from "@/components/opportunity/primitives";

/* -------------------------------------------------------------------------- */
/* Card-level states (used by the WorkspaceCard-based sections)               */
/* -------------------------------------------------------------------------- */

export function CardSkeleton({
  title,
  icon,
  rows = 4,
}: {
  title: string;
  icon?: ReactNode;
  rows?: number;
}) {
  return (
    <WorkspaceCard title={title} icon={icon}>
      <div className="space-y-3" aria-busy="true" aria-live="polite">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </WorkspaceCard>
  );
}

export function CardError({
  title,
  icon,
  onRetry,
  isRetrying,
}: {
  title: string;
  icon?: ReactNode;
  onRetry?: () => void;
  isRetrying?: boolean;
}) {
  return (
    <WorkspaceCard title={title} icon={icon}>
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 py-8 text-center">
        <AlertTriangle className="size-6 text-amber-500" />
        <p className="text-sm font-medium">Couldn't load {title.toLowerCase()}</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          We couldn't reach the server. This is usually temporary — please try again.
        </p>
        {onRetry && (
          <Button variant="outline" size="sm" className="mt-1 gap-1.5" onClick={onRetry} disabled={isRetrying}>
            <RefreshCw className={isRetrying ? "size-3.5 animate-spin" : "size-3.5"} />
            Retry
          </Button>
        )}
      </div>
    </WorkspaceCard>
  );
}

/* -------------------------------------------------------------------------- */
/* Header-level states (the header is not a WorkspaceCard)                    */
/* -------------------------------------------------------------------------- */

export function HeaderSkeleton() {
  return (
    <header className="border-b bg-card/80 px-4 py-3 backdrop-blur-md sm:px-6" aria-busy="true">
      <Skeleton className="mb-2 h-3 w-56" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-6 w-72" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
        <Skeleton className="hidden h-9 w-28 sm:block" />
      </div>
      <div className="mt-3 flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-24 rounded-full" />
        ))}
      </div>
    </header>
  );
}

export function HeaderError({ onRetry, isRetrying }: { onRetry?: () => void; isRetrying?: boolean }) {
  return (
    <header className="border-b bg-card/80 px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <AlertTriangle className="size-5 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-semibold">Couldn't load this opportunity</p>
            <p className="text-xs text-muted-foreground">
              We couldn't reach the server. This is usually temporary — please try again.
            </p>
          </div>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onRetry} disabled={isRetrying}>
            <RefreshCw className={isRetrying ? "size-3.5 animate-spin" : "size-3.5"} />
            Retry
          </Button>
        )}
      </div>
    </header>
  );
}
