// RCLIP — Create Opportunity Wizard · Step 6 · Review.
import { Building2, Landmark, Star, UserRound, Users } from "lucide-react";
import { formatCurrency, formatDate } from "@/components/opportunity/infra";
import {
  useEngagementTypes,
  useObjectives,
  useOpportunityPriorities,
  useTeamRoles,
} from "@/hooks/use-opportunity-wizard";
import type { CatalogOption } from "@/lib/repositories/opportunity-repository";
import type { WizardState } from "./types";

function nameOf(options: CatalogOption[] | undefined, id?: string) {
  if (!id) return undefined;
  return options?.find((o) => o.id === id)?.name;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">
        {value ?? <span className="text-muted-foreground">—</span>}
      </span>
    </div>
  );
}

export function StepReview({ state }: { state: WizardState }) {
  const priorities = useOpportunityPriorities();
  const engagements = useEngagementTypes();
  const objectives = useObjectives();
  const teamRoles = useTeamRoles();

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-display text-lg font-semibold tracking-tight">Review &amp; create</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Confirm the details below. You can go back to any step to make changes.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Section title="Overview">
          <Row label="Title" value={state.title || undefined} />
          <Row label="Type" value={state.opportunityTypeName} />
          <Row label="Priority" value={nameOf(priorities.data, state.priorityId)} />
          <Row label="Objective" value={nameOf(objectives.data, state.objectiveId)} />
          <Row label="Engagement" value={nameOf(engagements.data, state.engagementTypeId)} />
          <Row
            label="Expected close"
            value={state.expectedCloseDate ? formatDate(state.expectedCloseDate) : undefined}
          />
        </Section>

        <Section title="Client">
          {state.client ? (
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                {state.client.kind === "entity" ? (
                  <Building2 className="size-4" />
                ) : (
                  <UserRound className="size-4" />
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{state.client.name}</p>
                <p className="truncate text-xs capitalize text-muted-foreground">
                  {state.client.kind}
                  {state.client.sublabel ? ` · ${state.client.sublabel}` : ""}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No client selected.</p>
          )}
        </Section>

        <Section title={`Products (${state.products.length})`}>
          {state.products.length === 0 ? (
            <p className="text-sm text-muted-foreground">No products.</p>
          ) : (
            <ul className="space-y-1.5">
              {state.products.map((p) => (
                <li key={p.productId} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-1.5">
                    {p.isPrimary && (
                      <Star className="size-3.5 shrink-0 fill-primary text-primary" />
                    )}
                    <span className="truncate font-medium">{p.name}</span>
                  </span>
                  <span className="shrink-0 text-muted-foreground">
                    {p.requestedAmount ? formatCurrency(p.requestedAmount) : "—"}
                    {p.tenureMonths ? ` · ${p.tenureMonths}m` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title={`Institutions (${state.institutions.length})`}>
          {state.institutions.length === 0 ? (
            <p className="text-sm text-muted-foreground">None selected (optional).</p>
          ) : (
            <ul className="space-y-1.5">
              {state.institutions.map((t) => (
                <li key={t.entityId} className="flex items-center gap-2 text-sm">
                  <Landmark className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate font-medium">{t.name}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title={`Coverage team (${state.team.length})`}>
          {state.team.length === 0 ? (
            <p className="text-sm text-muted-foreground">No team assigned (optional).</p>
          ) : (
            <ul className="space-y-1.5">
              {state.team.map((m) => (
                <li key={m.contactId} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <Users className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate font-medium">{m.name}</span>
                    {m.isPrimary && (
                      <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        Owner
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-muted-foreground">
                    {nameOf(teamRoles.data, m.teamRoleId) ?? "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
