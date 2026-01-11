import { useEffect, useState } from "react";
import {
  Clock,
  CheckCircle,
  XCircle,
  Phone,
  Video,
  MessageSquare,
  Loader2,
  AlertTriangle,
  Bell,
  User,
  Building,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import type { TeleconsultStatus, TeleconsultSessionData } from "@/hooks/useTeleconsultSession";
import type { TelemedicineMode } from "@/types/telehealth";

interface TeleconsultStatusTrackerProps {
  session: TeleconsultSessionData;
  userRole: "referrer" | "consultant";
  onRetry?: () => void;
  onJoinSession?: () => void;
  onViewResponse?: () => void;
}

export function TeleconsultStatusTracker({
  session,
  userRole,
  onRetry,
  onJoinSession,
  onViewResponse,
}: TeleconsultStatusTrackerProps) {
  const [elapsedTime, setElapsedTime] = useState("");

  useEffect(() => {
    const updateElapsed = () => {
      if (session.createdAt) {
        setElapsedTime(formatDistanceToNow(new Date(session.createdAt), { addSuffix: true }));
      }
    };
    
    updateElapsed();
    const interval = setInterval(updateElapsed, 30000);
    return () => clearInterval(interval);
  }, [session.createdAt]);

  const getModeIcon = (mode: TelemedicineMode) => {
    switch (mode) {
      case "video":
        return <Video className="w-4 h-4" />;
      case "audio":
        return <Phone className="w-4 h-4" />;
      case "chat":
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusConfig = (status: TeleconsultStatus) => {
    switch (status) {
      case "pending":
        return {
          icon: <Clock className="w-5 h-5" />,
          label: "Awaiting Acceptance",
          description: userRole === "referrer"
            ? "Your request has been sent. Waiting for the consultant to accept."
            : "A new teleconsult request requires your attention.",
          color: "text-yellow-600 bg-yellow-50 border-yellow-200",
          badgeVariant: "secondary" as const,
        };
      case "ringing":
        return {
          icon: <Bell className="w-5 h-5 animate-pulse" />,
          label: "Calling...",
          description: userRole === "referrer"
            ? "Ringing the consultant. Please wait for them to answer."
            : "Incoming call! Answer now to connect.",
          color: "text-blue-600 bg-blue-50 border-blue-200",
          badgeVariant: "default" as const,
        };
      case "accepted":
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          label: "Accepted",
          description: "The teleconsult has been accepted. Ready to start session.",
          color: "text-green-600 bg-green-50 border-green-200",
          badgeVariant: "default" as const,
        };
      case "in_progress":
        return {
          icon: <Loader2 className="w-5 h-5 animate-spin" />,
          label: "In Progress",
          description: "Teleconsult session is currently active.",
          color: "text-primary bg-primary/10 border-primary/20",
          badgeVariant: "default" as const,
        };
      case "completed":
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          label: "Completed",
          description: "The teleconsult has been completed. Response is available.",
          color: "text-green-600 bg-green-50 border-green-200",
          badgeVariant: "default" as const,
        };
      case "declined":
        return {
          icon: <XCircle className="w-5 h-5" />,
          label: "Declined",
          description: "The teleconsult request was declined by the consultant.",
          color: "text-destructive bg-destructive/10 border-destructive/20",
          badgeVariant: "destructive" as const,
        };
      case "missed":
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          label: "No Answer",
          description: "The call was not answered. Try again or send a scheduled request.",
          color: "text-orange-600 bg-orange-50 border-orange-200",
          badgeVariant: "secondary" as const,
        };
      case "cancelled":
        return {
          icon: <XCircle className="w-5 h-5" />,
          label: "Cancelled",
          description: "The teleconsult request was cancelled.",
          color: "text-muted-foreground bg-muted border-muted",
          badgeVariant: "outline" as const,
        };
      default:
        return {
          icon: <Clock className="w-5 h-5" />,
          label: "Unknown",
          description: "",
          color: "text-muted-foreground bg-muted",
          badgeVariant: "outline" as const,
        };
    }
  };

  const statusConfig = getStatusConfig(session.status);

  return (
    <Card className={cn("border-2", statusConfig.color)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-full", statusConfig.color)}>
              {statusConfig.icon}
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {statusConfig.label}
                <Badge variant={statusConfig.badgeVariant} className="text-xs">
                  {getModeIcon(session.mode)}
                  <span className="ml-1 capitalize">{session.mode}</span>
                </Badge>
              </CardTitle>
              <CardDescription>{statusConfig.description}</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {session.urgency.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Timeline */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Created {elapsedTime}</span>
          </div>
          {session.scheduledAt && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Scheduled: {format(new Date(session.scheduledAt), "PPp")}</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Participants */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">
              {userRole === "referrer" ? "You (Referrer)" : "Referring Practitioner"}
            </p>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                {session.referringProviderId ? "Provider" : "Unknown"}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">
              {userRole === "consultant" ? "You (Consultant)" : "Consulting Practitioner"}
            </p>
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                {session.targetName || session.specialty || "Pending assignment"}
              </span>
            </div>
          </div>
        </div>

        {/* Reason */}
        {session.reasonForConsult && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Reason for Consult</p>
            <p className="text-sm">{session.reasonForConsult}</p>
          </div>
        )}

        {/* Actions based on status */}
        <div className="flex gap-2 pt-2">
          {["declined", "missed", "cancelled"].includes(session.status) && onRetry && (
            <Button onClick={onRetry} className="flex-1">
              <Phone className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          
          {session.status === "accepted" && onJoinSession && (
            <Button onClick={onJoinSession} className="flex-1">
              {getModeIcon(session.mode)}
              <span className="ml-2">Join Session</span>
            </Button>
          )}
          
          {session.status === "completed" && onViewResponse && (
            <Button variant="outline" onClick={onViewResponse} className="flex-1">
              View Consultation Response
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
