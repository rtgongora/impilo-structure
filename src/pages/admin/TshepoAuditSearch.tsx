/**
 * TSHEPO — Audit Search (Admin)
 * Hash-chained audit ledger search and verification
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Search, Shield, Link2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function TshepoAuditSearch() {
  const [actorFilter, setActorFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [decisionFilter, setDecisionFilter] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 50;

  const { data, isLoading } = useQuery({
    queryKey: ['tshepo-audit', actorFilter, actionFilter, decisionFilter, page],
    queryFn: async () => {
      let query = supabase.from('tshepo_audit_ledger' as any).select('*', { count: 'exact' })
        .order('chain_sequence', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);
      if (actorFilter) query = query.eq('actor_id', actorFilter);
      if (actionFilter) query = query.ilike('action', `%${actionFilter}%`);
      if (decisionFilter !== 'all') query = query.eq('decision', decisionFilter);
      const { data, error, count } = await query;
      if (error) throw error;
      return { records: data || [], total: count || 0 };
    },
  });

  const decisionBadge = (d: string) => {
    if (d === 'ALLOW') return <Badge className="bg-green-600">ALLOW</Badge>;
    if (d === 'DENY') return <Badge variant="destructive">DENY</Badge>;
    if (d === 'BREAK_GLASS') return <Badge className="bg-amber-600">BREAK GLASS</Badge>;
    return <Badge variant="secondary">{d}</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <BookOpen className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">TSHEPO Audit Ledger</h1>
        <Badge variant="outline" className="ml-2"><Link2 className="h-3 w-3 mr-1" />Hash-Chained</Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-48 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Filter by Actor ID..." value={actorFilter} onChange={e => setActorFilter(e.target.value)} />
            </div>
            <Input className="w-48" placeholder="Filter by action..." value={actionFilter} onChange={e => setActionFilter(e.target.value)} />
            <Select value={decisionFilter} onValueChange={setDecisionFilter}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Decisions</SelectItem>
                <SelectItem value="ALLOW">Allow</SelectItem>
                <SelectItem value="DENY">Deny</SelectItem>
                <SelectItem value="BREAK_GLASS">Break Glass</SelectItem>
                <SelectItem value="SYSTEM">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Decision</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Hash</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading audit chain...</TableCell></TableRow>
                ) : (data?.records || []).length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No audit records found</TableCell></TableRow>
                ) : (data?.records || []).map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.chain_sequence}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{new Date(r.occurred_at).toLocaleString()}</TableCell>
                    <TableCell className="font-mono text-xs max-w-24 truncate">{r.actor_id?.substring(0, 12)}...</TableCell>
                    <TableCell className="font-mono text-xs">{r.action}</TableCell>
                    <TableCell>{decisionBadge(r.decision)}</TableCell>
                    <TableCell className="text-xs max-w-32 truncate">{(r.reason_codes || []).join(', ')}</TableCell>
                    <TableCell className="text-xs">{r.resource_type}{r.resource_id ? `:${r.resource_id.substring(0, 8)}` : ''}</TableCell>
                    <TableCell className="font-mono text-xs max-w-20 truncate" title={r.record_hash}>{r.record_hash?.substring(0, 8)}...</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-muted-foreground">{data?.total || 0} records</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button size="sm" variant="outline" onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
