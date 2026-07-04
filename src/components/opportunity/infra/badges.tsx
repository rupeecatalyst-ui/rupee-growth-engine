// RCLIP — Workspace Infrastructure · shared party badges.
// Inline (text-flow) badges for Entities and Institutions so a party renders
// consistently wherever it appears. Institution is an Entity Type, so
// InstitutionBadge is a specialization of EntityBadge with distinct iconography.
import { Building2, Users, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PartyKind } from "../types";

export function EntityBadge({
  name,
  kind = "entity",
  className,
}: {
  name: string;
  kind?: PartyKind;
  className?: string;
}) {
  const Icon = kind === "contact" ? Users : Building2;
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5", className)}>
      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate">{name}</span>
    </span>
  );
}

export function InstitutionBadge({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5", className)}>
      <Landmark className="size-3.5 shrink-0 text-indigo-500" />
      <span className="truncate">{name}</span>
    </span>
  );
}
