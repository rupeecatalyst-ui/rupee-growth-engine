import { FileText, Upload, FileCheck2, FileClock, FileX2 } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { WorkspaceCard, StatusChip, EmptyState, type Tone } from "./primitives";
import type { DocumentItem } from "./types";

const statusMeta: Record<DocumentItem["status"], { tone: Tone; icon: ReactNode; label: string }> = {
  verified: { tone: "success", icon: <FileCheck2 className="size-4" />, label: "Verified" },
  received: { tone: "info", icon: <FileCheck2 className="size-4" />, label: "Received" },
  pending: { tone: "warning", icon: <FileClock className="size-4" />, label: "Pending" },
  waived: { tone: "neutral", icon: <FileText className="size-4" />, label: "Waived" },
  rejected: { tone: "error", icon: <FileX2 className="size-4" />, label: "Rejected" },
};

export function DocumentsCard({ documents }: { documents: DocumentItem[] }) {
  const outstanding = documents.filter((d) => d.mandatory && (d.status === "pending" || d.status === "rejected")).length;
  return (
    <WorkspaceCard
      title="Documents"
      icon={<FileText className="size-4" />}
      count={documents.length}
      actions={
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
          <Upload className="size-3.5" /> Upload
        </Button>
      }
    >
      {outstanding > 0 && (
        <div className="mb-3 rounded-md bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
          {outstanding} mandatory document{outstanding > 1 ? "s" : ""} outstanding
        </div>
      )}
      {documents.length === 0 ? (
        <EmptyState icon={<FileText className="size-6" />} title="No documents" />
      ) : (
        <ul className="divide-y">
          {documents.map((d) => {
            const meta = statusMeta[d.status];
            return (
              <li key={d.id} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="text-muted-foreground">{meta.icon}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm">{d.name}</p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {d.category} {d.mandatory && "· Mandatory"}
                    </p>
                  </div>
                </div>
                <StatusChip label={meta.label} tone={meta.tone} />
              </li>
            );
          })}
        </ul>
      )}
    </WorkspaceCard>
  );
}
