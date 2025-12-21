import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Settings, 
  Clock, 
  Loader2, 
  Save, 
  Shield, 
  Lock, 
  Key,
  Bell,
  AlertTriangle
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface SystemSettingsData {
  session_timeout_minutes: string;
  max_login_attempts: string;
  lockout_duration_minutes: string;
  password_min_length: string;
  password_require_uppercase: string;
  password_require_lowercase: string;
  password_require_number: string;
  password_require_special: string;
  session_expiry_notification: string;
  security_alerts_enabled: string;
}

const TIMEOUT_OPTIONS = [
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '60', label: '1 hour' },
  { value: '120', label: '2 hours' },
  { value: '480', label: '8 hours' },
  { value: '1440', label: '24 hours' },
];

const ATTEMPT_OPTIONS = [
  { value: '3', label: '3 attempts' },
  { value: '5', label: '5 attempts' },
  { value: '10', label: '10 attempts' },
  { value: '15', label: '15 attempts' },
];

const LOCKOUT_OPTIONS = [
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '60', label: '1 hour' },
  { value: '120', label: '2 hours' },
  { value: '1440', label: '24 hours' },
];

const PASSWORD_LENGTH_OPTIONS = [
  { value: '6', label: '6 characters' },
  { value: '8', label: '8 characters' },
  { value: '10', label: '10 characters' },
  { value: '12', label: '12 characters' },
  { value: '16', label: '16 characters' },
];

const SystemSettings: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SystemSettingsData>({
    session_timeout_minutes: '30',
    max_login_attempts: '5',
    lockout_duration_minutes: '30',
    password_min_length: '8',
    password_require_uppercase: 'true',
    password_require_lowercase: 'true',
    password_require_number: 'true',
    password_require_special: 'false',
    session_expiry_notification: 'true',
    security_alerts_enabled: 'true',
  });
  const [originalSettings, setOriginalSettings] = useState<SystemSettingsData>(settings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    setHasChanges(JSON.stringify(settings) !== JSON.stringify(originalSettings));
  }, [settings, originalSettings]);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value');

    if (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } else if (data) {
      const settingsMap: Partial<SystemSettingsData> = {};
      data.forEach(item => {
        settingsMap[item.key as keyof SystemSettingsData] = String(item.value);
      });
      const newSettings = { ...settings, ...settingsMap };
      setSettings(newSettings);
      setOriginalSettings(newSettings);
    }
    setLoading(false);
  };

  const updateSetting = (key: keyof SystemSettingsData, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    
    const updates = Object.entries(settings).map(([key, value]) => ({
      key,
      value,
      updated_at: new Date().toISOString(),
      updated_by: user.id
    }));

    let hasError = false;
    for (const update of updates) {
      const { error } = await supabase
        .from('system_settings')
        .update({ 
          value: update.value,
          updated_at: update.updated_at,
          updated_by: update.updated_by
        })
        .eq('key', update.key);

      if (error) {
        console.error('Error saving setting:', update.key, error);
        hasError = true;
      }
    }

    if (hasError) {
      toast.error('Some settings failed to save');
    } else {
      toast.success('All settings saved successfully');
      setOriginalSettings(settings);
      setHasChanges(false);
    }
    
    setSaving(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Save Button Bar */}
      {hasChanges && (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border rounded-lg p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <span>You have unsaved changes</span>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save All Changes
          </Button>
        </div>
      )}

      {/* Session Timeout Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Session Management
          </CardTitle>
          <CardDescription>
            Configure session timeout and inactivity settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Session Timeout</Label>
              <Select 
                value={settings.session_timeout_minutes} 
                onValueChange={(v) => updateSetting('session_timeout_minutes', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEOUT_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                End sessions after this period of inactivity
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Session Expiry Notifications
                <Badge variant="outline" className="text-xs">Email</Badge>
              </Label>
              <div className="flex items-center gap-3">
                <Switch
                  checked={settings.session_expiry_notification === 'true'}
                  onCheckedChange={(checked) => 
                    updateSetting('session_expiry_notification', checked ? 'true' : 'false')
                  }
                />
                <span className="text-sm text-muted-foreground">
                  {settings.session_expiry_notification === 'true' ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Notify users when their session expires
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Lockout Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Account Lockout
          </CardTitle>
          <CardDescription>
            Configure failed login attempt handling and account lockout
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Maximum Login Attempts</Label>
              <Select 
                value={settings.max_login_attempts} 
                onValueChange={(v) => updateSetting('max_login_attempts', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ATTEMPT_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Lock account after this many failed attempts
              </p>
            </div>

            <div className="space-y-2">
              <Label>Lockout Duration</Label>
              <Select 
                value={settings.lockout_duration_minutes} 
                onValueChange={(v) => updateSetting('lockout_duration_minutes', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCKOUT_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How long accounts remain locked
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Policy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            Password Policy
          </CardTitle>
          <CardDescription>
            Configure password strength requirements for new accounts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Minimum Password Length</Label>
            <Select 
              value={settings.password_min_length} 
              onValueChange={(v) => updateSetting('password_min_length', v)}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PASSWORD_LENGTH_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-4">
            <Label className="text-base">Required Character Types</Label>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label className="font-normal">Uppercase Letter (A-Z)</Label>
                </div>
                <Switch
                  checked={settings.password_require_uppercase === 'true'}
                  onCheckedChange={(checked) => 
                    updateSetting('password_require_uppercase', checked ? 'true' : 'false')
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label className="font-normal">Lowercase Letter (a-z)</Label>
                </div>
                <Switch
                  checked={settings.password_require_lowercase === 'true'}
                  onCheckedChange={(checked) => 
                    updateSetting('password_require_lowercase', checked ? 'true' : 'false')
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label className="font-normal">Number (0-9)</Label>
                </div>
                <Switch
                  checked={settings.password_require_number === 'true'}
                  onCheckedChange={(checked) => 
                    updateSetting('password_require_number', checked ? 'true' : 'false')
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label className="font-normal">Special Character (!@#$%...)</Label>
                </div>
                <Switch
                  checked={settings.password_require_special === 'true'}
                  onCheckedChange={(checked) => 
                    updateSetting('password_require_special', checked ? 'true' : 'false')
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Alerts Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Security Alerts
          </CardTitle>
          <CardDescription>
            Configure security notifications and alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div className="space-y-1">
              <Label className="text-base">Admin Security Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Send email alerts to admins for security events like account lockouts and suspicious activity
              </p>
            </div>
            <Switch
              checked={settings.security_alerts_enabled === 'true'}
              onCheckedChange={(checked) => 
                updateSetting('security_alerts_enabled', checked ? 'true' : 'false')
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemSettings;
