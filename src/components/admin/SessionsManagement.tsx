import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Monitor, 
  Smartphone, 
  Tablet,
  LogOut,
  RefreshCw,
  Loader2,
  Clock,
  Globe
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  ip_address: string | null;
  user_agent: string | null;
  device_info: string | null;
  started_at: string;
  last_activity_at: string;
  ended_at: string | null;
  is_active: boolean;
  user_name?: string;
}

interface SessionsManagementProps {
  users: Array<{ user_id: string; display_name: string }>;
}

const SessionsManagement: React.FC<SessionsManagementProps> = ({ users }) => {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [terminatingId, setTerminatingId] = useState<string | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('is_active', true)
      .order('last_activity_at', { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to fetch sessions');
    } else {
      // Enrich with user names
      const enriched = (data || []).map(session => ({
        ...session,
        user_name: users.find(u => u.user_id === session.user_id)?.display_name || 'Unknown User'
      }));
      setSessions(enriched);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSessions();
  }, [users]);

  const terminateSession = async (sessionId: string) => {
    setTerminatingId(sessionId);
    
    const { error } = await supabase
      .from('user_sessions')
      .update({ 
        is_active: false, 
        ended_at: new Date().toISOString() 
      })
      .eq('id', sessionId);

    if (error) {
      toast.error('Failed to terminate session');
    } else {
      toast.success('Session terminated successfully');
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    }
    
    setTerminatingId(null);
  };

  const terminateAllUserSessions = async (userId: string, userName: string) => {
    const { error } = await supabase
      .from('user_sessions')
      .update({ 
        is_active: false, 
        ended_at: new Date().toISOString() 
      })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      toast.error('Failed to terminate sessions');
    } else {
      toast.success(`All sessions for ${userName} terminated`);
      setSessions(prev => prev.filter(s => s.user_id !== userId));
    }
  };

  const getDeviceIcon = (deviceInfo: string | null) => {
    if (!deviceInfo) return <Monitor className="w-4 h-4" />;
    if (deviceInfo === 'Mobile') return <Smartphone className="w-4 h-4" />;
    if (deviceInfo === 'Tablet') return <Tablet className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
  };

  const getBrowserName = (userAgent: string | null) => {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Browser';
  };

  // Group sessions by user
  const sessionsByUser = sessions.reduce((acc, session) => {
    const userId = session.user_id;
    if (!acc[userId]) {
      acc[userId] = {
        userName: session.user_name || 'Unknown',
        sessions: []
      };
    }
    acc[userId].sessions.push(session);
    return acc;
  }, {} as Record<string, { userName: string; sessions: UserSession[] }>);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Active Sessions
            </CardTitle>
            <CardDescription>
              Monitor and manage active user sessions
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchSessions} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No active sessions</p>
            <p className="text-sm">Sessions will appear when users log in</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-6">
              {Object.entries(sessionsByUser).map(([userId, { userName, sessions: userSessions }]) => (
                <div key={userId} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      {userName}
                      <Badge variant="secondary" className="text-xs">
                        {userSessions.length} session{userSessions.length > 1 ? 's' : ''}
                      </Badge>
                    </h3>
                    {userSessions.length > 1 && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <LogOut className="w-3 h-3 mr-1" />
                            End All
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Terminate all sessions?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will immediately log out {userName} from all devices. They will need to sign in again.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => terminateAllUserSessions(userId, userName)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Terminate All
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                  
                  <div className="space-y-2 pl-4 border-l-2 border-muted">
                    {userSessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-muted">
                            {getDeviceIcon(session.device_info)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {session.device_info || 'Unknown Device'}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {getBrowserName(session.user_agent)}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Started {formatDistanceToNow(new Date(session.started_at), { addSuffix: true })}
                              </span>
                              <span>
                                Last active {formatDistanceToNow(new Date(session.last_activity_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              disabled={terminatingId === session.id}
                            >
                              {terminatingId === session.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <LogOut className="w-4 h-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Terminate session?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will immediately log out this user from this device. They will need to sign in again.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => terminateSession(session.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Terminate
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}
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

export default SessionsManagement;
