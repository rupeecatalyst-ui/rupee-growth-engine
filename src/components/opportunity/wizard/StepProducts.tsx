// RCLIP — Create Opportunity Wizard · Step 3 · Products (multi-select).
import { Loader2, Plus, Star, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProductCatalog } from "@/hooks/use-opportunity-wizard";
import { StepHeading, Field } from "./Field";
import type { SelectedProduct, StepErrors, WizardState } from "./types";

interface StepProps {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  errors: StepErrors;
}

export function StepProducts({ state, update, errors }: StepProps) {
  const { data, isLoading, isError } = useProductCatalog();
  const products = data ?? [];
  const selectedIds = new Set(state.products.map((p) => p.productId));
  const available = products.filter((p) => !selectedIds.has(p.id));

  function addProduct(productId: string) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const next: SelectedProduct = {
      productId: product.id,
      name: product.name,
      type: product.type,
      isPrimary: state.products.length === 0,
    };
    update({ products: [...state.products, next] });
  }

  function patchProduct(index: number, patch: Partial<SelectedProduct>) {
    update({ products: state.products.map((p, i) => (i === index ? { ...p, ...patch } : p)) });
  }

  function setPrimary(index: number) {
    update({ products: state.products.map((p, i) => ({ ...p, isPrimary: i === index })) });
  }

  function removeProduct(index: number) {
    const remaining = state.products.filter((_, i) => i !== index);
    if (remaining.length > 0 && !remaining.some((p) => p.isPrimary)) remaining[0].isPrimary = true;
    update({ products: remaining });
  }

  return (
    <div>
      <StepHeading
        title="What does the client need?"
        description="Add one or more products. Mark the lead product as primary."
      />

      <div className="mb-4 flex items-end gap-2">
        <div className="flex-1">
          <Field label="Add a product">
            <Select
              value=""
              onValueChange={addProduct}
              disabled={isLoading || available.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isLoading
                      ? "Loading products…"
                      : available.length === 0
                        ? "All products added"
                        : "Select a product to add"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {available.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </div>

      {isError && (
        <p className="mb-3 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Couldn't load the product catalog.
        </p>
      )}

      {state.products.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-8 text-center">
          <Plus className="mx-auto size-5 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">No products added yet.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {state.products.map((p, i) => (
            <li key={p.productId} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="truncate text-xs capitalize text-muted-foreground">
                    {p.type.replace(/_/g, " ")}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant={p.isPrimary ? "default" : "outline"}
                    size="sm"
                    className="h-8 gap-1.5"
                    onClick={() => setPrimary(i)}
                    aria-pressed={p.isPrimary}
                  >
                    <Star className={cn("size-3.5", p.isPrimary && "fill-current")} />
                    {p.isPrimary ? "Primary" : "Set primary"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeProduct(i)}
                    aria-label={`Remove ${p.name}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Requested amount (₹)" error={errors[`product.${i}.amount`]}>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="e.g. 50000000"
                    value={p.requestedAmount ?? ""}
                    onChange={(e) =>
                      patchProduct(i, {
                        requestedAmount: e.target.value === "" ? undefined : Number(e.target.value),
                      })
                    }
                  />
                </Field>
                <Field label="Tenure (months)" error={errors[`product.${i}.tenure`]}>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="e.g. 120"
                    value={p.tenureMonths ?? ""}
                    onChange={(e) =>
                      patchProduct(i, {
                        tenureMonths: e.target.value === "" ? undefined : Number(e.target.value),
                      })
                    }
                  />
                </Field>
              </div>
            </li>
          ))}
        </ul>
      )}

      {errors.products && (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {errors.products}
        </p>
      )}

      {isLoading && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" /> Loading products…
        </p>
      )}
    </div>
  );
}
