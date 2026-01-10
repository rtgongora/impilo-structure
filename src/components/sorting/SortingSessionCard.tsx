import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  User, 
  AlertTriangle,
  Siren,
  Calendar,
  ArrowRightLeft,
  Footprints,
  HelpCircle
} from "lucide-react";
import { SortingSession, TRIAGE_URGENCY_CONFIG, ARRIVAL_MODE_LABELS } from "@/types/sorting";
import { formatDistanceToNow } from "date-fns";

interface SortingSessionCardProps {
  session: SortingSession;
  onClick: () => void;
}

const ArrivalIcon = ({ mode }: { mode: string }) => {
  switch (mode) {
    case 'walk_in': return <Footprints className="h-4 w-4" />;
    case 'appointment': return <Calendar className="h-4 w-4" />;
    case 'referral': return <ArrowRightLeft className="h-4 w-4" />;
    case 'emergency': return <Siren className="h-4 w-4" />;
    default: return <User className="h-4 w-4" />;
  }
};

export function SortingSessionCard({ session, onClick }: SortingSessionCardProps) {
  const waitTime = formatDistanceToNow(new Date(session.arrival_time), { addSuffix: false });
  const triageConfig = session.triage_category ? TRIAGE_URGENCY_CONFIG[session.triage_category] : null;
  
  const patientName = session.patient 
    ? `${session.patient.first_name} ${session.patient.last_name}`
    : session.temp_identity_id 
      ? 'Temporary ID' 
      : 'Unidentified';

  const patientIdentifier = session.patient?.mrn || session.health_id || session.session_number;

  return (
    <Card 
      className={`cursor-pointer hover:shadow-md transition-shadow ${
        triageConfig ? `border-l-4 ${triageConfig.borderColor}` : 'border-l-4 border-gray-300'
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <ArrivalIcon mode={session.arrival_mode} />
              <span className="font-medium">{patientName}</span>
              {session.identity_status === 'temporary' && (
                <Badge variant="outline" className="text-orange-600 text-xs">TEMP</Badge>
              )}
              {session.identity_status === 'unknown' && (
                <Badge variant="outline" className="text-gray-500 text-xs">
                  <HelpCircle className="h-3 w-3 mr-1" />
                  ID Pending
                </Badge>
              )}
            </div>
            
            <div className="text-sm text-muted-foreground mb-2">
              {patientIdentifier}
            </div>

            {session.presenting_complaint && (
              <p className="text-sm line-clamp-1 mb-2">
                {session.presenting_complaint}
              </p>
            )}

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {waitTime} waiting
              </span>
              <Badge variant="secondary" className="text-xs">
                {ARRIVAL_MODE_LABELS[session.arrival_mode]?.label || session.arrival_mode}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            {triageConfig ? (
              <Badge className={`${triageConfig.bgColor} ${triageConfig.color} border-0`}>
                {triageConfig.label}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-gray-500">
                Not Triaged
              </Badge>
            )}

            {session.escalated && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Escalated
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
