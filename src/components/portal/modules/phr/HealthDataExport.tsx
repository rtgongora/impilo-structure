import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  FileText,
  FileHeart,
  FileJson,
  Share2,
  QrCode,
  Link,
  Mail,
  Clock,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ExportSection {
  id: string;
  label: string;
  description: string;
  recordCount: number;
  selected: boolean;
}

const INITIAL_SECTIONS: ExportSection[] = [
  { id: "demographics", label: "Demographics", description: "Name, DOB, contact information", recordCount: 1, selected: true },
  { id: "conditions", label: "Conditions & Problems", description: "Active and resolved diagnoses", recordCount: 5, selected: true },
  { id: "medications", label: "Medications", description: "Current and past prescriptions", recordCount: 4, selected: true },
  { id: "allergies", label: "Allergies & Intolerances", description: "Drug and food allergies", recordCount: 3, selected: true },
  { id: "immunizations", label: "Immunizations", description: "Vaccination history", recordCount: 8, selected: true },
  { id: "labResults", label: "Lab Results", description: "Blood tests and other labs", recordCount: 12, selected: false },
  { id: "vitalSigns", label: "Vital Signs", description: "Blood pressure, weight, etc.", recordCount: 24, selected: false },
  { id: "procedures", label: "Procedures", description: "Surgeries and procedures", recordCount: 2, selected: false },
  { id: "documents", label: "Clinical Documents", description: "Summaries, reports, letters", recordCount: 15, selected: false },
];

export function HealthDataExport() {
  const [sections, setSections] = useState<ExportSection[]>(INITIAL_SECTIONS);
  const [exportFormat, setExportFormat] = useState<"pdf" | "fhir" | "ccd">("pdf");
  const [isExporting, setIsExporting] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  const toggleSection = (id: string) => {
    setSections(prev => prev.map(s => 
      s.id === id ? { ...s, selected: !s.selected } : s
    ));
  };

  const selectAll = () => {
    setSections(prev => prev.map(s => ({ ...s, selected: true })));
  };

  const selectNone = () => {
    setSections(prev => prev.map(s => ({ ...s, selected: false })));
  };

  const selectedSections = sections.filter(s => s.selected);
  const totalRecords = selectedSections.reduce((sum, s) => sum + s.recordCount, 0);

  const handleExport = async () => {
    if (selectedSections.length === 0) {
      toast.error("Please select at least one section to export");
      return;
    }

    setIsExporting(true);
    
    // Simulate export process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsExporting(false);
    toast.success(`Health record exported as ${exportFormat.toUpperCase()}`);
  };

  const handleShare = () => {
    setShowShareDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Download className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold">Export Your Health Data</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Download your complete health record or share it securely with healthcare providers.
                Your data belongs to you.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Section Selection */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Select Data to Export</CardTitle>
                  <CardDescription>Choose which sections to include</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAll}>Select All</Button>
                  <Button variant="ghost" size="sm" onClick={selectNone}>Clear</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {sections.map((section) => (
                <div 
                  key={section.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    section.selected ? "bg-primary/5 border-primary/20" : "hover:bg-accent/50"
                  }`}
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox 
                      checked={section.selected} 
                      onCheckedChange={() => toggleSection(section.id)}
                    />
                    <div>
                      <p className="font-medium text-sm">{section.label}</p>
                      <p className="text-xs text-muted-foreground">{section.description}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {section.recordCount} records
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Export Options */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Export Format</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={exportFormat} onValueChange={(v) => setExportFormat(v as typeof exportFormat)}>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer">
                    <RadioGroupItem value="pdf" id="pdf" />
                    <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer flex-1">
                      <FileText className="h-4 w-4 text-destructive" />
                      <div>
                        <p className="font-medium text-sm">PDF Document</p>
                        <p className="text-xs text-muted-foreground">Human-readable format</p>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer">
                    <RadioGroupItem value="fhir" id="fhir" />
                    <Label htmlFor="fhir" className="flex items-center gap-2 cursor-pointer flex-1">
                      <FileHeart className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium text-sm">FHIR Bundle (JSON)</p>
                        <p className="text-xs text-muted-foreground">HL7 FHIR R4 standard</p>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer">
                    <RadioGroupItem value="ccd" id="ccd" />
                    <Label htmlFor="ccd" className="flex items-center gap-2 cursor-pointer flex-1">
                      <FileJson className="h-4 w-4 text-info" />
                      <div>
                        <p className="font-medium text-sm">C-CDA (XML)</p>
                        <p className="text-xs text-muted-foreground">Clinical document format</p>
                      </div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sections selected</span>
                <span className="font-medium">{selectedSections.length} of {sections.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total records</span>
                <span className="font-medium">{totalRecords}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Format</span>
                <span className="font-medium">{exportFormat.toUpperCase()}</span>
              </div>
              <Separator />
              <div className="space-y-2">
                <Button 
                  className="w-full" 
                  onClick={handleExport}
                  disabled={isExporting || selectedSections.length === 0}
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download Export
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleShare}
                  disabled={selectedSections.length === 0}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Securely
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-success mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Your data is protected</p>
                  <p>
                    Exports are encrypted and logged. Shared links expire automatically 
                    and can be revoked at any time.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Health Record</DialogTitle>
            <DialogDescription>
              Create a secure, time-limited share link
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={() => {
                toast.success("QR code generated!");
                setShowShareDialog(false);
              }}>
                <QrCode className="h-4 w-4 mr-3" />
                Generate QR Code
                <span className="ml-auto text-xs text-muted-foreground">Show on screen</span>
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => {
                toast.success("Link copied to clipboard!");
                setShowShareDialog(false);
              }}>
                <Link className="h-4 w-4 mr-3" />
                Copy Secure Link
                <span className="ml-auto text-xs text-muted-foreground">Expires in 24h</span>
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => {
                toast.success("Email dialog would open");
                setShowShareDialog(false);
              }}>
                <Mail className="h-4 w-4 mr-3" />
                Send via Email
                <span className="ml-auto text-xs text-muted-foreground">To provider</span>
              </Button>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted p-3 rounded-lg">
              <Clock className="h-4 w-4" />
              <span>Shared links automatically expire after 24 hours for your security.</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
