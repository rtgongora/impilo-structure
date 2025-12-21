import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, History, CheckCircle, XCircle, Globe, RefreshCw } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface LoginAttempt {
  id: string;
  email: string;
  ip_address: string | null;
  user_agent: string | null;
  success: boolean;
  created_at: string;
}

export function LoginHistory() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<LoginAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLoginHistory = async () => {
    if (!user?.email) return;
    
    setLoading(true);

    const { data, error } = await supabase
      .from('login_attempts')
      .select('*')
      .eq('email', user.email.toLowerCase())
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Failed to fetch login history:', error);
    } else {
      setAttempts(data as LoginAttempt[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchLoginHistory();
  }, [user?.email]);

  const parseDeviceInfo = (userAgent: string | null) => {
    if (!userAgent) return 'Unknown device';

    let device = 'Desktop';
    let browser = 'Unknown';
    let os = 'Unknown';

    if (/mobile/i.test(userAgent)) device = 'Mobile';
    if (/tablet/i.test(userAgent)) device = 'Tablet';

    if (/chrome/i.test(userAgent)) browser = 'Chrome';
    else if (/firefox/i.test(userAgent)) browser = 'Firefox';
    else if (/safari/i.test(userAgent)) browser = 'Safari';
    else if (/edge/i.test(userAgent)) browser = 'Edge';

    if (/windows/i.test(userAgent)) os = 'Windows';
    else if (/mac/i.test(userAgent)) os = 'macOS';
    else if (/linux/i.test(userAgent)) os = 'Linux';
    else if (/android/i.test(userAgent)) os = 'Android';
    else if (/ios|iphone|ipad/i.test(userAgent)) os = 'iOS';

    return `${browser} on ${os} (${device})`;
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
            <History className="h-5 w-5" />
            <div>
              <CardTitle className="text-lg">Login History</CardTitle>
              <CardDescription>
                Recent login attempts to your account
              </CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchLoginHistory}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {attempts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No login history available</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attempts.map(attempt => (
                <TableRow key={attempt.id}>
                  <TableCell>
                    {attempt.success ? (
                      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Success
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Failed
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {parseDeviceInfo(attempt.user_agent)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-sm">{attempt.ip_address || 'Unknown'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div>
                      {formatDistanceToNow(new Date(attempt.created_at), { addSuffix: true })}
                    </div>
                    <div className="text-xs">
                      {format(new Date(attempt.created_at), 'dd MMM yyyy, HH:mm')}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
