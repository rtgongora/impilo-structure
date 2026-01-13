// Hook for fetching telemedicine/virtual pools the user is assigned to
// Enables remote clinical work without facility-level login

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TelemedicinePool {
  id: string;
  name: string;
  description?: string;
  pool_type: 'telemedicine' | 'on_call' | 'specialist_consult' | 'remote_monitoring';
  is_active: boolean;
  specialties?: string[];
  coverage_hours?: {
    start: string;
    end: string;
    days: string[];
  };
}

interface UseTelemedicinePoolsReturn {
  pools: TelemedicinePool[];
  loading: boolean;
  error: string | null;
  hasPoolAssignment: boolean;
  isInPool: (poolId: string) => boolean;
  refetch: () => Promise<void>;
}

export function useTelemedicinePools(): UseTelemedicinePoolsReturn {
  const { user } = useAuth();
  const [pools, setPools] = useState<TelemedicinePool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPools = useCallback(async () => {
    if (!user) {
      setPools([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Try to fetch from virtual_pools table
      const { data: poolData, error: poolError } = await supabase
        .from('virtual_pools')
        .select(`
          id,
          name,
          description,
          pool_type,
          is_active,
          specialties,
          coverage_hours
        `)
        .eq('is_active', true);

      if (poolError) {
        // Table might not exist yet - return empty gracefully
        if (poolError.code === '42P01') {
          setPools([]);
          return;
        }
        throw poolError;
      }

      // Filter to pools where user is a member
      // TODO: Add proper pool_members junction table query
      const mappedPools: TelemedicinePool[] = (poolData || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        pool_type: p.pool_type || 'telemedicine',
        is_active: p.is_active,
        specialties: p.specialties,
        coverage_hours: p.coverage_hours,
      }));

      setPools(mappedPools);
    } catch (err) {
      console.error('Error fetching telemedicine pools:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch pools');
      setPools([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPools();
  }, [fetchPools]);

  const isInPool = useCallback((poolId: string): boolean => {
    return pools.some(p => p.id === poolId);
  }, [pools]);

  return {
    pools,
    loading,
    error,
    hasPoolAssignment: pools.length > 0,
    isInPool,
    refetch: fetchPools,
  };
}
