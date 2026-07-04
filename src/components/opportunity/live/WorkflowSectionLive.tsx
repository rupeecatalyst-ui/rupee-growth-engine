// RCLIP — Workflow (LIVE, read-only). Composes the live stage stepper (from the
// opportunity core), readiness gate status, and the append-only stage history.
// No transitions, no automation — display only.
import { GitBranch } from "lucide-react";
import { WorkflowCard } from "@/components/opportunity/WorkflowCard";
import { useOpportunity, useReadiness, useOpportunityStageHistory } from "@/hooks/use-opportunity";
import { combineLive } from "../infra/live-query";
import { CardError, CardSkeleton } from "./states";

const ICON = <GitBranch className="size-4" />;

export function WorkflowSectionLive({ code }: { code: string }) {
  const core = useOpportunity(code);
  const readiness = useReadiness(core.data?.id);
  const history = useOpportunityStageHistory(core.data?.id);
  const live = combineLive(core, readiness, history);

  if (live.isLoading) return <CardSkeleton title="Workflow" icon={ICON} rows={5} />;
  if (live.isError || !core.data || !readiness.data || !history.data)
    return <CardError title="Workflow" icon={ICON} onRetry={live.onRetry} isRetrying={live.isFetching} />;

  return <WorkflowCard stages={core.data.stages} gates={readiness.data.dimensions} history={history.data} />;
}
