import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Loader2, Key, RefreshCw, Search } from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  role: string;
  force_password_reset: boolean;
  password_reset_reason: string | null;
}

export default function ForcePasswordReset() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchUsers = async () => {
    if (!searchTerm.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id, display_name, role, force_password_reset, password_reset_reason')
      .or(`display_name.ilike.%${searchTerm}%`)
      .limit(20);

    if (error) {
      toast.error('Failed to search users');
    } else {
      setUsers(data as UserProfile[]);
    }

    setLoading(false);
  };

  const handleForceReset = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        force_password_reset: true,
        password_reset_reason: reason || 'Password reset required by administrator'
      })
      .eq('id', selectedUser.id);

    if (error) {
      toast.error('Failed to set password reset requirement');
    } else {
      // Log security event
      await supabase.from('security_events').insert({
        event_type: 'force_password_reset',
        severity: 'warning',
        user_id: selectedUser.user_id,
        details: { 
          reason: reason || 'Password reset required by administrator',
          target_name: selectedUser.display_name
        }
      });

      // Send notification email
      try {
        await supabase.functions.invoke('send-security-notification', {
          body: {
            userId: selectedUser.user_id,
            eventType: 'force_password_reset',
            details: { reason: reason || 'Password reset required by administrator' }
          }
        });
      } catch (emailError) {
        console.error('Failed to send notification:', emailError);
      }

      toast.success(`Password reset required for ${selectedUser.display_name}`);
      setUsers(prev => 
        prev.map(u => u.id === selectedUser.id ? { ...u, force_password_reset: true } : u)
      );
      setSelectedUser(null);
      setReason('');
    }

    setIsSubmitting(false);
  };

  const handleClearReset = async (user: UserProfile) => {
    const { error } = await supabase
      .from('profiles')
      .update({
        force_password_reset: false,
        password_reset_reason: null
      })
      .eq('id', user.id);

    if (error) {
      toast.error('Failed to clear password reset requirement');
    } else {
      toast.success(`Password reset cleared for ${user.display_name}`);
      setUsers(prev => 
        prev.map(u => u.id === user.id ? { ...u, force_password_reset: false } : u)
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Key className="h-5 w-5" />
          <div>
            <CardTitle className="text-lg">Force Password Reset</CardTitle>
            <CardDescription>
              Require specific users to change their password on next login
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
              className="pl-10"
            />
          </div>
          <Button onClick={searchUsers} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
          </Button>
        </div>

        {users.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[150px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.display_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    {user.force_password_reset ? (
                      <Badge variant="destructive">Reset Required</Badge>
                    ) : (
                      <Badge variant="secondary">Normal</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.force_password_reset ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleClearReset(user)}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Clear
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setSelectedUser(user)}
                      >
                        <Key className="h-4 w-4 mr-2" />
                        Force Reset
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Force Password Reset</DialogTitle>
              <DialogDescription>
                Require {selectedUser?.display_name} to change their password on next login.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Reason (optional)</Label>
                <Input
                  id="reason"
                  placeholder="Security policy update, suspected compromise, etc."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedUser(null)}>
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handleForceReset}
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Force Password Reset
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
