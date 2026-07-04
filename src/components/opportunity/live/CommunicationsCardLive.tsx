// RCLIP — Communications (LIVE). Resolves the opportunity id from the code,
// fetches its communications (newest first), and renders the frozen
// CommunicationsCard (read-only). `onOpenTimeline` jumps to the Timeline tab.
import { MessageSquare } from "lucide-react";
import { CommunicationsCard } from "@/components/opportunity/CommunicationsCard";
import { useOpportunity, useOpportunityCommunications } from "@/hooks/use-opportunity";
import { combineLive } from "../infra/live-query";
import { CardError, CardSkeleton } from "./states";

const ICON = <MessageSquare className="size-4" />;

export function CommunicationsCardLive({
  code,
  onOpenTimeline,
}: {
  code: string;
  onOpenTimeline?: () => void;
}) {
  const core = useOpportunity(code);
  const communications = useOpportunityCommunications(core.data?.id);
  const live = combineLive(core, communications);

  if (live.isLoading) return <CardSkeleton title="Communications" icon={ICON} rows={4} />;
  if (live.isError || !communications.data)
    return <CardError title="Communications" icon={ICON} onRetry={live.onRetry} isRetrying={live.isFetching} />;

  return <CommunicationsCard communications={communications.data} onOpenTimeline={onOpenTimeline} />;
}
