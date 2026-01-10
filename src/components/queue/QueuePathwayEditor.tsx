import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, GitBranch } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface QueuePathway {
  id: string;
  facility_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  pathway_steps: { from_queue_id: string; to_queue_id: string; condition?: string }[];
  created_at: string;
  updated_at: string;
}

interface QueuePathwayEditorProps {
  facilityId?: string;
}

export function QueuePathwayEditor({ facilityId }: QueuePathwayEditorProps) {
  const [pathways, setPathways] = useState<QueuePathway[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPathway, setEditingPathway] = useState<QueuePathway | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      let query = supabase.from('queue_pathways').select('*').order('name');
      if (facilityId) query = query.eq('facility_id', facilityId);
      const { data, error } = await query;
      if (error) throw error;
      setPathways((data || []) as QueuePathway[]);
    } catch (err) {
      console.error('Error fetching pathways:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [facilityId]);

  const openCreateDialog = () => {
    setEditingPathway(null);
    setFormData({ name: '', description: '', is_active: true });
    setDialogOpen(true);
  };

  const openEditDialog = (pathway: QueuePathway) => {
    setEditingPathway(pathway);
    setFormData({
      name: pathway.name,
      description: pathway.description || '',
      is_active: pathway.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) { toast.error('Name is required'); return; }
    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        is_active: formData.is_active,
        facility_id: facilityId || '',
        pathway_steps: [],
      };
      if (editingPathway) {
        const { error } = await supabase.from('queue_pathways').update(payload).eq('id', editingPathway.id);
        if (error) throw error;
        toast.success('Pathway updated');
      } else {
        const { error } = await supabase.from('queue_pathways').insert([payload]);
        if (error) throw error;
        toast.success('Pathway created');
      }
      setDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    }
  };

  const handleDelete = async (pathway: QueuePathway) => {
    if (!confirm(`Delete "${pathway.name}"?`)) return;
    try {
      const { error } = await supabase.from('queue_pathways').delete().eq('id', pathway.id);
      if (error) throw error;
      toast.success('Deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Queue Pathways</h2>
          <p className="text-sm text-muted-foreground">Define patient flow between service points</p>
        </div>
        <Button onClick={openCreateDialog}><Plus className="h-4 w-4 mr-2" />Add Pathway</Button>
      </div>

      {loading ? (
        <Card><CardContent className="py-12 text-center">Loading...</CardContent></Card>
      ) : pathways.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GitBranch className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">No pathways configured.</p>
            <Button onClick={openCreateDialog}><Plus className="h-4 w-4 mr-2" />Create First Pathway</Button>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {pathways.map(pathway => (
              <Card key={pathway.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      {pathway.name}
                      <Badge variant={pathway.is_active ? 'default' : 'secondary'}>
                        {pathway.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(pathway)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(pathway)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                </CardHeader>
                {pathway.description && (
                  <CardContent className="pt-0"><p className="text-sm text-muted-foreground">{pathway.description}</p></CardContent>
                )}
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPathway ? 'Edit Pathway' : 'Create Pathway'}</DialogTitle>
            <DialogDescription>Define patient flow pathway.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., OPD to Lab" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={formData.is_active} onCheckedChange={(v) => setFormData({ ...formData, is_active: v })} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingPathway ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
