// Above-Site Role Hook
// Implements AS-AUTH-01, AS-AUTH-02, AS-CTX-01

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type {
  AboveSiteRole,
  JurisdictionAssignment,
  AboveSiteSession,
  AboveSiteContextType,
  ContextOption,
} from '@/types/aboveSite';

interface UseAboveSiteRoleReturn {
  isAboveSiteUser: boolean;
  roles: AboveSiteRole[];
  jurisdictions: JurisdictionAssignment[];
  activeSession: AboveSiteSession | null;
  availableContexts: ContextOption[];
  loading: boolean;
  error: string | null;
  
  // Actions
  startSession: (roleId: string, contextType: AboveSiteContextType, contextLabel: string, scope?: {
    province?: string;
    district?: string;
    programme?: string;
    facilityId?: string;
  }) => Promise<AboveSiteSession | null>;
  endSession: () => Promise<void>;
  updateSessionScope: (scope: {
    province?: string;
    district?: string;
    facilityId?: string;
  }) => Promise<void>;
  logAuditEvent: (actionType: string, actionCategory: string, details?: Record<string, unknown>) => Promise<void>;
  
  // Act-as mode
  enterActAsMode: (workspaceId: string, reason: string, durationMinutes?: number) => Promise<boolean>;
  exitActAsMode: () => Promise<void>;
}

export function useAboveSiteRole(): UseAboveSiteRoleReturn {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AboveSiteRole[]>([]);
  const [jurisdictions, setJurisdictions] = useState<JurisdictionAssignment[]>([]);
  const [activeSession, setActiveSession] = useState<AboveSiteSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch above-site roles for current user
  useEffect(() => {
    if (!user) {
      setRoles([]);
      setJurisdictions([]);
      setActiveSession(null);
      setLoading(false);
      return;
    }

    const fetchRolesAndJurisdictions = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch roles
        const { data: rolesData, error: rolesError } = await supabase
          .from('above_site_roles')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .lte('effective_from', new Date().toISOString().split('T')[0])
          .or(`effective_to.is.null,effective_to.gte.${new Date().toISOString().split('T')[0]}`);

        if (rolesError) throw rolesError;

        const typedRoles = (rolesData || []) as unknown as AboveSiteRole[];
        setRoles(typedRoles);

        // Fetch jurisdictions for all roles
        if (typedRoles.length > 0) {
          const roleIds = typedRoles.map(r => r.id);
          const { data: jurisdictionData, error: jurisdictionError } = await supabase
            .from('jurisdiction_assignments')
            .select('*')
            .in('above_site_role_id', roleIds)
            .eq('is_active', true);

          if (jurisdictionError) throw jurisdictionError;
          setJurisdictions((jurisdictionData || []) as unknown as JurisdictionAssignment[]);
        }

        // Fetch active session
        const { data: sessionData, error: sessionError } = await supabase
          .from('above_site_sessions')
          .select('*')
          .eq('user_id', user.id)
          .is('ended_at', null)
          .order('started_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (sessionError) throw sessionError;
        setActiveSession(sessionData as unknown as AboveSiteSession | null);

      } catch (err) {
        console.error('Error fetching above-site roles:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch roles');
      } finally {
        setLoading(false);
      }
    };

    fetchRolesAndJurisdictions();
  }, [user]);

  // Calculate available contexts based on roles and jurisdictions
  const availableContexts: ContextOption[] = [];
  
  if (roles.length > 0) {
    const uniqueLevels = new Set(jurisdictions.map(j => j.jurisdiction_level));
    
    if (uniqueLevels.has('national')) {
      availableContexts.push({
        type: 'national_operations',
        label: 'National Operations',
        description: 'National-level monitoring and management',
        icon: 'globe',
        scope: { level: 'national' },
      });
    }
    
    if (uniqueLevels.has('province')) {
      const provinces = [...new Set(jurisdictions.flatMap(j => j.province_codes))];
      provinces.forEach(province => {
        availableContexts.push({
          type: 'provincial_operations',
          label: `Provincial Operations - ${province}`,
          description: 'Provincial-level oversight and coordination',
          icon: 'map',
          scope: { level: 'province', value: province },
        });
      });
    }
    
    if (uniqueLevels.has('district')) {
      const districts = [...new Set(jurisdictions.flatMap(j => j.district_codes))];
      districts.forEach(district => {
        availableContexts.push({
          type: 'district_overview',
          label: `District Overview - ${district}`,
          description: 'View and manage all facilities in your district',
          icon: 'building-2',
          scope: { level: 'district', value: district },
        });
      });
    }
    
    if (uniqueLevels.has('programme')) {
      const programmes = jurisdictions
        .filter(j => j.programme_code)
        .map(j => ({ code: j.programme_code!, name: j.programme_name || j.programme_code! }));
      
      programmes.forEach(prog => {
        availableContexts.push({
          type: 'programme_operations',
          label: `Programme: ${prog.name}`,
          description: 'Programme-specific monitoring',
          icon: 'heart-pulse',
          scope: { level: 'programme', value: prog.code },
        });
      });
    }
    
    if (uniqueLevels.has('virtual_services')) {
      availableContexts.push({
        type: 'telecare_operations',
        label: 'Telecare Operations',
        description: 'Virtual care pool management and oversight',
        icon: 'video',
        scope: { level: 'virtual_services' },
      });
    }
  }

  const startSession = useCallback(async (
    roleId: string,
    contextType: AboveSiteContextType,
    contextLabel: string,
    scope?: {
      province?: string;
      district?: string;
      programme?: string;
      facilityId?: string;
    }
  ): Promise<AboveSiteSession | null> => {
    if (!user) return null;

    try {
      // End any existing session
      if (activeSession) {
        await supabase
          .from('above_site_sessions')
          .update({ ended_at: new Date().toISOString() })
          .eq('id', activeSession.id);
      }

      // Create new session
      const { data, error } = await supabase
        .from('above_site_sessions')
        .insert({
          user_id: user.id,
          above_site_role_id: roleId,
          context_type: contextType,
          context_label: contextLabel,
          selected_province: scope?.province || null,
          selected_district: scope?.district || null,
          selected_programme: scope?.programme || null,
          selected_facility_id: scope?.facilityId || null,
        })
        .select()
        .single();

      if (error) throw error;

      const newSession = data as unknown as AboveSiteSession;
      setActiveSession(newSession);

      // Log the session start
      await logAuditEvent('session_started', 'login', {
        context_type: contextType,
        context_label: contextLabel,
        scope,
      });

      return newSession;
    } catch (err) {
      console.error('Error starting above-site session:', err);
      setError(err instanceof Error ? err.message : 'Failed to start session');
      return null;
    }
  }, [user, activeSession]);

  const endSession = useCallback(async () => {
    if (!activeSession || !user) return;

    try {
      await supabase
        .from('above_site_sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', activeSession.id);

      await logAuditEvent('session_ended', 'login', {
        session_id: activeSession.id,
        duration_minutes: Math.floor(
          (Date.now() - new Date(activeSession.started_at).getTime()) / 60000
        ),
      });

      setActiveSession(null);
    } catch (err) {
      console.error('Error ending session:', err);
    }
  }, [activeSession, user]);

  const updateSessionScope = useCallback(async (scope: {
    province?: string;
    district?: string;
    facilityId?: string;
  }) => {
    if (!activeSession) return;

    try {
      const { error } = await supabase
        .from('above_site_sessions')
        .update({
          selected_province: scope.province ?? activeSession.selected_province,
          selected_district: scope.district ?? activeSession.selected_district,
          selected_facility_id: scope.facilityId ?? activeSession.selected_facility_id,
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', activeSession.id);

      if (error) throw error;

      setActiveSession(prev => prev ? {
        ...prev,
        selected_province: scope.province ?? prev.selected_province,
        selected_district: scope.district ?? prev.selected_district,
        selected_facility_id: scope.facilityId ?? prev.selected_facility_id,
      } : null);

      await logAuditEvent('scope_changed', 'context_change', { new_scope: scope });
    } catch (err) {
      console.error('Error updating session scope:', err);
    }
  }, [activeSession]);

  const logAuditEvent = useCallback(async (
    actionType: string,
    actionCategory: string,
    details?: Record<string, unknown>
  ) => {
    if (!user) return;

    try {
      const insertData = {
        user_id: user.id,
        session_id: activeSession?.id || null,
        action_type: actionType,
        action_category: actionCategory,
        description: details?.description as string || null,
        jurisdiction_scope: activeSession ? JSON.stringify({
          context_type: activeSession.context_type,
          province: activeSession.selected_province,
          district: activeSession.selected_district,
          programme: activeSession.selected_programme,
        }) : null,
        target_type: details?.target_type as string || null,
        target_id: details?.target_id as string || null,
        target_name: details?.target_name as string || null,
        metadata: JSON.stringify(details || {}),
      };
      
      await supabase.from('above_site_audit_log').insert([insertData] as any);
    } catch (err) {
      console.error('Error logging audit event:', err);
    }
  }, [user, activeSession]);

  const enterActAsMode = useCallback(async (
    workspaceId: string,
    reason: string,
    durationMinutes: number = 60
  ): Promise<boolean> => {
    if (!activeSession || !user) return false;

    // Check if user has act-as permission
    const role = roles.find(r => r.id === activeSession.above_site_role_id);
    if (!role?.can_act_as) {
      setError('You do not have permission to use act-as mode');
      return false;
    }

    try {
      const expiresAt = new Date(Date.now() + durationMinutes * 60000);

      const { error } = await supabase
        .from('above_site_sessions')
        .update({
          is_acting_as: true,
          acting_as_workspace_id: workspaceId,
          acting_as_reason: reason,
          acting_as_started_at: new Date().toISOString(),
          acting_as_expires_at: expiresAt.toISOString(),
        })
        .eq('id', activeSession.id);

      if (error) throw error;

      setActiveSession(prev => prev ? {
        ...prev,
        is_acting_as: true,
        acting_as_workspace_id: workspaceId,
        acting_as_reason: reason,
        acting_as_started_at: new Date().toISOString(),
        acting_as_expires_at: expiresAt.toISOString(),
      } : null);

      await logAuditEvent('act_as_entered', 'act_as', {
        workspace_id: workspaceId,
        reason,
        duration_minutes: durationMinutes,
      });

      return true;
    } catch (err) {
      console.error('Error entering act-as mode:', err);
      setError(err instanceof Error ? err.message : 'Failed to enter act-as mode');
      return false;
    }
  }, [activeSession, user, roles]);

  const exitActAsMode = useCallback(async () => {
    if (!activeSession || !activeSession.is_acting_as) return;

    try {
      const { error } = await supabase
        .from('above_site_sessions')
        .update({
          is_acting_as: false,
          acting_as_workspace_id: null,
          acting_as_reason: null,
          acting_as_started_at: null,
          acting_as_expires_at: null,
        })
        .eq('id', activeSession.id);

      if (error) throw error;

      setActiveSession(prev => prev ? {
        ...prev,
        is_acting_as: false,
        acting_as_workspace_id: null,
        acting_as_reason: null,
        acting_as_started_at: null,
        acting_as_expires_at: null,
      } : null);

      await logAuditEvent('act_as_exited', 'act_as', {
        session_id: activeSession.id,
      });
    } catch (err) {
      console.error('Error exiting act-as mode:', err);
    }
  }, [activeSession]);

  return {
    isAboveSiteUser: roles.length > 0,
    roles,
    jurisdictions,
    activeSession,
    availableContexts,
    loading,
    error,
    startSession,
    endSession,
    updateSessionScope,
    logAuditEvent,
    enterActAsMode,
    exitActAsMode,
  };
}
