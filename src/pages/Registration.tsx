import { useState } from "react";
import { motion } from "framer-motion";
import { 
  UserPlus, 
  Calendar, 
  Shield, 
  ArrowLeft,
  Users,
  Fingerprint,
  FileCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RegistrationWizard } from "@/components/registration/RegistrationWizard";
import { VisitCreation } from "@/components/registration/VisitCreation";
import { IAMArchitecture } from "@/components/registration/IAMArchitecture";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ActiveView = "menu" | "registration" | "visit" | "iam";

export default function Registration() {
  const [activeView, setActiveView] = useState<ActiveView>("menu");

  const handleRegistrationComplete = (data: any) => {
    toast.success("Patient registered successfully!", {
      description: `${data.firstName} ${data.lastName} has been added to the system.`
    });
    setActiveView("menu");
  };

  const handleVisitComplete = (data: any) => {
    toast.success("Visit created successfully!", {
      description: "The patient has been checked in."
    });
  };

  const menuItems = [
    {
      id: "registration",
      icon: UserPlus,
      title: "New Client Registration",
      description: "Register a new patient with demographics, biometrics, and consent",
      color: "bg-blue-500",
      features: ["Demographics", "Biometric ID", "FHIR Consent"]
    },
    {
      id: "visit",
      icon: Calendar,
      title: "Create New Visit",
      description: "Start a new encounter for an existing or new patient",
      color: "bg-green-500",
      features: ["Patient Lookup", "Biometric Verify", "Visit Details"]
    },
    {
      id: "iam",
      icon: Shield,
      title: "IAM & Consent Architecture",
      description: "View KeyCloak, eSignet integration and consent management flows",
      color: "bg-purple-500",
      features: ["KeyCloak", "eSignet", "FHIR Consent"]
    },
  ];

  if (activeView === "menu") {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="h-16 bg-topbar-bg text-topbar-foreground flex items-center px-6 border-b">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">IM</span>
            </div>
            <div>
              <h1 className="font-semibold text-lg">Impilo EHR</h1>
              <p className="text-xs text-topbar-muted">Registration & IAM</p>
            </div>
          </Link>
        </header>

        {/* Main Content */}
        <main className="container mx-auto py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3">Patient Registration & Identity</h2>
              <p className="text-muted-foreground text-lg">
                Register new clients, create visits, and manage identity with biometric verification
              </p>
            </div>

            {/* Menu Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card 
                      className="cursor-pointer transition-all hover:shadow-lg hover:ring-2 hover:ring-primary/50 h-full"
                      onClick={() => setActiveView(item.id as ActiveView)}
                    >
                      <CardContent className="p-6">
                        <div className={cn(
                          "w-14 h-14 rounded-xl flex items-center justify-center mb-4",
                          item.color
                        )}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {item.features.map((feature) => (
                            <span 
                              key={feature}
                              className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4 mt-12">
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
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-16 bg-topbar-bg text-topbar-foreground flex items-center justify-between px-6 border-b">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setActiveView("menu")}
            className="text-topbar-muted hover:text-topbar-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="h-6 w-px bg-topbar-muted/30" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">IM</span>
            </div>
            <span className="font-semibold">
              {activeView === "registration" && "New Client Registration"}
              {activeView === "visit" && "Create New Visit"}
              {activeView === "iam" && "IAM Architecture"}
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto py-8 px-4">
        {activeView === "registration" && (
          <RegistrationWizard 
            onComplete={handleRegistrationComplete}
            onCancel={() => setActiveView("menu")}
          />
        )}
        {activeView === "visit" && (
          <VisitCreation 
            onComplete={handleVisitComplete}
            onNewRegistration={() => setActiveView("registration")}
          />
        )}
        {activeView === "iam" && (
          <IAMArchitecture />
        )}
      </main>
    </div>
  );
}
