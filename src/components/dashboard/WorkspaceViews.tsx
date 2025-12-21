import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { 
  Users, 
  Bed,
  Clock,
  AlertCircle,
  ChevronRight,
  Building2,
  User,
  Activity,
} from "lucide-react";

interface DepartmentPatient {
  id: string;
  name: string;
  mrn: string;
  bed: string;
  status: string;
  acuity: "critical" | "high" | "medium" | "low";
  provider: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  patientsAssigned: number;
  tasksCompleted: number;
  status: "online" | "busy" | "offline";
}

// Mock data
const departmentPatients: DepartmentPatient[] = [
  { id: "1", name: "Maria Santos", mrn: "MRN-001234", bed: "A-101", status: "Active", acuity: "critical", provider: "Dr. Ndlovu" },
  { id: "2", name: "John Dlamini", mrn: "MRN-001235", bed: "A-102", status: "Stable", acuity: "medium", provider: "Dr. Moyo" },
  { id: "3", name: "Grace Sibanda", mrn: "MRN-001236", bed: "A-103", status: "Discharge Pending", acuity: "low", provider: "Dr. Ndlovu" },
  { id: "4", name: "Peter Ncube", mrn: "MRN-001237", bed: "B-201", status: "Active", acuity: "high", provider: "Dr. Nkomo" },
  { id: "5", name: "Susan Moyo", mrn: "MRN-001238", bed: "B-202", status: "Critical", acuity: "critical", provider: "Dr. Ndlovu" },
];

const teamMembers: TeamMember[] = [
  { id: "1", name: "Dr. Ndlovu", role: "Attending Physician", patientsAssigned: 8, tasksCompleted: 12, status: "online" },
  { id: "2", name: "Sr. Moyo", role: "Charge Nurse", patientsAssigned: 12, tasksCompleted: 24, status: "online" },
  { id: "3", name: "Dr. Nkomo", role: "Resident", patientsAssigned: 5, tasksCompleted: 8, status: "busy" },
  { id: "4", name: "Nr. Sibanda", role: "Staff Nurse", patientsAssigned: 6, tasksCompleted: 15, status: "online" },
  { id: "5", name: "Nr. Dube", role: "Staff Nurse", patientsAssigned: 6, tasksCompleted: 18, status: "offline" },
];

const getAcuityColor = (acuity: string) => {
  switch (acuity) {
    case "critical": return "bg-critical";
    case "high": return "bg-warning";
    case "medium": return "bg-warning/60";
    case "low": return "bg-success";
    default: return "bg-muted";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "online": return "bg-success";
    case "busy": return "bg-warning";
    case "offline": return "bg-muted";
    default: return "bg-muted";
  }
};

export function DepartmentView() {
  const { currentDepartment } = useWorkspace();
  
  const stats = {
    totalPatients: departmentPatients.length,
    criticalPatients: departmentPatients.filter(p => p.acuity === "critical").length,
    bedsAvailable: 8,
    pendingDischarges: departmentPatients.filter(p => p.status === "Discharge Pending").length,
  };

  return (
    <div className="space-y-6">
      {/* Department Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">{currentDepartment} Department</h2>
          <p className="text-sm text-muted-foreground">All patients and resources in this department</p>
        </div>
      </div>

      {/* Department Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalPatients}</p>
              <p className="text-xs text-muted-foreground">Total Patients</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-critical/10 rounded-lg">
              <AlertCircle className="h-5 w-5 text-critical" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.criticalPatients}</p>
              <p className="text-xs text-muted-foreground">Critical</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <Bed className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.bedsAvailable}</p>
              <p className="text-xs text-muted-foreground">Beds Available</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pendingDischarges}</p>
              <p className="text-xs text-muted-foreground">Pending Discharge</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Patient List */}
      <Card>
        <CardHeader>
          <CardTitle>Department Patients</CardTitle>
          <CardDescription>All patients currently admitted to {currentDepartment}</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {departmentPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-1 h-12 rounded-full ${getAcuityColor(patient.acuity)}`} />
                    <div>
                      <p className="font-medium">{patient.name}</p>
                      <p className="text-sm text-muted-foreground">{patient.mrn}</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-2 mb-1">
                      <Bed className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm font-medium">{patient.bed}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">{patient.status}</Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{patient.provider}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export function TeamView() {
  const teamStats = {
    totalMembers: teamMembers.length,
    online: teamMembers.filter(m => m.status === "online").length,
    totalPatients: teamMembers.reduce((acc, m) => acc + m.patientsAssigned, 0),
    totalTasksCompleted: teamMembers.reduce((acc, m) => acc + m.tasksCompleted, 0),
  };

  return (
    <div className="space-y-6">
      {/* Team Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">My Team</h2>
          <p className="text-sm text-muted-foreground">Team workload and assignments</p>
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{teamStats.totalMembers}</p>
              <p className="text-xs text-muted-foreground">Team Members</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <Activity className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{teamStats.online}</p>
              <p className="text-xs text-muted-foreground">Online Now</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <User className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{teamStats.totalPatients}</p>
              <p className="text-xs text-muted-foreground">Team Patients</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{teamStats.totalTasksCompleted}</p>
              <p className="text-xs text-muted-foreground">Tasks Today</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Current workload and status</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(member.status)}`} />
                    </div>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-lg font-bold">{member.patientsAssigned}</p>
                      <p className="text-xs text-muted-foreground">Patients</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold">{member.tasksCompleted}</p>
                      <p className="text-xs text-muted-foreground">Tasks Done</p>
                    </div>
                    <Badge 
                      variant={member.status === "online" ? "default" : member.status === "busy" ? "secondary" : "outline"}
                      className="capitalize"
                    >
                      {member.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
