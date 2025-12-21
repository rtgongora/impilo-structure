import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, RefreshCw, Filter, Building2, Stethoscope, Video, Calendar, Users, Bed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QueuePatientCard, type QueuePatient, type VisitType } from "./QueuePatientCard";
import { AddPatientDialog } from "./AddPatientDialog";
import { QueueStats } from "./QueueStats";

// Mock data with enhanced types
const mockPatients: QueuePatient[] = [
  { id: '1', name: 'John Mwangi', mrn: 'MRN-2024-001', age: 45, gender: 'M', chiefComplaint: 'Chest pain, shortness of breath', triageLevel: 'red', arrivalTime: new Date(Date.now() - 5 * 60000), ticketNumber: 'CAS-101', status: 'waiting', visitType: 'in-person' },
  { id: '2', name: 'Grace Wanjiku', mrn: 'MRN-2024-002', age: 32, gender: 'F', chiefComplaint: 'Severe abdominal pain', triageLevel: 'orange', arrivalTime: new Date(Date.now() - 15 * 60000), ticketNumber: 'CAS-102', status: 'waiting', visitType: 'in-person' },
  { id: '3', name: 'Peter Ochieng', mrn: 'MRN-2024-003', age: 28, gender: 'M', chiefComplaint: 'Road traffic accident - leg injury', triageLevel: 'yellow', arrivalTime: new Date(Date.now() - 25 * 60000), ticketNumber: 'CAS-103', status: 'in-consultation', visitType: 'in-person', provider: 'Mwangi', ward: 'Casualty', bed: 'Bed 3' },
  { id: '4', name: 'Mary Akinyi', mrn: 'MRN-2024-004', age: 55, gender: 'F', chiefComplaint: 'Follow-up for diabetes', triageLevel: 'green', arrivalTime: new Date(Date.now() - 45 * 60000), ticketNumber: 'OPD-201', status: 'waiting', visitType: 'virtual', appointmentTime: '10:30 AM' },
  { id: '5', name: 'James Kamau', mrn: 'MRN-2024-005', age: 67, gender: 'M', chiefComplaint: 'Chronic cough, 2 weeks', triageLevel: 'green', arrivalTime: new Date(Date.now() - 60 * 60000), ticketNumber: 'OPD-202', status: 'waiting', visitType: 'appointment', appointmentTime: '11:00 AM' },
  { id: '6', name: 'Susan Njeri', mrn: 'MRN-2024-006', age: 24, gender: 'F', chiefComplaint: 'Skin rash', triageLevel: 'blue', arrivalTime: new Date(Date.now() - 90 * 60000), ticketNumber: 'OPD-203', status: 'waiting', visitType: 'in-person' },
  { id: '7', name: 'David Kipchoge', mrn: 'MRN-2024-007', age: 38, gender: 'M', chiefComplaint: 'Headache and fever', triageLevel: 'yellow', arrivalTime: new Date(Date.now() - 35 * 60000), ticketNumber: 'CAS-104', status: 'called', visitType: 'in-person' },
  { id: '8', name: 'Anne Wambui', mrn: 'MRN-2024-008', age: 42, gender: 'F', chiefComplaint: 'Cardiology consult - CHF management', triageLevel: 'yellow', arrivalTime: new Date(Date.now() - 120 * 60000), ticketNumber: 'CON-001', status: 'waiting', visitType: 'consultation', ward: 'Ward 3A', bed: 'Bed 12' },
  { id: '9', name: 'Joseph Otieno', mrn: 'MRN-2024-009', age: 58, gender: 'M', chiefComplaint: 'Endocrinology referral - Thyroid nodule', triageLevel: 'green', arrivalTime: new Date(Date.now() - 180 * 60000), ticketNumber: 'REF-001', status: 'waiting', visitType: 'referral' },
  { id: '10', name: 'Faith Muthoni', mrn: 'MRN-2024-010', age: 35, gender: 'F', chiefComplaint: 'Antenatal checkup', triageLevel: 'green', arrivalTime: new Date(Date.now() - 30 * 60000), ticketNumber: 'OPD-204', status: 'completed', visitType: 'appointment', provider: 'Kamau' },
];

const triagePriority = { red: 1, orange: 2, yellow: 3, green: 4, blue: 5 };

interface QueueManagementProps {
  workspace?: 'my-queue' | 'ward' | 'department' | 'all';
  wardFilter?: string;
}

export function QueueManagement({ workspace = 'my-queue', wardFilter }: QueueManagementProps) {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<QueuePatient[]>(mockPatients);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [filterTriage, setFilterTriage] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [, setTick] = useState(0);

  // Update wait times every minute
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const handleAddPatient = (patientData: Omit<QueuePatient, 'id' | 'arrivalTime' | 'ticketNumber' | 'status'>) => {
    const prefix = patientData.visitType === 'consultation' ? 'CON' : 
                   patientData.visitType === 'referral' ? 'REF' :
                   patientData.visitType === 'virtual' ? 'VIR' : 'OPD';
    const newPatient: QueuePatient = {
      ...patientData,
      id: Date.now().toString(),
      arrivalTime: new Date(),
      ticketNumber: `${prefix}-${Math.floor(Math.random() * 900) + 100}`,
      status: 'waiting',
    };
    setPatients(prev => [...prev, newPatient]);
  };

  const handleCallPatient = (id: string) => {
    setPatients(prev => prev.map(p => 
      p.id === id ? { ...p, status: 'in-consultation' as const } : p
    ));
    // Navigate to encounter
    navigate(`/encounter/${id}`);
  };

  const handleCompletePatient = (id: string) => {
    setPatients(prev => prev.map(p => 
      p.id === id ? { ...p, status: 'completed' as const } : p
    ));
  };

  const handleOpenChart = (id: string) => {
    navigate(`/encounter/${id}?view=chart`);
  };

  // Filter patients based on search and filters
  const getFilteredPatients = (visitTypeFilter?: VisitType | 'consults') => {
    return patients
      .filter(p => {
        // Search filter
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          if (!p.name.toLowerCase().includes(term) && 
              !p.mrn?.toLowerCase().includes(term) &&
              !p.ticketNumber.toLowerCase().includes(term)) {
            return false;
          }
        }
        // Triage filter
        if (filterTriage !== 'all' && p.triageLevel !== filterTriage) return false;
        // Visit type filter
        if (visitTypeFilter === 'consults') {
          return p.visitType === 'consultation' || p.visitType === 'referral';
        }
        if (visitTypeFilter && p.visitType !== visitTypeFilter) return false;
        return true;
      })
      .sort((a, b) => {
        // Sort: waiting first, then by triage priority, then by arrival time
        if (a.status === 'completed' && b.status !== 'completed') return 1;
        if (a.status !== 'completed' && b.status === 'completed') return -1;
        if (a.status === 'waiting' && b.status !== 'waiting') return -1;
        if (a.status !== 'waiting' && b.status === 'waiting') return 1;
        const priorityDiff = triagePriority[a.triageLevel] - triagePriority[b.triageLevel];
        if (priorityDiff !== 0) return priorityDiff;
        return a.arrivalTime.getTime() - b.arrivalTime.getTime();
      });
  };

  const tabCounts = {
    all: patients.filter(p => p.status === 'waiting').length,
    inPerson: patients.filter(p => p.visitType === 'in-person' && p.status === 'waiting').length,
    virtual: patients.filter(p => p.visitType === 'virtual' && p.status === 'waiting').length,
    appointments: patients.filter(p => p.visitType === 'appointment' && p.status === 'waiting').length,
    attended: patients.filter(p => p.status === 'completed' || p.status === 'discharged').length,
  };

  const renderPatientList = (filteredPatients: QueuePatient[]) => (
    <ScrollArea className="h-[500px]">
      <div className="space-y-2 pr-4">
        {filteredPatients.map(patient => (
          <QueuePatientCard
            key={patient.id}
            patient={patient}
            onCall={handleCallPatient}
            onComplete={handleCompletePatient}
            onOpenChart={handleOpenChart}
          />
        ))}
        {filteredPatients.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No patients in this queue</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      <QueueStats patients={patients} />

      {/* Main Queue Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg">Patient Queue</CardTitle>
              {workspace === 'ward' && wardFilter && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {wardFilter}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setTick(t => t + 1)}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Patient
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            <Input
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
            <Select value={filterTriage} onValueChange={setFilterTriage}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgency</SelectItem>
                <SelectItem value="red">Immediate</SelectItem>
                <SelectItem value="orange">Emergency</SelectItem>
                <SelectItem value="yellow">Urgent</SelectItem>
                <SelectItem value="green">Standard</SelectItem>
                <SelectItem value="blue">Routine</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex flex-wrap h-auto gap-1">
              <TabsTrigger value="all" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                All ({tabCounts.all})
              </TabsTrigger>
              <TabsTrigger value="in-person">
                In Person ({tabCounts.inPerson})
              </TabsTrigger>
              <TabsTrigger value="virtual" className="flex items-center gap-1">
                <Video className="h-3 w-3" />
                Virtual ({tabCounts.virtual})
              </TabsTrigger>
              <TabsTrigger value="appointments" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Appointments ({tabCounts.appointments})
              </TabsTrigger>
              <TabsTrigger value="attended">
                Attended ({tabCounts.attended})
              </TabsTrigger>
            </TabsList>

            <div className="mt-4">
              <TabsContent value="all" className="mt-0">
                {renderPatientList(getFilteredPatients())}
              </TabsContent>
              <TabsContent value="in-person" className="mt-0">
                {renderPatientList(getFilteredPatients('in-person'))}
              </TabsContent>
              <TabsContent value="virtual" className="mt-0">
                {renderPatientList(getFilteredPatients('virtual'))}
              </TabsContent>
              <TabsContent value="appointments" className="mt-0">
                {renderPatientList(getFilteredPatients('appointment'))}
              </TabsContent>
              <TabsContent value="attended" className="mt-0">
                {renderPatientList(patients.filter(p => p.status === 'completed' || p.status === 'discharged'))}
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Consults & Referrals Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Consults & Referrals
            <Badge variant="secondary">
              {patients.filter(p => (p.visitType === 'consultation' || p.visitType === 'referral') && p.status === 'waiting').length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderPatientList(getFilteredPatients('consults'))}
        </CardContent>
      </Card>

      <AddPatientDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={handleAddPatient}
        queueType="opd"
      />
    </div>
  );
}
