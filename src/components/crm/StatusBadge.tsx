interface Props {
  status: string;
}

const statusColors: Record<string, string> = {
  "Raw Lead": "bg-sky-500/20 text-sky-300",

  "Documents Pending": "bg-orange-500/20 text-orange-300",

  "Login Done": "bg-blue-500/20 text-blue-300",

  "Credit WIP": "bg-purple-500/20 text-purple-300",

  "Soft Approval": "bg-yellow-500/20 text-yellow-300",

  Sanctioned: "bg-green-500/20 text-green-300",

  Disbursed: "bg-emerald-500/20 text-emerald-300",

  "Invoice Raised": "bg-cyan-500/20 text-cyan-300",

  Hold: "bg-slate-500/20 text-slate-300",

  Declined: "bg-red-500/20 text-red-300",

  Completed: "bg-green-700/20 text-green-200",
};

export default function StatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        statusColors[status] || "bg-slate-700 text-white"
      }`}
    >
      {status}
    </span>
  );
}
