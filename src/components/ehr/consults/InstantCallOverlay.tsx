import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  PhoneOff,
  Video,
  MessageSquare,
  User,
  Clock,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { TelemedicineMode } from "@/types/telehealth";
import type { TeleconsultStatus } from "@/hooks/useTeleconsultSession";

interface Participant {
  id: string;
  name: string;
  role: string;
  facility?: string;
  avatarUrl?: string;
}

interface InstantCallOverlayProps {
  mode: TelemedicineMode;
  status: TeleconsultStatus;
  isOutgoing: boolean;
  caller: Participant;
  callee: Participant;
  patientName?: string;
  specialty?: string;
  ringingTimeLeft?: number;
  maxRingingTime?: number;
  onAnswer?: () => void;
  onDecline?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export function InstantCallOverlay({
  mode,
  status,
  isOutgoing,
  caller,
  callee,
  patientName,
  specialty,
  ringingTimeLeft = 0,
  maxRingingTime = 60,
  onAnswer,
  onDecline,
  onCancel,
  onClose,
}: InstantCallOverlayProps) {
  const [pulseAnim, setPulseAnim] = useState(true);

  const getModeIcon = () => {
    switch (mode) {
      case "video":
        return <Video className="w-6 h-6" />;
      case "audio":
        return <Phone className="w-6 h-6" />;
      case "chat":
        return <MessageSquare className="w-6 h-6" />;
      default:
        return <Phone className="w-6 h-6" />;
    }
  };

  const getModeLabel = () => {
    switch (mode) {
      case "video":
        return "Video Call";
      case "audio":
        return "Audio Call";
      case "chat":
        return "Chat Request";
      default:
        return "Call";
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case "ringing":
        return isOutgoing ? "Calling..." : "Incoming call";
      case "accepted":
        return "Connected";
      case "declined":
        return "Call declined";
      case "missed":
        return "No answer";
      case "cancelled":
        return "Call cancelled";
      default:
        return "";
    }
  };

  const participant = isOutgoing ? callee : caller;
  const ringingProgress = (ringingTimeLeft / maxRingingTime) * 100;

  // Don't show for non-active states
  if (!["ringing", "declined", "missed", "cancelled"].includes(status)) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
        >
          <Card className="w-[400px] shadow-2xl border-2">
            <CardContent className="p-6">
              {/* Header with mode */}
              <div className="text-center mb-6">
                <div className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-full",
                  mode === "video" && "bg-primary/10 text-primary",
                  mode === "audio" && "bg-green-500/10 text-green-600",
                  mode === "chat" && "bg-blue-500/10 text-blue-600"
                )}>
                  {getModeIcon()}
                  <span className="font-medium">{getModeLabel()}</span>
                </div>
              </div>

              {/* Participant Avatar */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  <motion.div
                    animate={status === "ringing" ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <Avatar className="w-24 h-24 border-4 border-muted">
                      <AvatarImage src={participant.avatarUrl} />
                      <AvatarFallback className="text-2xl bg-primary/10">
                        {participant.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>
                  {status === "ringing" && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-primary/30"
                      animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    />
                  )}
                </div>
                <h3 className="text-xl font-semibold mt-4">{participant.name}</h3>
                <p className="text-muted-foreground">{participant.role}</p>
                {participant.facility && (
                  <p className="text-sm text-muted-foreground">{participant.facility}</p>
                )}
              </div>

              {/* Status Message */}
              <div className="text-center mb-4">
                <Badge
                  variant={
                    status === "ringing" ? "default" :
                    status === "accepted" ? "default" :
                    "destructive"
                  }
                  className={cn(
                    "text-sm py-1",
                    status === "ringing" && "animate-pulse"
                  )}
                >
                  {getStatusMessage()}
                </Badge>
              </div>

              {/* Patient Context */}
              {patientName && (
                <div className="bg-muted/50 rounded-lg p-3 mb-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Regarding patient
                  </p>
                  <p className="font-medium">{patientName}</p>
                  {specialty && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      {specialty}
                    </Badge>
                  )}
                </div>
              )}

              {/* Ringing Timer */}
              {status === "ringing" && (
                <div className="mb-6">
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {isOutgoing ? "Waiting for answer" : "Ringing"}
                    </span>
                    <span>{ringingTimeLeft}s</span>
                  </div>
                  <Progress value={ringingProgress} className="h-1" />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center">
                {status === "ringing" && !isOutgoing && (
                  <>
                    <Button
                      size="lg"
                      variant="destructive"
                      onClick={onDecline}
                      className="flex-1 gap-2"
                    >
                      <PhoneOff className="w-5 h-5" />
                      Decline
                    </Button>
                    <Button
                      size="lg"
                      onClick={onAnswer}
                      className={cn(
                        "flex-1 gap-2",
                        mode === "video" && "bg-primary hover:bg-primary/90",
                        mode === "audio" && "bg-green-600 hover:bg-green-700",
                        mode === "chat" && "bg-blue-600 hover:bg-blue-700"
                      )}
                    >
                      {getModeIcon()}
                      Answer
                    </Button>
                  </>
                )}

                {status === "ringing" && isOutgoing && (
                  <Button
                    size="lg"
                    variant="destructive"
                    onClick={onCancel}
                    className="gap-2"
                  >
                    <PhoneOff className="w-5 h-5" />
                    Cancel Call
                  </Button>
                )}

                {["declined", "missed", "cancelled"].includes(status) && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={onClose}
                    className="gap-2"
                  >
                    <X className="w-5 h-5" />
                    Close
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
