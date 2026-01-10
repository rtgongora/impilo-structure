// Above-Site Context Selection Component
// Implements AS-CTX-01 - Context selection for above-site users

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Building2, 
  Map, 
  Globe, 
  HeartPulse, 
  Video, 
  Network,
  ChevronRight,
  Shield,
  Eye
} from 'lucide-react';
import type { AboveSiteRole, ContextOption, AboveSiteContextType } from '@/types/aboveSite';
import { ABOVE_SITE_ROLE_LABELS } from '@/types/aboveSite';
import impiloLogo from '@/assets/impilo-logo.png';

interface AboveSiteContextSelectionProps {
  roles: AboveSiteRole[];
  availableContexts: ContextOption[];
  onContextSelected: (
    roleId: string,
    contextType: AboveSiteContextType,
    contextLabel: string,
    scope?: { province?: string; district?: string; programme?: string }
  ) => void;
  onBack: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  'building-2': <Building2 className="h-5 w-5" />,
  'map': <Map className="h-5 w-5" />,
  'globe': <Globe className="h-5 w-5" />,
  'heart-pulse': <HeartPulse className="h-5 w-5" />,
  'video': <Video className="h-5 w-5" />,
  'network': <Network className="h-5 w-5" />,
};

export const AboveSiteContextSelection: React.FC<AboveSiteContextSelectionProps> = ({
  roles,
  availableContexts,
  onContextSelected,
  onBack,
}) => {
  const [selectedRole, setSelectedRole] = useState<AboveSiteRole | null>(
    roles.length === 1 ? roles[0] : null
  );

  const handleContextSelect = (context: ContextOption) => {
    if (!selectedRole) return;

    onContextSelected(
      selectedRole.id,
      context.type,
      context.label,
      context.scope ? {
        province: context.scope.level === 'province' ? context.scope.value : undefined,
        district: context.scope.level === 'district' ? context.scope.value : undefined,
        programme: context.scope.level === 'programme' ? context.scope.value : undefined,
      } : undefined
    );
  };

  // Group contexts by type for better organization
  const groupedContexts = availableContexts.reduce((acc, ctx) => {
    const group = ctx.type.split('_')[0];
    if (!acc[group]) acc[group] = [];
    acc[group].push(ctx);
    return acc;
  }, {} as Record<string, ContextOption[]>);

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="text-center space-y-4">
        <div className="flex justify-center">
          <img src={impiloLogo} alt="Impilo" className="h-12 w-auto" />
        </div>
        <div>
          <CardTitle className="text-xl flex items-center justify-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Above-Site Access
          </CardTitle>
          <CardDescription>Select your operational context</CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Role Selection (if multiple roles) */}
        {roles.length > 1 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Role</label>
            <Select
              value={selectedRole?.id || ''}
              onValueChange={(value) => {
                const role = roles.find(r => r.id === value);
                setSelectedRole(role || null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose your active role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map(role => (
                  <SelectItem key={role.id} value={role.id}>
                    <div className="flex items-center gap-2">
                      <span>{role.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {ABOVE_SITE_ROLE_LABELS[role.role_type]}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Single Role Display */}
        {roles.length === 1 && (
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{roles[0].title}</p>
                <p className="text-sm text-muted-foreground">
                  {ABOVE_SITE_ROLE_LABELS[roles[0].role_type]}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {roles[0].can_intervene && (
                <Badge variant="secondary" className="text-xs">Can Intervene</Badge>
              )}
              {roles[0].can_act_as && (
                <Badge variant="secondary" className="text-xs">Can Act-As</Badge>
              )}
              {roles[0].can_access_patient_data && (
                <Badge variant="destructive" className="text-xs">Patient Data Access</Badge>
              )}
            </div>
          </div>
        )}

        {/* Context Selection */}
        {selectedRole && (
          <div className="space-y-3">
            <label className="text-sm font-medium">Select Operational Context</label>
            <div className="space-y-2">
              {availableContexts.map((context, index) => (
                <button
                  key={index}
                  onClick={() => handleContextSelect(context)}
                  className="w-full p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors text-left flex items-center gap-4 group"
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {ICON_MAP[context.icon] || <Globe className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{context.label}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {context.description}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No contexts available */}
        {selectedRole && availableContexts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No operational contexts available for this role.</p>
            <p className="text-sm">Contact your administrator for jurisdiction assignment.</p>
          </div>
        )}

        {/* Back button */}
        <Button
          variant="outline"
          onClick={onBack}
          className="w-full"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Login Options
        </Button>
      </CardContent>
    </Card>
  );
};
