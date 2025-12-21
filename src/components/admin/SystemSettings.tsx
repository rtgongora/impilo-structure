import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Settings, Clock, Loader2, Save } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const TIMEOUT_OPTIONS = [
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '60', label: '1 hour' },
  { value: '120', label: '2 hours' },
  { value: '480', label: '8 hours' },
  { value: '1440', label: '24 hours' },
];

const SystemSettings: React.FC = () => {
  const { user } = useAuth();
  const [sessionTimeout, setSessionTimeout] = useState<string>('30');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalTimeout, setOriginalTimeout] = useState<string>('30');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('key', 'session_timeout_minutes')
      .maybeSingle();

    if (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } else if (data) {
      const value = String(data.value);
      setSessionTimeout(value);
      setOriginalTimeout(value);
    }
    setLoading(false);
  };

  const handleTimeoutChange = (value: string) => {
    setSessionTimeout(value);
    setHasChanges(value !== originalTimeout);
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    
    const { error } = await supabase
      .from('system_settings')
      .update({ 
        value: sessionTimeout,
        updated_at: new Date().toISOString(),
        updated_by: user.id
      })
      .eq('key', 'session_timeout_minutes');

    if (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } else {
      toast.success('Settings saved successfully');
      setOriginalTimeout(sessionTimeout);
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          System Settings
        </CardTitle>
        <CardDescription>
          Configure system-wide settings and preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Session Timeout Setting */}
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 rounded-lg border bg-muted/30">
            <Clock className="w-8 h-8 text-primary mt-1" />
            <div className="flex-1 space-y-3">
              <div>
                <Label className="text-base font-medium">Session Timeout</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically end user sessions after this period of inactivity. 
                  Active users will have their sessions extended automatically.
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <Select value={sessionTimeout} onValueChange={handleTimeoutChange}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select timeout" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEOUT_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {hasChanges && (
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                )}
              </div>
              
              <div className="text-xs text-muted-foreground">
                Current setting: Sessions will timeout after {sessionTimeout} minutes of inactivity. 
                The cleanup job runs every 5 minutes.
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemSettings;
