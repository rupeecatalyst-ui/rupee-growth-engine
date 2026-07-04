// RCLIP — Opportunity Workspace · shared UI primitives (Design System V1.0).
// Reusable, presentational only. No business logic, no data fetching.
import { useState, type ReactNode } from "react";
import { ChevronDown, RefreshCw, CircleCheck, CircleAlert, CircleX, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { HealthStatus, PriorityCode } from "./types";

/* -------------------------------------------------------------------------- */
/* Semantic tone → classes (color used only as signal, per Design System)     */
/* -------------------------------------------------------------------------- */
export type Tone = "neutral" | "success" | "warning" | "error" | "info" | "brand";

const toneChip: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  error: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  info: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  brand: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
};

const toneDot: Record<Tone, string> = {
  neutral: "bg-muted-foreground",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
  info: "bg-blue-500",
  brand: "bg-indigo-500",
};

/* -------------------------------------------------------------------------- */
/* StatusChip                                                                 */
/* -------------------------------------------------------------------------- */
export function StatusChip({
  label,
  tone = "neutral",
  dot = true,
  className,
}: {
  label: string;
  tone?: Tone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        toneChip[tone],
        className,
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", toneDot[tone])} />}
      {label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* HealthIndicator                                                            */
/* -------------------------------------------------------------------------- */
const healthMap: Record<HealthStatus, { tone: Tone; label: string; icon: ReactNode }> = {
  healthy: { tone: "success", label: "Healthy", icon: <CircleCheck className="size-3.5" /> },
  watch: { tone: "warning", label: "Watch", icon: <Circle className="size-3.5" /> },
  at_risk: { tone: "warning", label: "At Risk", icon: <CircleAlert className="size-3.5" /> },
  critical: { tone: "error", label: "Critical", icon: <CircleX className="size-3.5" /> },
};

export function HealthIndicator({ status, score }: { status: HealthStatus; score?: number }) {
  const h = healthMap[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium",
        toneChip[h.tone],
      )}
      title={score != null ? `Health score: ${score}/100` : undefined}
    >
      {h.icon}
      {h.label}
      {score != null && <span className="tabular-nums opacity-70">· {score}</span>}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* PriorityPill                                                               */
/* -------------------------------------------------------------------------- */
const priorityMap: Record<PriorityCode, Tone> = {
  critical: "error",
  high: "warning",
  medium: "info",
  low: "neutral",
};

export function PriorityPill({ priority }: { priority: PriorityCode }) {
  const label = priority.charAt(0).toUpperCase() + priority.slice(1);
  return <StatusChip label={label} tone={priorityMap[priority]} />;
}

/* -------------------------------------------------------------------------- */
/* ReadinessRing (pure SVG gauge)                                             */
/* -------------------------------------------------------------------------- */
export function ReadinessRing({
  value,
  size = 96,
  stroke = 8,
  label = "Ready",
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const offset = c - (pct / 100) * c;
  const color = pct >= 80 ? "text-emerald-500" : pct >= 40 ? "text-amber-500" : "text-red-500";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="fill-none stroke-muted" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className={cn("fill-none transition-[stroke-dashoffset] duration-500", color)}
          style={{ stroke: "currentColor" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-semibold tabular-nums">{Math.round(pct)}%</span>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* MetricTile                                                                 */
/* -------------------------------------------------------------------------- */
export function MetricTile({
  label,
  value,
  hint,
  tone,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: Tone;
  icon?: ReactNode;
}) {
  const valueTone: Record<Tone, string> = {
    neutral: "text-foreground",
    success: "text-emerald-600 dark:text-emerald-400",
    warning: "text-amber-600 dark:text-amber-400",
    error: "text-red-600 dark:text-red-400",
    info: "text-blue-600 dark:text-blue-400",
    brand: "text-indigo-600 dark:text-indigo-400",
  };
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <div className={cn("mt-1 text-xl font-semibold tabular-nums", tone ? valueTone[tone] : "text-foreground")}>
        {value}
      </div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* EmptyState                                                                 */
/* -------------------------------------------------------------------------- */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-10 text-center">
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="max-w-xs text-xs text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* WorkspaceCard — the standard card contract (title, actions, collapse)      */
/* -------------------------------------------------------------------------- */
export function WorkspaceCard({
  title,
  icon,
  count,
  updatedAgo,
  actions,
  children,
  defaultOpen = true,
  onRefresh,
  className,
}: {
  title: string;
  icon?: ReactNode;
  count?: number;
  updatedAgo?: string;
  actions?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  onRefresh?: () => void;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className={cn("rounded-xl border bg-card shadow-card", className)}>
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <CollapsibleTrigger asChild>
            <button
              className="flex items-center gap-2 rounded text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              aria-label={open ? "Collapse section" : "Expand section"}
            >
              <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", !open && "-rotate-90")} />
              {icon && <span className="text-muted-foreground">{icon}</span>}
              <h3 className="truncate text-sm font-semibold">{title}</h3>
            </button>
          </CollapsibleTrigger>
          {count != null && (
            <Badge variant="secondary" className="tabular-nums">
              {count}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {updatedAgo && <span className="hidden text-xs text-muted-foreground sm:inline">Updated {updatedAgo}</span>}
          {onRefresh && (
            <Button variant="ghost" size="icon" className="size-7" onClick={onRefresh} aria-label="Refresh">
              <RefreshCw className="size-3.5" />
            </Button>
          )}
          {actions}
        </div>
      </div>
      <CollapsibleContent>
        <div className="border-t px-4 py-4">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
