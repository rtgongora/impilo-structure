import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, RefreshCw, GitMerge, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function ButanoReconciliation() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [fromOcpid, setFromOcpid] = useState('');
  const [toCpid, setToCpid] = useState('');
  const [loading, setLoading] = useState(false);
  const [reconciling, setReconciling] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    const { data } = await supabase.from('butano_reconciliation_queue')
      .select('*').eq('tenant_id', 'default-tenant')
      .order('created_at', { ascending: false }).limit(100);
    setJobs(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchJobs(); }, []);

  const triggerReconcile = async () => {
    if (!fromOcpid || !toCpid) { toast.error('Both O-CPID and CPID are required'); return; }
    setReconciling(true);
    try {
      // Create job
      await supabase.from('butano_reconciliation_queue').insert({
        tenant_id: 'default-tenant', from_ocpid: fromOcpid, to_cpid: toCpid, status: 'RUNNING',
      });
      // Rewrite records
      const { data: affected } = await supabase.from('butano_fhir_resources')
        .select('id, meta_json').eq('tenant_id', 'default-tenant').eq('subject_cpid', fromOcpid);
      let rewritten = 0;
      for (const rec of affected || []) {
        const tags = [...((rec.meta_json as any)?.tags || []), `reconciled_from:${fromOcpid}`];
        await supabase.from('butano_fhir_resources').update({
          subject_cpid: toCpid, is_provisional: false,
          meta_json: { ...(rec.meta_json as any), tags },
          last_updated_at: new Date().toISOString(),
        }).eq('id', rec.id);
        rewritten++;
      }
      // Update job
      await supabase.from('butano_reconciliation_queue').update({
        status: 'COMPLETED', updated_at: new Date().toISOString(),
      }).eq('tenant_id', 'default-tenant').eq('from_ocpid', fromOcpid).eq('status', 'RUNNING');
      toast.success(`Reconciled ${rewritten} records from ${fromOcpid} → ${toCpid}`);
      setFromOcpid(''); setToCpid('');
      fetchJobs();
    } catch (e: any) {
      toast.error(e.message || 'Reconciliation failed');
    } finally {
      setReconciling(false);
    }
  };

  const statusIcon = (s: string) => {
    if (s === 'COMPLETED') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (s === 'FAILED') return <XCircle className="h-4 w-4 text-destructive" />;
    return <Clock className="h-4 w-4 text-yellow-500" />;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">BUTANO — Reconciliation Queue</h1>
            <p className="text-sm text-muted-foreground">O-CPID → CPID subject reconciliation</p>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><GitMerge className="h-5 w-5" />New Reconciliation</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <Input placeholder="O-CPID (e.g. O-CPID-ABC123)" value={fromOcpid} onChange={e => setFromOcpid(e.target.value)} />
              <span className="self-center text-muted-foreground">→</span>
              <Input placeholder="CPID (e.g. CPID-12345)" value={toCpid} onChange={e => setToCpid(e.target.value)} />
            </div>
            <Button onClick={triggerReconcile} disabled={reconciling}>
              <GitMerge className="h-4 w-4 mr-1" />{reconciling ? 'Reconciling…' : 'Start Reconciliation'}
            </Button>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Jobs ({jobs.length})</h2>
          <Button variant="outline" size="sm" onClick={fetchJobs}><RefreshCw className="h-4 w-4 mr-1" />Refresh</Button>
        </div>

        <div className="space-y-2">
          {loading && <p className="text-center text-muted-foreground py-6">Loading…</p>}
          {jobs.map(j => (
            <Card key={j.job_id}>
              <CardContent className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {statusIcon(j.status)}
                  <div>
                    <div className="text-sm font-medium text-foreground">{j.from_ocpid} → {j.to_cpid}</div>
                    <div className="text-xs text-muted-foreground">{new Date(j.created_at).toLocaleString()}</div>
                  </div>
                </div>
                <Badge variant={j.status === 'COMPLETED' ? 'default' : j.status === 'FAILED' ? 'destructive' : 'secondary'}>{j.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
