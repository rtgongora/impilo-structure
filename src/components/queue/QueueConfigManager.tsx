import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, Settings, ArrowUpDown, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { QueueDefinition, QueueServiceType } from '@/types/queue';
import { QUEUE_SERVICE_TYPE_LABELS } from '@/types/queue';

interface QueueConfigManagerProps {
  facilityId?: string;
}

interface QueueFormData {
  name: string;
  description: string;
  service_type: QueueServiceType;
  sla_target_minutes: number;
  escalation_threshold_minutes: number;
  display_order: number;
  is_active: boolean;
  is_virtual: boolean;
}

const defaultFormData: QueueFormData = {
  name: '',
  description: '',
  service_type: 'opd_triage',
  sla_target_minutes: 60,
  escalation_threshold_minutes: 45,
  display_order: 0,
  is_active: true,
  is_virtual: false,
};

export function QueueConfigManager({ facilityId }: QueueConfigManagerProps) {
  const [queues, setQueues] = useState<QueueDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQueue, setEditingQueue] = useState<QueueDefinition | null>(null);
  const [formData, setFormData] = useState<QueueFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);

  const fetchQueues = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('queue_definitions')
        .select('*')
        .order('display_order');

      if (facilityId) {
        query = query.eq('facility_id', facilityId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setQueues((data || []) as QueueDefinition[]);
    } catch (err) {
      console.error('Error fetching queues:', err);
      toast.error('Failed to load queue configurations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueues();
  }, [facilityId]);

  const openCreateDialog = () => {
    setEditingQueue(null);
    setFormData({
      ...defaultFormData,
      display_order: queues.length,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (queue: QueueDefinition) => {
    setEditingQueue(queue);
    setFormData({
      name: queue.name,
      description: queue.description || '',
      service_type: queue.service_type,
      sla_target_minutes: queue.sla_target_minutes || 60,
      escalation_threshold_minutes: queue.escalation_threshold_minutes || 45,
      display_order: queue.display_order || 0,
      is_active: queue.is_active,
      is_virtual: queue.is_virtual || false,
    });
    setDialogOpen(true);
  };

  const duplicateQueue = (queue: QueueDefinition) => {
    setEditingQueue(null);
    setFormData({
      name: `${queue.name} (Copy)`,
      description: queue.description || '',
      service_type: queue.service_type,
      sla_target_minutes: queue.sla_target_minutes || 60,
      escalation_threshold_minutes: queue.escalation_threshold_minutes || 45,
      display_order: queues.length,
      is_active: true,
      is_virtual: queue.is_virtual || false,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Name is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        service_type: formData.service_type,
        sla_target_minutes: formData.sla_target_minutes,
        escalation_threshold_minutes: formData.escalation_threshold_minutes,
        display_order: formData.display_order,
        is_active: formData.is_active,
        is_virtual: formData.is_virtual,
        facility_id: facilityId || null,
      };

      if (editingQueue) {
        const { error } = await supabase
          .from('queue_definitions')
          .update(payload)
          .eq('id', editingQueue.id);
        if (error) throw error;
        toast.success('Queue updated');
      } else {
        const { error } = await supabase
          .from('queue_definitions')
          .insert([payload]);
        if (error) throw error;
        toast.success('Queue created');
      }

      setDialogOpen(false);
      fetchQueues();
    } catch (err: any) {
      console.error('Error saving queue:', err);
      toast.error(err.message || 'Failed to save queue');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (queue: QueueDefinition) => {
    if (!confirm(`Delete queue "${queue.name}"? This cannot be undone.`)) return;

    try {
      const { error } = await supabase
        .from('queue_definitions')
        .delete()
        .eq('id', queue.id);
      if (error) throw error;
      toast.success('Queue deleted');
      fetchQueues();
    } catch (err) {
      console.error('Error deleting queue:', err);
      toast.error('Failed to delete queue');
    }
  };

  const toggleActive = async (queue: QueueDefinition) => {
    try {
      const { error } = await supabase
        .from('queue_definitions')
        .update({ is_active: !queue.is_active })
        .eq('id', queue.id);
      if (error) throw error;
      toast.success(queue.is_active ? 'Queue deactivated' : 'Queue activated');
      fetchQueues();
    } catch (err) {
      console.error('Error toggling queue:', err);
    }
  };

  const serviceTypeOptions = Object.entries(QUEUE_SERVICE_TYPE_LABELS).map(([value, label]) => ({
    value: value as QueueServiceType,
    label,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Queue Configuration</h2>
          <p className="text-sm text-muted-foreground">
            Manage service points and queue settings
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Queue
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Configured Queues</CardTitle>
          <CardDescription>
            {queues.filter(q => q.is_active).length} active, {queues.filter(q => !q.is_active).length} inactive
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Service Type</TableHead>
                  <TableHead>SLA (min)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : queues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No queues configured. Create your first queue to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  queues.map(queue => (
                    <TableRow key={queue.id}>
                      <TableCell className="font-medium">{queue.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {QUEUE_SERVICE_TYPE_LABELS[queue.service_type]}
                        </Badge>
                      </TableCell>
                      <TableCell>{queue.sla_target_minutes || 60}</TableCell>
                      <TableCell>
                        <Badge variant={queue.is_active ? 'default' : 'secondary'}>
                          {queue.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(queue)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => duplicateQueue(queue)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleActive(queue)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(queue)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              {editingQueue ? 'Edit Queue' : 'Create New Queue'}
            </DialogTitle>
            <DialogDescription>
              Configure queue settings and SLA targets.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Queue Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., OPD General"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service_type">Service Type</Label>
              <Select
                value={formData.service_type}
                onValueChange={(v) => setFormData({ ...formData, service_type: v as QueueServiceType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypeOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this queue..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sla_target">SLA Target (min)</Label>
                <Input
                  id="sla_target"
                  type="number"
                  min={1}
                  value={formData.sla_target_minutes}
                  onChange={(e) => setFormData({ ...formData, sla_target_minutes: parseInt(e.target.value) || 60 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="escalation_threshold">Escalation Threshold (min)</Label>
                <Input
                  id="escalation_threshold"
                  type="number"
                  min={1}
                  value={formData.escalation_threshold_minutes}
                  onChange={(e) => setFormData({ ...formData, escalation_threshold_minutes: parseInt(e.target.value) || 45 })}
                />
              </div>
            </div>

            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_virtual"
                  checked={formData.is_virtual}
                  onCheckedChange={(v) => setFormData({ ...formData, is_virtual: v })}
                />
                <Label htmlFor="is_virtual">Virtual Queue</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingQueue ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
