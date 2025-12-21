import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Loader2, Mail, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface EmailVerificationStatusProps {
  email: string;
  isVerified: boolean;
  onVerified?: () => void;
}

export function EmailVerificationStatus({ email, isVerified, onVerified }: EmailVerificationStatusProps) {
  const [resending, setResending] = useState(false);
  const [lastSent, setLastSent] = useState<Date | null>(null);

  const resendVerificationEmail = async () => {
    // Rate limit: only allow resend every 60 seconds
    if (lastSent && Date.now() - lastSent.getTime() < 60000) {
      const waitTime = Math.ceil((60000 - (Date.now() - lastSent.getTime())) / 1000);
      toast.error(`Please wait ${waitTime} seconds before requesting another email`);
      return;
    }

    setResending(true);

    try {
      const { error } = await supabase.functions.invoke('send-verification-email', {
        body: { email },
      });

      if (error) throw error;

      setLastSent(new Date());
      toast.success('Verification email sent! Check your inbox.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send verification email');
    } finally {
      setResending(false);
    }
  };

  if (isVerified) {
    return (
      <Card className="border-green-500/20 bg-green-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <CardTitle className="text-lg">Email Verified</CardTitle>
              <CardDescription>Your email address has been verified</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{email}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-yellow-500/20 bg-yellow-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <div>
            <CardTitle className="text-lg">Email Not Verified</CardTitle>
            <CardDescription>Please verify your email address</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Mail className="h-4 w-4" />
          <AlertDescription>
            We sent a verification email to <strong>{email}</strong>. 
            Please check your inbox and click the verification link.
          </AlertDescription>
        </Alert>

        <Button 
          variant="outline" 
          onClick={resendVerificationEmail}
          disabled={resending}
        >
          {resending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Resend Verification Email
        </Button>
      </CardContent>
    </Card>
  );
}
