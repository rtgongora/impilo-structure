/**
 * Telemedicine Roles Hook
 * Manages role-based access control for the telemedicine hub
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type TelemedicineRole = 
  | 'telemedicine_admin'
  | 'system_admin'
  | 'technician'
  | 'clinician'
  | 'specialist'
  | 'manager';

export interface TelemedicineUserRole {
  id: string;
  userId: string;
  role: TelemedicineRole;
  facilityId?: string;
  specialty?: string;
  isActive: boolean;
  expiresAt?: string;
}

export interface TelemedicinePermissions {
  canManageHub: boolean;
  canAcceptConsultations: boolean;
  canRouteConsultations: boolean;
  canViewAllCases: boolean;
  canManageRoles: boolean;
  canAccessPatientEHR: boolean;
  canPlaceOrders: boolean;
  canSubmitResponses: boolean;
}

const ROLE_PERMISSIONS: Record<TelemedicineRole, TelemedicinePermissions> = {
  telemedicine_admin: {
    canManageHub: true,
    canAcceptConsultations: true,
    canRouteConsultations: true,
    canViewAllCases: true,
    canManageRoles: true,
    canAccessPatientEHR: true,
    canPlaceOrders: true,
    canSubmitResponses: true,
  },
  system_admin: {
    canManageHub: true,
    canAcceptConsultations: false,
    canRouteConsultations: true,
    canViewAllCases: true,
    canManageRoles: true,
    canAccessPatientEHR: false,
    canPlaceOrders: false,
    canSubmitResponses: false,
  },
  manager: {
    canManageHub: false,
    canAcceptConsultations: false,
    canRouteConsultations: true,
    canViewAllCases: true,
    canManageRoles: false,
    canAccessPatientEHR: false,
    canPlaceOrders: false,
    canSubmitResponses: false,
  },
  specialist: {
    canManageHub: false,
    canAcceptConsultations: true,
    canRouteConsultations: true,
    canViewAllCases: false,
    canManageRoles: false,
    canAccessPatientEHR: true,
    canPlaceOrders: true,
    canSubmitResponses: true,
  },
  clinician: {
    canManageHub: false,
    canAcceptConsultations: true,
    canRouteConsultations: false,
    canViewAllCases: false,
    canManageRoles: false,
    canAccessPatientEHR: true,
    canPlaceOrders: true,
    canSubmitResponses: true,
  },
  technician: {
    canManageHub: false,
    canAcceptConsultations: false,
    canRouteConsultations: true,
    canViewAllCases: true,
    canManageRoles: false,
    canAccessPatientEHR: false,
    canPlaceOrders: false,
    canSubmitResponses: false,
  },
};

export function useTelemedicineRoles() {
  const [roles, setRoles] = useState<TelemedicineUserRole[]>([]);
  const [permissions, setPermissions] = useState<TelemedicinePermissions>({
    canManageHub: false,
    canAcceptConsultations: false,
    canRouteConsultations: false,
    canViewAllCases: false,
    canManageRoles: false,
    canAccessPatientEHR: false,
    canPlaceOrders: false,
    canSubmitResponses: false,
  });
  const [loading, setLoading] = useState(true);
  const [primaryRole, setPrimaryRole] = useState<TelemedicineRole | null>(null);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('telemedicine_user_roles')
        .select('*')
        .eq('user_id', user.data.user.id)
        .eq('is_active', true);

      if (error) throw error;

      const userRoles: TelemedicineUserRole[] = (data || []).map(r => ({
        id: r.id,
        userId: r.user_id,
        role: r.role as TelemedicineRole,
        facilityId: r.facility_id,
        specialty: r.specialty,
        isActive: r.is_active,
        expiresAt: r.expires_at,
      }));

      setRoles(userRoles);

      // Calculate combined permissions from all roles
      const combinedPermissions: TelemedicinePermissions = {
        canManageHub: false,
        canAcceptConsultations: false,
        canRouteConsultations: false,
        canViewAllCases: false,
        canManageRoles: false,
        canAccessPatientEHR: false,
        canPlaceOrders: false,
        canSubmitResponses: false,
      };

      // Role priority for primary role
      const rolePriority: TelemedicineRole[] = [
        'telemedicine_admin',
        'system_admin',
        'manager',
        'specialist',
        'clinician',
        'technician',
      ];

      let highestPriorityRole: TelemedicineRole | null = null;

      for (const userRole of userRoles) {
        const rolePerms = ROLE_PERMISSIONS[userRole.role];
        Object.keys(rolePerms).forEach((key) => {
          if (rolePerms[key as keyof TelemedicinePermissions]) {
            combinedPermissions[key as keyof TelemedicinePermissions] = true;
          }
        });

        // Track highest priority role
        const currentPriority = rolePriority.indexOf(userRole.role);
        const highestPriority = highestPriorityRole 
          ? rolePriority.indexOf(highestPriorityRole) 
          : Infinity;
        if (currentPriority < highestPriority) {
          highestPriorityRole = userRole.role;
        }
      }

      // If no telemedicine roles, default to clinician permissions for authenticated users
      if (userRoles.length === 0) {
        highestPriorityRole = 'clinician';
        Object.assign(combinedPermissions, ROLE_PERMISSIONS.clinician);
      }

      setPermissions(combinedPermissions);
      setPrimaryRole(highestPriorityRole);
    } catch (error) {
      console.error('[TelemedicineRoles] Error fetching roles:', error);
      // Default to clinician on error
      setPermissions(ROLE_PERMISSIONS.clinician);
      setPrimaryRole('clinician');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const hasRole = useCallback((role: TelemedicineRole): boolean => {
    return roles.some(r => r.role === role && r.isActive);
  }, [roles]);

  const hasAnyRole = useCallback((requiredRoles: TelemedicineRole[]): boolean => {
    return requiredRoles.some(role => hasRole(role));
  }, [hasRole]);

  const getRoleLabel = useCallback((role: TelemedicineRole): string => {
    const labels: Record<TelemedicineRole, string> = {
      telemedicine_admin: 'Telemedicine Administrator',
      system_admin: 'System Administrator',
      technician: 'Technical Support',
      clinician: 'Clinician',
      specialist: 'Specialist Consultant',
      manager: 'Operations Manager',
    };
    return labels[role];
  }, []);

  return {
    roles,
    permissions,
    primaryRole,
    loading,
    hasRole,
    hasAnyRole,
    getRoleLabel,
    refreshRoles: fetchRoles,
  };
}
