import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Users, 
  Search, 
  Edit, 
  ShieldAlert, 
  Shield,
  Loader2,
  UserCog,
  RefreshCw,
  History,
  Clock,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  role: 'doctor' | 'nurse' | 'specialist' | 'patient' | 'admin';
  specialty: string | null;
  department: string | null;
  phone: string | null;
  license_number: string | null;
  created_at: string;
  updated_at: string;
}

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  performed_by: string;
  old_value: any;
  new_value: any;
  metadata: any;
  created_at: string;
  performer_name?: string;
  target_name?: string;
}

const CLINICAL_ROLES = ['doctor', 'nurse', 'specialist', 'patient', 'admin'] as const;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasPermission, isRole } = usePermissions();
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editRole, setEditRole] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const canManageUsers = hasPermission('manage_users') || isRole('admin');

  useEffect(() => {
    if (canManageUsers) {
      fetchUsers();
      fetchAuditLogs();
    }
  }, [canManageUsers]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch users: ' + error.message);
    } else {
      setUsers(data as UserProfile[]);
    }
    setLoading(false);
  };

  const fetchAuditLogs = async () => {
    setLogsLoading(true);
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('entity_type', 'profile')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Failed to fetch audit logs:', error);
    } else if (data) {
      // Enrich with user names
      const enrichedLogs = await Promise.all(
        data.map(async (log) => {
          const performer = users.find(u => u.user_id === log.performed_by);
          const target = users.find(u => u.id === log.entity_id);
          return {
            ...log,
            performer_name: performer?.display_name || 'Unknown',
            target_name: target?.display_name || 'Unknown',
          };
        })
      );
      setAuditLogs(enrichedLogs as AuditLog[]);
    }
    setLogsLoading(false);
  };

  // Re-fetch logs when users are loaded to get names
  useEffect(() => {
    if (users.length > 0 && auditLogs.length > 0) {
      const enrichedLogs = auditLogs.map(log => {
        const performer = users.find(u => u.user_id === log.performed_by);
        const target = users.find(u => u.id === log.entity_id);
        return {
          ...log,
          performer_name: performer?.display_name || 'Unknown',
          target_name: target?.display_name || 'Unknown',
        };
      });
      setAuditLogs(enrichedLogs);
    }
  }, [users]);

  const handleEditUser = (userProfile: UserProfile) => {
    setEditingUser(userProfile);
    setEditRole(userProfile.role);
  };

  const handleSaveRole = async () => {
    if (!editingUser || !editRole || !user) return;

    setIsSaving(true);

    const oldRole = editingUser.role;

    const { error } = await supabase
      .from('profiles')
      .update({ role: editRole as any })
      .eq('id', editingUser.id);

    if (error) {
      toast.error('Failed to update role: ' + error.message);
    } else {
      // Log the change
      await supabase.from('audit_logs').insert({
        action: 'role_change',
        entity_type: 'profile',
        entity_id: editingUser.id,
        performed_by: user.id,
        old_value: { role: oldRole },
        new_value: { role: editRole },
        metadata: { 
          target_name: editingUser.display_name,
          target_user_id: editingUser.user_id 
        },
      });

      toast.success(`Updated ${editingUser.display_name}'s role to ${editRole}`);
      setUsers(prev => 
        prev.map(u => u.id === editingUser.id ? { ...u, role: editRole as any } : u)
      );
      setEditingUser(null);
      
      // Refresh audit logs
      fetchAuditLogs();
    }

    setIsSaving(false);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'doctor':
        return 'default';
      case 'specialist':
        return 'secondary';
      case 'nurse':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.department?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const userStats = {
    total: users.length,
    doctors: users.filter(u => u.role === 'doctor').length,
    nurses: users.filter(u => u.role === 'nurse').length,
    specialists: users.filter(u => u.role === 'specialist').length,
    admins: users.filter(u => u.role === 'admin').length,
  };

  if (!canManageUsers) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background p-4 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to access the admin dashboard. This feature is restricted to system administrators.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">Manage users and system settings</p>
            </div>
          </div>
          <Button variant="outline" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">{userStats.total}</div>
                <div className="text-xs text-muted-foreground">Total Users</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{userStats.doctors}</div>
              <div className="text-xs text-muted-foreground">Doctors</div>
            </CardContent>
          </Card>
          <Card className="bg-secondary/10 border-secondary/20">
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{userStats.specialists}</div>
              <div className="text-xs text-muted-foreground">Specialists</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{userStats.nurses}</div>
              <div className="text-xs text-muted-foreground">Nurses</div>
            </CardContent>
          </Card>
          <Card className="bg-destructive/5 border-destructive/20">
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{userStats.admins}</div>
              <div className="text-xs text-muted-foreground">Admins</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Users and Audit Logs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <UserCog className="w-4 h-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Audit Log
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="w-5 h-5" />
                  User Management
                </CardTitle>
                <CardDescription>
                  View and manage all registered users
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="doctor">Doctors</SelectItem>
                      <SelectItem value="nurse">Nurses</SelectItem>
                      <SelectItem value="specialist">Specialists</SelectItem>
                      <SelectItem value="patient">Patients</SelectItem>
                      <SelectItem value="admin">Admins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Users Table */}
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Specialty</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No users found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map((userProfile) => (
                          <TableRow key={userProfile.id}>
                            <TableCell>
                              <div className="font-medium">{userProfile.display_name}</div>
                              {userProfile.phone && (
                                <div className="text-xs text-muted-foreground">{userProfile.phone}</div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getRoleBadgeVariant(userProfile.role) as any}>
                                {userProfile.role.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {userProfile.specialty || '-'}
                            </TableCell>
                            <TableCell className="text-sm">
                              {userProfile.department || '-'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(userProfile.created_at), 'dd MMM yyyy')}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditUser(userProfile)}
                                disabled={userProfile.user_id === user?.id}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <History className="w-5 h-5" />
                      Audit Log
                    </CardTitle>
                    <CardDescription>
                      Track all role changes and administrative actions
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchAuditLogs} disabled={logsLoading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${logsLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : auditLogs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No audit logs yet</p>
                    <p className="text-sm">Role changes will appear here</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {auditLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="p-2 rounded-full bg-primary/10">
                            <Shield className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{log.performer_name || 'Unknown'}</span>
                              <span className="text-muted-foreground">changed role for</span>
                              <span className="font-medium">{log.metadata?.target_name || log.target_name || 'Unknown'}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant={getRoleBadgeVariant(log.old_value?.role || '') as any} className="text-xs">
                                {log.old_value?.role?.toUpperCase() || 'N/A'}
                              </Badge>
                              <ArrowRight className="w-4 h-4 text-muted-foreground" />
                              <Badge variant={getRoleBadgeVariant(log.new_value?.role || '') as any} className="text-xs">
                                {log.new_value?.role?.toUpperCase() || 'N/A'}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                            <Clock className="w-3 h-3" />
                            {format(new Date(log.created_at), 'dd MMM yyyy HH:mm')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Role Dialog */}
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User Role</DialogTitle>
              <DialogDescription>
                Change the clinical role for {editingUser?.display_name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Current Role</label>
                <Badge variant={getRoleBadgeVariant(editingUser?.role || '') as any}>
                  {editingUser?.role?.toUpperCase()}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">New Role</label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLINICAL_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {editRole === 'admin' && (
                <Alert>
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription>
                    Admin users have full access to the system including user management. 
                    Only assign this role to trusted personnel.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveRole} 
                disabled={isSaving || editRole === editingUser?.role}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminDashboard;
