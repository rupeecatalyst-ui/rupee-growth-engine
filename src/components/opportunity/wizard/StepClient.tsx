// RCLIP — Create Opportunity Wizard · Step 2 · Client (Contact XOR Entity).
import { useState } from "react";
import { Building2, UserRound, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useContactSearch, useEntitySearch } from "@/hooks/use-opportunity-wizard";
import { PartySearch } from "./PartySearch";
import { StepHeading } from "./Field";
import type { StepErrors, WizardState } from "./types";

interface StepProps {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  errors: StepErrors;
}

export function StepClient({ state, update, errors }: StepProps) {
  const [mode, setMode] = useState<"entity" | "contact">(state.client?.kind ?? "entity");

  const modes = [
    { id: "entity" as const, label: "Company / Entity", icon: Building2 },
    { id: "contact" as const, label: "Individual / Contact", icon: UserRound },
  ];

  return (
    <div>
      <StepHeading
        title="Who is this opportunity for?"
        description="A client is either a company (Entity) or an individual (Contact) — never both."
      />

      {state.client ? (
        <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            {state.client.kind === "entity" ? (
              <Building2 className="size-5" />
            ) : (
              <UserRound className="size-5" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{state.client.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {state.client.kind === "entity" ? "Entity" : "Contact"}
              {state.client.sublabel ? ` · ${state.client.sublabel}` : ""}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => update({ client: undefined })}
          >
            <X className="size-4" /> Change
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="inline-flex rounded-lg border bg-card p-0.5">
            {modes.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                aria-pressed={mode === m.id}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                  mode === m.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <m.icon className="size-4" /> {m.label}
              </button>
            ))}
          </div>

          {mode === "entity" ? (
            <PartySearch
              key="entity"
              useSearch={useEntitySearch}
              placeholder="Search companies, banks, builders, corporates…"
              aria-label="Search entities"
              autoFocus
              onSelect={(party) => update({ client: party })}
            />
          ) : (
            <PartySearch
              key="contact"
              useSearch={useContactSearch}
              placeholder="Search individuals by name…"
              aria-label="Search contacts"
              autoFocus
              onSelect={(party) => update({ client: party })}
            />
          )}
        </div>
      )}

      {errors.client && (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {errors.client}
        </p>
      )}
    </div>
  );
}
