/**
 * TSHEPO — Patient "My Access History" (Portal)
 * Paginated, redacted view of who accessed the patient's data
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Shield, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function TshepoPatientAccessHistory() {
  const [patientCpid, setPatientCpid] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['tshepo-access-history', patientCpid, page],
    queryFn: async () => {
      if (!patientCpid) return { entries: [], total: 0 };
      const { data, error, count } = await supabase.from('tshepo_patient_access_log' as any)
        .select('occurred_at, accessor_type, accessor_role, facility_ref, action, purpose_of_use, resource_type, decision, is_break_glass, is_redacted', { count: 'exact' })
        .eq('patient_cpid', patientCpid)
        .order('occurred_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);
      if (error) throw error;
      return { entries: data || [], total: count || 0 };
    },
    enabled: !!patientCpid,
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Eye className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">My Access History</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-4">
            <Input placeholder="Enter your Patient CPID..." value={patientCpid} onChange={e => setPatientCpid(e.target.value)} className="max-w-md" />
          </div>
          <p className="text-sm text-muted-foreground">View a transparent record of who accessed your health information, when, and why. Accessor identities are redacted for privacy.</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Accessor Role</TableHead>
                <TableHead>Facility</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Decision</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!patientCpid ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Enter your CPID to view access history</TableCell></TableRow>
              ) : isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : (data?.entries || []).length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No access records found</TableCell></TableRow>
              ) : (data?.entries || []).map((e: any, i: number) => (
                <TableRow key={i} className={e.is_break_glass ? 'bg-amber-500/5' : ''}>
                  <TableCell className="text-xs whitespace-nowrap">{new Date(e.occurred_at).toLocaleString()}</TableCell>
                  <TableCell>{e.accessor_role || e.accessor_type}</TableCell>
                  <TableCell className="text-xs">{e.facility_ref ? `Facility ${e.facility_ref.substring(0, 8)}...` : '—'}</TableCell>
                  <TableCell className="text-xs">{e.action}</TableCell>
                  <TableCell>{e.purpose_of_use || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={e.decision === 'ALLOW' ? 'default' : 'destructive'}>{e.decision}</Badge>
                  </TableCell>
                  <TableCell>
                    {e.is_break_glass && <Badge className="bg-amber-600"><AlertTriangle className="h-3 w-3 mr-1" />Emergency</Badge>}
                    {e.is_redacted && <Badge variant="secondary"><Shield className="h-3 w-3 mr-1" />Redacted</Badge>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {data && data.total > limit && (
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-muted-foreground">{data.total} total records</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <Button size="sm" variant="outline" disabled={page * limit >= data.total} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
