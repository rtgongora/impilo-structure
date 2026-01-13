import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarCheck,
  UserCheck,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Users,
  RefreshCw,
  Phone,
  Play,
} from "lucide-react";
import { format, parseISO, differenceInMinutes } from "date-fns";
import { useQueueAppointments, type AppointmentViewFilter, type QueueAppointment } from "@/hooks/useQueueAppointments";
import { toast } from "sonner";

interface QueueAppointmentsPanelProps {
  queueId?: string;
  queueName?: string;
  onCheckIn?: (appointmentId: string, queueId: string) => void;
  onAttend?: (appointmentId: string) => void;
}

export function QueueAppointmentsPanel({
  queueId,
  queueName,
  onCheckIn,
  onAttend,
}: QueueAppointmentsPanelProps) {
  const [filter, setFilter] = useState<AppointmentViewFilter>("today");
  const [activeTab, setActiveTab] = useState("expected");

  const {
    appointments,
    counts,
    loading,
    refetch,
    checkInAppointment,
    markFollowUpNeeded,
    completeAppointment,
  } = useQueueAppointments(queueId, filter);

  const handleCheckIn = async (appointment: QueueAppointment) => {
    if (!queueId) {
      toast.error("No queue selected");
      return;
    }
    try {
      await checkInAppointment(appointment.id, queueId);
      toast.success(`${appointment.patient?.first_name} checked in`);
      onCheckIn?.(appointment.id, queueId);
    } catch (error) {
      toast.error("Failed to check in patient");
    }
  };

  // Categorize appointments
  const expected = appointments.filter(
    (a) => ["scheduled", "confirmed"].includes(a.status) && !a.checked_in_at
  );
  const checkedIn = appointments.filter(
    (a) => a.checked_in_at && !["completed", "no-show"].includes(a.status)
  );
  const attended = appointments.filter((a) => a.status === "completed");
  const noShow = appointments.filter((a) => a.status === "no-show");
  const followUp = appointments.filter((a) => a.follow_up_needed);

  const renderAppointmentCard = (apt: QueueAppointment, showActions: string[] = []) => {
    const scheduledTime = parseISO(apt.scheduled_start);
    const now = new Date();
    const minutesUntil = differenceInMinutes(scheduledTime, now);
    const isOverdue = minutesUntil < 0 && !apt.checked_in_at;

    return (
      <Card key={apt.id} className={`${isOverdue ? "border-warning" : ""}`}>
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">
                  {apt.patient?.first_name} {apt.patient?.last_name}
                </span>
                {apt.priority === "urgent" && (
                  <Badge variant="destructive" className="text-xs">Urgent</Badge>
                )}
                {isOverdue && (
                  <Badge variant="outline" className="text-warning border-warning text-xs">
                    Overdue
                  </Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {apt.patient?.mrn} • {apt.appointment_type}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {format(scheduledTime, "HH:mm")}
                {apt.booking_reference && (
                  <>
                    <span>•</span>
                    <code className="bg-muted px-1 rounded">{apt.booking_reference}</code>
                  </>
                )}
              </div>
              {apt.reason && (
                <p className="text-xs text-muted-foreground mt-1 truncate">{apt.reason}</p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              {showActions.includes("checkin") && (
                <Button size="sm" onClick={() => handleCheckIn(apt)}>
                  <UserCheck className="h-3 w-3 mr-1" />
                  Check In
                </Button>
              )}
              {showActions.includes("attend") && (
                <Button size="sm" variant="default" onClick={() => onAttend?.(apt.id)}>
                  <Play className="h-3 w-3 mr-1" />
                  Attend
                </Button>
              )}
              {showActions.includes("call") && apt.patient && (
                <Button size="sm" variant="outline">
                  <Phone className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!queueId) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <CalendarCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Select a queue to view appointments</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{queueName} - Appointments</h3>
          <p className="text-sm text-muted-foreground">
            {counts.expected} expected • {counts.checkedIn} checked in • {counts.attended} attended
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(v) => setFilter(v as AppointmentViewFilter)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5">
          <TabsTrigger value="expected" className="text-xs">
            <CalendarCheck className="h-3 w-3 mr-1" />
            Expected
            {counts.expected > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{counts.expected}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="checkedin" className="text-xs">
            <UserCheck className="h-3 w-3 mr-1" />
            Arrived
            {counts.checkedIn > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{counts.checkedIn}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="attended" className="text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            Attended
            {counts.attended > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{counts.attended}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="noshow" className="text-xs">
            <XCircle className="h-3 w-3 mr-1" />
            No Show
            {counts.noShow > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs">{counts.noShow}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="followup" className="text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Follow-up
            {counts.followUp > 0 && (
              <Badge variant="outline" className="ml-1 text-xs border-warning text-warning">
                {counts.followUp}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expected" className="mt-4">
          <ScrollArea className="h-[400px]">
            <div className="space-y-2 pr-4">
              {expected.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No patients expected</p>
                  </CardContent>
                </Card>
              ) : (
                expected.map((apt) => renderAppointmentCard(apt, ["checkin", "call"]))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="checkedin" className="mt-4">
          <ScrollArea className="h-[400px]">
            <div className="space-y-2 pr-4">
              {checkedIn.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No patients checked in</p>
                  </CardContent>
                </Card>
              ) : (
                checkedIn.map((apt) => renderAppointmentCard(apt, ["attend"]))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="attended" className="mt-4">
          <ScrollArea className="h-[400px]">
            <div className="space-y-2 pr-4">
              {attended.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No patients attended yet</p>
                  </CardContent>
                </Card>
              ) : (
                attended.map((apt) => renderAppointmentCard(apt, []))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="noshow" className="mt-4">
          <ScrollArea className="h-[400px]">
            <div className="space-y-2 pr-4">
              {noShow.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <XCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No missed appointments</p>
                  </CardContent>
                </Card>
              ) : (
                noShow.map((apt) => renderAppointmentCard(apt, ["call"]))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="followup" className="mt-4">
          <ScrollArea className="h-[400px]">
            <div className="space-y-2 pr-4">
              {followUp.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No follow-ups needed</p>
                  </CardContent>
                </Card>
              ) : (
                followUp.map((apt) => (
                  <Card key={apt.id}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">
                            {apt.patient?.first_name} {apt.patient?.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {apt.patient?.mrn}
                          </div>
                          {apt.follow_up_reason && (
                            <p className="text-sm text-warning mt-1">{apt.follow_up_reason}</p>
                          )}
                        </div>
                        <Button size="sm" variant="outline">
                          <Phone className="h-3 w-3 mr-1" />
                          Contact
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
