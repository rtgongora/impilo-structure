/**
 * Professional Councils Management
 * Manage councils (MCAZ, NCZ, PCZ, etc.) and their administrators
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { 
  Building, 
  Plus, 
  Edit2, 
  Trash2, 
  Users, 
  Shield,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProfessionalCouncil {
  id: string;
  code: string;
  name: string;
  abbreviation: string;
  description: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  jurisdiction_cadres: string[];
  is_active: boolean;
  logo_url: string | null;
  created_at: string;
}

interface CouncilAdmin {
  id: string;
  council_id: string;
  user_id: string;
  role: string;
  can_verify_licenses: boolean;
  can_approve_registrations: boolean;
  can_suspend_providers: boolean;
  is_active: boolean;
  appointed_at: string;
}

export function ProfessionalCouncilsManager() {
  const [councils, setCouncils] = useState<ProfessionalCouncil[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCouncil, setSelectedCouncil] = useState<ProfessionalCouncil | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [councilToDelete, setCouncilToDelete] = useState<ProfessionalCouncil | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    abbreviation: '',
    description: '',
    website: '',
    email: '',
    phone: '',
    address: '',
    jurisdiction_cadres: '',
    is_active: true,
  });

  useEffect(() => {
    loadCouncils();
  }, []);

  const loadCouncils = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('professional_councils')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setCouncils(data || []);
    } catch (error) {
      console.error('Failed to load councils:', error);
      toast.error('Failed to load professional councils');
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (council?: ProfessionalCouncil) => {
    if (council) {
      setFormData({
        code: council.code,
        name: council.name,
        abbreviation: council.abbreviation,
        description: council.description || '',
        website: council.website || '',
        email: council.email || '',
        phone: council.phone || '',
        address: council.address || '',
        jurisdiction_cadres: council.jurisdiction_cadres?.join(', ') || '',
        is_active: council.is_active,
      });
      setSelectedCouncil(council);
    } else {
      setFormData({
        code: '',
        name: '',
        abbreviation: '',
        description: '',
        website: '',
        email: '',
        phone: '',
        address: '',
        jurisdiction_cadres: '',
        is_active: true,
      });
      setSelectedCouncil(null);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        code: formData.code.toUpperCase(),
        name: formData.name,
        abbreviation: formData.abbreviation.toUpperCase(),
        description: formData.description || null,
        website: formData.website || null,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        jurisdiction_cadres: formData.jurisdiction_cadres
          .split(',')
          .map(s => s.trim().toLowerCase().replace(/\s+/g, '_'))
          .filter(Boolean),
        is_active: formData.is_active,
      };

      if (selectedCouncil) {
        const { error } = await supabase
          .from('professional_councils')
          .update(payload)
          .eq('id', selectedCouncil.id);
        if (error) throw error;
        toast.success('Council updated successfully');
      } else {
        const { error } = await supabase
          .from('professional_councils')
          .insert(payload);
        if (error) throw error;
        toast.success('Council created successfully');
      }

      setDialogOpen(false);
      loadCouncils();
    } catch (error: any) {
      console.error('Failed to save council:', error);
      toast.error(error.message || 'Failed to save council');
    }
  };

  const handleDelete = async () => {
    if (!councilToDelete) return;
    
    try {
      const { error } = await supabase
        .from('professional_councils')
        .delete()
        .eq('id', councilToDelete.id);
      
      if (error) throw error;
      toast.success('Council deleted successfully');
      setDeleteDialogOpen(false);
      setCouncilToDelete(null);
      loadCouncils();
    } catch (error: any) {
      console.error('Failed to delete council:', error);
      toast.error(error.message || 'Failed to delete council');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Building className="h-5 w-5" />
            Professional Councils
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage regulatory councils and their jurisdictions
          </p>
        </div>
        <Button onClick={() => openEditDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Council
        </Button>
      </div>

      {/* Councils Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : councils.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            No professional councils configured
          </div>
        ) : (
          councils.map(council => (
            <Card key={council.id} className={!council.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{council.abbreviation}</CardTitle>
                    <CardDescription className="line-clamp-2">{council.name}</CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(council)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive"
                      onClick={() => { setCouncilToDelete(council); setDeleteDialogOpen(true); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {!council.is_active && (
                  <Badge variant="secondary">Inactive</Badge>
                )}
                
                {council.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{council.description}</p>
                )}

                <div className="space-y-1 text-sm">
                  {council.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {council.email}
                    </div>
                  )}
                  {council.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {council.phone}
                    </div>
                  )}
                  {council.website && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <ExternalLink className="h-3 w-3" />
                      <a href={council.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        Website
                      </a>
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Jurisdiction Cadres</p>
                  <div className="flex flex-wrap gap-1">
                    {council.jurisdiction_cadres?.slice(0, 4).map(cadre => (
                      <Badge key={cadre} variant="outline" className="text-xs capitalize">
                        {cadre.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                    {council.jurisdiction_cadres?.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{council.jurisdiction_cadres.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCouncil ? 'Edit Professional Council' : 'Add Professional Council'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code *</Label>
                <Input
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value })}
                  placeholder="MCAZ"
                />
              </div>
              <div className="space-y-2">
                <Label>Abbreviation *</Label>
                <Input
                  value={formData.abbreviation}
                  onChange={e => setFormData({ ...formData, abbreviation: e.target.value })}
                  placeholder="MCAZ"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Medical and Dental Practitioners Council of Zimbabwe"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the council's mandate..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="info@council.org.zw"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+263 4 123456"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Website</Label>
              <Input
                value={formData.website}
                onChange={e => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://www.council.org.zw"
              />
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main Street, Harare"
              />
            </div>

            <div className="space-y-2">
              <Label>Jurisdiction Cadres (comma-separated)</Label>
              <Input
                value={formData.jurisdiction_cadres}
                onChange={e => setFormData({ ...formData, jurisdiction_cadres: e.target.value })}
                placeholder="medical_doctor, dentist, dental_specialist"
              />
              <p className="text-xs text-muted-foreground">
                Enter cadre codes separated by commas
              </p>
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
              {selectedCouncil ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Council?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{councilToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
