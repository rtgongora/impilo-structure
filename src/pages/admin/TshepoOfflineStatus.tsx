/**
 * TSHEPO — Offline Status & Reconciliation Screen
 * Shows offline tokens, O-CPIDs, and reconciliation status
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wifi, WifiOff, RefreshCw, Key, Fingerprint } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function TshepoOfflineStatus() {
  const queryClient = useQueryClient();

  const { data: offlineTokens, isLoading: loadingTokens } = useQuery({
    queryKey: ['tshepo-offline-tokens'],
    queryFn: async () => {
      const { data, error } = await supabase.from('trust_layer_offline_tokens' as any)
        .select('*').order('issued_at', { ascending: false }).limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: ocpids, isLoading: loadingOcpids } = useQuery({
    queryKey: ['tshepo-ocpids'],
    queryFn: async () => {
      const { data, error } = await supabase.from('trust_layer_offline_cpid' as any)
        .select('*').order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  const reconcileMutation = useMutation({
    mutationFn: async (oCpid: string) => {
      const { error } = await supabase.from('trust_layer_offline_cpid' as any)
        .update({ status: 'pending_reconciliation', sync_attempted_at: new Date().toISOString() })
        .eq('o_cpid', oCpid);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Reconciliation queued'); queryClient.invalidateQueries({ queryKey: ['tshepo-ocpids'] }); },
  });

  const tokenStatus = (token: any) => {
    if (token.status === 'revoked') return <Badge variant="destructive">Revoked</Badge>;
    if (new Date(token.expires_at) < new Date()) return <Badge variant="secondary">Expired</Badge>;
    return <Badge className="bg-green-600">Active</Badge>;
  };

  const ocpidStatus = (o: any) => {
    if (o.status === 'reconciled') return <Badge className="bg-green-600">Reconciled</Badge>;
    if (o.status === 'provisional') return <Badge className="bg-amber-600">Provisional</Badge>;
    if (o.status === 'pending_reconciliation') return <Badge variant="outline">Pending</Badge>;
    return <Badge variant="secondary">{o.status}</Badge>;
  };

  const provisionalCount = (ocpids || []).filter((o: any) => o.status === 'provisional').length;
  const activeTokenCount = (offlineTokens || []).filter((t: any) => t.status === 'active' && new Date(t.expires_at) > new Date()).length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <WifiOff className="h-6 w-6 text-amber-500" />
          <h1 className="text-2xl font-bold">Offline Trust & Reconciliation</h1>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline"><Key className="h-3 w-3 mr-1" />{activeTokenCount} Active Tokens</Badge>
          <Badge variant="outline"><Fingerprint className="h-3 w-3 mr-1" />{provisionalCount} Provisional O-CPIDs</Badge>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-6 text-center">
          <div className="text-3xl font-bold">{activeTokenCount}</div>
          <div className="text-sm text-muted-foreground">Active Offline Tokens</div>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <div className="text-3xl font-bold text-amber-500">{provisionalCount}</div>
          <div className="text-sm text-muted-foreground">Awaiting Reconciliation</div>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <div className="text-3xl font-bold text-green-500">{(ocpids || []).filter((o: any) => o.status === 'reconciled').length}</div>
          <div className="text-sm text-muted-foreground">Reconciled O-CPIDs</div>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="ocpids">
        <TabsList>
          <TabsTrigger value="ocpids">O-CPIDs ({(ocpids || []).length})</TabsTrigger>
          <TabsTrigger value="tokens">Offline Tokens ({(offlineTokens || []).length})</TabsTrigger>
        </TabsList>

        <TabsContent value="ocpids">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>O-CPID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Facility</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Reconciled CPID</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingOcpids ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : (ocpids || []).map((o: any) => (
                    <TableRow key={o.id || o.o_cpid}>
                      <TableCell className="font-mono text-xs">{o.o_cpid}</TableCell>
                      <TableCell>{ocpidStatus(o)}</TableCell>
                      <TableCell className="text-xs">{o.generating_facility_id?.substring(0, 8) || '—'}</TableCell>
                      <TableCell className="text-xs">{new Date(o.created_at).toLocaleString()}</TableCell>
                      <TableCell className="font-mono text-xs">{o.reconciled_cpid || '—'}</TableCell>
                      <TableCell>
                        {o.status === 'provisional' && (
                          <Button size="sm" variant="outline" onClick={() => reconcileMutation.mutate(o.o_cpid)}>
                            <RefreshCw className="h-3 w-3 mr-1" />Reconcile
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tokens">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Token</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Facility</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Actions Used</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Expires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingTokens ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : (offlineTokens || []).map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs">{t.token_hash?.substring(0, 12)}...</TableCell>
                      <TableCell>{tokenStatus(t)}</TableCell>
                      <TableCell className="text-xs">{t.facility_id?.substring(0, 8) || '—'}</TableCell>
                      <TableCell className="text-xs">{t.scope}</TableCell>
                      <TableCell>{t.actions_used || 0}/{t.max_actions || 100}</TableCell>
                      <TableCell className="text-xs">{new Date(t.issued_at).toLocaleString()}</TableCell>
                      <TableCell className="text-xs">{new Date(t.expires_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
