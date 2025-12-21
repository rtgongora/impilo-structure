import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Loader2, Monitor, Smartphone, Globe, LogOut, Shield, RefreshCw } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface UserSession {
  id: string;
  session_token: string;
  ip_address: string | null;
  user_agent: string | null;
  location: string | null;
  device_info: string | null;
  started_at: string;
  last_activity_at: string;
  is_active: boolean;
}

export function UserSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [currentSessionToken, setCurrentSessionToken] = useState<string | null>(null);

  const fetchSessions = async () => {
    if (!user) return;
    
    setLoading(true);

    // Get current session token
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setCurrentSessionToken(session.access_token.slice(-20));
    }

    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('last_activity_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch sessions:', error);
    } else {
      setSessions(data as UserSession[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchSessions();
  }, [user]);

  const revokeSession = async (sessionId: string) => {
    setRevokingId(sessionId);

    const { error } = await supabase
      .from('user_sessions')
      .update({ 
        is_active: false,
        ended_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) {
      toast.error('Failed to revoke session');
    } else {
      toast.success('Session revoked successfully');
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    }

    setRevokingId(null);
  };

  const revokeAllOtherSessions = async () => {
    if (!user || !currentSessionToken) return;

    const otherSessions = sessions.filter(s => !s.session_token.endsWith(currentSessionToken));
    
    if (otherSessions.length === 0) {
      toast.info('No other sessions to revoke');
      return;
    }

    setRevokingId('all');

    const { error } = await supabase
      .from('user_sessions')
      .update({ 
        is_active: false,
        ended_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('is_active', true)
      .not('session_token', 'like', `%${currentSessionToken}`);

    if (error) {
      toast.error('Failed to revoke sessions');
    } else {
      toast.success(`Revoked ${otherSessions.length} session(s)`);
      setSessions(prev => prev.filter(s => s.session_token.endsWith(currentSessionToken || '')));
    }

    setRevokingId(null);
  };

  const parseDeviceInfo = (userAgent: string | null) => {
    if (!userAgent) return { device: 'Unknown', browser: 'Unknown' };

    let device = 'Desktop';
    let browser = 'Unknown';

    if (/mobile/i.test(userAgent)) device = 'Mobile';
    if (/tablet/i.test(userAgent)) device = 'Tablet';

    if (/chrome/i.test(userAgent)) browser = 'Chrome';
    else if (/firefox/i.test(userAgent)) browser = 'Firefox';
    else if (/safari/i.test(userAgent)) browser = 'Safari';
    else if (/edge/i.test(userAgent)) browser = 'Edge';

    return { device, browser };
  };

  const isCurrentSession = (session: UserSession) => {
    return currentSessionToken && session.session_token.endsWith(currentSessionToken);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5" />
            <div>
              <CardTitle className="text-lg">Active Sessions</CardTitle>
              <CardDescription>
                Manage your active login sessions across devices
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchSessions}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            {sessions.length > 1 && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={revokeAllOtherSessions}
                disabled={revokingId === 'all'}
              >
                {revokingId === 'all' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4 mr-2" />
                )}
                Sign Out Other Sessions
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <Alert>
            <AlertDescription>
              No active sessions found. This might be because session tracking is not enabled for your account.
            </AlertDescription>
          </Alert>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Started</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map(session => {
                const { device, browser } = parseDeviceInfo(session.user_agent);
                const isCurrent = isCurrentSession(session);

                return (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {device === 'Mobile' ? (
                          <Smartphone className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Monitor className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {browser}
                            {isCurrent && (
                              <Badge variant="default" className="text-xs">Current</Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">{device}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{session.location || 'Unknown'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {session.ip_address || 'Unknown'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(session.last_activity_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(session.started_at), 'dd MMM, HH:mm')}
                    </TableCell>
                    <TableCell>
                      {!isCurrent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => revokeSession(session.id)}
                          disabled={revokingId === session.id}
                        >
                          {revokingId === session.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <LogOut className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
