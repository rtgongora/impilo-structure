import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Lock, 
  Unlock,
  RefreshCw, 
  Loader2,
  Clock,
  User,
  AlertTriangle
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

interface AccountLockout {
  id: string;
  email: string;
  locked_at: string;
  unlock_at: string;
  reason: string | null;
  created_at: string;
}

const LockedAccounts: React.FC = () => {
  const [lockouts, setLockouts] = useState<AccountLockout[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);

  const fetchLockouts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('account_lockouts')
      .select('*')
      .order('locked_at', { ascending: false });

    if (error) {
      console.error('Error fetching lockouts:', error);
      toast.error('Failed to fetch locked accounts');
    } else {
      setLockouts((data || []) as AccountLockout[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLockouts();
  }, []);

  const handleUnlock = async (lockout: AccountLockout) => {
    setUnlockingId(lockout.id);
    
    const { error } = await supabase
      .from('account_lockouts')
      .delete()
      .eq('id', lockout.id);

    if (error) {
      console.error('Error unlocking account:', error);
      toast.error('Failed to unlock account');
    } else {
      // Log the unlock event
      await supabase.from('security_events').insert({
        event_type: 'account_unlocked',
        severity: 'info',
        email: lockout.email,
        details: { 
          message: 'Account manually unlocked by administrator',
          original_unlock_time: lockout.unlock_at
        }
      });
      
      toast.success(`Account ${lockout.email} has been unlocked`);
      setLockouts(prev => prev.filter(l => l.id !== lockout.id));
    }
    
    setUnlockingId(null);
  };

  const isExpired = (unlockAt: string) => {
    return new Date(unlockAt) < new Date();
  };

  // Filter to show only active lockouts
  const activeLockouts = lockouts.filter(l => !isExpired(l.unlock_at));
  const expiredLockouts = lockouts.filter(l => isExpired(l.unlock_at));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-destructive" />
              Locked Accounts
              {activeLockouts.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {activeLockouts.length} active
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              View and unlock accounts that have been locked due to failed login attempts
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchLockouts} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : lockouts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Unlock className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>No locked accounts</p>
            <p className="text-sm">All user accounts are currently accessible</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Active Lockouts */}
            {activeLockouts.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  Active Lockouts ({activeLockouts.length})
                </h4>
                <div className="space-y-2">
                  {activeLockouts.map((lockout) => (
                    <div
                      key={lockout.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-destructive/5 border-destructive/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-destructive/10">
                          <Lock className="w-4 h-4 text-destructive" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3 text-muted-foreground" />
                            <span className="font-medium font-mono text-sm">{lockout.email}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span>
                              Locked {formatDistanceToNow(new Date(lockout.locked_at), { addSuffix: true })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Unlocks {formatDistanceToNow(new Date(lockout.unlock_at), { addSuffix: true })}
                            </span>
                          </div>
                          {lockout.reason && (
                            <p className="text-xs text-muted-foreground mt-1">{lockout.reason}</p>
                          )}
                        </div>
                      </div>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={unlockingId === lockout.id}
                          >
                            {unlockingId === lockout.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Unlock className="w-4 h-4 mr-2" />
                                Unlock
                              </>
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Unlock Account</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to unlock <strong>{lockout.email}</strong>? 
                              This will allow the user to attempt login again immediately.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleUnlock(lockout)}>
                              Unlock Account
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expired Lockouts (for reference) */}
            {expiredLockouts.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Recently Expired ({expiredLockouts.length})
                </h4>
                <div className="space-y-2">
                  {expiredLockouts.slice(0, 5).map((lockout) => (
                    <div
                      key={lockout.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-muted">
                          <Unlock className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <span className="font-mono text-sm text-muted-foreground">{lockout.email}</span>
                          <div className="text-xs text-muted-foreground">
                            Expired {formatDistanceToNow(new Date(lockout.unlock_at), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">Expired</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LockedAccounts;
