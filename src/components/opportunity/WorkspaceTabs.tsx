import { Users } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WORKSPACE_SECTIONS } from "./sections";
import { Overview } from "./Overview";
import { ProductsCardLive } from "./live/ProductsCardLive";
import { InstitutionTracksCardLive } from "./live/InstitutionTracksCardLive";
import { TasksCardLive } from "./live/TasksCardLive";
import { TimelineCardLive } from "./live/TimelineCardLive";
import { CommunicationsCardLive } from "./live/CommunicationsCardLive";
import { DocumentsCardLive } from "./live/DocumentsCardLive";
import { WorkflowSectionLive } from "./live/WorkflowSectionLive";
import { InformationSheetLive } from "./live/InformationSheetLive";
import { FinancialsCard } from "./FinancialsCard";
import { RevenueCard } from "./RevenueCard";
import { AICopilotCard } from "./AICopilotCard";
import { WorkspaceCard, StatusChip, EmptyState } from "./primitives";
import type { Opportunity } from "./types";

function ParticipantsSection({ opportunity }: { opportunity: Opportunity }) {
  return (
    <WorkspaceCard title="Participants" icon={<Users className="size-4" />} count={opportunity.participants.length}>
      <ul className="divide-y">
        {opportunity.participants.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium uppercase text-muted-foreground">
                {p.kind === "entity" ? "EN" : "CT"}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="text-xs capitalize text-muted-foreground">{p.kind}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {p.isPrimaryClient && <StatusChip label="Primary Client" tone="brand" dot={false} />}
              <StatusChip label={p.role} tone="neutral" dot={false} />
            </div>
          </li>
        ))}
      </ul>
    </WorkspaceCard>
  );
}

function NotesSection() {
  return (
    <WorkspaceCard title="Notes" icon={<Users className="size-4" />}>
      <EmptyState
        title="No notes yet"
        description="Internal notes are private to the coverage team and never shared externally."
      />
    </WorkspaceCard>
  );
}

export function WorkspaceTabs({
  opportunity,
  code,
  activeSection,
  onSelect,
}: {
  opportunity: Opportunity;
  code: string;
  activeSection: string;
  onSelect: (id: string) => void;
}) {
  return (
    <Tabs value={activeSection} onValueChange={onSelect} className="w-full">
      <div className="sticky top-12 z-10 -mx-4 mb-4 overflow-x-auto border-b bg-background/80 px-4 backdrop-blur-md sm:-mx-6 sm:px-6">
        <TabsList className="h-auto justify-start gap-1 bg-transparent p-0">
          {WORKSPACE_SECTIONS.map((s) => (
            <TabsTrigger
              key={s.id}
              value={s.id}
              className="gap-1.5 rounded-none border-b-2 border-transparent px-3 py-2.5 text-sm data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              <s.icon className="size-4" />
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <div>
        {activeSection === "overview" && (
          <Overview opportunity={opportunity} code={code} onOpenTimeline={() => onSelect("timeline")} />
        )}
        {activeSection === "participants" && <ParticipantsSection opportunity={opportunity} />}
        {activeSection === "products" && <ProductsCardLive code={code} />}
        {activeSection === "institutions" && <InstitutionTracksCardLive code={code} />}
        {activeSection === "workflow" && <WorkflowSectionLive code={code} />}
        {activeSection === "tasks" && <TasksCardLive code={code} />}
        {activeSection === "documents" && <DocumentsCardLive code={code} />}
        {activeSection === "infosheet" && <InformationSheetLive code={code} />}
        {activeSection === "timeline" && <TimelineCardLive code={code} />}
        {activeSection === "communications" && (
          <CommunicationsCardLive code={code} onOpenTimeline={() => onSelect("timeline")} />
        )}
        {activeSection === "financials" && <FinancialsCard financials={opportunity.financials} />}
        {activeSection === "revenue" && <RevenueCard financials={opportunity.financials} />}
        {activeSection === "notes" && <NotesSection />}
        {activeSection === "ai" && <AICopilotCard suggestions={opportunity.ai} />}
      </div>
    </Tabs>
  );
}
