import { createFileRoute } from "@tanstack/react-router";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CrmThemeProvider } from "@/components/crm/theme";
import { CreateOpportunityWizard } from "@/components/opportunity/wizard/CreateOpportunityWizard";

export const Route = createFileRoute("/crm/opportunities/new")({
  component: NewOpportunityPage,
});

function NewOpportunityPage() {
  return (
    <CrmThemeProvider>
      <TooltipProvider delayDuration={200}>
        <CreateOpportunityWizard />
      </TooltipProvider>
    </CrmThemeProvider>
  );
}
