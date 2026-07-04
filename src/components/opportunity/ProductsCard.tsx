import { Layers, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkspaceCard, StatusChip, EmptyState, type Tone } from "./primitives";
import { formatCurrencyCompact } from "./format";
import type { OpportunityProduct } from "./types";

const subStatusTone: Record<OpportunityProduct["subStatus"], Tone> = {
  active: "success",
  converted: "brand",
  dropped: "neutral",
};

export function ProductsCard({ products }: { products: OpportunityProduct[] }) {
  return (
    <WorkspaceCard
      title="Products"
      icon={<Layers className="size-4" />}
      count={products.length}
      actions={
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
          <Plus className="size-3.5" /> Add
        </Button>
      }
    >
      {products.length === 0 ? (
        <EmptyState icon={<Layers className="size-6" />} title="No products yet" description="Add one or more products to this opportunity." />
      ) : (
        <ul className="divide-y">
          {products.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{p.name}</span>
                  {p.isPrimary && <StatusChip label="Primary" tone="brand" dot={false} />}
                </div>
                <p className="text-xs text-muted-foreground">
                  {p.tenureMonths ? `${p.tenureMonths} months tenure` : "Tenure —"}
                </p>
              </div>
              <div className="flex items-center gap-3 text-right">
                <span className="text-sm font-semibold tabular-nums">{formatCurrencyCompact(p.requestedAmount)}</span>
                <StatusChip label={p.subStatus} tone={subStatusTone[p.subStatus]} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </WorkspaceCard>
  );
}
