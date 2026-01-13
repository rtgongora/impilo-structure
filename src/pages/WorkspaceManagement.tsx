import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSystemRoles } from "@/hooks/useSystemRoles";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Building2,
  MapPin,
  Plus,
  Search,
  Settings,
  Users,
  Clock,
  Activity,
  LayoutGrid,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  ShieldCheck,
  Layers,
  Filter,
} from "lucide-react";

interface Workspace {
  id: string;
  name: string;
  workspace_type: 'admin' | 'clinical' | 'support';
  location_code: string | null;
  description: string | null;
  is_active: boolean;
  facility_id: string | null;
  service_tags: string[] | null;
  created_at: string;
  facility?: {
    name: string;
  };
}

interface Facility {
  id: string;
  name: string;
  facility_type: string | null;
  province: string | null;
  is_active: boolean | null;
}

const WORKSPACE_TYPES = [
  { value: 'clinical', label: 'Clinical' },
  { value: 'admin', label: 'Administration' },
  { value: 'support', label: 'Support Services' },
] as const;

const WorkspaceManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isSuperAdmin, canBypassRestrictions, loading: rolesLoading } = useSystemRoles();
  
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterFacility, setFilterFacility] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  
  // Form state for creating/editing
  const [formData, setFormData] = useState({
    name: "",
    workspace_type: "",
    location_code: "",
    description: "",
    facility_id: "",
    is_active: true,
  });

  useEffect(() => {
    if (!rolesLoading && !canBypassRestrictions) {
      toast.error("Access denied. Admin privileges required.");
      navigate("/");
    }
  }, [rolesLoading, canBypassRestrictions, navigate]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch workspaces with facility info
      const { data: workspacesData, error: workspacesError } = await supabase
        .from('workspaces')
        .select(`
          *,
          facility:facilities(name)
        `)
        .order('name');

      if (workspacesError) throw workspacesError;

      // Fetch facilities for filtering/selection
      const { data: facilitiesData, error: facilitiesError } = await supabase
        .from('facilities')
        .select('id, name, facility_type, province, is_active')
        .eq('is_active', true)
        .order('name');

      if (facilitiesError) throw facilitiesError;

      setWorkspaces(workspacesData || []);
      setFacilities(facilitiesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load workspace data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!formData.name || !formData.workspace_type) {
      toast.error('Name and workspace type are required');
      return;
    }

    try {
      const { error } = await supabase
        .from('workspaces')
        .insert({
          name: formData.name,
          workspace_type: formData.workspace_type as 'admin' | 'clinical' | 'support',
          location_code: formData.location_code || null,
          description: formData.description || null,
          facility_id: formData.facility_id || null,
          is_active: formData.is_active,
          created_by: user?.id,
        });

      if (error) throw error;

      toast.success('Workspace created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error creating workspace:', error);
      toast.error('Failed to create workspace');
    }
  };

  const handleUpdateWorkspace = async () => {
    if (!selectedWorkspace) return;

    try {
      const { error } = await supabase
        .from('workspaces')
        .update({
          name: formData.name,
          workspace_type: formData.workspace_type as 'admin' | 'clinical' | 'support',
          location_code: formData.location_code || null,
          description: formData.description || null,
          facility_id: formData.facility_id || null,
          is_active: formData.is_active,
        })
        .eq('id', selectedWorkspace.id);

      if (error) throw error;

      toast.success('Workspace updated successfully');
      setSelectedWorkspace(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error updating workspace:', error);
      toast.error('Failed to update workspace');
    }
  };

  const handleDeleteWorkspace = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workspace?')) return;

    try {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Workspace deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting workspace:', error);
      toast.error('Failed to delete workspace');
    }
  };

  const handleToggleActive = async (workspace: Workspace) => {
    try {
      const { error } = await supabase
        .from('workspaces')
        .update({ is_active: !workspace.is_active })
        .eq('id', workspace.id);

      if (error) throw error;

      toast.success(`Workspace ${workspace.is_active ? 'deactivated' : 'activated'}`);
      fetchData();
    } catch (error) {
      console.error('Error toggling workspace:', error);
      toast.error('Failed to update workspace status');
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      workspace_type: "",
      location_code: "",
      description: "",
      facility_id: "",
      is_active: true,
    });
  };

  const openEditDialog = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    setFormData({
      name: workspace.name,
      workspace_type: workspace.workspace_type,
      location_code: workspace.location_code || "",
      description: workspace.description || "",
      facility_id: workspace.facility_id || "",
      is_active: workspace.is_active,
    });
  };

  const filteredWorkspaces = workspaces.filter(ws => {
    const matchesSearch = ws.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ws.location_code?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || ws.workspace_type === filterType;
    const matchesFacility = filterFacility === "all" || ws.facility_id === filterFacility;
    return matchesSearch && matchesType && matchesFacility;
  });

  const getWorkspaceTypeLabel = (type: string) => {
    return WORKSPACE_TYPES.find(t => t.value === type)?.label || type;
  };

  if (rolesLoading || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <LayoutGrid className="h-6 w-6 text-primary" />
              Workspace Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure and manage clinical workspaces across facilities
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canBypassRestrictions && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                <ShieldCheck className="h-3 w-3 mr-1" />
                Admin Access
              </Badge>
            )}
            <Button onClick={fetchData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Workspace
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Workspace</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Workspace Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., OPD Room 1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Workspace Type *</Label>
                    <Select
                      value={formData.workspace_type}
                      onValueChange={(v) => setFormData({ ...formData, workspace_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {WORKSPACE_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="facility">Facility</Label>
                    <Select
                      value={formData.facility_id}
                      onValueChange={(v) => setFormData({ ...formData, facility_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select facility" />
                      </SelectTrigger>
                      <SelectContent>
                        {facilities.map(f => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location Code</Label>
                    <Input
                      id="location"
                      value={formData.location_code}
                      onChange={(e) => setFormData({ ...formData, location_code: e.target.value })}
                      placeholder="e.g., BLDG-A-F2-R101"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Optional description"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_active">Active</Label>
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateWorkspace}>
                    Create Workspace
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <LayoutGrid className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{workspaces.length}</p>
                  <p className="text-xs text-muted-foreground">Total Workspaces</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Activity className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{workspaces.filter(w => w.is_active).length}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Building2 className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{facilities.length}</p>
                  <p className="text-xs text-muted-foreground">Facilities</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Layers className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {new Set(workspaces.map(w => w.workspace_type)).size}
                  </p>
                  <p className="text-xs text-muted-foreground">Workspace Types</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search workspaces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full md:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {WORKSPACE_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterFacility} onValueChange={setFilterFacility}>
            <SelectTrigger className="w-full md:w-[200px]">
              <Building2 className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by facility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Facilities</SelectItem>
              {facilities.map(f => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Workspaces List */}
        <ScrollArea className="h-[calc(100vh-400px)]">
          <div className="grid gap-4">
            {filteredWorkspaces.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <LayoutGrid className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No workspaces found</p>
                  <Button
                    variant="link"
                    className="mt-2"
                    onClick={() => { setSearchQuery(""); setFilterType("all"); setFilterFacility("all"); }}
                  >
                    Clear filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredWorkspaces.map((workspace) => (
                <Card key={workspace.id} className={!workspace.is_active ? "opacity-60" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{workspace.name}</h3>
                          <Badge variant={workspace.is_active ? "default" : "secondary"}>
                            {workspace.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">
                            {getWorkspaceTypeLabel(workspace.workspace_type)}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          {workspace.facility && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5" />
                              {workspace.facility.name}
                            </span>
                          )}
                          {workspace.location_code && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {workspace.location_code}
                            </span>
                          )}
                          {workspace.description && (
                            <span className="text-xs">{workspace.description}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(workspace)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(workspace)}
                        >
                          {workspace.is_active ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <Activity className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteWorkspace(workspace.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Edit Dialog */}
        <Dialog open={!!selectedWorkspace} onOpenChange={(open) => !open && setSelectedWorkspace(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Workspace</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Workspace Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">Workspace Type *</Label>
                <Select
                  value={formData.workspace_type}
                  onValueChange={(v) => setFormData({ ...formData, workspace_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {WORKSPACE_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-facility">Facility</Label>
                <Select
                  value={formData.facility_id}
                  onValueChange={(v) => setFormData({ ...formData, facility_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select facility" />
                  </SelectTrigger>
                  <SelectContent>
                    {facilities.map(f => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location Code</Label>
                <Input
                  id="edit-location"
                  value={formData.location_code}
                  onChange={(e) => setFormData({ ...formData, location_code: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-is_active">Active</Label>
                <Switch
                  id="edit-is_active"
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedWorkspace(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateWorkspace}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default WorkspaceManagement;
