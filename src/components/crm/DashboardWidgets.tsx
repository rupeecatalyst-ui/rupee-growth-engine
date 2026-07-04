import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { HealthIndicator } from "@/components/opportunity/primitives";
import StatusBadge from "./StatusBadge";
import {
  activityFeed,
  capitalProviders,
  pipelineByStage,
  productMix,
  revenueSeries,
  topOpportunities,
} from "@/data/crm-demo";

const axisProps = {
  stroke: "var(--border)",
  tick: { fill: "var(--muted-foreground)", fontSize: 11 },
  tickLine: false,
  axisLine: false,
} as const;

interface TipEntry {
  dataKey?: string | number;
  value?: number;
  color?: string;
  fill?: string;
  name?: string;
}
interface TipProps {
  active?: boolean;
  payload?: TipEntry[];
  label?: string;
  suffix?: string;
}

function TooltipCard({ active, payload, label, suffix = "" }: TipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-elevated">
      {label && <p className="mb-1 font-medium text-popover-foreground">{label}</p>}
      {payload.map((p) => (
        <div key={String(p.dataKey)} className="flex items-center gap-2 text-muted-foreground">
          <span className="size-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
          <span className="capitalize">{p.name}</span>
          <span className="ml-auto font-semibold tabular-nums text-popover-foreground">
            {p.value}
            {suffix}
          </span>
        </div>
      ))}
    </div>
  );
}

export function RevenueTrendChart() {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={revenueSeries} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="rev-proj" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--royal)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--royal)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="rev-real" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--emerald)" stopOpacity={0.32} />
              <stop offset="100%" stopColor="var(--emerald)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" opacity={0.5} />
          <XAxis dataKey="month" {...axisProps} />
          <YAxis {...axisProps} width={40} />
          <Tooltip content={<TooltipCard suffix=" Cr" />} cursor={{ stroke: "var(--border)" }} />
          <Area type="monotone" dataKey="projected" name="Projected" stroke="var(--royal)" strokeWidth={2} fill="url(#rev-proj)" />
          <Area type="monotone" dataKey="realised" name="Realised" stroke="var(--emerald)" strokeWidth={2} fill="url(#rev-real)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PipelineStageChart() {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={pipelineByStage} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" opacity={0.5} />
          <XAxis dataKey="stage" {...axisProps} interval={0} angle={-18} textAnchor="end" height={54} />
          <YAxis {...axisProps} width={40} />
          <Tooltip content={<TooltipCard suffix=" Cr" />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
          <Bar dataKey="value" name="Pipeline" radius={[6, 6, 0, 0]} maxBarSize={38}>
            {pipelineByStage.map((_, i) => (
              <Cell key={i} fill="var(--royal)" fillOpacity={0.55 + (i / pipelineByStage.length) * 0.45} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ProductMixDonut() {
  const total = productMix.reduce((s, p) => s + p.value, 0);
  return (
    <div className="flex items-center gap-5">
      <div className="relative h-40 w-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={productMix} dataKey="value" nameKey="name" innerRadius={52} outerRadius={72} paddingAngle={2} strokeWidth={0}>
              {productMix.map((p, i) => (
                <Cell key={i} fill={p.color} />
              ))}
            </Pie>
            <Tooltip content={<TooltipCard suffix="%" />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-xl font-bold tabular-nums">{total}%</span>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Mix</span>
        </div>
      </div>
      <ul className="flex-1 space-y-2">
        {productMix.map((p) => (
          <li key={p.name} className="flex items-center gap-2 text-sm">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="flex-1 truncate text-muted-foreground">{p.name}</span>
            <span className="font-medium tabular-nums">{p.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const toneRing: Record<ActivityTone, string> = {
  royal: "bg-royal/15 text-royal",
  emerald: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  sky: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  violet: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
};
type ActivityTone = "royal" | "emerald" | "amber" | "sky" | "violet";

export function ActivityFeed() {
  return (
    <ul className="space-y-1">
      {activityFeed.map((a) => (
        <li key={a.id} className="flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50">
          <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold", toneRing[a.tone])}>
            {a.initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-snug">
              <span className="font-medium">{a.actor}</span> <span className="text-muted-foreground">{a.action}</span>{" "}
              <span className="font-medium">{a.target}</span>
            </p>
            <p className="text-xs text-muted-foreground">{a.time}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function TopOpportunitiesTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
            <th scope="col" className="px-3 py-2.5 text-left font-medium">Opportunity</th>
            <th scope="col" className="px-3 py-2.5 text-left font-medium">Product</th>
            <th scope="col" className="px-3 py-2.5 text-right font-medium">Value</th>
            <th scope="col" className="px-3 py-2.5 text-left font-medium">Stage</th>
            <th scope="col" className="hidden px-3 py-2.5 text-left font-medium lg:table-cell">Health</th>
            <th scope="col" className="hidden px-3 py-2.5 text-right font-medium xl:table-cell">Prob.</th>
            <th scope="col" className="px-3 py-2.5 text-left font-medium">Owner</th>
          </tr>
        </thead>
        <tbody>
          {topOpportunities.map((d) => (
            <tr key={d.code} className="group border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40">
              <td className="px-3 py-3">
                <Link
                  to="/crm/opportunities/$id"
                  params={{ id: d.code }}
                  className="block rounded outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex items-center gap-1 font-medium group-hover:text-primary">
                    {d.client}
                    <ArrowUpRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">{d.code}</span>
                </Link>
              </td>
              <td className="px-3 py-3 text-muted-foreground">{d.product}</td>
              <td className="px-3 py-3 text-right font-semibold tabular-nums">{d.value}</td>
              <td className="px-3 py-3">
                <StatusBadge status={d.stage} />
              </td>
              <td className="hidden px-3 py-3 lg:table-cell">
                <HealthIndicator status={d.health} />
              </td>
              <td className="hidden px-3 py-3 text-right tabular-nums xl:table-cell">
                <span className="text-muted-foreground">{d.probability}%</span>
              </td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                  <Avatar className="size-6">
                    <AvatarFallback className="text-[10px]">{d.ownerInitials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden text-muted-foreground sm:inline">{d.owner}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CapitalProvidersList() {
  return (
    <ul className="space-y-1">
      {capitalProviders.map((p) => (
        <li key={p.name} className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50">
          <Avatar className="size-9">
            <AvatarFallback className="bg-muted text-xs font-semibold">{p.initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium">{p.name}</span>
              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-amber-500">
                <Star className="size-3 fill-current" /> {p.rating}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{p.liveDeals} live</span>
              <span>·</span>
              <span className="font-medium text-foreground/80">{p.sanctioned}</span>
              <span>·</span>
              <span>TAT {p.avgTat}</span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
