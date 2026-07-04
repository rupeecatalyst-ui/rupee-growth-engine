// RCLIP — Information Sheet (LIVE, read-only). Displays the latest generated
// sheet. Generation stays out of scope (a write/automation action).
import { ScrollText } from "lucide-react";
import { InformationSheetCard } from "@/components/opportunity/InformationSheetCard";
import { useOpportunity, useOpportunityInformationSheet } from "@/hooks/use-opportunity";
import { combineLive } from "../infra/live-query";
import { CardError, CardSkeleton } from "./states";

const ICON = <ScrollText className="size-4" />;

export function InformationSheetLive({ code }: { code: string }) {
  const core = useOpportunity(code);
  const sheet = useOpportunityInformationSheet(core.data?.id);
  const live = combineLive(core, sheet);

  if (live.isLoading) return <CardSkeleton title="Information Sheet" icon={ICON} rows={3} />;
  if (live.isError) return <CardError title="Information Sheet" icon={ICON} onRetry={live.onRetry} isRetrying={live.isFetching} />;

  // `null` is a valid (empty) result — the card renders its own empty state.
  return <InformationSheetCard sheet={sheet.data ?? null} />;
}
