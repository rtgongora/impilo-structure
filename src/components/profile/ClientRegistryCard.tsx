/**
 * Displays client registry information from the National Client Registry
 * Shows the user's own health ID and patient identity
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  CreditCard, 
  MapPin, 
  Phone, 
  Mail,
  Fingerprint,
  User,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ClientRegistryData } from '@/hooks/useProfileRegistry';

interface ClientRegistryCardProps {
  client: ClientRegistryData | null;
  loading: boolean;
}

const getLifecycleStateColor = (state: string) => {
  switch (state) {
    case 'active':
      return 'bg-success text-success-foreground';
    case 'inactive':
      return 'bg-muted text-muted-foreground';
    case 'deceased':
      return 'bg-destructive text-destructive-foreground';
    case 'merged':
      return 'bg-warning text-warning-foreground';
    default:
      return 'bg-secondary text-secondary-foreground';
  }
};

export const ClientRegistryCard: React.FC<ClientRegistryCardProps> = ({
  client,
  loading,
}) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!client) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <Heart className="h-5 w-5" />
            My Health ID
          </CardTitle>
          <CardDescription>
            You don't have a linked Health ID in the Client Registry
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            As a healthcare provider, you can also register yourself as a patient to access your own health records.
          </p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/portal')}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Create My Health ID
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            My Health ID
          </span>
          <Badge className={getLifecycleStateColor(client.lifecycle_state)}>
            {client.lifecycle_state.toUpperCase()}
          </Badge>
        </CardTitle>
        <CardDescription>
          Your personal health identity from the National Client Registry
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Health ID Card */}
        <div className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-lg p-4 border border-pink-500/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Patient Health ID</span>
            {client.biometric_enrolled && (
              <Badge variant="outline" className="text-xs gap-1">
                <Fingerprint className="h-3 w-3" />
                Biometric
              </Badge>
            )}
          </div>
          <p className="text-2xl font-bold font-mono tracking-wider text-primary mb-3">
            {client.health_id}
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Full Name</p>
              <p className="font-medium">
                {client.given_names} {client.other_names || ''} {client.family_name}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sex</p>
              <p className="font-medium capitalize">{client.sex}</p>
            </div>
            {client.date_of_birth && (
              <div>
                <p className="text-xs text-muted-foreground">Date of Birth</p>
                <p className="font-medium">{client.date_of_birth}</p>
              </div>
            )}
            {client.nationality && (
              <div>
                <p className="text-xs text-muted-foreground">Nationality</p>
                <p className="font-medium">{client.nationality}</p>
              </div>
            )}
          </div>
        </div>

        {/* Contact & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {client.phone_primary && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{client.phone_primary}</span>
            </div>
          )}
          {client.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{client.email}</span>
            </div>
          )}
          {(client.district || client.province) && (
            <div className="flex items-center gap-2 text-sm col-span-full">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>
                {[client.district, client.province].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/portal')}
          >
            <Heart className="mr-2 h-4 w-4" />
            My Health Portal
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/portal?tab=card')}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            View ID Card
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
