import { useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CrmThemeProvider } from "@/components/crm/theme";
import { OpportunityHeaderLive } from "./live/OpportunityHeaderLive";
import { ActionBar } from "./ActionBar";
import { LeftRail } from "./LeftRail";
import { RightSidebar } from "./RightSidebar";
import { WorkspaceTabs } from "./WorkspaceTabs";
import { formatRelative } from "./format";
import type { Opportunity } from "./types";

export function WorkspaceLayout({ opportunity, code }: { opportunity: Opportunity; code: string }) {
  const [activeSection, setActiveSection] = useState("overview");

  return (
    <CrmThemeProvider>
      <TooltipProvider delayDuration={200}>
        <div className="flex min-h-screen flex-col bg-background text-foreground">
        <OpportunityHeaderLive code={code} />
        <ActionBar />

        <div className="flex flex-1">
          <LeftRail activeSection={activeSection} onSelect={setActiveSection} opportunity={opportunity} />

          <main className="min-w-0 flex-1 px-4 py-4 sm:px-6">
            <WorkspaceTabs
              opportunity={opportunity}
              code={code}
              activeSection={activeSection}
              onSelect={setActiveSection}
            />
          </main>

          <RightSidebar opportunity={opportunity} />
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t bg-card/60 px-4 py-2 text-xs text-muted-foreground sm:px-6">
          <div className="flex items-center gap-3">
            <span className="font-mono">{opportunity.code}</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline capitalize">{opportunity.status.replace("_", " ")}</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">v{opportunity.version}</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Updated {formatRelative(opportunity.updatedAt)}</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Mock data
            </span>
          </div>
        </footer>
        </div>
      </TooltipProvider>
    </CrmThemeProvider>
  );
}
