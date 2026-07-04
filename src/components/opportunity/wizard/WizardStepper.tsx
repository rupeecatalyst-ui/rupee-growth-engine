// RCLIP — Create Opportunity Wizard · step progress header.
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { WIZARD_STEPS } from "./types";

export function WizardStepper({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-1.5" aria-label="Wizard progress">
      {WIZARD_STEPS.map((step, i) => {
        const state = i < current ? "done" : i === current ? "active" : "upcoming";
        return (
          <li key={step.id} className="flex flex-1 items-center gap-1.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums transition-colors",
                  state === "done" && "border-primary bg-primary text-primary-foreground",
                  state === "active" && "border-primary bg-primary/10 text-primary",
                  state === "upcoming" && "border-border bg-muted text-muted-foreground",
                )}
                aria-current={state === "active" ? "step" : undefined}
              >
                {state === "done" ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span className="hidden min-w-0 flex-col leading-tight lg:flex">
                <span
                  className={cn(
                    "truncate text-xs font-medium",
                    state === "upcoming" ? "text-muted-foreground" : "text-foreground",
                  )}
                >
                  {step.label}
                </span>
                <span className="truncate text-[11px] text-muted-foreground">{step.hint}</span>
              </span>
            </div>
            {i < WIZARD_STEPS.length - 1 && (
              <span
                className={cn(
                  "h-px flex-1 transition-colors",
                  i < current ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
