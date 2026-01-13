// WorkplaceSelectionHub - Post-login hub for selecting work context
// Shows profile summary, all work locations, key alerts, and context selection
// Supports: clinical facilities, above-site oversight, combined views, remote/pool work, and support mode

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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
  Home,
  Wifi,
  Network,
  Layers,
  Settings,
  Headphones,
  Eye,
  Stethoscope,
  BarChart3,
  Users,
  Briefcase,
  Lock,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProviderFacilities, type ProviderFacility } from '@/hooks/useProviderFacilities';
import { useAboveSiteRole } from '@/hooks/useAboveSiteRole';
import { useSystemRoles } from '@/hooks/useSystemRoles';
import { useTelemedicinePools } from '@/hooks/useTelemedicinePools';
import type { ContextOption } from '@/types/aboveSite';
import type { AccessMode } from '@/hooks/useActiveWorkContext';

interface WorkplaceSelectionHubProps {
  onFacilitySelect: (facility: ProviderFacility) => void;
  onAboveSiteSelect: (
    roleId: string,
    roleType: string,
    contextType: string,
    contextLabel: string,
    jurisdiction?: { province?: string; district?: string; programme?: string; facilityIds?: string[] },
    canAccessPatientData?: boolean,
    canIntervene?: boolean
  ) => void;
  onCombinedViewSelect: (
    totalFacilities: number,
    levels: string[],
    regions: string[],
    aboveSiteRoleId?: string
  ) => void;
  onRemoteSelect: (isClinical?: boolean, poolId?: string, poolName?: string) => void;
  onSupportModeSelect?: (targetFacilityId?: string, targetFacilityName?: string, reason?: string) => void;
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
  onCombinedViewSelect,
  onRemoteSelect,
  onSupportModeSelect,
}: WorkplaceSelectionHubProps) {
  const { profile } = useAuth();
  const { facilities, loading: facilitiesLoading } = useProviderFacilities();
  const { 
    isAboveSiteUser, 
    roles: aboveSiteRoles, 
    availableContexts,
    loading: aboveSiteLoading 
  } = useAboveSiteRole();
  const { isSuperAdmin, isSupportStaff, isManager, loading: systemRolesLoading } = useSystemRoles();
  const { pools, hasPoolAssignment, loading: poolsLoading } = useTelemedicinePools();

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

  // Calculate stats for combined view option
  const facilityStats = useMemo(() => {
    const levels = new Set<string>();
    const regions = new Set<string>();
    
    facilities.forEach(f => {
      if (f.level_of_care) levels.add(f.level_of_care);
      // TODO: Extract region from facility data when available
    });
    
    return {
      total: facilities.length,
      levels: Array.from(levels),
      regions: Array.from(regions),
    };
  }, [facilities]);

  const loading = facilitiesLoading || aboveSiteLoading || systemRolesLoading || poolsLoading;
  const hasNoWorkplaces = !loading && facilities.length === 0 && !isAboveSiteUser && !isSuperAdmin && !hasPoolAssignment;
  
  // Determine if user should see combined view option
  const showCombinedViewOption = facilities.length > 3 || (isManager && facilities.length > 1);
  
  // Determine if user has clinical access at any facility
  const hasClinicalFacilities = facilities.some(f => f.can_access);

  const getDisplayName = () => {
    const role = profile?.role;
    const name = profile?.display_name || 'User';
    if (role === 'doctor' || role === 'specialist') return `Dr ${name}`;
    if (role === 'nurse') return `Nurse ${name}`;
    return name;
  };

  const getRoleDescription = () => {
    if (isSuperAdmin) return 'System Administrator';
    if (isSupportStaff) return 'Technical Support';
    if (isManager) return 'Facility Manager';
    if (isAboveSiteUser) return 'Oversight Role';
    return profile?.role || 'Healthcare Worker';
  };

  const handleAboveSiteClick = (context: ContextOption) => {
    const role = aboveSiteRoles[0];
    if (!role) return;
    
    onAboveSiteSelect(
      role.id,
      role.role_type,
      context.type,
      context.label,
      context.scope ? {
        province: context.scope.level === 'province' ? context.scope.value : undefined,
        district: context.scope.level === 'district' ? context.scope.value : undefined,
        programme: context.scope.level === 'programme' ? context.scope.value : undefined,
      } : undefined,
      role.can_access_patient_data,
      role.can_intervene
    );
  };

  const handleCombinedViewClick = () => {
    onCombinedViewSelect(
      facilityStats.total,
      facilityStats.levels,
      facilityStats.regions,
      aboveSiteRoles[0]?.id
    );
  };

  const handleSupportModeClick = () => {
    if (onSupportModeSelect) {
      onSupportModeSelect();
    }
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
                {getRoleDescription()}
              </Badge>
              {profile?.specialty && (
                <Badge variant="outline" className="text-xs">
                  {profile.specialty}
                </Badge>
              )}
              {isSuperAdmin && (
                <Badge className="bg-rose-100 text-rose-700 border-rose-200 text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Superadmin
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
          Select your work location to access relevant modules and data
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

          {/* System Support Mode (Superadmin Only) */}
          {!loading && isSuperAdmin && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1 flex items-center gap-1">
                <Settings className="h-3.5 w-3.5" />
                System Administration
              </h4>
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleSupportModeClick}
                className="w-full p-4 rounded-lg border-2 border-rose-200 bg-rose-50/50 hover:border-rose-400 hover:bg-rose-100/50 transition-all text-left flex items-center gap-4 group"
              >
                <div className="h-12 w-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                  <Headphones className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Technical Support Mode</p>
                    <Badge className="bg-rose-100 text-rose-700 text-xs">Admin</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Access any facility for technical support (no patient data)
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-rose-600 transition-colors flex-shrink-0" />
              </motion.button>
            </div>
          )}

          {/* Combined/Aggregate View Option */}
          {!loading && showCombinedViewOption && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1 flex items-center gap-1">
                <Layers className="h-3.5 w-3.5" />
                Aggregate Views
              </h4>
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleCombinedViewClick}
                className="w-full p-4 rounded-lg border border-indigo-200 bg-indigo-50/30 hover:border-indigo-400 hover:bg-indigo-100/50 transition-all text-left flex items-center gap-4 group"
              >
                <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Combined View</p>
                    <Badge variant="outline" className="text-xs">
                      {facilityStats.total} facilities
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Aggregate dashboard across all your facilities
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Lock className="h-3 w-3 text-amber-500" />
                    <span className="text-xs text-amber-600">No patient data access</span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-indigo-600 transition-colors flex-shrink-0" />
              </motion.button>
            </div>
          )}

          {/* Clinical Facility Workplaces */}
          {!loading && hasClinicalFacilities && groupedFacilities.length > 0 && (
            <>
              <Separator className="my-2" />
              <div className="flex items-center gap-2 px-1">
                <Stethoscope className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Clinical Workplaces</span>
                <Badge variant="secondary" className="text-xs ml-auto">
                  {facilities.length} locations
                </Badge>
              </div>
            </>
          )}
          
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
                  showClinicalIndicator={true}
                />
              ))}
            </div>
          ))}

          {/* Above-Site / Oversight Options */}
          {!loading && isAboveSiteUser && availableContexts.length > 0 && (
            <div className="space-y-2">
              <Separator className="my-2" />
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1 flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                Oversight Roles
              </h4>
              <p className="text-xs text-muted-foreground px-1 mb-2">
                Administrative oversight without direct patient care
              </p>
              {availableContexts.map((context, index) => (
                <AboveSiteContextCard
                  key={`${context.type}-${index}`}
                  context={context}
                  onSelect={() => handleAboveSiteClick(context)}
                  index={index}
                  canAccessPatientData={aboveSiteRoles[0]?.can_access_patient_data}
                />
              ))}
            </div>
          )}

          {/* Telemedicine / Virtual Pools */}
          {!loading && hasPoolAssignment && (
            <div className="space-y-2">
              <Separator className="my-2" />
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1 flex items-center gap-1">
                <Video className="h-3.5 w-3.5" />
                Virtual Care Pools
              </h4>
              {pools.map((pool, index) => (
                <motion.button
                  key={pool.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  onClick={() => onRemoteSelect(true, pool.id, pool.name)}
                  className="w-full p-4 rounded-lg border border-teal-200 bg-teal-50/30 hover:border-teal-400 hover:bg-teal-100/50 transition-all text-left flex items-center gap-4 group"
                >
                  <div className="h-12 w-12 rounded-xl bg-teal-100 flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                    <Video className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{pool.name}</p>
                      <Badge className="bg-teal-100 text-teal-700 text-xs">Clinical</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {pool.description || 'Telemedicine consultations'}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-teal-600 transition-colors flex-shrink-0" />
                </motion.button>
              ))}
            </div>
          )}

          {/* Remote Work Option */}
          {!loading && (
            <div className="space-y-2">
              <Separator className="my-2" />
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1 flex items-center gap-1">
                <Wifi className="h-3.5 w-3.5" />
                Other Options
              </h4>
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={() => onRemoteSelect(false)}
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
                  <div className="flex items-center gap-1 mt-1">
                    <Lock className="h-3 w-3 text-amber-500" />
                    <span className="text-xs text-amber-600">No patient data access</span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
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
  showClinicalIndicator,
}: {
  facility: ProviderFacility;
  onSelect: () => void;
  levelColor: string;
  index: number;
  showClinicalIndicator?: boolean;
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
          {showClinicalIndicator && facility.can_access && (
            <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
              <Stethoscope className="h-3 w-3 mr-1" />
              Clinical
            </Badge>
          )}
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
  canAccessPatientData,
}: {
  context: ContextOption;
  onSelect: () => void;
  index: number;
  canAccessPatientData?: boolean;
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
        {!canAccessPatientData && (
          <div className="flex items-center gap-1 mt-1">
            <Lock className="h-3 w-3 text-amber-500" />
            <span className="text-xs text-amber-600">Aggregate data only</span>
          </div>
        )}
      </div>
      
      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-indigo-600 transition-colors flex-shrink-0" />
    </motion.button>
  );
}

export default WorkplaceSelectionHub;
