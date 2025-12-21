import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEHR } from "@/contexts/EHRContext";
import {
  User,
  Calendar,
  MapPin,
  AlertTriangle,
  Activity,
  Pill,
  FileText,
  Clock,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";

export function OverviewSection() {
  const { currentEncounter } = useEHR();
  const { patient } = currentEncounter;
  const los = differenceInDays(new Date(), currentEncounter.admissionDate);

  return (
    <div className="space-y-6">
      {/* Patient Banner */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">{patient.name}</h2>
                <div className="flex items-center gap-4 text-muted-foreground mt-1">
                  <span>{patient.mrn}</span>
                  <span>•</span>
                  <span>{patient.gender === "female" ? "Female" : "Male"}</span>
                  <span>•</span>
                  <span>DOB: {format(new Date(patient.dateOfBirth), "dd MMM yyyy")}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="mb-2">
                {currentEncounter.type.toUpperCase()}
              </Badge>
              <div className="text-sm text-muted-foreground">
                {patient.ward} • {patient.bed}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Allergies Alert */}
      {patient.allergies.length > 0 && (
        <Card className="bg-warning-muted border-warning">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <div>
                <span className="font-semibold text-warning-foreground">Allergies: </span>
                <span className="text-foreground">{patient.allergies.join(", ")}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="w-6 h-6 mx-auto text-primary mb-2" />
            <div className="text-2xl font-semibold">{los}</div>
            <div className="text-sm text-muted-foreground">Days Admitted</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Activity className="w-6 h-6 mx-auto text-success mb-2" />
            <div className="text-2xl font-semibold">2</div>
            <div className="text-sm text-muted-foreground">Active Problems</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Pill className="w-6 h-6 mx-auto text-accent mb-2" />
            <div className="text-2xl font-semibold">5</div>
            <div className="text-sm text-muted-foreground">Active Medications</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
            <div className="text-2xl font-semibold">3</div>
            <div className="text-sm text-muted-foreground">Pending Orders</div>
          </CardContent>
        </Card>
      </div>

      {/* Encounter Details */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Admission Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Admitted:</span>
              <span>{format(currentEncounter.admissionDate, "dd MMM yyyy, HH:mm")}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Attending:</span>
              <span>{currentEncounter.attendingPhysician}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Location:</span>
              <span>{currentEncounter.location}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <div className="font-medium">Vital signs recorded</div>
                  <div className="text-muted-foreground">15 minutes ago</div>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <div className="font-medium">Medication administered</div>
                  <div className="text-muted-foreground">1 hour ago</div>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <div className="font-medium">Lab results received</div>
                  <div className="text-muted-foreground">3 hours ago</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
