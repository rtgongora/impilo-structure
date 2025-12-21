import React from 'react';
import { usePermissions, Permission, permissionDescriptions } from '@/hooks/usePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, XCircle, Shield } from 'lucide-react';

const allPermissions: Permission[] = [
  'view_patient_records',
  'edit_patient_records',
  'prescribe_medication',
  'administer_medication',
  'order_labs',
  'view_lab_results',
  'create_referrals',
  'manage_teleconsults',
  'view_vitals',
  'edit_vitals',
  'manage_beds',
  'manage_queue',
  'view_clinical_notes',
  'write_clinical_notes',
  'manage_users',
  'system_admin',
  'critical_events',
  'view_care_plans',
  'edit_care_plans',
];

export const PermissionsDisplay: React.FC = () => {
  const { role, hasPermission, getPermissions } = usePermissions();
  
  const userPermissions = getPermissions();

  const getRoleBadgeColor = () => {
    switch (role) {
      case 'admin':
        return 'bg-destructive text-destructive-foreground';
      case 'doctor':
        return 'bg-primary text-primary-foreground';
      case 'specialist':
        return 'bg-secondary text-secondary-foreground';
      case 'nurse':
        return 'bg-success text-success-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" />
            <CardTitle>Your Permissions</CardTitle>
          </div>
          <Badge className={getRoleBadgeColor()}>
            {role?.toUpperCase() || 'NO ROLE'}
          </Badge>
        </div>
        <CardDescription>
          Based on your clinical role, you have access to the following features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {allPermissions.map((permission) => {
              const hasAccess = hasPermission(permission);
              return (
                <div
                  key={permission}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    hasAccess 
                      ? 'bg-success/5 border-success/20' 
                      : 'bg-muted/30 border-border/50'
                  }`}
                >
                  <span className={hasAccess ? 'text-foreground' : 'text-muted-foreground'}>
                    {permissionDescriptions[permission]}
                  </span>
                  {hasAccess ? (
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  ) : (
                    <XCircle className="w-5 h-5 text-muted-foreground/50" />
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
