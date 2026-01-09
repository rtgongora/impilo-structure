/**
 * HPR Audit Log Viewer
 * View all changes to provider registry records
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  FileText, 
  Search, 
  RefreshCw,
  User,
  Clock,
  ArrowRight,
  Filter,
  Download,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface AuditLogEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  performed_by: string;
  performed_by_name: string | null;
  council_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: any;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-100 text-green-800',
  update: 'bg-blue-100 text-blue-800',
  delete: 'bg-red-100 text-red-800',
  state_transition: 'bg-yellow-100 text-yellow-800',
  verify: 'bg-purple-100 text-purple-800',
  approve: 'bg-green-100 text-green-800',
  reject: 'bg-red-100 text-red-800',
  suspend: 'bg-orange-100 text-orange-800',
  revoke: 'bg-red-100 text-red-800',
};

export function HPRAuditLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  useEffect(() => {
    loadLogs();
  }, [entityTypeFilter, actionFilter]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('hpr_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (entityTypeFilter !== 'all') {
        query = query.eq('entity_type', entityTypeFilter);
      }
      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.entity_id.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.field_changed?.toLowerCase().includes(q) ||
      log.performed_by_name?.toLowerCase().includes(q)
    );
  });

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), 'dd MMM yyyy HH:mm');
    } catch {
      return date;
    }
  };

  const openDetail = (log: AuditLogEntry) => {
    setSelectedLog(log);
    setDetailDialogOpen(true);
  };

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'Entity Type', 'Entity ID', 'Action', 'Field Changed', 'Old Value', 'New Value', 'Performed By'],
      ...filteredLogs.map(log => [
        log.created_at,
        log.entity_type,
        log.entity_id,
        log.action,
        log.field_changed || '',
        log.old_value || '',
        log.new_value || '',
        log.performed_by_name || log.performed_by,
      ])
    ].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hpr-audit-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get unique values for filters
  const entityTypes = [...new Set(logs.map(l => l.entity_type))];
  const actions = [...new Set(logs.map(l => l.action))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Audit Log
          </h2>
          <p className="text-sm text-muted-foreground">
            Track all changes to the Health Provider Registry
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={loadLogs}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-64 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by entity ID, action, or user..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Entity Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            {entityTypes.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {actions.map(action => (
              <SelectItem key={action} value={action}>{action}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>
            {filteredLogs.length} entries found
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No audit log entries found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Performed By</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map(log => (
                    <TableRow key={log.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetail(log)}>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {formatDate(log.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="text-xs text-muted-foreground">{log.entity_type}</span>
                          <div className="font-mono text-xs truncate max-w-32">{log.entity_id.slice(0, 8)}...</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={ACTION_COLORS[log.action] || 'bg-muted'}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.field_changed ? (
                          <div className="text-sm">
                            <span className="font-medium">{log.field_changed}</span>
                            {log.old_value && log.new_value && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <span className="truncate max-w-16">{log.old_value}</span>
                                <ArrowRight className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate max-w-16">{log.new_value}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{log.performed_by_name || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Audit Log Entry</DialogTitle>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Timestamp</p>
                  <p className="font-medium">{formatDate(selectedLog.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Action</p>
                  <Badge className={ACTION_COLORS[selectedLog.action] || 'bg-muted'}>
                    {selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Entity Type</p>
                  <p className="font-medium">{selectedLog.entity_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Entity ID</p>
                  <p className="font-mono text-sm break-all">{selectedLog.entity_id}</p>
                </div>
              </div>

              {selectedLog.field_changed && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Field Changed</p>
                  <p className="font-medium">{selectedLog.field_changed}</p>
                </div>
              )}

              {(selectedLog.old_value || selectedLog.new_value) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Old Value</p>
                    <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm">
                      {selectedLog.old_value || '-'}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">New Value</p>
                    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm">
                      {selectedLog.new_value || '-'}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-1">Performed By</p>
                <p className="font-medium">{selectedLog.performed_by_name || 'Unknown'}</p>
                <p className="text-xs text-muted-foreground font-mono">{selectedLog.performed_by}</p>
              </div>

              {selectedLog.ip_address && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">IP Address</p>
                  <p className="font-mono text-sm">{selectedLog.ip_address}</p>
                </div>
              )}

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Metadata</p>
                  <pre className="p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
