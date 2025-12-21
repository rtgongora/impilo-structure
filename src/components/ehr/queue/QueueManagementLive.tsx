import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, RefreshCw, Filter, Building2, Stethoscope, Video, Calendar, Users, Loader2 } from "lucide-react";
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
import { useQueueData } from "@/hooks/useQueueData";

const triagePriority = { red: 1, orange: 2, yellow: 3, green: 4, blue: 5 };

interface QueueManagementLiveProps {
  workspace?: 'my-queue' | 'ward' | 'department' | 'all';
  wardFilter?: string;
}

export function QueueManagementLive({ workspace = 'my-queue', wardFilter }: QueueManagementLiveProps) {
  const navigate = useNavigate();
  const { patients, loading, error, refetch, updatePatientStatus } = useQueueData(workspace, wardFilter);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [filterTriage, setFilterTriage] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddPatient = (patientData: Omit<QueuePatient, 'id' | 'arrivalTime' | 'ticketNumber' | 'status'>) => {
    // This would create a new encounter in the database
    // For now, just close the dialog and refetch
    refetch();
  };

  const handleCallPatient = async (id: string) => {
    await updatePatientStatus(id, 'in-progress');
    navigate(`/encounter/${id}`);
  };

  const handleCompletePatient = async (id: string) => {
    await updatePatientStatus(id, 'completed');
  };

  const handleOpenChart = (id: string) => {
    navigate(`/encounter/${id}?view=chart`);
  };

  // Filter patients based on search and filters
  const getFilteredPatients = (visitTypeFilter?: VisitType | 'consults') => {
    return patients
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
    all: patients.filter(p => p.status === 'waiting').length,
    inPerson: patients.filter(p => p.visitType === 'in-person' && p.status === 'waiting').length,
    virtual: patients.filter(p => p.visitType === 'virtual' && p.status === 'waiting').length,
    appointments: patients.filter(p => p.visitType === 'appointment' && p.status === 'waiting').length,
    attended: patients.filter(p => p.status === 'completed' || p.status === 'discharged').length,
  };

  const renderPatientList = (filteredPatients: QueuePatient[]) => (
    <ScrollArea className="h-[500px]">
      <div className="space-y-2 pr-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">
            <p>Error: {error}</p>
            <Button variant="outline" onClick={refetch} className="mt-2">
              Retry
            </Button>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No patients in this queue</p>
          </div>
        ) : (
          filteredPatients.map(patient => (
            <QueuePatientCard
              key={patient.id}
              patient={patient}
              onCall={handleCallPatient}
              onComplete={handleCompletePatient}
              onOpenChart={handleOpenChart}
            />
          ))
        )}
      </div>
    </ScrollArea>
  );

  return (
    <div className="space-y-4">
      <QueueStats patients={patients} />

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
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={refetch} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button size="sm" onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Patient
              </Button>
            </div>
          </div>

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
