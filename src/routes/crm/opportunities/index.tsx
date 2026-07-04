import { createFileRoute, Link } from "@tanstack/react-router";
import { LayoutGrid, List, Plus, SlidersHorizontal } from "lucide-react";
import Layout from "@/components/crm/Layout";
import { Button } from "@/components/ui/button";
import { PipelineBoard } from "@/components/crm/PipelineBoard";
import { pipelineBoard } from "@/data/crm-demo";

export const Route = createFileRoute("/crm/opportunities/")({
  component: PipelinePage,
});

function PipelinePage() {
  const totalDeals = pipelineBoard.reduce((s, c) => s + c.cards.length, 0);

  return (
    <Layout title="Opportunities" contained={false}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Deal Pipeline</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalDeals} live opportunities across {pipelineBoard.length} stages · ₹1,284 Cr in play
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border bg-card p-0.5">
            <Button size="sm" variant="ghost" className="h-7 gap-1.5 bg-muted text-xs">
              <LayoutGrid className="size-3.5" /> Board
            </Button>
            <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-xs text-muted-foreground">
              <List className="size-3.5" /> Table
            </Button>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5">
            <SlidersHorizontal className="size-4" /> Filters
          </Button>
          <Button size="sm" className="gap-1.5" asChild>
            <Link to="/crm/opportunities/new">
              <Plus className="size-4" /> New Opportunity
            </Link>
          </Button>
        </div>
      </div>

      <PipelineBoard />
    </Layout>
  );
}
