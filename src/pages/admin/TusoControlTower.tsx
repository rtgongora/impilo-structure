import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Activity, AlertTriangle, CheckCircle, BedDouble } from 'lucide-react';

const TusoControlTower = () => {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [occupancy, setOccupancy] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [telemetry, setTelemetry] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('tuso_facilities').select('id, name').eq('status', 'ACTIVE').order('name').then(({ data }) => setFacilities(data || []));
    supabase.from('tuso_control_tower_alerts').select('*').eq('status', 'OPEN').order('created_at', { ascending: false }).limit(50).then(({ data }) => setAlerts(data || []));
  }, []);

  useEffect(() => {
    if (!selectedFacilityId) return;
    supabase.from('tuso_occupancy_snapshots').select('*').eq('facility_id', selectedFacilityId).order('captured_at', { ascending: false }).limit(1).then(({ data }) => setOccupancy(data?.[0] || null));
    supabase.from('tuso_resources').select('*').eq('facility_id', selectedFacilityId).then(({ data }) => setResources(data || []));
    supabase.from('tuso_telemetry_events').select('*').eq('facility_id', selectedFacilityId).order('received_at', { ascending: false }).limit(10).then(({ data }) => setTelemetry(data || []));
    supabase.from('tuso_control_tower_alerts').select('*').eq('facility_id', selectedFacilityId).eq('status', 'OPEN').order('created_at', { ascending: false }).then(({ data }) => setAlerts(data || []));
  }, [selectedFacilityId]);

  const resolveAlert = async (id: string) => {
    await supabase.from('tuso_control_tower_alerts').update({ status: 'RESOLVED', resolved_at: new Date().toISOString() }).eq('id', id);
    toast.success('Alert resolved');
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const severityColors: Record<string, string> = {
    INFO: 'bg-blue-100 text-blue-800',
    WARNING: 'bg-yellow-100 text-yellow-800',
    CRITICAL: 'bg-red-100 text-red-800',
  };

  const occupancyPct = occupancy ? Math.round((occupancy.occupied_beds / Math.max(occupancy.total_beds, 1)) * 100) : 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-2"><Activity className="h-6 w-6" /> TUSO Control Tower</h1>

      <Select value={selectedFacilityId} onValueChange={setSelectedFacilityId}>
        <SelectTrigger className="w-80"><SelectValue placeholder="Select facility" /></SelectTrigger>
        <SelectContent>{facilities.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
      </Select>

      {selectedFacilityId && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><BedDouble className="h-5 w-5" />Bed Occupancy</CardTitle></CardHeader>
            <CardContent>
              {occupancy ? (
                <div className="text-center">
                  <div className={`text-4xl font-bold ${occupancyPct > 90 ? 'text-red-600' : occupancyPct > 70 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {occupancyPct}%
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{occupancy.occupied_beds}/{occupancy.total_beds} beds</div>
                  <div className="text-xs text-muted-foreground">{new Date(occupancy.captured_at).toLocaleString()}</div>
                </div>
              ) : <p className="text-muted-foreground text-center">No data</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Resources</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span>Total:</span><span className="font-semibold">{resources.length}</span></div>
                <div className="flex justify-between"><span>Available:</span><span className="text-green-600">{resources.filter(r => r.status === 'AVAILABLE').length}</span></div>
                <div className="flex justify-between"><span>In Use:</span><span className="text-yellow-600">{resources.filter(r => r.status === 'IN_USE').length}</span></div>
                <div className="flex justify-between"><span>Maintenance:</span><span className="text-orange-600">{resources.filter(r => r.status === 'MAINTENANCE').length}</span></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Recent Telemetry</CardTitle></CardHeader>
            <CardContent>
              {telemetry.length > 0 ? telemetry.slice(0, 5).map(t => (
                <div key={t.id} className="text-xs border-b py-1">
                  <Badge variant="outline" className="mr-1">{t.source}</Badge>
                  {new Date(t.received_at).toLocaleTimeString()}
                </div>
              )) : <p className="text-muted-foreground text-sm">No telemetry</p>}
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" />Open Alerts</CardTitle></CardHeader>
        <CardContent>
          {alerts.length > 0 ? alerts.map(a => (
            <div key={a.id} className="flex justify-between items-center py-3 border-b">
              <div className="flex items-center gap-3">
                <Badge className={severityColors[a.severity] || ''}>{a.severity}</Badge>
                <div>
                  <div className="font-medium text-sm">{a.alert_type}</div>
                  <div className="text-xs text-muted-foreground">{a.message}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
                <Button variant="outline" size="sm" onClick={() => resolveAlert(a.id)}>
                  <CheckCircle className="h-4 w-4 mr-1" />Resolve
                </Button>
              </div>
            </div>
          )) : <p className="text-muted-foreground text-center py-4">No open alerts</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default TusoControlTower;
