/**
 * TSHEPO — Consent Admin UI
 * Search, view, create and revoke FHIR R4 Consents
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Shield, Plus, Search, XCircle, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function TshepoConsentAdmin() {
  const queryClient = useQueryClient();
  const [searchCpid, setSearchCpid] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [createOpen, setCreateOpen] = useState(false);
  const [newConsent, setNewConsent] = useState({
    patient_cpid: '', grantor_ref: '', grantee_ref: '', purpose_of_use: 'treatment',
    provision_type: 'permit', scope_code: 'patient-privacy',
  });

  const { data: consents, isLoading } = useQuery({
    queryKey: ['tshepo-consents', searchCpid, statusFilter],
    queryFn: async () => {
      let query = supabase.from('tshepo_consents' as any).select('*', { count: 'exact' })
        .order('created_at', { ascending: false }).limit(50);
      if (searchCpid) query = query.eq('patient_cpid', searchCpid);
      if (statusFilter !== 'all') query = query.eq('status', statusFilter);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (consentId: string) => {
      const { error } = await supabase.from('tshepo_consents' as any)
        .update({ status: 'rejected', revoked_at: new Date().toISOString(), revocation_reason: 'Admin revocation' })
        .eq('id', consentId);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Consent revoked'); queryClient.invalidateQueries({ queryKey: ['tshepo-consents'] }); },
    onError: () => toast.error('Revocation failed'),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const fhirId = `Consent/${crypto.randomUUID()}`;
      const { error } = await supabase.from('tshepo_consents' as any).insert({
        tenant_id: 'default-tenant', fhir_id: fhirId,
        fhir_resource: { resourceType: 'Consent', id: fhirId, status: 'active' },
        ...newConsent, purpose_of_use: [newConsent.purpose_of_use], action_codes: [], data_classes: [],
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Consent created'); setCreateOpen(false); queryClient.invalidateQueries({ queryKey: ['tshepo-consents'] }); },
    onError: () => toast.error('Creation failed'),
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">TSHEPO Consent Management</h1>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />New Consent</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create FHIR R4 Consent</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Patient CPID</Label><Input value={newConsent.patient_cpid} onChange={e => setNewConsent(p => ({ ...p, patient_cpid: e.target.value }))} placeholder="CPID-..." /></div>
              <div><Label>Grantor Reference</Label><Input value={newConsent.grantor_ref} onChange={e => setNewConsent(p => ({ ...p, grantor_ref: e.target.value }))} /></div>
              <div><Label>Grantee Reference</Label><Input value={newConsent.grantee_ref} onChange={e => setNewConsent(p => ({ ...p, grantee_ref: e.target.value }))} /></div>
              <div><Label>Purpose of Use</Label>
                <Select value={newConsent.purpose_of_use} onValueChange={v => setNewConsent(p => ({ ...p, purpose_of_use: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="treatment">Treatment</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                    <SelectItem value="research">Research</SelectItem>
                    <SelectItem value="public_health">Public Health</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Provision Type</Label>
                <Select value={newConsent.provision_type} onValueChange={v => setNewConsent(p => ({ ...p, provision_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="permit">Permit</SelectItem>
                    <SelectItem value="deny">Deny</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => createMutation.mutate()} disabled={!newConsent.patient_cpid || !newConsent.grantor_ref}>Create Consent</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search by Patient CPID..." value={searchCpid} onChange={e => setSearchCpid(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="rejected">Revoked</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>FHIR ID</TableHead>
                <TableHead>Patient CPID</TableHead>
                <TableHead>Provision</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : (consents || []).length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No consents found</TableCell></TableRow>
              ) : (consents || []).map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs">{c.fhir_id?.substring(0, 20)}...</TableCell>
                  <TableCell className="font-mono text-xs">{c.patient_cpid}</TableCell>
                  <TableCell><Badge variant={c.provision_type === 'permit' ? 'default' : 'destructive'}>{c.provision_type}</Badge></TableCell>
                  <TableCell>{(c.purpose_of_use || []).join(', ')}</TableCell>
                  <TableCell><Badge variant={c.status === 'active' ? 'default' : 'secondary'}>{c.status}</Badge></TableCell>
                  <TableCell className="text-xs">{new Date(c.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {c.status === 'active' && (
                      <Button size="sm" variant="destructive" onClick={() => revokeMutation.mutate(c.id)}>
                        <XCircle className="h-3 w-3 mr-1" />Revoke
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
