import { Building2, MapPin, Briefcase, Star, Users } from "lucide-react";
import { WorkspaceCard, StatusChip } from "./primitives";
import { formatCurrencyCompact, formatDate } from "./format";
import type { Opportunity } from "./types";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

export function ClientSummaryCard({ opportunity }: { opportunity: Opportunity }) {
  const c = opportunity.client;
  return (
    <WorkspaceCard title="Client Summary" icon={<Building2 className="size-4" />} updatedAgo="1d">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {c.kind === "entity" ? <Building2 className="size-5" /> : <Users className="size-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{c.name}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {c.classification && <StatusChip label={c.classification} tone="brand" />}
            {c.strength && <StatusChip label={c.strength} tone="success" dot={false} />}
          </div>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        <Field
          label="Industry"
          value={
            <span className="flex items-center gap-1.5">
              <Briefcase className="size-3.5 text-muted-foreground" />
              {c.industry ?? "—"}
            </span>
          }
        />
        <Field
          label="Location"
          value={
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5 text-muted-foreground" />
              {c.city ?? "—"}
            </span>
          }
        />
        <Field label="Engagement Model" value={opportunity.engagementModel} />
        <Field label="Objective" value={opportunity.objective} />
        <Field label="Acquisition Channel" value={opportunity.acquisitionChannel} />
        <Field label="Introduced By" value={opportunity.introducedBy ?? "—"} />
        <Field
          label="Lifetime Business"
          value={
            <span className="flex items-center gap-1.5">
              <Star className="size-3.5 text-amber-500" />
              {c.totalBusinessValue ? formatCurrencyCompact(c.totalBusinessValue) : "—"}
            </span>
          }
        />
        <Field label="Last Interaction" value={c.lastInteraction ? formatDate(c.lastInteraction) : "—"} />
      </dl>

      {opportunity.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5 border-t pt-3">
          {opportunity.tags.map((t) => (
            <StatusChip key={t} label={t} tone="neutral" dot={false} />
          ))}
        </div>
      )}
    </WorkspaceCard>
  );
}
