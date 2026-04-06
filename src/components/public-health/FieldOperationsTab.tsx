import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Users, MapPin, CheckCircle, Clock, Plus, Navigation, ClipboardList, Radio } from "lucide-react";

const FIELD_TEAMS = [
  { id: "FT-01", name: "Harare South Response Team", lead: "J. Moyo", members: 6, status: "deployed", location: "Budiriro", activeSince: "2026-04-02", tasksComplete: 12, tasksPending: 4 },
  { id: "FT-02", name: "Chitungwiza Investigation Team", lead: "T. Ndlovu", members: 4, status: "deployed", location: "Chitungwiza", activeSince: "2026-04-04", tasksComplete: 5, tasksPending: 8 },
  { id: "FT-03", name: "Manicaland Vector Control Unit", lead: "P. Chirwa", members: 8, status: "deployed", location: "Chipinge", activeSince: "2026-03-28", tasksComplete: 45, tasksPending: 15 },
  { id: "FT-04", name: "Masvingo Measles Response", lead: "S. Makoni", members: 5, status: "standby", location: "Base", activeSince: null, tasksComplete: 0, tasksPending: 0 },
  { id: "FT-05", name: "Port Health Inspection Team", lead: "R. Dube", members: 3, status: "deployed", location: "Beitbridge", activeSince: "2026-04-01", tasksComplete: 22, tasksPending: 6 },
];

const FIELD_TASKS = [
  { id: "TSK-001", task: "Contact tracing — Cholera cluster", team: "FT-01", priority: "critical", status: "in_progress", due: "2026-04-06", contacts: 23, traced: 18 },
  { id: "TSK-002", task: "Water source sampling — Budiriro", team: "FT-01", priority: "high", status: "in_progress", due: "2026-04-06", contacts: null, traced: null },
  { id: "TSK-003", task: "Household decontamination", team: "FT-01", priority: "high", status: "pending", due: "2026-04-07", contacts: null, traced: null },
  { id: "TSK-004", task: "Case investigation — Typhoid", team: "FT-02", priority: "high", status: "in_progress", due: "2026-04-06", contacts: 8, traced: 3 },
  { id: "TSK-005", task: "IRS — Ward 12 Chipinge", team: "FT-03", priority: "medium", status: "in_progress", due: "2026-04-10", contacts: null, traced: null },
  { id: "TSK-006", task: "Post-campaign mop-up vaccination", team: "FT-03", priority: "medium", status: "pending", due: "2026-04-12", contacts: null, traced: null },
  { id: "TSK-007", task: "Traveller screening — Beitbridge", team: "FT-05", priority: "medium", status: "in_progress", due: "Ongoing", contacts: null, traced: null },
];

const GPS_CHECKINS = [
  { team: "FT-01", member: "J. Moyo", time: "08:15", location: "Budiriro 5, -17.8341, 30.9671", activity: "Contact tracing" },
  { team: "FT-01", member: "A. Chikwanha", time: "08:22", location: "Budiriro 5, -17.8345, 30.9668", activity: "Water sampling" },
  { team: "FT-02", member: "T. Ndlovu", time: "09:01", location: "Zengeza 4, -18.0124, 31.0755", activity: "Case investigation" },
  { team: "FT-03", member: "P. Chirwa", time: "07:45", location: "Chipinge Ward 12, -20.1876, 32.6234", activity: "IRS spraying" },
  { team: "FT-05", member: "R. Dube", time: "06:30", location: "Beitbridge Border, -22.2175, 30.0001", activity: "Traveller screening" },
];

export function FieldOperationsTab() {
  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Teams Deployed", value: "4/5", icon: Users },
          { label: "Active Tasks", value: "7", icon: ClipboardList },
          { label: "Contacts Traced Today", value: "21", icon: Target },
          { label: "GPS Check-ins Today", value: "38", icon: Navigation },
          { label: "Data Forms Submitted", value: "14", icon: Radio },
        ].map((kpi, i) => (
          <Card key={i}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <kpi.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold">{kpi.value}</p>
                <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="teams" className="space-y-3">
        <TabsList>
          <TabsTrigger value="teams">Field Teams</TabsTrigger>
          <TabsTrigger value="tasks">Task Board</TabsTrigger>
          <TabsTrigger value="tracking">GPS Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="teams">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Field Team Roster & Deployment</CardTitle>
                <Button size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" /> Deploy Team</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team ID</TableHead>
                    <TableHead>Team Name</TableHead>
                    <TableHead>Lead</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {FIELD_TEAMS.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs">{t.id}</TableCell>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell>{t.lead}</TableCell>
                      <TableCell>{t.members}</TableCell>
                      <TableCell>
                        <Badge className={t.status === "deployed" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}>
                          {t.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="flex items-center gap-1"><MapPin className="h-3 w-3 text-muted-foreground" />{t.location}</TableCell>
                      <TableCell>
                        {t.status === "deployed" ? (
                          <div className="flex items-center gap-2">
                            <Progress value={(t.tasksComplete / (t.tasksComplete + t.tasksPending)) * 100} className="h-2 w-16" />
                            <span className="text-xs text-muted-foreground">{t.tasksComplete}/{t.tasksComplete + t.tasksPending}</span>
                          </div>
                        ) : "—"}
                      </TableCell>
                      <TableCell><Button variant="outline" size="sm" className="h-7 text-xs">Manage</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Field Task Assignment Board</CardTitle>
                <Button size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" /> Assign Task</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task ID</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {FIELD_TASKS.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs">{t.id}</TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">{t.task}</TableCell>
                      <TableCell className="text-xs">{t.team}</TableCell>
                      <TableCell>
                        <Badge className={
                          t.priority === "critical" ? "bg-destructive/10 text-destructive" :
                          t.priority === "high" ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"
                        }>{t.priority}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">{t.status.replace(/_/g, " ")}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{t.due}</TableCell>
                      <TableCell>
                        {t.contacts !== null ? (
                          <span className="text-xs">{t.traced}/{t.contacts} traced</span>
                        ) : "—"}
                      </TableCell>
                      <TableCell><Button variant="ghost" size="sm" className="h-7 text-xs">Update</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracking">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><Navigation className="h-4 w-4" /> GPS Check-in Log</CardTitle>
              <CardDescription>Real-time field worker location and activity tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {GPS_CHECKINS.map((c, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs font-mono">{c.team}</TableCell>
                      <TableCell className="font-medium">{c.member}</TableCell>
                      <TableCell className="text-xs">{c.time}</TableCell>
                      <TableCell className="text-xs font-mono">{c.location}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{c.activity}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
