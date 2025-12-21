import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Send, Video, LayoutDashboard } from "lucide-react";
import { ConsultsDashboard } from "../consults/ConsultsDashboard";
import { ReferralBuilder } from "../consults/ReferralBuilder";
import { TeleconsultSession } from "../consults/TeleconsultSession";
import { CompletionNoteForm } from "../consults/CompletionNote";
import { ConsultationsTab } from "./consults/ConsultationsTab";
import { ReferralsTab } from "./consults/ReferralsTab";
import { TeleconsultsTab } from "./consults/TeleconsultsTab";
import { WorklistItem } from "@/contexts/ProviderContext";

export type ConsultView = 
  | "dashboard"
  | "consultations"
  | "referrals" 
  | "teleconsults"
  | "new-referral"
  | "teleconsult-session"
  | "completion-note";

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

  const handleBack = () => {
    setActiveView("dashboard");
    setActiveReferral(null);
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

  // Main tabbed view with dashboard
  return (
    <div className="space-y-6">
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
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

        <TabsContent value="dashboard" className="space-y-4">
          <ConsultsDashboard 
            onNewReferral={handleNewReferral}
            onOpenReferral={handleOpenReferral}
          />
        </TabsContent>

        <TabsContent value="consults" className="space-y-4">
          <ConsultationsTab 
            onJoinTeleconsult={handleJoinTeleconsult}
          />
        </TabsContent>

        <TabsContent value="referrals" className="space-y-4">
          <ReferralsTab 
            onNewReferral={handleNewReferral}
            onCompleteReferral={handleCompleteReferral}
          />
        </TabsContent>

        <TabsContent value="teleconsults" className="space-y-4">
          <TeleconsultsTab 
            onJoinTeleconsult={handleJoinTeleconsult}
            onNewReferral={handleNewReferral}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
