// RCLIP — Create Opportunity Wizard · Step 4 · Institutions (optional).
import { Landmark, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInstitutionSearch } from "@/hooks/use-opportunity-wizard";
import { PartySearch } from "./PartySearch";
import { StepHeading } from "./Field";
import type { SelectedInstitution, StepErrors, WizardState } from "./types";

interface StepProps {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  errors: StepErrors;
}

const NO_PRODUCT = "__none__";

export function StepInstitutions({ state, update }: StepProps) {
  const addedIds = state.institutions.map((t) => t.entityId);

  function addInstitution(party: { id: string; name: string; sublabel?: string }) {
    const next: SelectedInstitution = {
      entityId: party.id,
      name: party.name,
      sublabel: party.sublabel,
    };
    update({ institutions: [...state.institutions, next] });
  }

  function patchInstitution(index: number, patch: Partial<SelectedInstitution>) {
    update({
      institutions: state.institutions.map((t, i) => (i === index ? { ...t, ...patch } : t)),
    });
  }

  function removeInstitution(index: number) {
    update({ institutions: state.institutions.filter((_, i) => i !== index) });
  }

  return (
    <div>
      <StepHeading
        title="Which institutions will you approach?"
        description="Optional — add the capital providers you plan to pitch. You can add more later."
      />

      <PartySearch
        useSearch={useInstitutionSearch}
        placeholder="Search banks, NBFCs, HFCs, funds…"
        aria-label="Search institutions"
        excludeIds={addedIds}
        onSelect={addInstitution}
      />

      {state.institutions.length > 0 && (
        <ul className="mt-4 space-y-2.5">
          {state.institutions.map((t, i) => (
            <li key={t.entityId} className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Landmark className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{t.name}</p>
                {t.sublabel && (
                  <p className="truncate text-xs text-muted-foreground">{t.sublabel}</p>
                )}
              </div>
              {state.products.length > 0 && (
                <Select
                  value={t.productId ?? NO_PRODUCT}
                  onValueChange={(v) =>
                    patchInstitution(i, { productId: v === NO_PRODUCT ? undefined : v })
                  }
                >
                  <SelectTrigger className="h-8 w-44 text-xs">
                    <SelectValue placeholder="Map product" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_PRODUCT}>Any product</SelectItem>
                    {state.products.map((p) => (
                      <SelectItem key={p.productId} value={p.productId}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-destructive"
                onClick={() => removeInstitution(i)}
                aria-label={`Remove ${t.name}`}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
