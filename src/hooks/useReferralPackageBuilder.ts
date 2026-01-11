/**
 * useReferralPackageBuilder - Build and link referral packages from instant sessions
 * Allows building a referral package during/after a call or chat as a follow-up
 */
import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { ReferralPackage, TelemedicineMode, ReferralUrgency } from "@/types/telehealth";

export interface ReferralDraft {
  id: string;
  createdAt: string;
  linkedSessionId?: string;
  linkedSessionMode?: TelemedicineMode;
  patientId: string;
  patientHID: string;
  chiefComplaint: string;
  historyOfPresentIllness: string;
  provisionalDiagnosis: string;
  reasonForReferral: string;
  specificQuestions: string[];
  urgency: ReferralUrgency;
  targetSpecialty: string;
  targetType: 'facility' | 'specialty' | 'provider' | 'pool' | 'on_call';
  attachments: { id: string; name: string; type: string }[];
  status: 'draft' | 'ready' | 'sent';
  notifiedProviders: string[];
}

interface UseReferralPackageBuilderOptions {
  patientId: string;
  patientHID: string;
  linkedSessionId?: string;
  linkedSessionMode?: TelemedicineMode;
}

export function useReferralPackageBuilder({
  patientId,
  patientHID,
  linkedSessionId,
  linkedSessionMode,
}: UseReferralPackageBuilderOptions) {
  const [draft, setDraft] = useState<ReferralDraft>({
    id: `REF-DRAFT-${Date.now()}`,
    createdAt: new Date().toISOString(),
    linkedSessionId,
    linkedSessionMode,
    patientId,
    patientHID,
    chiefComplaint: '',
    historyOfPresentIllness: '',
    provisionalDiagnosis: '',
    reasonForReferral: '',
    specificQuestions: [],
    urgency: 'routine',
    targetSpecialty: '',
    targetType: 'specialty',
    attachments: [],
    status: 'draft',
    notifiedProviders: [],
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Update draft fields
  const updateDraft = useCallback((updates: Partial<ReferralDraft>) => {
    setDraft(prev => ({ ...prev, ...updates }));
  }, []);

  // Add a specific question
  const addQuestion = useCallback((question: string) => {
    setDraft(prev => ({
      ...prev,
      specificQuestions: [...prev.specificQuestions, question],
    }));
  }, []);

  // Remove a question
  const removeQuestion = useCallback((index: number) => {
    setDraft(prev => ({
      ...prev,
      specificQuestions: prev.specificQuestions.filter((_, i) => i !== index),
    }));
  }, []);

  // Add attachment
  const addAttachment = useCallback((attachment: { id: string; name: string; type: string }) => {
    setDraft(prev => ({
      ...prev,
      attachments: [...prev.attachments, attachment],
    }));
  }, []);

  // Save draft
  const saveDraft = useCallback(async () => {
    setIsSaving(true);
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsSaving(false);
    toast.success("Referral draft saved");
    return draft;
  }, [draft]);

  // Build full referral package
  const buildPackage = useCallback((): ReferralPackage | null => {
    // Validate required fields
    if (!draft.chiefComplaint || !draft.reasonForReferral || !draft.targetSpecialty) {
      toast.error("Please complete required fields: Chief Complaint, Reason for Referral, Target Specialty");
      return null;
    }

    const referralPackage: ReferralPackage = {
      id: draft.id,
      referralNumber: `REF-${Date.now()}`,
      patientId: draft.patientId,
      patientHID: draft.patientHID,
      clinicalNarrative: {
        chiefComplaint: draft.chiefComplaint,
        historyOfPresentIllness: draft.historyOfPresentIllness,
        pastMedicalHistory: '',
        provisionalDiagnosis: draft.provisionalDiagnosis,
        interventionsDone: '',
        reasonForReferral: draft.reasonForReferral,
        specificQuestions: draft.specificQuestions,
      },
      supportingData: {
        problemList: [],
        currentMedications: [],
        allergies: [],
        vitals: [],
        labResults: [],
        imaging: [],
        attachments: draft.attachments.map(a => ({ ...a, url: '' })),
      },
      context: {
        referringFacilityId: 'current-facility',
        referringFacilityName: 'Current Facility',
        referringProviderId: 'current-user',
        referringProviderName: 'Current Provider',
        targetType: draft.targetType,
        targetId: '',
        targetName: draft.targetSpecialty,
        specialty: draft.targetSpecialty,
      },
      urgency: draft.urgency,
      requestedModes: ['async'],
      preferredMode: 'async',
      consent: {
        status: 'pending',
        type: 'digital',
        timestamp: '',
        obtainedBy: '',
      },
      status: 'pending',
      timestamps: {
        createdAt: new Date().toISOString(),
      },
    };

    setDraft(prev => ({ ...prev, status: 'ready' }));
    return referralPackage;
  }, [draft]);

  // Send referral package
  const sendPackage = useCallback(async (targetProviderId?: string) => {
    const pkg = buildPackage();
    if (!pkg) return null;

    setIsSending(true);
    // Simulate sending
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setDraft(prev => ({ 
      ...prev, 
      status: 'sent',
      notifiedProviders: targetProviderId ? [...prev.notifiedProviders, targetProviderId] : prev.notifiedProviders,
    }));
    setIsSending(false);
    
    toast.success("Referral package sent successfully");
    return pkg;
  }, [buildPackage]);

  // Generate shareable link
  const generateLink = useCallback(() => {
    if (draft.status !== 'ready' && draft.status !== 'sent') {
      toast.error("Please complete the referral package first");
      return null;
    }
    
    const link = `/teleconsult/referral/${draft.id}`;
    toast.success("Referral link generated");
    return link;
  }, [draft.id, draft.status]);

  // Pre-fill from session context
  const prefillFromSession = useCallback((context: {
    chiefComplaint?: string;
    discussionSummary?: string;
    urgency?: ReferralUrgency;
  }) => {
    setDraft(prev => ({
      ...prev,
      chiefComplaint: context.chiefComplaint || prev.chiefComplaint,
      historyOfPresentIllness: context.discussionSummary || prev.historyOfPresentIllness,
      urgency: context.urgency || prev.urgency,
    }));
  }, []);

  // Calculate completion percentage
  const completionPercent = (() => {
    let filled = 0;
    const total = 5;
    if (draft.chiefComplaint) filled++;
    if (draft.historyOfPresentIllness) filled++;
    if (draft.reasonForReferral) filled++;
    if (draft.targetSpecialty) filled++;
    if (draft.specificQuestions.length > 0) filled++;
    return Math.round((filled / total) * 100);
  })();

  return {
    draft,
    isSaving,
    isSending,
    completionPercent,
    isReady: draft.status === 'ready' || draft.status === 'sent',
    isSent: draft.status === 'sent',
    updateDraft,
    addQuestion,
    removeQuestion,
    addAttachment,
    saveDraft,
    buildPackage,
    sendPackage,
    generateLink,
    prefillFromSession,
  };
}
