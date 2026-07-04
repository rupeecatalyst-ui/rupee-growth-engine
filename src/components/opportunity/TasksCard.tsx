import { CheckSquare, Plus, Building2, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { WorkspaceCard, StatusChip, PriorityPill, EmptyState, type Tone } from "./primitives";
import { formatDate } from "./format";
import type { TaskItem } from "./types";

const originLabel: Record<TaskItem["origin"], { label: string; tone: Tone }> = {
  manual: { label: "Manual", tone: "neutral" },
  workflow: { label: "Workflow", tone: "info" },
  institution_reply: { label: "Institution", tone: "brand" },
  missing_documents: { label: "Docs", tone: "warning" },
  ai: { label: "AI", tone: "brand" },
};

const statusLabel: Record<TaskItem["status"], { label: string; tone: Tone }> = {
  open: { label: "Open", tone: "info" },
  in_progress: { label: "In Progress", tone: "warning" },
  done: { label: "Done", tone: "success" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

export function TasksCard({ tasks }: { tasks: TaskItem[] }) {
  const open = tasks.filter((t) => t.status !== "done" && t.status !== "cancelled");
  return (
    <WorkspaceCard
      title="Tasks"
      icon={<CheckSquare className="size-4" />}
      count={open.length}
      actions={
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
          <Plus className="size-3.5" /> New
        </Button>
      }
    >
      {tasks.length === 0 ? (
        <EmptyState icon={<CheckSquare className="size-6" />} title="No tasks" description="Create a task or let the workflow generate one." />
      ) : (
        <ul className="space-y-1">
          {tasks.map((t) => {
            const done = t.status === "done";
            const origin = originLabel[t.origin];
            const status = statusLabel[t.status];
            return (
              <li key={t.id} className="flex items-start gap-2.5 rounded-md px-1 py-1.5 hover:bg-muted/50">
                <Checkbox checked={done} disabled className="mt-0.5" aria-label={`${t.title} — ${status.label}`} />
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm", done && "text-muted-foreground line-through")}>{t.title}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{t.assignee}</span>
                    {t.dueDate && <span>· Due {formatDate(t.dueDate)}</span>}
                  </div>
                  {(t.institutionTrack || t.readinessDimension) && (
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {t.institutionTrack && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                          <Building2 className="size-3" /> {t.institutionTrack}
                        </span>
                      )}
                      {t.readinessDimension && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                          <Gauge className="size-3" /> {t.readinessDimension}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <StatusChip label={status.label} tone={status.tone} dot={false} />
                  <div className="flex items-center gap-1">
                    {t.priority && <PriorityPill priority={t.priority} />}
                    <StatusChip label={origin.label} tone={origin.tone} dot={false} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </WorkspaceCard>
  );
}
