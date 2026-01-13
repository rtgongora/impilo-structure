// WorkplaceSelectionHub - Post-login hub for selecting work context
// Shows profile summary, all work locations, key alerts, and context selection

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Building2,
  MapPin,
  Crown,
  Shield,
  Star,
  ChevronRight,
  Bell,
  AlertTriangle,
  Clock,
  User,
  Globe,
  Map,
  Video,
  Heart,
  Briefcase,
  Home,
  Wifi,
  Network,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProviderFacilities, type ProviderFacility } from '@/hooks/useProviderFacilities';
import { useAboveSiteRole } from '@/hooks/useAboveSiteRole';
import type { ContextOption } from '@/types/aboveSite';
import impiloLogo from '@/assets/impilo-logo.png';

interface WorkplaceSelectionHubProps {
  onFacilitySelect: (facility: ProviderFacility) => void;
  onAboveSiteSelect: (
    roleId: string,
    contextType: string,
    contextLabel: string,
    jurisdiction?: { province?: string; district?: string; programme?: string }
  ) => void;
  onRemoteSelect: () => void;
}

// Level of care display order and styling
const LEVEL_ORDER: Record<string, number> = {
  'tertiary': 1,
  'secondary': 2,
  'primary': 3,
  'district': 4,
  'clinic': 5,
  'community': 6,
};

const LEVEL_COLORS: Record<string, string> = {
  'tertiary': 'bg-purple-100 text-purple-700 border-purple-200',
  'secondary': 'bg-blue-100 text-blue-700 border-blue-200',
  'primary': 'bg-green-100 text-green-700 border-green-200',
  'district': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'clinic': 'bg-amber-100 text-amber-700 border-amber-200',
  'community': 'bg-rose-100 text-rose-700 border-rose-200',
};

const CONTEXT_ICONS: Record<string, React.ReactNode> = {
  'building-2': <Building2 className="h-5 w-5" />,
  'map': <Map className="h-5 w-5" />,
  'globe': <Globe className="h-5 w-5" />,
  'heart-pulse': <Heart className="h-5 w-5" />,
  'video': <Video className="h-5 w-5" />,
  'network': <Network className="h-5 w-5" />,
};

export function WorkplaceSelectionHub({
  onFacilitySelect,
  onAboveSiteSelect,
  onRemoteSelect,
}: WorkplaceSelectionHubProps) {
  const { profile } = useAuth();
  const { facilities, loading: facilitiesLoading } = useProviderFacilities();
  const { 
    isAboveSiteUser, 
    roles: aboveSiteRoles, 
    availableContexts,
    loading: aboveSiteLoading 
  } = useAboveSiteRole();

  // Group facilities by level of care
  const groupedFacilities = useMemo(() => {
    const groups: Record<string, ProviderFacility[]> = {};
    
    facilities.forEach((facility) => {
      const level = facility.level_of_care?.toLowerCase() || 'other';
      if (!groups[level]) groups[level] = [];
      groups[level].push(facility);
    });

    // Sort groups by level order
    return Object.entries(groups).sort(([a], [b]) => {
      return (LEVEL_ORDER[a] || 99) - (LEVEL_ORDER[b] || 99);
    });
  }, [facilities]);

  const loading = facilitiesLoading || aboveSiteLoading;
  const hasNoWorkplaces = !loading && facilities.length === 0 && !isAboveSiteUser;

  const getDisplayName = () => {
    const role = profile?.role;
    const name = profile?.display_name || 'User';
    if (role === 'doctor' || role === 'specialist') return `Dr ${name}`;
    if (role === 'nurse') return `Nurse ${name}`;
    return name;
  };

  const handleAboveSiteClick = (context: ContextOption) => {
    const roleId = aboveSiteRoles[0]?.id || '';
    onAboveSiteSelect(
      roleId,
      context.type,
      context.label,
      context.scope ? {
        province: context.scope.level === 'province' ? context.scope.value : undefined,
        district: context.scope.level === 'district' ? context.scope.value : undefined,
        programme: context.scope.level === 'programme' ? context.scope.value : undefined,
      } : undefined
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Profile Summary Section */}
      <div className="flex-shrink-0 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent rounded-xl p-4 mb-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/20 shadow-md">
            <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || 'User'} />
            <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
              {profile?.display_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || <User className="h-6 w-6" />}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold truncate">{getDisplayName()}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="secondary" className="capitalize">
                {profile?.role || 'Provider'}
              </Badge>
              {profile?.specialty && (
                <Badge variant="outline" className="text-xs">
                  {profile.specialty}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Ready to start your day</span>
            </div>
          </div>
        </div>
      </div>

      {/* Key Alerts Section */}
      <Card className="flex-shrink-0 mb-4 border-amber-200 bg-amber-50/50">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bell className="h-4 w-4 text-amber-600" />
            Key Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2 px-4">
          <div className="text-sm text-muted-foreground">
            No urgent alerts at this time.
          </div>
        </CardContent>
      </Card>

      {/* Question/Prompt */}
      <div className="flex-shrink-0 mb-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Where are you working from today?
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Select your work location to access relevant modules and patient data
        </p>
      </div>

      {/* Scrollable Workplace Options */}
      <ScrollArea className="flex-1 -mx-1 px-1">
        <div className="space-y-4 pb-4">
          {/* Loading State */}
          {loading && (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}

          {/* No Workplaces State */}
          {hasNoWorkplaces && (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <h4 className="font-medium mb-1">No Workplaces Assigned</h4>
                <p className="text-sm text-muted-foreground">
                  Contact your administrator to assign you to a facility.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Facility Workplaces */}
          {!loading && groupedFacilities.map(([level, levelFacilities]) => (
            <div key={level} className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">
                {level.charAt(0).toUpperCase() + level.slice(1)} Level
              </h4>
              {levelFacilities.map((facility, index) => (
                <FacilityCard
                  key={facility.facility_id}
                  facility={facility}
                  onSelect={() => onFacilitySelect(facility)}
                  levelColor={LEVEL_COLORS[level] || 'bg-gray-100 text-gray-700'}
                  index={index}
                />
              ))}
            </div>
          ))}

          {/* Above-Site Options */}
          {!loading && isAboveSiteUser && availableContexts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1 flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" />
                Above-Site / Oversight Roles
              </h4>
              {availableContexts.map((context, index) => (
                <AboveSiteContextCard
                  key={`${context.type}-${index}`}
                  context={context}
                  onSelect={() => handleAboveSiteClick(context)}
                  index={index}
                />
              ))}
            </div>
          )}

          {/* Remote Work Option */}
          {!loading && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1 flex items-center gap-1">
                <Wifi className="h-3.5 w-3.5" />
                Other Options
              </h4>
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={onRemoteSelect}
                className="w-full p-4 rounded-lg border border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-all text-left flex items-center gap-4 group"
              >
                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <Home className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">Remote / Off-Site Work</p>
                  <p className="text-sm text-muted-foreground">
                    Administrative tasks, documentation, or training
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </motion.button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// Sub-component for facility cards
function FacilityCard({
  facility,
  onSelect,
  levelColor,
  index,
}: {
  facility: ProviderFacility;
  onSelect: () => void;
  levelColor: string;
  index: number;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onSelect}
      className="w-full p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 hover:shadow-sm transition-all text-left flex items-center gap-4 group"
    >
      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        <Building2 className="h-6 w-6" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium truncate">{facility.facility_name}</p>
          {facility.is_primary && (
            <Star className="h-4 w-4 text-amber-500 flex-shrink-0" fill="currentColor" />
          )}
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={`text-xs ${levelColor}`}>
            {facility.facility_type}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {facility.context_label}
          </Badge>
          {facility.is_pic && (
            <Badge className="text-xs bg-indigo-100 text-indigo-700 border-indigo-200">
              <Shield className="h-3 w-3 mr-1" />
              PIC
            </Badge>
          )}
          {facility.is_owner && (
            <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200">
              <Crown className="h-3 w-3 mr-1" />
              Owner
            </Badge>
          )}
        </div>
      </div>
      
      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
    </motion.button>
  );
}

// Sub-component for above-site context cards
function AboveSiteContextCard({
  context,
  onSelect,
  index,
}: {
  context: ContextOption;
  onSelect: () => void;
  index: number;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.05 }}
      onClick={onSelect}
      className="w-full p-4 rounded-lg border border-border hover:border-indigo-300 hover:bg-indigo-50/30 transition-all text-left flex items-center gap-4 group"
    >
      <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
        {CONTEXT_ICONS[context.icon] || <Globe className="h-6 w-6" />}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{context.label}</p>
        <p className="text-sm text-muted-foreground truncate">
          {context.description}
        </p>
      </div>
      
      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-indigo-600 transition-colors flex-shrink-0" />
    </motion.button>
  );
}

export default WorkplaceSelectionHub;
