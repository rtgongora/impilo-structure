import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
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
import { toast } from 'sonner';
import { Loader2, Smartphone, Monitor, Trash2, Shield, RefreshCw } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface TrustedDevice {
  id: string;
  device_fingerprint: string;
  device_name: string | null;
  user_agent: string | null;
  ip_address: string | null;
  last_used_at: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
}

export function TrustedDevices() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchDevices = async () => {
    if (!user) return;
    
    setLoading(true);

    const { data, error } = await supabase
      .from('trusted_devices')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('last_used_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch trusted devices:', error);
    } else {
      setDevices(data as TrustedDevice[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchDevices();
  }, [user]);

  const removeDevice = async (deviceId: string) => {
    setRemovingId(deviceId);

    const { error } = await supabase
      .from('trusted_devices')
      .update({ is_active: false })
      .eq('id', deviceId);

    if (error) {
      toast.error('Failed to remove device');
    } else {
      toast.success('Device removed from trusted list');
      setDevices(prev => prev.filter(d => d.id !== deviceId));
    }

    setRemovingId(null);
  };

  const removeAllDevices = async () => {
    if (!user) return;

    setRemovingId('all');

    const { error } = await supabase
      .from('trusted_devices')
      .update({ is_active: false })
      .eq('user_id', user.id);

    if (error) {
      toast.error('Failed to remove devices');
    } else {
      toast.success('All trusted devices removed');
      setDevices([]);
    }

    setRemovingId(null);
  };

  const parseDeviceInfo = (userAgent: string | null) => {
    if (!userAgent) return { device: 'Unknown', browser: 'Unknown', os: 'Unknown' };

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

    return { device, browser, os };
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
              <CardTitle className="text-lg">Trusted Devices</CardTitle>
              <CardDescription>
                Devices that can skip 2FA verification for 30 days
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchDevices}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            {devices.length > 0 && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={removeAllDevices}
                disabled={removingId === 'all'}
              >
                {removingId === 'all' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Remove All
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {devices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No trusted devices</p>
            <p className="text-sm">When you check "Trust this device" during 2FA, it will appear here</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map(device => {
                const { device: deviceType, browser, os } = parseDeviceInfo(device.user_agent);
                const isExpired = new Date(device.expires_at) < new Date();

                return (
                  <TableRow key={device.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {deviceType === 'Mobile' ? (
                          <Smartphone className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Monitor className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div>
                          <div className="font-medium">
                            {device.device_name || `${browser} on ${os}`}
                          </div>
                          <div className="text-xs text-muted-foreground">{deviceType}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {device.ip_address || 'Unknown'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(device.last_used_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      {isExpired ? (
                        <Badge variant="destructive">Expired</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(device.expires_at), 'dd MMM yyyy')}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeDevice(device.id)}
                        disabled={removingId === device.id}
                      >
                        {removingId === device.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
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
