/**
 * iHRIS v5 Aligned Service
 * Comprehensive HR management service functions
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  ProviderEducation,
  ProviderTraining,
  ProviderEmploymentHistory,
  ProviderPositionChange,
  ProviderLeave,
  ProviderDisciplinary,
  ProviderPerformance,
  ProviderSalary,
  ProviderEmergencyContact,
  ProviderDependent,
  ProviderIdentifier,
  RefEducationLevel,
  RefTrainingType,
  RefLeaveType,
  RefSalaryGrade,
  RefClassification,
} from '@/types/ihris';

export const IHRISService = {
  // ==========================================
  // EDUCATION
  // ==========================================

  async getEducation(providerId: string): Promise<ProviderEducation[]> {
    const { data, error } = await supabase
      .from('provider_education')
      .select('*')
      .eq('provider_id', providerId)
      .order('graduation_date', { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as ProviderEducation[];
  },

  async addEducation(input: Omit<ProviderEducation, 'id' | 'created_at' | 'updated_at'>): Promise<ProviderEducation> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('provider_education')
      .insert({ ...input, created_by: user?.id })
      .select()
      .single();
    if (error) throw error;
    return data as unknown as ProviderEducation;
  },

  async updateEducation(id: string, updates: Partial<ProviderEducation>): Promise<ProviderEducation> {
    const { data, error } = await supabase
      .from('provider_education')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as ProviderEducation;
  },

  async deleteEducation(id: string): Promise<void> {
    const { error } = await supabase.from('provider_education').delete().eq('id', id);
    if (error) throw error;
  },

  // ==========================================
  // TRAINING
  // ==========================================

  async getTraining(providerId: string): Promise<ProviderTraining[]> {
    const { data, error } = await supabase
      .from('provider_training')
      .select('*')
      .eq('provider_id', providerId)
      .order('start_date', { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as ProviderTraining[];
  },

  async addTraining(input: Omit<ProviderTraining, 'id' | 'created_at' | 'updated_at'>): Promise<ProviderTraining> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('provider_training')
      .insert({ ...input, created_by: user?.id })
      .select()
      .single();
    if (error) throw error;
    return data as unknown as ProviderTraining;
  },

  async updateTraining(id: string, updates: Partial<ProviderTraining>): Promise<ProviderTraining> {
    const { data, error } = await supabase
      .from('provider_training')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as ProviderTraining;
  },

  async deleteTraining(id: string): Promise<void> {
    const { error } = await supabase.from('provider_training').delete().eq('id', id);
    if (error) throw error;
  },

  // ==========================================
  // EMPLOYMENT HISTORY
  // ==========================================

  async getEmploymentHistory(providerId: string): Promise<ProviderEmploymentHistory[]> {
    const { data, error } = await supabase
      .from('provider_employment_history')
      .select('*')
      .eq('provider_id', providerId)
      .order('start_date', { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as ProviderEmploymentHistory[];
  },

  async addEmploymentHistory(input: Omit<ProviderEmploymentHistory, 'id' | 'created_at' | 'updated_at'>): Promise<ProviderEmploymentHistory> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('provider_employment_history')
      .insert({ ...input, created_by: user?.id })
      .select()
      .single();
    if (error) throw error;
    return data as unknown as ProviderEmploymentHistory;
  },

  async updateEmploymentHistory(id: string, updates: Partial<ProviderEmploymentHistory>): Promise<ProviderEmploymentHistory> {
    const { data, error } = await supabase
      .from('provider_employment_history')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as ProviderEmploymentHistory;
  },

  async deleteEmploymentHistory(id: string): Promise<void> {
    const { error } = await supabase.from('provider_employment_history').delete().eq('id', id);
    if (error) throw error;
  },

  // ==========================================
  // POSITION CHANGES
  // ==========================================

  async getPositionChanges(providerId: string): Promise<ProviderPositionChange[]> {
    const { data, error } = await supabase
      .from('provider_position_changes')
      .select('*')
      .eq('provider_id', providerId)
      .order('effective_date', { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as ProviderPositionChange[];
  },

  async addPositionChange(input: Omit<ProviderPositionChange, 'id' | 'created_at' | 'updated_at'>): Promise<ProviderPositionChange> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('provider_position_changes')
      .insert({ ...input, created_by: user?.id })
      .select()
      .single();
    if (error) throw error;
    return data as unknown as ProviderPositionChange;
  },

  // ==========================================
  // LEAVE
  // ==========================================

  async getLeave(providerId: string): Promise<ProviderLeave[]> {
    const { data, error } = await supabase
      .from('provider_leave')
      .select('*')
      .eq('provider_id', providerId)
      .order('start_date', { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as ProviderLeave[];
  },

  async addLeave(input: Omit<ProviderLeave, 'id' | 'created_at' | 'updated_at' | 'requested_at'>): Promise<ProviderLeave> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('provider_leave')
      .insert({ ...input, created_by: user?.id })
      .select()
      .single();
    if (error) throw error;
    return data as unknown as ProviderLeave;
  },

  async updateLeaveStatus(id: string, status: ProviderLeave['status'], daysApproved?: number, reason?: string): Promise<ProviderLeave> {
    const { data: { user } } = await supabase.auth.getUser();
    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (status === 'approved') {
      updates.approved_at = new Date().toISOString();
      updates.approved_by = user?.id;
      updates.days_approved = daysApproved;
    } else if (status === 'rejected') {
      updates.rejection_reason = reason;
    }
    const { data, error } = await supabase
      .from('provider_leave')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as ProviderLeave;
  },

  // ==========================================
  // DISCIPLINARY
  // ==========================================

  async getDisciplinary(providerId: string): Promise<ProviderDisciplinary[]> {
    const { data, error } = await supabase
      .from('provider_disciplinary')
      .select('*')
      .eq('provider_id', providerId)
      .order('incident_date', { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as ProviderDisciplinary[];
  },

  async addDisciplinary(input: Omit<ProviderDisciplinary, 'id' | 'created_at' | 'updated_at'>): Promise<ProviderDisciplinary> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('provider_disciplinary')
      .insert({ ...input, created_by: user?.id })
      .select()
      .single();
    if (error) throw error;
    return data as unknown as ProviderDisciplinary;
  },

  async updateDisciplinary(id: string, updates: Partial<ProviderDisciplinary>): Promise<ProviderDisciplinary> {
    const { data, error } = await supabase
      .from('provider_disciplinary')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as ProviderDisciplinary;
  },

  // ==========================================
  // PERFORMANCE
  // ==========================================

  async getPerformance(providerId: string): Promise<ProviderPerformance[]> {
    const { data, error } = await supabase
      .from('provider_performance')
      .select('*')
      .eq('provider_id', providerId)
      .order('start_date', { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as ProviderPerformance[];
  },

  async addPerformance(input: Omit<ProviderPerformance, 'id' | 'created_at' | 'updated_at'>): Promise<ProviderPerformance> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('provider_performance')
      .insert({ ...input, created_by: user?.id })
      .select()
      .single();
    if (error) throw error;
    return data as unknown as ProviderPerformance;
  },

  async updatePerformance(id: string, updates: Partial<ProviderPerformance>): Promise<ProviderPerformance> {
    const { data, error } = await supabase
      .from('provider_performance')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as ProviderPerformance;
  },

  // ==========================================
  // SALARY
  // ==========================================

  async getSalary(providerId: string): Promise<ProviderSalary[]> {
    const { data, error } = await supabase
      .from('provider_salary')
      .select('*')
      .eq('provider_id', providerId)
      .order('effective_from', { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as ProviderSalary[];
  },

  async addSalary(input: Omit<ProviderSalary, 'id' | 'created_at' | 'updated_at'>): Promise<ProviderSalary> {
    const { data: { user } } = await supabase.auth.getUser();
    // Mark previous salary as not current
    await supabase
      .from('provider_salary')
      .update({ is_current: false, effective_until: input.effective_from })
      .eq('provider_id', input.provider_id)
      .eq('is_current', true);
    
    const { data, error } = await supabase
      .from('provider_salary')
      .insert({ ...input, created_by: user?.id })
      .select()
      .single();
    if (error) throw error;
    return data as unknown as ProviderSalary;
  },

  // ==========================================
  // EMERGENCY CONTACTS
  // ==========================================

  async getEmergencyContacts(providerId: string): Promise<ProviderEmergencyContact[]> {
    const { data, error } = await supabase
      .from('provider_emergency_contacts')
      .select('*')
      .eq('provider_id', providerId)
      .order('priority_order', { ascending: true });
    if (error) throw error;
    return (data || []) as unknown as ProviderEmergencyContact[];
  },

  async addEmergencyContact(input: Omit<ProviderEmergencyContact, 'id' | 'created_at' | 'updated_at'>): Promise<ProviderEmergencyContact> {
    const { data, error } = await supabase
      .from('provider_emergency_contacts')
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as ProviderEmergencyContact;
  },

  async updateEmergencyContact(id: string, updates: Partial<ProviderEmergencyContact>): Promise<ProviderEmergencyContact> {
    const { data, error } = await supabase
      .from('provider_emergency_contacts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as ProviderEmergencyContact;
  },

  async deleteEmergencyContact(id: string): Promise<void> {
    const { error } = await supabase.from('provider_emergency_contacts').delete().eq('id', id);
    if (error) throw error;
  },

  // ==========================================
  // DEPENDENTS
  // ==========================================

  async getDependents(providerId: string): Promise<ProviderDependent[]> {
    const { data, error } = await supabase
      .from('provider_dependents')
      .select('*')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []) as unknown as ProviderDependent[];
  },

  async addDependent(input: Omit<ProviderDependent, 'id' | 'created_at' | 'updated_at'>): Promise<ProviderDependent> {
    const { data, error } = await supabase
      .from('provider_dependents')
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as ProviderDependent;
  },

  async updateDependent(id: string, updates: Partial<ProviderDependent>): Promise<ProviderDependent> {
    const { data, error } = await supabase
      .from('provider_dependents')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as ProviderDependent;
  },

  async deleteDependent(id: string): Promise<void> {
    const { error } = await supabase.from('provider_dependents').delete().eq('id', id);
    if (error) throw error;
  },

  // ==========================================
  // IDENTIFIERS
  // ==========================================

  async getIdentifiers(providerId: string): Promise<ProviderIdentifier[]> {
    const { data, error } = await supabase
      .from('provider_identifiers')
      .select('*')
      .eq('provider_id', providerId)
      .order('identifier_type', { ascending: true });
    if (error) throw error;
    return (data || []) as unknown as ProviderIdentifier[];
  },

  async addIdentifier(input: Omit<ProviderIdentifier, 'id' | 'created_at' | 'updated_at'>): Promise<ProviderIdentifier> {
    const { data, error } = await supabase
      .from('provider_identifiers')
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as ProviderIdentifier;
  },

  async updateIdentifier(id: string, updates: Partial<ProviderIdentifier>): Promise<ProviderIdentifier> {
    const { data, error } = await supabase
      .from('provider_identifiers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as ProviderIdentifier;
  },

  async deleteIdentifier(id: string): Promise<void> {
    const { error } = await supabase.from('provider_identifiers').delete().eq('id', id);
    if (error) throw error;
  },

  // ==========================================
  // REFERENCE DATA
  // ==========================================

  async getEducationLevels(): Promise<RefEducationLevel[]> {
    const { data, error } = await supabase
      .from('ref_education_levels')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data || []) as unknown as RefEducationLevel[];
  },

  async getTrainingTypes(): Promise<RefTrainingType[]> {
    const { data, error } = await supabase
      .from('ref_training_types')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });
    if (error) throw error;
    return (data || []) as unknown as RefTrainingType[];
  },

  async getLeaveTypes(): Promise<RefLeaveType[]> {
    const { data, error } = await supabase
      .from('ref_leave_types')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });
    if (error) throw error;
    return (data || []) as unknown as RefLeaveType[];
  },

  async getSalaryGrades(): Promise<RefSalaryGrade[]> {
    const { data, error } = await supabase
      .from('ref_salary_grades')
      .select('*')
      .eq('is_active', true)
      .order('code', { ascending: true });
    if (error) throw error;
    return (data || []) as unknown as RefSalaryGrade[];
  },

  async getClassifications(): Promise<RefClassification[]> {
    const { data, error } = await supabase
      .from('ref_classifications')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });
    if (error) throw error;
    return (data || []) as unknown as RefClassification[];
  },
};
