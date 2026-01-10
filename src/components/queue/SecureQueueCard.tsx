/**
 * Secure Queue Card
 * 
 * Privacy-preserving patient card for queue displays.
 * Implements PII masking with reveal-on-demand for authorized users.
 * 
 * Standards:
 * - HIPAA Minimum Necessary Principle
 * - Joint Commission Patient Identification (NPSG.01.01.01)
 */

import { useState } from "react";
import { 
  Clock, 
  User, 
  AlertTriangle, 
  Video, 
  Calendar, 
  FileText, 
  ChevronRight, 
  Bed,
  Eye,
  EyeOff,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { 
  usePIIProtection, 
  maskName, 
  maskMRN 
} from "@/hooks/usePIIProtection";

export type VisitType = 'in-person' | 'virtual' | 'appointment' | 'consultation' | 'referral';
export type CareContext = 'inpatient' | 'outpatient' | 'emergency';

export interface SecureQueuePatient {
  id: string;
  name: string;
  mrn?: string;
  age?: number;
  gender?: string;
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
  careContext?: CareContext;
}

interface SecureQueueCardProps {
  patient: SecureQueuePatient;
  onAttend: (id: string) => void;
  onComplete: (id: string) => void;
  onOpenSecureChart: (id: string) => void;
  showActions?: boolean;
}

const triageConfig = {
  red: { label: 'Immediate', color: 'bg-[hsl(var(--critical))] text-white', borderColor: 'border-l-[hsl(var(--critical))]' },
  orange: { label: 'Emergency', color: 'bg-orange-500 text-white', borderColor: 'border-l-orange-500' },
  yellow: { label: 'Urgent', color: 'bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))]', borderColor: 'border-l-[hsl(var(--warning))]' },
  green: { label: 'Standard', color: 'bg-[hsl(var(--success))] text-white', borderColor: 'border-l-[hsl(var(--success))]' },
  blue: { label: 'Routine', color: 'bg-[hsl(var(--primary))] text-white', borderColor: 'border-l-[hsl(var(--primary))]' },
};

const visitTypeConfig: Record<VisitType, { icon: React.ElementType; label: string }> = {
  'in-person': { icon: User, label: 'In Person' },
  'virtual': { icon: Video, label: 'Virtual' },
  'appointment': { icon: Calendar, label: 'Appointment' },
  'consultation': { icon: FileText, label: 'Consult' },
  'referral': { icon: FileText, label: 'Referral' },
};

export function SecureQueueCard({ 
  patient, 
  onAttend, 
  onComplete, 
  onOpenSecureChart,
  showActions = true 
}: SecureQueueCardProps) {
  const { 
    isPatientRevealed, 
    revealPatientPII, 
    hidePatientPII,
    getPatientMaskLevel,
  } = usePIIProtection();
  
  const [isRevealing, setIsRevealing] = useState(false);
  
  const isRevealed = isPatientRevealed(patient.id);
  const maskLevel = getPatientMaskLevel(patient.id);
  
  const triage = triageConfig[patient.triageLevel];
  const waitTime = Math.floor((new Date().getTime() - patient.arrivalTime.getTime()) / 60000);
  const visitType = visitTypeConfig[patient.visitType || 'in-person'];
  const VisitIcon = visitType.icon;

  // Apply masking
  const displayName = isRevealed ? patient.name : maskName(patient.name, maskLevel);
  const displayMRN = patient.mrn 
    ? (isRevealed ? patient.mrn : maskMRN(patient.mrn, maskLevel))
    : undefined;

  const handleRevealToggle = () => {
    if (isRevealed) {
      hidePatientPII(patient.id);
    } else {
      setIsRevealing(true);
      // Simulated authorization check
      setTimeout(() => {
        revealPatientPII(patient.id);
        setIsRevealing(false);
      }, 300);
    }
  };

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
    <TooltipProvider>
      <Card className={cn(
        "p-3 border-l-4 transition-all hover:shadow-md",
        triage.borderColor,
        patient.triageLevel === 'red' && "critical-pulse",
        !isRevealed && "bg-muted/30" // Visual indicator that PII is masked
      )}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Header row with privacy indicator */}
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
              
              {/* Privacy indicator */}
              {!isRevealed && (
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      Protected
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>PII is masked. Click reveal to show full details.</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Patient info - masked/revealed */}
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className={cn(
                "font-medium truncate",
                !isRevealed && "font-mono text-muted-foreground"
              )}>
                {displayName}
              </span>
              {patient.age && patient.gender && (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {patient.age}y {patient.gender}
                </span>
              )}
            </div>

            {/* MRN & Location */}
            {(displayMRN || patient.ward) && (
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                {displayMRN && (
                  <span className={cn(!isRevealed && "font-mono")}>{displayMRN}</span>
                )}
                {patient.ward && patient.bed && (
                  <span className="flex items-center gap-1">
                    <Bed className="h-3 w-3" />
                    {patient.ward} • {patient.bed}
                  </span>
                )}
              </div>
            )}

            {/* Chief complaint - always visible for clinical context */}
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
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {/* Reveal/Hide toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRevealToggle}
                  disabled={isRevealing}
                  className="h-8 w-8 p-0"
                >
                  {isRevealed ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isRevealed ? "Hide PII" : "Reveal PII (logged)"}
              </TooltipContent>
            </Tooltip>

            <div className="flex items-center gap-2">
              {/* Secure chart access */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={(e) => { e.stopPropagation(); onOpenSecureChart(patient.id); }}
                    className="h-8 w-8 p-0"
                  >
                    <ShieldCheck className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Open Chart (Secure Access)</p>
                </TooltipContent>
              </Tooltip>

              {showActions && patient.status === 'waiting' && (
                <Button size="sm" onClick={(e) => { e.stopPropagation(); onAttend(patient.id); }}>
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
        </div>
      </Card>
    </TooltipProvider>
  );
}
