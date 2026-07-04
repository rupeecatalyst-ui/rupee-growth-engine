// RCLIP — display formatting helpers (Indian numbering, compact currency, dates).

export function formatCurrencyCompact(value: number, currency = "INR"): string {
  const symbol = currency === "INR" ? "₹" : "";
  const abs = Math.abs(value);
  if (abs >= 1_00_00_000) return `${symbol}${(value / 1_00_00_000).toFixed(2)} Cr`;
  if (abs >= 1_00_000) return `${symbol}${(value / 1_00_000).toFixed(2)} L`;
  if (abs >= 1_000) return `${symbol}${(value / 1_000).toFixed(1)} K`;
  return `${symbol}${value.toLocaleString("en-IN")}`;
}

export function formatCurrency(value: number, currency = "INR"): string {
  const symbol = currency === "INR" ? "₹" : "";
  return `${symbol}${value.toLocaleString("en-IN")}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

// Human day header for grouped lists: "Today" / "Yesterday" / "12 Jun 2026".
export function formatDayLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dayDiff = Math.round((startOf(new Date()) - startOf(d)) / 86_400_000);
  if (dayDiff === 0) return "Today";
  if (dayDiff === 1) return "Yesterday";
  return formatDate(iso);
}

export function formatRelative(iso: string): string {
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return "";
  const diff = Date.now() - d;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}
