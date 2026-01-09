/**
 * Facility List Component
 * Displays facilities in a table with actions
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Building2, 
  MapPin, 
  MoreHorizontal,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Send,
  Trash2,
} from 'lucide-react';
import type { Facility } from '@/types/facility';
import { FACILITY_WORKFLOW_STATUS_COLORS, FACILITY_WORKFLOW_STATUS_LABELS, OPERATIONAL_STATUS_COLORS, OPERATIONAL_STATUS_LABELS } from '@/types/facility';
import { cn } from '@/lib/utils';

interface FacilityListProps {
  facilities: Facility[];
  loading: boolean;
  selectedFacility: Facility | null;
  onSelect: (facility: Facility) => void;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onSubmit: (id: string) => void;
}

export const FacilityList = ({
  facilities,
  loading,
  selectedFacility,
  onSelect,
  onApprove,
  onReject,
  onSubmit,
}: FacilityListProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Facilities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (facilities.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Facilities Found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your filters or register a new facility.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Facilities ({facilities.length})</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Facility</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Operational</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {facilities.map((facility) => (
              <TableRow 
                key={facility.id}
                className={cn(
                  "cursor-pointer hover:bg-accent/50",
                  selectedFacility?.id === facility.id && "bg-accent"
                )}
                onClick={() => onSelect(facility)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{facility.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {facility.facility_code || facility.gofr_id || 'No ID'}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{facility.facility_type || 'Unknown'}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {facility.city || facility.province || 'Unknown'}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={cn("text-xs", FACILITY_WORKFLOW_STATUS_COLORS[facility.workflow_status])}>
                    {FACILITY_WORKFLOW_STATUS_LABELS[facility.workflow_status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs", OPERATIONAL_STATUS_COLORS[facility.operational_status])}
                  >
                    {OPERATIONAL_STATUS_LABELS[facility.operational_status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelect(facility); }}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {facility.workflow_status === 'draft' && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSubmit(facility.id); }}>
                          <Send className="h-4 w-4 mr-2" />
                          Submit for Approval
                        </DropdownMenuItem>
                      )}
                      {facility.workflow_status === 'pending_approval' && (
                        <>
                          <DropdownMenuItem 
                            onClick={(e) => { e.stopPropagation(); onApprove(facility.id); }}
                            className="text-emerald-600"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => { e.stopPropagation(); onReject(facility.id, 'Rejected by admin'); }}
                            className="text-destructive"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
