/**
 * Hook for Registry Admin Role Management
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { RegistryRole, RegistryAdminRole } from '@/types/registry';

interface UseRegistryAdminReturn {
  registryRoles: RegistryAdminRole[];
  loading: boolean;
  hasRegistryRole: (role: RegistryRole) => boolean;
  hasAnyRegistryRole: (roles: RegistryRole[]) => boolean;
  isRegistrySuperAdmin: boolean;
  canManageRegistry: (registryType: 'client' | 'provider' | 'facility' | 'terminology' | 'shr' | 'ndr') => boolean;
  refetch: () => Promise<void>;
}

const REGISTRY_ROLE_MAP: Record<string, RegistryRole> = {
  client: 'client_registry_admin',
  provider: 'provider_registry_admin',
  facility: 'facility_registry_admin',
  terminology: 'terminology_admin',
  shr: 'shr_admin',
  ndr: 'ndr_admin',
};

export const useRegistryAdmin = (): UseRegistryAdminReturn => {
  const { user } = useAuth();
  const [registryRoles, setRegistryRoles] = useState<RegistryAdminRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRegistryRoles = async () => {
    if (!user) {
      setRegistryRoles([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('registry_admin_roles')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching registry roles:', error);
        setRegistryRoles([]);
      } else {
        setRegistryRoles(data as RegistryAdminRole[] || []);
      }
    } catch (err) {
      console.error('Error in useRegistryAdmin:', err);
      setRegistryRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistryRoles();
  }, [user]);

  const hasRegistryRole = (role: RegistryRole): boolean => {
    return registryRoles.some(r => 
      (r.registry_role === role || r.registry_role === 'registry_super_admin') &&
      (!r.expires_at || new Date(r.expires_at) > new Date())
    );
  };

  const hasAnyRegistryRole = (roles: RegistryRole[]): boolean => {
    return roles.some(hasRegistryRole);
  };

  const isRegistrySuperAdmin = hasRegistryRole('registry_super_admin');

  const canManageRegistry = (registryType: 'client' | 'provider' | 'facility' | 'terminology' | 'shr' | 'ndr'): boolean => {
    const requiredRole = REGISTRY_ROLE_MAP[registryType];
    return hasRegistryRole(requiredRole);
  };

  return {
    registryRoles,
    loading,
    hasRegistryRole,
    hasAnyRegistryRole,
    isRegistrySuperAdmin,
    canManageRegistry,
    refetch: fetchRegistryRoles,
  };
};
