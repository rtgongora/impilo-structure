/**
 * Client Duplicate Queue
 * Review and resolve suspected duplicate client records
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { 
  GitMerge, 
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { useClientDuplicates } from '@/hooks/useClientRegistryData';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ClientDuplicateQueue() {
  const { duplicates, loading, resolveAsDuplicate, resolveAsNotDuplicate } = useClientDuplicates();
  const [selectedDuplicate, setSelectedDuplicate] = useState<string | null>(null);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolveNotes, setResolveNotes] = useState('');

  const handleResolveNotDuplicate = async () => {
    if (selectedDuplicate) {
      await resolveAsNotDuplicate(selectedDuplicate, resolveNotes);
      setShowResolveDialog(false);
      setResolveNotes('');
      setSelectedDuplicate(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Suspected Duplicates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (duplicates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitMerge className="h-5 w-5" />
            Duplicate Review Queue
          </CardTitle>
          <CardDescription>Review and resolve suspected duplicate records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-emerald-500 opacity-50" />
            <p className="text-lg font-medium">No duplicates pending review</p>
            <p className="text-sm">All suspected duplicates have been resolved</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitMerge className="h-5 w-5" />
          Duplicate Review Queue
          <Badge variant="destructive">{duplicates.length}</Badge>
        </CardTitle>
        <CardDescription>
          Review suspected duplicates and decide whether to merge or keep separate
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {duplicates.map((dup) => (
            <div key={dup.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Match Score: {dup.match_score}%
                  </Badge>
                  <Badge variant="secondary">{dup.match_method}</Badge>
                </div>
                <Badge className={
                  dup.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                  dup.status === 'reviewing' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }>
                  {dup.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Client A */}
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Client A</p>
                      <p className="text-xs font-mono text-muted-foreground">
                        {dup.client_a_id.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                </div>

                {/* Client B */}
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Client B</p>
                      <p className="text-xs font-mono text-muted-foreground">
                        {dup.client_b_id.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Match Reasons */}
              {dup.match_reasons && (
                <div className="mt-3 text-sm text-muted-foreground">
                  <p className="font-medium">Matching fields:</p>
                  <p>{JSON.stringify(dup.match_reasons)}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <Button 
                  size="sm" 
                  onClick={() => resolveAsDuplicate(dup.id, dup.client_a_id)}
                  className="gap-1"
                >
                  <GitMerge className="h-4 w-4" />
                  Merge (Keep A)
                </Button>
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => resolveAsDuplicate(dup.id, dup.client_b_id)}
                  className="gap-1"
                >
                  <GitMerge className="h-4 w-4" />
                  Merge (Keep B)
                </Button>
                <Button 
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setSelectedDuplicate(dup.id);
                    setShowResolveDialog(true);
                  }}
                  className="gap-1"
                >
                  <XCircle className="h-4 w-4" />
                  Not Duplicate
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      {/* Not Duplicate Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Not Duplicate</DialogTitle>
            <DialogDescription>
              Confirm these are different individuals. Add notes explaining why.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Explain why these are not duplicates..."
              value={resolveNotes}
              onChange={(e) => setResolveNotes(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleResolveNotDuplicate}>
              Confirm Not Duplicate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
