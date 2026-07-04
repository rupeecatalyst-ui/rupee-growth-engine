// RCLIP — Institution Tracks (LIVE). Resolves the opportunity id, fetches its
// institution tracks, and renders the frozen InstitutionTracksCard.
import { Building2 } from "lucide-react";
import { InstitutionTracksCard } from "@/components/opportunity/InstitutionTracksCard";
import { useInstitutionTracks, useOpportunity } from "@/hooks/use-opportunity";
import { combineLive } from "../infra/live-query";
import { CardError, CardSkeleton } from "./states";

const ICON = <Building2 className="size-4" />;

export function InstitutionTracksCardLive({ code }: { code: string }) {
  const core = useOpportunity(code);
  const tracks = useInstitutionTracks(core.data?.id);
  const live = combineLive(core, tracks);

  if (live.isLoading) return <CardSkeleton title="Institution Tracks" icon={ICON} />;
  if (live.isError || !tracks.data)
    return <CardError title="Institution Tracks" icon={ICON} onRetry={live.onRetry} isRetrying={live.isFetching} />;

  return <InstitutionTracksCard tracks={tracks.data} />;
}
