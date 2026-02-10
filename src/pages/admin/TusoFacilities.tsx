import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Building2, Plus, Search, History, ArrowLeftRight } from 'lucide-react';

const TusoFacilities = () => {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [newFacility, setNewFacility] = useState({ name: '', level: 'clinic', ownership: 'GOVT', type_code: '' });

  const fetchFacilities = async () => {
    setLoading(true);
    let query = supabase.from('tuso_facilities').select('*').order('name');
    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    if (search) query = query.ilike('name', `%${search}%`);
    const { data } = await query;
    setFacilities(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchFacilities(); }, [statusFilter, search]);

  const createFacility = async () => {
    const { error } = await supabase.from('tuso_facilities').insert({ ...newFacility, tenant_id: 'default-tenant' });
    if (error) { toast.error(error.message); return; }
    toast.success('Facility created');
    setShowCreate(false);
    setNewFacility({ name: '', level: 'clinic', ownership: 'GOVT', type_code: '' });
    fetchFacilities();
  };

  const loadVersions = async (facilityId: string) => {
    const { data } = await supabase.from('tuso_facility_versions').select('*').eq('facility_id', facilityId).order('version_no', { ascending: false });
    setVersions(data || []);
  };

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    CLOSED: 'bg-red-100 text-red-800',
    MERGED: 'bg-blue-100 text-blue-800',
    INACTIVE: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Building2 className="h-6 w-6" /> TUSO Facility Registry</h1>
          <p className="text-muted-foreground">GOFR-compatible facility register with versioning</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Facility</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Facility</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={newFacility.name} onChange={e => setNewFacility(p => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>Level</Label>
                <Select value={newFacility.level} onValueChange={v => setNewFacility(p => ({ ...p, level: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['clinic', 'CHC', 'district', 'provincial', 'central'].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Ownership</Label>
                <Select value={newFacility.ownership} onValueChange={v => setNewFacility(p => ({ ...p, ownership: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['GOVT', 'PRIVATE', 'FAITH', 'OTHER'].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Type Code</Label><Input value={newFacility.type_code} onChange={e => setNewFacility(p => ({ ...p, type_code: e.target.value }))} placeholder="e.g. CLINIC" /></div>
              <Button onClick={createFacility} disabled={!newFacility.name} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search facilities..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {['ACTIVE', 'CLOSED', 'MERGED', 'INACTIVE'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {facilities.map(f => (
          <Card key={f.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelectedFacility(f); loadVersions(f.id); }}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <div className="font-semibold">{f.name}</div>
                <div className="text-sm text-muted-foreground">{f.level} · {f.ownership} · {f.type_code || 'N/A'}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={statusColors[f.status] || ''}>{f.status}</Badge>
                <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); setSelectedFacility(f); loadVersions(f.id); }}>
                  <History className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!loading && facilities.length === 0 && <p className="text-center text-muted-foreground py-8">No facilities found</p>}
      </div>

      {selectedFacility && (
        <Dialog open={!!selectedFacility} onOpenChange={() => setSelectedFacility(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{selectedFacility.name} — Version History</DialogTitle></DialogHeader>
            <div className="space-y-3 max-h-96 overflow-auto">
              {versions.map(v => (
                <Card key={v.id}>
                  <CardContent className="py-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-mono text-sm">v{v.version_no}</span>
                        <span className="text-muted-foreground text-xs ml-2">{new Date(v.changed_at).toLocaleString()}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">by {v.changed_by_actor_id || 'system'}</span>
                    </div>
                    {v.changed_fields && <div className="text-xs mt-1">Changed: {v.changed_fields.join(', ')}</div>}
                  </CardContent>
                </Card>
              ))}
              {versions.length === 0 && <p className="text-center text-muted-foreground">No version history</p>}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default TusoFacilities;
