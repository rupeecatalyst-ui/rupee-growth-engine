import { createFileRoute } from "@tanstack/react-router";
import { IndianRupee, TrendingUp, Target, Trophy, CalendarRange, SlidersHorizontal } from "lucide-react";
import Layout from "@/components/crm/Layout";
import { KpiCard } from "@/components/crm/KpiCard";
import { Panel } from "@/components/crm/ui-bits";
import { Button } from "@/components/ui/button";
import {
  ActivityFeed,
  CapitalProvidersList,
  PipelineStageChart,
  ProductMixDonut,
  RevenueTrendChart,
  TopOpportunitiesTable,
} from "@/components/crm/DashboardWidgets";
import { kpis } from "@/data/crm-demo";

export const Route = createFileRoute("/crm/")({
  component: CommandCenter,
});

const kpiIcons = { pipeline: IndianRupee, revenue: TrendingUp, deals: Target, winrate: Trophy } as const;

function CommandCenter() {
  return (
    <Layout title="Command Center">
      {/* Greeting */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Good afternoon, Rahul</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's the state of the book — Friday, 3 July 2026.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <CalendarRange className="size-4" /> This Quarter
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <SlidersHorizontal className="size-4" /> Filters
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard
            key={k.key}
            label={k.label}
            value={k.value}
            delta={k.delta}
            deltaLabel={k.deltaLabel}
            trend={k.trend}
            accent={k.accent}
            icon={kpiIcons[k.key as keyof typeof kpiIcons]}
          />
        ))}
      </div>

      {/* Revenue + product mix */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="Revenue — Projected vs Realised"
          subtitle="Trailing 12 months (₹ Cr)"
          action={
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="size-2 rounded-full bg-royal" /> Projected
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="size-2 rounded-full bg-emerald" /> Realised
              </span>
            </div>
          }
        >
          <RevenueTrendChart />
        </Panel>
        <Panel title="Product Mix" subtitle="Share of active pipeline">
          <ProductMixDonut />
        </Panel>
      </div>

      {/* Opportunities + activity */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="Top Opportunities"
          subtitle="Highest-value live deals"
          bodyClassName="p-0"
          action={
            <Button variant="ghost" size="sm" className="text-xs">
              View all
            </Button>
          }
        >
          <div className="px-2 py-1">
            <TopOpportunitiesTable />
          </div>
        </Panel>
        <Panel title="Live Activity" subtitle="Across the platform">
          <ActivityFeed />
        </Panel>
      </div>

      {/* Pipeline + providers */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Pipeline by Stage" subtitle="Value distribution (₹ Cr)">
          <PipelineStageChart />
        </Panel>
        <Panel title="Capital Providers" subtitle="Top partners by activity">
          <CapitalProvidersList />
        </Panel>
      </div>
    </Layout>
  );
}
