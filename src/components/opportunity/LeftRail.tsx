import { cn } from "@/lib/utils";
import { InitialsAvatar } from "./infra/Avatar";
import { WORKSPACE_SECTIONS } from "./sections";
import type { Opportunity } from "./types";

export function LeftRail({
  activeSection,
  onSelect,
  opportunity,
}: {
  activeSection: string;
  onSelect: (id: string) => void;
  opportunity: Opportunity;
}) {
  const counts: Record<string, number> = {
    participants: opportunity.participants.length,
    products: opportunity.products.length,
    institutions: opportunity.institutionTracks.length,
    tasks: opportunity.tasks.filter((t) => t.status !== "done" && t.status !== "cancelled").length,
    documents: opportunity.documents.length,
    communications: opportunity.communications.length,
  };

  return (
    <aside className="hidden w-56 shrink-0 border-r bg-card/40 xl:block">
      <div className="sticky top-12 flex h-[calc(100vh-3rem)] flex-col">
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {WORKSPACE_SECTIONS.map((s) => {
            const Icon = s.icon;
            const active = activeSection === s.id;
            const count = counts[s.id];
            return (
              <button
                key={s.id}
                onClick={() => onSelect(s.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-inset",
                  active
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="flex-1 text-left">{s.label}</span>
                {count != null && count > 0 && (
                  <span
                    className={cn(
                      "min-w-5 rounded-full px-1.5 text-center text-xs tabular-nums",
                      active ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t p-3">
          <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">Coverage Team</p>
          <ul className="space-y-1.5">
            {opportunity.coverageTeam.slice(0, 4).map((m) => (
              <li key={m.id} className="flex items-center gap-2">
                <InitialsAvatar name={m.name} initials={m.initials} className="size-6" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium leading-tight">{m.name}</p>
                  <p className="truncate text-[11px] leading-tight text-muted-foreground">{m.teamRole}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
