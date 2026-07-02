import { Bell, Search } from "lucide-react";

export default function Header() {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900 px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Search className="text-slate-400" size={20} />

        <input
          placeholder="Search loans, customers..."
          className="bg-transparent outline-none text-white placeholder:text-slate-500 w-80"
        />
      </div>

      <div className="flex items-center gap-5">
        <Bell className="text-slate-300" />

        <div className="text-right">
          <div className="font-semibold">Rahul Kapoor</div>

          <div className="text-xs text-slate-400">Master Admin</div>
        </div>
      </div>
    </header>
  );
}
