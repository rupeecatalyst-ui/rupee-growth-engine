import { Building2, CheckCircle2, Sparkles } from "lucide-react";
import { WorkspaceCard, StatusChip, EmptyState, type Tone } from "./primitives";
import { InstitutionBadge } from "./infra/badges";
import { formatCurrencyCompact } from "./format";
import type { InstitutionTrack, TrackStatus } from "./types";

const statusMeta: Record<TrackStatus, { label: string; tone: Tone }> = {
  matched: { label: "Matched", tone: "info" },
  shortlisted: { label: "Shortlisted", tone: "info" },
  application_sent: { label: "Application Sent", tone: "brand" },
  documents_pending: { label: "Documents Pending", tone: "warning" },
  credit_discussion: { label: "Credit Discussion", tone: "warning" },
  sanction: { label: "Sanctioned", tone: "success" },
  documentation: { label: "Documentation", tone: "brand" },
  disbursement: { label: "Disbursement", tone: "success" },
  rejected: { label: "Rejected", tone: "error" },
  withdrawn: { label: "Withdrawn", tone: "neutral" },
};

export function InstitutionTracksCard({ tracks }: { tracks: InstitutionTrack[] }) {
  return (
    <WorkspaceCard title="Institution Tracks" icon={<Building2 className="size-4" />} count={tracks.length}>
      {tracks.length === 0 ? (
        <EmptyState icon={<Building2 className="size-6" />} title="No institutions matched" description="Run Smart Match to shortlist capital providers." />
      ) : (
        <ul className="space-y-2">
          {tracks.map((t) => {
            const meta = statusMeta[t.status];
            return (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-lg border bg-background/40 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <InstitutionBadge name={t.institution} className="text-sm font-medium" />
                    {t.selected && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-3.5" /> Selected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{t.product ?? "—"}</p>
                </div>
                <div className="flex items-center gap-3">
                  {t.matchScore != null && (
                    <span className="hidden items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 sm:inline-flex">
                      <Sparkles className="size-3.5" /> {t.matchScore}
                    </span>
                  )}
                  {t.roi != null && <span className="hidden text-xs tabular-nums text-muted-foreground md:inline">{t.roi}%</span>}
                  {t.sanctionedAmount != null && (
                    <span className="text-xs font-semibold tabular-nums">{formatCurrencyCompact(t.sanctionedAmount)}</span>
                  )}
                  <StatusChip label={meta.label} tone={meta.tone} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </WorkspaceCard>
  );
}
