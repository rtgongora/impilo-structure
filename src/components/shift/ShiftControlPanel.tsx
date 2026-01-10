import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  PlayCircle, 
  StopCircle, 
  RefreshCw,
  MapPin,
  Building2,
  AlertTriangle,
  FileText,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useShift } from '@/contexts/ShiftContext';
import { useWorkspaceData, type WorkspaceTransferReason, type UserWorkspace } from '@/hooks/useWorkspaceData';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ShiftControlPanelProps {
  className?: string;
  compact?: boolean;
}

export function ShiftControlPanel({ className, compact }: ShiftControlPanelProps) {
  const { 
    activeShift, 
    isOnShift, 
    shiftDuration, 
    actionLoading,
    endShift,
    transferWorkspace
  } = useShift();
  const { myWorkspaces } = useWorkspaceData();

  const [endShiftDialogOpen, setEndShiftDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [handoverNotes, setHandoverNotes] = useState('');
  const [shiftSummary, setShiftSummary] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');
  const [transferReason, setTransferReason] = useState<WorkspaceTransferReason>('rotation');
  const [transferNotes, setTransferNotes] = useState('');

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  const handleEndShift = async () => {
    const success = await endShift(handoverNotes, shiftSummary);
    if (success) {
      setEndShiftDialogOpen(false);
      setHandoverNotes('');
      setShiftSummary('');
    }
  };

  const handleTransfer = async () => {
    if (!selectedWorkspace) return;
    const success = await transferWorkspace(selectedWorkspace, transferReason, transferNotes);
    if (success) {
      setTransferDialogOpen(false);
      setSelectedWorkspace('');
      setTransferNotes('');
    }
  };

  if (!isOnShift) {
    return null;
  }

  const availableWorkspaces = myWorkspaces.filter(
    w => w.workspace_id !== activeShift?.current_workspace_id
  );

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Badge variant="outline" className="gap-1.5 py-1">
          <Clock className="h-3 w-3" />
          <span>{formatDuration(shiftDuration)}</span>
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => setTransferDialogOpen(true)}
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Transfer
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-destructive hover:text-destructive"
          onClick={() => setEndShiftDialogOpen(true)}
        >
          <StopCircle className="h-3 w-3 mr-1" />
          End
        </Button>

        {/* End Shift Dialog */}
        <EndShiftDialog
          open={endShiftDialogOpen}
          onOpenChange={setEndShiftDialogOpen}
          handoverNotes={handoverNotes}
          onHandoverNotesChange={setHandoverNotes}
          shiftSummary={shiftSummary}
          onShiftSummaryChange={setShiftSummary}
          onConfirm={handleEndShift}
          loading={actionLoading}
          duration={shiftDuration}
        />

        {/* Transfer Dialog */}
        <TransferWorkspaceDialog
          open={transferDialogOpen}
          onOpenChange={setTransferDialogOpen}
          workspaces={availableWorkspaces}
          selectedWorkspace={selectedWorkspace}
          onWorkspaceChange={setSelectedWorkspace}
          reason={transferReason}
          onReasonChange={setTransferReason}
          notes={transferNotes}
          onNotesChange={setTransferNotes}
          onConfirm={handleTransfer}
          loading={actionLoading}
        />
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <PlayCircle className="h-4 w-4 text-green-500" />
              Active Shift
            </CardTitle>
            <CardDescription>
              Started at {activeShift ? format(new Date(activeShift.started_at), 'HH:mm') : '--:--'}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-lg font-mono">
            {formatDuration(shiftDuration)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Location */}
        <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
          <MapPin className="h-4 w-4 text-primary mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Current Workspace</p>
            <p className="font-medium">{activeShift?.current_workspace_name || 'Not assigned'}</p>
            <p className="text-sm text-muted-foreground">{activeShift?.facility_name}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setTransferDialogOpen(true)}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Transfer
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => setEndShiftDialogOpen(true)}
          >
            <StopCircle className="h-4 w-4 mr-2" />
            End Shift
          </Button>
        </div>
      </CardContent>

      {/* End Shift Dialog */}
      <EndShiftDialog
        open={endShiftDialogOpen}
        onOpenChange={setEndShiftDialogOpen}
        handoverNotes={handoverNotes}
        onHandoverNotesChange={setHandoverNotes}
        shiftSummary={shiftSummary}
        onShiftSummaryChange={setShiftSummary}
        onConfirm={handleEndShift}
        loading={actionLoading}
        duration={shiftDuration}
      />

      {/* Transfer Dialog */}
      <TransferWorkspaceDialog
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        workspaces={availableWorkspaces}
        selectedWorkspace={selectedWorkspace}
        onWorkspaceChange={setSelectedWorkspace}
        reason={transferReason}
        onReasonChange={setTransferReason}
        notes={transferNotes}
        onNotesChange={setTransferNotes}
        onConfirm={handleTransfer}
        loading={actionLoading}
      />
    </Card>
  );
}

// End Shift Dialog Component
function EndShiftDialog({
  open,
  onOpenChange,
  handoverNotes,
  onHandoverNotesChange,
  shiftSummary,
  onShiftSummaryChange,
  onConfirm,
  loading,
  duration
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  handoverNotes: string;
  onHandoverNotesChange: (notes: string) => void;
  shiftSummary: string;
  onShiftSummaryChange: (summary: string) => void;
  onConfirm: () => void;
  loading: boolean;
  duration: number;
}) {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StopCircle className="h-5 w-5 text-destructive" />
            End Shift
          </DialogTitle>
          <DialogDescription>
            You've been on shift for <strong>{formatDuration(duration)}</strong>. 
            Add any handover notes before ending.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="handover">Handover Notes</Label>
            <Textarea
              id="handover"
              placeholder="Notes for the incoming shift..."
              value={handoverNotes}
              onChange={(e) => onHandoverNotesChange(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="summary">Shift Summary (Optional)</Label>
            <Textarea
              id="summary"
              placeholder="Brief summary of your shift..."
              value={shiftSummary}
              onChange={(e) => onShiftSummaryChange(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Ending...' : 'End Shift'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Transfer Workspace Dialog Component
function TransferWorkspaceDialog({
  open,
  onOpenChange,
  workspaces,
  selectedWorkspace,
  onWorkspaceChange,
  reason,
  onReasonChange,
  notes,
  onNotesChange,
  onConfirm,
  loading
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaces: UserWorkspace[];
  selectedWorkspace: string;
  onWorkspaceChange: (id: string) => void;
  reason: WorkspaceTransferReason;
  onReasonChange: (reason: WorkspaceTransferReason) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  const transferReasons: { value: WorkspaceTransferReason; label: string }[] = [
    { value: 'rotation', label: 'Scheduled Rotation' },
    { value: 'cover', label: 'Covering for Colleague' },
    { value: 'emergency', label: 'Emergency Response' },
    { value: 'break', label: 'Break / Return' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Transfer Workspace
          </DialogTitle>
          <DialogDescription>
            Move to a different workspace while keeping your shift active.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>New Workspace</Label>
            <Select value={selectedWorkspace} onValueChange={onWorkspaceChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a workspace" />
              </SelectTrigger>
              <SelectContent>
                {workspaces.map((ws) => (
                  <SelectItem key={ws.workspace_id} value={ws.workspace_id}>
                    <div className="flex flex-col">
                      <span>{ws.workspace_name}</span>
                      <span className="text-xs text-muted-foreground">{ws.facility_name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Reason for Transfer</Label>
            <Select value={reason} onValueChange={(v) => onReasonChange(v as WorkspaceTransferReason)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {transferReasons.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transfer-notes">Notes (Optional)</Label>
            <Textarea
              id="transfer-notes"
              placeholder="Any additional notes..."
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={loading || !selectedWorkspace}
          >
            {loading ? 'Transferring...' : 'Transfer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ShiftControlPanel;
