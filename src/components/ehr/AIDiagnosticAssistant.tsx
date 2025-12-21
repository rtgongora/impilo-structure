import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Brain,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  TestTube,
  Pill,
  Activity,
  ChevronRight,
  Sparkles,
  FlaskConical,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface DiagnosticResult {
  differentials?: { diagnosis: string; likelihood: string; reasoning: string }[];
  recommendedTests?: string[];
  redFlags?: string[];
  clinicalPearls?: string[];
  rawResponse?: string;
}

interface DrugInteractionResult {
  interactions?: { drugs: string[]; severity: string; mechanism: string; clinicalEffect: string; recommendation: string }[];
  safetyAlerts?: string[];
  monitoringRequired?: string[];
  rawResponse?: string;
}

interface LabInterpretationResult {
  interpretation?: { test: string; status: string; clinicalSignificance: string; possibleCauses: string[] }[];
  patterns?: string[];
  recommendations?: string[];
  rawResponse?: string;
}

export function AIDiagnosticAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("diagnostic");
  
  const [symptoms, setSymptoms] = useState("");
  const [medications, setMedications] = useState("");
  const [labResults, setLabResults] = useState("");
  
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [drugResult, setDrugResult] = useState<DrugInteractionResult | null>(null);
  const [labResult, setLabResult] = useState<LabInterpretationResult | null>(null);

  const analyzePatient = async (type: string) => {
    setIsLoading(true);
    try {
      let patientData: Record<string, unknown> = {};
      
      switch (type) {
        case "diagnostic":
          patientData = {
            symptoms: symptoms.split(",").map(s => s.trim()).filter(Boolean),
            age: 45,
            gender: "male"
          };
          break;
        case "drug-interaction":
          patientData = {
            medications: medications.split(",").map(m => m.trim()).filter(Boolean),
            allergies: ["Penicillin"],
            conditions: ["Hypertension", "Type 2 Diabetes"]
          };
          break;
        case "lab-interpretation":
          try {
            patientData = {
              labResults: JSON.parse(labResults || "[]"),
              conditions: ["Chronic Kidney Disease"]
            };
          } catch {
            patientData = {
              labResults: labResults.split(",").map(l => {
                const [name, value] = l.trim().split(":");
                return { name: name?.trim(), value: parseFloat(value) || 0, unit: "" };
              }),
              conditions: []
            };
          }
          break;
      }

      const { data, error } = await supabase.functions.invoke("ai-diagnostic", {
        body: { type, patientData }
      });

      if (error) throw error;

      switch (type) {
        case "diagnostic":
          setDiagnosticResult(data.result);
          break;
        case "drug-interaction":
          setDrugResult(data.result);
          break;
        case "lab-interpretation":
          setLabResult(data.result);
          break;
      }

      toast.success("Analysis complete");
    } catch (error) {
      console.error("AI analysis error:", error);
      toast.error("Failed to analyze. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-topbar-muted hover:text-topbar-foreground"
        >
          <Brain className="w-4 h-4 mr-1" />
          AI Assist
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[700px] sm:max-w-[700px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            AI Diagnostic Assistant
            <Badge variant="secondary" className="ml-2">
              <Sparkles className="w-3 h-3 mr-1" />
              Beta
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="diagnostic">
              <Activity className="w-4 h-4 mr-2" />
              Diagnosis
            </TabsTrigger>
            <TabsTrigger value="drugs">
              <Pill className="w-4 h-4 mr-2" />
              Drug Check
            </TabsTrigger>
            <TabsTrigger value="labs">
              <FlaskConical className="w-4 h-4 mr-2" />
              Lab Analysis
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100vh-220px)] mt-4">
            {/* Diagnostic Tab */}
            <TabsContent value="diagnostic" className="mt-0 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Symptom Analysis</CardTitle>
                  <CardDescription>Enter patient symptoms for differential diagnosis suggestions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Enter symptoms separated by commas (e.g., fever, cough, chest pain, shortness of breath)"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <Button 
                    onClick={() => analyzePatient("diagnostic")} 
                    disabled={isLoading || !symptoms.trim()}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4 mr-2" />
                        Analyze Symptoms
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {diagnosticResult && (
                <div className="space-y-4">
                  {diagnosticResult.differentials && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          Differential Diagnoses
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {diagnosticResult.differentials.map((diff, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <Badge 
                              variant={diff.likelihood === "high" ? "destructive" : diff.likelihood === "medium" ? "secondary" : "outline"}
                              className="shrink-0"
                            >
                              {diff.likelihood}
                            </Badge>
                            <div>
                              <p className="font-medium">{diff.diagnosis}</p>
                              <p className="text-sm text-muted-foreground">{diff.reasoning}</p>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {diagnosticResult.redFlags && diagnosticResult.redFlags.length > 0 && (
                    <Card className="border-destructive">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2 text-destructive">
                          <AlertTriangle className="w-4 h-4" />
                          Red Flags
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {diagnosticResult.redFlags.map((flag, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm">
                              <AlertTriangle className="w-3 h-3 text-destructive shrink-0" />
                              {flag}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {diagnosticResult.recommendedTests && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <TestTube className="w-4 h-4" />
                          Recommended Tests
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {diagnosticResult.recommendedTests.map((test, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm">
                              <ChevronRight className="w-3 h-3 text-muted-foreground" />
                              {test}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {diagnosticResult.clinicalPearls && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-yellow-500" />
                          Clinical Pearls
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {diagnosticResult.clinicalPearls.map((pearl, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <Lightbulb className="w-3 h-3 text-yellow-500 shrink-0 mt-0.5" />
                              {pearl}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Drug Interaction Tab */}
            <TabsContent value="drugs" className="mt-0 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Drug Interaction Check</CardTitle>
                  <CardDescription>Enter medications to check for interactions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Enter medications separated by commas (e.g., Warfarin, Aspirin, Lisinopril, Metformin)"
                    value={medications}
                    onChange={(e) => setMedications(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <Button 
                    onClick={() => analyzePatient("drug-interaction")} 
                    disabled={isLoading || !medications.trim()}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <Pill className="w-4 h-4 mr-2" />
                        Check Interactions
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {drugResult && drugResult.interactions && (
                <div className="space-y-3">
                  {drugResult.interactions.map((interaction, index) => {
                    const severityColors = {
                      critical: "border-destructive bg-destructive/10",
                      major: "border-orange-500 bg-orange-500/10",
                      moderate: "border-warning bg-warning/10",
                      minor: "border-blue-500 bg-blue-500/10"
                    };
                    return (
                      <Card key={index} className={severityColors[interaction.severity as keyof typeof severityColors] || ""}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={interaction.severity === "critical" || interaction.severity === "major" ? "destructive" : "secondary"}>
                              {interaction.severity?.toUpperCase()}
                            </Badge>
                            <span className="font-medium">{interaction.drugs?.join(" + ")}</span>
                          </div>
                          <p className="text-sm mb-2"><strong>Mechanism:</strong> {interaction.mechanism}</p>
                          <p className="text-sm mb-2"><strong>Effect:</strong> {interaction.clinicalEffect}</p>
                          <p className="text-sm"><strong>Recommendation:</strong> {interaction.recommendation}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Lab Interpretation Tab */}
            <TabsContent value="labs" className="mt-0 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Lab Result Interpretation</CardTitle>
                  <CardDescription>Enter lab results for clinical interpretation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder='Enter as JSON: [{"name": "Potassium", "value": 6.2, "unit": "mEq/L"}] or simple format: Potassium:6.2, Creatinine:2.1'
                    value={labResults}
                    onChange={(e) => setLabResults(e.target.value)}
                    className="min-h-[100px] font-mono text-sm"
                  />
                  <Button 
                    onClick={() => analyzePatient("lab-interpretation")} 
                    disabled={isLoading || !labResults.trim()}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Interpreting...
                      </>
                    ) : (
                      <>
                        <FlaskConical className="w-4 h-4 mr-2" />
                        Interpret Results
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {labResult && labResult.interpretation && (
                <div className="space-y-3">
                  {labResult.interpretation.map((interp, index) => {
                    const statusColors = {
                      normal: "text-green-600",
                      abnormal: "text-warning",
                      critical: "text-destructive"
                    };
                    return (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">{interp.test}</span>
                            <Badge variant={interp.status === "critical" ? "destructive" : interp.status === "abnormal" ? "secondary" : "outline"}>
                              {interp.status?.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm mb-2">{interp.clinicalSignificance}</p>
                          {interp.possibleCauses && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Possible causes:</p>
                              <div className="flex flex-wrap gap-1">
                                {interp.possibleCauses.map((cause, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">{cause}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <Separator className="my-4" />
        <p className="text-xs text-muted-foreground text-center">
          AI suggestions are for clinical decision support only. Always verify with clinical judgment.
        </p>
      </SheetContent>
    </Sheet>
  );
}
