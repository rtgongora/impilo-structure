import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Search, Clock, FileText, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RESOURCE_TYPES = [
  "Encounter", "Condition", "AllergyIntolerance", "MedicationRequest",
  "Observation", "DiagnosticReport", "Procedure", "Immunization", "CarePlan",
];

export default function ButanoTimeline() {
  const navigate = useNavigate();
  const [cpid, setCpid] = useState('');
  const [searchCpid, setSearchCpid] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchTimeline = async () => {
    if (!searchCpid) return;
    setLoading(true);
    let q = supabase.from('butano_fhir_resources')
      .select('id, resource_type, fhir_id, encounter_id, effective_at, last_updated_at, is_provisional, meta_json', { count: 'exact' })
      .eq('tenant_id', 'default-tenant').eq('subject_cpid', searchCpid)
      .order('last_updated_at', { ascending: false }).limit(100);
    if (typeFilter !== 'all') q = q.eq('resource_type', typeFilter);
    const { data, count } = await q;
    setItems(data || []);
    setTotal(count || 0);
    setLoading(false);
  };

  useEffect(() => { if (searchCpid) fetchTimeline(); }, [searchCpid, typeFilter]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">BUTANO — CPID Timeline</h1>
            <p className="text-sm text-muted-foreground">PII-free longitudinal clinical record viewer</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Input placeholder="Enter CPID (e.g. CPID-12345)" value={cpid} onChange={e => setCpid(e.target.value)} className="flex-1" />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[200px]"><SelectValue placeholder="All types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {RESOURCE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={() => setSearchCpid(cpid)}><Search className="h-4 w-4 mr-1" />Search</Button>
            </div>
          </CardContent>
        </Card>

        {searchCpid && (
          <div className="text-sm text-muted-foreground">Showing {items.length} of {total} records for <Badge variant="outline">{searchCpid}</Badge></div>
        )}

        <div className="space-y-3">
          {loading && <p className="text-center text-muted-foreground py-8">Loading…</p>}
          {!loading && items.length === 0 && searchCpid && <p className="text-center text-muted-foreground py-8">No records found for this CPID.</p>}
          {items.map(item => (
            <Card key={item.id} className={item.is_provisional ? 'border-yellow-500/50' : ''}>
              <CardContent className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{item.resource_type}</span>
                      {item.is_provisional && <Badge variant="outline" className="text-yellow-600 border-yellow-500"><AlertTriangle className="h-3 w-3 mr-1" />Provisional</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">{item.fhir_id}{item.encounter_id && ` • Encounter: ${item.encounter_id}`}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {new Date(item.last_updated_at).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
