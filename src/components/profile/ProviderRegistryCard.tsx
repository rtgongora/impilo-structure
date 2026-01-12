/**
 * Displays provider registry information from the Health Provider Registry (HPR)
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Stethoscope, 
  Award, 
  Building2, 
  Calendar, 
  Shield, 
  User,
  Briefcase,
  Globe,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import type { ProviderRegistryData, ProviderLicense, ProviderAffiliation } from '@/hooks/useProfileRegistry';

interface ProviderRegistryCardProps {
  provider: ProviderRegistryData | null;
  licenses: ProviderLicense[];
  affiliations: ProviderAffiliation[];
  loading: boolean;
}

const getLifecycleStateColor = (state: string) => {
  switch (state) {
    case 'active':
      return 'bg-success text-success-foreground';
    case 'suspended':
      return 'bg-warning text-warning-foreground';
    case 'inactive':
    case 'retired':
      return 'bg-muted text-muted-foreground';
    case 'deceased':
      return 'bg-destructive text-destructive-foreground';
    default:
      return 'bg-secondary text-secondary-foreground';
  }
};

const getLicenseStatusIcon = (status: string) => {
  switch (status) {
    case 'active':
      return <CheckCircle2 className="h-4 w-4 text-success" />;
    case 'expired':
      return <XCircle className="h-4 w-4 text-destructive" />;
    case 'suspended':
      return <AlertCircle className="h-4 w-4 text-warning" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

export const ProviderRegistryCard: React.FC<ProviderRegistryCardProps> = ({
  provider,
  licenses,
  affiliations,
  loading,
}) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!provider) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <Stethoscope className="h-5 w-5" />
            Provider Registry
          </CardTitle>
          <CardDescription>
            Your account is not linked to the Health Provider Registry (HPR)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Contact your facility administrator to register as a healthcare provider and obtain your Unified Provider ID (UPID).
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            Provider Registry (HPR)
          </span>
          <Badge className={getLifecycleStateColor(provider.lifecycle_state)}>
            {provider.lifecycle_state.toUpperCase()}
          </Badge>
        </CardTitle>
        <CardDescription>
          Your official provider identity from the Health Provider Registry
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* UPID and Basic Info */}
        <div className="bg-muted/50 rounded-lg p-4 border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Unified Provider ID</span>
            <Badge variant="outline" className="font-mono text-sm">
              {provider.upid}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Full Name</p>
              <p className="font-medium">
                {provider.first_name} {provider.other_names || ''} {provider.surname}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cadre</p>
              <p className="font-medium capitalize">{provider.cadre || 'Not specified'}</p>
            </div>
            {provider.specialty && (
              <div>
                <p className="text-xs text-muted-foreground">Specialty</p>
                <p className="font-medium">{provider.specialty}</p>
              </div>
            )}
            {provider.sub_specialty && (
              <div>
                <p className="text-xs text-muted-foreground">Sub-specialty</p>
                <p className="font-medium">{provider.sub_specialty}</p>
              </div>
            )}
            {provider.employee_number && (
              <div>
                <p className="text-xs text-muted-foreground">Employee Number</p>
                <p className="font-medium font-mono">{provider.employee_number}</p>
              </div>
            )}
            {provider.hire_date && (
              <div>
                <p className="text-xs text-muted-foreground">Hire Date</p>
                <p className="font-medium">{format(new Date(provider.hire_date), 'MMM d, yyyy')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Licenses Section */}
        {licenses.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Professional Licenses
            </h4>
            <div className="space-y-2">
              {licenses.map((license) => (
                <div 
                  key={license.id} 
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    {getLicenseStatusIcon(license.status)}
                    <div>
                      <p className="text-sm font-medium">{license.council_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {license.license_category} • Reg: {license.registration_number}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={license.status === 'active' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {license.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      Expires: {format(new Date(license.expiry_date), 'MMM yyyy')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Affiliations Section */}
        {affiliations.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Facility Affiliations
            </h4>
            <div className="space-y-2">
              {affiliations.map((affiliation) => (
                <div 
                  key={affiliation.id} 
                  className="p-3 bg-muted/30 rounded-lg border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{affiliation.facility_name}</p>
                      {affiliation.is_primary && (
                        <Badge variant="outline" className="text-xs">Primary</Badge>
                      )}
                    </div>
                    <Badge variant="secondary" className="capitalize text-xs">
                      {affiliation.employment_type}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      {affiliation.role}
                    </span>
                    {affiliation.department && (
                      <span>• {affiliation.department}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Since {format(new Date(affiliation.start_date), 'MMM yyyy')}
                    </span>
                  </div>
                  {affiliation.privileges && affiliation.privileges.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {affiliation.privileges.slice(0, 5).map((privilege, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {privilege}
                        </Badge>
                      ))}
                      {affiliation.privileges.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{affiliation.privileges.length - 5} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {provider.languages && provider.languages.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              Languages
            </h4>
            <div className="flex flex-wrap gap-2">
              {provider.languages.map((lang, idx) => (
                <Badge key={idx} variant="secondary">{lang}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
