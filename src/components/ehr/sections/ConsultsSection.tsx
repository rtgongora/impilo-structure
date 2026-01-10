import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Send, Video, LayoutDashboard, FileText, Activity } from "lucide-react";
import { ConsultsDashboard } from "../consults/ConsultsDashboard";
import { ReferralBuilder } from "../consults/ReferralBuilder";
import { TeleconsultSession } from "../consults/TeleconsultSession";
import { CompletionNoteForm } from "../consults/CompletionNote";
import { TelehealthDashboard } from "../consults/TelehealthDashboard";
import { AsynchronousReviewPane } from "../consults/AsynchronousReviewPane";
import { FullCircleTelemedicineHub } from "../consults/FullCircleTelemedicineHub";
import { ConsultationsTab } from "./consults/ConsultationsTab";
import { ReferralsTab } from "./consults/ReferralsTab";
import { TeleconsultsTab } from "./consults/TeleconsultsTab";
import { WorklistItem } from "@/contexts/ProviderContext";
import { useEHR } from "@/contexts/EHRContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ReferralPackage } from "@/types/telehealth";

export type ConsultView = 
  | "dashboard"
  | "consultations"
  | "referrals" 
  | "teleconsults"
  | "new-referral"
  | "teleconsult-session"
  | "completion-note"
  | "telehealth-dashboard"
  | "async-review"
  | "telemedicine-hub";

// Mock referral for demo purposes
const MOCK_WORKLIST_ITEM: WorklistItem = {
  id: "REF-001",
  type: "referral-sent",
  patientName: "Tendai Moyo",
  patientAge: 45,
  patientSex: "M",
  mrn: "MRN-12345",
  chiefComplaint: "Chest pain with exertion, rule out ACS",
  urgency: "urgent",
  status: "in-progress",
  stage: "in-session",
  specialty: "Cardiology",
  fromClinician: "Dr. S. Mwangi",
  fromFacility: "Chitungwiza Central Hospital",
  toTarget: "Cardiology Pool",
  createdAt: new Date(),
  updatedAt: new Date(),
  waitingTime: 45,
};

export function ConsultsSection() {
  const [activeView, setActiveView] = useState<ConsultView>("dashboard");
  const [activeReferral, setActiveReferral] = useState<WorklistItem | null>(null);
  const [activeReferralPackage, setActiveReferralPackage] = useState<ReferralPackage | null>(null);
  const { patientContext, currentEncounter } = useEHR();

  // Get current patient info for filtering
  const patientId = patientContext?.patientId || undefined;
  const encounterId = patientContext?.encounterId || undefined;
  const patientName = patientContext?.patientName || "Unknown Patient";

  const handleNewReferral = () => {
    setActiveView("new-referral");
  };

  const handleOpenReferral = (referral: WorklistItem) => {
    setActiveReferral(referral);
    if (referral.stage === "in-session" || referral.stage === "response-pending") {
      setActiveView("teleconsult-session");
    } else if (referral.stage === "pending-completion") {
      setActiveView("completion-note");
    }
  };

  const handleJoinTeleconsult = (consultId: string) => {
    setActiveReferral(MOCK_WORKLIST_ITEM);
    setActiveView("teleconsult-session");
  };

  const handleCompleteReferral = (referralId: string) => {
    setActiveReferral(MOCK_WORKLIST_ITEM);
    setActiveView("completion-note");
  };

  const handleOpenTelehealthDashboard = () => {
    setActiveView("telehealth-dashboard");
  };

  const handleOpenAsyncReview = (referral: ReferralPackage) => {
    setActiveReferralPackage(referral);
    setActiveView("async-review");
  };

  const handleBack = () => {
    setActiveView("dashboard");
    setActiveReferral(null);
    setActiveReferralPackage(null);
  };

  // Render specialized workflow views
  if (activeView === "new-referral") {
    return (
      <ReferralBuilder 
        onSubmit={handleBack}
        onCancel={handleBack}
      />
    );
  }

  if (activeView === "teleconsult-session" && activeReferral) {
    return (
      <TeleconsultSession
        referral={activeReferral}
        onSubmitResponse={handleBack}
        onClose={handleBack}
      />
    );
  }

  if (activeView === "completion-note" && activeReferral) {
    return (
      <CompletionNoteForm
        referral={activeReferral}
        onSubmit={handleBack}
        onCancel={handleBack}
      />
    );
  }

  if (activeView === "telehealth-dashboard") {
    return (
      <TelehealthDashboard
        onBack={handleBack}
        onOpenAsyncReview={handleOpenAsyncReview}
        onJoinSession={handleJoinTeleconsult}
      />
    );
  }

  if (activeView === "async-review" && activeReferralPackage) {
    return (
      <AsynchronousReviewPane
        referral={activeReferralPackage}
        onBack={handleBack}
        onSubmitResponse={handleBack}
      />
    );
  }

  if (activeView === "telemedicine-hub") {
    return (
      <FullCircleTelemedicineHub
        patientId={patientId}
        patientName={patientName}
        patientHID={patientContext?.patientId}
        encounterId={encounterId}
        onBack={handleBack}
      />
    );
  }

  // Main tabbed view - showing patient-specific data
  return (
    <div className="space-y-6">
      {/* Patient Context Header */}
      {patientId && (
        <Card className="bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{patientName}</h3>
                  <p className="text-sm text-muted-foreground">
                    Consults & Referrals for this patient
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-primary/10">
                Patient-specific view
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Access to Telemedicine */}
      <div className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          onClick={handleOpenTelehealthDashboard}
          className="flex items-center gap-2"
        >
          <LayoutDashboard className="w-4 h-4" />
          Worklist
        </Button>
        <Button 
          onClick={() => setActiveView("telemedicine-hub")}
          className="flex items-center gap-2"
        >
          <Activity className="w-4 h-4" />
          Telemedicine Hub
        </Button>
      </div>

      <Tabs defaultValue="referrals" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="consults" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Consultations
          </TabsTrigger>
          <TabsTrigger value="referrals" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Referrals
          </TabsTrigger>
          <TabsTrigger value="teleconsults" className="flex items-center gap-2">
            <Video className="w-4 h-4" />
            Teleconsults
          </TabsTrigger>
        </TabsList>

        <TabsContent value="consults" className="space-y-4">
          <ConsultationsTab 
            patientId={patientId}
            encounterId={encounterId}
            onJoinTeleconsult={handleJoinTeleconsult}
          />
        </TabsContent>

        <TabsContent value="referrals" className="space-y-4">
          <ReferralsTab 
            patientId={patientId}
            encounterId={encounterId}
            onNewReferral={handleNewReferral}
            onCompleteReferral={handleCompleteReferral}
          />
        </TabsContent>

        <TabsContent value="teleconsults" className="space-y-4">
          <TeleconsultsTab 
            patientId={patientId}
            encounterId={encounterId}
            onJoinTeleconsult={handleJoinTeleconsult}
            onNewReferral={handleNewReferral}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
