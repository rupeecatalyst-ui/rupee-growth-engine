import { ScrollText, Shield } from "lucide-react";
import { WorkspaceCard, StatusChip, EmptyState } from "./primitives";
import { formatDate, formatTime } from "./format";
import type { InformationSheet } from "./types";

export function InformationSheetCard({ sheet }: { sheet: InformationSheet | null }) {
  return (
    <WorkspaceCard title="Information Sheet" icon={<ScrollText className="size-4" />}>
      {!sheet ? (
        <EmptyState
          icon={<ScrollText className="size-6" />}
          title="No information sheet generated yet"
          description="Generated as an HTML email body once the opportunity reaches the required readiness."
        />
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip label={`Version ${sheet.version}`} tone="neutral" dot={false} />
            <StatusChip label={sheet.status === "sent" ? "Sent" : "Draft"} tone={sheet.status === "sent" ? "success" : "warning"} />
            {sheet.isCurrent && <StatusChip label="Current" tone="brand" dot={false} />}
            <span className="text-xs text-muted-foreground">
              Generated {formatDate(sheet.generatedAt)} · {formatTime(sheet.generatedAt)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-md bg-muted/60 px-2.5 py-1.5 text-xs text-muted-foreground">
            <Shield className="size-3.5" />
            Read-only preview of the HTML email body. Client contact details remain masked.
          </div>

          {sheet.htmlBody ? (
            <div className="overflow-hidden rounded-lg border bg-white">
              {/* Sandboxed (scripts disabled) so the stored HTML can never execute in-app. */}
              <iframe
                title={`Information Sheet v${sheet.version}`}
                sandbox=""
                srcDoc={sheet.htmlBody}
                className="h-[480px] w-full border-0"
              />
            </div>
          ) : (
            <EmptyState icon={<ScrollText className="size-6" />} title="This version has no content" />
          )}
        </div>
      )}
    </WorkspaceCard>
  );
}
