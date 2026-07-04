// RCLIP — Create Opportunity Wizard · Step 5 · Details (commercials + team).
import { useEffect } from "react";
import { Trash2, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useContactSearch,
  useEngagementTypes,
  useObjectives,
  useOpportunityPriorities,
  useTeamRoles,
} from "@/hooks/use-opportunity-wizard";
import { PartySearch } from "./PartySearch";
import { StepHeading, Field } from "./Field";
import type { SelectedMember, StepErrors, WizardState } from "./types";
import type { CatalogOption } from "@/lib/repositories/opportunity-repository";

interface StepProps {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  errors: StepErrors;
}

function CatalogSelect({
  value,
  onChange,
  options,
  placeholder,
  loading,
}: {
  value?: string;
  onChange: (v: string | undefined) => void;
  options: CatalogOption[] | undefined;
  placeholder: string;
  loading: boolean;
}) {
  const NONE = "__none__";
  return (
    <Select
      value={value ?? NONE}
      onValueChange={(v) => onChange(v === NONE ? undefined : v)}
      disabled={loading}
    >
      <SelectTrigger>
        <SelectValue placeholder={loading ? "Loading…" : placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>Not set</SelectItem>
        {(options ?? []).map((o: CatalogOption) => (
          <SelectItem key={o.id} value={o.id}>
            {o.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function StepDetails({ state, update, errors }: StepProps) {
  const priorities = useOpportunityPriorities();
  const engagements = useEngagementTypes();
  const objectives = useObjectives();
  const teamRoles = useTeamRoles();

  // Suggest a title once, based on client + type, if the user hasn't typed one.
  useEffect(() => {
    if (!state.title.trim() && state.client) {
      const suggestion = [state.client.name, state.opportunityTypeName].filter(Boolean).join(" — ");
      if (suggestion) update({ title: suggestion });
    }
    // Only run when client / type change and title is still empty.
  }, [state.client, state.opportunityTypeName]); // eslint-disable-line react-hooks/exhaustive-deps

  const memberIds = state.team.map((m) => m.contactId);

  function addMember(party: { id: string; name: string; sublabel?: string }) {
    const next: SelectedMember = {
      contactId: party.id,
      name: party.name,
      sublabel: party.sublabel,
      isPrimary: state.team.length === 0,
    };
    update({ team: [...state.team, next] });
  }

  function patchMember(index: number, patch: Partial<SelectedMember>) {
    update({ team: state.team.map((m, i) => (i === index ? { ...m, ...patch } : m)) });
  }

  function setOwner(index: number) {
    update({ team: state.team.map((m, i) => ({ ...m, isPrimary: i === index })) });
  }

  function removeMember(index: number) {
    const remaining = state.team.filter((_, i) => i !== index);
    if (remaining.length > 0 && !remaining.some((m) => m.isPrimary)) remaining[0].isPrimary = true;
    update({ team: remaining });
  }

  return (
    <div>
      <StepHeading
        title="Opportunity details"
        description="Set the commercials and assign the coverage team. The relationship belongs to the organization."
      />

      <div className="space-y-4">
        <Field label="Opportunity title" htmlFor="opp-title" required error={errors.title}>
          <Input
            id="opp-title"
            value={state.title}
            onChange={(e) => update({ title: e.target.value })}
            placeholder="e.g. Acme Corp — Working Capital"
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Priority">
            <CatalogSelect
              value={state.priorityId}
              onChange={(v) => update({ priorityId: v })}
              options={priorities.data}
              placeholder="Select priority"
              loading={priorities.isLoading}
            />
          </Field>
          <Field label="Expected close" htmlFor="opp-close" error={errors.expectedCloseDate}>
            <Input
              id="opp-close"
              type="date"
              value={state.expectedCloseDate ?? ""}
              onChange={(e) => update({ expectedCloseDate: e.target.value || undefined })}
            />
          </Field>
          <Field label="Engagement model">
            <CatalogSelect
              value={state.engagementTypeId}
              onChange={(v) => update({ engagementTypeId: v })}
              options={engagements.data}
              placeholder="Select engagement model"
              loading={engagements.isLoading}
            />
          </Field>
          <Field label="Objective">
            <CatalogSelect
              value={state.objectiveId}
              onChange={(v) => update({ objectiveId: v })}
              options={objectives.data}
              placeholder="Select objective"
              loading={objectives.isLoading}
            />
          </Field>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Coverage team</h3>
            <span className="text-xs text-muted-foreground">
              Operational assignment · owner is the primary
            </span>
          </div>

          <PartySearch
            useSearch={useContactSearch}
            placeholder="Search employees / contacts to add…"
            aria-label="Search coverage team members"
            excludeIds={memberIds}
            onSelect={addMember}
          />

          {state.team.length > 0 && (
            <ul className="mt-3 space-y-2.5">
              {state.team.map((m, i) => (
                <li key={m.contactId} className="rounded-lg border bg-background p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{m.name}</p>
                      {m.sublabel && (
                        <p className="truncate text-xs text-muted-foreground">{m.sublabel}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant={m.isPrimary ? "default" : "outline"}
                        size="sm"
                        className="h-8"
                        onClick={() => setOwner(i)}
                        aria-pressed={m.isPrimary}
                      >
                        {m.isPrimary ? "Owner" : "Make owner"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeMember(i)}
                        aria-label={`Remove ${m.name}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2.5">
                    <CatalogSelect
                      value={m.teamRoleId}
                      onChange={(v) => patchMember(i, { teamRoleId: v })}
                      options={teamRoles.data}
                      placeholder="Assign role"
                      loading={teamRoles.isLoading}
                    />
                    {errors[`team.${i}.role`] && (
                      <p className="mt-1 text-xs text-destructive" role="alert">
                        {errors[`team.${i}.role`]}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
