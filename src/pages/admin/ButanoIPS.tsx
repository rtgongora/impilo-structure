import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Search, Shield, Pill, Bug, Syringe, Activity, FlaskConical, Stethoscope, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SECTION_CONFIG = [
  { key: 'allergies', label: 'Allergies', icon: Bug, types: ['AllergyIntolerance'] },
  { key: 'problems', label: 'Problems', icon: Stethoscope, types: ['Condition'] },
  { key: 'medications', label: 'Medications', icon: Pill, types: ['MedicationRequest', 'MedicationStatement'] },
  { key: 'immunizations', label: 'Immunizations', icon: Syringe, types: ['Immunization'] },
  { key: 'vitals', label: 'Vitals', icon: Activity, types: ['Observation'] },
  { key: 'labs', label: 'Labs', icon: FlaskConical, types: ['Observation'] },
  { key: 'procedures', label: 'Procedures', icon: Shield, types: ['Procedure'] },
  { key: 'carePlans', label: 'Care Plans', icon: ClipboardList, types: ['CarePlan'] },
];

export default function ButanoIPS() {
  const navigate = useNavigate();
  const [cpid, setCpid] = useState('');
  const [sections, setSections] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [totalResources, setTotalResources] = useState(0);

  const fetchIPS = async () => {
    if (!cpid) return;
    setLoading(true);
    const types = ['AllergyIntolerance', 'Condition', 'MedicationRequest', 'MedicationStatement',
      'Immunization', 'Observation', 'Procedure', 'CarePlan'];
    const { data } = await supabase.from('butano_fhir_resources')
      .select('resource_type, resource_json, last_updated_at')
      .eq('tenant_id', 'default-tenant').eq('subject_cpid', cpid)
      .in('resource_type', types).order('last_updated_at', { ascending: false });
    const s: Record<string, any[]> = {};
    for (const r of data || []) {
      const t = r.resource_type as string;
      if (!s[t]) s[t] = [];
      s[t].push(r.resource_json);
    }
    setSections({
      allergies: s['AllergyIntolerance'] || [],
      problems: s['Condition'] || [],
      medications: [...(s['MedicationRequest'] || []), ...(s['MedicationStatement'] || [])],
      immunizations: s['Immunization'] || [],
      vitals: (s['Observation'] || []).filter((o: any) => o?.category?.[0]?.coding?.[0]?.code === 'vital-signs'),
      labs: (s['Observation'] || []).filter((o: any) => o?.category?.[0]?.coding?.[0]?.code === 'laboratory'),
      procedures: s['Procedure'] || [],
      carePlans: s['CarePlan'] || [],
    });
    setTotalResources((data || []).length);
    setLoading(false);
  };

  const renderSection = (key: string) => {
    const items = sections[key] || [];
    if (items.length === 0) return <p className="text-sm text-muted-foreground py-4">No records in this section.</p>;
    return (
      <div className="space-y-2">
        {items.map((item: any, i: number) => (
          <Card key={i}>
            <CardContent className="py-3">
              <pre className="text-xs text-foreground overflow-x-auto whitespace-pre-wrap">{JSON.stringify(item, null, 2)}</pre>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">BUTANO — IPS Viewer</h1>
            <p className="text-sm text-muted-foreground">International Patient Summary (PII-free)</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6 flex gap-3">
            <Input placeholder="Enter CPID" value={cpid} onChange={e => setCpid(e.target.value)} className="flex-1" />
            <Button onClick={fetchIPS} disabled={loading}><Search className="h-4 w-4 mr-1" />{loading ? 'Loading…' : 'Generate IPS'}</Button>
          </CardContent>
        </Card>

        {totalResources > 0 && (
          <>
            <div className="text-sm text-muted-foreground">IPS assembled from <Badge variant="secondary">{totalResources}</Badge> resources</div>
            <Tabs defaultValue="allergies">
              <TabsList className="flex-wrap h-auto gap-1">
                {SECTION_CONFIG.map(s => (
                  <TabsTrigger key={s.key} value={s.key} className="gap-1">
                    <s.icon className="h-3 w-3" />{s.label}
                    <Badge variant="secondary" className="ml-1 text-xs">{(sections[s.key] || []).length}</Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
              {SECTION_CONFIG.map(s => (
                <TabsContent key={s.key} value={s.key}>{renderSection(s.key)}</TabsContent>
              ))}
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}
