// RCLIP — Create Opportunity Wizard · shared state + validation (Sprint 4.8).
import type { PartyOption } from "@/lib/repositories/opportunity-repository";

export interface SelectedProduct {
  productId: string;
  name: string;
  type: string;
  requestedAmount?: number;
  tenureMonths?: number;
  isPrimary: boolean;
}

export interface SelectedInstitution {
  entityId: string;
  name: string;
  sublabel?: string;
  productId?: string;
}

export interface SelectedMember {
  contactId: string;
  name: string;
  sublabel?: string;
  teamRoleId?: string;
  isPrimary: boolean;
}

export interface WizardState {
  opportunityTypeId?: string;
  opportunityTypeName?: string;
  client?: PartyOption;
  products: SelectedProduct[];
  institutions: SelectedInstitution[];
  title: string;
  priorityId?: string;
  expectedCloseDate?: string;
  engagementTypeId?: string;
  objectiveId?: string;
  team: SelectedMember[];
}

export const initialWizardState: WizardState = {
  products: [],
  institutions: [],
  team: [],
  title: "",
};

export type StepErrors = Record<string, string>;

export interface WizardStep {
  id: string;
  label: string;
  hint: string;
}

export const WIZARD_STEPS: WizardStep[] = [
  { id: "type", label: "Type", hint: "Opportunity type" },
  { id: "client", label: "Client", hint: "Who is this for" },
  { id: "products", label: "Products", hint: "What they need" },
  { id: "institutions", label: "Institutions", hint: "Capital providers" },
  { id: "details", label: "Details", hint: "Commercials & team" },
  { id: "review", label: "Review", hint: "Confirm & create" },
];

/** Field-level + step-level validation. Returns an error map (empty = valid). */
export function validateStep(step: number, s: WizardState): StepErrors {
  const errors: StepErrors = {};

  if (step === 0) {
    if (!s.opportunityTypeId) errors.opportunityTypeId = "Select an opportunity type to continue.";
  }

  if (step === 1) {
    if (!s.client) errors.client = "Search and select a client (contact or entity).";
  }

  if (step === 2) {
    if (s.products.length === 0) {
      errors.products = "Add at least one product.";
    } else {
      const primaries = s.products.filter((p) => p.isPrimary).length;
      if (primaries !== 1) errors.products = "Mark exactly one product as primary.";
      s.products.forEach((p, i) => {
        if (p.requestedAmount != null && !(p.requestedAmount > 0)) {
          errors[`product.${i}.amount`] = "Amount must be greater than zero.";
        }
        if (p.tenureMonths != null && !(p.tenureMonths > 0)) {
          errors[`product.${i}.tenure`] = "Tenure must be greater than zero.";
        }
      });
    }
  }

  // Step 3 (institutions) is optional — no required validation.

  if (step === 4) {
    if (!s.title.trim()) errors.title = "Enter an opportunity title.";
    if (s.expectedCloseDate) {
      const d = new Date(s.expectedCloseDate);
      if (Number.isNaN(d.getTime())) errors.expectedCloseDate = "Enter a valid date.";
    }
    s.team.forEach((m, i) => {
      if (!m.teamRoleId) errors[`team.${i}.role`] = "Assign a role.";
    });
  }

  return errors;
}
