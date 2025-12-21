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
  ArrowRight,
  Download,
  CalendarIcon,
  X
} from 'lucide-react';
import { format, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

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
  last_active_at: string | null;
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
  
  // Bulk selection
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkRole, setBulkRole] = useState<string>('');
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  
  // Date range filter for audit logs
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

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

      // Get current user's profile name for the notification
      const currentUserProfile = users.find(u => u.user_id === user.id);
      const changedByName = currentUserProfile?.display_name || 'An administrator';

      // Send email notification
      try {
        await supabase.functions.invoke('send-role-notification', {
          body: {
            userId: editingUser.user_id,
            oldRole: oldRole,
            newRole: editRole,
            changedByName: changedByName,
          },
        });
        toast.success(`Updated ${editingUser.display_name}'s role to ${editRole}. Notification sent.`);
      } catch (emailError) {
        console.error('Failed to send notification:', emailError);
        toast.success(`Updated ${editingUser.display_name}'s role to ${editRole}`);
      }

      setUsers(prev => 
        prev.map(u => u.id === editingUser.id ? { ...u, role: editRole as any } : u)
      );
      setEditingUser(null);
      
      // Refresh audit logs
      fetchAuditLogs();
    }

    setIsSaving(false);
  };

  // Bulk role assignment
  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const toggleSelectAll = () => {
    const selectableUsers = filteredUsers.filter(u => u.user_id !== user?.id);
    if (selectedUsers.size === selectableUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(selectableUsers.map(u => u.id)));
    }
  };

  const handleBulkRoleChange = async () => {
    if (!bulkRole || selectedUsers.size === 0 || !user) return;

    setIsBulkSaving(true);
    const currentUserProfile = users.find(u => u.user_id === user.id);
    const changedByName = currentUserProfile?.display_name || 'An administrator';

    let successCount = 0;
    let errorCount = 0;

    for (const profileId of selectedUsers) {
      const targetUser = users.find(u => u.id === profileId);
      if (!targetUser) continue;

      const oldRole = targetUser.role;

      const { error } = await supabase
        .from('profiles')
        .update({ role: bulkRole as any })
        .eq('id', profileId);

      if (error) {
        errorCount++;
        continue;
      }

      // Log the change
      await supabase.from('audit_logs').insert({
        action: 'role_change',
        entity_type: 'profile',
        entity_id: profileId,
        performed_by: user.id,
        old_value: { role: oldRole },
        new_value: { role: bulkRole },
        metadata: { 
          target_name: targetUser.display_name,
          target_user_id: targetUser.user_id,
          bulk_operation: true
        },
      });

      // Send email notification (fire and forget)
      supabase.functions.invoke('send-role-notification', {
        body: {
          userId: targetUser.user_id,
          oldRole: oldRole,
          newRole: bulkRole,
          changedByName: changedByName,
        },
      }).catch(console.error);

      successCount++;
    }

    // Update local state
    setUsers(prev => 
      prev.map(u => selectedUsers.has(u.id) ? { ...u, role: bulkRole as any } : u)
    );

    setSelectedUsers(new Set());
    setShowBulkDialog(false);
    setBulkRole('');
    setIsBulkSaving(false);

    if (successCount > 0) {
      toast.success(`Updated ${successCount} user${successCount > 1 ? 's' : ''} to ${bulkRole}`);
    }
    if (errorCount > 0) {
      toast.error(`Failed to update ${errorCount} user${errorCount > 1 ? 's' : ''}`);
    }

    fetchAuditLogs();
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

  const getActivityStatus = (lastActiveAt: string | null) => {
    if (!lastActiveAt) return { label: 'Never', color: 'text-muted-foreground' };
    
    const now = new Date();
    const lastActive = new Date(lastActiveAt);
    const diffMs = now.getTime() - lastActive.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 5) {
      return { label: 'Online now', color: 'text-green-500' };
    } else if (diffMins < 60) {
      return { label: `${diffMins}m ago`, color: 'text-yellow-500' };
    } else if (diffHours < 24) {
      return { label: `${diffHours}h ago`, color: 'text-orange-500' };
    } else if (diffDays < 7) {
      return { label: `${diffDays}d ago`, color: 'text-muted-foreground' };
    } else {
      return { label: format(lastActive, 'dd MMM'), color: 'text-muted-foreground' };
    }
  };

  // Filter audit logs by date range
  const filteredAuditLogs = auditLogs.filter(log => {
    const logDate = new Date(log.created_at);
    if (dateFrom && dateTo) {
      return isWithinInterval(logDate, { start: startOfDay(dateFrom), end: endOfDay(dateTo) });
    }
    if (dateFrom) {
      return logDate >= startOfDay(dateFrom);
    }
    if (dateTo) {
      return logDate <= endOfDay(dateTo);
    }
    return true;
  });

  const exportAuditLogsCSV = () => {
    if (filteredAuditLogs.length === 0) {
      toast.error('No audit logs to export');
      return;
    }

    const headers = ['Date', 'Time', 'Performed By', 'Target User', 'Previous Role', 'New Role', 'Action'];
    const rows = filteredAuditLogs.map(log => [
      format(new Date(log.created_at), 'yyyy-MM-dd'),
      format(new Date(log.created_at), 'HH:mm:ss'),
      log.performer_name || 'Unknown',
      log.metadata?.target_name || log.target_name || 'Unknown',
      log.old_value?.role || 'N/A',
      log.new_value?.role || 'N/A',
      log.action,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateRange = dateFrom || dateTo 
      ? `-${dateFrom ? format(dateFrom, 'yyyyMMdd') : 'start'}-to-${dateTo ? format(dateTo, 'yyyyMMdd') : 'end'}`
      : '';
    link.setAttribute('download', `audit-logs${dateRange}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${filteredAuditLogs.length} audit log entries`);
  };

  const clearDateFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
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

                {/* Bulk Action Bar */}
                {selectedUsers.size > 0 && (
                  <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <span className="text-sm font-medium">
                      {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} selected
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedUsers(new Set())}
                      >
                        Clear Selection
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setShowBulkDialog(true)}
                      >
                        Change Role
                      </Button>
                    </div>
                  </div>
                )}

                {/* Users Table */}
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedUsers.size > 0 && selectedUsers.size === filteredUsers.filter(u => u.user_id !== user?.id).length}
                            onCheckedChange={toggleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Last Active</TableHead>
                        <TableHead>Specialty</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No users found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map((userProfile) => (
                          <TableRow key={userProfile.id} className={selectedUsers.has(userProfile.id) ? 'bg-primary/5' : ''}>
                            <TableCell>
                              <Checkbox
                                checked={selectedUsers.has(userProfile.id)}
                                onCheckedChange={() => toggleUserSelection(userProfile.id)}
                                disabled={userProfile.user_id === user?.id}
                              />
                            </TableCell>
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
                            <TableCell>
                              {(() => {
                                const status = getActivityStatus(userProfile.last_active_at);
                                return (
                                  <span className={`text-sm font-medium ${status.color}`}>
                                    {status.label}
                                  </span>
                                );
                              })()}
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
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={exportAuditLogsCSV} disabled={filteredAuditLogs.length === 0}>
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV {filteredAuditLogs.length > 0 && `(${filteredAuditLogs.length})`}
                    </Button>
                    <Button variant="outline" size="sm" onClick={fetchAuditLogs} disabled={logsLoading}>
                      <RefreshCw className={`w-4 h-4 mr-2 ${logsLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </div>
                
                {/* Date Range Filters */}
                <div className="flex items-center gap-3 mt-4 flex-wrap">
                  <span className="text-sm text-muted-foreground">Filter by date:</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "w-[140px] justify-start text-left font-normal",
                          !dateFrom && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFrom ? format(dateFrom, "dd MMM yyyy") : "From"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <span className="text-muted-foreground">→</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "w-[140px] justify-start text-left font-normal",
                          !dateTo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateTo ? format(dateTo, "dd MMM yyyy") : "To"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  {(dateFrom || dateTo) && (
                    <Button variant="ghost" size="sm" onClick={clearDateFilters}>
                      <X className="w-4 h-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : filteredAuditLogs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{auditLogs.length === 0 ? 'No audit logs yet' : 'No logs match your date filter'}</p>
                    <p className="text-sm">{auditLogs.length === 0 ? 'Role changes will appear here' : 'Try adjusting the date range'}</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {filteredAuditLogs.map((log) => (
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

        {/* Bulk Role Change Dialog */}
        <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Role Assignment</DialogTitle>
              <DialogDescription>
                Change the role for {selectedUsers.size} selected user{selectedUsers.size > 1 ? 's' : ''}
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Selected Users</label>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                  {Array.from(selectedUsers).map(id => {
                    const u = users.find(user => user.id === id);
                    return u ? (
                      <Badge key={id} variant="outline" className="text-xs">
                        {u.display_name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">New Role for All</label>
                <Select value={bulkRole} onValueChange={setBulkRole}>
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

              {bulkRole === 'admin' && (
                <Alert>
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription>
                    You are about to grant admin access to {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''}. 
                    Admin users have full system access. Proceed with caution.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleBulkRoleChange} 
                disabled={isBulkSaving || !bulkRole}
              >
                {isBulkSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  `Update ${selectedUsers.size} User${selectedUsers.size > 1 ? 's' : ''}`
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
