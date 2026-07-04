import { KeyMetricsCard } from "./KeyMetricsCard";
import { FinancialsCard } from "./FinancialsCard";
import { RevenueCard } from "./RevenueCard";
import { ClientSummaryCardLive } from "./live/ClientSummaryCardLive";
import { ProductsCardLive } from "./live/ProductsCardLive";
import { InstitutionTracksCardLive } from "./live/InstitutionTracksCardLive";
import { ReadinessCardLive } from "./live/ReadinessCardLive";
import { TasksCardLive } from "./live/TasksCardLive";
import { TimelineCardLive } from "./live/TimelineCardLive";
import { CommunicationsCardLive } from "./live/CommunicationsCardLive";
import { DocumentsCardLive } from "./live/DocumentsCardLive";
import type { Opportunity } from "./types";

export function Overview({
  opportunity,
  code,
  onOpenTimeline,
}: {
  opportunity: Opportunity;
  code: string;
  onOpenTimeline?: () => void;
}) {
  return (
    <div className="space-y-4">
      <KeyMetricsCard opportunity={opportunity} />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <ClientSummaryCardLive code={code} />
          <ProductsCardLive code={code} />
          <InstitutionTracksCardLive code={code} />
          <DocumentsCardLive code={code} />
          <FinancialsCard financials={opportunity.financials} />
        </div>
        <div className="space-y-4">
          <ReadinessCardLive code={code} />
          <TasksCardLive code={code} />
          <CommunicationsCardLive code={code} onOpenTimeline={onOpenTimeline} />
          <RevenueCard financials={opportunity.financials} />
          <TimelineCardLive code={code} />
        </div>
      </div>
    </div>
  );
}
