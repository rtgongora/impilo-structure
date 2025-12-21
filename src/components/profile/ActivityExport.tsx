import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Download, FileText } from 'lucide-react';
import { format } from 'date-fns';

export function ActivityExport() {
  const { user } = useAuth();
  const [exporting, setExporting] = useState(false);

  const exportActivity = async () => {
    if (!user?.email) return;

    setExporting(true);

    try {
      // Fetch login attempts
      const { data: loginAttempts, error: loginError } = await supabase
        .from('login_attempts')
        .select('*')
        .eq('email', user.email.toLowerCase())
        .order('created_at', { ascending: false })
        .limit(500);

      if (loginError) throw loginError;

      // Fetch security events for this user
      const { data: securityEvents, error: eventsError } = await supabase
        .from('security_events')
        .select('*')
        .eq('email', user.email.toLowerCase())
        .order('created_at', { ascending: false })
        .limit(500);

      if (eventsError) throw eventsError;

      // Fetch user sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(100);

      if (sessionsError) throw sessionsError;

      // Create CSV content
      let csvContent = '';
      
      // Login Attempts Section
      csvContent += 'LOGIN ATTEMPTS\n';
      csvContent += 'Date,Time,Status,IP Address,User Agent\n';
      loginAttempts?.forEach(attempt => {
        const date = format(new Date(attempt.created_at), 'yyyy-MM-dd');
        const time = format(new Date(attempt.created_at), 'HH:mm:ss');
        const status = attempt.success ? 'Success' : 'Failed';
        const ip = attempt.ip_address || 'Unknown';
        const ua = (attempt.user_agent || 'Unknown').replace(/,/g, ';');
        csvContent += `${date},${time},${status},${ip},"${ua}"\n`;
      });

      csvContent += '\n\nSECURITY EVENTS\n';
      csvContent += 'Date,Time,Event Type,Severity,IP Address,Details\n';
      securityEvents?.forEach(event => {
        const date = format(new Date(event.created_at), 'yyyy-MM-dd');
        const time = format(new Date(event.created_at), 'HH:mm:ss');
        const ip = event.ip_address || 'Unknown';
        const details = JSON.stringify(event.details || {}).replace(/,/g, ';');
        csvContent += `${date},${time},${event.event_type},${event.severity},${ip},"${details}"\n`;
      });

      csvContent += '\n\nSESSIONS\n';
      csvContent += 'Started,Last Activity,Status,IP Address,Location,Device\n';
      sessions?.forEach(session => {
        const started = format(new Date(session.started_at), 'yyyy-MM-dd HH:mm:ss');
        const lastActivity = format(new Date(session.last_activity_at), 'yyyy-MM-dd HH:mm:ss');
        const status = session.is_active ? 'Active' : 'Ended';
        const ip = session.ip_address || 'Unknown';
        const location = session.location || 'Unknown';
        const device = (session.device_info || 'Unknown').replace(/,/g, ';');
        csvContent += `${started},${lastActivity},${status},${ip},${location},"${device}"\n`;
      });

      // Download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `account-activity-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Activity log exported successfully');
    } catch (err: any) {
      console.error('Export error:', err);
      toast.error('Failed to export activity log');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5" />
          <div>
            <CardTitle className="text-lg">Export Activity</CardTitle>
            <CardDescription>
              Download your complete account activity log
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Export includes your login history, security events, and session data in CSV format.
        </p>
        <Button onClick={exportActivity} disabled={exporting}>
          {exporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {exporting ? 'Exporting...' : 'Download Activity Log'}
        </Button>
      </CardContent>
    </Card>
  );
}
