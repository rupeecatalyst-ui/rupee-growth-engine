// RCLIP — Create Opportunity Wizard (Sprint 4.8) · orchestrator.
// First write feature. Flow: UI → hooks → repository → Supabase. Manages step
// state, field/step validation, and the single createOpportunity() call.
import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { notify } from "@/components/opportunity/infra";
import { useCreateOpportunity } from "@/hooks/use-opportunity-wizard";
import type { CreateOpportunityInput } from "@/lib/repositories/opportunity-repository";
import { WizardStepper } from "./WizardStepper";
import { StepType } from "./StepType";
import { StepClient } from "./StepClient";
import { StepProducts } from "./StepProducts";
import { StepInstitutions } from "./StepInstitutions";
import { StepDetails } from "./StepDetails";
import { StepReview } from "./StepReview";
import {
  WIZARD_STEPS,
  initialWizardState,
  validateStep,
  type StepErrors,
  type WizardState,
} from "./types";

const LAST_STEP = WIZARD_STEPS.length - 1;

export function CreateOpportunityWizard() {
  const navigate = useNavigate();
  const createOpportunity = useCreateOpportunity();

  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>(initialWizardState);
  const [errors, setErrors] = useState<StepErrors>({});

  const update = (patch: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...patch }));
    if (Object.keys(errors).length > 0) setErrors({});
  };

  const buildInput = (): CreateOpportunityInput => ({
    title: state.title.trim(),
    opportunityTypeId: state.opportunityTypeId as string,
    client: { kind: state.client!.kind, id: state.client!.id },
    products: state.products.map((p) => ({
      productId: p.productId,
      requestedAmount: p.requestedAmount,
      tenureMonths: p.tenureMonths,
      isPrimary: p.isPrimary,
    })),
    institutions: state.institutions.map((t) => ({ entityId: t.entityId, productId: t.productId })),
    priorityId: state.priorityId,
    expectedCloseDate: state.expectedCloseDate,
    engagementTypeId: state.engagementTypeId,
    objectiveId: state.objectiveId,
    team: state.team
      .filter((m) => m.teamRoleId)
      .map((m) => ({
        memberContactId: m.contactId,
        teamRoleId: m.teamRoleId as string,
        isPrimary: m.isPrimary,
      })),
  });

  const cancel = () => navigate({ to: "/crm/opportunities" });

  const goNext = () => {
    const stepErrors = validateStep(step, state);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setStep((s) => Math.min(s + 1, LAST_STEP));
  };

  const goBack = () => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
  };

  const submit = async () => {
    // Full re-validation across every step before writing.
    for (let i = 0; i <= LAST_STEP; i++) {
      const stepErrors = validateStep(i, state);
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        setStep(i);
        notify.error("Please fix the highlighted fields", "Some required details are missing.");
        return;
      }
    }

    try {
      const created = await createOpportunity.mutateAsync(buildInput());
      notify.success("Opportunity created", created.code);
      navigate({ to: "/crm/opportunities/$id", params: { id: created.code } });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not create the opportunity.";
      notify.error("Create failed", message);
    }
  };

  const stepContent = useMemo(() => {
    switch (step) {
      case 0:
        return <StepType state={state} update={update} errors={errors} />;
      case 1:
        return <StepClient state={state} update={update} errors={errors} />;
      case 2:
        return <StepProducts state={state} update={update} errors={errors} />;
      case 3:
        return <StepInstitutions state={state} update={update} errors={errors} />;
      case 4:
        return <StepDetails state={state} update={update} errors={errors} />;
      default:
        return <StepReview state={state} />;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, state, errors]);

  const submitting = createOpportunity.isPending;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div>
            <h1 className="font-display text-base font-bold tracking-tight">New Opportunity</h1>
            <p className="text-xs text-muted-foreground">
              Step {step + 1} of {WIZARD_STEPS.length}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={cancel}
            disabled={submitting}
          >
            <X className="size-4" /> Cancel
          </Button>
        </div>
        <div className="mx-auto w-full max-w-4xl px-4 pb-4 sm:px-6">
          <WizardStepper current={step} />
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">{stepContent}</div>
      </ScrollArea>

      <footer className="sticky bottom-0 border-t bg-card/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={goBack}
            disabled={step === 0 || submitting}
          >
            <ArrowLeft className="size-4" /> Back
          </Button>
          {step < LAST_STEP ? (
            <Button className="gap-1.5" onClick={goNext}>
              Next <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button className="gap-1.5" onClick={submit} disabled={submitting}>
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              {submitting ? "Creating…" : "Create Opportunity"}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
