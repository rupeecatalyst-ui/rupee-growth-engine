import { cn } from "@/lib/utils";

type Tone = "sky" | "orange" | "blue" | "violet" | "amber" | "emerald" | "green" | "cyan" | "slate" | "red";

const toneClass: Record<Tone, string> = {
  sky: "bg-sky-500/12 text-sky-600 dark:text-sky-300 ring-sky-500/20",
  orange: "bg-orange-500/12 text-orange-600 dark:text-orange-300 ring-orange-500/20",
  blue: "bg-blue-500/12 text-blue-600 dark:text-blue-300 ring-blue-500/20",
  violet: "bg-violet-500/12 text-violet-600 dark:text-violet-300 ring-violet-500/20",
  amber: "bg-amber-500/12 text-amber-600 dark:text-amber-300 ring-amber-500/20",
  emerald: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300 ring-emerald-500/20",
  green: "bg-green-500/12 text-green-600 dark:text-green-300 ring-green-500/20",
  cyan: "bg-cyan-500/12 text-cyan-600 dark:text-cyan-300 ring-cyan-500/20",
  slate: "bg-muted text-muted-foreground ring-border",
  red: "bg-red-500/12 text-red-600 dark:text-red-300 ring-red-500/20",
};

const statusTone: Record<string, Tone> = {
  "Raw Lead": "sky",
  "Documents Pending": "orange",
  "Login Done": "blue",
  "Credit WIP": "violet",
  "Soft Approval": "amber",
  Sanctioned: "green",
  Disbursed: "emerald",
  "Invoice Raised": "cyan",
  Hold: "slate",
  Declined: "red",
  Completed: "green",
};

export default function StatusBadge({ status }: { status: string }) {
  const tone = statusTone[status] ?? "slate";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        toneClass[tone],
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}
