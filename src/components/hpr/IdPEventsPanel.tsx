/**
 * IdP Events Panel - Real-time revocation events and access control monitoring
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import {
  Key,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Search,
  Clock,
  Shield,
  Zap,
  Activity,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { IdPRevocationEvent, RevocationEventType } from '@/types/hpr';

const EVENT_TYPE_META: Record<RevocationEventType, { label: string; color: string; icon: typeof AlertTriangle }> = {
  license_expired: { label: 'License Expired', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  provider_suspended: { label: 'Provider Suspended', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
  provider_revoked: { label: 'Provider Revoked', color: 'bg-red-100 text-red-800', icon: XCircle },
  privilege_revoked: { label: 'Privilege Revoked', color: 'bg-purple-100 text-purple-800', icon: Shield },
  affiliation_ended: { label: 'Affiliation Ended', color: 'bg-blue-100 text-blue-800', icon: Activity },
};

export function IdPEventsPanel() {
  const [events, setEvents] = useState<IdPRevocationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    last24h: 0,
    pending: 0,
  });

  useEffect(() => {
    loadEvents();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('idp-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'idp_revocation_events',
        },
        (payload) => {
          setEvents((prev) => [payload.new as IdPRevocationEvent, ...prev]);
          setStats((prev) => ({ ...prev, total: prev.total + 1, last24h: prev.last24h + 1 }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventTypeFilter]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('idp_revocation_events')
        .select('*')
        .order('triggered_at', { ascending: false })
        .limit(100);

      if (eventTypeFilter !== 'all') {
        query = query.eq('event_type', eventTypeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setEvents((data || []) as unknown as IdPRevocationEvent[]);

      // Calculate stats
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const { count: totalCount } = await supabase
        .from('idp_revocation_events')
        .select('*', { count: 'exact', head: true });

      const { count: last24hCount } = await supabase
        .from('idp_revocation_events')
        .select('*', { count: 'exact', head: true })
        .gte('triggered_at', oneDayAgo.toISOString());

      const { count: pendingCount } = await supabase
        .from('idp_revocation_events')
        .select('*', { count: 'exact', head: true })
        .is('processed_at', null);

      setStats({
        total: totalCount || 0,
        last24h: last24hCount || 0,
        pending: pendingCount || 0,
      });
    } catch (error) {
      console.error('Failed to load IdP events:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((event) => {
    if (!searchQuery) return true;
    return event.provider_id?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getEventMeta = (type: RevocationEventType) => {
    return EVENT_TYPE_META[type] || { label: type, color: 'bg-muted', icon: Activity };
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-primary">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Events</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-orange-600">{stats.last24h}</div>
            <div className="text-sm text-muted-foreground">Last 24 Hours</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending Processing</div>
          </CardContent>
        </Card>
      </div>

      {/* Event Type Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Revocation Event Types
          </CardTitle>
          <CardDescription>
            Events triggered by lifecycle changes, license expiry, or privilege revocations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(EVENT_TYPE_META).map(([type, meta]) => {
              const Icon = meta.icon;
              const count = events.filter(e => e.event_type === type).length;
              return (
                <div 
                  key={type} 
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    eventTypeFilter === type ? 'ring-2 ring-primary' : ''
                  } ${meta.color}`}
                  onClick={() => setEventTypeFilter(eventTypeFilter === type ? 'all' : type)}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="font-medium text-sm">{count}</span>
                  </div>
                  <p className="text-xs mt-1">{meta.label}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Recent IdP Events
              </CardTitle>
              <CardDescription>
                Real-time feed of access revocation and enforcement events
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadEvents}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by provider ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Event Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Event Types</SelectItem>
                {Object.entries(EVENT_TYPE_META).map(([type, meta]) => (
                  <SelectItem key={type} value={type}>{meta.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Triggered</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Tokens</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filteredEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No revocation events found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvents.map((event) => {
                    const meta = getEventMeta(event.event_type);
                    const Icon = meta.icon;
                    return (
                      <TableRow key={event.id}>
                        <TableCell>
                          <Badge className={meta.color}>
                            <Icon className="h-3 w-3 mr-1" />
                            {meta.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {event.provider_id?.substring(0, 8)}...
                        </TableCell>
                        <TableCell className="text-xs">
                          {event.source_entity_type || '-'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(event.triggered_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-xs">
                            {event.sessions_revoked}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-xs">
                            {event.tokens_invalidated}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {event.processed_at ? (
                            <Badge className="bg-green-100 text-green-800">Processed</Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Enforcement Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              Trigger Conditions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5 text-yellow-600" />
                <span><strong>License Expiry:</strong> Automatic at midnight on expiry date</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 text-orange-600" />
                <span><strong>Provider Suspended:</strong> Council or admin action</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="h-4 w-4 mt-0.5 text-red-600" />
                <span><strong>Provider Revoked:</strong> Permanent bar by council</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="h-4 w-4 mt-0.5 text-purple-600" />
                <span><strong>Privilege Revoked:</strong> Specific privilege removed</span>
              </li>
              <li className="flex items-start gap-2">
                <Activity className="h-4 w-4 mt-0.5 text-blue-600" />
                <span><strong>Affiliation Ended:</strong> Employment terminated</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              Enforcement Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <XCircle className="h-4 w-4 mt-0.5 text-red-600" />
                <span><strong>Immediate Session Revocation:</strong> All active sessions invalidated</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="h-4 w-4 mt-0.5 text-red-600" />
                <span><strong>Token Invalidation:</strong> JWT tokens blacklisted</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="h-4 w-4 mt-0.5 text-red-600" />
                <span><strong>Re-auth Block:</strong> Login prevented until resolved</span>
              </li>
              <li className="flex items-start gap-2">
                <Activity className="h-4 w-4 mt-0.5 text-primary" />
                <span><strong>Realtime Broadcast:</strong> All clients notified via WebSocket</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
