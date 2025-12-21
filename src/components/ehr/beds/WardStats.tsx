import { Bed, Users, AlertCircle, Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { BedData } from "./BedCard";

interface WardStatsProps {
  beds: BedData[];
  wardName: string;
}

export function WardStats({ beds, wardName }: WardStatsProps) {
  const total = beds.length;
  const available = beds.filter(b => b.status === 'available').length;
  const occupied = beds.filter(b => b.status === 'occupied').length;
  const reserved = beds.filter(b => b.status === 'reserved').length;
  const unavailable = beds.filter(b => b.status === 'maintenance' || b.status === 'cleaning').length;
  
  const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;
  const criticalPatients = beds.filter(b => b.patient?.acuityLevel === 'critical').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{wardName}</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Occupancy</span>
          <span className="font-bold">{occupancyRate}%</span>
        </div>
      </div>
      
      <Progress value={occupancyRate} className="h-2" />
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-green-100 dark:bg-green-900/30">
                <Bed className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xl font-bold">{available}</p>
                <p className="text-xs text-muted-foreground">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-blue-100 dark:bg-blue-900/30">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xl font-bold">{occupied}</p>
                <p className="text-xs text-muted-foreground">Occupied</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-yellow-100 dark:bg-yellow-900/30">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-xl font-bold">{reserved}</p>
                <p className="text-xs text-muted-foreground">Reserved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-red-100 dark:bg-red-900/30">
                <Wrench className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xl font-bold">{unavailable}</p>
                <p className="text-xs text-muted-foreground">Unavailable</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {criticalPatients > 0 && (
        <div className="flex items-center gap-2 p-2 rounded bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">{criticalPatients} critical patient{criticalPatients > 1 ? 's' : ''} in ward</span>
        </div>
      )}
    </div>
  );
}
