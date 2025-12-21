import { Clock, User, AlertTriangle, Video, Calendar, FileText, Stethoscope, ChevronRight, Bed } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type VisitType = 'in-person' | 'virtual' | 'appointment' | 'consultation' | 'referral';

export interface QueuePatient {
  id: string;
  name: string;
  mrn?: string;
  age: number;
  gender: string;
  chiefComplaint: string;
  triageLevel: 'red' | 'orange' | 'yellow' | 'green' | 'blue';
  arrivalTime: Date;
  ticketNumber: string;
  status: 'waiting' | 'called' | 'in-consultation' | 'completed' | 'discharged';
  visitType?: VisitType;
  appointmentTime?: string;
  provider?: string;
  ward?: string;
  bed?: string;
}

interface QueuePatientCardProps {
  patient: QueuePatient;
  onCall: (id: string) => void;
  onComplete: (id: string) => void;
  onOpenChart?: (id: string) => void;
  showActions?: boolean;
}

const triageConfig = {
  red: { label: 'Immediate', color: 'bg-[hsl(var(--critical))] text-white', borderColor: 'border-l-[hsl(var(--critical))]', priority: 1 },
  orange: { label: 'Emergency', color: 'bg-orange-500 text-white', borderColor: 'border-l-orange-500', priority: 2 },
  yellow: { label: 'Urgent', color: 'bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))]', borderColor: 'border-l-[hsl(var(--warning))]', priority: 3 },
  green: { label: 'Standard', color: 'bg-[hsl(var(--success))] text-white', borderColor: 'border-l-[hsl(var(--success))]', priority: 4 },
  blue: { label: 'Routine', color: 'bg-[hsl(var(--primary))] text-white', borderColor: 'border-l-[hsl(var(--primary))]', priority: 5 },
};

const visitTypeConfig: Record<VisitType, { icon: React.ElementType; label: string }> = {
  'in-person': { icon: User, label: 'In Person' },
  'virtual': { icon: Video, label: 'Virtual' },
  'appointment': { icon: Calendar, label: 'Appointment' },
  'consultation': { icon: Stethoscope, label: 'Consult' },
  'referral': { icon: FileText, label: 'Referral' },
};

export function QueuePatientCard({ patient, onCall, onComplete, onOpenChart, showActions = true }: QueuePatientCardProps) {
  const triage = triageConfig[patient.triageLevel];
  const waitTime = Math.floor((new Date().getTime() - patient.arrivalTime.getTime()) / 60000);
  const visitType = visitTypeConfig[patient.visitType || 'in-person'];
  const VisitIcon = visitType.icon;

  const getStatusBadge = () => {
    switch (patient.status) {
      case 'waiting':
        return <Badge variant="outline" className="text-xs">Waiting</Badge>;
      case 'called':
        return <Badge variant="outline" className="text-xs animate-pulse border-[hsl(var(--warning))] text-[hsl(var(--warning))]">Called</Badge>;
      case 'in-consultation':
        return <Badge className="text-xs bg-[hsl(var(--primary))]">In Progress</Badge>;
      case 'completed':
        return <Badge className="text-xs bg-[hsl(var(--success))]">Attended</Badge>;
      case 'discharged':
        return <Badge variant="secondary" className="text-xs">Discharged</Badge>;
    }
  };

  return (
    <Card className={cn(
      "p-3 border-l-4 transition-all hover:shadow-md cursor-pointer",
      triage.borderColor,
      patient.triageLevel === 'red' && "critical-pulse"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-mono text-xs text-muted-foreground">{patient.ticketNumber}</span>
            <Badge className={cn("text-xs", triage.color)}>{triage.label}</Badge>
            {patient.visitType && patient.visitType !== 'in-person' && (
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <VisitIcon className="h-3 w-3" />
                {visitType.label}
              </Badge>
            )}
            {getStatusBadge()}
          </div>

          {/* Patient info */}
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-medium truncate">{patient.name}</span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{patient.age}y {patient.gender}</span>
          </div>

          {/* MRN & Location */}
          {(patient.mrn || patient.ward) && (
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              {patient.mrn && <span>{patient.mrn}</span>}
              {patient.ward && patient.bed && (
                <span className="flex items-center gap-1">
                  <Bed className="h-3 w-3" />
                  {patient.ward} • {patient.bed}
                </span>
              )}
            </div>
          )}

          {/* Chief complaint */}
          <p className="text-sm text-muted-foreground mt-1 truncate">{patient.chiefComplaint}</p>

          {/* Time info */}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Wait: {waitTime} min</span>
              {waitTime > 60 && <AlertTriangle className="h-3 w-3 text-orange-500" />}
            </div>
            {patient.appointmentTime && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{patient.appointmentTime}</span>
              </div>
            )}
            {patient.provider && (
              <span className="text-xs">Dr. {patient.provider}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {onOpenChart && (
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={(e) => { e.stopPropagation(); onOpenChart(patient.id); }}
              className="h-8 w-8 p-0"
            >
              <FileText className="h-4 w-4" />
            </Button>
          )}
          {showActions && patient.status === 'waiting' && (
            <Button size="sm" onClick={(e) => { e.stopPropagation(); onCall(patient.id); }}>
              Attend
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
          {showActions && (patient.status === 'called' || patient.status === 'in-consultation') && (
            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onComplete(patient.id); }}>
              Complete
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
