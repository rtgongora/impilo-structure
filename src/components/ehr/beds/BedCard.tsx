import { User, Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface BedData {
  id: string;
  bedNumber: string;
  wardId: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance' | 'cleaning';
  patient?: {
    id: string;
    name: string;
    mrn: string;
    admissionDate: Date;
    diagnosis: string;
    attendingPhysician: string;
    acuityLevel: 'critical' | 'high' | 'medium' | 'low';
  };
  reservedFor?: string;
  reservedUntil?: Date;
}

interface BedCardProps {
  bed: BedData;
  compact?: boolean;
  onClick?: (bed: BedData) => void;
}

const statusConfig = {
  available: { label: 'Available', color: 'bg-green-500', textColor: 'text-green-700 dark:text-green-400' },
  occupied: { label: 'Occupied', color: 'bg-blue-500', textColor: 'text-blue-700 dark:text-blue-400' },
  reserved: { label: 'Reserved', color: 'bg-yellow-500', textColor: 'text-yellow-700 dark:text-yellow-400' },
  maintenance: { label: 'Maintenance', color: 'bg-red-500', textColor: 'text-red-700 dark:text-red-400' },
  cleaning: { label: 'Cleaning', color: 'bg-purple-500', textColor: 'text-purple-700 dark:text-purple-400' },
};

const acuityConfig = {
  critical: { label: 'Critical', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  low: { label: 'Low', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
};

export function BedCard({ bed, compact = false, onClick }: BedCardProps) {
  const status = statusConfig[bed.status];
  const daysAdmitted = bed.patient 
    ? Math.floor((new Date().getTime() - bed.patient.admissionDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  if (compact) {
    return (
      <button
        onClick={() => onClick?.(bed)}
        className={cn(
          "w-full aspect-square rounded-lg border-2 flex flex-col items-center justify-center gap-1 transition-all hover:scale-105",
          bed.status === 'available' && "border-green-500 bg-green-50 dark:bg-green-900/20 hover:bg-green-100",
          bed.status === 'occupied' && "border-blue-500 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100",
          bed.status === 'reserved' && "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100",
          bed.status === 'maintenance' && "border-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100",
          bed.status === 'cleaning' && "border-purple-500 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100",
        )}
      >
        <span className="font-bold text-sm">{bed.bedNumber}</span>
        {bed.patient && (
          <span className="text-xs text-muted-foreground truncate max-w-full px-1">
            {bed.patient.name.split(' ')[0]}
          </span>
        )}
        <span className={cn("w-2 h-2 rounded-full", status.color)} />
      </button>
    );
  }

  return (
    <button
      onClick={() => onClick?.(bed)}
      className={cn(
        "w-full p-3 rounded-lg border-2 text-left transition-all hover:shadow-md",
        bed.status === 'available' && "border-green-500 bg-green-50/50 dark:bg-green-900/10",
        bed.status === 'occupied' && "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10",
        bed.status === 'reserved' && "border-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10",
        bed.status === 'maintenance' && "border-red-500 bg-red-50/50 dark:bg-red-900/10",
        bed.status === 'cleaning' && "border-purple-500 bg-purple-50/50 dark:bg-purple-900/10",
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold">{bed.bedNumber}</span>
        <Badge variant="outline" className={status.textColor}>{status.label}</Badge>
      </div>
      
      {bed.patient ? (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm truncate">{bed.patient.name}</span>
          </div>
          <p className="text-xs text-muted-foreground">{bed.patient.mrn}</p>
          <p className="text-xs text-muted-foreground truncate">{bed.patient.diagnosis}</p>
          <div className="flex items-center justify-between mt-2">
            <Badge className={acuityConfig[bed.patient.acuityLevel].color}>
              {acuityConfig[bed.patient.acuityLevel].label}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {daysAdmitted}d
            </div>
          </div>
        </div>
      ) : bed.status === 'reserved' ? (
        <div className="text-sm text-muted-foreground">
          <p>Reserved for: {bed.reservedFor}</p>
        </div>
      ) : bed.status === 'maintenance' || bed.status === 'cleaning' ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4" />
          <span>Temporarily unavailable</span>
        </div>
      ) : null}
    </button>
  );
}
