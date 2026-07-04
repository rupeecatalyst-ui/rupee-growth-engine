import { Gauge, IndianRupee, Layers, Building2, CalendarClock } from "lucide-react";
import { WorkspaceCard, MetricTile } from "./primitives";
import { formatCurrencyCompact, formatDate } from "./format";
import type { Opportunity } from "./types";

export function KeyMetricsCard({ opportunity }: { opportunity: Opportunity }) {
  const activeTracks = opportunity.institutionTracks.filter(
    (t) => t.status !== "rejected" && t.status !== "withdrawn",
  ).length;

  return (
    <WorkspaceCard title="Key Metrics" icon={<Gauge className="size-4" />}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricTile
          label="Pipeline Value"
          value={formatCurrencyCompact(opportunity.financials.pipelineValue)}
          icon={<IndianRupee className="size-4" />}
          tone="brand"
        />
        <MetricTile
          label="Expected Revenue"
          value={formatCurrencyCompact(opportunity.financials.expectedRevenue)}
          icon={<IndianRupee className="size-4" />}
          tone="success"
        />
        <MetricTile
          label="Products"
          value={opportunity.products.length}
          hint={`${opportunity.products.filter((p) => p.subStatus === "active").length} active`}
          icon={<Layers className="size-4" />}
        />
        <MetricTile
          label="Active Institutions"
          value={activeTracks}
          hint={`${opportunity.institutionTracks.length} total`}
          icon={<Building2 className="size-4" />}
        />
        <MetricTile
          label="Readiness"
          value={`${opportunity.overallReadiness}%`}
          icon={<Gauge className="size-4" />}
          tone={opportunity.overallReadiness >= 80 ? "success" : opportunity.overallReadiness >= 40 ? "warning" : "error"}
        />
        <MetricTile label="Health Score" value={`${opportunity.healthScore}`} hint="out of 100" tone="warning" />
        <MetricTile
          label="Expected Close"
          value={formatDate(opportunity.expectedCloseDate)}
          icon={<CalendarClock className="size-4" />}
        />
        <MetricTile label="Version" value={`v${opportunity.version}`} hint="append-only" />
      </div>
    </WorkspaceCard>
  );
}
