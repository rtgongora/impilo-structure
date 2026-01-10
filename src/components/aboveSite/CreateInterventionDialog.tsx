import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import type { InterventionType } from '@/types/aboveSite';
import { INTERVENTION_TYPE_LABELS } from '@/types/aboveSite';
import type { CreateInterventionInput } from '@/hooks/useAboveSiteInterventions';

interface CreateInterventionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  onSubmit: (input: CreateInterventionInput) => Promise<unknown>;
}

interface Facility {
  id: string;
  name: string;
}

interface VirtualPool {
  id: string;
  name: string;
}

const interventionTypes: InterventionType[] = [
  'staff_redeployment',
  'coverage_approval',
  'queue_escalation',
  'virtual_pool_authorization',
  'facility_override',
  'emergency_response',
];

export function CreateInterventionDialog({
  open,
  onOpenChange,
  sessionId,
  onSubmit,
}: CreateInterventionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [pools, setPools] = useState<VirtualPool[]>([]);

  const [formData, setFormData] = useState({
    intervention_type: '' as InterventionType | '',
    title: '',
    description: '',
    target_facility_id: '',
    target_pool_id: '',
    reason: '',
    is_reversible: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      const [facilitiesRes, poolsRes] = await Promise.all([
        supabase.from('facilities').select('id, name').order('name').limit(50),
        supabase.from('virtual_pools').select('id, name').eq('is_active', true).order('name'),
      ]);

      if (facilitiesRes.data) setFacilities(facilitiesRes.data);
      if (poolsRes.data) setPools(poolsRes.data);
    };

    if (open) {
      fetchData();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.intervention_type || !formData.title || !formData.reason) return;

    setLoading(true);
    try {
      await onSubmit({
        session_id: sessionId,
        intervention_type: formData.intervention_type,
        title: formData.title,
        description: formData.description || undefined,
        target_facility_id: formData.target_facility_id || undefined,
        target_pool_id: formData.target_pool_id || undefined,
        reason: formData.reason,
        is_reversible: formData.is_reversible,
      });
      onOpenChange(false);
      setFormData({
        intervention_type: '',
        title: '',
        description: '',
        target_facility_id: '',
        target_pool_id: '',
        reason: '',
        is_reversible: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const showFacilitySelect = ['staff_redeployment', 'queue_escalation', 'facility_override', 'emergency_response'].includes(formData.intervention_type);
  const showPoolSelect = ['virtual_pool_authorization', 'staff_redeployment'].includes(formData.intervention_type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Intervention</DialogTitle>
          <DialogDescription>
            Initiate a controlled intervention within your jurisdiction.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Intervention Type *</Label>
            <Select
              value={formData.intervention_type}
              onValueChange={(value) =>
                setFormData({ ...formData, intervention_type: value as InterventionType })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                {interventionTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {INTERVENTION_TYPE_LABELS[type].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.intervention_type && (
              <p className="text-xs text-muted-foreground">
                {INTERVENTION_TYPE_LABELS[formData.intervention_type].description}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brief title for this intervention"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Additional details..."
              rows={2}
            />
          </div>

          {showFacilitySelect && (
            <div className="space-y-2">
              <Label htmlFor="facility">Target Facility</Label>
              <Select
                value={formData.target_facility_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, target_facility_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select facility..." />
                </SelectTrigger>
                <SelectContent>
                  {facilities.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {showPoolSelect && (
            <div className="space-y-2">
              <Label htmlFor="pool">Target Virtual Pool</Label>
              <Select
                value={formData.target_pool_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, target_pool_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pool..." />
                </SelectTrigger>
                <SelectContent>
                  {pools.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Why is this intervention necessary?"
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reversible">Reversible</Label>
              <p className="text-xs text-muted-foreground">
                Can this intervention be undone?
              </p>
            </div>
            <Switch
              id="reversible"
              checked={formData.is_reversible}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_reversible: checked })
              }
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.intervention_type || !formData.title || !formData.reason}
            >
              {loading ? 'Creating...' : 'Create Intervention'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
