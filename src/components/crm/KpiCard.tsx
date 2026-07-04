import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

export interface KpiCardProps {
  label: string;
  value: string;
  delta?: number; // percent
  deltaLabel?: string;
  icon?: LucideIcon;
  trend?: number[];
  accent?: "royal" | "emerald" | "cta" | "sky";
}

const accentMap: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  royal: "var(--royal)",
  emerald: "var(--emerald)",
  cta: "var(--cta)",
  sky: "oklch(0.62 0.16 240)",
};

export function KpiCard({ label, value, delta, deltaLabel, icon: Icon, trend, accent = "royal" }: KpiCardProps) {
  const up = (delta ?? 0) >= 0;
  const color = accentMap[accent];
  const data = (trend ?? []).map((y, x) => ({ x, y }));
  const gradId = `kpi-grad-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className="relative overflow-hidden rounded-xl border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold tracking-tight tabular-nums">{value}</p>
        </div>
        {Icon && (
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `color-mix(in oklab, ${color} 14%, transparent)`, color }}
          >
            <Icon className="size-5" />
          </span>
        )}
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        {delta != null && (
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold",
                up ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400" : "bg-red-500/12 text-red-600 dark:text-red-400",
              )}
            >
              {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
              {Math.abs(delta)}%
            </span>
            {deltaLabel && <span className="text-xs text-muted-foreground">{deltaLabel}</span>}
          </div>
        )}
        {data.length > 0 && (
          <div className="h-9 w-24">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="y" stroke={color} strokeWidth={2} fill={`url(#${gradId})`} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
