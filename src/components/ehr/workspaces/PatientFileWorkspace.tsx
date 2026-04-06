// Patient File Workspace - Longitudinal View
// Implements the dual-mode UX: Patient File (Visits & Admissions timeline + Documents + IPS)

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  Calendar, 
  Shield, 
  RefreshCw, 
  Share2, 
  QrCode,
  AlertCircle,
  Pill,
  Heart,
  Syringe,
  Activity,
  ScanLine
} from "lucide-react";
import { useEHR } from "@/contexts/EHRContext";
import { PatientDocumentsPanel } from "@/components/landela/PatientDocumentsPanel";
import { ClinicalDocumentScanner, ScannedDocument } from "@/components/documents/ClinicalDocumentScanner";
import { VisitsTimeline } from "@/components/patient/VisitsTimeline";
import { usePatientSummary } from "@/hooks/useSummaries";
import { toast } from "sonner";

export function PatientFileWorkspace() {
  const { currentEncounter } = useEHR();
  const patientId = currentEncounter?.patient.id;
  const [activeTab, setActiveTab] = useState("visits");
  
  const { ips, loading: ipsLoading, generating, fetchIPS, generateNewIPS, shareIPS } = usePatientSummary(patientId || "");

  if (!patientId) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No patient selected
      </div>
    );
  }

  const handleGenerateIPS = async () => {
    const result = await generateNewIPS({ trigger: "on_demand" });
    if (result) {
      toast.success("Patient Summary generated successfully");
    } else {
      toast.error("Failed to generate summary");
    }
  };

  const handleShareIPS = async () => {
    if (!ips) return;
    const token = await shareIPS({
      recipientType: "provider",
      accessLevel: "full",
      expiresInHours: 24,
      generateQR: true,
    });
    if (token) {
      toast.success("Share link created - valid for 24 hours");
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b bg-card px-4">
          <TabsList className="h-12 bg-transparent">
            <TabsTrigger value="visits" className="gap-2 data-[state=active]:bg-muted">
              <Calendar className="h-4 w-4" />
              Visits & Admissions
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2 data-[state=active]:bg-muted">
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="ips" className="gap-2 data-[state=active]:bg-muted">
              <Shield className="h-4 w-4" />
              Patient Summary (IPS)
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          {/* Visits Tab */}
          <TabsContent value="visits" className="h-full m-0 p-6 overflow-auto">
            <VisitsTimeline patientId={patientId} />
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="h-full m-0 p-6 overflow-auto">
            <PatientDocumentsPanel patientId={patientId} />
          </TabsContent>

          {/* IPS Tab */}
          <TabsContent value="ips" className="h-full m-0 p-6 overflow-auto">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* IPS Header */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      International Patient Summary
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      HL7 FHIR R4 compliant longitudinal care summary
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleGenerateIPS}
                      disabled={generating}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
                      {generating ? "Generating..." : "Regenerate"}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleShareIPS}
                      disabled={!ips}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    <Button variant="outline" size="sm" disabled={!ips}>
                      <QrCode className="h-4 w-4 mr-2" />
                      QR Code
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {ipsLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading summary...</div>
                  ) : !ips ? (
                    <div className="text-center py-8 space-y-4">
                      <p className="text-muted-foreground">No patient summary available yet.</p>
                      <Button onClick={handleGenerateIPS} disabled={generating}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
                        Generate Patient Summary
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 text-sm">
                      <Badge variant="secondary">Generated: {new Date(ips.generatedAt).toLocaleString()}</Badge>
                      <Badge variant="outline" className="capitalize">{ips.status}</Badge>
                      {ips.shareToken && (
                        <Badge variant="default">Shareable</Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* IPS Sections */}
              {ips && (
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Allergies */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        Allergies & Intolerances
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-32">
                        {ips.allergies.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No known allergies</p>
                        ) : (
                          <ul className="space-y-2">
                            {ips.allergies.map((allergy) => (
                              <li key={allergy.id} className="flex items-center justify-between text-sm">
                                <span>{allergy.substance}</span>
                                <Badge 
                                  variant={allergy.severity === 'severe' ? 'destructive' : 'secondary'}
                                  className="text-xs"
                                >
                                  {allergy.severity || allergy.status}
                                </Badge>
                              </li>
                            ))}
                          </ul>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* Medications */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Pill className="h-4 w-4 text-blue-500" />
                        Active Medications
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-32">
                        {ips.medications.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No active medications</p>
                        ) : (
                          <ul className="space-y-2">
                            {ips.medications.map((med) => (
                              <li key={med.id} className="text-sm">
                                <div className="font-medium">{med.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {med.dose} {med.route} {med.frequency}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* Conditions */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Heart className="h-4 w-4 text-rose-500" />
                        Active Problems
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-32">
                        {ips.conditions.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No documented conditions</p>
                        ) : (
                          <ul className="space-y-2">
                            {ips.conditions.map((condition) => (
                              <li key={condition.id} className="flex items-center justify-between text-sm">
                                <span>{condition.name}</span>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {condition.status}
                                </Badge>
                              </li>
                            ))}
                          </ul>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* Immunizations */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Syringe className="h-4 w-4 text-green-500" />
                        Immunizations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-32">
                        {ips.immunizations.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No immunization records</p>
                        ) : (
                          <ul className="space-y-2">
                            {ips.immunizations.map((imm) => (
                              <li key={imm.id} className="text-sm">
                                <div className="font-medium">{imm.vaccine}</div>
                                <div className="text-xs text-muted-foreground">
                                  {imm.date ? new Date(imm.date).toLocaleDateString() : 'Date unknown'}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* Recent Results */}
                  <Card className="md:col-span-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Activity className="h-4 w-4 text-purple-500" />
                        Key Results
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-32">
                        {(!ips.diagnosticResults || ips.diagnosticResults.length === 0) ? (
                          <p className="text-sm text-muted-foreground">No recent diagnostic results</p>
                        ) : (
                          <div className="grid gap-2 grid-cols-2 md:grid-cols-3">
                            {ips.diagnosticResults.slice(0, 6).map((result) => (
                              <div key={result.id} className="p-2 bg-muted rounded-md text-sm">
                                <div className="font-medium truncate">{result.testName}</div>
                                <div className={`text-xs ${
                                  result.interpretation === 'critical' ? 'text-destructive font-bold' :
                                  result.interpretation === 'abnormal' ? 'text-yellow-600' :
                                  'text-muted-foreground'
                                }`}>
                                  {result.value} {result.unit}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
