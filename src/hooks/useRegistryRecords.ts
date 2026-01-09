/**
 * Hook for Registry Records Management
 * Provides CRUD operations and approval workflows
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { 
  ClientRegistryRecord, 
  ProviderRegistryRecord, 
  FacilityRegistryRecord,
  RegistryRecordStatus,
  RegistryType,
} from '@/types/registry';

interface UseRegistryRecordsOptions {
  registryType: RegistryType;
  statusFilter?: RegistryRecordStatus[];
  searchQuery?: string;
}

interface UseRegistryRecordsReturn<T> {
  records: T[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  pendingCount: number;
  refetch: () => Promise<void>;
  createRecord: (data: Partial<T>) => Promise<T | null>;
  updateRecord: (id: string, data: Partial<T>) => Promise<boolean>;
  submitForApproval: (id: string) => Promise<boolean>;
  approveRecord: (id: string, notes?: string) => Promise<boolean>;
  rejectRecord: (id: string, notes: string) => Promise<boolean>;
  suspendRecord: (id: string, notes: string) => Promise<boolean>;
  deactivateRecord: (id: string, notes: string) => Promise<boolean>;
  reactivateRecord: (id: string) => Promise<boolean>;
}

const TABLE_MAP: Record<string, string> = {
  client: 'client_registry_records',
  provider: 'provider_registry_records',
  facility: 'facility_registry_records',
};

// Helper to get typed table reference
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getTable = (name: string) => supabase.from(name as any);

export function useRegistryRecords<T extends ClientRegistryRecord | ProviderRegistryRecord | FacilityRegistryRecord>(
  options: UseRegistryRecordsOptions
): UseRegistryRecordsReturn<T> {
  const { user } = useAuth();
  const { toast } = useToast();
  const [records, setRecords] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  const tableName = TABLE_MAP[options.registryType];

  const logAuditAction = async (
    recordId: string,
    action: string,
    oldStatus: RegistryRecordStatus | null,
    newStatus: RegistryRecordStatus | null,
    notes?: string,
    changes?: Record<string, unknown>
  ) => {
    if (!user) return;

    try {
      await getTable('registry_audit_log').insert({
        registry_type: options.registryType,
        record_id: recordId,
        action,
        old_status: oldStatus,
        new_status: newStatus,
        changes,
        notes,
        performed_by: user.id,
      });
    } catch (err) {
      console.error('Error logging audit action:', err);
    }
  };

  const fetchRecords = useCallback(async () => {
    if (!tableName) {
      setRecords([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError, count } = await getTable(tableName)
        .select('*', { count: 'exact' });

      if (fetchError) {
        throw fetchError;
      }

      // Filter manually if needed
      let filteredData = (data || []) as unknown as Record<string, unknown>[];
      
      if (options.statusFilter && options.statusFilter.length > 0) {
        filteredData = filteredData.filter((r) => 
          options.statusFilter!.includes(r.status as RegistryRecordStatus)
        );
      }

      if (options.searchQuery) {
        const searchTerm = options.searchQuery.toLowerCase();
        filteredData = filteredData.filter((r) => {
          const searchableFields = ['first_name', 'last_name', 'name', 'national_id', 'impilo_id', 'provider_id', 'thuso_id', 'license_number', 'city'];
          return searchableFields.some(field => {
            const value = r[field];
            return typeof value === 'string' && value.toLowerCase().includes(searchTerm);
          });
        });
      }

      // Sort by created_at desc
      filteredData.sort((a, b) => {
        const aDate = new Date((a.created_at as string) || 0);
        const bDate = new Date((b.created_at as string) || 0);
        return bDate.getTime() - aDate.getTime();
      });

      setRecords(filteredData as unknown as T[]);
      setTotalCount(count || filteredData.length);

      // Count pending
      const pending = filteredData.filter((r) => 
        r.status === 'pending_approval'
      ).length;
      setPendingCount(pending);
    } catch (err) {
      console.error('Error fetching registry records:', err);
      setError('Failed to load registry records');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [tableName, options.statusFilter, options.searchQuery, options.registryType]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const createRecord = async (data: Partial<T>): Promise<T | null> => {
    if (!user || !tableName) return null;

    try {
      const { data: created, error: createError } = await getTable(tableName)
        .insert({
          ...(data as Record<string, unknown>),
          created_by: user.id,
          status: 'draft',
        })
        .select()
        .single();

      if (createError) throw createError;

      const createdRecord = created as unknown as { id: string };
      await logAuditAction(createdRecord.id, 'create', null, 'draft');

      toast({
        title: 'Record Created',
        description: 'The registry record has been created as a draft.',
      });

      await fetchRecords();
      return created as unknown as T;
    } catch (err) {
      console.error('Error creating record:', err);
      toast({
        title: 'Error',
        description: 'Failed to create registry record.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateRecord = async (id: string, data: Partial<T>): Promise<boolean> => {
    if (!user || !tableName) return false;

    try {
      const { data: existing } = await getTable(tableName)
        .select('*')
        .eq('id', id)
        .single();

      const { error: updateError } = await getTable(tableName)
        .update({
          ...(data as Record<string, unknown>),
          last_modified_by: user.id,
        })
        .eq('id', id);

      if (updateError) throw updateError;

      const existingRecord = existing as unknown as { status: RegistryRecordStatus } | null;
      await logAuditAction(
        id, 
        'update', 
        existingRecord?.status || null, 
        existingRecord?.status || null,
        undefined,
        data as Record<string, unknown>
      );

      toast({
        title: 'Record Updated',
        description: 'The registry record has been updated.',
      });

      await fetchRecords();
      return true;
    } catch (err) {
      console.error('Error updating record:', err);
      toast({
        title: 'Error',
        description: 'Failed to update registry record.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const submitForApproval = async (id: string): Promise<boolean> => {
    if (!user || !tableName) return false;

    try {
      const { data: existing } = await getTable(tableName)
        .select('*')
        .eq('id', id)
        .single();

      const { error: submitError } = await getTable(tableName)
        .update({
          status: 'pending_approval',
          submitted_at: new Date().toISOString(),
          submitted_by: user.id,
        })
        .eq('id', id);

      if (submitError) throw submitError;

      const existingRecord = existing as unknown as { status: RegistryRecordStatus } | null;
      await logAuditAction(id, 'submit', existingRecord?.status || null, 'pending_approval');

      toast({
        title: 'Submitted for Approval',
        description: 'The record has been submitted for approval.',
      });

      await fetchRecords();
      return true;
    } catch (err) {
      console.error('Error submitting record:', err);
      toast({
        title: 'Error',
        description: 'Failed to submit record for approval.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const approveRecord = async (id: string, notes?: string): Promise<boolean> => {
    if (!user || !tableName) return false;

    try {
      const { error: approveError } = await getTable(tableName)
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          review_notes: notes,
          approved_at: new Date().toISOString(),
          approved_by: user.id,
        })
        .eq('id', id);

      if (approveError) throw approveError;

      await logAuditAction(id, 'approve', 'pending_approval', 'approved', notes);

      toast({
        title: 'Record Approved',
        description: 'The registry record has been approved.',
      });

      await fetchRecords();
      return true;
    } catch (err) {
      console.error('Error approving record:', err);
      toast({
        title: 'Error',
        description: 'Failed to approve record.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const rejectRecord = async (id: string, notes: string): Promise<boolean> => {
    if (!user || !tableName) return false;

    try {
      const { error: rejectError } = await getTable(tableName)
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          review_notes: notes,
        })
        .eq('id', id);

      if (rejectError) throw rejectError;

      await logAuditAction(id, 'reject', 'pending_approval', 'rejected', notes);

      toast({
        title: 'Record Rejected',
        description: 'The registry record has been rejected.',
      });

      await fetchRecords();
      return true;
    } catch (err) {
      console.error('Error rejecting record:', err);
      toast({
        title: 'Error',
        description: 'Failed to reject record.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const suspendRecord = async (id: string, notes: string): Promise<boolean> => {
    if (!user || !tableName) return false;

    try {
      const { data: existing } = await getTable(tableName)
        .select('*')
        .eq('id', id)
        .single();

      const { error: suspendError } = await getTable(tableName)
        .update({
          status: 'suspended',
          review_notes: notes,
        })
        .eq('id', id);

      if (suspendError) throw suspendError;

      const existingRecord = existing as unknown as { status: RegistryRecordStatus } | null;
      await logAuditAction(id, 'suspend', existingRecord?.status || null, 'suspended', notes);

      toast({
        title: 'Record Suspended',
        description: 'The registry record has been suspended.',
      });

      await fetchRecords();
      return true;
    } catch (err) {
      console.error('Error suspending record:', err);
      toast({
        title: 'Error',
        description: 'Failed to suspend record.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deactivateRecord = async (id: string, notes: string): Promise<boolean> => {
    if (!user || !tableName) return false;

    try {
      const { data: existing } = await getTable(tableName)
        .select('*')
        .eq('id', id)
        .single();

      const { error: deactivateError } = await getTable(tableName)
        .update({
          status: 'deactivated',
          review_notes: notes,
        })
        .eq('id', id);

      if (deactivateError) throw deactivateError;

      const existingRecord = existing as unknown as { status: RegistryRecordStatus } | null;
      await logAuditAction(id, 'deactivate', existingRecord?.status || null, 'deactivated', notes);

      toast({
        title: 'Record Deactivated',
        description: 'The registry record has been deactivated.',
      });

      await fetchRecords();
      return true;
    } catch (err) {
      console.error('Error deactivating record:', err);
      toast({
        title: 'Error',
        description: 'Failed to deactivate record.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const reactivateRecord = async (id: string): Promise<boolean> => {
    if (!user || !tableName) return false;

    try {
      const { data: existing } = await getTable(tableName)
        .select('*')
        .eq('id', id)
        .single();

      const { error: reactivateError } = await getTable(tableName)
        .update({
          status: 'approved',
        })
        .eq('id', id);

      if (reactivateError) throw reactivateError;

      const existingRecord = existing as unknown as { status: RegistryRecordStatus } | null;
      await logAuditAction(id, 'reactivate', existingRecord?.status || null, 'approved');

      toast({
        title: 'Record Reactivated',
        description: 'The registry record has been reactivated.',
      });

      await fetchRecords();
      return true;
    } catch (err) {
      console.error('Error reactivating record:', err);
      toast({
        title: 'Error',
        description: 'Failed to reactivate record.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    records,
    loading,
    error,
    totalCount,
    pendingCount,
    refetch: fetchRecords,
    createRecord,
    updateRecord,
    submitForApproval,
    approveRecord,
    rejectRecord,
    suspendRecord,
    deactivateRecord,
    reactivateRecord,
  };
}
