import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Settings, History, RotateCcw } from 'lucide-react';

const TusoConfig = () => {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [configJson, setConfigJson] = useState('{}');
  const [history, setHistory] = useState<any[]>([]);
  const [tusoConfig, setTusoConfig] = useState<any>(null);

  useEffect(() => {
    supabase.from('tuso_facilities').select('id, name').eq('status', 'ACTIVE').order('name').then(({ data }) => setFacilities(data || []));
    supabase.from('tuso_config').select('*').eq('tenant_id', 'default-tenant').single().then(({ data }) => setTusoConfig(data));
  }, []);

  useEffect(() => {
    if (!selectedFacilityId) return;
    supabase.from('tuso_config_facility_versions').select('*').eq('facility_id', selectedFacilityId).order('version', { ascending: false }).then(({ data }) => {
      setHistory(data || []);
      if (data?.[0]) setConfigJson(JSON.stringify(data[0].config_json, null, 2));
    });
  }, [selectedFacilityId]);

  const saveConfig = async () => {
    try {
      const parsed = JSON.parse(configJson);
      const nextVer = (history[0]?.version || 0) + 1;
      const { error } = await supabase.from('tuso_config_facility_versions').insert({
        facility_id: selectedFacilityId, tenant_id: 'default-tenant', version: nextVer, config_json: parsed, created_by: 'admin',
      });
      if (error) throw error;
      toast.success(`Config v${nextVer} saved`);
      supabase.from('tuso_config_facility_versions').select('*').eq('facility_id', selectedFacilityId).order('version', { ascending: false }).then(({ data }) => setHistory(data || []));
    } catch (e: any) { toast.error(e.message || 'Invalid JSON'); }
  };

  const rollback = async (version: number) => {
    const target = history.find(h => h.version === version);
    if (!target) return;
    const nextVer = (history[0]?.version || 0) + 1;
    await supabase.from('tuso_config_facility_versions').insert({
      facility_id: selectedFacilityId, tenant_id: 'default-tenant', version: nextVer, config_json: target.config_json, created_by: 'admin',
    });
    toast.success(`Rolled back to v${version} as new v${nextVer}`);
    supabase.from('tuso_config_facility_versions').select('*').eq('facility_id', selectedFacilityId).order('version', { ascending: false }).then(({ data }) => {
      setHistory(data || []);
      if (data?.[0]) setConfigJson(JSON.stringify(data[0].config_json, null, 2));
    });
  };

  const updateTusoConfig = async (field: string, value: any) => {
    if (!tusoConfig) return;
    await supabase.from('tuso_config').update({ [field]: value, updated_at: new Date().toISOString() }).eq('id', tusoConfig.id);
    setTusoConfig({ ...tusoConfig, [field]: value });
    toast.success(`${field} updated`);
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-2"><Settings className="h-6 w-6" /> TUSO Configuration</h1>

      {tusoConfig && (
        <Card>
          <CardHeader><CardTitle>Tenant Config</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>GOFR Mode</Label>
              <Select value={tusoConfig.gofr_enabled ? 'true' : 'false'} onValueChange={v => updateTusoConfig('gofr_enabled', v === 'true')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="true">Enabled</SelectItem><SelectItem value="false">Disabled</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <Label>ZIBO Mode</Label>
              <Select value={tusoConfig.zibo_mode} onValueChange={v => updateTusoConfig('zibo_mode', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="STRICT">STRICT</SelectItem><SelectItem value="LENIENT">LENIENT</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <Label>Emit Mode</Label>
              <Select value={tusoConfig.emit_mode} onValueChange={v => updateTusoConfig('emit_mode', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="DUAL">DUAL</SelectItem><SelectItem value="V1_1_ONLY">V1_1_ONLY</SelectItem><SelectItem value="LEGACY_ONLY">LEGACY_ONLY</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <Label>Spine Status</Label>
              <Select value={tusoConfig.spine_status} onValueChange={v => updateTusoConfig('spine_status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="ONLINE">ONLINE</SelectItem><SelectItem value="OFFLINE">OFFLINE</SelectItem><SelectItem value="DEGRADED">DEGRADED</SelectItem></SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      <Select value={selectedFacilityId} onValueChange={setSelectedFacilityId}>
        <SelectTrigger className="w-80"><SelectValue placeholder="Select facility for config" /></SelectTrigger>
        <SelectContent>{facilities.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
      </Select>

      {selectedFacilityId && (
        <>
          <Card>
            <CardHeader><CardTitle>Facility Config (JSON)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Textarea value={configJson} onChange={e => setConfigJson(e.target.value)} rows={10} className="font-mono text-sm" />
              <Button onClick={saveConfig}>Save New Version</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5" />Version History</CardTitle></CardHeader>
            <CardContent>
              {history.map(h => (
                <div key={h.id} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <Badge variant="outline">v{h.version}</Badge>
                    <span className="text-sm ml-2">{new Date(h.created_at).toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground ml-2">by {h.created_by || 'system'}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => rollback(h.version)}>
                    <RotateCcw className="h-4 w-4 mr-1" />Rollback
                  </Button>
                </div>
              ))}
              {history.length === 0 && <p className="text-muted-foreground">No versions yet</p>}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default TusoConfig;
