// RCLIP — Timeline (LIVE). Resolves the opportunity id from the code, fetches
// its append-only timeline (newest first), and renders the frozen TimelineCard.
import { History } from "lucide-react";
import { TimelineCard } from "@/components/opportunity/TimelineCard";
import { useOpportunity, useOpportunityTimeline } from "@/hooks/use-opportunity";
import { combineLive } from "../infra/live-query";
import { CardError, CardSkeleton } from "./states";

const ICON = <History className="size-4" />;

export function TimelineCardLive({ code }: { code: string }) {
  const core = useOpportunity(code);
  const timeline = useOpportunityTimeline(core.data?.id);
  const live = combineLive(core, timeline);

  if (live.isLoading) return <CardSkeleton title="Timeline" icon={ICON} rows={5} />;
  if (live.isError || !timeline.data)
    return <CardError title="Timeline" icon={ICON} onRetry={live.onRetry} isRetrying={live.isFetching} />;

  return <TimelineCard events={timeline.data} />;
}
