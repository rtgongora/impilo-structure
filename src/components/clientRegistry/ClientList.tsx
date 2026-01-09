/**
 * Client List Component
 * Displays searchable, filterable list of client records
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  User, 
  Phone, 
  Calendar,
  MapPin,
  ChevronRight,
  Fingerprint,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import type { ClientRecord } from '@/types/clientRegistry';
import { LIFECYCLE_STATE_LABELS, LIFECYCLE_STATE_COLORS } from '@/types/clientRegistry';
import { cn } from '@/lib/utils';

interface ClientListProps {
  clients: ClientRecord[];
  loading: boolean;
  onSelect: (client: ClientRecord) => void;
  selectedId?: string;
}

export function ClientList({ clients, loading, onSelect, selectedId }: ClientListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No clients found</p>
        <p className="text-sm">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[600px]">
      <div className="space-y-2">
        {clients.map((client) => (
          <div
            key={client.id}
            onClick={() => onSelect(client)}
            className={cn(
              "p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50",
              selectedId === client.id && "border-primary bg-primary/5"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">
                      {client.given_names} {client.family_name}
                    </h4>
                    {client.biometric_enrolled && (
                      <Fingerprint className="h-4 w-4 text-emerald-500" />
                    )}
                    {client.duplicate_flag && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <p className="text-sm font-mono text-muted-foreground">
                    {client.health_id}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    {client.date_of_birth && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(client.date_of_birth), 'dd MMM yyyy')}
                        {client.estimated_dob && <span className="text-xs">(est)</span>}
                      </span>
                    )}
                    {client.phone_primary && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {client.phone_primary}
                      </span>
                    )}
                    {client.province && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {client.province}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={LIFECYCLE_STATE_COLORS[client.lifecycle_state]}>
                  {LIFECYCLE_STATE_LABELS[client.lifecycle_state]}
                </Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
