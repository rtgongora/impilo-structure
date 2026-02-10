import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, RefreshCw, Database, Clock, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ButanoStats() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Record<string, { count: number; last_updated: string }>>({});
  const [total, setTotal] = useState(0);
  const [violations, setViolations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from('butano_fhir_resources')
      .select('resource_type, last_updated_at')
      .eq('tenant_id', 'default-tenant').order('last_updated_at', { ascending: false });
    const counts: Record<string, { count: number; last_updated: string }> = {};
    for (const r of data || []) {
      const t = r.resource_type as string;
      if (!counts[t]) counts[t] = { count: 0, last_updated: r.last_updated_at as string };
      counts[t].count++;
    }
    setStats(counts);
    setTotal((data || []).length);

    const { data: viol } = await supabase.from('butano_pii_violations')
      .select('*').eq('tenant_id', 'default-tenant')
      .order('created_at', { ascending: false }).limit(20);
    setViolations(viol || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">BUTANO — SHR Stats</h1>
              <p className="text-sm text-muted-foreground">Resource counts and PII violation log</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetch}><RefreshCw className="h-4 w-4 mr-1" />Refresh</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Database className="h-8 w-8 mx-auto text-primary mb-2" />
              <div className="text-3xl font-bold text-foreground">{total}</div>
              <div className="text-sm text-muted-foreground">Total Resources</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Clock className="h-8 w-8 mx-auto text-primary mb-2" />
              <div className="text-3xl font-bold text-foreground">{Object.keys(stats).length}</div>
              <div className="text-sm text-muted-foreground">Resource Types</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <ShieldAlert className="h-8 w-8 mx-auto text-destructive mb-2" />
              <div className="text-3xl font-bold text-foreground">{violations.length}</div>
              <div className="text-sm text-muted-foreground">PII Violations</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Resources by Type</CardTitle></CardHeader>
          <CardContent>
            {loading && <p className="text-muted-foreground">Loading…</p>}
            <div className="space-y-2">
              {Object.entries(stats).sort((a, b) => b[1].count - a[1].count).map(([type, info]) => (
                <div key={type} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <span className="font-medium text-foreground">{type}</span>
                    <span className="text-xs text-muted-foreground ml-2">Last: {new Date(info.last_updated).toLocaleString()}</span>
                  </div>
                  <Badge variant="secondary">{info.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {violations.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-destructive flex items-center gap-2"><ShieldAlert className="h-5 w-5" />PII Violation Log</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {violations.map(v => (
                  <div key={v.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <div className="text-sm font-medium text-foreground">{v.violation_type} — {v.resource_type || 'unknown'}</div>
                      <div className="text-xs text-muted-foreground">Paths: {(v.violation_paths || []).join(', ')}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">{new Date(v.created_at).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
