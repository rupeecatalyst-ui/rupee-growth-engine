// RCLIP — Documents (LIVE). Resolves the opportunity id from the code, fetches
// its document checklist, and renders the frozen DocumentsCard (read-only).
import { FileText } from "lucide-react";
import { DocumentsCard } from "@/components/opportunity/DocumentsCard";
import { useOpportunity, useOpportunityDocuments } from "@/hooks/use-opportunity";
import { combineLive } from "../infra/live-query";
import { CardError, CardSkeleton } from "./states";

const ICON = <FileText className="size-4" />;

export function DocumentsCardLive({ code }: { code: string }) {
  const core = useOpportunity(code);
  const documents = useOpportunityDocuments(core.data?.id);
  const live = combineLive(core, documents);

  if (live.isLoading) return <CardSkeleton title="Documents" icon={ICON} />;
  if (live.isError || !documents.data)
    return <CardError title="Documents" icon={ICON} onRetry={live.onRetry} isRetrying={live.isFetching} />;

  return <DocumentsCard documents={documents.data} />;
}
