import { Link } from "@tanstack/react-router";
import { Building2, GitBranch, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { HealthIndicator, PriorityPill } from "@/components/opportunity/primitives";
import { pipelineBoard, type PipelineCard as CardType } from "@/data/crm-demo";

function Card({ card }: { card: CardType }) {
  return (
    <Link
      to="/crm/opportunities/$id"
      params={{ id: card.code }}
      className="group block rounded-lg border bg-card p-3 shadow-sm outline-none transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] text-muted-foreground">{card.code}</span>
        <HealthIndicator status={card.health} />
      </div>
      <p className="mt-1.5 truncate text-sm font-semibold group-hover:text-primary">
        {card.client}
      </p>
      <p className="truncate text-xs text-muted-foreground">{card.title}</p>

      <div className="mt-2.5 flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
          <Building2 className="size-3" /> {card.product}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between border-t pt-2.5">
        <span className="font-display text-sm font-bold tabular-nums">{card.value}</span>
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-0.5 text-xs text-muted-foreground"
            title={`${card.tracks} institution tracks`}
          >
            <GitBranch className="size-3" /> {card.tracks}
          </span>
          <Avatar className="size-6">
            <AvatarFallback className="text-[10px]">{card.ownerInitials}</AvatarFallback>
          </Avatar>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <PriorityPill priority={card.priority} />
        <span className="text-[11px] text-muted-foreground">{card.updated}</span>
      </div>
    </Link>
  );
}

export function PipelineBoard() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {pipelineBoard.map((col) => {
        const total = col.cards.length;
        return (
          <div key={col.id} className="flex w-72 shrink-0 flex-col">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: col.accent }} />
                <h3 className="text-sm font-semibold">{col.label}</h3>
                <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums text-muted-foreground">
                  {total}
                </span>
              </div>
              <Link
                to="/crm/opportunities/new"
                className="rounded p-1 text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/70"
                aria-label={`Add opportunity to ${col.label}`}
              >
                <Plus className="size-4" />
              </Link>
            </div>
            <div
              className={cn(
                "flex-1 space-y-2.5 rounded-xl border border-dashed bg-muted/20 p-2.5",
                total === 0 && "flex items-center justify-center",
              )}
            >
              {col.cards.map((c) => (
                <Card key={c.code} card={c} />
              ))}
              {total === 0 && <p className="text-xs text-muted-foreground">No deals</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
