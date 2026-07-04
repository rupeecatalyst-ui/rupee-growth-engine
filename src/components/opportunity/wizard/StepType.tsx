// RCLIP — Create Opportunity Wizard · Step 1 · Opportunity Type.
import { Loader2, Check, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOpportunityTypes } from "@/hooks/use-opportunity-wizard";
import { StepHeading } from "./Field";
import type { StepErrors, WizardState } from "./types";

interface StepProps {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  errors: StepErrors;
}

export function StepType({ state, update, errors }: StepProps) {
  const { data, isLoading, isError } = useOpportunityTypes();

  return (
    <div>
      <StepHeading
        title="What kind of opportunity is this?"
        description="The opportunity type drives the workflow and how this deal is tracked."
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[76px] animate-pulse rounded-lg border bg-muted/40" />
          ))}
        </div>
      ) : isError ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Couldn't load opportunity types. Please retry from the pipeline.
        </p>
      ) : (data ?? []).length === 0 ? (
        <p className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          No opportunity types are configured yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(data ?? []).map((type) => {
            const selected = state.opportunityTypeId === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() =>
                  update({ opportunityTypeId: type.id, opportunityTypeName: type.name })
                }
                aria-pressed={selected}
                className={cn(
                  "flex items-center gap-3 rounded-lg border bg-card p-4 text-left outline-none transition-all",
                  "hover:border-primary/50 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  selected && "border-primary ring-1 ring-primary",
                )}
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-md",
                    selected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {selected ? <Check className="size-4" /> : <Layers className="size-4" />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{type.name}</span>
                  {type.code && (
                    <span className="block truncate font-mono text-[11px] text-muted-foreground">
                      {type.code}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {errors.opportunityTypeId && (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {errors.opportunityTypeId}
        </p>
      )}

      {isLoading && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" /> Loading configured types…
        </p>
      )}
    </div>
  );
}
