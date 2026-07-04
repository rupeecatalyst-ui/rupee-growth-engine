import { Gauge, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkspaceCard, ReadinessRing } from "./primitives";
import type { ReadinessDimension } from "./types";

function barColor(score: number, threshold: number) {
  if (score >= threshold) return "bg-emerald-500";
  if (score >= threshold * 0.7) return "bg-amber-500";
  return "bg-red-500";
}

export function ReadinessCard({
  dimensions,
  overall,
}: {
  dimensions: ReadinessDimension[];
  overall: number;
}) {
  return (
    <WorkspaceCard title="Readiness" icon={<Gauge className="size-4" />}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex shrink-0 justify-center sm:w-32">
          <ReadinessRing value={overall} />
        </div>
        <div className="flex-1 space-y-2.5">
          {dimensions.map((d) => {
            const passed = d.score >= d.passThreshold;
            return (
              <div key={d.code}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium">
                    {d.gating && <Lock className={cn("size-3", passed ? "text-emerald-500" : "text-red-500")} />}
                    {d.name}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {d.score}
                    <span className="opacity-60"> / {d.passThreshold}</span>
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full transition-all", barColor(d.score, d.passThreshold))}
                    style={{ width: `${Math.min(100, d.score)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </WorkspaceCard>
  );
}
