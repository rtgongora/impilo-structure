import { useState, useEffect } from "react";
import { Plus, RefreshCw, Volume2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QueuePatientCard, type QueuePatient } from "./QueuePatientCard";
import { AddPatientDialog } from "./AddPatientDialog";
import { QueueStats } from "./QueueStats";

// Mock data generator
const generateTicketNumber = (type: 'opd' | 'casualty') => {
  const prefix = type === 'opd' ? 'OPD' : 'CAS';
  const num = Math.floor(Math.random() * 900) + 100;
  return `${prefix}-${num}`;
};

const mockPatients: QueuePatient[] = [
  { id: '1', name: 'John Mwangi', age: 45, gender: 'M', chiefComplaint: 'Chest pain, shortness of breath', triageLevel: 'red', arrivalTime: new Date(Date.now() - 5 * 60000), ticketNumber: 'CAS-101', status: 'waiting' },
  { id: '2', name: 'Grace Wanjiku', age: 32, gender: 'F', chiefComplaint: 'Severe abdominal pain', triageLevel: 'orange', arrivalTime: new Date(Date.now() - 15 * 60000), ticketNumber: 'CAS-102', status: 'waiting' },
  { id: '3', name: 'Peter Ochieng', age: 28, gender: 'M', chiefComplaint: 'Road traffic accident - leg injury', triageLevel: 'yellow', arrivalTime: new Date(Date.now() - 25 * 60000), ticketNumber: 'CAS-103', status: 'in-consultation' },
  { id: '4', name: 'Mary Akinyi', age: 55, gender: 'F', chiefComplaint: 'Follow-up for diabetes', triageLevel: 'green', arrivalTime: new Date(Date.now() - 45 * 60000), ticketNumber: 'OPD-201', status: 'waiting' },
  { id: '5', name: 'James Kamau', age: 67, gender: 'M', chiefComplaint: 'Chronic cough, 2 weeks', triageLevel: 'green', arrivalTime: new Date(Date.now() - 60 * 60000), ticketNumber: 'OPD-202', status: 'waiting' },
  { id: '6', name: 'Susan Njeri', age: 24, gender: 'F', chiefComplaint: 'Skin rash', triageLevel: 'blue', arrivalTime: new Date(Date.now() - 90 * 60000), ticketNumber: 'OPD-203', status: 'waiting' },
  { id: '7', name: 'David Kipchoge', age: 38, gender: 'M', chiefComplaint: 'Headache and fever', triageLevel: 'yellow', arrivalTime: new Date(Date.now() - 35 * 60000), ticketNumber: 'CAS-104', status: 'called' },
];

const triagePriority = { red: 1, orange: 2, yellow: 3, green: 4, blue: 5 };

export function QueueManagement() {
  const [patients, setPatients] = useState<QueuePatient[]>(mockPatients);
  const [activeTab, setActiveTab] = useState<'casualty' | 'opd'>('casualty');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [filterTriage, setFilterTriage] = useState<string>('all');
  const [, setTick] = useState(0);

  // Update wait times every minute
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const handleAddPatient = (patientData: Omit<QueuePatient, 'id' | 'arrivalTime' | 'ticketNumber' | 'status'>) => {
    const newPatient: QueuePatient = {
      ...patientData,
      id: Date.now().toString(),
      arrivalTime: new Date(),
      ticketNumber: generateTicketNumber(activeTab),
      status: 'waiting',
    };
    setPatients(prev => [...prev, newPatient]);
  };

  const handleCallPatient = (id: string) => {
    setPatients(prev => prev.map(p => 
      p.id === id ? { ...p, status: 'called' as const } : p
    ));
    // Simulate voice announcement
    const patient = patients.find(p => p.id === id);
    if (patient) {
      const utterance = new SpeechSynthesisUtterance(
        `Ticket number ${patient.ticketNumber}. ${patient.name}, please proceed to consultation.`
      );
      speechSynthesis.speak(utterance);
    }
  };

  const handleCompletePatient = (id: string) => {
    setPatients(prev => prev.map(p => 
      p.id === id ? { ...p, status: 'completed' as const } : p
    ));
  };

  const filteredPatients = patients
    .filter(p => {
      const isCasualty = p.ticketNumber.startsWith('CAS');
      if (activeTab === 'casualty' && !isCasualty) return false;
      if (activeTab === 'opd' && isCasualty) return false;
      if (filterTriage !== 'all' && p.triageLevel !== filterTriage) return false;
      return true;
    })
    .sort((a, b) => {
      // Sort by status (waiting first), then triage priority, then arrival time
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      if (a.status === 'waiting' && b.status !== 'waiting') return -1;
      if (a.status !== 'waiting' && b.status === 'waiting') return 1;
      const priorityDiff = triagePriority[a.triageLevel] - triagePriority[b.triageLevel];
      if (priorityDiff !== 0) return priorityDiff;
      return a.arrivalTime.getTime() - b.arrivalTime.getTime();
    });

  const waitingPatients = filteredPatients.filter(p => p.status === 'waiting');
  const activePatients = filteredPatients.filter(p => p.status === 'called' || p.status === 'in-consultation');
  const completedPatients = filteredPatients.filter(p => p.status === 'completed');

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">Queue Management</h1>
            <p className="text-sm text-muted-foreground">Patient queuing with triage prioritization</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setTick(t => t + 1)}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Patient
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'casualty' | 'opd')}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="casualty" className="gap-2">
                Casualty
                <Badge variant="secondary" className="ml-1">
                  {patients.filter(p => p.ticketNumber.startsWith('CAS') && p.status === 'waiting').length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="opd" className="gap-2">
                OPD
                <Badge variant="secondary" className="ml-1">
                  {patients.filter(p => p.ticketNumber.startsWith('OPD') && p.status === 'waiting').length}
                </Badge>
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterTriage} onValueChange={setFilterTriage}>
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue placeholder="Filter triage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="red">Immediate</SelectItem>
                  <SelectItem value="orange">Very Urgent</SelectItem>
                  <SelectItem value="yellow">Urgent</SelectItem>
                  <SelectItem value="green">Standard</SelectItem>
                  <SelectItem value="blue">Non-Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="casualty" className="mt-4">
            <QueueStats patients={patients.filter(p => p.ticketNumber.startsWith('CAS'))} />
          </TabsContent>
          <TabsContent value="opd" className="mt-4">
            <QueueStats patients={patients.filter(p => p.ticketNumber.startsWith('OPD'))} />
          </TabsContent>
        </Tabs>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 h-full divide-x">
          {/* Waiting Queue */}
          <div className="flex flex-col h-full">
            <div className="p-3 border-b bg-muted/30">
              <h2 className="font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Waiting ({waitingPatients.length})
              </h2>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {waitingPatients.map(patient => (
                  <QueuePatientCard
                    key={patient.id}
                    patient={patient}
                    onCall={handleCallPatient}
                    onComplete={handleCompletePatient}
                  />
                ))}
                {waitingPatients.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No patients waiting</p>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Active/In Consultation */}
          <div className="flex flex-col h-full">
            <div className="p-3 border-b bg-muted/30">
              <h2 className="font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                In Progress ({activePatients.length})
              </h2>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {activePatients.map(patient => (
                  <QueuePatientCard
                    key={patient.id}
                    patient={patient}
                    onCall={handleCallPatient}
                    onComplete={handleCompletePatient}
                  />
                ))}
                {activePatients.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No active consultations</p>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Completed */}
          <div className="flex flex-col h-full">
            <div className="p-3 border-b bg-muted/30">
              <h2 className="font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                Completed ({completedPatients.length})
              </h2>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {completedPatients.map(patient => (
                  <QueuePatientCard
                    key={patient.id}
                    patient={patient}
                    onCall={handleCallPatient}
                    onComplete={handleCompletePatient}
                    showActions={false}
                  />
                ))}
                {completedPatients.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No completed consultations</p>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      <AddPatientDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={handleAddPatient}
        queueType={activeTab}
      />
    </div>
  );
}
