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
import { Package, Plus, Calendar, XCircle } from 'lucide-react';

const TusoResources = () => {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [resources, setResources] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [newRes, setNewRes] = useState({ name: '', type_code: 'BED', capacity: 1 });
  const [newBooking, setNewBooking] = useState({ start_at: '', end_at: '', reason: '' });

  useEffect(() => {
    supabase.from('tuso_facilities').select('id, name').eq('status', 'ACTIVE').order('name').then(({ data }) => setFacilities(data || []));
  }, []);

  const fetchResources = () => {
    if (!selectedFacilityId) return;
    supabase.from('tuso_resources').select('*').eq('facility_id', selectedFacilityId).order('name').then(({ data }) => setResources(data || []));
  };

  useEffect(() => { fetchResources(); }, [selectedFacilityId]);

  const fetchBookings = (resourceId: string) => {
    setSelectedResource(resourceId);
    supabase.from('tuso_bookings').select('*').eq('resource_id', resourceId).order('start_at').then(({ data }) => setBookings(data || []));
  };

  const createResource = async () => {
    const { error } = await supabase.from('tuso_resources').insert({ ...newRes, facility_id: selectedFacilityId, tenant_id: 'default-tenant' });
    if (error) { toast.error(error.message); return; }
    toast.success('Resource created');
    setShowCreate(false);
    fetchResources();
  };

  const createBooking = async () => {
    if (!selectedResource) return;
    // Conflict check
    const { data: conflicts } = await supabase.from('tuso_bookings')
      .select('id').eq('resource_id', selectedResource).eq('status', 'CONFIRMED')
      .lt('start_at', newBooking.end_at).gt('end_at', newBooking.start_at);
    if (conflicts && conflicts.length > 0) {
      toast.error('Booking conflicts with existing reservation');
      return;
    }
    const { error } = await supabase.from('tuso_bookings').insert({
      resource_id: selectedResource, tenant_id: 'default-tenant',
      booked_by_actor_id: 'current-user', ...newBooking,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Booking created');
    setShowBooking(false);
    setNewBooking({ start_at: '', end_at: '', reason: '' });
    fetchBookings(selectedResource);
  };

  const cancelBooking = async (id: string) => {
    await supabase.from('tuso_bookings').update({ status: 'CANCELLED' }).eq('id', id);
    toast.success('Booking cancelled');
    if (selectedResource) fetchBookings(selectedResource);
  };

  const statusColors: Record<string, string> = {
    AVAILABLE: 'bg-green-100 text-green-800', IN_USE: 'bg-yellow-100 text-yellow-800',
    MAINTENANCE: 'bg-orange-100 text-orange-800', DECOMMISSIONED: 'bg-red-100 text-red-800',
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-2"><Package className="h-6 w-6" /> TUSO Resources & Bookings</h1>
      <div className="flex gap-4">
        <Select value={selectedFacilityId} onValueChange={setSelectedFacilityId}>
          <SelectTrigger className="w-80"><SelectValue placeholder="Select facility" /></SelectTrigger>
          <SelectContent>{facilities.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
        </Select>
        {selectedFacilityId && (
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Resource</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Resource</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Name</Label><Input value={newRes.name} onChange={e => setNewRes(p => ({ ...p, name: e.target.value }))} /></div>
                <div><Label>Type</Label>
                  <Select value={newRes.type_code} onValueChange={v => setNewRes(p => ({ ...p, type_code: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{['BED', 'ROOM', 'THEATRE', 'EQUIPMENT', 'SERVICE_POINT'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Capacity</Label><Input type="number" value={newRes.capacity} onChange={e => setNewRes(p => ({ ...p, capacity: parseInt(e.target.value) || 1 }))} /></div>
                <Button onClick={createResource} disabled={!newRes.name} className="w-full">Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {resources.map(r => (
          <Card key={r.id} className="cursor-pointer hover:shadow-md" onClick={() => fetchBookings(r.id)}>
            <CardContent className="py-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">{r.name}</div>
                  <div className="text-sm text-muted-foreground">{r.type_code} · Cap: {r.capacity}</div>
                </div>
                <Badge className={statusColors[r.status] || ''}>{r.status}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedResource && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />Bookings</CardTitle>
            <Dialog open={showBooking} onOpenChange={setShowBooking}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Book</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New Booking</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Start</Label><Input type="datetime-local" value={newBooking.start_at} onChange={e => setNewBooking(p => ({ ...p, start_at: e.target.value }))} /></div>
                  <div><Label>End</Label><Input type="datetime-local" value={newBooking.end_at} onChange={e => setNewBooking(p => ({ ...p, end_at: e.target.value }))} /></div>
                  <div><Label>Reason</Label><Input value={newBooking.reason} onChange={e => setNewBooking(p => ({ ...p, reason: e.target.value }))} /></div>
                  <Button onClick={createBooking} disabled={!newBooking.start_at || !newBooking.end_at} className="w-full">Book</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {bookings.map(b => (
              <div key={b.id} className="flex justify-between items-center py-2 border-b">
                <div>
                  <div className="text-sm">{new Date(b.start_at).toLocaleString()} — {new Date(b.end_at).toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">{b.reason || 'No reason'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={b.status === 'CONFIRMED' ? 'default' : 'secondary'}>{b.status}</Badge>
                  {b.status === 'CONFIRMED' && <Button variant="ghost" size="sm" onClick={() => cancelBooking(b.id)}><XCircle className="h-4 w-4" /></Button>}
                </div>
              </div>
            ))}
            {bookings.length === 0 && <p className="text-muted-foreground text-center py-4">No bookings</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TusoResources;
