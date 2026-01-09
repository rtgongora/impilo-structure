/**
 * Reference Data Manager
 * Manage lookup lists organized by iHRIS categories:
 * Job Lists, Education Lists, Position Lists, Other Lists, Geography, Facility Data
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  MapPin,
  Building2,
  Settings2,
  ChevronRight,
  Search,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface RefItem {
  id: string;
  code: string;
  name: string;
  is_active?: boolean;
  [key: string]: any;
}

// Define reference data categories matching iHRIS structure
const referenceCategories = {
  job: {
    label: 'Job Lists',
    icon: Briefcase,
    tables: [
      { name: 'ref_cadres', label: 'Cadres', columns: ['code', 'name', 'category'] },
      { name: 'ref_classifications', label: 'Classifications', columns: ['code', 'name', 'description'] },
      { name: 'ref_salary_grades', label: 'Salary Grades', columns: ['code', 'name', 'min_salary', 'max_salary'] },
      { name: 'ref_funds_sources', label: 'Salary Sources', columns: ['code', 'name'] },
      { name: 'ref_job_titles', label: 'Job Titles', columns: ['code', 'name', 'description'] },
      { name: 'ref_job_types', label: 'Job Types', columns: ['code', 'name'] },
    ]
  },
  education: {
    label: 'Education Lists',
    icon: GraduationCap,
    tables: [
      { name: 'ref_education_majors', label: 'Educational Majors', columns: ['code', 'name', 'field_of_study'] },
      { name: 'ref_degrees', label: 'Degrees/Courses', columns: ['code', 'name', 'duration_years'] },
      { name: 'ref_education_levels', label: 'Education Levels', columns: ['code', 'name'] },
      { name: 'ref_institution_types', label: 'Institution Types', columns: ['code', 'name'] },
      { name: 'ref_institutions', label: 'Institutions', columns: ['code', 'name', 'country', 'city'] },
    ]
  },
  position: {
    label: 'Position Lists',
    icon: Users,
    tables: [
      { name: 'ref_employment_statuses', label: 'Employment Status', columns: ['code', 'name'] },
      { name: 'ref_departure_reasons', label: 'Departure Reasons', columns: ['code', 'name', 'category'] },
      { name: 'ref_employment_types', label: 'Employment Types', columns: ['code', 'name'] },
      { name: 'ref_pay_frequencies', label: 'Pay Frequencies', columns: ['code', 'name', 'periods_per_year'] },
    ]
  },
  other: {
    label: 'Other Lists',
    icon: Settings2,
    tables: [
      { name: 'ref_identifier_types', label: 'Identifier Types', columns: ['code', 'name', 'is_required'] },
      { name: 'ref_leave_types', label: 'Leave Types', columns: ['code', 'name', 'max_days_per_year', 'is_paid'] },
      { name: 'ref_discipline_actions', label: 'Discipline Actions', columns: ['code', 'name', 'severity'] },
      { name: 'ref_training_types', label: 'Training Types', columns: ['code', 'name', 'category'] },
      { name: 'ref_specializations', label: 'Specializations', columns: ['code', 'name'] },
    ]
  },
  geography: {
    label: 'Geographical Info',
    icon: MapPin,
    tables: [
      { name: 'ref_countries', label: 'Countries', columns: ['code', 'name', 'iso_code'] },
      { name: 'ref_regions', label: 'Regions/Provinces', columns: ['code', 'name'] },
      { name: 'ref_districts', label: 'Districts', columns: ['code', 'name'] },
      { name: 'ref_nationalities', label: 'Nationalities', columns: ['code', 'name'] },
    ]
  },
  facility: {
    label: 'Facility Data',
    icon: Building2,
    tables: [
      { name: 'ref_facility_types', label: 'Facility Types', columns: ['code', 'name', 'level'] },
    ]
  },
};

type CategoryKey = keyof typeof referenceCategories;

export function ReferenceDataManager() {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('job');
  const [activeTable, setActiveTable] = useState(referenceCategories.job.tables[0].name);
  const [items, setItems] = useState<RefItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RefItem | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({
    code: '',
    name: '',
    is_active: true,
  });

  const currentCategory = referenceCategories[activeCategory];
  const currentTableConfig = currentCategory.tables.find(t => t.name === activeTable) || currentCategory.tables[0];

  useEffect(() => {
    loadItems();
  }, [activeTable]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(activeTable as any)
        .select('*')
        .order('code');
      
      if (error) throw error;
      setItems((data as unknown as RefItem[]) || []);
    } catch (error) {
      console.error(`Failed to load ${activeTable}:`, error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (item?: RefItem) => {
    if (item) {
      const data: Record<string, any> = { ...item };
      setFormData(data);
      setSelectedItem(item);
    } else {
      const initialData: Record<string, any> = { code: '', name: '', is_active: true };
      currentTableConfig.columns.forEach(col => {
        if (!initialData[col]) initialData[col] = '';
      });
      setFormData(initialData);
      setSelectedItem(null);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload: any = { ...formData };
      delete payload.id;
      delete payload.created_at;
      delete payload.updated_at;
      
      // Ensure code is uppercase
      if (payload.code) {
        payload.code = payload.code.toUpperCase().replace(/\s+/g, '_');
      }

      if (selectedItem) {
        const { error } = await supabase
          .from(activeTable as any)
          .update(payload)
          .eq('id', selectedItem.id);
        if (error) throw error;
        toast.success('Item updated successfully');
      } else {
        const { error } = await supabase
          .from(activeTable as any)
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

  const handleDelete = async (item: RefItem) => {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    
    try {
      const { error } = await supabase
        .from(activeTable as any)
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

  const handleCategoryChange = (category: CategoryKey) => {
    setActiveCategory(category);
    setActiveTable(referenceCategories[category].tables[0].name);
    setSearchTerm('');
  };

  const filteredItems = items.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const IconComponent = currentCategory.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            Reference Data Manager
          </h2>
          <p className="text-muted-foreground">
            Manage system reference lists and lookup values (iHRIS-style)
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          {Object.values(referenceCategories).reduce((acc, cat) => acc + cat.tables.length, 0)} Tables
        </Badge>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Categories Sidebar */}
        <div className="col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="space-y-1 p-2">
                  {(Object.entries(referenceCategories) as [CategoryKey, typeof referenceCategories[CategoryKey]][]).map(([key, category]) => {
                    const Icon = category.icon;
                    const isActive = activeCategory === key;
                    return (
                      <div key={key}>
                        <button
                          onClick={() => handleCategoryChange(key)}
                          className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition-colors ${
                            isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {category.label}
                          </span>
                          <Badge variant={isActive ? 'secondary' : 'outline'} className="text-xs">
                            {category.tables.length}
                          </Badge>
                        </button>
                        {isActive && (
                          <div className="ml-4 mt-1 space-y-1">
                            {category.tables.map(table => (
                              <button
                                key={table.name}
                                onClick={() => setActiveTable(table.name)}
                                className={`w-full flex items-center gap-2 p-2 rounded text-xs transition-colors ${
                                  activeTable === table.name 
                                    ? 'bg-muted font-medium' 
                                    : 'hover:bg-muted/50 text-muted-foreground'
                                }`}
                              >
                                <ChevronRight className="h-3 w-3" />
                                {table.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="col-span-9">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <IconComponent className="h-5 w-5" />
                    {currentTableConfig.label}
                  </CardTitle>
                  <CardDescription>
                    {items.length} items configured
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-[200px]"
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={loadItems}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button onClick={() => openDialog()} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add New
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <Database className="h-12 w-12 mb-4 opacity-50" />
                  <p>No items found</p>
                  <Button variant="link" onClick={() => openDialog()}>Add the first item</Button>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        {currentTableConfig.columns.slice(2).map(col => (
                          <TableHead key={col} className="capitalize">
                            {col.replace(/_/g, ' ')}
                          </TableHead>
                        ))}
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.map((item) => (
                        <TableRow key={item.id} className={item.is_active === false ? 'opacity-50' : ''}>
                          <TableCell className="font-mono text-sm">{item.code}</TableCell>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          {currentTableConfig.columns.slice(2).map(col => (
                            <TableCell key={col}>
                              {typeof item[col] === 'boolean' 
                                ? (item[col] ? 'Yes' : 'No')
                                : item[col] || '-'
                              }
                            </TableCell>
                          ))}
                          <TableCell>
                            <Badge variant={item.is_active !== false ? 'default' : 'secondary'}>
                              {item.is_active !== false ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => openDialog(item)}
                              >
                                <Edit2 className="h-4 w-4" />
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
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit/Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? 'Edit' : 'Add'} {currentTableConfig.label.replace(/s$/, '')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code || ''}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="Unique code"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Display name"
                />
              </div>
            </div>
            {currentTableConfig.columns.slice(2).map(col => (
              <div key={col} className="space-y-2">
                <Label htmlFor={col} className="capitalize">{col.replace(/_/g, ' ')}</Label>
                {col.startsWith('is_') ? (
                  <div className="flex items-center gap-2">
                    <Switch
                      id={col}
                      checked={formData[col] || false}
                      onCheckedChange={(checked) => setFormData({ ...formData, [col]: checked })}
                    />
                    <span className="text-sm text-muted-foreground">
                      {formData[col] ? 'Yes' : 'No'}
                    </span>
                  </div>
                ) : (
                  <Input
                    id={col}
                    value={formData[col] || ''}
                    onChange={(e) => setFormData({ ...formData, [col]: e.target.value })}
                    placeholder={`Enter ${col.replace(/_/g, ' ')}`}
                    type={col.includes('_year') || col.includes('salary') || col.includes('periods') ? 'number' : 'text'}
                  />
                )}
              </div>
            ))}
            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active !== false}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active</Label>
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
