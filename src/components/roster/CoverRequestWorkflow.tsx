import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HandHelping, Plus, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useRosterData, CoverRequest, ShiftDefinition } from '@/hooks/useRosterData';
import { useWorkspaceData } from '@/hooks/useWorkspaceData';
import { format, parseISO } from 'date-fns';

interface CoverRequestWorkflowProps {
  facilityId: string;
  providerId: string;
}

export function CoverRequestWorkflow({ facilityId, providerId }: CoverRequestWorkflowProps) {
  const {
    loading,
    fetchCoverRequests,
    fetchShiftDefinitions,
    createCoverRequest,
    reviewCoverRequest,
    checkIsSupervisor
  } = useRosterData();
  const { workspaces, fetchWorkspaces } = useWorkspaceData();

  const [requests, setRequests] = useState<CoverRequest[]>([]);
  const [shiftDefinitions, setShiftDefinitions] = useState<ShiftDefinition[]>([]);
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');

  // Form state
  const [coverDate, setCoverDate] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState('');
  const [selectedShift, setSelectedShift] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    loadData();
  }, [facilityId]);

  const loadData = async () => {
    const [reqs, shifts, supervisor] = await Promise.all([
      fetchCoverRequests(facilityId),
      fetchShiftDefinitions(facilityId),
      checkIsSupervisor(facilityId)
    ]);
    
    setRequests(reqs);
    setShiftDefinitions(shifts);
    setIsSupervisor(supervisor);
    
    // Fetch workspaces - this updates internal state in the hook
    await fetchWorkspaces(facilityId);
  };

  const handleCreateRequest = async () => {
    if (!coverDate || !selectedWorkspace || !reason) return;

    const request = await createCoverRequest(
      facilityId,
      providerId,
      coverDate,
      reason,
      selectedWorkspace,
      undefined,
      selectedShift || undefined
    );

    if (request) {
      setRequests(prev => [request, ...prev]);
      setShowCreateDialog(false);
      resetForm();
    }
  };

  const handleReviewRequest = async (requestId: string, approved: boolean, notes?: string) => {
    const success = await reviewCoverRequest(requestId, approved, notes);
    if (success) {
      setRequests(prev => prev.map(r =>
        r.id === requestId
          ? { ...r, status: approved ? 'approved' : 'denied' }
          : r
      ));
    }
  };

  const resetForm = () => {
    setCoverDate('');
    setSelectedWorkspace('');
    setSelectedShift('');
    setReason('');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'denied': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'expired': return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'denied': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'expired': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted';
    }
  };

  const filteredRequests = requests.filter(r => {
    if (activeTab === 'pending') return r.status === 'pending';
    if (activeTab === 'approved') return r.status === 'approved';
    if (activeTab === 'denied') return r.status === 'denied';
    return true;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cover Requests</h2>
          <p className="text-muted-foreground">
            Request temporary coverage for workspaces
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Request Cover
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Cover Shift</DialogTitle>
              <DialogDescription>
                Request temporary access to cover a workspace
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Cover Date</Label>
                <Input
                  type="date"
                  value={coverDate}
                  onChange={(e) => setCoverDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Workspace</Label>
                <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select workspace" />
                  </SelectTrigger>
                  <SelectContent>
                    {workspaces.map((ws) => (
                      <SelectItem key={ws.id} value={ws.id}>
                        {ws.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Shift (optional)</Label>
                <Select value={selectedShift} onValueChange={setSelectedShift}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select shift" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any shift</SelectItem>
                    {shiftDefinitions.map((sd) => (
                      <SelectItem key={sd.id} value={sd.id}>
                        {sd.name} ({sd.start_time} - {sd.end_time})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea
                  placeholder="Explain why you need to cover this workspace..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <Button
                onClick={handleCreateRequest}
                disabled={loading || !coverDate || !selectedWorkspace || !reason}
                className="w-full"
              >
                Submit Request
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isSupervisor && pendingCount > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <p className="font-medium">
                {pendingCount} cover request{pendingCount > 1 ? 's' : ''} pending your review
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="relative">
            Pending
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="denied">Denied</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(request.status)}
                      <div>
                        <CardTitle className="text-lg">
                          {request.workspace_name || request.pool_name || 'Unknown Workspace'}
                        </CardTitle>
                        <CardDescription>
                          {format(parseISO(request.cover_date), 'EEEE, MMMM d, yyyy')}
                          {request.start_time && request.end_time && (
                            <span> • {request.start_time} - {request.end_time}</span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={getStatusColor(request.status)}>
                      {request.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Requested by</p>
                      <p className="font-medium">{request.requester_name || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Reason</p>
                      <p>{request.reason}</p>
                    </div>
                    {request.review_notes && (
                      <div>
                        <p className="text-sm text-muted-foreground">Review Notes</p>
                        <p>{request.review_notes}</p>
                      </div>
                    )}
                    
                    {isSupervisor && request.status === 'pending' && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="default"
                          onClick={() => handleReviewRequest(request.id, true)}
                          disabled={loading}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleReviewRequest(request.id, false)}
                          disabled={loading}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Deny
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredRequests.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <HandHelping className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No {activeTab !== 'all' ? activeTab : ''} cover requests</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
