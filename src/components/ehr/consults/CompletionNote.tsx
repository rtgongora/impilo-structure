import { useState } from "react";
import {
  CheckCircle,
  FileText,
  AlertTriangle,
  Activity,
  Pill,
  Stethoscope,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { WorklistItem } from "@/contexts/ProviderContext";

// Stage 7: Completion Note & Loop Closure
interface CompletionNote {
  // Actions Taken
  actionsTaken: {
    medsAdministered: string[];
    testsDone: string[];
    proceduresPerformed: string[];
    monitoringDone: string[];
    counselingProvided: string[];
  };
  
  // Patient Outcome
  patientOutcome: "improved" | "deteriorated" | "stable" | "transferred" | "discharged" | "returned" | "";
  outcomeNotes: string;
  
  // Follow-Up Execution
  followUpStatus: "completed" | "partially-completed" | "not-completed" | "";
  followUpReason?: string;
  
  // Outstanding Issues
  outstandingIssues: {
    pendingResults: string[];
    unresolvedSymptoms: string[];
    furtherInquiries: string[];
  };
  
  // Case Closure Narrative
  closureNarrative: string;
}

interface CompletionNoteFormProps {
  referral: WorklistItem;
  responsePackage?: any; // The consultant's response
  onSubmit?: (note: CompletionNote) => void;
  onCancel?: () => void;
}

export function CompletionNoteForm({ referral, responsePackage, onSubmit, onCancel }: CompletionNoteFormProps) {
  const [completionNote, setCompletionNote] = useState<CompletionNote>({
    actionsTaken: {
      medsAdministered: [],
      testsDone: [],
      proceduresPerformed: [],
      monitoringDone: [],
      counselingProvided: [],
    },
    patientOutcome: "",
    outcomeNotes: "",
    followUpStatus: "",
    followUpReason: "",
    outstandingIssues: {
      pendingResults: [],
      unresolvedSymptoms: [],
      furtherInquiries: [],
    },
    closureNarrative: "",
  });
  
  const [expandedSections, setExpandedSections] = useState<string[]>(["actions", "outcome"]);
  const [newItem, setNewItem] = useState<Record<string, string>>({});

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const addToList = (category: keyof CompletionNote["actionsTaken"], value: string) => {
    if (!value.trim()) return;
    setCompletionNote(prev => ({
      ...prev,
      actionsTaken: {
        ...prev.actionsTaken,
        [category]: [...prev.actionsTaken[category], value.trim()]
      }
    }));
    setNewItem(prev => ({ ...prev, [category]: "" }));
  };

  const removeFromList = (category: keyof CompletionNote["actionsTaken"], index: number) => {
    setCompletionNote(prev => ({
      ...prev,
      actionsTaken: {
        ...prev.actionsTaken,
        [category]: prev.actionsTaken[category].filter((_, i) => i !== index)
      }
    }));
  };

  const addOutstandingIssue = (category: keyof CompletionNote["outstandingIssues"], value: string) => {
    if (!value.trim()) return;
    setCompletionNote(prev => ({
      ...prev,
      outstandingIssues: {
        ...prev.outstandingIssues,
        [category]: [...prev.outstandingIssues[category], value.trim()]
      }
    }));
    setNewItem(prev => ({ ...prev, [category]: "" }));
  };

  const isComplete = 
    completionNote.patientOutcome !== "" &&
    completionNote.followUpStatus !== "" &&
    completionNote.closureNarrative.length > 0;

  const handleSubmit = () => {
    if (isComplete) {
      onSubmit?.(completionNote);
      toast.success("Completion note submitted. Case closed.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Completion Note</h2>
              <p className="text-sm text-muted-foreground">
                Stage 7: Document what happened and close the loop
              </p>
            </div>
            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/50">
              Pending Completion
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Response Summary (read-only) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Consultant's Response (Reference)
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div>
            <span className="text-muted-foreground">Diagnosis:</span>
            <span className="font-medium ml-2">Acute coronary syndrome - NSTEMI</span>
          </div>
          <div>
            <span className="text-muted-foreground">Recommended Action:</span>
            <span className="font-medium ml-2">Start dual antiplatelet therapy, urgent cardiology referral</span>
          </div>
          <div>
            <span className="text-muted-foreground">Follow-up:</span>
            <span className="font-medium ml-2">Within 24 hours, teleconsult review</span>
          </div>
        </CardContent>
      </Card>

      {/* Section 1: Actions Taken */}
      <Collapsible open={expandedSections.includes("actions")} onOpenChange={() => toggleSection("actions")}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  ① Actions Taken
                </CardTitle>
                {expandedSections.includes("actions") ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {[
                { key: "medsAdministered", label: "Medications Administered", icon: Pill },
                { key: "testsDone", label: "Tests Done", icon: Stethoscope },
                { key: "proceduresPerformed", label: "Procedures Performed", icon: Activity },
                { key: "monitoringDone", label: "Monitoring Done", icon: Activity },
                { key: "counselingProvided", label: "Counseling Provided", icon: FileText },
              ].map(({ key, label, icon: Icon }) => (
                <div key={key} className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {label}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={newItem[key] || ""}
                      onChange={(e) => setNewItem(prev => ({ ...prev, [key]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToList(key as keyof CompletionNote["actionsTaken"], newItem[key] || ""))}
                      placeholder={`Add ${label.toLowerCase()}...`}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => addToList(key as keyof CompletionNote["actionsTaken"], newItem[key] || "")}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {completionNote.actionsTaken[key as keyof CompletionNote["actionsTaken"]].map((item, i) => (
                      <Badge key={i} variant="secondary" className="pr-1">
                        {item}
                        <button 
                          onClick={() => removeFromList(key as keyof CompletionNote["actionsTaken"], i)}
                          className="ml-2 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section 2: Patient Outcome */}
      <Collapsible open={expandedSections.includes("outcome")} onOpenChange={() => toggleSection("outcome")}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  ② Patient Outcome *
                </CardTitle>
                {expandedSections.includes("outcome") ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <RadioGroup
                value={completionNote.patientOutcome}
                onValueChange={(v) => setCompletionNote(prev => ({ ...prev, patientOutcome: v as CompletionNote["patientOutcome"] }))}
                className="grid grid-cols-3 gap-3"
              >
                {[
                  { value: "improved", label: "Improved", color: "text-success" },
                  { value: "stable", label: "Stable", color: "text-primary" },
                  { value: "deteriorated", label: "Deteriorated", color: "text-destructive" },
                  { value: "transferred", label: "Transferred", color: "text-warning" },
                  { value: "discharged", label: "Discharged", color: "text-success" },
                  { value: "returned", label: "Returned for Review", color: "text-primary" },
                ].map((option) => (
                  <div key={option.value} className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className={cn("cursor-pointer", option.color)}>
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              
              <div className="space-y-2">
                <Label>Outcome Notes</Label>
                <Textarea
                  value={completionNote.outcomeNotes}
                  onChange={(e) => setCompletionNote(prev => ({ ...prev, outcomeNotes: e.target.value }))}
                  placeholder="Additional notes about the patient outcome..."
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section 3: Follow-Up Execution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            ③ Follow-Up Execution *
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={completionNote.followUpStatus}
            onValueChange={(v) => setCompletionNote(prev => ({ ...prev, followUpStatus: v as CompletionNote["followUpStatus"] }))}
            className="space-y-2"
          >
            {[
              { value: "completed", label: "Completed as recommended" },
              { value: "partially-completed", label: "Partially completed" },
              { value: "not-completed", label: "Not completed" },
            ].map((option) => (
              <div key={option.value} className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value={option.value} id={`followup-${option.value}`} />
                <Label htmlFor={`followup-${option.value}`} className="cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {completionNote.followUpStatus && completionNote.followUpStatus !== "completed" && (
            <div className="space-y-2">
              <Label className="text-destructive">Reason (Required)</Label>
              <Textarea
                value={completionNote.followUpReason}
                onChange={(e) => setCompletionNote(prev => ({ ...prev, followUpReason: e.target.value }))}
                placeholder="Why was follow-up not completed as recommended?"
                className="border-destructive/50"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 4: Outstanding Issues */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            ④ Outstanding Issues
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "pendingResults", label: "Pending Results" },
            { key: "unresolvedSymptoms", label: "Unresolved Symptoms" },
            { key: "furtherInquiries", label: "Further Inquiries Needed" },
          ].map(({ key, label }) => (
            <div key={key} className="space-y-2">
              <Label>{label}</Label>
              <div className="flex gap-2">
                <Input
                  value={newItem[key] || ""}
                  onChange={(e) => setNewItem(prev => ({ ...prev, [key]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOutstandingIssue(key as keyof CompletionNote["outstandingIssues"], newItem[key] || ""))}
                  placeholder={`Add ${label.toLowerCase()}...`}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => addOutstandingIssue(key as keyof CompletionNote["outstandingIssues"], newItem[key] || "")}
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {completionNote.outstandingIssues[key as keyof CompletionNote["outstandingIssues"]].map((item, i) => (
                  <Badge key={i} variant="outline" className="bg-warning/10 border-warning/50">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Section 5: Case Closure Narrative */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-5 h-5" />
            ⑤ Case Closure Narrative *
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={completionNote.closureNarrative}
            onChange={(e) => setCompletionNote(prev => ({ ...prev, closureNarrative: e.target.value }))}
            placeholder="Write a brief summary of the teleconsultation case, including key decisions made and outcomes achieved..."
            className="min-h-[120px]"
          />
          <p className="text-xs text-muted-foreground mt-2">
            This will be permanently archived in the patient timeline.
          </p>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-between">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Save as Draft
          </Button>
        )}
        <Button 
          onClick={handleSubmit}
          disabled={!isComplete}
          className="bg-success hover:bg-success/90"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Submit & Close Case
        </Button>
      </div>
    </div>
  );
}
