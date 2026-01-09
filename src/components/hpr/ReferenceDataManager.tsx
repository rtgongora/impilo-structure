/**
 * Reference Data Manager
 * Manage lookup lists: cadres, specializations, education levels, salary grades, etc.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Database, 
  Plus, 
  Edit2, 
  Trash2,
  GraduationCap,
  Briefcase,
  DollarSign,
  Calendar,
  Stethoscope,
  Users,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface RefItem {
  id: string;
  code: string;
  name: string;
  category?: string;
  description?: string;
  is_active: boolean;
}

type RefTableType = 
  | 'ref_education_levels'
  | 'ref_training_types'
  | 'ref_salary_grades'
  | 'ref_leave_types'
  | 'ref_classifications'
  | 'ref_specializations'
  | 'ref_funds_sources'
  | 'ref_employment_types'
  | 'ref_cadres';

const REF_TABLES: { type: RefTableType; label: string; icon: any }[] = [
  { type: 'ref_cadres', label: 'Cadres', icon: Users },
  { type: 'ref_specializations', label: 'Specializations', icon: Stethoscope },
  { type: 'ref_education_levels', label: 'Education Levels', icon: GraduationCap },
  { type: 'ref_training_types', label: 'Training Types', icon: GraduationCap },
  { type: 'ref_salary_grades', label: 'Salary Grades', icon: DollarSign },
  { type: 'ref_funds_sources', label: 'Funds Sources', icon: DollarSign },
  { type: 'ref_leave_types', label: 'Leave Types', icon: Calendar },
  { type: 'ref_employment_types', label: 'Employment Types', icon: Briefcase },
  { type: 'ref_classifications', label: 'Classifications', icon: Briefcase },
];

export function ReferenceDataManager() {
  const [activeTable, setActiveTable] = useState<RefTableType>('ref_cadres');
  const [items, setItems] = useState<RefItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RefItem | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: '',
    description: '',
    is_active: true,
  });

  useEffect(() => {
    loadItems();
  }, [activeTable]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(activeTable)
        .select('*')
        .order('name');
      
      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error(`Failed to load ${activeTable}:`, error);
      // Table might not exist yet
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (item?: RefItem) => {
    if (item) {
      setFormData({
        code: item.code,
        name: item.name,
        category: (item as any).category || '',
        description: (item as any).description || '',
        is_active: item.is_active,
      });
      setSelectedItem(item);
    } else {
      setFormData({
        code: '',
        name: '',
        category: '',
        description: '',
        is_active: true,
      });
      setSelectedItem(null);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload: any = {
        code: formData.code.toLowerCase().replace(/\s+/g, '_'),
        name: formData.name,
        is_active: formData.is_active,
      };
      
      // Add optional fields if they exist for this table
      if (formData.category) payload.category = formData.category;
      if (formData.description) payload.description = formData.description;

      if (selectedItem) {
        const { error } = await supabase
          .from(activeTable)
          .update(payload)
          .eq('id', selectedItem.id);
        if (error) throw error;
        toast.success('Item updated successfully');
      } else {
        const { error } = await supabase
          .from(activeTable)
          .insert(payload);
        if (error) throw error;
        toast.success('Item created successfully');
      }

      setDialogOpen(false);
      loadItems();
    } catch (error: any) {
      console.error('Failed to save item:', error);
      toast.error(error.message || 'Failed to save item');
    }
  };

  const handleToggleActive = async (item: RefItem) => {
    try {
      const { error } = await supabase
        .from(activeTable)
        .update({ is_active: !item.is_active })
        .eq('id', item.id);
      
      if (error) throw error;
      toast.success(`Item ${item.is_active ? 'deactivated' : 'activated'}`);
      loadItems();
    } catch (error: any) {
      console.error('Failed to toggle item:', error);
      toast.error(error.message || 'Failed to update item');
    }
  };

  const handleDelete = async (item: RefItem) => {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    
    try {
      const { error } = await supabase
        .from(activeTable)
        .delete()
        .eq('id', item.id);
      
      if (error) throw error;
      toast.success('Item deleted successfully');
      loadItems();
    } catch (error: any) {
      console.error('Failed to delete item:', error);
      toast.error(error.message || 'Failed to delete item');
    }
  };

  const currentTableConfig = REF_TABLES.find(t => t.type === activeTable);
  const IconComponent = currentTableConfig?.icon || Database;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Database className="h-5 w-5" />
            Reference Data
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage lookup lists and configuration values
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadItems}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => openDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Table Selector */}
      <div className="flex flex-wrap gap-2">
        {REF_TABLES.map(table => (
          <Button
            key={table.type}
            variant={activeTable === table.type ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTable(table.type)}
          >
            <table.icon className="h-4 w-4 mr-2" />
            {table.label}
          </Button>
        ))}
      </div>

      {/* Items Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <IconComponent className="h-5 w-5" />
            {currentTableConfig?.label}
          </CardTitle>
          <CardDescription>
            {items.length} items configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No items configured for this reference table
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.id} className={!item.is_active ? 'opacity-50' : ''}>
                    <TableCell className="font-mono text-sm">{item.code}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {(item as any).category || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.is_active ? 'default' : 'secondary'}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openDialog(item)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleToggleActive(item)}
                        >
                          <Switch checked={item.is_active} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive"
                          onClick={() => handleDelete(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? 'Edit Item' : 'Add Item'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code *</Label>
                <Input
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., medical_doctor"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Medical"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Medical Doctor"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description..."
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={checked => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>
              {selectedItem ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
