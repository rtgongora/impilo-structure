import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Search, 
  Plus, 
  Users, 
  Activity,
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  MapPin,
  AlertCircle,
  UserPlus,
  Filter,
  Download,
  MoreHorizontal
} from "lucide-react";
import { toast } from "sonner";
import { PatientRegistrationForm } from "@/components/patients/PatientRegistrationForm";
import { PatientProfile } from "@/components/patients/PatientProfile";

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
  const navigate = useNavigate();
  const { user } = useAuth();
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Patient Management</h1>
                <p className="text-xs text-muted-foreground">Search, register, and manage patients</p>
              </div>
            </div>
          </div>

          <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Register Patient
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Register New Patient</DialogTitle>
                <DialogDescription>
                  Enter the patient's demographic and contact information
                </DialogDescription>
              </DialogHeader>
              <PatientRegistrationForm 
                onSuccess={handlePatientRegistered}
                onCancel={() => setIsRegisterOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{patients.length}</p>
                <p className="text-xs text-muted-foreground">Total Patients</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{patients.filter(p => p.is_active).length}</p>
                <p className="text-xs text-muted-foreground">Active Patients</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {patients.filter(p => {
                    const created = new Date(p.created_at);
                    const today = new Date();
                    return created.toDateString() === today.toDateString();
                  }).length}
                </p>
                <p className="text-xs text-muted-foreground">Today's Registrations</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {patients.filter(p => p.allergies && p.allergies.length > 0).length}
                </p>
                <p className="text-xs text-muted-foreground">With Allergies</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, MRN, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patient List */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Patient Directory</CardTitle>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">All ({patients.length})</TabsTrigger>
                  <TabsTrigger value="active">Active ({patients.filter(p => p.is_active).length})</TabsTrigger>
                  <TabsTrigger value="inactive">Inactive ({patients.filter(p => !p.is_active).length})</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "No patients found matching your search" : "No patients registered yet"}
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>MRN</TableHead>
                      <TableHead>Patient Name</TableHead>
                      <TableHead>Age/Gender</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPatients.map((patient) => (
                      <TableRow 
                        key={patient.id}
                        className="cursor-pointer hover:bg-accent"
                        onClick={() => setSelectedPatient(patient)}
                      >
                        <TableCell className="font-mono text-sm">{patient.mrn}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {patient.first_name} {patient.middle_name ? patient.middle_name + " " : ""}{patient.last_name}
                            </p>
                            {patient.allergies && patient.allergies.length > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                <AlertCircle className="h-3 w-3 text-red-500" />
                                <span className="text-xs text-red-500">Allergies</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span>{calculateAge(patient.date_of_birth)}y</span>
                          <span className="text-muted-foreground"> / </span>
                          <span className="capitalize">{patient.gender.charAt(0).toUpperCase()}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {patient.phone_primary && (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3" />
                                {patient.phone_primary}
                              </div>
                            )}
                            {patient.email && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {patient.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {patient.city && (
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3" />
                              {patient.city}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={patient.is_active ? "default" : "secondary"}>
                            {patient.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
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
      </main>
    </div>
  );
};

export default Patients;
