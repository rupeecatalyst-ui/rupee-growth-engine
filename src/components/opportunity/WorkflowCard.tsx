import { GitBranch, Lock, CircleCheck, Circle, CircleDot, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkspaceCard, StatusChip, EmptyState } from "./primitives";
import { formatDate, formatTime } from "./format";
import type { ReadinessDimension, StageHistoryEntry, StageStep } from "./types";

function StageRow({ stage, index }: { stage: StageStep; index: number }) {
  const icon =
    stage.state === "done" ? (
      <CircleCheck className="size-4 text-emerald-500" />
    ) : stage.state === "current" ? (
      <CircleDot className="size-4 text-primary" />
    ) : (
      <Circle className="size-4 text-muted-foreground/50" />
    );
  return (
    <li className="flex items-center gap-2.5">
      <span className="flex size-5 shrink-0 items-center justify-center text-[10px] tabular-nums text-muted-foreground">
        {index + 1}
      </span>
      {icon}
      <span
        className={cn(
          "text-sm",
          stage.state === "current" && "font-medium text-foreground",
          stage.state === "upcoming" && "text-muted-foreground",
        )}
      >
        {stage.name}
      </span>
    </li>
  );
}

export function WorkflowCard({
  stages,
  gates,
  history,
}: {
  stages: StageStep[];
  gates: ReadinessDimension[];
  history: StageHistoryEntry[];
}) {
  const gatingDimensions = gates.filter((g) => g.gating);
  const currentStage = stages.find((s) => s.state === "current");
  const doneCount = stages.filter((s) => s.state === "done").length;

  return (
    <div className="space-y-4">
      <WorkspaceCard title="Workflow" icon={<GitBranch className="size-4" />}>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Current stage</span>
          {currentStage ? (
            <StatusChip label={currentStage.name} tone="brand" />
          ) : (
            <StatusChip label="Not started" tone="neutral" dot={false} />
          )}
          {stages.length > 0 && (
            <span className="text-xs text-muted-foreground">
              · {doneCount}/{stages.length} completed
            </span>
          )}
        </div>

        {stages.length === 0 ? (
          <EmptyState icon={<GitBranch className="size-6" />} title="No workflow stages configured" />
        ) : (
          <ol className="space-y-2">
            {stages.map((s, i) => (
              <StageRow key={s.code} stage={s} index={i} />
            ))}
          </ol>
        )}
      </WorkspaceCard>

      <WorkspaceCard title="Readiness Gates" icon={<Lock className="size-4" />} count={gatingDimensions.length}>
        {gatingDimensions.length === 0 ? (
          <EmptyState
            icon={<Lock className="size-6" />}
            title="No gating requirements"
            description="No readiness dimension currently gates progression."
          />
        ) : (
          <ul className="space-y-2">
            {gatingDimensions.map((g) => {
              const passed = g.score >= g.passThreshold;
              return (
                <li key={g.code} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-sm">
                    <Lock className={cn("size-3.5", passed ? "text-emerald-500" : "text-red-500")} />
                    {g.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {g.score}
                      <span className="opacity-60"> / {g.passThreshold}</span>
                    </span>
                    <StatusChip label={passed ? "Passed" : "Blocked"} tone={passed ? "success" : "error"} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </WorkspaceCard>

      <WorkspaceCard title="Stage History" icon={<History className="size-4" />} count={history.length}>
        {history.length === 0 ? (
          <EmptyState
            icon={<History className="size-6" />}
            title="No stage changes yet"
            description="Every stage transition is recorded here, newest first."
          />
        ) : (
          <ol className="relative space-y-4 before:absolute before:left-[13px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-border">
            {history.map((h) => (
              <li key={h.id} className="relative flex gap-3">
                <span className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <GitBranch className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">
                      {h.fromStage ? `${h.fromStage} → ${h.toStage}` : h.toStage}
                    </p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(h.changedAt)} · {formatTime(h.changedAt)}
                    </span>
                  </div>
                  {h.reason && <p className="text-xs text-muted-foreground">{h.reason}</p>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </WorkspaceCard>
    </div>
  );
}
