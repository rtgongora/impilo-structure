import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Search, Filter } from 'lucide-react';
import { InterventionCard } from './InterventionCard';
import { CreateInterventionDialog } from './CreateInterventionDialog';
import { useAboveSiteInterventions } from '@/hooks/useAboveSiteInterventions';
import { Skeleton } from '@/components/ui/skeleton';
import type { InterventionType } from '@/types/aboveSite';
import { INTERVENTION_TYPE_LABELS } from '@/types/aboveSite';

interface InterventionsListProps {
  sessionId: string;
}

const interventionTypes: InterventionType[] = [
  'staff_redeployment',
  'coverage_approval',
  'queue_escalation',
  'virtual_pool_authorization',
  'facility_override',
  'emergency_response',
];

export function InterventionsList({ sessionId }: InterventionsListProps) {
  const {
    interventions,
    loading,
    createIntervention,
    approveIntervention,
    rejectIntervention,
    reverseIntervention,
  } = useAboveSiteInterventions(sessionId);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [reverseDialogOpen, setReverseDialogOpen] = useState(false);
  const [selectedInterventionId, setSelectedInterventionId] = useState<string | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const handleReverse = (id: string) => {
    setSelectedInterventionId(id);
    setReverseDialogOpen(true);
  };

  const confirmReverse = async () => {
    if (selectedInterventionId && reversalReason) {
      await reverseIntervention(selectedInterventionId, reversalReason);
      setReverseDialogOpen(false);
      setSelectedInterventionId(null);
      setReversalReason('');
    }
  };

  const filteredInterventions = interventions.filter((i) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !i.title.toLowerCase().includes(query) &&
        !i.reason.toLowerCase().includes(query) &&
        !(i.description?.toLowerCase().includes(query))
      ) {
        return false;
      }
    }

    // Type filter
    if (typeFilter !== 'all' && i.intervention_type !== typeFilter) {
      return false;
    }

    // Status filter
    if (statusFilter === 'pending' && i.is_approved !== null) return false;
    if (statusFilter === 'approved' && i.is_approved !== true) return false;
    if (statusFilter === 'rejected' && i.is_approved !== false) return false;
    if (statusFilter === 'reversed' && !i.reversed_at) return false;

    return true;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search interventions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {interventionTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {INTERVENTION_TYPE_LABELS[type].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="reversed">Reversed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Intervention
        </Button>
      </div>

      {/* List */}
      {filteredInterventions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No interventions found</p>
          <Button
            variant="link"
            className="mt-2"
            onClick={() => setCreateDialogOpen(true)}
          >
            Create your first intervention
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredInterventions.map((intervention) => (
            <InterventionCard
              key={intervention.id}
              intervention={intervention}
              onApprove={approveIntervention}
              onReject={rejectIntervention}
              onReverse={handleReverse}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <CreateInterventionDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        sessionId={sessionId}
        onSubmit={createIntervention}
      />

      {/* Reverse Dialog */}
      <Dialog open={reverseDialogOpen} onOpenChange={setReverseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reverse Intervention</DialogTitle>
            <DialogDescription>
              Please provide a reason for reversing this intervention. This action will be logged.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reversalReason">Reason for Reversal *</Label>
            <Textarea
              id="reversalReason"
              value={reversalReason}
              onChange={(e) => setReversalReason(e.target.value)}
              placeholder="Explain why this intervention needs to be reversed..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReverseDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReverse}
              disabled={!reversalReason.trim()}
            >
              Confirm Reversal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
