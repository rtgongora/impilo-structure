import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { LayoutGrid, Plus, ShieldAlert } from 'lucide-react';

const TusoWorkspaces = () => {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [overrides, setOverrides] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showOverride, setShowOverride] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [newWs, setNewWs] = useState({ name: '', workspace_type_code: 'CONSULTATION' });

  useEffect(() => {
    supabase.from('tuso_facilities').select('id, name').eq('status', 'ACTIVE').order('name').then(({ data }) => setFacilities(data || []));
  }, []);

  useEffect(() => {
    if (!selectedFacilityId) return;
    supabase.from('tuso_workspaces').select('*').eq('facility_id', selectedFacilityId).order('name').then(({ data }) => setWorkspaces(data || []));
    supabase.from('tuso_workspace_overrides').select('*').eq('facility_id', selectedFacilityId).order('created_at', { ascending: false }).then(({ data }) => setOverrides(data || []));
  }, [selectedFacilityId]);

  const createWorkspace = async () => {
    const { error } = await supabase.from('tuso_workspaces').insert({ ...newWs, facility_id: selectedFacilityId, tenant_id: 'default-tenant' });
    if (error) { toast.error(error.message); return; }
    toast.success('Workspace created');
    setShowCreate(false);
    supabase.from('tuso_workspaces').select('*').eq('facility_id', selectedFacilityId).order('name').then(({ data }) => setWorkspaces(data || []));
  };

  const submitOverride = async () => {
    if (!overrideReason || !showOverride) return;
    const { error } = await supabase.from('tuso_workspace_overrides').insert({
      workspace_id: showOverride, tenant_id: 'default-tenant', facility_id: selectedFacilityId,
      actor_id: 'admin-user', actor_type: 'admin', override_reason: overrideReason, override_payload: {},
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Override logged');
    setShowOverride(null);
    setOverrideReason('');
    supabase.from('tuso_workspace_overrides').select('*').eq('facility_id', selectedFacilityId).order('created_at', { ascending: false }).then(({ data }) => setOverrides(data || []));
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-2"><LayoutGrid className="h-6 w-6" /> TUSO Workspaces</h1>
      <div className="flex gap-4">
        <Select value={selectedFacilityId} onValueChange={setSelectedFacilityId}>
          <SelectTrigger className="w-80"><SelectValue placeholder="Select facility" /></SelectTrigger>
          <SelectContent>{facilities.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
        </Select>
        {selectedFacilityId && (
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Workspace</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Workspace</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Name</Label><Input value={newWs.name} onChange={e => setNewWs(p => ({ ...p, name: e.target.value }))} /></div>
                <div><Label>Type</Label>
                  <Select value={newWs.workspace_type_code} onValueChange={v => setNewWs(p => ({ ...p, workspace_type_code: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['CONSULTATION', 'TRIAGE', 'DISPENSARY', 'NURSING_STATION', 'ADMIN'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={createWorkspace} disabled={!newWs.name} className="w-full">Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {workspaces.map(ws => (
          <Card key={ws.id}>
            <CardContent className="py-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">{ws.name}</div>
                  <div className="text-sm text-muted-foreground">{ws.workspace_type_code}</div>
                </div>
                <div className="flex gap-2">
                  <Badge variant={ws.active ? 'default' : 'secondary'}>{ws.active ? 'Active' : 'Inactive'}</Badge>
                  <Button variant="outline" size="sm" onClick={() => setShowOverride(ws.id)}>
                    <ShieldAlert className="h-4 w-4 mr-1" />Override
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {overrides.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Override Log</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overrides.map(o => (
                <div key={o.id} className="flex justify-between text-sm border-b pb-2">
                  <div><span className="font-mono">{o.actor_id}</span> — {o.override_reason}</div>
                  <span className="text-muted-foreground">{new Date(o.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!showOverride} onOpenChange={() => setShowOverride(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log Workspace Override</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Override Reason (required)</Label><Textarea value={overrideReason} onChange={e => setOverrideReason(e.target.value)} placeholder="Explain why this override is needed..." /></div>
            <Button onClick={submitOverride} disabled={!overrideReason} className="w-full">Submit Override</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TusoWorkspaces;
