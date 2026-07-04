import { Sparkles, FileSearch, AlertTriangle, Lightbulb, ListChecks, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkspaceCard } from "./primitives";
import type { AISuggestion } from "./types";

const kindMeta: Record<AISuggestion["kind"], { icon: LucideIcon; ring: string }> = {
  summary: { icon: Sparkles, ring: "text-indigo-500" },
  missing: { icon: FileSearch, ring: "text-amber-500" },
  recommendation: { icon: Lightbulb, ring: "text-emerald-500" },
  risk: { icon: AlertTriangle, ring: "text-red-500" },
  follow_up: { icon: ListChecks, ring: "text-blue-500" },
};

export function AICopilotCard({ suggestions }: { suggestions: AISuggestion[] }) {
  return (
    <WorkspaceCard
      title="AI Copilot"
      icon={<Sparkles className="size-4 text-indigo-500" />}
      actions={
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
          <Sparkles className="size-3.5" /> Regenerate
        </Button>
      }
      className="bg-gradient-to-b from-indigo-500/[0.04] to-transparent"
    >
      <div className="space-y-3">
        {suggestions.map((s) => {
          const Icon = kindMeta[s.kind].icon;
          return (
            <div key={s.id} className="rounded-lg border bg-background/50 p-3">
              <div className="flex items-center gap-2">
                <Icon className={`size-4 ${kindMeta[s.kind].ring}`} />
                <p className="text-sm font-medium">{s.title}</p>
              </div>
              <p className="mt-1 pl-6 text-xs leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        AI-generated · verify before acting. No data leaves this workspace in the shell.
      </p>
    </WorkspaceCard>
  );
}
