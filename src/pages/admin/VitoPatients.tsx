import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Search, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function VitoPatients() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [newHealthId, setNewHealthId] = useState('');
  const [newCrid, setNewCrid] = useState('');
  const [newCpid, setNewCpid] = useState('');

  const { data: patients, isLoading } = useQuery({
    queryKey: ['vito-patients', search],
    queryFn: async () => {
      let q = supabase.from('vito_patients').select('*').order('created_at', { ascending: false }).limit(100);
      if (search) q = q.or(`health_id.ilike.%${search}%,crid.ilike.%${search}%,cpid.ilike.%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('vito_patients').insert({
        tenant_id: 'default-tenant',
        health_id: newHealthId,
        crid: newCrid || null,
        cpid: newCpid || null,
        created_by: 'admin',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Patient identity ref created');
      qc.invalidateQueries({ queryKey: ['vito-patients'] });
      setCreateOpen(false);
      setNewHealthId('');
      setNewCrid('');
      setNewCpid('');
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
          <h1 className="text-2xl font-bold">VITO Patients</h1>
          <p className="text-sm text-muted-foreground">Identity refs only — no PII stored</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Patient Identity Registry</CardTitle>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Create</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Patient Identity Ref</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Health ID (opaque)</Label><Input value={newHealthId} onChange={e => setNewHealthId(e.target.value)} placeholder="e.g. HID-000123" /></div>
                <div><Label>CRID (optional)</Label><Input value={newCrid} onChange={e => setNewCrid(e.target.value)} /></div>
                <div><Label>CPID (optional)</Label><Input value={newCpid} onChange={e => setNewCpid(e.target.value)} /></div>
                <Button onClick={() => createMutation.mutate()} disabled={!newHealthId || createMutation.isPending} className="w-full">
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Search className="h-4 w-4 mt-3 text-muted-foreground" />
            <Input placeholder="Search by health_id, crid, cpid..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Health ID</TableHead>
                <TableHead>CRID</TableHead>
                <TableHead>CPID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>
              ) : patients?.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No patients found</TableCell></TableRow>
              ) : patients?.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.health_id}</TableCell>
                  <TableCell className="font-mono text-xs">{p.crid || '—'}</TableCell>
                  <TableCell className="font-mono text-xs">{p.cpid || '—'}</TableCell>
                  <TableCell><Badge variant={p.status === 'active' ? 'default' : 'secondary'}>{p.status}</Badge></TableCell>
                  <TableCell className="text-xs">{new Date(p.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
