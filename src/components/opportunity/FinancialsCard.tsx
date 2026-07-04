import { Wallet, TrendingUp, TrendingDown, Banknote } from "lucide-react";
import { WorkspaceCard, MetricTile } from "./primitives";
import { formatCurrencyCompact } from "./format";
import type { FinancialSummary } from "./types";

export function FinancialsCard({ financials }: { financials: FinancialSummary }) {
  const f = financials;
  return (
    <WorkspaceCard title="Financials" icon={<Wallet className="size-4" />}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <MetricTile label="Pipeline Value" value={formatCurrencyCompact(f.pipelineValue, f.currency)} tone="brand" icon={<Banknote className="size-4" />} />
        <MetricTile label="Expected Revenue" value={formatCurrencyCompact(f.expectedRevenue, f.currency)} tone="success" icon={<TrendingUp className="size-4" />} />
        <MetricTile label="Actual Revenue" value={formatCurrencyCompact(f.actualRevenue, f.currency)} />
        <MetricTile label="Institution Receivable" value={formatCurrencyCompact(f.institutionReceivable, f.currency)} />
        <MetricTile label="Payables" value={formatCurrencyCompact(f.payables, f.currency)} tone={f.payables > 0 ? "warning" : "neutral"} icon={<TrendingDown className="size-4" />} />
        <MetricTile label="Profitability" value={formatCurrencyCompact(f.profitability, f.currency)} tone="success" />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Figures are immutable snapshots; realised values populate as the deal progresses through revenue &amp; settlement.
      </p>
    </WorkspaceCard>
  );
}
