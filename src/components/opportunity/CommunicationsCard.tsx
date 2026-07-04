import {
  MessageSquare,
  Mail,
  Phone,
  Users,
  Video,
  StickyNote,
  Building2,
  FileText,
  AlertTriangle,
  MapPin,
  ArrowDownLeft,
  ArrowUpRight,
  Shield,
  History,
  type LucideIcon,
} from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { WorkspaceCard, StatusChip, EmptyState, type Tone } from "./primitives";
import { formatDayLabel, formatTime, formatRelative } from "./format";
import type { Communication } from "./types";

/* Known channels get rich icons/labels; anything else falls back gracefully so
   future/unknown channels render with zero code changes (config-driven). */
const channelIcon: Record<string, LucideIcon> = {
  email: Mail,
  phone_call: Phone,
  meeting: Users,
  visit: MapPin,
  video_conference: Video,
  internal_note: StickyNote,
  institution_reply: Building2,
  document_request: FileText,
  clarification: MessageSquare,
  escalation: AlertTriangle,
};

function humanize(value: string): string {
  const words = value.replace(/[._]/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function iconFor(channel: string): LucideIcon {
  return channelIcon[channel] ?? MessageSquare;
}

const directionMeta: Record<Communication["direction"], { Icon: LucideIcon; label: string }> = {
  inbound: { Icon: ArrowDownLeft, label: "Inbound" },
  outbound: { Icon: ArrowUpRight, label: "Outbound" },
  internal: { Icon: StickyNote, label: "Internal" },
};

const statusTone: Record<string, Tone> = {
  Sent: "info",
  Received: "success",
  Logged: "neutral",
};

function CommunicationItem({ comm, onOpenTimeline }: { comm: Communication; onOpenTimeline?: () => void }) {
  const Icon = iconFor(comm.channel);
  const dir = directionMeta[comm.direction];
  const participants = comm.fromParty && comm.toParty ? `${comm.fromParty} → ${comm.toParty}` : comm.party;
  return (
    <li className="flex gap-3 rounded-lg border bg-background/40 px-3 py-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium">{comm.subject}</p>
          <span className="shrink-0 text-xs text-muted-foreground" title={formatRelative(comm.occurredAt)}>
            {formatTime(comm.occurredAt)}
          </span>
        </div>
        {comm.preview && <p className="truncate text-xs text-muted-foreground">{comm.preview}</p>}
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <StatusChip label={humanize(comm.channel)} tone="neutral" dot={false} />
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/70">
            <dir.Icon className="size-3" />
            {dir.label}
          </span>
          {comm.status && <StatusChip label={comm.status} tone={statusTone[comm.status] ?? "neutral"} dot={false} />}
          {comm.institution && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/70">
              <Building2 className="size-3" /> {comm.institution}
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-xs text-muted-foreground/70">{participants}</p>
          {onOpenTimeline && (
            <button
              type="button"
              onClick={onOpenTimeline}
              className="inline-flex shrink-0 items-center gap-1 rounded text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              <History className="size-3" /> Timeline
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

export function CommunicationsCard({
  communications,
  onOpenTimeline,
}: {
  communications: Communication[];
  onOpenTimeline?: () => void;
}) {
  // Newest-first from the repository; group into calendar days preserving order.
  const groups = useMemo(() => {
    const map = new Map<string, Communication[]>();
    for (const c of communications) {
      const label = formatDayLabel(c.occurredAt);
      const bucket = map.get(label);
      if (bucket) bucket.push(c);
      else map.set(label, [c]);
    }
    return Array.from(map, ([label, items]) => ({ label, items }));
  }, [communications]);

  return (
    <WorkspaceCard
      title="Communications"
      icon={<MessageSquare className="size-4" />}
      count={communications.length}
      actions={
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
          <Mail className="size-3.5" /> Compose
        </Button>
      }
    >
      <div className="mb-3 flex items-center gap-1.5 rounded-md bg-muted/60 px-2.5 py-1.5 text-xs text-muted-foreground">
        <Shield className="size-3.5" />
        Client contact details are masked. All outreach is logged to the opportunity.
      </div>
      {communications.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="size-6" />}
          title="No communications"
          description="Emails, calls, meetings and institution replies logged here, newest first."
        />
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.label}
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <ul className="space-y-2">
                {group.items.map((c) => (
                  <CommunicationItem key={c.id} comm={c} onOpenTimeline={onOpenTimeline} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </WorkspaceCard>
  );
}
