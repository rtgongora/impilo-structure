import { useState, useEffect } from "react";
import { 
  LogOut, Skull, AlertTriangle, Clock, Check, 
  FileText, DollarSign, ClipboardCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DischargeWorkflowStepper } from "./DischargeWorkflowStepper";
import { ClearanceChecklist } from "./ClearanceChecklist";
import { DischargeCase, DischargeClearance, DISCHARGE_STATE_FLOW, DEATH_STATE_FLOW } from "./types";

interface DischargeWorkflowPanelProps {
  visitId: string;
  patientId: string;
  encounterId?: string;
  facilityId?: string;
  onComplete?: () => void;
}

export function DischargeWorkflowPanel({
  visitId,
  patientId,
  encounterId,
  facilityId,
  onComplete
}: DischargeWorkflowPanelProps) {
  const [dischargeCase, setDischargeCase] = useState<DischargeCase | null>(null);
  const [clearances, setClearances] = useState<DischargeClearance[]>([]);
  const [loading, setLoading] = useState(true);
  const [initiating, setInitiating] = useState(false);

  useEffect(() => {
    loadDischargeCase();
  }, [visitId]);

  const loadDischargeCase = async () => {
    setLoading(true);
    try {
      // Check for existing discharge case
      const { data: existingCase, error } = await supabase
        .from('discharge_cases')
        .select('*')
        .eq('visit_id', visitId)
        .maybeSingle();

      if (error) throw error;

      if (existingCase) {
        setDischargeCase(existingCase as unknown as DischargeCase);
        
        // Load clearances
        const { data: clearanceData } = await supabase
          .from('discharge_clearances')
          .select('*')
          .eq('discharge_case_id', existingCase.id)
          .order('sequence_order');

        setClearances((clearanceData || []) as unknown as DischargeClearance[]);
      }
    } catch (error) {
      console.error('Load discharge case error:', error);
    } finally {
      setLoading(false);
    }
  };

  const initiateWorkflow = async (workflowType: 'discharge' | 'death') => {
    setInitiating(true);
    try {
      const { data, error } = await supabase
        .from('discharge_cases')
        .insert([{
          visit_id: visitId,
          patient_id: patientId,
          encounter_id: encounterId || null,
          facility_id: facilityId || null,
          workflow_type: workflowType,
          workflow_state: workflowType === 'discharge' ? 'discharge_initiated' : 'death_declared',
          decision_datetime: new Date().toISOString()
        }] as any)
        .select()
        .single();

      if (error) throw error;
      
      toast.success(`${workflowType === 'discharge' ? 'Discharge' : 'Death'} workflow initiated`);
      await loadDischargeCase();
    } catch (error) {
      console.error('Initiate workflow error:', error);
      toast.error("Failed to initiate workflow");
    } finally {
      setInitiating(false);
    }
  };

  const advanceState = async () => {
    if (!dischargeCase) return;

    const stateFlow = dischargeCase.workflow_type === 'discharge' 
      ? DISCHARGE_STATE_FLOW 
      : DEATH_STATE_FLOW;
    
    const currentIndex = stateFlow.indexOf(dischargeCase.workflow_state);
    if (currentIndex === -1 || currentIndex >= stateFlow.length - 1) return;

    // Check if all clearances for current stage are complete
    const pendingClearances = clearances.filter(c => 
      c.status !== 'cleared' && c.status !== 'waived' && c.status !== 'not_applicable'
    );

    if (pendingClearances.length > 0) {
      toast.error("Complete all clearances before proceeding");
      return;
    }

    const nextState = stateFlow[currentIndex + 1];

    try {
      // Record transition
      await supabase.from('discharge_state_transitions').insert([{
        discharge_case_id: dischargeCase.id,
        from_state: dischargeCase.workflow_state,
        to_state: nextState,
        transitioned_by: (await supabase.auth.getUser()).data.user?.id,
        clearance_snapshot: clearances
      }] as any);

      // Update case
      const updateData: any = { 
        workflow_state: nextState 
      };

      // Set closed_at if final state
      if (nextState === 'closed_discharged' || nextState === 'closed_deceased') {
        updateData.closed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('discharge_cases')
        .update(updateData)
        .eq('id', dischargeCase.id);

      if (error) throw error;
      
      toast.success("Workflow advanced");
      await loadDischargeCase();

      if (nextState === 'closed_discharged' || nextState === 'closed_deceased') {
        onComplete?.();
      }
    } catch (error) {
      console.error('Advance state error:', error);
      toast.error("Failed to advance workflow");
    }
  };

  const getClearanceProgress = () => {
    if (clearances.length === 0) return 0;
    const completed = clearances.filter(c => 
      c.status === 'cleared' || c.status === 'waived' || c.status === 'not_applicable'
    ).length;
    return Math.round((completed / clearances.length) * 100);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Loading discharge workflow...
        </CardContent>
      </Card>
    );
  }

  // No active workflow - show initiation options
  if (!dischargeCase) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Visit Closure</CardTitle>
          <CardDescription>
            Select the type of workflow to initiate
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card 
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => initiateWorkflow('discharge')}
            >
              <CardContent className="p-6 text-center">
                <LogOut className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                <h3 className="font-semibold mb-2">Discharge (Alive)</h3>
                <p className="text-sm text-muted-foreground">
                  Patient is being discharged from care
                </p>
                <Button className="mt-4" disabled={initiating}>
                  Initiate Discharge
                </Button>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:border-destructive transition-colors"
              onClick={() => initiateWorkflow('death')}
            >
              <CardContent className="p-6 text-center">
                <Skull className="w-12 h-12 mx-auto mb-4 text-purple-500" />
                <h3 className="font-semibold mb-2">Death</h3>
                <p className="text-sm text-muted-foreground">
                  Patient has passed away
                </p>
                <Button variant="secondary" className="mt-4" disabled={initiating}>
                  Declare Death
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Active workflow
  const isComplete = dischargeCase.workflow_state === 'closed_discharged' || 
                     dischargeCase.workflow_state === 'closed_deceased';

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {dischargeCase.workflow_type === 'discharge' ? (
                  <LogOut className="w-5 h-5 text-blue-500" />
                ) : (
                  <Skull className="w-5 h-5 text-purple-500" />
                )}
                {dischargeCase.workflow_type === 'discharge' ? 'Discharge' : 'Death'} Workflow
              </CardTitle>
              <CardDescription>
                Case #{dischargeCase.case_number}
              </CardDescription>
            </div>
            <Badge variant={isComplete ? "default" : "outline"}>
              {isComplete ? 'Completed' : 'In Progress'} - {getClearanceProgress()}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <DischargeWorkflowStepper
            workflowType={dischargeCase.workflow_type}
            currentState={dischargeCase.workflow_state}
          />
        </CardContent>
      </Card>

      {/* Clearances */}
      <Tabs defaultValue="clearances">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="clearances" className="gap-2">
            <ClipboardCheck className="w-4 h-4" />
            Clearances
          </TabsTrigger>
          <TabsTrigger value="financial" className="gap-2">
            <DollarSign className="w-4 h-4" />
            Financial
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="w-4 h-4" />
            Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clearances" className="space-y-4 mt-4">
          {clearances.map((clearance) => (
            <ClearanceChecklist
              key={clearance.id}
              clearance={clearance}
              onUpdate={loadDischargeCase}
              readOnly={isComplete}
            />
          ))}
        </TabsContent>

        <TabsContent value="financial" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Financial Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Total Charges</div>
                  <div className="text-2xl font-bold">${dischargeCase.total_charges.toFixed(2)}</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Total Paid</div>
                  <div className="text-2xl font-bold text-green-600">${dischargeCase.total_paid.toFixed(2)}</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Waived</div>
                  <div className="text-2xl font-bold text-purple-600">${dischargeCase.total_waived.toFixed(2)}</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Outstanding</div>
                  <div className="text-2xl font-bold text-red-600">${dischargeCase.outstanding_balance.toFixed(2)}</div>
                </div>
              </div>
              
              <div className="mt-4 p-3 rounded-lg border">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Financial Status</span>
                  <Badge>{dischargeCase.financial_status}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Documents will be generated upon workflow completion</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      {!isComplete && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Complete all clearances to proceed to the next stage
              </div>
              <Button onClick={advanceState}>
                <Check className="w-4 h-4 mr-2" />
                Advance Workflow
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
