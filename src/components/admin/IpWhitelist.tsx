import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Shield, Globe, AlertTriangle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface IpWhitelistEntry {
  id: string;
  ip_address: string;
  description: string | null;
  is_range: boolean;
  is_enabled: boolean;
  created_at: string;
}

export default function IpWhitelist() {
  const [entries, setEntries] = useState<IpWhitelistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWhitelistEnabled, setIsWhitelistEnabled] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newIp, setNewIp] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isRange, setIsRange] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchEntries = async () => {
    setLoading(true);
    
    const [entriesResult, settingsResult] = await Promise.all([
      supabase.from('ip_whitelist').select('*').order('created_at', { ascending: false }),
      supabase.from('system_settings').select('value').eq('key', 'ip_whitelist_enabled').maybeSingle()
    ]);

    if (entriesResult.error) {
      toast.error('Failed to load IP whitelist');
    } else {
      setEntries(entriesResult.data as IpWhitelistEntry[]);
    }

    if (settingsResult.data) {
      setIsWhitelistEnabled(settingsResult.data.value === 'true' || settingsResult.data.value === true);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const toggleWhitelistEnabled = async () => {
    const newValue = !isWhitelistEnabled;
    
    const { error } = await supabase
      .from('system_settings')
      .update({ value: String(newValue) })
      .eq('key', 'ip_whitelist_enabled');

    if (error) {
      toast.error('Failed to update setting');
    } else {
      setIsWhitelistEnabled(newValue);
      toast.success(`IP whitelist ${newValue ? 'enabled' : 'disabled'}`);
    }
  };

  const validateIpAddress = (ip: string): boolean => {
    // IPv4 validation
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    // IPv4 CIDR validation
    const ipv4CidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
    // IPv6 validation (simplified)
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    // IPv6 CIDR validation (simplified)
    const ipv6CidrRegex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\/\d{1,3}$/;

    if (isRange) {
      return ipv4CidrRegex.test(ip) || ipv6CidrRegex.test(ip);
    }
    
    if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip)) {
      return false;
    }

    // Validate IPv4 octets
    if (ipv4Regex.test(ip)) {
      const octets = ip.split('.').map(Number);
      return octets.every(octet => octet >= 0 && octet <= 255);
    }

    return true;
  };

  const handleAddEntry = async () => {
    if (!newIp.trim()) {
      toast.error('IP address is required');
      return;
    }

    if (!validateIpAddress(newIp.trim())) {
      toast.error(`Invalid ${isRange ? 'CIDR range' : 'IP address'} format`);
      return;
    }

    setIsSaving(true);

    const { error } = await supabase.from('ip_whitelist').insert({
      ip_address: newIp.trim(),
      description: newDescription.trim() || null,
      is_range: isRange,
      is_enabled: true,
    });

    if (error) {
      if (error.code === '23505') {
        toast.error('This IP address already exists');
      } else {
        toast.error('Failed to add IP address');
      }
    } else {
      toast.success('IP address added to whitelist');
      setShowAddDialog(false);
      setNewIp('');
      setNewDescription('');
      setIsRange(false);
      fetchEntries();
    }

    setIsSaving(false);
  };

  const toggleEntryEnabled = async (entry: IpWhitelistEntry) => {
    const { error } = await supabase
      .from('ip_whitelist')
      .update({ is_enabled: !entry.is_enabled })
      .eq('id', entry.id);

    if (error) {
      toast.error('Failed to update entry');
    } else {
      setEntries(prev =>
        prev.map(e => e.id === entry.id ? { ...e, is_enabled: !e.is_enabled } : e)
      );
    }
  };

  const handleDeleteEntry = async (id: string) => {
    setDeletingId(id);

    const { error } = await supabase.from('ip_whitelist').delete().eq('id', id);

    if (error) {
      toast.error('Failed to delete entry');
    } else {
      toast.success('IP address removed from whitelist');
      setEntries(prev => prev.filter(e => e.id !== id));
    }

    setDeletingId(null);
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
    <div className="space-y-4">
      {/* Master Toggle Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg">IP Whitelist Enforcement</CardTitle>
                <CardDescription>
                  When enabled, only IP addresses in the whitelist can log in
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={isWhitelistEnabled}
              onCheckedChange={toggleWhitelistEnabled}
            />
          </div>
        </CardHeader>
        {isWhitelistEnabled && entries.filter(e => e.is_enabled).length === 0 && (
          <CardContent className="pt-0">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Warning: IP whitelist is enabled but no IPs are whitelisted. All login attempts will be blocked!
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      {/* Whitelist Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5" />
              <div>
                <CardTitle className="text-lg">Whitelisted IP Addresses</CardTitle>
                <CardDescription>
                  {entries.length} {entries.length === 1 ? 'entry' : 'entries'} configured
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchEntries}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button size="sm" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add IP
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No IP addresses in the whitelist</p>
              <p className="text-sm">Add IP addresses to restrict access</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Enabled</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono">{entry.ip_address}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {entry.description || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={entry.is_range ? 'secondary' : 'outline'}>
                        {entry.is_range ? 'CIDR Range' : 'Single IP'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(entry.created_at), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={entry.is_enabled}
                        onCheckedChange={() => toggleEntryEnabled(entry)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteEntry(entry.id)}
                        disabled={deletingId === entry.id}
                      >
                        {deletingId === entry.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add IP Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add IP to Whitelist</DialogTitle>
            <DialogDescription>
              Add an IP address or CIDR range that should be allowed to access the system.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Label className="min-w-[100px]">Entry Type</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!isRange}
                    onChange={() => setIsRange(false)}
                    className="accent-primary"
                  />
                  <span className="text-sm">Single IP</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={isRange}
                    onChange={() => setIsRange(true)}
                    className="accent-primary"
                  />
                  <span className="text-sm">CIDR Range</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ip-address">
                {isRange ? 'CIDR Range' : 'IP Address'}
              </Label>
              <Input
                id="ip-address"
                placeholder={isRange ? '192.168.1.0/24' : '192.168.1.100'}
                value={newIp}
                onChange={(e) => setNewIp(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {isRange 
                  ? 'Enter a CIDR range (e.g., 10.0.0.0/8, 192.168.1.0/24)'
                  : 'Enter an IPv4 or IPv6 address'
                }
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                placeholder="Office network, VPN, etc."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEntry} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add to Whitelist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
