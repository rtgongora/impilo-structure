import { useState, useEffect } from "react";
import { 
  LogOut, Skull, Check, ScanLine, Upload,
  FileText, DollarSign, ClipboardCheck, Home, Building2, UserX, ArrowRightLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DischargeWorkflowStepper } from "./DischargeWorkflowStepper";
import { ClearanceChecklist } from "./ClearanceChecklist";
import { PatientDocumentsPanel } from "@/components/landela/PatientDocumentsPanel";
import { ClinicalDocumentScanner } from "@/components/documents/ClinicalDocumentScanner";
import { 
  DischargeCase, 
  DischargeClearance, 
  DischargeDecisionType,
  DischargeDestination,
  DISCHARGE_STATE_FLOW, 
  DEATH_STATE_FLOW,
  DECISION_TO_OUTCOME,
  DISCHARGE_DESTINATION_LABELS
} from "./types";

interface DischargeWorkflowPanelProps {
  visitId: string;
  patientId: string;
  encounterId?: string;
  facilityId?: string;
  onComplete?: () => void;
}

const DECISION_TYPE_OPTIONS: { value: DischargeDecisionType; label: string; icon: typeof Home; description: string }[] = [
  { value: 'routine', label: 'Routine Discharge', icon: Home, description: 'Normal discharge after treatment' },
  { value: 'dama', label: 'Left AMA', icon: UserX, description: 'Discharged against medical advice' },
  { value: 'referral', label: 'Referral Out', icon: ArrowRightLeft, description: 'Referred to another provider' },
  { value: 'transfer', label: 'Transfer', icon: Building2, description: 'Formal transfer to another facility' },
  { value: 'absconded', label: 'Absconded', icon: UserX, description: 'Patient left without notice' },
];

const DESTINATION_OPTIONS: { value: DischargeDestination; label: string }[] = [
  { value: 'discharged_home', label: 'Home' },
  { value: 'discharged_care', label: 'Care Facility / Nursing Home' },
];

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
  
  // Discharge initiation form state
  const [decisionType, setDecisionType] = useState<DischargeDecisionType>('routine');
  const [destination, setDestination] = useState<DischargeDestination>('discharged_home');
  const [decisionReason, setDecisionReason] = useState('');
  const [showInitForm, setShowInitForm] = useState(false);

  useEffect(() => {
    loadDischargeCase();
  }, [visitId]);

  const loadDischargeCase = async () => {
    setLoading(true);
    try {
      const { data: existingCase, error } = await supabase
        .from('discharge_cases')
        .select('*')
        .eq('visit_id', visitId)
        .maybeSingle();

      if (error) throw error;

      if (existingCase) {
        setDischargeCase(existingCase as unknown as DischargeCase);
        
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

  // Determine the final visit outcome based on decision type and destination
  const getVisitOutcome = (type: DischargeDecisionType, dest?: DischargeDestination): DischargeDestination => {
    const mappedOutcome = DECISION_TO_OUTCOME[type];
    if (mappedOutcome) return mappedOutcome;
    return dest || 'discharged_home';
  };

  const initiateWorkflow = async (workflowType: 'discharge' | 'death') => {
    setInitiating(true);
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const finalOutcome = workflowType === 'death' 
        ? 'death' as DischargeDestination
        : getVisitOutcome(decisionType, destination);

      const { data, error } = await supabase
        .from('discharge_cases')
        .insert([{
          visit_id: visitId,
          patient_id: patientId,
          encounter_id: encounterId || null,
          facility_id: facilityId || null,
          workflow_type: workflowType,
          workflow_state: workflowType === 'discharge' ? 'discharge_initiated' : 'death_declared',
          decision_type: workflowType === 'death' ? 'death' : decisionType,
          decision_reason: decisionReason || null,
          decision_datetime: new Date().toISOString(),
          decision_by: userId
        }] as any)
        .select()
        .single();

      if (error) throw error;
      
      toast.success(`${workflowType === 'discharge' ? 'Discharge' : 'Death'} workflow initiated`);
      setShowInitForm(false);
      await loadDischargeCase();
    } catch (error) {
      console.error('Initiate workflow error:', error);
      toast.error("Failed to initiate workflow");
    } finally {
      setInitiating(false);
    }
  };

  // Update the visits table with final outcome when workflow closes
  const updateVisitOutcome = async (outcome: string) => {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const now = new Date().toISOString();

      // Cast outcome to the expected enum type
      const { error } = await supabase
        .from('visits')
        .update({
          status: 'completed' as const,
          outcome: outcome as any,
          outcome_at: now,
          outcome_by: userId,
          end_date: now
        })
        .eq('id', visitId);

      if (error) throw error;
      console.log('Visit outcome updated:', outcome);
    } catch (error) {
      console.error('Failed to update visit outcome:', error);
      throw error;
    }
  };

  const advanceState = async () => {
    if (!dischargeCase) return;

    const stateFlow = dischargeCase.workflow_type === 'discharge' 
      ? DISCHARGE_STATE_FLOW 
      : DEATH_STATE_FLOW;
    
    const currentIndex = stateFlow.indexOf(dischargeCase.workflow_state);
    if (currentIndex === -1 || currentIndex >= stateFlow.length - 1) return;

    const pendingClearances = clearances.filter(c => 
      c.status !== 'cleared' && c.status !== 'waived' && c.status !== 'not_applicable'
    );

    if (pendingClearances.length > 0) {
      toast.error("Complete all clearances before proceeding");
      return;
    }

    const nextState = stateFlow[currentIndex + 1];

    try {
      await supabase.from('discharge_state_transitions').insert([{
        discharge_case_id: dischargeCase.id,
        from_state: dischargeCase.workflow_state,
        to_state: nextState,
        transitioned_by: (await supabase.auth.getUser()).data.user?.id,
        clearance_snapshot: clearances
      }] as any);

      const updateData: any = { 
        workflow_state: nextState 
      };

      // Set closed_at and update visit outcome if final state
      if (nextState === 'closed_discharged' || nextState === 'closed_deceased') {
        updateData.closed_at = new Date().toISOString();
        
        // Determine and write visit outcome
        const visitOutcome = dischargeCase.workflow_type === 'death'
          ? 'death'
          : getVisitOutcome(
              dischargeCase.decision_type as DischargeDecisionType || 'routine',
              dischargeCase.discharge_destination
            );
        
        await updateVisitOutcome(visitOutcome);
      }

      const { error } = await supabase
        .from('discharge_cases')
        .update(updateData)
        .eq('id', dischargeCase.id);

      if (error) throw error;
      
      toast.success(nextState.includes('closed') ? "Visit closed successfully" : "Workflow advanced");
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
    if (showInitForm) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Initiate Discharge</CardTitle>
            <CardDescription>
              Select the discharge type and destination
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Decision Type */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Discharge Type</Label>
              <RadioGroup
                value={decisionType}
                onValueChange={(v) => setDecisionType(v as DischargeDecisionType)}
                className="grid grid-cols-1 gap-2"
              >
                {DECISION_TYPE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <div key={option.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <Label htmlFor={option.value} className="font-medium cursor-pointer">
                          {option.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>

            {/* Destination (only for routine discharge) */}
            {decisionType === 'routine' && (
              <div className="space-y-3">
                <Label className="text-base font-medium">Discharge Destination</Label>
                <RadioGroup
                  value={destination}
                  onValueChange={(v) => setDestination(v as DischargeDestination)}
                  className="grid grid-cols-2 gap-2"
                >
                  {DESTINATION_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label htmlFor={option.value} className="cursor-pointer">{option.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Reason (required for non-routine) */}
            {decisionType !== 'routine' && (
              <div className="space-y-2">
                <Label className="text-base font-medium">
                  Reason {decisionType === 'dama' && <span className="text-destructive">*</span>}
                </Label>
                <Textarea
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  placeholder={`Document the reason for ${DECISION_TYPE_OPTIONS.find(o => o.value === decisionType)?.label.toLowerCase()}...`}
                  rows={3}
                />
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowInitForm(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => initiateWorkflow('discharge')}
                disabled={initiating || (decisionType === 'dama' && !decisionReason)}
              >
                {initiating ? 'Initiating...' : 'Start Discharge Workflow'}
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

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
              onClick={() => setShowInitForm(true)}
            >
              <CardContent className="p-6 text-center">
                <LogOut className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                <h3 className="font-semibold mb-2">Discharge (Alive)</h3>
                <p className="text-sm text-muted-foreground">
                  Patient is being discharged from care
                </p>
                <Button className="mt-4">
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
                {dischargeCase.decision_type && (
                  <span className="ml-2">
                    • {DECISION_TYPE_OPTIONS.find(o => o.value === dischargeCase.decision_type)?.label || dischargeCase.decision_type}
                  </span>
                )}
                {dischargeCase.discharge_destination && (
                  <span className="ml-2">
                    • {DISCHARGE_DESTINATION_LABELS[dischargeCase.discharge_destination]}
                  </span>
                )}
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
          {clearances.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No clearances required for this workflow
              </CardContent>
            </Card>
          ) : (
            clearances.map((clearance) => (
              <ClearanceChecklist
                key={clearance.id}
                clearance={clearance}
                onUpdate={loadDischargeCase}
                readOnly={isComplete}
              />
            ))
          )}
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
                  <div className="text-2xl font-bold">${(dischargeCase.total_charges || 0).toFixed(2)}</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Total Paid</div>
                  <div className="text-2xl font-bold text-green-600">${(dischargeCase.total_paid || 0).toFixed(2)}</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Waived</div>
                  <div className="text-2xl font-bold text-purple-600">${(dischargeCase.total_waived || 0).toFixed(2)}</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Outstanding</div>
                  <div className="text-2xl font-bold text-red-600">${(dischargeCase.outstanding_balance || 0).toFixed(2)}</div>
                </div>
              </div>
              
              <div className="mt-4 p-3 rounded-lg border">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Financial Status</span>
                  <Badge>{dischargeCase.financial_status || 'pending'}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Discharge Documents</h3>
            <ClinicalDocumentScanner
              variant="button"
              context="encounter"
              onDocumentScanned={() => {}}
              buttonLabel="Scan Document"
            />
          </div>
          <PatientDocumentsPanel
            patientId={patientId}
            visitId={visitId}
          />
        </TabsContent>
      </Tabs>

      {/* Actions */}
      {!isComplete && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {clearances.length > 0 
                  ? "Complete all clearances to proceed to the next stage"
                  : "Ready to advance workflow"
                }
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
