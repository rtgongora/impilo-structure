import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, RefreshCw, Filter, Building2, Stethoscope, Video, Calendar, Users, Bed, AlertCircle, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SecureQueueCard, type SecureQueuePatient, type VisitType } from "@/components/queue/SecureQueueCard";
import { AddPatientDialog } from "./AddPatientDialog";
import { QueueStats } from "./QueueStats";
import { useWorkspace, CareSetting } from "@/contexts/WorkspaceContext";
import { 
  SecureChartAccessFlow, 
  useSecureChartAccess,
  type PendingChartAccess,
} from "@/components/ehr/SecureChartAccessFlow";
import { toast } from "sonner";

// Mock data with enhanced types - PII will be masked by SecureQueueCard
const mockPatients: SecureQueuePatient[] = [
  { id: '1', name: 'John Mwangi', mrn: 'MRN-2024-001', age: 45, gender: 'M', chiefComplaint: 'Chest pain, shortness of breath', triageLevel: 'red', arrivalTime: new Date(Date.now() - 5 * 60000), ticketNumber: 'CAS-101', status: 'waiting', visitType: 'in-person', careContext: 'emergency' },
  { id: '2', name: 'Grace Wanjiku', mrn: 'MRN-2024-002', age: 32, gender: 'F', chiefComplaint: 'Severe abdominal pain', triageLevel: 'orange', arrivalTime: new Date(Date.now() - 15 * 60000), ticketNumber: 'CAS-102', status: 'waiting', visitType: 'in-person', careContext: 'emergency' },
  { id: '3', name: 'Peter Ochieng', mrn: 'MRN-2024-003', age: 28, gender: 'M', chiefComplaint: 'Road traffic accident - leg injury', triageLevel: 'yellow', arrivalTime: new Date(Date.now() - 25 * 60000), ticketNumber: 'CAS-103', status: 'in-consultation', visitType: 'in-person', provider: 'Mwangi', ward: 'Casualty', bed: 'Bed 3', careContext: 'emergency' },
  { id: '4', name: 'Mary Akinyi', mrn: 'MRN-2024-004', age: 55, gender: 'F', chiefComplaint: 'Follow-up for diabetes', triageLevel: 'green', arrivalTime: new Date(Date.now() - 45 * 60000), ticketNumber: 'OPD-201', status: 'waiting', visitType: 'virtual', appointmentTime: '10:30 AM', careContext: 'outpatient' },
  { id: '5', name: 'James Kamau', mrn: 'MRN-2024-005', age: 67, gender: 'M', chiefComplaint: 'Chronic cough, 2 weeks', triageLevel: 'green', arrivalTime: new Date(Date.now() - 60 * 60000), ticketNumber: 'OPD-202', status: 'waiting', visitType: 'appointment', appointmentTime: '11:00 AM', careContext: 'outpatient' },
  { id: '6', name: 'Susan Njeri', mrn: 'MRN-2024-006', age: 24, gender: 'F', chiefComplaint: 'Skin rash', triageLevel: 'blue', arrivalTime: new Date(Date.now() - 90 * 60000), ticketNumber: 'OPD-203', status: 'waiting', visitType: 'in-person', careContext: 'outpatient' },
  { id: '7', name: 'David Kipchoge', mrn: 'MRN-2024-007', age: 38, gender: 'M', chiefComplaint: 'Headache and fever', triageLevel: 'yellow', arrivalTime: new Date(Date.now() - 35 * 60000), ticketNumber: 'CAS-104', status: 'called', visitType: 'in-person', careContext: 'emergency' },
  { id: '8', name: 'Anne Wambui', mrn: 'MRN-2024-008', age: 42, gender: 'F', chiefComplaint: 'Cardiology consult - CHF management', triageLevel: 'yellow', arrivalTime: new Date(Date.now() - 120 * 60000), ticketNumber: 'CON-001', status: 'waiting', visitType: 'consultation', ward: 'Ward 3A', bed: 'Bed 12', careContext: 'inpatient' },
  { id: '9', name: 'Joseph Otieno', mrn: 'MRN-2024-009', age: 58, gender: 'M', chiefComplaint: 'Endocrinology referral - Thyroid nodule', triageLevel: 'green', arrivalTime: new Date(Date.now() - 180 * 60000), ticketNumber: 'REF-001', status: 'waiting', visitType: 'referral', careContext: 'outpatient' },
  { id: '10', name: 'Faith Muthoni', mrn: 'MRN-2024-010', age: 35, gender: 'F', chiefComplaint: 'Antenatal checkup', triageLevel: 'green', arrivalTime: new Date(Date.now() - 30 * 60000), ticketNumber: 'OPD-204', status: 'completed', visitType: 'appointment', provider: 'Kamau', careContext: 'outpatient' },
  { id: '11', name: 'Robert Mutua', mrn: 'MRN-2024-011', age: 72, gender: 'M', chiefComplaint: 'Post-op day 2 - wound review', triageLevel: 'green', arrivalTime: new Date(Date.now() - 240 * 60000), ticketNumber: 'IPD-001', status: 'waiting', visitType: 'in-person', ward: 'Surgical Ward', bed: 'Bed 5', careContext: 'inpatient' },
  { id: '12', name: 'Elizabeth Ngugi', mrn: 'MRN-2024-012', age: 48, gender: 'F', chiefComplaint: 'Pending discharge - medication counseling', triageLevel: 'blue', arrivalTime: new Date(Date.now() - 300 * 60000), ticketNumber: 'IPD-002', status: 'waiting', visitType: 'in-person', ward: 'Medical Ward', bed: 'Bed 8', careContext: 'inpatient' },
];

const triagePriority = { red: 1, orange: 2, yellow: 3, green: 4, blue: 5 };

interface QueueManagementProps {
  workspace?: 'my-queue' | 'ward' | 'department' | 'all';
  wardFilter?: string;
}

export function QueueManagement({ workspace = 'my-queue', wardFilter }: QueueManagementProps) {
  const navigate = useNavigate();
  const { careSetting, currentDepartment, isInpatientContext, isOutpatientContext, isEmergencyContext } = useWorkspace();
  const [patients, setPatients] = useState<SecureQueuePatient[]>(mockPatients);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [filterTriage, setFilterTriage] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [, setTick] = useState(0);
  
  // Secure chart access flow
  const {
    pendingAccess,
    isAuthorizing,
    initiateChartAccess,
    cancelChartAccess,
    authorizeAndOpen,
    quickAccessFromQueue,
  } = useSecureChartAccess();

  // Update wait times every minute
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // Filter patients based on care context
  const contextFilteredPatients = patients.filter(p => {
    if (careSetting === "all") return true;
    if (careSetting === "inpatient") return p.careContext === "inpatient";
    if (careSetting === "outpatient") return p.careContext === "outpatient";
    if (careSetting === "emergency") return p.careContext === "emergency";
    return true;
  });

  const handleAddPatient = (patientData: Omit<SecureQueuePatient, 'id' | 'arrivalTime' | 'ticketNumber' | 'status'>) => {
    const prefix = patientData.visitType === 'consultation' ? 'CON' : 
                   patientData.visitType === 'referral' ? 'REF' :
                   patientData.visitType === 'virtual' ? 'VIR' :
                   careSetting === 'inpatient' ? 'IPD' :
                   careSetting === 'emergency' ? 'CAS' : 'OPD';
    const newPatient: SecureQueuePatient = {
      ...patientData,
      id: Date.now().toString(),
      arrivalTime: new Date(),
      ticketNumber: `${prefix}-${Math.floor(Math.random() * 900) + 100}`,
      status: 'waiting',
      careContext: careSetting === 'all' ? 'outpatient' : careSetting,
    };
    setPatients(prev => [...prev, newPatient]);
  };

  // Attend patient - immediate access from queue (pre-authorized)
  const handleAttendPatient = (id: string) => {
    setPatients(prev => prev.map(p => 
      p.id === id ? { ...p, status: 'in-consultation' as const } : p
    ));
    
    // Queue-based access is pre-authorized
    quickAccessFromQueue(id, id);
    toast.info("Starting consultation", {
      description: "Chart access authorized via queue assignment",
    });
  };

  const handleCompletePatient = (id: string) => {
    setPatients(prev => prev.map(p => 
      p.id === id ? { ...p, status: 'completed' as const } : p
    ));
  };

  // Secure chart access - requires authorization dialog
  const handleOpenSecureChart = (id: string) => {
    const patient = patients.find(p => p.id === id);
    if (!patient) return;

    // Initiate secure access flow
    initiateChartAccess({
      patientId: id,
      encounterId: id, // In real app, would look up or create encounter
      patientName: patient.name,
      patientMrn: patient.mrn || 'Unknown',
      patientDob: '1980-01-01', // Would come from patient data
      source: 'search', // Requires authorization since not from queue
    });
  };

  // Filter patients based on search and filters
  const getFilteredPatients = (visitTypeFilter?: VisitType | 'consults') => {
    return contextFilteredPatients
      .filter(p => {
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          if (!p.name.toLowerCase().includes(term) && 
              !p.mrn?.toLowerCase().includes(term) &&
              !p.ticketNumber.toLowerCase().includes(term)) {
            return false;
          }
        }
        if (filterTriage !== 'all' && p.triageLevel !== filterTriage) return false;
        if (visitTypeFilter === 'consults') {
          return p.visitType === 'consultation' || p.visitType === 'referral';
        }
        if (visitTypeFilter && p.visitType !== visitTypeFilter) return false;
        return true;
      })
      .sort((a, b) => {
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
    all: contextFilteredPatients.filter(p => p.status === 'waiting').length,
    inPerson: contextFilteredPatients.filter(p => p.visitType === 'in-person' && p.status === 'waiting').length,
    virtual: contextFilteredPatients.filter(p => p.visitType === 'virtual' && p.status === 'waiting').length,
    appointments: contextFilteredPatients.filter(p => p.visitType === 'appointment' && p.status === 'waiting').length,
    attended: contextFilteredPatients.filter(p => p.status === 'completed' || p.status === 'discharged').length,
    // Inpatient-specific
    wardRounds: contextFilteredPatients.filter(p => p.ward && p.status === 'waiting').length,
    pendingDischarge: contextFilteredPatients.filter(p => p.chiefComplaint?.toLowerCase().includes('discharge') && p.status === 'waiting').length,
  };

  const renderPatientList = (filteredPatients: SecureQueuePatient[]) => (
    <ScrollArea className="h-[500px]">
      <div className="space-y-2 pr-4">
        {filteredPatients.map(patient => (
          <SecureQueueCard
            key={patient.id}
            patient={patient}
            onAttend={handleAttendPatient}
            onComplete={handleCompletePatient}
            onOpenSecureChart={handleOpenSecureChart}
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

  // Get context-aware title and description
  const getContextInfo = () => {
    switch (careSetting) {
      case "inpatient":
        return {
          title: "Inpatient Queue",
          description: "Ward rounds, consults, and inpatient care tasks",
          icon: Bed,
        };
      case "outpatient":
        return {
          title: "Outpatient Queue",
          description: "Clinic appointments, walk-ins, and virtual visits",
          icon: Users,
        };
      case "emergency":
        return {
          title: "Emergency Queue",
          description: "Triage-prioritized emergency patients",
          icon: AlertCircle,
        };
      default:
        return {
          title: "Patient Queue",
          description: "All patient queues across care settings",
          icon: Users,
        };
    }
  };

  const contextInfo = getContextInfo();
  const ContextIcon = contextInfo.icon;

  // Context-aware tabs
  const renderTabs = () => {
    if (careSetting === "inpatient") {
      return (
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="all" className="flex items-center gap-1">
            <Bed className="h-3 w-3" />
            All ({tabCounts.all})
          </TabsTrigger>
          <TabsTrigger value="ward-rounds">
            Ward Rounds ({tabCounts.wardRounds})
          </TabsTrigger>
          <TabsTrigger value="consults" className="flex items-center gap-1">
            <Stethoscope className="h-3 w-3" />
            Consults
          </TabsTrigger>
          <TabsTrigger value="discharge">
            Pending Discharge ({tabCounts.pendingDischarge})
          </TabsTrigger>
          <TabsTrigger value="attended">
            Attended ({tabCounts.attended})
          </TabsTrigger>
        </TabsList>
      );
    }

    if (careSetting === "emergency") {
      return (
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="all" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            All ({tabCounts.all})
          </TabsTrigger>
          <TabsTrigger value="in-person">
            Walk-in ({tabCounts.inPerson})
          </TabsTrigger>
          <TabsTrigger value="resus" className="text-red-500">
            Resus
          </TabsTrigger>
          <TabsTrigger value="attended">
            Attended ({tabCounts.attended})
          </TabsTrigger>
        </TabsList>
      );
    }

    // Outpatient / All
    return (
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
    );
  };

  return (
    <div className="space-y-4">
      {/* Context Banner */}
      <Alert className="border-primary/20 bg-primary/5">
        <ContextIcon className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>
            <strong>{contextInfo.title}</strong> — {contextInfo.description}
          </span>
          <Badge variant="outline">{currentDepartment}</Badge>
        </AlertDescription>
      </Alert>

      {/* Stats Overview */}
      <QueueStats patients={contextFilteredPatients} />

      {/* Main Queue Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg">{contextInfo.title}</CardTitle>
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
            {renderTabs()}

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
                {renderPatientList(contextFilteredPatients.filter(p => p.status === 'completed' || p.status === 'discharged'))}
              </TabsContent>
              {/* Inpatient-specific tabs */}
              <TabsContent value="ward-rounds" className="mt-0">
                {renderPatientList(contextFilteredPatients.filter(p => p.ward && p.status === 'waiting'))}
              </TabsContent>
              <TabsContent value="discharge" className="mt-0">
                {renderPatientList(contextFilteredPatients.filter(p => p.chiefComplaint?.toLowerCase().includes('discharge') && p.status === 'waiting'))}
              </TabsContent>
              <TabsContent value="consults" className="mt-0">
                {renderPatientList(getFilteredPatients('consults'))}
              </TabsContent>
              {/* Emergency-specific tabs */}
              <TabsContent value="resus" className="mt-0">
                {renderPatientList(contextFilteredPatients.filter(p => p.triageLevel === 'red'))}
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Consults & Referrals Section - Only show in inpatient/all context */}
      {(careSetting === "inpatient" || careSetting === "all") && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Consults & Referrals
              <Badge variant="secondary">
                {contextFilteredPatients.filter(p => (p.visitType === 'consultation' || p.visitType === 'referral') && p.status === 'waiting').length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderPatientList(getFilteredPatients('consults'))}
          </CardContent>
        </Card>
      )}

      <AddPatientDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={handleAddPatient}
        queueType={careSetting === "inpatient" ? "inpatient" : careSetting === "emergency" ? "casualty" : "opd"}
      />

      {/* Secure Chart Access Authorization Dialog */}
      <SecureChartAccessFlow
        pendingAccess={pendingAccess}
        isAuthorizing={isAuthorizing}
        onAuthorize={authorizeAndOpen}
        onCancel={cancelChartAccess}
      />
    </div>
  );
}
