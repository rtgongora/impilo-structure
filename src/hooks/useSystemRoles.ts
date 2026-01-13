// Hook for detecting system-level roles like superadmin, support staff, managers
// These are distinct from clinical roles and above-site oversight roles

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type SystemRole = 
  | 'system_superadmin'   // Full system access for technical support
  | 'facility_manager'    // Manages one or more facilities (non-clinical)
  | 'support_staff'       // IT/technical support staff
  | 'operations_manager'  // Operations oversight across facilities
  | 'finance_manager'     // Financial oversight
  | 'hr_manager'          // HR/staffing oversight
  | 'dev_tester';         // Development/testing role with full visibility

export interface SystemRoleAssignment {
  id: string;
  user_id: string;
  system_role: SystemRole;
  scope?: {
    facilityIds?: string[];
    regionCodes?: string[];
    isNational?: boolean;
  };
  is_active: boolean;
  expires_at?: string;
  created_at: string;
}

interface UseSystemRolesReturn {
  systemRoles: SystemRoleAssignment[];
  loading: boolean;
  isSuperAdmin: boolean;
  isSupportStaff: boolean;
  isManager: boolean;
  isDevTester: boolean;
  hasSystemRole: (role: SystemRole) => boolean;
  canAccessAllFacilities: boolean;
  canBypassRestrictions: boolean; // For dev/test mode
  getManagedFacilityIds: () => string[];
  refetch: () => Promise<void>;
}

// Dev/test emails that get unrestricted access
const DEV_TEST_EMAILS = [
  'admin@impilo.health',
  'rgongora536@gmail.com',
  'sarah.moyo@impilo.health',
];

export function useSystemRoles(): UseSystemRolesReturn {
  const { user, profile } = useAuth();
  const [systemRoles, setSystemRoles] = useState<SystemRoleAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSystemRoles = useCallback(async () => {
    if (!user) {
      setSystemRoles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Check user_roles table for admin role (which maps to superadmin)
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
      }

      const hasAdminRole = userRoles?.some(r => r.role === 'admin') || profile?.role === 'admin';
      
      // Check if user email is in dev/test list
      const isDevTestUser = user.email && DEV_TEST_EMAILS.includes(user.email.toLowerCase());

      // Build system roles from available data
      const roles: SystemRoleAssignment[] = [];

      if (hasAdminRole) {
        roles.push({
          id: 'admin-role',
          user_id: user.id,
          system_role: 'system_superadmin',
          scope: { isNational: true },
          is_active: true,
          created_at: new Date().toISOString(),
        });
      }

      if (isDevTestUser) {
        roles.push({
          id: 'dev-tester-role',
          user_id: user.id,
          system_role: 'dev_tester',
          scope: { isNational: true },
          is_active: true,
          created_at: new Date().toISOString(),
        });
      }

      // TODO: In future, fetch from a dedicated system_roles table
      // For now, infer from existing role patterns
      
      setSystemRoles(roles);
    } catch (err) {
      console.error('Error in useSystemRoles:', err);
      setSystemRoles([]);
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    fetchSystemRoles();
  }, [fetchSystemRoles]);

  const hasSystemRole = useCallback((role: SystemRole): boolean => {
    return systemRoles.some(r => 
      r.system_role === role && 
      r.is_active &&
      (!r.expires_at || new Date(r.expires_at) > new Date())
    );
  }, [systemRoles]);

  const isSuperAdmin = hasSystemRole('system_superadmin');
  const isDevTester = hasSystemRole('dev_tester');
  const isSupportStaff = hasSystemRole('support_staff') || isSuperAdmin;
  const isManager = hasSystemRole('facility_manager') || 
                    hasSystemRole('operations_manager') || 
                    hasSystemRole('finance_manager') ||
                    hasSystemRole('hr_manager');

  const canAccessAllFacilities = isSuperAdmin || isDevTester ||
    systemRoles.some(r => r.scope?.isNational);

  // Dev/testers and superadmins can bypass all restrictions
  const canBypassRestrictions = isSuperAdmin || isDevTester;

  const getManagedFacilityIds = useCallback((): string[] => {
    const facilityIds = new Set<string>();
    systemRoles.forEach(r => {
      if (r.scope?.facilityIds) {
        r.scope.facilityIds.forEach(id => facilityIds.add(id));
      }
    });
    return Array.from(facilityIds);
  }, [systemRoles]);

  return {
    systemRoles,
    loading,
    isSuperAdmin,
    isSupportStaff,
    isManager,
    isDevTester,
    hasSystemRole,
    canAccessAllFacilities,
    canBypassRestrictions,
    getManagedFacilityIds,
    refetch: fetchSystemRoles,
  };
}
