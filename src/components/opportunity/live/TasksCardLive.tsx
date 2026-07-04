// RCLIP — Tasks (LIVE). Resolves the opportunity id from the code, fetches its
// tasks, and renders the frozen TasksCard (read-only).
import { CheckSquare } from "lucide-react";
import { TasksCard } from "@/components/opportunity/TasksCard";
import { useOpportunity, useOpportunityTasks } from "@/hooks/use-opportunity";
import { combineLive } from "../infra/live-query";
import { CardError, CardSkeleton } from "./states";

const ICON = <CheckSquare className="size-4" />;

export function TasksCardLive({ code }: { code: string }) {
  const core = useOpportunity(code);
  const tasks = useOpportunityTasks(core.data?.id);
  const live = combineLive(core, tasks);

  if (live.isLoading) return <CardSkeleton title="Tasks" icon={ICON} />;
  if (live.isError || !tasks.data)
    return <CardError title="Tasks" icon={ICON} onRetry={live.onRetry} isRetrying={live.isFetching} />;

  return <TasksCard tasks={tasks.data} />;
}
