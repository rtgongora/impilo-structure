import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  Pill,
  Apple,
  Bug,
  Droplets,
  Wind,
  Calendar,
  User,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Allergy {
  id: string;
  allergen: string;
  category: "medication" | "food" | "environmental" | "insect" | "latex" | "other";
  reaction: string;
  reactionType: "allergy" | "intolerance" | "sensitivity";
  severity: "mild" | "moderate" | "severe" | "life-threatening";
  status: "active" | "inactive" | "resolved";
  verificationStatus: "confirmed" | "unconfirmed" | "refuted" | "entered-in-error";
  recordedDate: string;
  recordedBy?: string;
  facility?: string;
  notes?: string;
  onsetDate?: string;
}

const MOCK_ALLERGIES: Allergy[] = [
  {
    id: "1",
    allergen: "Penicillin",
    category: "medication",
    reaction: "Anaphylaxis, Hives, Swelling",
    reactionType: "allergy",
    severity: "life-threatening",
    status: "active",
    verificationStatus: "confirmed",
    recordedDate: "2015-03-15",
    recordedBy: "Dr. Smith",
    facility: "City General Hospital",
    onsetDate: "2010-06-20",
    notes: "Confirmed anaphylactic reaction requiring epinephrine. Patient carries EpiPen."
  },
  {
    id: "2",
    allergen: "Sulfonamides (Sulfa drugs)",
    category: "medication",
    reaction: "Skin rash, Itching",
    reactionType: "allergy",
    severity: "moderate",
    status: "active",
    verificationStatus: "confirmed",
    recordedDate: "2018-08-22",
    recordedBy: "Dr. Johnson",
    facility: "City General Hospital",
    onsetDate: "2018-08-15"
  },
  {
    id: "3",
    allergen: "Peanuts",
    category: "food",
    reaction: "Throat swelling, Difficulty breathing",
    reactionType: "allergy",
    severity: "severe",
    status: "active",
    verificationStatus: "confirmed",
    recordedDate: "2008-01-10",
    facility: "Children's Hospital",
    onsetDate: "2005-03-01",
    notes: "Tree nuts are tolerated. Only peanuts trigger reaction."
  },
  {
    id: "4",
    allergen: "Ibuprofen",
    category: "medication",
    reaction: "GI upset, Nausea",
    reactionType: "intolerance",
    severity: "mild",
    status: "active",
    verificationStatus: "confirmed",
    recordedDate: "2020-05-12",
    recordedBy: "Dr. Chen"
  },
  {
    id: "5",
    allergen: "Dust Mites",
    category: "environmental",
    reaction: "Sneezing, Nasal congestion, Itchy eyes",
    reactionType: "allergy",
    severity: "mild",
    status: "active",
    verificationStatus: "confirmed",
    recordedDate: "2019-04-18",
    facility: "Allergy Clinic"
  }
];

const categoryIcons: Record<string, React.ElementType> = {
  medication: Pill,
  food: Apple,
  environmental: Wind,
  insect: Bug,
  latex: Droplets,
  other: AlertTriangle
};

export function AllergyList() {
  const [showReportDialog, setShowReportDialog] = useState(false);

  const severeAllergies = MOCK_ALLERGIES.filter(a => 
    a.severity === "severe" || a.severity === "life-threatening"
  );
  const medicationAllergies = MOCK_ALLERGIES.filter(a => a.category === "medication");

  return (
    <div className="space-y-6">
      {/* Severe Allergy Alert */}
      {severeAllergies.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-destructive">Critical Allergies</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {severeAllergies.map(allergy => (
                    <Badge key={allergy.id} variant="destructive">
                      {allergy.allergen}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  These allergies may cause life-threatening reactions. Always inform healthcare providers.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{MOCK_ALLERGIES.length}</p>
              <p className="text-xs text-muted-foreground">Total Allergies</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Pill className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{medicationAllergies.length}</p>
              <p className="text-xs text-muted-foreground">Drug Allergies</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {MOCK_ALLERGIES.filter(a => a.verificationStatus === "confirmed").length}
              </p>
              <p className="text-xs text-muted-foreground">Verified</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Allergy Button */}
      <div className="flex justify-end">
        <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Report New Allergy
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Report a New Allergy</DialogTitle>
              <DialogDescription>
                Your allergy report will be sent to your healthcare provider for verification.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p>Allergy reporting form coming soon.</p>
              <p className="text-sm mt-1">
                For now, please contact your healthcare provider directly.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Allergy List */}
      <ScrollArea className="h-[400px]">
        <div className="space-y-3">
          {MOCK_ALLERGIES.map((allergy) => (
            <AllergyCard key={allergy.id} allergy={allergy} />
          ))}
        </div>
      </ScrollArea>

      {/* Emergency Card */}
      <Card className="bg-gradient-to-r from-destructive/5 to-destructive/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium">Emergency Allergy Card</p>
                <p className="text-sm text-muted-foreground">
                  Downloadable card for your wallet or phone
                </p>
              </div>
            </div>
            <Button size="sm">
              Generate Card
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AllergyCard({ allergy }: { allergy: Allergy }) {
  const Icon = categoryIcons[allergy.category] || AlertTriangle;

  const getSeverityColor = () => {
    switch (allergy.severity) {
      case "life-threatening": return "bg-destructive text-destructive-foreground";
      case "severe": return "bg-destructive/80 text-destructive-foreground";
      case "moderate": return "bg-warning text-warning-foreground";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const getVerificationIcon = () => {
    switch (allergy.verificationStatus) {
      case "confirmed": return <CheckCircle2 className="h-3 w-3 text-success" />;
      case "refuted": return <XCircle className="h-3 w-3 text-destructive" />;
      default: return <AlertCircle className="h-3 w-3 text-warning" />;
    }
  };

  return (
    <Card className={
      allergy.severity === "life-threatening" || allergy.severity === "severe" 
        ? "border-l-4 border-l-destructive" 
        : ""
    }>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-lg ${
              allergy.severity === "life-threatening" || allergy.severity === "severe"
                ? "bg-destructive/10"
                : "bg-warning/10"
            }`}>
              <Icon className={`h-5 w-5 ${
                allergy.severity === "life-threatening" || allergy.severity === "severe"
                  ? "text-destructive"
                  : "text-warning"
              }`} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold">{allergy.allergen}</p>
                <Badge className={getSeverityColor()}>
                  {allergy.severity}
                </Badge>
                <Badge variant="outline" className="text-xs capitalize">
                  {allergy.reactionType}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{allergy.reaction}</p>
              
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  {getVerificationIcon()}
                  <span className="capitalize">{allergy.verificationStatus}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Recorded: {format(new Date(allergy.recordedDate), "MMM yyyy")}
                </span>
                {allergy.recordedBy && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {allergy.recordedBy}
                  </span>
                )}
              </div>

              {allergy.notes && (
                <p className="text-sm text-muted-foreground mt-2 bg-muted/50 p-2 rounded">
                  {allergy.notes}
                </p>
              )}
            </div>
          </div>
          <Badge variant="outline" className="capitalize text-xs">
            {allergy.category}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
