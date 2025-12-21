import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Search, User, Calendar, AlertTriangle, Activity, Clock } from "lucide-react";

interface PatientResult {
  id: string;
  mrn: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  allergies: string[] | null;
  phone_primary: string | null;
}

interface EncounterResult {
  id: string;
  encounter_number: string;
  status: string;
  admission_date: string;
}

export function PatientSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<PatientResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentPatients, setRecentPatients] = useState<PatientResult[]>([]);
  const navigate = useNavigate();
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Load recent patients from localStorage
    const recent = localStorage.getItem("recentPatients");
    if (recent) {
      setRecentPatients(JSON.parse(recent));
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setPatients([]);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("patients")
          .select("id, mrn, first_name, last_name, date_of_birth, gender, allergies, phone_primary")
          .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,mrn.ilike.%${query}%,phone_primary.ilike.%${query}%`)
          .limit(10);

        if (error) throw error;
        setPatients(data || []);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

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

  const handleSelectPatient = async (patient: PatientResult) => {
    // Add to recent patients
    const updated = [patient, ...recentPatients.filter(p => p.id !== patient.id)].slice(0, 5);
    setRecentPatients(updated);
    localStorage.setItem("recentPatients", JSON.stringify(updated));

    // Check for active encounters
    const { data: encounters } = await supabase
      .from("encounters")
      .select("id, encounter_number, status, admission_date")
      .eq("patient_id", patient.id)
      .in("status", ["active", "in-progress", "waiting"])
      .order("admission_date", { ascending: false })
      .limit(1);

    if (encounters && encounters.length > 0) {
      // Open existing encounter
      navigate(`/encounter/${encounters[0].id}`);
    } else {
      // Go to patient page
      navigate(`/patients?selected=${patient.id}`);
    }
    setOpen(false);
    setQuery("");
  };

  const PatientItem = ({ patient }: { patient: PatientResult }) => (
    <CommandItem
      value={`${patient.mrn} ${patient.first_name} ${patient.last_name}`}
      onSelect={() => handleSelectPatient(patient)}
      className="cursor-pointer p-3"
    >
      <div className="flex items-center gap-3 w-full">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {patient.first_name} {patient.last_name}
            </span>
            {patient.allergies && patient.allergies.length > 0 && (
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="font-mono">{patient.mrn}</span>
            <span>•</span>
            <span>{calculateAge(patient.date_of_birth)}y {patient.gender.charAt(0).toUpperCase()}</span>
            {patient.phone_primary && (
              <>
                <span>•</span>
                <span>{patient.phone_primary}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </CommandItem>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full md:w-80 justify-start text-muted-foreground"
        >
          <Search className="w-4 h-4 mr-2" />
          <span>Search patients...</span>
          <kbd className="ml-auto pointer-events-none hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] p-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle>Find Patient</DialogTitle>
        </DialogHeader>
        <Command className="rounded-lg border-0" shouldFilter={false}>
          <CommandInput
            placeholder="Search by name, MRN, or phone..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <ScrollArea className="h-80">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : query.trim() ? (
                patients.length > 0 ? (
                  <CommandGroup heading="Search Results">
                    {patients.map((patient) => (
                      <PatientItem key={patient.id} patient={patient} />
                    ))}
                  </CommandGroup>
                ) : (
                  <CommandEmpty>No patients found</CommandEmpty>
                )
              ) : (
                <>
                  {recentPatients.length > 0 && (
                    <CommandGroup heading="Recent Patients">
                      {recentPatients.map((patient) => (
                        <PatientItem key={patient.id} patient={patient} />
                      ))}
                    </CommandGroup>
                  )}
                  <CommandGroup heading="Quick Actions">
                    <CommandItem
                      onSelect={() => {
                        navigate("/registration");
                        setOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Register New Patient
                    </CommandItem>
                    <CommandItem
                      onSelect={() => {
                        navigate("/queue");
                        setOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <Activity className="w-4 h-4 mr-2" />
                      View Patient Queue
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </ScrollArea>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

// Keyboard shortcut hook
export function usePatientSearchShortcut(setOpen: (open: boolean) => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [setOpen]);
}
