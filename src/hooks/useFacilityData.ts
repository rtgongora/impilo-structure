/**
 * Hook for Facility Registry Data Management
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { 
  Facility, 
  FacilityType, 
  FacilityOwnershipType, 
  FacilityServiceCategory,
  FacilityAdminHierarchy,
  FacilityWorkflowStatus,
  FacilityService,
  FacilityIdentifier,
} from '@/types/facility';

interface UseFacilityDataOptions {
  status?: FacilityWorkflowStatus | 'all';
  search?: string;
  provinceId?: string;
  facilityTypeId?: string;
}

export const useFacilityData = (options: UseFacilityDataOptions = {}) => {
  const { user } = useAuth();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState({
    total: 0,
    draft: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  const fetchFacilities = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('facilities')
        .select('*')
        .order('name', { ascending: true });

      // Apply status filter
      if (options.status && options.status !== 'all') {
        query = query.eq('workflow_status', options.status);
      }

      // Apply search
      if (options.search) {
        query = query.or(`name.ilike.%${options.search}%,facility_code.ilike.%${options.search}%,city.ilike.%${options.search}%`);
      }

      // Apply province filter
      if (options.provinceId) {
        query = query.eq('admin_hierarchy_id', options.provinceId);
      }

      // Apply facility type filter
      if (options.facilityTypeId) {
        query = query.eq('facility_type_id', options.facilityTypeId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setFacilities((data || []) as Facility[]);

      // Get counts
      const { data: allData } = await supabase.from('facilities').select('workflow_status');
      if (allData) {
        setCounts({
          total: allData.length,
          draft: allData.filter(f => f.workflow_status === 'draft').length,
          pending: allData.filter(f => f.workflow_status === 'pending_approval').length,
          approved: allData.filter(f => f.workflow_status === 'approved').length,
          rejected: allData.filter(f => f.workflow_status === 'rejected').length,
        });
      }
    } catch (err) {
      console.error('Error fetching facilities:', err);
      setError('Failed to load facilities');
    } finally {
      setLoading(false);
    }
  }, [options.status, options.search, options.provinceId, options.facilityTypeId]);

  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  const createFacility = async (data: Partial<Facility>): Promise<Facility | null> => {
    try {
      // Generate facility code
      const { data: codeData, error: codeError } = await supabase.rpc('generate_facility_registry_id', {
        p_province_code: 'ZW'
      });

      if (codeError) {
        console.error('Error generating facility code:', codeError);
      }

      const { data: newFacility, error } = await supabase
        .from('facilities')
        .insert({
          ...data,
          facility_code: codeData || undefined,
          workflow_status: 'draft',
          created_by: user?.id,
          is_active: true,
        } as never)
        .select()
        .single();

      if (error) throw error;

      toast.success('Facility created successfully');
      await fetchFacilities();
      return newFacility as Facility;
    } catch (err) {
      console.error('Error creating facility:', err);
      toast.error('Failed to create facility');
      return null;
    }
  };

  const updateFacility = async (id: string, data: Partial<Facility>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('facilities')
        .update({
          ...data,
          last_modified_by: user?.id,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', id);

      if (error) throw error;

      toast.success('Facility updated successfully');
      await fetchFacilities();
      return true;
    } catch (err) {
      console.error('Error updating facility:', err);
      toast.error('Failed to update facility');
      return false;
    }
  };

  const submitForApproval = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('facilities')
        .update({
          workflow_status: 'pending_approval',
          submitted_at: new Date().toISOString(),
          submitted_by: user?.id,
        } as never)
        .eq('id', id);

      if (error) throw error;

      toast.success('Facility submitted for approval');
      await fetchFacilities();
      return true;
    } catch (err) {
      console.error('Error submitting facility:', err);
      toast.error('Failed to submit facility');
      return false;
    }
  };

  const approveFacility = async (id: string, notes?: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('facilities')
        .update({
          workflow_status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
          review_notes: notes,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        } as never)
        .eq('id', id);

      if (error) throw error;

      toast.success('Facility approved');
      await fetchFacilities();
      return true;
    } catch (err) {
      console.error('Error approving facility:', err);
      toast.error('Failed to approve facility');
      return false;
    }
  };

  const rejectFacility = async (id: string, reason: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('facilities')
        .update({
          workflow_status: 'rejected',
          review_notes: reason,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        } as never)
        .eq('id', id);

      if (error) throw error;

      toast.success('Facility rejected');
      await fetchFacilities();
      return true;
    } catch (err) {
      console.error('Error rejecting facility:', err);
      toast.error('Failed to reject facility');
      return false;
    }
  };

  return {
    facilities,
    loading,
    error,
    counts,
    refetch: fetchFacilities,
    createFacility,
    updateFacility,
    submitForApproval,
    approveFacility,
    rejectFacility,
  };
};

// Reference data hooks
export const useFacilityTypes = () => {
  const [types, setTypes] = useState<FacilityType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTypes = async () => {
      const { data, error } = await supabase
        .from('facility_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (!error && data) {
        setTypes(data as FacilityType[]);
      }
      setLoading(false);
    };

    fetchTypes();
  }, []);

  return { types, loading };
};

export const useFacilityOwnershipTypes = () => {
  const [types, setTypes] = useState<FacilityOwnershipType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTypes = async () => {
      const { data, error } = await supabase
        .from('facility_ownership_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (!error && data) {
        setTypes(data as FacilityOwnershipType[]);
      }
      setLoading(false);
    };

    fetchTypes();
  }, []);

  return { types, loading };
};

export const useFacilityServiceCategories = () => {
  const [categories, setCategories] = useState<FacilityServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('facility_service_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (!error && data) {
        setCategories(data as FacilityServiceCategory[]);
      }
      setLoading(false);
    };

    fetchCategories();
  }, []);

  return { categories, loading };
};

export const useFacilityAdminHierarchies = (level?: number) => {
  const [hierarchies, setHierarchies] = useState<FacilityAdminHierarchy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHierarchies = async () => {
      let query = supabase
        .from('facility_admin_hierarchies')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (level !== undefined) {
        query = query.eq('level', level);
      }

      const { data, error } = await query;

      if (!error && data) {
        setHierarchies(data as FacilityAdminHierarchy[]);
      }
      setLoading(false);
    };

    fetchHierarchies();
  }, [level]);

  return { hierarchies, loading };
};

export const useFacilityServices = (facilityId: string) => {
  const [services, setServices] = useState<FacilityService[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchServices = useCallback(async () => {
    if (!facilityId) {
      setServices([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('facility_services')
      .select('*')
      .eq('facility_id', facilityId)
      .order('service_name');

    if (!error && data) {
      setServices(data as FacilityService[]);
    }
    setLoading(false);
  }, [facilityId]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const addService = async (service: Partial<FacilityService>) => {
    const { error } = await supabase
      .from('facility_services')
      .insert({ ...service, facility_id: facilityId } as never);

    if (error) {
      toast.error('Failed to add service');
      return false;
    }

    toast.success('Service added');
    await fetchServices();
    return true;
  };

  const removeService = async (serviceId: string) => {
    const { error } = await supabase
      .from('facility_services')
      .delete()
      .eq('id', serviceId);

    if (error) {
      toast.error('Failed to remove service');
      return false;
    }

    toast.success('Service removed');
    await fetchServices();
    return true;
  };

  return { services, loading, addService, removeService, refetch: fetchServices };
};

export const useFacilityIdentifiers = (facilityId: string) => {
  const [identifiers, setIdentifiers] = useState<FacilityIdentifier[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIdentifiers = useCallback(async () => {
    if (!facilityId) {
      setIdentifiers([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('facility_identifiers')
      .select('*')
      .eq('facility_id', facilityId)
      .order('identifier_type');

    if (!error && data) {
      setIdentifiers(data as FacilityIdentifier[]);
    }
    setLoading(false);
  }, [facilityId]);

  useEffect(() => {
    fetchIdentifiers();
  }, [fetchIdentifiers]);

  const addIdentifier = async (identifier: Partial<FacilityIdentifier>) => {
    const { error } = await supabase
      .from('facility_identifiers')
      .insert({ ...identifier, facility_id: facilityId } as never);

    if (error) {
      toast.error('Failed to add identifier');
      return false;
    }

    toast.success('Identifier added');
    await fetchIdentifiers();
    return true;
  };

  return { identifiers, loading, addIdentifier, refetch: fetchIdentifiers };
};
