import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Briefcase,
  CheckSquare,
  Building2,
  BarChart3,
  Settings,
} from "lucide-react";

const menu = [
  { label: "Dashboard", to: "/crm", icon: LayoutDashboard },
  { label: "All Leads", to: "/crm/loans", icon: Briefcase },
  { label: "Tasks", to: "/crm/tasks", icon: CheckSquare },
  { label: "Lenders", to: "/crm/lenders", icon: Building2 },
  { label: "Reports", to: "/crm/reports", icon: BarChart3 },
  { label: "Settings", to: "/crm/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });

  return (
    <aside className="w-72 min-h-screen bg-slate-950 border-r border-slate-800">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white">Rupee Catalyst</h1>

        <p className="text-sm text-slate-400">CRM</p>
      </div>

      <nav className="p-4 space-y-2">
        {menu.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 transition ${
                pathname === item.to
                  ? "bg-emerald-600 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
