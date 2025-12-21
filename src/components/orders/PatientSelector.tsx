import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, User, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  mrn: string;
  date_of_birth: string;
  gender: string;
}

interface PatientSelectorProps {
  selectedPatientId: string | null;
  onSelectPatient: (patient: Patient | null) => void;
}

export function PatientSelector({ selectedPatientId, onSelectPatient }: PatientSelectorProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatientId && patients.length > 0) {
      const patient = patients.find((p) => p.id === selectedPatientId);
      if (patient) {
        setSelectedPatient(patient);
      }
    }
  }, [selectedPatientId, patients]);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("id, first_name, last_name, mrn, date_of_birth, gender")
        .eq("is_active", true)
        .order("last_name")
        .limit(50);

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPatients = patients.filter((patient) => {
    const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return (
      fullName.includes(query) ||
      patient.mrn.toLowerCase().includes(query)
    );
  });

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    onSelectPatient(patient);
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

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <User className="h-4 w-4" />
          Select Patient
        </CardTitle>
      </CardHeader>
      <CardContent>
        {selectedPatient ? (
          <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {selectedPatient.first_name[0]}{selectedPatient.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {selectedPatient.first_name} {selectedPatient.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedPatient.mrn} • {calculateAge(selectedPatient.date_of_birth)}y {selectedPatient.gender}
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-destructive/10"
              onClick={() => {
                setSelectedPatient(null);
                onSelectPatient(null);
              }}
            >
              Change
            </Badge>
          </div>
        ) : (
          <>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or MRN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {filteredPatients.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      No patients found
                    </p>
                  ) : (
                    filteredPatients.map((patient) => (
                      <div
                        key={patient.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => handleSelectPatient(patient)}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {patient.first_name[0]}{patient.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {patient.first_name} {patient.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {patient.mrn} • {calculateAge(patient.date_of_birth)}y {patient.gender}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
