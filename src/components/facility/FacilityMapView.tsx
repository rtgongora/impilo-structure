/**
 * Facility Map View
 * Displays facilities on a map (placeholder for Leaflet/Mapbox integration)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Map, 
  MapPin, 
  ZoomIn, 
  ZoomOut, 
  Layers,
  Building2,
  ExternalLink,
} from 'lucide-react';
import type { Facility } from '@/types/facility';
import { OPERATIONAL_STATUS_COLORS, OPERATIONAL_STATUS_LABELS } from '@/types/facility';
import { cn } from '@/lib/utils';

interface FacilityMapViewProps {
  facilities: Facility[];
  onSelect: (facility: Facility) => void;
}

export const FacilityMapView = ({ facilities, onSelect }: FacilityMapViewProps) => {
  const facilitiesWithCoords = facilities.filter(f => f.latitude && f.longitude);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
      {/* Map Area */}
      <Card className="lg:col-span-2 relative">
        <CardContent className="p-0 h-full">
          {/* Map Controls */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
            <Button variant="secondary" size="icon" className="shadow-md">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="icon" className="shadow-md">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="icon" className="shadow-md">
              <Layers className="h-4 w-4" />
            </Button>
          </div>

          {/* Map Placeholder */}
          <div className="h-full bg-gradient-to-b from-blue-100 to-blue-200 dark:from-blue-950 dark:to-blue-900 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="p-4 bg-background/80 rounded-xl backdrop-blur-sm">
                <Map className="h-16 w-16 mx-auto text-primary mb-4" />
                <h3 className="text-lg font-semibold">Map View</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Interactive map showing {facilitiesWithCoords.length} facilities with coordinates.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Map integration (Leaflet/OpenStreetMap) can be added here.
                </p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm p-3 rounded-lg shadow-md">
            <p className="text-xs font-medium mb-2">Operational Status</p>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs">Operational</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-xs">Temp. Closed</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-gray-500" />
                <span className="text-xs">Closed</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Facility List */}
      <Card className="overflow-hidden flex flex-col">
        <CardHeader className="pb-2 flex-shrink-0">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Facilities ({facilitiesWithCoords.length})
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Showing facilities with GPS coordinates
          </p>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto p-2">
          {facilitiesWithCoords.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No facilities with coordinates
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {facilitiesWithCoords.map(facility => (
                <div
                  key={facility.id}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => onSelect(facility)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <div className="p-1.5 bg-muted rounded mt-0.5">
                        <Building2 className="h-3 w-3" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{facility.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {facility.city || facility.province || 'Unknown location'}
                        </p>
                        <p className="text-xs font-mono text-muted-foreground">
                          {facility.latitude?.toFixed(4)}, {facility.longitude?.toFixed(4)}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs shrink-0", OPERATIONAL_STATUS_COLORS[facility.operational_status])}
                    >
                      {OPERATIONAL_STATUS_LABELS[facility.operational_status]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
