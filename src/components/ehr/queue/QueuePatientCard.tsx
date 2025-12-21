import { Clock, User, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface QueuePatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  chiefComplaint: string;
  triageLevel: 'red' | 'orange' | 'yellow' | 'green' | 'blue';
  arrivalTime: Date;
  ticketNumber: string;
  status: 'waiting' | 'called' | 'in-consultation' | 'completed';
}

interface QueuePatientCardProps {
  patient: QueuePatient;
  onCall: (id: string) => void;
  onComplete: (id: string) => void;
  showActions?: boolean;
}

const triageConfig = {
  red: { label: 'Immediate', color: 'bg-red-500 text-white', priority: 1 },
  orange: { label: 'Very Urgent', color: 'bg-orange-500 text-white', priority: 2 },
  yellow: { label: 'Urgent', color: 'bg-yellow-500 text-black', priority: 3 },
  green: { label: 'Standard', color: 'bg-green-500 text-white', priority: 4 },
  blue: { label: 'Non-Urgent', color: 'bg-blue-500 text-white', priority: 5 },
};

export function QueuePatientCard({ patient, onCall, onComplete, showActions = true }: QueuePatientCardProps) {
  const triage = triageConfig[patient.triageLevel];
  const waitTime = Math.floor((new Date().getTime() - patient.arrivalTime.getTime()) / 60000);

  return (
    <Card className={`p-3 border-l-4 ${
      patient.triageLevel === 'red' ? 'border-l-red-500' :
      patient.triageLevel === 'orange' ? 'border-l-orange-500' :
      patient.triageLevel === 'yellow' ? 'border-l-yellow-500' :
      patient.triageLevel === 'green' ? 'border-l-green-500' :
      'border-l-blue-500'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-muted-foreground">{patient.ticketNumber}</span>
            <Badge className={`${triage.color} text-xs`}>{triage.label}</Badge>
            {patient.status === 'called' && (
              <Badge variant="outline" className="text-xs animate-pulse">Called</Badge>
            )}
            {patient.status === 'in-consultation' && (
              <Badge variant="secondary" className="text-xs">In Consultation</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium truncate">{patient.name}</span>
            <span className="text-xs text-muted-foreground">{patient.age}y {patient.gender}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1 truncate">{patient.chiefComplaint}</p>
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Wait: {waitTime} min</span>
            {waitTime > 60 && <AlertTriangle className="h-3 w-3 text-orange-500 ml-1" />}
          </div>
        </div>
        {showActions && patient.status === 'waiting' && (
          <Button size="sm" onClick={() => onCall(patient.id)}>Call</Button>
        )}
        {showActions && (patient.status === 'called' || patient.status === 'in-consultation') && (
          <Button size="sm" variant="outline" onClick={() => onComplete(patient.id)}>Complete</Button>
        )}
      </div>
    </Card>
  );
}
