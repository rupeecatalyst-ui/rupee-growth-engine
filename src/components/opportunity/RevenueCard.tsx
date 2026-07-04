import { IndianRupee, CircleDollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkspaceCard, EmptyState } from "./primitives";
import { formatCurrencyCompact } from "./format";
import type { FinancialSummary } from "./types";

export function RevenueCard({ financials }: { financials: FinancialSummary }) {
  const expected = financials.expectedRevenue;
  const actual = financials.actualRevenue;
  const pct = expected > 0 ? Math.round((actual / expected) * 100) : 0;

  return (
    <WorkspaceCard title="Revenue" icon={<IndianRupee className="size-4" />}>
      {expected === 0 && actual === 0 ? (
        <EmptyState
          icon={<CircleDollarSign className="size-6" />}
          title="No revenue recognised yet"
          description="Revenue is generated automatically once the transaction is sanctioned or disbursed."
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border bg-card p-3">
              <p className="text-xs text-muted-foreground">Expected</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatCurrencyCompact(expected)}
              </p>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <p className="text-xs text-muted-foreground">Realised</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">{formatCurrencyCompact(actual)}</p>
            </div>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Realisation</span>
              <span className="tabular-nums">{pct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className={cn("h-full rounded-full bg-emerald-500 transition-all")} style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      )}
    </WorkspaceCard>
  );
}
