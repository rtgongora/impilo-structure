import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  ShieldAlert, 
  RefreshCw, 
  Loader2,
  AlertTriangle,
  CheckCircle,
  Info,
  Lock,
  LogIn,
  LogOut,
  Bell,
  Filter
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SecurityEvent {
  id: string;
  event_type: string;
  severity: string;
  user_id: string | null;
  email: string | null;
  ip_address: string | null;
  user_agent: string | null;
  details: any;
  created_at: string;
}

const SecurityEvents: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('security_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error('Error fetching security events:', error);
      toast.error('Failed to fetch security events');
    } else {
      setEvents((data || []) as SecurityEvent[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Warning</Badge>;
      case 'info':
        return <Badge variant="secondary">Info</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('login_success')) return <LogIn className="w-4 h-4 text-green-500" />;
    if (eventType.includes('login_failed')) return <LogIn className="w-4 h-4 text-destructive" />;
    if (eventType.includes('locked')) return <Lock className="w-4 h-4 text-destructive" />;
    if (eventType.includes('logout') || eventType.includes('session')) return <LogOut className="w-4 h-4 text-muted-foreground" />;
    if (eventType.includes('notification')) return <Bell className="w-4 h-4 text-blue-500" />;
    return <ShieldAlert className="w-4 h-4 text-primary" />;
  };

  const getEventLabel = (eventType: string) => {
    const labels: Record<string, string> = {
      'login_success': 'Successful Login',
      'login_failed': 'Failed Login',
      'account_locked': 'Account Locked',
      'session_expired': 'Session Expired',
      'notification_session_expired': 'Expiry Notification Sent',
      'notification_account_locked': 'Lockout Notification Sent',
      'suspicious_activity': 'Suspicious Activity',
    };
    return labels[eventType] || eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const eventTypes = [...new Set(events.map(e => e.event_type))];

  const filteredEvents = events.filter(event => {
    const matchesSeverity = severityFilter === 'all' || event.severity === severityFilter;
    const matchesType = typeFilter === 'all' || event.event_type === typeFilter;
    return matchesSeverity && matchesType;
  });

  const stats = {
    total: events.length,
    critical: events.filter(e => e.severity === 'critical').length,
    warning: events.filter(e => e.severity === 'warning').length,
    today: events.filter(e => {
      const eventDate = new Date(e.created_at);
      const today = new Date();
      return eventDate.toDateString() === today.toDateString();
    }).length,
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              Security Events
            </CardTitle>
            <CardDescription>
              Monitor security-related events and alerts
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchEvents} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-3 rounded-lg border bg-muted/30">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total Events</div>
          </div>
          <div className="p-3 rounded-lg border bg-destructive/10 border-destructive/20">
            <div className="text-2xl font-bold text-destructive">{stats.critical}</div>
            <div className="text-xs text-muted-foreground">Critical</div>
          </div>
          <div className="p-3 rounded-lg border bg-yellow-500/10 border-yellow-500/20">
            <div className="text-2xl font-bold text-yellow-600">{stats.warning}</div>
            <div className="text-xs text-muted-foreground">Warnings</div>
          </div>
          <div className="p-3 rounded-lg border bg-primary/10 border-primary/20">
            <div className="text-2xl font-bold text-primary">{stats.today}</div>
            <div className="text-xs text-muted-foreground">Today</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filter:</span>
          </div>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Event Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {eventTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {getEventLabel(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Events List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ShieldAlert className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No security events found</p>
            <p className="text-sm">Events will appear when login attempts or security actions occur</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className={`p-3 rounded-lg border flex items-start gap-3 ${
                    event.severity === 'critical' ? 'bg-destructive/5 border-destructive/20' :
                    event.severity === 'warning' ? 'bg-yellow-500/5 border-yellow-500/20' :
                    'bg-card'
                  }`}
                >
                  <div className="p-2 rounded-full bg-muted">
                    {getEventIcon(event.event_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{getEventLabel(event.event_type)}</span>
                      {getSeverityBadge(event.severity)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {event.email && <span className="font-mono">{event.email}</span>}
                      {event.ip_address && <span className="ml-2">• IP: {event.ip_address}</span>}
                    </div>
                    {event.details?.message && (
                      <p className="text-sm mt-1">{event.details.message}</p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default SecurityEvents;
