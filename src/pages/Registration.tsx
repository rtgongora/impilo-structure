import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, Calendar, Shield, ArrowLeft, Users, Fingerprint, FileCheck, ClipboardCheck, Monitor, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RegistrationWizard } from "@/components/registration/RegistrationWizard";
import { VisitCreation } from "@/components/registration/VisitCreation";
import { IAMArchitecture } from "@/components/registration/IAMArchitecture";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AppLayout } from "@/components/layout/AppLayout";
import { useNavigate } from "react-router-dom";

type ActiveView = "menu" | "registration" | "visit" | "iam";

export default function Registration() {
  const [activeView, setActiveView] = useState<ActiveView>("menu");
  const navigate = useNavigate();

  const handleRegistrationComplete = (data: any) => {
    toast.success("Patient registered successfully!", {
      description: `${data.firstName} ${data.lastName} has been added to the system.`
    });
    setActiveView("menu");
  };

  const handleVisitComplete = (data: any) => {
    toast.success("Visit created successfully!", { description: "The patient has been checked in." });
  };

  const menuItems = [
    { id: "registration", icon: UserPlus, title: "New Client Registration", description: "Register a new patient with demographics, biometrics, and consent", color: "bg-emerald-500", features: ["Demographics", "Biometric ID", "FHIR Consent"] },
    { id: "visit", icon: Calendar, title: "Create New Visit", description: "Start a new encounter for an existing or new patient", color: "bg-success", features: ["Patient Lookup", "Biometric Verify", "Visit Details"] },
    { id: "iam", icon: Shield, title: "IAM & Consent Architecture", description: "View KeyCloak, eSignet integration and consent management flows", color: "bg-secondary", features: ["KeyCloak", "eSignet", "FHIR Consent"] },
  ];

  const relatedModules = [
    { icon: Users, title: "Patient Registry", description: "Search & manage all registered patients", path: "/patients", color: "bg-slate-500" },
    { icon: ClipboardCheck, title: "Patient Intake & Sorting", description: "Arrival, triage & queue assignment", path: "/sorting", color: "bg-orange-500" },
    { icon: Monitor, title: "Patient Kiosk", description: "Self-service check-in terminal", path: "/kiosk", color: "bg-blue-600" },
  ];

  if (activeView !== "menu") {
    return (
      <AppLayout title={activeView === "registration" ? "New Client Registration" : activeView === "visit" ? "Create New Visit" : "IAM Architecture"}>
        <div className="p-6">
          <Button variant="outline" size="sm" onClick={() => setActiveView("menu")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          {activeView === "registration" && <RegistrationWizard onComplete={handleRegistrationComplete} onCancel={() => setActiveView("menu")} />}
          {activeView === "visit" && <VisitCreation onComplete={handleVisitComplete} onNewRegistration={() => setActiveView("registration")} />}
          {activeView === "iam" && <IAMArchitecture />}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Client Intake & Identity">
      <div className="p-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-3">Client Intake & Identity</h2>
            <p className="text-muted-foreground text-lg">Register new clients, create visits, and manage identity with biometric verification</p>
          </div>

          {/* Primary actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                  <Card className="cursor-pointer transition-all hover:shadow-lg hover:ring-2 hover:ring-primary/50 h-full" onClick={() => setActiveView(item.id as ActiveView)}>
                    <CardContent className="p-6">
                      <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center mb-4", item.color)}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {item.features.map((feature) => (
                          <span key={feature} className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded">{feature}</span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Related modules */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-muted-foreground">Related Modules</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedModules.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Card key={item.title} className="cursor-pointer transition-all hover:shadow-md hover:ring-1 hover:ring-primary/30" onClick={() => navigate(item.path)}>
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", item.color)}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Registered Today", value: "24", icon: Users },
              { label: "Biometric Captures", value: "156", icon: Fingerprint },
              { label: "Consents Collected", value: "89", icon: FileCheck },
              { label: "Visits Created", value: "42", icon: Calendar },
            ].map((stat) => (
              <Card key={stat.label} className="bg-muted/30">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}