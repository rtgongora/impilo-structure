// Hook for managing IPS and Visit Summaries
import { useState, useCallback } from 'react';
import {
  generateIPS,
  generateVisitSummary,
  getPatientIPS,
  getVisitSummary,
  createShareToken,
  revokeShareToken,
  signVisitSummary,
} from '@/services/summaryGenerationService';
import type {
  PatientSummary,
  VisitSummary,
  IPSGenerationOptions,
  VisitSummaryGenerationOptions,
  ShareOptions,
  SummaryShareToken,
} from '@/types/summary';
import { toast } from 'sonner';

export function usePatientSummary(patientId: string | undefined) {
  const [ips, setIps] = useState<PatientSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchIPS = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const data = await getPatientIPS(patientId);
      setIps(data);
    } catch (error) {
      console.error('Error fetching IPS:', error);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const generateNewIPS = useCallback(async (options: IPSGenerationOptions) => {
    if (!patientId) return null;
    setGenerating(true);
    try {
      const data = await generateIPS(patientId, options);
      if (data) {
        setIps(data);
        toast.success('Patient Summary generated successfully');
      } else {
        toast.error('Failed to generate Patient Summary');
      }
      return data;
    } catch (error) {
      console.error('Error generating IPS:', error);
      toast.error('Failed to generate Patient Summary');
      return null;
    } finally {
      setGenerating(false);
    }
  }, [patientId]);

  const shareIPS = useCallback(async (options: ShareOptions): Promise<SummaryShareToken | null> => {
    if (!ips || !patientId) return null;
    try {
      const token = await createShareToken('ips', ips.id, patientId, options);
      if (token) {
        toast.success('Share link created successfully');
      }
      return token;
    } catch (error) {
      console.error('Error sharing IPS:', error);
      toast.error('Failed to create share link');
      return null;
    }
  }, [ips, patientId]);

  return {
    ips,
    loading,
    generating,
    fetchIPS,
    generateNewIPS,
    shareIPS,
  };
}

export function useVisitSummary(encounterId: string | undefined) {
  const [summary, setSummary] = useState<VisitSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [signing, setSigning] = useState(false);

  const fetchSummary = useCallback(async () => {
    if (!encounterId) return;
    setLoading(true);
    try {
      const data = await getVisitSummary(encounterId);
      setSummary(data);
    } catch (error) {
      console.error('Error fetching visit summary:', error);
    } finally {
      setLoading(false);
    }
  }, [encounterId]);

  const generateNewSummary = useCallback(async (options: VisitSummaryGenerationOptions = {}) => {
    if (!encounterId) return null;
    setGenerating(true);
    try {
      const data = await generateVisitSummary(encounterId, options);
      if (data) {
        setSummary(data);
        toast.success('Visit Summary generated successfully');
      } else {
        toast.error('Failed to generate Visit Summary');
      }
      return data;
    } catch (error) {
      console.error('Error generating visit summary:', error);
      toast.error('Failed to generate Visit Summary');
      return null;
    } finally {
      setGenerating(false);
    }
  }, [encounterId]);

  const signSummary = useCallback(async () => {
    if (!summary) return false;
    setSigning(true);
    try {
      const success = await signVisitSummary(summary.id);
      if (success) {
        setSummary(prev => prev ? { ...prev, status: 'final', signedAt: new Date().toISOString() } : null);
        toast.success('Visit Summary signed successfully');
      } else {
        toast.error('Failed to sign Visit Summary');
      }
      return success;
    } catch (error) {
      console.error('Error signing visit summary:', error);
      toast.error('Failed to sign Visit Summary');
      return false;
    } finally {
      setSigning(false);
    }
  }, [summary]);

  const shareSummary = useCallback(async (options: ShareOptions): Promise<SummaryShareToken | null> => {
    if (!summary) return null;
    try {
      const token = await createShareToken('visit', summary.id, summary.patientId, options);
      if (token) {
        toast.success('Share link created successfully');
      }
      return token;
    } catch (error) {
      console.error('Error sharing visit summary:', error);
      toast.error('Failed to create share link');
      return null;
    }
  }, [summary]);

  const revokeShare = useCallback(async (tokenId: string, reason?: string) => {
    try {
      const success = await revokeShareToken(tokenId, reason);
      if (success) {
        toast.success('Share link revoked');
      }
      return success;
    } catch (error) {
      console.error('Error revoking share:', error);
      return false;
    }
  }, []);

  return {
    summary,
    loading,
    generating,
    signing,
    fetchSummary,
    generateNewSummary,
    signSummary,
    shareSummary,
    revokeShare,
  };
}
