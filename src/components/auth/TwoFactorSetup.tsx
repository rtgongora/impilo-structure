import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, ShieldCheck, ShieldOff, Copy, Check, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface TwoFactorSetupProps {
  isEnabled: boolean;
  onStatusChange: () => void;
}

export function TwoFactorSetup({ isEnabled, onStatusChange }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'idle' | 'setup' | 'verify' | 'backup'>('idle');
  const [loading, setLoading] = useState(false);
  const [secret, setSecret] = useState('');
  const [otpUri, setOtpUri] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const startSetup = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase.functions.invoke('totp-management', {
        body: { action: 'generate' },
      });

      if (error) throw error;

      setSecret(data.secret);
      setOtpUri(data.otpUri);
      setBackupCodes(data.backupCodes);
      setStep('setup');
    } catch (err: any) {
      setError(err.message || 'Failed to generate 2FA secret');
      toast.error('Failed to start 2FA setup');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.functions.invoke('totp-management', {
        body: { action: 'verify', token: verificationCode },
      });

      if (error) throw error;

      if (data.success) {
        setStep('backup');
        toast.success('2FA enabled successfully!');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.functions.invoke('totp-management', {
        body: { action: 'disable' },
      });

      if (error) throw error;

      toast.success('2FA has been disabled');
      onStatusChange();
    } catch (err: any) {
      setError(err.message || 'Failed to disable 2FA');
      toast.error('Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const copySecret = async () => {
    await navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const finishSetup = () => {
    setStep('idle');
    setSecret('');
    setOtpUri('');
    setBackupCodes([]);
    setVerificationCode('');
    onStatusChange();
  };

  // Generate QR code URL using a public API
  const qrCodeUrl = otpUri 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpUri)}`
    : '';

  if (isEnabled && step === 'idle') {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-500" />
              <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
            </div>
            <Badge variant="default" className="bg-green-500">Enabled</Badge>
          </div>
          <CardDescription>
            Your account is protected with two-factor authentication.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="destructive" 
            onClick={disable2FA}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldOff className="h-4 w-4 mr-2" />}
            Disable 2FA
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 'idle') {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
            </div>
            <Badge variant="secondary">Disabled</Badge>
          </div>
          <CardDescription>
            Add an extra layer of security to your account using an authenticator app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={startSetup} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
            Enable 2FA
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 'setup') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Set Up Two-Factor Authentication</CardTitle>
          <CardDescription>
            Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <img 
              src={qrCodeUrl} 
              alt="2FA QR Code" 
              className="border rounded-lg p-2 bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label>Manual Entry Key</Label>
            <div className="flex items-center gap-2">
              <Input 
                value={showSecret ? secret : '••••••••••••••••••••'}
                readOnly 
                className="font-mono text-sm"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setShowSecret(!showSecret)}
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={copySecret}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep('idle')}>
              Cancel
            </Button>
            <Button onClick={() => setStep('verify')}>
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'verify') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Verify Setup</CardTitle>
          <CardDescription>
            Enter the 6-digit code from your authenticator app to complete setup.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="verification-code">Verification Code</Label>
            <Input
              id="verification-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              className="text-center text-2xl tracking-widest font-mono"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep('setup')}>
              Back
            </Button>
            <Button 
              onClick={verifyAndEnable} 
              disabled={loading || verificationCode.length !== 6}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Verify & Enable
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'backup') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-500" />
            2FA Enabled Successfully!
          </CardTitle>
          <CardDescription>
            Save these backup codes in a secure place. You can use them to access your account if you lose your authenticator device.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              <strong>Important:</strong> Each backup code can only be used once. Store them securely!
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
            {backupCodes.map((code, index) => (
              <div key={index} className="text-center py-1">
                {code}
              </div>
            ))}
          </div>

          <Button 
            variant="outline" 
            className="w-full"
            onClick={async () => {
              await navigator.clipboard.writeText(backupCodes.join('\n'));
              toast.success('Backup codes copied to clipboard');
            }}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy All Codes
          </Button>

          <Button onClick={finishSetup} className="w-full">
            Done
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}
