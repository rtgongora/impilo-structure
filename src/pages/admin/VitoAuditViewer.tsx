import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function VitoAuditViewer() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('');

  const { data: entries, isLoading } = useQuery({
    queryKey: ['vito-audit', filter],
    queryFn: async () => {
      let q = supabase.from('vito_audit_log').select('*').order('created_at', { ascending: false }).limit(100);
      if (filter) q = q.or(`correlation_id.eq.${filter},request_id.eq.${filter},actor_id.ilike.%${filter}%,action.ilike.%${filter}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">VITO Audit Log</h1>
          <p className="text-sm text-muted-foreground">Opaque audit entries — no PII</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Audit Entries</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Search className="h-4 w-4 mt-3 text-muted-foreground" />
            <Input placeholder="Filter by correlation_id, request_id, actor_id, or action..." value={filter} onChange={e => setFilter(e.target.value)} />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Decision</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center">Loading...</TableCell></TableRow>
              ) : entries?.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No audit entries</TableCell></TableRow>
              ) : entries?.map((a: Record<string, unknown>) => (
                <TableRow key={a.id as string}>
                  <TableCell className="font-mono text-xs">{a.action as string}</TableCell>
                  <TableCell>
                    <Badge variant={(a.decision as string) === 'DENY' ? 'destructive' : 'default'}>
                      {a.decision as string}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{a.actor_id as string}</TableCell>
                  <TableCell className="text-xs">{a.resource_type ? `${a.resource_type}/${a.resource_id}` : '—'}</TableCell>
                  <TableCell className="text-xs">{(a.purpose_of_use as string) || '—'}</TableCell>
                  <TableCell className="text-xs">{new Date(a.created_at as string).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
