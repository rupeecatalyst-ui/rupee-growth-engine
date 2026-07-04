// RCLIP — Opportunity Header (LIVE). Fetches the real opportunity core and
// renders the frozen OpportunityHeader. Non-live header bits (watchers) fall
// back to the shell defaults so the layout is unchanged.
import { OpportunityHeader } from "@/components/opportunity/OpportunityHeader";
import { mockOpportunity } from "@/components/opportunity/mock-data";
import type { Opportunity } from "@/components/opportunity/types";
import { useOpportunity } from "@/hooks/use-opportunity";
import { combineLive } from "../infra/live-query";
import { HeaderError, HeaderSkeleton } from "./states";

export function OpportunityHeaderLive({ code }: { code: string }) {
  const core = useOpportunity(code);
  const live = combineLive(core);

  if (live.isLoading) return <HeaderSkeleton />;
  if (live.isError || !core.data) return <HeaderError onRetry={live.onRetry} isRetrying={live.isFetching} />;

  const data = core.data;
  const opportunity: Opportunity = {
    ...mockOpportunity,
    code: data.code,
    title: data.title,
    type: data.typeName,
    status: data.status,
    health: data.health,
    healthScore: data.healthScore,
    priority: data.priority,
    engagementModel: data.engagementModel,
    confidentiality: data.confidentiality,
    tags: data.tags,
    stages: data.stages,
  };

  return <OpportunityHeader opportunity={opportunity} />;
}
