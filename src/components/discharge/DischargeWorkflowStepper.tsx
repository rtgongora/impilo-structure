import { Check, Circle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  DischargeWorkflowState, 
  DISCHARGE_STATE_FLOW, 
  DEATH_STATE_FLOW 
} from "./types";

interface DischargeWorkflowStepperProps {
  workflowType: 'discharge' | 'death';
  currentState: DischargeWorkflowState;
  className?: string;
}

const STATE_LABELS: Record<DischargeWorkflowState, string> = {
  active: 'Active',
  discharge_initiated: 'Initiated',
  clinical_clearance: 'Clinical',
  financial_clearance: 'Financial',
  admin_approval: 'Approval',
  closed_discharged: 'Discharged',
  death_declared: 'Declared',
  certification: 'Certified',
  financial_reconciliation: 'Financial',
  closed_deceased: 'Closed',
  cancelled: 'Cancelled'
};

export function DischargeWorkflowStepper({ 
  workflowType, 
  currentState,
  className 
}: DischargeWorkflowStepperProps) {
  const stateFlow = workflowType === 'discharge' ? DISCHARGE_STATE_FLOW : DEATH_STATE_FLOW;
  const currentIndex = stateFlow.indexOf(currentState);

  return (
    <div className={cn("flex items-center justify-between", className)}>
      {stateFlow.map((state, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isFuture = index > currentIndex;

        return (
          <div key={state} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                  isCompleted && "bg-green-500 border-green-500 text-white",
                  isCurrent && "bg-primary border-primary text-primary-foreground",
                  isFuture && "bg-muted border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : isFuture ? (
                  <Lock className="w-4 h-4" />
                ) : (
                  <Circle className="w-4 h-4 fill-current" />
                )}
              </div>
              <span
                className={cn(
                  "text-xs mt-2 font-medium text-center w-16",
                  isCompleted && "text-green-600",
                  isCurrent && "text-primary",
                  isFuture && "text-muted-foreground"
                )}
              >
                {STATE_LABELS[state]}
              </span>
            </div>
            {index < stateFlow.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 mx-2",
                  index < currentIndex ? "bg-green-500" : "bg-muted-foreground/30"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
