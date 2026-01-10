import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Stethoscope, FileText, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { QueueItem } from '@/types/queue';

interface QueueToEncounterBridgeProps {
  queueItem: QueueItem;
  onEncounterCreated?: (encounterId: string) => void;
}

const ENCOUNTER_TYPES = [
  { value: 'outpatient', label: 'Outpatient Visit' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'inpatient', label: 'Inpatient Admission' },
  { value: 'observation', label: 'Observation' },
];

// Generate encounter number client-side
const generateEncounterNumber = () => {
  const date = new Date();
  const datePart = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ENC-${datePart}-${random}`;
};

export function QueueToEncounterBridge({ queueItem, onEncounterCreated }: QueueToEncounterBridgeProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [existingEncounter, setExistingEncounter] = useState<{ id: string; encounter_number: string } | null>(null);
  const [formData, setFormData] = useState({
    encounter_type: 'outpatient',
    chief_complaint: queueItem.reason_for_visit || '',
  });

  const checkExistingEncounter = async () => {
    if (!queueItem.patient_id) return null;
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('encounters')
      .select('id, encounter_number')
      .eq('patient_id', queueItem.patient_id)
      .gte('admission_date', today)
      .in('status', ['in_progress', 'admitted', 'waiting'])
      .limit(1)
      .single();
    return data || null;
  };

  const handleOpenDialog = async () => {
    if (queueItem.encounter_id) {
      navigate(`/encounter/${queueItem.encounter_id}`);
      return;
    }
    const existing = await checkExistingEncounter();
    setExistingEncounter(existing);
    setDialogOpen(true);
  };

  const handleUseExisting = async () => {
    if (!existingEncounter) return;
    try {
      await supabase.from('queue_items').update({ encounter_id: existingEncounter.id }).eq('id', queueItem.id);
      toast.success('Linked to existing encounter');
      setDialogOpen(false);
      navigate(`/encounter/${existingEncounter.id}`);
    } catch {
      toast.error('Failed to link encounter');
    }
  };

  const handleCreateNew = async () => {
    if (!queueItem.patient_id) {
      toast.error('Patient ID required');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('encounters')
        .insert([{
          patient_id: queueItem.patient_id,
          encounter_number: generateEncounterNumber(),
          encounter_type: formData.encounter_type,
          chief_complaint: formData.chief_complaint || null,
          status: 'in_progress',
          admission_date: new Date().toISOString(),
          attending_physician_id: user?.id,
          created_by: user?.id,
        }])
        .select('id, encounter_number')
        .single();

      if (error) throw error;

      await supabase.from('queue_items').update({ 
        encounter_id: data.id, 
        status: 'in_service', 
        in_service_at: new Date().toISOString() 
      }).eq('id', queueItem.id);

      toast.success(`Encounter ${data.encounter_number} created`);
      setDialogOpen(false);
      onEncounterCreated?.(data.id);
      navigate(`/encounter/${data.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create encounter');
    } finally {
      setLoading(false);
    }
  };

  const patientName = queueItem.patient ? `${queueItem.patient.first_name} ${queueItem.patient.last_name}` : 'Unknown Patient';

  return (
    <>
      <Button size="sm" onClick={handleOpenDialog}>
        <Stethoscope className="h-4 w-4 mr-2" />
        {queueItem.encounter_id ? 'Open Encounter' : 'Start Encounter'}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Start Clinical Encounter</DialogTitle>
            <DialogDescription>Begin clinical care for {patientName}</DialogDescription>
          </DialogHeader>

          {existingEncounter ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border bg-muted/50">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Existing Encounter Found</p>
                    <p className="text-sm text-muted-foreground">
                      Active encounter: <Badge variant="outline" className="ml-1">{existingEncounter.encounter_number}</Badge>
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={handleUseExisting}><FileText className="h-4 w-4 mr-2" />Continue with Existing</Button>
                <Button variant="outline" onClick={() => setExistingEncounter(null)}><UserPlus className="h-4 w-4 mr-2" />Create New Instead</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Encounter Type</Label>
                <Select value={formData.encounter_type} onValueChange={(v) => setFormData({ ...formData, encounter_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ENCOUNTER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Chief Complaint</Label>
                <Textarea value={formData.chief_complaint} onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })} rows={2} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateNew} disabled={loading || !queueItem.patient_id}>
                  {loading ? 'Creating...' : 'Create Encounter'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
