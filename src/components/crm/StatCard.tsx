import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  color?: string;
}

export default function StatCard({ title, value, icon, color = "bg-slate-900" }: StatCardProps) {
  return (
    <div className={`${color} rounded-xl p-6 border border-slate-800 shadow-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">{title}</p>

          <h2 className="mt-2 text-3xl font-bold text-white">{value}</h2>
        </div>

        <div className="text-3xl text-emerald-400">{icon}</div>
      </div>
    </div>
  );
}
