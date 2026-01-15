import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Users, Activity, Phone, Mail, Calendar, MapPin, AlertCircle, UserPlus, Filter, Download, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { PatientRegistrationForm } from "@/components/patients/PatientRegistrationForm";
import { PatientProfile } from "@/components/patients/PatientProfile";
import { AppLayout } from "@/components/layout/AppLayout";

interface Patient {
  id: string;
  mrn: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  date_of_birth: string;
  gender: string;
  phone_primary: string | null;
  email: string | null;
  city: string | null;
  allergies: string[] | null;
  is_active: boolean;
  created_at: string;
}

const Patients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast.error("Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch = 
      patient.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.mrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (patient.phone_primary && patient.phone_primary.includes(searchQuery));
    
    if (activeTab === "active") return matchesSearch && patient.is_active;
    if (activeTab === "inactive") return matchesSearch && !patient.is_active;
    return matchesSearch;
  });

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

  const handlePatientRegistered = () => {
    setIsRegisterOpen(false);
    fetchPatients();
    toast.success("Patient registered successfully");
  };

  if (selectedPatient) {
    return (
      <PatientProfile 
        patient={selectedPatient} 
        onBack={() => setSelectedPatient(null)}
        onUpdate={fetchPatients}
      />
    );
  }

  return (
    <AppLayout title="Patients">
      <div className="h-[calc(100vh-48px)] flex flex-col p-3">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-3 shrink-0">
          <Card>
            <CardContent className="p-2 flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-primary/10">
                <Users className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold leading-none">{patients.length}</p>
                <p className="text-[9px] text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2 flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-success/10">
                <Activity className="h-3.5 w-3.5 text-success" />
              </div>
              <div>
                <p className="text-lg font-bold leading-none">{patients.filter(p => p.is_active).length}</p>
                <p className="text-[9px] text-muted-foreground">Active</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2 flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-warning/10">
                <Calendar className="h-3.5 w-3.5 text-warning" />
              </div>
              <div>
                <p className="text-lg font-bold leading-none">
                  {patients.filter(p => {
                    const created = new Date(p.created_at);
                    const today = new Date();
                    return created.toDateString() === today.toDateString();
                  }).length}
                </p>
                <p className="text-[9px] text-muted-foreground">Today</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2 flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-critical/10">
                <AlertCircle className="h-3.5 w-3.5 text-critical" />
              </div>
              <div>
                <p className="text-lg font-bold leading-none">
                  {patients.filter(p => p.allergies && p.allergies.length > 0).length}
                </p>
                <p className="text-[9px] text-muted-foreground">Allergies</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-3 shrink-0">
          <CardContent className="p-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input 
                  placeholder="Search by name, MRN, or phone..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="pl-8 h-8 text-xs" 
                />
              </div>
              <Button variant="outline" size="icon" className="h-8 w-8"><Filter className="h-3.5 w-3.5" /></Button>
              <Button variant="outline" size="icon" className="h-8 w-8"><Download className="h-3.5 w-3.5" /></Button>
              <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><UserPlus className="h-3.5 w-3.5 mr-1" />Register</Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-sm">Register New Patient</DialogTitle>
                    <DialogDescription className="text-xs">Enter patient demographics</DialogDescription>
                  </DialogHeader>
                  <PatientRegistrationForm onSuccess={handlePatientRegistered} onCancel={() => setIsRegisterOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Patient List */}
        <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader className="p-2.5 pb-2 shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle>Patient Directory</CardTitle>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="h-7">
                  <TabsTrigger value="all">
                    All ({patients.length})
                  </TabsTrigger>
                  <TabsTrigger value="active">
                    Active ({patients.filter(p => p.is_active).length})
                  </TabsTrigger>
                  <TabsTrigger value="inactive">
                    Inactive ({patients.filter(p => !p.is_active).length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 min-h-0">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-xs">
                {searchQuery ? "No patients found" : "No patients registered yet"}
              </div>
            ) : (
              <ScrollArea className="h-full">
                <Table>
                  <TableHeader>
                    <TableRow className="text-[10px]">
                      <TableHead className="py-1.5 px-2">MRN</TableHead>
                      <TableHead className="py-1.5 px-2">Patient Name</TableHead>
                      <TableHead className="py-1.5 px-2">Age/Gender</TableHead>
                      <TableHead className="py-1.5 px-2">Contact</TableHead>
                      <TableHead className="py-1.5 px-2">Location</TableHead>
                      <TableHead className="py-1.5 px-2">Status</TableHead>
                      <TableHead className="py-1.5 px-2 w-8"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPatients.map((patient) => (
                      <TableRow 
                        key={patient.id} 
                        className="cursor-pointer hover:bg-accent text-xs"
                        onClick={() => setSelectedPatient(patient)}
                      >
                        <TableCell className="py-1.5 px-2 font-mono text-[10px]">{patient.mrn}</TableCell>
                        <TableCell className="py-1.5 px-2">
                          <div>
                            <p className="font-medium text-xs">{patient.first_name} {patient.last_name}</p>
                            {patient.allergies && patient.allergies.length > 0 && (
                              <div className="flex items-center gap-0.5 mt-0.5">
                                <AlertCircle className="h-2.5 w-2.5 text-critical" />
                                <span className="text-[9px] text-critical">Allergies</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-1.5 px-2 text-[10px]">
                          {calculateAge(patient.date_of_birth)}y / {patient.gender.charAt(0).toUpperCase()}
                        </TableCell>
                        <TableCell className="py-1.5 px-2">
                          {patient.phone_primary && (
                            <div className="flex items-center gap-1 text-[10px]">
                              <Phone className="h-2.5 w-2.5" />
                              {patient.phone_primary}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="py-1.5 px-2">
                          {patient.city && (
                            <div className="flex items-center gap-1 text-[10px]">
                              <MapPin className="h-2.5 w-2.5" />
                              {patient.city}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="py-1.5 px-2">
                          <Badge variant={patient.is_active ? "default" : "secondary"} className="text-[9px] h-4">
                            {patient.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-1.5 px-2">
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Patients;
