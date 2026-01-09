/**
 * Client Merge History Panel
 * Displays history of merged client records
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  GitMerge, 
  History,
  Undo2,
  User,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { useClientMergeHistory } from '@/hooks/useClientRegistryData';

export function ClientMergeHistory() {
  const { history, loading } = useClientMergeHistory();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Merge History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Merge History
        </CardTitle>
        <CardDescription>
          Record of all identity merges and potential un-merge operations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <GitMerge className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No merge operations recorded</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {history.map((merge) => (
                <div key={merge.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      {/* Merged Client */}
                      <div className="text-center">
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                          <User className="h-5 w-5 text-red-600" />
                        </div>
                        <p className="text-xs mt-1 font-mono text-muted-foreground">
                          {merge.merged_client_health_id.slice(0, 15)}...
                        </p>
                        <Badge variant="secondary" className="text-xs mt-1">Merged</Badge>
                      </div>

                      <ArrowRight className="h-5 w-5 text-muted-foreground" />

                      {/* Surviving Client */}
                      <div className="text-center">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                          <User className="h-5 w-5 text-emerald-600" />
                        </div>
                        <p className="text-xs mt-1 font-mono text-muted-foreground">
                          {merge.surviving_client_id.slice(0, 8)}...
                        </p>
                        <Badge className="bg-emerald-100 text-emerald-800 text-xs mt-1">Surviving</Badge>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(new Date(merge.merged_at), 'dd MMM yyyy HH:mm')}
                      </div>
                      <Badge variant="outline" className="mt-1">
                        {merge.merge_method || 'manual'}
                      </Badge>
                    </div>
                  </div>

                  {merge.merge_reason && (
                    <p className="text-sm text-muted-foreground mt-3 border-t pt-3">
                      <strong>Reason:</strong> {merge.merge_reason}
                    </p>
                  )}

                  {/* Transferred Data Summary */}
                  <div className="flex gap-4 mt-3 text-sm">
                    {merge.identifiers_transferred && (
                      <span className="text-muted-foreground">
                        {Array.isArray(merge.identifiers_transferred) ? merge.identifiers_transferred.length : 0} identifiers transferred
                      </span>
                    )}
                    {merge.relationships_transferred && (
                      <span className="text-muted-foreground">
                        {Array.isArray(merge.relationships_transferred) ? merge.relationships_transferred.length : 0} relationships transferred
                      </span>
                    )}
                  </div>

                  {/* Un-merge Option */}
                  {merge.can_unmerge && !merge.unmerged_at && (
                    <div className="mt-3 pt-3 border-t">
                      <Button variant="outline" size="sm" className="gap-1">
                        <Undo2 className="h-4 w-4" />
                        Request Un-merge
                      </Button>
                    </div>
                  )}

                  {merge.unmerged_at && (
                    <div className="mt-3 pt-3 border-t">
                      <Badge variant="outline" className="text-amber-600">
                        Un-merged on {format(new Date(merge.unmerged_at), 'dd MMM yyyy')}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
