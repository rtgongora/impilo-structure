/**
 * ScheduledAppointmentSession - Pre-booked teleconsultation appointments
 * For managing scheduled video/audio appointments with waiting room
 */
import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Clock,
  Video,
  Phone,
  User,
  Building,
  CheckCircle,
  AlertCircle,
  Play,
  Bell,
  FileText,
  MessageSquare,
  ArrowLeft,
  RefreshCw,
  Loader2,
  Timer,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, differenceInMinutes, differenceInSeconds, isPast, addMinutes } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ReferralPackage, TelemedicineMode } from "@/types/telehealth";
import { ReferralPackageViewer } from "../ReferralPackageViewer";

interface ScheduledAppointmentSessionProps {
  referral: ReferralPackage;
  sessionId: string;
  scheduledAt: string;
  appointmentMode: TelemedicineMode;
  onStartSession: (mode: TelemedicineMode) => void;
  onReschedule?: () => void;
  onCancel?: () => void;
  onBack: () => void;
}

type AppointmentState = 'upcoming' | 'waiting_room' | 'ready' | 'started' | 'no_show' | 'completed';

interface WaitingRoomParticipant {
  id: string;
  name: string;
  role: string;
  facility: string;
  joinedAt: string;
  isReady: boolean;
}

export function ScheduledAppointmentSession({
  referral,
  sessionId,
  scheduledAt,
  appointmentMode,
  onStartSession,
  onReschedule,
  onCancel,
  onBack,
}: ScheduledAppointmentSessionProps) {
  const [appointmentState, setAppointmentState] = useState<AppointmentState>('upcoming');
  const [countdown, setCountdown] = useState({ minutes: 0, seconds: 0 });
  const [waitingParticipants, setWaitingParticipants] = useState<WaitingRoomParticipant[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const scheduledTime = new Date(scheduledAt);
  const waitingRoomOpensAt = addMinutes(scheduledTime, -15); // 15 min before

  // Update countdown and state
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diffMinutes = differenceInMinutes(scheduledTime, now);
      const diffSeconds = differenceInSeconds(scheduledTime, now) % 60;

      setCountdown({ minutes: Math.max(0, diffMinutes), seconds: Math.max(0, diffSeconds) });

      // State transitions
      if (appointmentState === 'upcoming' && now >= waitingRoomOpensAt) {
        setAppointmentState('waiting_room');
        toast.info("Waiting room is now open");
      }
      
      if (appointmentState === 'waiting_room' && isPast(scheduledTime)) {
        if (waitingParticipants.length > 0 && waitingParticipants.every((p) => p.isReady)) {
          setAppointmentState('ready');
        }
      }

      // No-show after 15 minutes past scheduled time
      if (isPast(addMinutes(scheduledTime, 15)) && appointmentState === 'waiting_room') {
        setAppointmentState('no_show');
        toast.warning("Appointment marked as no-show");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [appointmentState, scheduledTime, waitingRoomOpensAt, waitingParticipants]);

  // Simulate participants joining
  useEffect(() => {
    if (appointmentState === 'waiting_room') {
      const timer = setTimeout(() => {
        setWaitingParticipants([
          {
            id: referral.context.referringProviderId,
            name: referral.context.referringProviderName,
            role: "Referring Clinician",
            facility: referral.context.referringFacilityName,
            joinedAt: new Date().toISOString(),
            isReady: false,
          },
        ]);
      }, 3000);

      const readyTimer = setTimeout(() => {
        setWaitingParticipants((prev) =>
          prev.map((p) => ({ ...p, isReady: true }))
        );
      }, 8000);

      return () => {
        clearTimeout(timer);
        clearTimeout(readyTimer);
      };
    }
  }, [appointmentState, referral]);

  const handleJoinWaitingRoom = () => {
    setIsReady(true);
    toast.success("You've joined the waiting room");
  };

  const handleStartSession = useCallback(() => {
    setAppointmentState('started');
    onStartSession(appointmentMode);
  }, [appointmentMode, onStartSession]);

  const renderAppointmentState = () => {
    switch (appointmentState) {
      case 'upcoming':
        return (
          <Card className="max-w-xl mx-auto">
            <CardHeader className="text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
                <Calendar className="h-10 w-10 text-primary" />
              </div>
              <CardTitle>Scheduled Teleconsultation</CardTitle>
              <CardDescription>
                Your appointment is coming up
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Countdown */}
              <div className="text-center p-6 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Starts in</p>
                <div className="flex justify-center gap-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold">{Math.floor(countdown.minutes / 60)}</div>
                    <div className="text-xs text-muted-foreground">hours</div>
                  </div>
                  <div className="text-4xl font-bold">:</div>
                  <div className="text-center">
                    <div className="text-4xl font-bold">{countdown.minutes % 60}</div>
                    <div className="text-xs text-muted-foreground">minutes</div>
                  </div>
                  <div className="text-4xl font-bold">:</div>
                  <div className="text-center">
                    <div className="text-4xl font-bold">{countdown.seconds}</div>
                    <div className="text-xs text-muted-foreground">seconds</div>
                  </div>
                </div>
              </div>

              {/* Appointment Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span>{format(scheduledTime, "EEEE, MMMM d, yyyy 'at' h:mm a")}</span>
                </div>
                <div className="flex items-center gap-3">
                  {appointmentMode === 'video' ? (
                    <Video className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Phone className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span>{appointmentMode === 'video' ? 'Video' : 'Audio'} Consultation</span>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span>{referral.context.referringProviderName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-muted-foreground" />
                  <span>{referral.context.referringFacilityName}</span>
                </div>
              </div>

              <Separator />

              {/* Waiting room info */}
              <div className="text-center text-sm text-muted-foreground">
                <Bell className="h-4 w-4 inline mr-1" />
                Waiting room opens 15 minutes before the appointment
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {onReschedule && (
                  <Button variant="outline" className="flex-1" onClick={onReschedule}>
                    Reschedule
                  </Button>
                )}
                {onCancel && (
                  <Button variant="outline" className="flex-1 text-destructive" onClick={onCancel}>
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'waiting_room':
        return (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Timer className="h-5 w-5 text-primary" />
                    Waiting Room
                  </CardTitle>
                  <CardDescription>
                    Appointment scheduled for {format(scheduledTime, "h:mm a")}
                  </CardDescription>
                </div>
                {isPast(scheduledTime) ? (
                  <Badge variant="default" className="animate-pulse">Ready to Start</Badge>
                ) : (
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    {countdown.minutes}:{countdown.seconds.toString().padStart(2, '0')}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Your Status */}
              <div className={cn(
                "p-4 rounded-lg border-2",
                isReady ? "border-success bg-success/5" : "border-muted"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>You</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">You (Consultant)</p>
                      <p className="text-sm text-muted-foreground">
                        {isReady ? "Ready to start" : "Not yet ready"}
                      </p>
                    </div>
                  </div>
                  {!isReady ? (
                    <Button onClick={handleJoinWaitingRoom}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark Ready
                    </Button>
                  ) : (
                    <Badge variant="outline" className="text-success border-success">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Ready
                    </Badge>
                  )}
                </div>
              </div>

              {/* Other Participants */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Other Participants
                </h4>
                {waitingParticipants.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p>Waiting for other participants to join...</p>
                  </div>
                ) : (
                  waitingParticipants.map((p) => (
                    <div
                      key={p.id}
                      className={cn(
                        "p-3 rounded-lg border flex items-center justify-between",
                        p.isReady && "border-success bg-success/5"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {p.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{p.name}</p>
                          <p className="text-sm text-muted-foreground">{p.role} • {p.facility}</p>
                        </div>
                      </div>
                      {p.isReady ? (
                        <Badge variant="outline" className="text-success border-success">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Ready
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          Waiting
                        </Badge>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Start button */}
              {isPast(scheduledTime) && isReady && waitingParticipants.some((p) => p.isReady) && (
                <Button className="w-full" size="lg" onClick={handleStartSession}>
                  <Play className="h-5 w-5 mr-2" />
                  Start {appointmentMode === 'video' ? 'Video' : 'Audio'} Session
                </Button>
              )}
            </CardContent>
          </Card>
        );

      case 'ready':
        return (
          <Card className="max-w-xl mx-auto">
            <CardHeader className="text-center">
              <div className="w-20 h-20 rounded-full bg-success/20 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-success" />
              </div>
              <CardTitle>All Participants Ready</CardTitle>
              <CardDescription>Everyone is ready to start the consultation</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" size="lg" onClick={handleStartSession}>
                <Play className="h-5 w-5 mr-2" />
                Start Session Now
              </Button>
            </CardContent>
          </Card>
        );

      case 'no_show':
        return (
          <Card className="max-w-xl mx-auto border-warning">
            <CardHeader className="text-center">
              <div className="w-20 h-20 rounded-full bg-warning/20 mx-auto mb-4 flex items-center justify-center">
                <AlertCircle className="h-10 w-10 text-warning" />
              </div>
              <CardTitle>Appointment No-Show</CardTitle>
              <CardDescription>
                The scheduled appointment time has passed without all participants joining
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                {onReschedule && (
                  <Button className="flex-1" onClick={onReschedule}>
                    Reschedule Appointment
                  </Button>
                )}
                <Button variant="outline" className="flex-1" onClick={onBack}>
                  Return to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Scheduled Appointment
            </h3>
            <p className="text-xs text-muted-foreground">
              {referral.patientHID} • {referral.context.specialty}
            </p>
          </div>
        </div>
        <Badge variant="outline">
          {appointmentMode === 'video' ? <Video className="h-3 w-3 mr-1" /> : <Phone className="h-3 w-3 mr-1" />}
          {appointmentMode === 'video' ? 'Video' : 'Audio'}
        </Badge>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="px-4 pt-4">
            <TabsList>
              <TabsTrigger value="overview">
                <Clock className="h-4 w-4 mr-1" />
                Appointment
              </TabsTrigger>
              <TabsTrigger value="preparation">
                <FileText className="h-4 w-4 mr-1" />
                Preparation
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="flex-1 p-4">
            {renderAppointmentState()}
          </TabsContent>

          <TabsContent value="preparation" className="flex-1 p-4 overflow-auto">
            <Card>
              <CardHeader>
                <CardTitle>Referral Package</CardTitle>
                <CardDescription>
                  Review the patient information before the appointment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReferralPackageViewer referral={referral} readOnly />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
