import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { QueuePriority, QueueEntryType, QueueDefinition } from '@/types/queue';
import { QUEUE_PRIORITY_LABELS, QUEUE_ENTRY_TYPE_LABELS } from '@/types/queue';

interface AddToQueueDialogProps {
  queues: QueueDefinition[];
  defaultQueueId?: string;
  onSuccess?: () => void;
}

interface PatientSearchResult {
  id: string;
  first_name: string;
  last_name: string;
  mrn: string;
}

export function AddToQueueDialog({ queues, defaultQueueId, onSuccess }: AddToQueueDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PatientSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const [formData, setFormData] = useState({
    queue_id: defaultQueueId || '',
    patient_id: '',
    selected_patient: null as PatientSearchResult | null,
    health_id: '',
    entry_type: 'walk_in' as QueueEntryType,
    priority: 'routine' as QueuePriority,
    reason_for_visit: '',
    notes: '',
  });

  const searchPatients = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, first_name, last_name, mrn')
        .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,mrn.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      console.error('Error searching patients:', err);
    } finally {
      setSearching(false);
    }
  };

  const selectPatient = (patient: PatientSearchResult) => {
    setFormData({
      ...formData,
      patient_id: patient.id,
      selected_patient: patient,
    });
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleSubmit = async () => {
    if (!formData.queue_id) {
      toast.error('Please select a queue');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('queue_items')
        .insert([{
          queue_id: formData.queue_id,
          patient_id: formData.patient_id || null,
          health_id: formData.health_id || null,
          entry_type: formData.entry_type,
          priority: formData.priority,
          reason_for_visit: formData.reason_for_visit || null,
          notes: formData.notes || null,
        }]);

      if (error) throw error;

      toast.success('Patient added to queue');
      setOpen(false);
      setFormData({
        queue_id: defaultQueueId || '',
        patient_id: '',
        selected_patient: null,
        health_id: '',
        entry_type: 'walk_in',
        priority: 'routine',
        reason_for_visit: '',
        notes: '',
      });
      onSuccess?.();
    } catch (err) {
      console.error('Error adding to queue:', err);
      toast.error('Failed to add to queue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add to Queue
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Patient to Queue</DialogTitle>
          <DialogDescription>
            Register a walk-in patient or check in an appointment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Queue Selection */}
          <div className="space-y-2">
            <Label>Queue *</Label>
            <Select
              value={formData.queue_id}
              onValueChange={(v) => setFormData({ ...formData, queue_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select queue..." />
              </SelectTrigger>
              <SelectContent>
                {queues.map(q => (
                  <SelectItem key={q.id} value={q.id}>{q.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Patient Search */}
          <div className="space-y-2">
            <Label>Patient</Label>
            {formData.selected_patient ? (
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                <div>
                  <p className="font-medium">
                    {formData.selected_patient.first_name} {formData.selected_patient.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    MRN: {formData.selected_patient.mrn}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setFormData({ ...formData, patient_id: '', selected_patient: null })}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by name or MRN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchPatients()}
                  />
                  <Button variant="outline" onClick={searchPatients} disabled={searching}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                {searchResults.length > 0 && (
                  <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
                    {searchResults.map(p => (
                      <button
                        key={p.id}
                        className="w-full p-2 text-left hover:bg-muted/50 transition-colors"
                        onClick={() => selectPatient(p)}
                      >
                        <p className="font-medium text-sm">{p.first_name} {p.last_name}</p>
                        <p className="text-xs text-muted-foreground">MRN: {p.mrn}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Health ID (if no patient selected) */}
          {!formData.selected_patient && (
            <div className="space-y-2">
              <Label>Health ID (if known)</Label>
              <Input
                value={formData.health_id}
                onChange={(e) => setFormData({ ...formData, health_id: e.target.value })}
                placeholder="HID-..."
              />
            </div>
          )}

          {/* Entry Type & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Entry Type</Label>
              <Select
                value={formData.entry_type}
                onValueChange={(v) => setFormData({ ...formData, entry_type: v as QueueEntryType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['walk_in', 'appointment', 'referral', 'callback'] as QueueEntryType[]).map(t => (
                    <SelectItem key={t} value={t}>{QUEUE_ENTRY_TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(v) => setFormData({ ...formData, priority: v as QueuePriority })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['emergency', 'very_urgent', 'urgent', 'routine', 'scheduled'] as QueuePriority[]).map(p => (
                    <SelectItem key={p} value={p}>
                      <span className={QUEUE_PRIORITY_LABELS[p].color}>
                        {QUEUE_PRIORITY_LABELS[p].label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reason for Visit */}
          <div className="space-y-2">
            <Label>Reason for Visit</Label>
            <Textarea
              value={formData.reason_for_visit}
              onChange={(e) => setFormData({ ...formData, reason_for_visit: e.target.value })}
              placeholder="Chief complaint or reason..."
              rows={2}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !formData.queue_id}>
            {loading ? 'Adding...' : 'Add to Queue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
