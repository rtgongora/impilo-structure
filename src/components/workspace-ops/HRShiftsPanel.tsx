import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Users, Clock, Calendar, UserCheck, UserX, Coffee,
  AlertTriangle, ArrowRightLeft, FileText, Shield, Sun, Moon, Sunrise
} from "lucide-react";
import { toast } from "sonner";

type HRTab = 'roster' | 'shifts' | 'leave' | 'handover';

const STAFF_ROSTER = [
  { id: '1', name: 'Dr. T. Nkomo', role: 'doctor', department: 'Emergency', status: 'on_shift', shiftType: 'day', hours: '07:00-19:00', overtime: false },
  { id: '2', name: 'Sr. P. Moyo', role: 'nurse', department: 'Medical Ward', status: 'on_shift', shiftType: 'day', hours: '07:00-19:00', overtime: false },
  { id: '3', name: 'Dr. A. Sibanda', role: 'specialist', department: 'ICU', status: 'on_shift', shiftType: 'day', hours: '08:00-17:00', overtime: true },
  { id: '4', name: 'N. Dube', role: 'nurse', department: 'Surgical Ward', status: 'on_break', shiftType: 'day', hours: '07:00-19:00', overtime: false },
  { id: '5', name: 'Dr. K. Mhlanga', role: 'doctor', department: 'Pediatrics', status: 'on_shift', shiftType: 'day', hours: '08:00-20:00', overtime: false },
  { id: '6', name: 'T. Ncube', role: 'pharmacist', department: 'Pharmacy', status: 'on_shift', shiftType: 'day', hours: '08:00-17:00', overtime: false },
  { id: '7', name: 'J. Maposa', role: 'lab_tech', department: 'Laboratory', status: 'off_shift', shiftType: 'night', hours: '19:00-07:00', overtime: false },
  { id: '8', name: 'Dr. R. Zulu', role: 'doctor', department: 'Emergency', status: 'off_shift', shiftType: 'night', hours: '19:00-07:00', overtime: false },
];

const ACTIVE_SHIFTS = [
  { id: 'SH-001', type: 'Day Shift', time: '07:00 – 19:00', staffCount: 18, coverage: 95, departments: ['Emergency', 'Medical', 'Surgical', 'ICU'] },
  { id: 'SH-002', type: 'Night Shift', time: '19:00 – 07:00', staffCount: 12, coverage: 85, departments: ['Emergency', 'Medical', 'ICU'] },
  { id: 'SH-003', type: 'Admin Shift', time: '08:00 – 17:00', staffCount: 6, coverage: 100, departments: ['Admin', 'Finance', 'HR'] },
];

const LEAVE_REQUESTS = [
  { id: 'LV-001', name: 'Dr. M. Chikwanda', type: 'Annual Leave', from: '2026-04-10', to: '2026-04-17', days: 5, status: 'pending', department: 'Surgical' },
  { id: 'LV-002', name: 'Sr. L. Banda', type: 'Sick Leave', from: '2026-04-06', to: '2026-04-08', days: 2, status: 'approved', department: 'Maternity' },
  { id: 'LV-003', name: 'T. Phiri', type: 'Study Leave', from: '2026-04-14', to: '2026-04-18', days: 5, status: 'pending', department: 'Laboratory' },
];

const PENDING_HANDOVERS = [
  { id: 'HO-001', from: 'Dr. T. Nkomo', to: 'Dr. R. Zulu', department: 'Emergency', patients: 8, criticalNotes: 2, dueAt: '18:30' },
  { id: 'HO-002', from: 'Sr. P. Moyo', to: 'N. Tshabalala', department: 'Medical Ward', patients: 12, criticalNotes: 1, dueAt: '18:45' },
];

function getStaffStatusBadge(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    on_shift: { label: 'On Shift', color: 'bg-green-500' },
    off_shift: { label: 'Off Shift', color: 'bg-gray-400' },
    on_break: { label: 'On Break', color: 'bg-amber-500' },
    on_leave: { label: 'On Leave', color: 'bg-blue-400' },
  };
  const cfg = map[status] || { label: status, color: 'bg-gray-400' };
  return (
    <div className="flex items-center gap-1.5">
      <div className={`h-2 w-2 rounded-full ${cfg.color}`} />
      <span className="text-xs text-muted-foreground">{cfg.label}</span>
    </div>
  );
}

function getRoleColor(role: string) {
  const map: Record<string, string> = {
    doctor: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    specialist: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
    nurse: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
    pharmacist: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    lab_tech: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  };
  return map[role] || 'bg-gray-100 text-gray-700';
}

export function HRShiftsPanel() {
  const [activeTab, setActiveTab] = useState<HRTab>('roster');
  const onShift = STAFF_ROSTER.filter(s => s.status === 'on_shift').length;
  const onBreak = STAFF_ROSTER.filter(s => s.status === 'on_break').length;
  const overtime = STAFF_ROSTER.filter(s => s.overtime).length;

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-3 pb-2 px-3">
          <div className="flex items-center gap-2"><UserCheck className="h-4 w-4 text-green-500" /><span className="text-xs text-muted-foreground">On Shift</span></div>
          <p className="text-lg font-bold">{onShift}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 pb-2 px-3">
          <div className="flex items-center gap-2"><Coffee className="h-4 w-4 text-amber-500" /><span className="text-xs text-muted-foreground">On Break</span></div>
          <p className="text-lg font-bold">{onBreak}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 pb-2 px-3">
          <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-red-500" /><span className="text-xs text-muted-foreground">Overtime</span></div>
          <p className="text-lg font-bold text-red-600">{overtime}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 pb-2 px-3">
          <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-blue-500" /><span className="text-xs text-muted-foreground">Leave Pending</span></div>
          <p className="text-lg font-bold">{LEAVE_REQUESTS.filter(l => l.status === 'pending').length}</p>
        </CardContent></Card>
      </div>

      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as HRTab)}>
        <TabsList>
          <TabsTrigger value="roster" className="gap-1.5 text-xs"><Users className="h-3.5 w-3.5" />Staff Roster</TabsTrigger>
          <TabsTrigger value="shifts" className="gap-1.5 text-xs"><Clock className="h-3.5 w-3.5" />Active Shifts</TabsTrigger>
          <TabsTrigger value="leave" className="gap-1.5 text-xs"><Calendar className="h-3.5 w-3.5" />Leave</TabsTrigger>
          <TabsTrigger value="handover" className="gap-1.5 text-xs"><ArrowRightLeft className="h-3.5 w-3.5" />Handover
            {PENDING_HANDOVERS.length > 0 && <Badge variant="secondary" className="text-[10px] h-4 px-1 ml-1">{PENDING_HANDOVERS.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roster" className="mt-3">
          <ScrollArea className="h-[420px]">
            <div className="space-y-1">
              {STAFF_ROSTER.map(staff => (
                <div key={staff.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className={`text-xs ${getRoleColor(staff.role)}`}>
                        {staff.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{staff.name}</p>
                      <p className="text-xs text-muted-foreground">{staff.department} • {staff.hours}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {staff.overtime && <Badge variant="destructive" className="text-[10px]">OT</Badge>}
                    <Badge variant="outline" className="text-[10px] capitalize">{staff.role.replace('_', ' ')}</Badge>
                    {getStaffStatusBadge(staff.status)}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="shifts" className="mt-3">
          <div className="space-y-3">
            {ACTIVE_SHIFTS.map(shift => {
              const ShiftIcon = shift.type.includes('Night') ? Moon : shift.type.includes('Admin') ? FileText : Sun;
              return (
                <Card key={shift.id}>
                  <CardContent className="py-4 px-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <ShiftIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold text-sm">{shift.type}</span>
                        <span className="text-xs text-muted-foreground">{shift.time}</span>
                      </div>
                      <Badge variant={shift.coverage >= 90 ? 'default' : 'secondary'}>{shift.coverage}% coverage</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <span>{shift.staffCount} staff</span>
                      <span>{shift.departments.join(', ')}</span>
                    </div>
                    <Progress value={shift.coverage} className={`h-1.5 ${shift.coverage < 85 ? '[&>div]:bg-amber-500' : '[&>div]:bg-green-500'}`} />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="leave" className="mt-3">
          <ScrollArea className="h-[420px]">
            <div className="space-y-2">
              {LEAVE_REQUESTS.map(req => (
                <Card key={req.id}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{req.name}</p>
                        <p className="text-xs text-muted-foreground">{req.type} • {req.department}</p>
                        <p className="text-xs text-muted-foreground">{req.from} → {req.to} ({req.days} days)</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={req.status === 'approved' ? 'default' : 'secondary'} className="capitalize text-xs">{req.status}</Badge>
                        {req.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toast.success(`${req.name} leave approved`)}>Approve</Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500" onClick={() => toast.info(`${req.name} leave declined`)}>Decline</Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="handover" className="mt-3">
          <div className="space-y-3">
            {PENDING_HANDOVERS.map(ho => (
              <Card key={ho.id} className="border-l-4 border-l-amber-500">
                <CardContent className="py-4 px-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold">{ho.department} Handover</p>
                      <p className="text-xs text-muted-foreground">{ho.from} → {ho.to}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">Due {ho.dueAt}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{ho.patients} patients</span>
                    {ho.criticalNotes > 0 && (
                      <span className="text-red-500 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />{ho.criticalNotes} critical note{ho.criticalNotes > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" className="h-7 text-xs gap-1"><FileText className="h-3 w-3" />View Notes</Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => toast.success(`Handover ${ho.id} completed`)}>
                      <Shield className="h-3 w-3" />Complete Handover
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {PENDING_HANDOVERS.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">No pending handovers</div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
