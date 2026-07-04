import { createFileRoute } from "@tanstack/react-router";
import { WorkspaceLayout } from "@/components/opportunity/WorkspaceLayout";
import { mockOpportunity } from "@/components/opportunity/mock-data";

export const Route = createFileRoute("/crm/opportunities/$id")({
  component: OpportunityWorkspacePage,
});

function OpportunityWorkspacePage() {
  const { id } = Route.useParams();
  return <WorkspaceLayout opportunity={{ ...mockOpportunity, code: id }} code={id} />;
}
