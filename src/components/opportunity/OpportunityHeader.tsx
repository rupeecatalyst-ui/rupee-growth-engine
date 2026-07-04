import { ChevronRight, Copy, Lock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { InitialsAvatar } from "./infra/Avatar";
import { HealthIndicator, PriorityPill, StatusChip } from "./primitives";
import type { Opportunity, OpportunityStatus } from "./types";

const statusTone: Record<OpportunityStatus, Parameters<typeof StatusChip>[0]["tone"]> = {
  open: "info",
  on_hold: "warning",
  won: "success",
  lost: "error",
  cancelled: "neutral",
};

function StageStepper({ stages }: { stages: Opportunity["stages"] }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {stages.map((s, i) => (
        <div key={s.code} className="flex items-center gap-1">
          <div
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium",
              s.state === "done" && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
              s.state === "current" && "bg-primary text-primary-foreground",
              s.state === "upcoming" && "bg-muted text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "flex size-4 items-center justify-center rounded-full text-[10px] tabular-nums",
                s.state === "current" ? "bg-primary-foreground/20" : "bg-background/40",
              )}
            >
              {i + 1}
            </span>
            {s.name}
          </div>
          {i < stages.length - 1 && <ChevronRight className="size-3 shrink-0 text-muted-foreground/50" />}
        </div>
      ))}
    </div>
  );
}

export function OpportunityHeader({ opportunity }: { opportunity: Opportunity }) {
  return (
    <header className="border-b bg-card/80 px-4 py-3 backdrop-blur-md sm:px-6">
      <nav className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link to="/crm" className="rounded outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60">
          Command Center
        </Link>
        <ChevronRight className="size-3" />
        <Link
          to="/crm/opportunities"
          className="rounded outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          Opportunities
        </Link>
        <ChevronRight className="size-3" />
        <span className="font-medium text-foreground">{opportunity.code}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
              {opportunity.code}
              <Copy className="size-3 cursor-pointer hover:text-foreground" />
            </span>
            {opportunity.confidentiality === "restricted" && (
              <StatusChip label="Restricted" tone="error" dot={false} />
            )}
          </div>
          <h1 className="mt-1 truncate text-lg font-semibold sm:text-xl">{opportunity.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusChip label={opportunity.status.replace("_", " ")} tone={statusTone[opportunity.status]} />
            <HealthIndicator status={opportunity.health} score={opportunity.healthScore} />
            <PriorityPill priority={opportunity.priority} />
            <StatusChip label={opportunity.type} tone="neutral" dot={false} />
            <StatusChip label={opportunity.engagementModel} tone="brand" dot={false} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-xs text-muted-foreground">Watchers</p>
            <div className="mt-1 flex -space-x-2">
              {opportunity.watchers.map((w) => (
                <Tooltip key={w.id}>
                  <TooltipTrigger asChild>
                    <InitialsAvatar name={w.name} initials={w.initials} className="size-7 border-2 border-card" />
                  </TooltipTrigger>
                  <TooltipContent>{w.name}</TooltipContent>
                </Tooltip>
              ))}
              <span className="flex size-7 items-center justify-center rounded-full border-2 border-card bg-muted text-muted-foreground">
                <Lock className="size-3" />
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <StageStepper stages={opportunity.stages} />
      </div>
    </header>
  );
}
