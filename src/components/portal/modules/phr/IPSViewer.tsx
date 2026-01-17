import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  FileHeart,
  Pill,
  AlertTriangle,
  Activity,
  Syringe,
  TestTube2,
  User,
  Calendar,
  Download,
  Share2,
  RefreshCw,
  CheckCircle2,
  Clock,
  Heart
} from "lucide-react";
import { format } from "date-fns";

interface IPSSection {
  title: string;
  icon: React.ElementType;
  items: IPSItem[];
  color: string;
}

interface IPSItem {
  id: string;
  name: string;
  detail: string;
  date?: string;
  status?: "active" | "resolved" | "completed";
  severity?: "high" | "moderate" | "low";
}

const MOCK_IPS: IPSSection[] = [
  {
    title: "Current Medications",
    icon: Pill,
    color: "text-success",
    items: [
      { id: "1", name: "Metformin 500mg", detail: "Twice daily with meals", status: "active" },
      { id: "2", name: "Lisinopril 10mg", detail: "Once daily in the morning", status: "active" },
      { id: "3", name: "Atorvastatin 20mg", detail: "Once daily at bedtime", status: "active" },
      { id: "4", name: "Aspirin 81mg", detail: "Once daily", status: "active" },
    ]
  },
  {
    title: "Allergies & Intolerances",
    icon: AlertTriangle,
    color: "text-destructive",
    items: [
      { id: "1", name: "Penicillin", detail: "Anaphylaxis", severity: "high" },
      { id: "2", name: "Sulfa Drugs", detail: "Skin rash", severity: "moderate" },
    ]
  },
  {
    title: "Active Conditions",
    icon: Activity,
    color: "text-primary",
    items: [
      { id: "1", name: "Type 2 Diabetes Mellitus", detail: "Diagnosed 2020", status: "active" },
      { id: "2", name: "Essential Hypertension", detail: "Diagnosed 2019", status: "active" },
      { id: "3", name: "Hyperlipidemia", detail: "Diagnosed 2021", status: "active" },
    ]
  },
  {
    title: "Immunizations",
    icon: Syringe,
    color: "text-info",
    items: [
      { id: "1", name: "COVID-19 Booster (Pfizer)", detail: "Oct 15, 2023", status: "completed" },
      { id: "2", name: "Influenza Vaccine", detail: "Sep 20, 2023", status: "completed" },
      { id: "3", name: "Tetanus (Tdap)", detail: "May 10, 2020", status: "completed" },
    ]
  },
  {
    title: "Recent Lab Results",
    icon: TestTube2,
    color: "text-warning",
    items: [
      { id: "1", name: "HbA1c", detail: "7.2% (Target <7%)", date: "2024-01-15" },
      { id: "2", name: "LDL Cholesterol", detail: "110 mg/dL (Borderline)", date: "2024-01-15" },
      { id: "3", name: "Creatinine", detail: "0.9 mg/dL (Normal)", date: "2024-01-15" },
    ]
  }
];

export function IPSViewer() {
  const [lastUpdated] = useState(new Date());

  return (
    <div className="space-y-6">
      {/* IPS Header */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <FileHeart className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold">International Patient Summary</h3>
                <p className="text-sm text-muted-foreground">
                  HL7 FHIR R4 Compliant • Portable Health Record
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    John Doe
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    DOB: Jan 15, 1980
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Updated: {format(lastUpdated, "MMM dd, yyyy 'at' HH:mm")}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Toggle */}
      <div className="flex items-center gap-2">
        <Badge variant="default">Patient-Friendly View</Badge>
        <Badge variant="outline" className="cursor-pointer hover:bg-accent">Provider-Grade View</Badge>
      </div>

      {/* IPS Sections */}
      <ScrollArea className="h-[500px]">
        <div className="space-y-4">
          {MOCK_IPS.map((section) => (
            <IPSSectionCard key={section.title} section={section} />
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              <p>This summary was generated from your Shared Health Record (SHR).</p>
              <p className="text-xs mt-1">
                Data sources: City General Hospital, PathLab Services, Community Clinic
              </p>
            </div>
            <Button variant="ghost" size="sm">
              <Heart className="h-4 w-4 mr-2" />
              Request Correction
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function IPSSectionCard({ section }: { section: IPSSection }) {
  const Icon = section.icon;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className={`h-4 w-4 ${section.color}`} />
          {section.title}
          <Badge variant="secondary" className="ml-auto text-xs">
            {section.items.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {section.items.map((item, idx) => (
            <div key={item.id}>
              {idx > 0 && <Separator className="my-2" />}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                </div>
                <div className="flex items-center gap-2">
                  {item.status && (
                    <Badge 
                      variant={item.status === "active" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {item.status === "completed" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {item.status}
                    </Badge>
                  )}
                  {item.severity && (
                    <Badge 
                      variant={item.severity === "high" ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {item.severity}
                    </Badge>
                  )}
                  {item.date && (
                    <span className="text-xs text-muted-foreground">{item.date}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
