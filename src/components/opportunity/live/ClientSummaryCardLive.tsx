// RCLIP — Client Summary (LIVE). Same data source as the header (deduped by
// React Query), mapped into the frozen ClientSummaryCard.
import { Building2 } from "lucide-react";
import { ClientSummaryCard } from "@/components/opportunity/ClientSummaryCard";
import { mockOpportunity } from "@/components/opportunity/mock-data";
import type { Opportunity } from "@/components/opportunity/types";
import { useOpportunity } from "@/hooks/use-opportunity";
import { combineLive } from "../infra/live-query";
import { CardError, CardSkeleton } from "./states";

const ICON = <Building2 className="size-4" />;

export function ClientSummaryCardLive({ code }: { code: string }) {
  const core = useOpportunity(code);
  const live = combineLive(core);

  if (live.isLoading) return <CardSkeleton title="Client Summary" icon={ICON} />;
  if (live.isError || !core.data)
    return <CardError title="Client Summary" icon={ICON} onRetry={live.onRetry} isRetrying={live.isFetching} />;

  const data = core.data;
  const opportunity: Opportunity = {
    ...mockOpportunity,
    engagementModel: data.engagementModel,
    objective: data.objective,
    acquisitionChannel: data.acquisitionChannel,
    introducedBy: data.introducedBy,
    tags: data.tags,
    client: {
      kind: data.client.kind,
      name: data.client.name,
      classification: data.client.classification,
      strength: data.client.strength,
      industry: data.client.industry,
      city: data.client.city,
      totalBusinessValue: data.client.totalBusinessValue,
      lastInteraction: data.client.lastInteraction,
    },
  };

  return <ClientSummaryCard opportunity={opportunity} />;
}
