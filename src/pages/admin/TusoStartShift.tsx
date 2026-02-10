import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Play, CheckCircle } from 'lucide-react';

const TusoStartShift = () => {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [selectedWorkspaces, setSelectedWorkspaces] = useState<string[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    supabase.from('tuso_facilities').select('id, name').eq('status', 'ACTIVE').order('name').then(({ data }) => setFacilities(data || []));
  }, []);

  useEffect(() => {
    if (!selectedFacilityId) return;
    supabase.from('tuso_workspaces').select('*').eq('facility_id', selectedFacilityId).eq('active', true).order('name').then(({ data }) => setWorkspaces(data || []));
    supabase.from('tuso_shifts').select('*').eq('facility_id', selectedFacilityId).eq('status', 'ACTIVE').order('started_at', { ascending: false }).then(({ data }) => setShifts(data || []));
  }, [selectedFacilityId]);

  const startShift = async () => {
    const { data: shift, error } = await supabase.from('tuso_shifts').insert({
      tenant_id: 'default-tenant', facility_id: selectedFacilityId, actor_id: 'current-user', status: 'ACTIVE',
    }).select().single();
    if (error) { toast.error(error.message); return; }
    if (selectedWorkspaces.length) {
      await supabase.from('tuso_shift_workspace_assignments').insert(
        selectedWorkspaces.map(wid => ({ shift_id: shift.id, workspace_id: wid }))
      );
    }
    toast.success('Shift started');
    setStarted(true);
    supabase.from('tuso_shifts').select('*').eq('facility_id', selectedFacilityId).eq('status', 'ACTIVE').order('started_at', { ascending: false }).then(({ data }) => setShifts(data || []));
  };

  const toggleWorkspace = (id: string) => {
    setSelectedWorkspaces(prev => prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-2"><Play className="h-6 w-6" /> Start Shift</h1>

      <Select value={selectedFacilityId} onValueChange={v => { setSelectedFacilityId(v); setStarted(false); setSelectedWorkspaces([]); }}>
        <SelectTrigger className="w-80"><SelectValue placeholder="Select facility" /></SelectTrigger>
        <SelectContent>{facilities.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
      </Select>

      {selectedFacilityId && (
        <Card>
          <CardHeader><CardTitle>Select Workspaces</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {workspaces.map(ws => (
              <div key={ws.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted">
                <Checkbox checked={selectedWorkspaces.includes(ws.id)} onCheckedChange={() => toggleWorkspace(ws.id)} />
                <div className="flex-1">
                  <div className="font-medium">{ws.name}</div>
                  <div className="text-sm text-muted-foreground">{ws.workspace_type_code}</div>
                </div>
              </div>
            ))}
            {workspaces.length === 0 && <p className="text-muted-foreground">No workspaces configured</p>}
            <Button onClick={startShift} disabled={started || selectedWorkspaces.length === 0} className="w-full mt-4">
              {started ? <><CheckCircle className="h-4 w-4 mr-2" />Shift Active</> : <><Play className="h-4 w-4 mr-2" />Start Shift</>}
            </Button>
          </CardContent>
        </Card>
      )}

      {shifts.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Active Shifts</CardTitle></CardHeader>
          <CardContent>
            {shifts.map(s => (
              <div key={s.id} className="flex justify-between py-2 border-b">
                <span className="font-mono text-sm">{s.actor_id}</span>
                <span className="text-sm text-muted-foreground">{new Date(s.started_at).toLocaleString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TusoStartShift;
