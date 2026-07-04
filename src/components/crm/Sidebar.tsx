import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Target,
  Users,
  Building2,
  Landmark,
  Package,
  Receipt,
  Wallet,
  LineChart,
  CheckSquare,
  Settings,
  ShieldCheck,
  ChevronsLeft,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItem {
  label: string;
  icon: LucideIcon;
  to?: string;
  badge?: string;
  soon?: boolean;
}
interface NavGroup {
  label: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Command Center", icon: LayoutDashboard, to: "/crm" }],
  },
  {
    label: "Deal Flow",
    items: [
      { label: "Opportunities", icon: Target, to: "/crm/opportunities", badge: "24" },
      { label: "Leads", icon: CheckSquare, to: "/crm/loans" },
    ],
  },
  {
    label: "Relationships",
    items: [
      { label: "Contacts", icon: Users, soon: true },
      { label: "Entities", icon: Building2, soon: true },
    ],
  },
  {
    label: "Capital",
    items: [
      { label: "Capital Providers", icon: Landmark, soon: true },
      { label: "Products", icon: Package, soon: true },
    ],
  },
  {
    label: "Revenue",
    items: [
      { label: "Revenue", icon: Wallet, soon: true },
      { label: "Settlements", icon: Receipt, soon: true },
    ],
  },
  {
    label: "Intelligence",
    items: [{ label: "Analytics", icon: LineChart, soon: true }],
  },
  {
    label: "Administration",
    items: [
      { label: "Access & Roles", icon: ShieldCheck, soon: true },
      { label: "Settings", icon: Settings, soon: true },
    ],
  },
];

function NavRow({ item, active, collapsed }: { item: NavItem; active: boolean; collapsed: boolean }) {
  const Icon = item.icon;
  const inner = (
    <>
      <span
        className={cn(
          "absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary transition-opacity",
          active ? "opacity-100" : "opacity-0",
        )}
      />
      <Icon className={cn("size-[18px] shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
      {!collapsed && <span className="flex-1 truncate text-left">{item.label}</span>}
      {!collapsed && item.badge && (
        <span className="rounded-full bg-primary/15 px-1.5 text-[11px] font-medium tabular-nums text-primary">
          {item.badge}
        </span>
      )}
      {!collapsed && item.soon && (
        <span className="rounded-full bg-muted px-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Soon
        </span>
      )}
    </>
  );

  const cls = cn(
    "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-inset",
    collapsed && "justify-center px-0",
    active
      ? "bg-primary/10 font-medium text-foreground"
      : item.soon
        ? "text-muted-foreground/70 cursor-default"
        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
  );

  const node = item.to ? (
    <Link to={item.to} className={cls}>
      {inner}
    </Link>
  ) : (
    <button type="button" className={cls} aria-disabled tabIndex={-1} onClick={(e) => e.preventDefault()}>
      {inner}
    </button>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{node}</TooltipTrigger>
        <TooltipContent side="right">
          {item.label}
          {item.soon ? " · Coming soon" : ""}
        </TooltipContent>
      </Tooltip>
    );
  }
  return node;
}

export default function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r bg-card/60 backdrop-blur-sm transition-[width] duration-200",
        collapsed ? "w-[68px]" : "w-64",
      )}
    >
      {/* Brand */}
      <div className={cn("flex h-16 items-center gap-2.5 border-b px-4", collapsed && "justify-center px-0")}>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-royal to-navy text-white shadow-md">
          <Sparkles className="size-5" />
        </div>
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <p className="font-display text-sm font-extrabold tracking-tight">Rupee Catalyst</p>
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Capital OS</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav aria-label="Primary" className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = item.to ? pathname === item.to || (item.to !== "/crm" && pathname.startsWith(item.to)) : false;
                return <NavRow key={item.label} item={item} active={active} collapsed={collapsed} />;
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User + collapse */}
      <div className="border-t p-3">
        <div className={cn("flex items-center gap-2.5 rounded-lg p-2", collapsed && "justify-center p-0")}>
          <Avatar className="size-8">
            <AvatarFallback className="bg-gradient-to-br from-royal to-emerald text-xs text-white">RK</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-medium">Rahul Kapoor</p>
              <p className="truncate text-xs text-muted-foreground">Master Admin</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={onToggle}
              className="rounded-md p-1 text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/70"
              aria-label="Collapse sidebar"
            >
              <ChevronsLeft className="size-4" />
            </button>
          )}
        </div>
        {collapsed && (
          <button
            onClick={onToggle}
            className="mt-2 flex w-full justify-center rounded-md p-1.5 text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/70"
            aria-label="Expand sidebar"
          >
            <ChevronsLeft className="size-4 rotate-180" />
          </button>
        )}
      </div>
    </aside>
  );
}
