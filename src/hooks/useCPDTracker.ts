import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CPDEntry {
  id: string;
  activity_type: 'online_course' | 'webinar' | 'conference' | 'workshop' | 'peer_review' | 'publication' | 'supervision' | 'other';
  activity_title: string;
  activity_description: string | null;
  credits_earned: number;
  credits_category: string | null;
  activity_date: string;
  earned_at: string;
  expires_at: string | null;
  verified: boolean;
  evidence_url: string | null;
  cpd_period_year: number | null;
}

export interface Certificate {
  id: string;
  certificate_number: string;
  title: string;
  issued_at: string;
  expires_at: string | null;
  cpd_credits: number;
  cpd_accreditor: string | null;
  verification_code: string | null;
  certificate_pdf_url: string | null;
  is_valid: boolean;
}

export interface CPDSummary {
  credits_earned_ytd: number;
  credits_required: number;
  credits_pending: number;
  credits_by_category: Record<string, number>;
  cycle_start: string;
  cycle_end: string;
  expiring_certificates: Certificate[];
}

export function useCPDTracker() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<CPDEntry[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [summary, setSummary] = useState<CPDSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();

  const fetchEntries = useCallback(async () => {
    if (!user?.id) {
      setEntries([]);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('cpd_ledger')
        .select('*')
        .eq('user_id', user.id)
        .gte('activity_date', `${currentYear}-01-01`)
        .order('activity_date', { ascending: false });

      if (fetchError) throw fetchError;
      setEntries((data || []) as CPDEntry[]);
    } catch (err) {
      console.error('Error fetching CPD entries:', err);
      setError('Failed to load CPD entries');
    }
  }, [user?.id, currentYear]);

  const fetchCertificates = useCallback(async () => {
    if (!user?.id) {
      setCertificates([]);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('training_certificates')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_valid', true)
        .order('issued_at', { ascending: false });

      if (fetchError) throw fetchError;
      setCertificates((data || []) as Certificate[]);
    } catch (err) {
      console.error('Error fetching certificates:', err);
    }
  }, [user?.id]);

  const calculateSummary = useCallback(() => {
    const creditsEarned = entries
      .filter(e => e.verified || e.activity_type === 'online_course')
      .reduce((sum, e) => sum + Number(e.credits_earned), 0);

    const creditsPending = entries
      .filter(e => !e.verified && e.activity_type !== 'online_course')
      .reduce((sum, e) => sum + Number(e.credits_earned), 0);

    const creditsByCategory: Record<string, number> = {};
    entries.forEach(e => {
      const cat = e.credits_category || 'general';
      creditsByCategory[cat] = (creditsByCategory[cat] || 0) + Number(e.credits_earned);
    });

    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    const expiringCertificates = certificates.filter(c => 
      c.expires_at && new Date(c.expires_at) <= threeMonthsFromNow
    );

    setSummary({
      credits_earned_ytd: creditsEarned,
      credits_required: 25, // Default requirement, should come from cpd_requirements
      credits_pending: creditsPending,
      credits_by_category: creditsByCategory,
      cycle_start: `${currentYear}-01-01`,
      cycle_end: `${currentYear}-12-31`,
      expiring_certificates: expiringCertificates,
    });
  }, [entries, certificates, currentYear]);

  const addCPDActivity = useCallback(async (activity: Omit<CPDEntry, 'id' | 'earned_at'>) => {
    if (!user?.id) return { error: 'Not authenticated' };

    try {
      const { data, error: insertError } = await supabase
        .from('cpd_ledger')
        .insert({
          user_id: user.id,
          ...activity,
          cpd_period_year: currentYear,
          cpd_period_start: `${currentYear}-01-01`,
          cpd_period_end: `${currentYear}-12-31`,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await fetchEntries();
      return { data, error: null };
    } catch (err: any) {
      console.error('Error adding CPD activity:', err);
      return { error: err.message || 'Failed to add activity' };
    }
  }, [user?.id, currentYear, fetchEntries]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchEntries(), fetchCertificates()])
      .finally(() => setLoading(false));
  }, [fetchEntries, fetchCertificates]);

  useEffect(() => {
    calculateSummary();
  }, [calculateSummary]);

  return {
    entries,
    certificates,
    summary,
    loading,
    error,
    addCPDActivity,
    refresh: () => Promise.all([fetchEntries(), fetchCertificates()]),
  };
}
