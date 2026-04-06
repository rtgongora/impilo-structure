import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'admin' | 'moderator' | 'user';

// Clinical roles from profile (for clinical features)
export type ClinicalRole =
  | 'doctor' | 'specialist' | 'intern_doctor' | 'registrar' | 'consultant'
  | 'dentist' | 'dental_therapist'
  | 'nurse' | 'nurse_practitioner' | 'enrolled_nurse' | 'midwife'
  | 'physiotherapist' | 'occupational_therapist' | 'speech_therapist'
  | 'dietitian' | 'psychologist' | 'social_worker' | 'audiologist'
  | 'optometrist' | 'podiatrist' | 'biokinetician' | 'orthotist_prosthetist'
  | 'respiratory_therapist' | 'radiotherapist'
  | 'radiographer' | 'sonographer' | 'lab_tech' | 'pharmacist' | 'pharmacy_tech'
  | 'paramedic' | 'emt'
  | 'oral_hygienist'
  | 'chw' | 'env_health' | 'health_promoter'
  | 'admin' | 'health_info_officer' | 'receptionist'
  | 'patient';

// Combined role type for module access control
export type ModuleAccessRole = ClinicalRole | AppRole | 'vendor' | 'registrar' | 'hie_admin';

interface UseUserRolesReturn {
  appRoles: AppRole[];
  clinicalRole: ClinicalRole | null;
  loading: boolean;
  hasAppRole: (role: AppRole) => boolean;
  hasAnyAppRole: (roles: AppRole[]) => boolean;
  hasClinicalRole: (role: ClinicalRole) => boolean;
  hasAnyRole: (roles: ModuleAccessRole[]) => boolean;
  isAdmin: boolean;
  canAccessModule: (allowedRoles?: ModuleAccessRole[]) => boolean;
}

export const useUserRoles = (): UseUserRolesReturn => {
  const { user, profile, loading: authLoading } = useAuth();
  const [appRoles, setAppRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      if (!user) {
        setAppRoles([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching user roles:', error);
          setAppRoles([]);
        } else {
          // Cast the roles from the database
          const roles = (data || []).map(r => r.role as AppRole);
          setAppRoles(roles);
        }
      } catch (err) {
        console.error('Error in useUserRoles:', err);
        setAppRoles([]);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchRoles();
    }
  }, [user, authLoading]);

  const clinicalRole = profile?.role as ClinicalRole | null;

  const hasAppRole = (role: AppRole): boolean => {
    return appRoles.includes(role);
  };

  const hasAnyAppRole = (roles: AppRole[]): boolean => {
    return roles.some(role => appRoles.includes(role));
  };

  const hasClinicalRole = (role: ClinicalRole): boolean => {
    return clinicalRole === role;
  };

  const hasAnyRole = (roles: ModuleAccessRole[]): boolean => {
    // Check app roles
    const hasMatchingAppRole = roles.some(role => 
      appRoles.includes(role as AppRole)
    );
    
    // Check clinical role
    const hasMatchingClinicalRole = clinicalRole ? roles.includes(clinicalRole) : false;
    
    return hasMatchingAppRole || hasMatchingClinicalRole;
  };

  const isAdmin = hasAppRole('admin') || clinicalRole === 'admin';

  const canAccessModule = (allowedRoles?: ModuleAccessRole[]): boolean => {
    // If no roles specified, module is accessible to all authenticated users
    if (!allowedRoles || allowedRoles.length === 0) {
      return true;
    }
    
    // Admins can access everything
    if (isAdmin) {
      return true;
    }
    
    return hasAnyRole(allowedRoles);
  };

  return {
    appRoles,
    clinicalRole,
    loading: loading || authLoading,
    hasAppRole,
    hasAnyAppRole,
    hasClinicalRole,
    hasAnyRole,
    isAdmin,
    canAccessModule,
  };
};
