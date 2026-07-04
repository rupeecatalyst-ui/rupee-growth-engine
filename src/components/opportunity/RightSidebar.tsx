import { CalendarClock, Users2, Eye, Route } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AICopilotCard } from "./AICopilotCard";
import { StatusChip } from "./primitives";
import { formatDate } from "./format";
import type { Opportunity } from "./types";

function Block({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-card">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export function RightSidebar({ opportunity }: { opportunity: Opportunity }) {
  return (
    <aside className="hidden w-80 shrink-0 border-l bg-card/40 2xl:block">
      <div className="sticky top-12 flex h-[calc(100vh-3rem)] flex-col gap-4 overflow-y-auto p-4">
        <AICopilotCard suggestions={opportunity.ai.slice(0, 3)} />

        <Block title="Key Dates" icon={<CalendarClock className="size-4" />}>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Created</dt>
              <dd className="font-medium">{formatDate(opportunity.createdAt)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Last Updated</dt>
              <dd className="font-medium">{formatDate(opportunity.updatedAt)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Expected Close</dt>
              <dd className="font-medium">{formatDate(opportunity.expectedCloseDate)}</dd>
            </div>
          </dl>
        </Block>

        <Block title="Coverage Team" icon={<Users2 className="size-4" />}>
          <ul className="space-y-2.5">
            {opportunity.coverageTeam.map((m) => (
              <li key={m.id} className="flex items-center gap-2.5">
                <Avatar className="size-8">
                  <AvatarFallback className="text-xs">{m.initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium leading-tight">{m.name}</p>
                  <p className="truncate text-xs leading-tight text-muted-foreground">{m.teamRole}</p>
                </div>
                {m.isPrimary && <StatusChip label="Primary" tone="brand" dot={false} />}
              </li>
            ))}
          </ul>
        </Block>

        <Block title="Pipeline Source" icon={<Route className="size-4" />}>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Channel</dt>
              <dd className="text-right font-medium">{opportunity.acquisitionChannel}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Introduced By</dt>
              <dd className="text-right font-medium">{opportunity.introducedBy ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Objective</dt>
              <dd className="text-right font-medium">{opportunity.objective}</dd>
            </div>
          </dl>
        </Block>

        <Block title="Watchers" icon={<Eye className="size-4" />}>
          <ul className="space-y-2">
            {opportunity.watchers.map((w) => (
              <li key={w.id} className="flex items-center gap-2.5">
                <Avatar className="size-7">
                  <AvatarFallback className="text-[10px]">{w.initials}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{w.name}</span>
              </li>
            ))}
          </ul>
        </Block>
      </div>
    </aside>
  );
}
