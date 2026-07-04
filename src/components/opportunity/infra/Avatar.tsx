// RCLIP — Workspace Infrastructure · shared avatar with initials.
// Centralizes initials derivation (and mask-glyph stripping) used by the header
// watchers, coverage team, and any future person chips.
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function initialsFromName(name: string): string {
  const parts = name
    .replace(/[█]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function InitialsAvatar({
  name,
  initials,
  className,
  textClassName = "text-[10px]",
}: {
  name: string;
  initials?: string;
  className?: string;
  textClassName?: string;
}) {
  return (
    <Avatar className={cn("size-7", className)}>
      <AvatarFallback className={textClassName}>{initials ?? initialsFromName(name)}</AvatarFallback>
    </Avatar>
  );
}
