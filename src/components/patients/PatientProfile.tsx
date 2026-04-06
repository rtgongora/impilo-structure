import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Heart,
  AlertCircle,
  FileText,
  Activity,
  ClipboardList,
  Edit,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Patient {
  id: string;
  mrn: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  date_of_birth: string;
  gender: string;
  national_id?: string | null;
  phone_primary: string | null;
  phone_secondary?: string | null;
  email: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city: string | null;
  province?: string | null;
  postal_code?: string | null;
  country?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relationship?: string | null;
  blood_type?: string | null;
  allergies: string[] | null;
  chronic_conditions?: string[] | null;
  insurance_provider?: string | null;
  insurance_policy_number?: string | null;
  insurance_expiry?: string | null;
  is_active: boolean;
  created_at: string;
}

interface Encounter {
  id: string;
  encounter_number: string;
  encounter_type: string;
  status: string;
  admission_date: string;
  discharge_date: string | null;
  ward: string | null;
  bed: string | null;
  chief_complaint: string | null;
  primary_diagnosis: string | null;
}

interface PatientProfileProps {
  patient: Patient;
  onBack: () => void;
  onUpdate: () => void;
}

export const PatientProfile = ({ patient, onBack, onUpdate }: PatientProfileProps) => {
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEncounters();
  }, [patient.id]);

  const fetchEncounters = async () => {
    try {
      const { data, error } = await supabase
        .from("encounters")
        .select("*")
        .eq("patient_id", patient.id)
        .order("admission_date", { ascending: false });

      if (error) throw error;
      setEncounters(data || []);
    } catch (error) {
      console.error("Error fetching encounters:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "discharged": return "secondary";
      case "transferred": return "outline";
      default: return "secondary";
    }
  };

  const fullName = `${patient.first_name} ${patient.middle_name ? patient.middle_name + " " : ""}${patient.last_name}`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">{fullName}</h1>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-mono">{patient.mrn}</span>
                    <span>•</span>
                    <span>{calculateAge(patient.date_of_birth)}y</span>
                    <span>•</span>
                    <span className="capitalize">{patient.gender}</span>
                    {patient.blood_type && (
                      <>
                        <span>•</span>
                        <Badge variant="outline">{patient.blood_type}</Badge>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Encounter
              </Button>
            </div>
          </div>

          {/* Allergies Banner */}
          {patient.allergies && patient.allergies.length > 0 && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Allergies:</span>
              <div className="flex gap-1 flex-wrap">
                {patient.allergies.map((allergy, idx) => (
                  <Badge key={idx} variant="destructive" className="text-xs">
                    {allergy}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Patient Info */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {patient.phone_primary && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{patient.phone_primary}</span>
                  </div>
                )}
                {patient.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{patient.email}</span>
                  </div>
                )}
                {(patient.address_line1 || patient.city) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      {patient.address_line1 && <p>{patient.address_line1}</p>}
                      {patient.address_line2 && <p>{patient.address_line2}</p>}
                      <p>
                        {[patient.city, patient.province, patient.postal_code]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                      {patient.country && <p>{patient.country}</p>}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>DOB: {format(new Date(patient.date_of_birth), "PP")}</span>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            {patient.emergency_contact_name && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Emergency Contact</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{patient.emergency_contact_name}</p>
                  {patient.emergency_contact_relationship && (
                    <p className="text-sm text-muted-foreground">{patient.emergency_contact_relationship}</p>
                  )}
                  {patient.emergency_contact_phone && (
                    <div className="flex items-center gap-2 mt-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{patient.emergency_contact_phone}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Medical Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Medical Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {patient.chronic_conditions && patient.chronic_conditions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Chronic Conditions</p>
                    <div className="flex flex-wrap gap-1">
                      {patient.chronic_conditions.map((condition, idx) => (
                        <Badge key={idx} variant="secondary">{condition}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {(!patient.chronic_conditions || patient.chronic_conditions.length === 0) && (
                  <p className="text-sm text-muted-foreground">No chronic conditions recorded</p>
                )}
              </CardContent>
            </Card>

            {/* Insurance */}
            {patient.insurance_provider && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Insurance</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{patient.insurance_provider}</p>
                  {patient.insurance_policy_number && (
                    <p className="text-sm text-muted-foreground">Policy: {patient.insurance_policy_number}</p>
                  )}
                  {patient.insurance_expiry && (
                    <p className="text-sm text-muted-foreground">
                      Expires: {format(new Date(patient.insurance_expiry), "PP")}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Encounters & Activity */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="encounters">
              <TabsList>
                <TabsTrigger value="encounters">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Encounters ({encounters.length})
                </TabsTrigger>
                <TabsTrigger value="documents">
                  <FileText className="h-4 w-4 mr-2" />
                  Documents
                </TabsTrigger>
                <TabsTrigger value="activity">
                  <Activity className="h-4 w-4 mr-2" />
                  Activity
                </TabsTrigger>
              </TabsList>

              <TabsContent value="encounters" className="mt-4">
                <Card>
                  <CardContent className="p-0">
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : encounters.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No encounters recorded for this patient
                      </div>
                    ) : (
                      <ScrollArea className="h-[500px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Encounter #</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Location</TableHead>
                              <TableHead>Chief Complaint</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {encounters.map((encounter) => (
                              <TableRow key={encounter.id} className="cursor-pointer hover:bg-accent">
                                <TableCell className="font-mono text-sm">
                                  {encounter.encounter_number}
                                </TableCell>
                                <TableCell className="capitalize">{encounter.encounter_type}</TableCell>
                                <TableCell>
                                  {format(new Date(encounter.admission_date), "PP")}
                                </TableCell>
                                <TableCell>
                                  {encounter.ward && encounter.bed 
                                    ? `${encounter.ward} - ${encounter.bed}`
                                    : encounter.ward || "-"
                                  }
                                </TableCell>
                                <TableCell className="max-w-[200px] truncate">
                                  {encounter.chief_complaint || "-"}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={getStatusColor(encounter.status)}>
                                    {encounter.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="mt-4">
                <PatientDocumentsPanel patientId={patient.id} />
              </TabsContent>

              <TabsContent value="activity" className="mt-4">
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Activity timeline coming soon
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};
