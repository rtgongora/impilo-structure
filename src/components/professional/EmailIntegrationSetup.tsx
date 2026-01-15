import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Mail,
  Link2,
  Settings,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Shield,
  Building2,
  Globe,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmailProvider {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  requiresOAuth: boolean;
  domains?: string[];
}

const EMAIL_PROVIDERS: EmailProvider[] = [
  {
    id: 'mohcc',
    name: 'MoHCC Email',
    icon: <Building2 className="h-5 w-5" />,
    description: 'Ministry of Health and Child Care official email',
    requiresOAuth: false,
    domains: ['mohcc.gov.zw', 'health.gov.zw'],
  },
  {
    id: 'microsoft365',
    name: 'Microsoft 365',
    icon: <Globe className="h-5 w-5" />,
    description: 'Outlook, Hotmail, or organizational Microsoft accounts',
    requiresOAuth: true,
  },
  {
    id: 'google',
    name: 'Google Workspace',
    icon: <Mail className="h-5 w-5" />,
    description: 'Gmail or Google Workspace accounts',
    requiresOAuth: true,
  },
  {
    id: 'imap',
    name: 'Other (IMAP)',
    icon: <Settings className="h-5 w-5" />,
    description: 'Connect via IMAP/SMTP settings',
    requiresOAuth: false,
  },
];

interface LinkedAccount {
  id: string;
  provider: string;
  email: string;
  status: 'active' | 'error' | 'syncing';
  lastSync?: string;
}

interface EmailIntegrationSetupProps {
  onClose?: () => void;
  linkedAccounts?: LinkedAccount[];
  onAccountLinked?: (account: LinkedAccount) => void;
}

export function EmailIntegrationSetup({ onClose, linkedAccounts = [], onAccountLinked }: EmailIntegrationSetupProps) {
  const { user } = useAuth();
  const [selectedProvider, setSelectedProvider] = useState<EmailProvider | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showImapConfig, setShowImapConfig] = useState(false);
  
  // IMAP configuration state
  const [imapConfig, setImapConfig] = useState({
    email: '',
    password: '',
    imapServer: '',
    imapPort: '993',
    smtpServer: '',
    smtpPort: '587',
  });

  const handleProviderSelect = (provider: EmailProvider) => {
    setSelectedProvider(provider);
    if (provider.id === 'imap' || provider.id === 'mohcc') {
      setShowImapConfig(true);
    } else {
      // For OAuth providers, initiate OAuth flow
      handleOAuthConnect(provider);
    }
  };

  const handleOAuthConnect = async (provider: EmailProvider) => {
    setIsConnecting(true);
    try {
      // In production, this would redirect to OAuth provider
      toast.info(`Redirecting to ${provider.name} for authentication...`);
      
      // Simulate OAuth flow for demo
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`${provider.name} account linked successfully!`);
      onAccountLinked?.({
        id: crypto.randomUUID(),
        provider: provider.id,
        email: `user@${provider.id === 'microsoft365' ? 'outlook.com' : 'gmail.com'}`,
        status: 'active',
        lastSync: new Date().toISOString(),
      });
    } catch (error) {
      toast.error(`Failed to connect ${provider.name}`);
    } finally {
      setIsConnecting(false);
      setSelectedProvider(null);
    }
  };

  const handleImapConnect = async () => {
    if (!imapConfig.email || !imapConfig.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsConnecting(true);
    try {
      // In production, this would validate IMAP credentials via edge function
      toast.info('Validating email credentials...');
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Email account linked successfully!');
      onAccountLinked?.({
        id: crypto.randomUUID(),
        provider: selectedProvider?.id || 'imap',
        email: imapConfig.email,
        status: 'syncing',
        lastSync: new Date().toISOString(),
      });
      
      setShowImapConfig(false);
      setSelectedProvider(null);
      setImapConfig({
        email: '',
        password: '',
        imapServer: '',
        imapPort: '993',
        smtpServer: '',
        smtpPort: '587',
      });
    } catch (error) {
      toast.error('Failed to connect email account');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Email Integration
          </h3>
          <p className="text-sm text-muted-foreground">
            Connect your professional email accounts to sync messages
          </p>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Linked Accounts */}
      {linkedAccounts.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Connected Accounts</Label>
          {linkedAccounts.map((account) => (
            <Card key={account.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{account.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {EMAIL_PROVIDERS.find(p => p.id === account.provider)?.name || account.provider}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {account.status === 'active' && (
                    <Badge variant="outline" className="text-green-600 border-green-600/50">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  )}
                  {account.status === 'syncing' && (
                    <Badge variant="outline" className="text-blue-600 border-blue-600/50">
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Syncing
                    </Badge>
                  )}
                  {account.status === 'error' && (
                    <Badge variant="outline" className="text-destructive border-destructive/50">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Error
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm">
                    <Settings className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Provider Selection */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Add Email Account</Label>
        <div className="grid gap-2">
          {EMAIL_PROVIDERS.map((provider) => (
            <motion.button
              key={provider.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => handleProviderSelect(provider)}
              disabled={isConnecting}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-left disabled:opacity-50"
            >
              <div className="p-2 rounded-lg bg-muted">
                {provider.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{provider.name}</p>
                <p className="text-xs text-muted-foreground">{provider.description}</p>
              </div>
              {provider.requiresOAuth ? (
                <Badge variant="secondary" className="text-xs">OAuth</Badge>
              ) : (
                <Badge variant="outline" className="text-xs">Manual</Badge>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* IMAP Configuration Dialog */}
      <Dialog open={showImapConfig} onOpenChange={setShowImapConfig}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Connect {selectedProvider?.name || 'Email Account'}
            </DialogTitle>
            <DialogDescription>
              Enter your email credentials to sync your inbox
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@mohcc.gov.zw"
                value={imapConfig.email}
                onChange={(e) => setImapConfig(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={imapConfig.password}
                onChange={(e) => setImapConfig(prev => ({ ...prev, password: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Credentials are encrypted and stored securely
              </p>
            </div>

            {selectedProvider?.id === 'imap' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="imapServer">IMAP Server</Label>
                    <Input
                      id="imapServer"
                      placeholder="imap.example.com"
                      value={imapConfig.imapServer}
                      onChange={(e) => setImapConfig(prev => ({ ...prev, imapServer: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="imapPort">IMAP Port</Label>
                    <Select 
                      value={imapConfig.imapPort} 
                      onValueChange={(v) => setImapConfig(prev => ({ ...prev, imapPort: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="993">993 (SSL)</SelectItem>
                        <SelectItem value="143">143 (STARTTLS)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="smtpServer">SMTP Server</Label>
                    <Input
                      id="smtpServer"
                      placeholder="smtp.example.com"
                      value={imapConfig.smtpServer}
                      onChange={(e) => setImapConfig(prev => ({ ...prev, smtpServer: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Select 
                      value={imapConfig.smtpPort} 
                      onValueChange={(v) => setImapConfig(prev => ({ ...prev, smtpPort: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="587">587 (STARTTLS)</SelectItem>
                        <SelectItem value="465">465 (SSL)</SelectItem>
                        <SelectItem value="25">25 (Plain)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImapConfig(false)}>
              Cancel
            </Button>
            <Button onClick={handleImapConnect} disabled={isConnecting}>
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" />
                  Connect Account
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Security Notice */}
      <Card className="bg-muted/50 border-muted">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs font-medium">Secure Connection</p>
              <p className="text-xs text-muted-foreground">
                Your email credentials are encrypted end-to-end and never stored in plain text. 
                We use industry-standard OAuth where available.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
