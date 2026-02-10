import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, GitMerge, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function VitoMergeQueue() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [survivorId, setSurvivorId] = useState('');
  const [mergedIds, setMergedIds] = useState('');
  const [reason, setReason] = useState('');

  const { data: config } = useQuery({
    queryKey: ['vito-config'],
    queryFn: async () => {
      const { data } = await supabase.from('vito_config').select('*').eq('tenant_id', 'default-tenant');
      const c: Record<string, string> = {};
      for (const r of data || []) c[r.config_key] = r.config_value;
      return c;
    },
  });

  const { data: merges, isLoading } = useQuery({
    queryKey: ['vito-merges'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vito_merge_requests').select('*').order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });

  const spineStatus = config?.spine_status || 'UNKNOWN';
  const spineOnline = spineStatus === 'ONLINE';

  const createMerge = useMutation({
    mutationFn: async () => {
      if (!spineOnline) throw new Error(`Merge blocked: spine_status=${spineStatus}. Federation authority required.`);
      const ids = mergedIds.split(',').map(s => s.trim()).filter(Boolean);
      const { error } = await supabase.from('vito_merge_requests').insert({
        tenant_id: 'default-tenant',
        survivor_health_id: survivorId,
        merged_health_ids: ids,
        requested_by: 'admin',
        reason,
        status: 'approved',
        reviewed_by: 'admin',
        reviewed_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Merge request created');
      qc.invalidateQueries({ queryKey: ['vito-merges'] });
      setCreateOpen(false);
      setSurvivorId(''); setMergedIds(''); setReason('');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">VITO Merge Queue</h1>
          <p className="text-sm text-muted-foreground">Federation-guarded patient merge requests</p>
        </div>
      </div>

      <Card className={!spineOnline ? 'border-destructive' : ''}>
        <CardContent className="pt-4 flex items-center gap-3">
          {!spineOnline && <AlertTriangle className="h-5 w-5 text-destructive" />}
          <span className="text-sm font-medium">Spine Status:</span>
          <Badge variant={spineOnline ? 'default' : 'destructive'}>{spineStatus}</Badge>
          {!spineOnline && <span className="text-xs text-destructive">Merges blocked — federation authority unavailable</span>}
          <span className="text-sm font-medium ml-4">Emit Mode:</span>
          <Badge variant="outline">{config?.emit_mode || '?'}</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Merge Requests</CardTitle>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={!spineOnline}><GitMerge className="h-4 w-4 mr-1" /> New Merge</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Merge Request</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Survivor Health ID</Label><Input value={survivorId} onChange={e => setSurvivorId(e.target.value)} /></div>
                <div><Label>Merged Health IDs (comma-separated)</Label><Input value={mergedIds} onChange={e => setMergedIds(e.target.value)} placeholder="HID-002, HID-003" /></div>
                <div><Label>Reason</Label><Textarea value={reason} onChange={e => setReason(e.target.value)} /></div>
                <Button onClick={() => createMerge.mutate()} disabled={!survivorId || !mergedIds || !reason || createMerge.isPending} className="w-full">
                  {createMerge.isPending ? 'Submitting...' : 'Submit Merge'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Survivor</TableHead>
                <TableHead>Merged IDs</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center">Loading...</TableCell></TableRow>
              ) : merges?.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No merge requests</TableCell></TableRow>
              ) : merges?.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-xs">{m.survivor_health_id}</TableCell>
                  <TableCell className="font-mono text-xs">{(m.merged_health_ids as string[])?.join(', ')}</TableCell>
                  <TableCell><Badge variant={m.status === 'approved' ? 'default' : 'secondary'}>{m.status}</Badge></TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">{m.reason}</TableCell>
                  <TableCell className="text-xs">{m.requested_by}</TableCell>
                  <TableCell className="text-xs">{new Date(m.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
