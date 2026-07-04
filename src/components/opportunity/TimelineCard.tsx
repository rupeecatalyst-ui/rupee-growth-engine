import { History, Building2, Bot, Cog, User, Workflow, GitBranch } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { WorkspaceCard, EmptyState } from "./primitives";
import { formatDayLabel, formatRelative, formatTime } from "./format";
import type { TimelineEvent } from "./types";

const sourceIcon: Record<TimelineEvent["source"], ReactNode> = {
  institution: <Building2 className="size-3.5" />,
  ai: <Bot className="size-3.5" />,
  system: <Cog className="size-3.5" />,
  manual: <User className="size-3.5" />,
  workflow: <Workflow className="size-3.5" />,
};

const sourceColor: Record<TimelineEvent["source"], string> = {
  institution: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300",
  ai: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300",
  system: "bg-muted text-muted-foreground",
  manual: "bg-blue-500/15 text-blue-600 dark:text-blue-300",
  workflow: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
};

// Humanize any event_type (e.g. "institution.status_changed" → "Institution
// status changed") so new event types render without UI changes.
function eventLabel(eventType: string): string {
  const words = eventType.replace(/[._]/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function previewValue(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function PayloadPreview({ payload }: { payload: Record<string, unknown> }) {
  const entries = Object.entries(payload).slice(0, 4);
  if (entries.length === 0) return null;
  return (
    <dl className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-center gap-1 text-[11px]">
          <dt className="capitalize text-muted-foreground/70">{key.replace(/[._]/g, " ")}:</dt>
          <dd className="max-w-[16rem] truncate font-medium text-muted-foreground">{previewValue(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function TimelineItem({ event }: { event: TimelineEvent }) {
  return (
    <li className="relative flex gap-3">
      <span
        className={`relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full ${sourceColor[event.source]}`}
      >
        {sourceIcon[event.source]}
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">{eventLabel(event.eventType)}</p>
          <span className="shrink-0 text-xs text-muted-foreground" title={formatRelative(event.occurredAt)}>
            {formatTime(event.occurredAt)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{event.summary}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground/70">
          <span>{event.actor}</span>
          {event.institution && (
            <span className="inline-flex items-center gap-1">
              <Building2 className="size-3" /> {event.institution}
            </span>
          )}
          {event.stage && (
            <span className="inline-flex items-center gap-1">
              <GitBranch className="size-3" /> {event.stage}
            </span>
          )}
        </div>
        {event.payload && <PayloadPreview payload={event.payload} />}
      </div>
    </li>
  );
}

export function TimelineCard({ events }: { events: TimelineEvent[] }) {
  // Events arrive newest-first; group into calendar days preserving that order.
  const groups = useMemo(() => {
    const map = new Map<string, TimelineEvent[]>();
    for (const e of events) {
      const label = formatDayLabel(e.occurredAt);
      const bucket = map.get(label);
      if (bucket) bucket.push(e);
      else map.set(label, [e]);
    }
    return Array.from(map, ([label, items]) => ({ label, items }));
  }, [events]);

  return (
    <WorkspaceCard title="Timeline" icon={<History className="size-4" />} count={events.length}>
      {events.length === 0 ? (
        <EmptyState
          icon={<History className="size-6" />}
          title="No activity yet"
          description="Every action on this opportunity will appear here, newest first."
        />
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="mb-3 flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.label}
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <ol className="relative space-y-4 before:absolute before:left-[13px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-border">
                {group.items.map((e) => (
                  <TimelineItem key={e.id} event={e} />
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}
    </WorkspaceCard>
  );
}
