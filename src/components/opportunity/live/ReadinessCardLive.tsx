// RCLIP — Readiness (LIVE). Resolves the opportunity id, fetches per-dimension
// readiness + weighted overall, and renders the frozen ReadinessCard.
import { Gauge } from "lucide-react";
import { ReadinessCard } from "@/components/opportunity/ReadinessCard";
import { useOpportunity, useReadiness } from "@/hooks/use-opportunity";
import { combineLive } from "../infra/live-query";
import { CardError, CardSkeleton } from "./states";

const ICON = <Gauge className="size-4" />;

export function ReadinessCardLive({ code }: { code: string }) {
  const core = useOpportunity(code);
  const readiness = useReadiness(core.data?.id);
  const live = combineLive(core, readiness);

  if (live.isLoading) return <CardSkeleton title="Readiness" icon={ICON} rows={3} />;
  if (live.isError || !readiness.data)
    return <CardError title="Readiness" icon={ICON} onRetry={live.onRetry} isRetrying={live.isFetching} />;

  return <ReadinessCard dimensions={readiness.data.dimensions} overall={readiness.data.overall} />;
}
