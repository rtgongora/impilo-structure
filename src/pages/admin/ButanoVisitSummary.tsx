import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Search, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ButanoVisitSummary() {
  const navigate = useNavigate();
  const [encounterId, setEncounterId] = useState('');
  const [encounter, setEncounter] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSummary = async () => {
    if (!encounterId) return;
    setLoading(true);
    const { data } = await supabase.from('butano_fhir_resources')
      .select('resource_type, resource_json, last_updated_at')
      .eq('tenant_id', 'default-tenant').eq('encounter_id', encounterId)
      .order('last_updated_at', { ascending: false });
    const enc = (data || []).find(r => r.resource_type === 'Encounter');
    setEncounter(enc?.resource_json || null);
    setResources((data || []).filter(r => r.resource_type !== 'Encounter'));
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">BUTANO — Visit Summary</h1>
            <p className="text-sm text-muted-foreground">Encounter-scoped clinical bundle</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6 flex gap-3">
            <Input placeholder="Enter Encounter ID" value={encounterId} onChange={e => setEncounterId(e.target.value)} className="flex-1" />
            <Button onClick={fetchSummary} disabled={loading}><Search className="h-4 w-4 mr-1" />{loading ? 'Loading…' : 'Fetch Summary'}</Button>
          </CardContent>
        </Card>

        {encounter && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Encounter</CardTitle></CardHeader>
            <CardContent>
              <pre className="text-xs text-foreground overflow-x-auto whitespace-pre-wrap">{JSON.stringify(encounter, null, 2)}</pre>
            </CardContent>
          </Card>
        )}

        {resources.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">{resources.length} linked resources</div>
            {resources.map((r, i) => (
              <Card key={i}>
                <CardContent className="py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline">{r.resource_type}</Badge>
                  </div>
                  <pre className="text-xs text-foreground overflow-x-auto whitespace-pre-wrap">{JSON.stringify(r.resource_json, null, 2)}</pre>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
