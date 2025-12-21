import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Shield, ArrowLeft } from 'lucide-react';

interface TwoFactorVerifyProps {
  onVerified: (trustDevice?: boolean) => void;
  onCancel: () => void;
  email: string;
}

export function TwoFactorVerify({ onVerified, onCancel, email }: TwoFactorVerifyProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isBackupCode, setIsBackupCode] = useState(false);
  const [trustDevice, setTrustDevice] = useState(false);

  const handleVerify = async () => {
    const cleanCode = isBackupCode ? code.toUpperCase() : code.replace(/\D/g, '');
    
    if (!isBackupCode && cleanCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    if (isBackupCode && !cleanCode.includes('-')) {
      setError('Backup codes are in format XXXX-XXXX');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.functions.invoke('totp-management', {
        body: { action: 'validate', token: cleanCode, email },
      });

      if (error) throw error;

      if (data.success) {
        if (data.backup_code_used) {
          // Show warning about backup code usage
          console.log('Backup code used, notify user');
        }
        onVerified(trustDevice);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <div className="p-3 rounded-full bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          {isBackupCode 
            ? 'Enter one of your backup codes'
            : 'Enter the 6-digit code from your authenticator app'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="2fa-code">
            {isBackupCode ? 'Backup Code' : 'Verification Code'}
          </Label>
          <Input
            id="2fa-code"
            type="text"
            inputMode={isBackupCode ? 'text' : 'numeric'}
            pattern={isBackupCode ? undefined : '[0-9]*'}
            maxLength={isBackupCode ? 9 : 6}
            placeholder={isBackupCode ? 'XXXX-XXXX' : '000000'}
            value={code}
            onChange={(e) => setCode(isBackupCode ? e.target.value : e.target.value.replace(/\D/g, ''))}
            onKeyDown={handleKeyDown}
            className="text-center text-2xl tracking-widest font-mono"
            autoFocus
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="trust-device"
            checked={trustDevice}
            onCheckedChange={(checked) => setTrustDevice(checked === true)}
          />
          <Label 
            htmlFor="trust-device" 
            className="text-sm text-muted-foreground cursor-pointer"
          >
            Trust this device for 30 days
          </Label>
        </div>

        <Button 
          className="w-full" 
          onClick={handleVerify}
          disabled={loading}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Verify
        </Button>

        <div className="flex flex-col gap-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => {
              setIsBackupCode(!isBackupCode);
              setCode('');
              setError('');
            }}
          >
            {isBackupCode ? 'Use authenticator app instead' : 'Use a backup code'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to login
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
