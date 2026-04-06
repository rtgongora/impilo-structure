import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileHeart,
  Download,
  Share2,
  QrCode,
  Pill,
  AlertTriangle,
  Syringe,
  Activity,
  FileText,
  Heart,
  ExternalLink,
  Upload
} from "lucide-react";
import { IPSViewer } from "./IPSViewer";
import { ConditionsList } from "./ConditionsList";
import { ImmunizationRecords } from "./ImmunizationRecords";
import { AllergyList } from "./AllergyList";
import { ClinicalDocuments } from "./ClinicalDocuments";
import { HealthDataExport } from "./HealthDataExport";
import { PatientDocumentsPanel } from "@/components/landela/PatientDocumentsPanel";
import { ClinicalDocumentScanner } from "@/components/documents/ClinicalDocumentScanner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function PortalPHRHub() {
  const [activeTab, setActiveTab] = useState("summary");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileHeart className="h-5 w-5 text-primary" />
            My Health Records
          </h2>
          <p className="text-sm text-muted-foreground">
            Your complete personal health record
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <QrCode className="h-4 w-4 mr-2" />
                Generate QR Code
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ExternalLink className="h-4 w-4 mr-2" />
                Create Shareable Link
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <FileText className="h-4 w-4 mr-2" />
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileHeart className="h-4 w-4 mr-2" />
                Export FHIR Bundle
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <QuickStatCard
          icon={Heart}
          label="Conditions"
          value="3"
          color="text-primary"
          onClick={() => setActiveTab("conditions")}
        />
        <QuickStatCard
          icon={Pill}
          label="Medications"
          value="4"
          color="text-success"
          onClick={() => setActiveTab("summary")}
        />
        <QuickStatCard
          icon={AlertTriangle}
          label="Allergies"
          value="2"
          color="text-destructive"
          onClick={() => setActiveTab("allergies")}
        />
        <QuickStatCard
          icon={Syringe}
          label="Immunizations"
          value="8"
          color="text-info"
          onClick={() => setActiveTab("immunizations")}
        />
        <QuickStatCard
          icon={FileText}
          label="Documents"
          value="12"
          color="text-muted-foreground"
          onClick={() => setActiveTab("documents")}
        />
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="summary" className="text-xs">
            <FileHeart className="h-3.5 w-3.5 mr-1.5" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="conditions" className="text-xs">
            <Activity className="h-3.5 w-3.5 mr-1.5" />
            Conditions
          </TabsTrigger>
          <TabsTrigger value="allergies" className="text-xs">
            <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
            Allergies
          </TabsTrigger>
          <TabsTrigger value="immunizations" className="text-xs">
            <Syringe className="h-3.5 w-3.5 mr-1.5" />
            Immunizations
          </TabsTrigger>
          <TabsTrigger value="documents" className="text-xs">
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="export" className="text-xs">
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-4">
          <IPSViewer />
        </TabsContent>

        <TabsContent value="conditions" className="mt-4">
          <ConditionsList />
        </TabsContent>

        <TabsContent value="allergies" className="mt-4">
          <AllergyList />
        </TabsContent>

        <TabsContent value="immunizations" className="mt-4">
          <ImmunizationRecords />
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <ClinicalDocuments />
        </TabsContent>

        <TabsContent value="export" className="mt-4">
          <HealthDataExport />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface QuickStatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
  onClick: () => void;
}

function QuickStatCard({ icon: Icon, label, value, color, onClick }: QuickStatCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-left"
    >
      <Icon className={`h-5 w-5 ${color}`} />
      <div>
        <p className="text-lg font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </button>
  );
}
