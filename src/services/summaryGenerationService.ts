// IPS and Visit Summary Generation Service
import { supabase } from "@/integrations/supabase/client";
import type {
  PatientSummary,
  VisitSummary,
  IPSGenerationOptions,
  VisitSummaryGenerationOptions,
  AllergyEntry,
  MedicationEntry,
  ConditionEntry,
  DiagnosisEntry,
  VitalSignEntry,
  AttendingProvider,
  InvestigationEntry,
  ReferralEntry,
  ShareOptions,
  SummaryShareToken,
  DiagnosticResultEntry,
  ImagingSummaryEntry,
  RecipientType,
  AccessLevel,
} from "@/types/summary";

// IPS Section Generation Functions
async function fetchPatientAllergies(patientId: string): Promise<AllergyEntry[]> {
  const { data: patient } = await supabase
    .from('patients')
    .select('allergies')
    .eq('id', patientId)
    .single();

  if (patient?.allergies && Array.isArray(patient.allergies)) {
    return patient.allergies.map((allergy: string, i: number) => ({
      id: `allergy-${i}`,
      substance: allergy,
      status: 'active' as const,
    }));
  }
  
  return [{
    id: 'nka',
    substance: 'No Known Allergies',
    status: 'active' as const,
  }];
}

async function fetchPatientMedications(patientId: string): Promise<MedicationEntry[]> {
  // First get prescriptions for the patient
  const { data: prescriptions } = await supabase
    .from('prescriptions')
    .select('id, prescribed_at, status')
    .eq('patient_id', patientId)
    .eq('status', 'active')
    .order('prescribed_at', { ascending: false });

  if (!prescriptions || prescriptions.length === 0) return [];

  // Get prescription items for these prescriptions
  const prescriptionIds = prescriptions.map(p => p.id);
  const { data: items } = await supabase
    .from('prescription_items')
    .select('*')
    .in('prescription_id', prescriptionIds);

  if (!items) return [];

  return items.map((item) => ({
    id: item.id,
    name: item.medication_name,
    dose: item.dosage,
    route: item.route,
    frequency: item.frequency,
    status: item.status === 'active' ? 'active' as const : 'completed' as const,
    startDate: item.created_at,
  }));
}

async function fetchPatientConditions(patientId: string): Promise<ConditionEntry[]> {
  const { data: patient } = await supabase
    .from('patients')
    .select('chronic_conditions')
    .eq('id', patientId)
    .single();

  if (patient?.chronic_conditions && Array.isArray(patient.chronic_conditions)) {
    return patient.chronic_conditions.map((condition: string, i: number) => ({
      id: `condition-${i}`,
      name: condition,
      status: 'active' as const,
      category: 'condition' as const,
    }));
  }

  return [{
    id: 'no-conditions',
    name: 'No Known Conditions',
    status: 'active' as const,
    category: 'condition' as const,
  }];
}

async function fetchPatientVitals(patientId: string): Promise<VitalSignEntry[]> {
  const { data: encounters } = await supabase
    .from('encounters')
    .select('*')
    .eq('patient_id', patientId)
    .order('admission_date', { ascending: false })
    .limit(1);

  const vitals: VitalSignEntry[] = [];
  // Would populate from actual vitals data when available
  return vitals;
}

async function fetchPatientLabResults(patientId: string): Promise<DiagnosticResultEntry[]> {
  // Get lab orders for the patient
  const { data: orders } = await supabase
    .from('lab_orders')
    .select('id, ordered_at')
    .eq('patient_id', patientId)
    .order('ordered_at', { ascending: false })
    .limit(20);

  if (!orders || orders.length === 0) return [];

  // Get lab results for these orders
  const orderIds = orders.map(o => o.id);
  const { data: results } = await supabase
    .from('lab_results')
    .select('*')
    .in('lab_order_id', orderIds)
    .eq('status', 'released');

  if (!results) return [];

  return results.map((result) => {
    // Map interpretation to allowed values
    let interpretation: 'normal' | 'abnormal' | 'critical' | undefined;
    if (result.is_critical) {
      interpretation = 'critical';
    } else if (result.is_abnormal) {
      interpretation = 'abnormal';
    } else {
      interpretation = 'normal';
    }
    
    return {
      id: result.id,
      testName: result.test_name,
      value: result.result_value || 'Pending',
      unit: result.result_unit,
      referenceRange: result.reference_range,
      interpretation,
      date: result.performed_at || result.created_at,
    };
  });
}

async function fetchPatientImaging(patientId: string): Promise<ImagingSummaryEntry[]> {
  // Get imaging studies for the patient
  const { data: studies } = await supabase
    .from('imaging_studies')
    .select('id, study_description, modality, body_part, study_date')
    .eq('patient_id', patientId)
    .order('study_date', { ascending: false })
    .limit(10);

  if (!studies || studies.length === 0) return [];

  // Get imaging reports for these studies
  const studyIds = studies.map(s => s.id);
  const { data: reports } = await supabase
    .from('imaging_reports')
    .select('study_id, findings, impression, status')
    .in('study_id', studyIds);

  const reportsMap = new Map(reports?.map(r => [r.study_id, r]) || []);

  return studies.map((study) => {
    const report = reportsMap.get(study.id);
    return {
      id: study.id,
      studyType: study.study_description || study.modality,
      modality: study.modality,
      bodyPart: study.body_part,
      date: study.study_date,
      findings: report?.findings,
      impression: report?.impression,
      status: report?.status || 'pending',
      pacsLink: `/pacs/viewer/${study.id}`,
    };
  });
}

// Generate IPS
export async function generateIPS(
  patientId: string,
  options: IPSGenerationOptions
): Promise<PatientSummary | null> {
  try {
    const { data: patient } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single();

    if (!patient) throw new Error('Patient not found');

    const [allergies, medications, conditions, vitals, labResults, imaging] = await Promise.all([
      fetchPatientAllergies(patientId),
      fetchPatientMedications(patientId),
      fetchPatientConditions(patientId),
      fetchPatientVitals(patientId),
      fetchPatientLabResults(patientId),
      fetchPatientImaging(patientId),
    ]);

    const { data: tokenData } = await supabase.rpc('generate_summary_share_token');
    const shareToken = tokenData as string;

    const { data: ips, error } = await supabase
      .from('patient_summaries')
      .insert([{
        patient_id: patientId,
        health_id: patient.mrn,
        summary_type: options.trigger === 'emergency' ? 'emergency' : 'ips',
        status: 'current',
        allergies: allergies as unknown as any,
        medications: medications as unknown as any,
        conditions: conditions as unknown as any,
        vital_signs: vitals as unknown as any,
        diagnostic_results: labResults as unknown as any,
        imaging_summary: imaging as unknown as any,
        immunizations: [],
        procedures: [],
        care_plans: [],
        devices: [],
        source_systems: ['impilo-ehr'],
        authoring_organization: 'Impilo Health',
        generation_trigger: options.trigger,
        access_level: options.accessLevel || 'full',
        redaction_applied: (options.redactSections?.length || 0) > 0,
        redacted_sections: options.redactSections || [],
        share_token: shareToken,
        share_token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        generated_by: (await supabase.auth.getUser()).data.user?.id,
      }])
      .select()
      .single();

    if (error) throw error;
    return mapToPatientSummary(ips);
  } catch (error) {
    console.error('Error generating IPS:', error);
    return null;
  }
}

// Generate Visit Summary
export async function generateVisitSummary(
  encounterId: string,
  options: VisitSummaryGenerationOptions = {}
): Promise<VisitSummary | null> {
  try {
    const { data: encounter } = await supabase
      .from('encounters')
      .select('*')
      .eq('id', encounterId)
      .single();

    if (!encounter) throw new Error('Encounter not found');

    const patientId = encounter.patient_id;

    const { data: patient } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single();

    // Get prescriptions and their items
    const { data: prescriptions } = await supabase
      .from('prescriptions')
      .select('id, prescribed_at, status')
      .eq('encounter_id', encounterId);

    let prescriptionItems: any[] = [];
    if (prescriptions && prescriptions.length > 0) {
      const prescriptionIds = prescriptions.map(p => p.id);
      const { data: items } = await supabase
        .from('prescription_items')
        .select('*')
        .in('prescription_id', prescriptionIds);
      prescriptionItems = items || [];
    }

    // Get lab orders and their results
    const { data: labOrders } = await supabase
      .from('lab_orders')
      .select('id, ordered_at, status, clinical_indication')
      .eq('encounter_id', encounterId);

    let labResults: any[] = [];
    if (labOrders && labOrders.length > 0) {
      const orderIds = labOrders.map(o => o.id);
      const { data: results } = await supabase
        .from('lab_results')
        .select('*')
        .in('lab_order_id', orderIds);
      labResults = results || [];
    }

    // Get referrals
    const { data: referrals } = await supabase
      .from('referrals')
      .select('*')
      .eq('encounter_id', encounterId);

    const diagnoses: DiagnosisEntry[] = [];
    const medicationsPrescribed: MedicationEntry[] = prescriptionItems.map((item) => ({
      id: item.id,
      name: item.medication_name,
      dose: item.dosage,
      route: item.route,
      frequency: item.frequency,
      status: 'active' as const,
      startDate: item.created_at,
    }));

    const investigations: InvestigationEntry[] = labResults.map((result) => ({
      id: result.id,
      name: result.test_name,
      orderedAt: result.created_at,
      status: result.status as any,
      resultSummary: result.result_value,
      isAbnormal: result.is_abnormal,
      isCritical: result.is_critical,
    }));

    const referralsMade: ReferralEntry[] = (referrals || []).map((ref) => ({
      id: ref.id,
      destination: ref.to_department || 'External',
      specialty: ref.to_department,
      reason: ref.reason,
      urgency: (ref.urgency || 'routine') as any,
      status: ref.status as any,
    }));

    const { data: tokenData } = await supabase.rpc('generate_summary_share_token');
    const shareToken = tokenData as string;

    const { data: summary, error } = await supabase
      .from('visit_summaries')
      .insert([{
        encounter_id: encounterId,
        patient_id: patientId,
        status: 'draft',
        version: 1,
        visit_type: encounter.encounter_type,
        visit_start: encounter.admission_date,
        visit_end: encounter.discharge_date,
        presenting_complaint: encounter.chief_complaint,
        diagnoses: diagnoses as unknown as any,
        medications_prescribed: medicationsPrescribed as unknown as any,
        medications_changed: [],
        investigations_ordered: investigations as unknown as any,
        investigations_pending: investigations.filter(i => i.status !== 'completed') as unknown as any,
        allergies_verified: [],
        disposition: encounter.status === 'completed' ? 'discharged' : null,
        referrals_made: referralsMade as unknown as any,
        share_token: shareToken,
        share_token_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;
    return mapToVisitSummary(summary);
  } catch (error) {
    console.error('Error generating visit summary:', error);
    return null;
  }
}

// Sharing Functions
export async function createShareToken(
  summaryType: 'ips' | 'visit',
  summaryId: string,
  patientId: string,
  options: ShareOptions
): Promise<SummaryShareToken | null> {
  try {
    const { data: tokenData } = await supabase.rpc('generate_summary_share_token');
    const token = tokenData as string;
    const expiresAt = new Date(Date.now() + options.expiresInHours * 60 * 60 * 1000);
    const { data: user } = await supabase.auth.getUser();
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/shared/${summaryType}/${token}`;
    
    const { data, error } = await supabase
      .from('summary_share_tokens')
      .insert([{
        token,
        summary_type: summaryType,
        summary_id: summaryId,
        patient_id: patientId,
        created_by: user?.user?.id,
        recipient_type: options.recipientType,
        recipient_identifier: options.recipientIdentifier,
        access_level: options.accessLevel,
        allowed_actions: options.allowedActions || ['view'],
        max_access_count: options.maxAccessCount,
        expires_at: expiresAt.toISOString(),
        qr_code_url: options.generateQR ? shareUrl : null,
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      token: data.token,
      summaryType: data.summary_type as 'ips' | 'visit',
      summaryId: data.summary_id,
      patientId: data.patient_id,
      createdBy: data.created_by,
      createdByRole: data.created_by_role,
      recipientType: data.recipient_type as RecipientType,
      recipientIdentifier: data.recipient_identifier,
      accessLevel: data.access_level as AccessLevel,
      allowedActions: data.allowed_actions || [],
      maxAccessCount: data.max_access_count,
      currentAccessCount: data.current_access_count || 0,
      validFrom: data.valid_from,
      expiresAt: data.expires_at,
      qrCodeUrl: data.qr_code_url,
    };
  } catch (error) {
    console.error('Error creating share token:', error);
    return null;
  }
}

export async function revokeShareToken(tokenId: string, reason?: string): Promise<boolean> {
  try {
    const { data: user } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('summary_share_tokens')
      .update({ revoked_at: new Date().toISOString(), revoked_by: user?.user?.id, revoke_reason: reason })
      .eq('id', tokenId);
    return !error;
  } catch (error) {
    return false;
  }
}

export async function signVisitSummary(summaryId: string): Promise<boolean> {
  try {
    const { data: user } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('visit_summaries')
      .update({ status: 'final', signed_by: user?.user?.id, signed_at: new Date().toISOString(), finalized_at: new Date().toISOString() })
      .eq('id', summaryId);
    return !error;
  } catch (error) {
    return false;
  }
}

export async function getPatientIPS(patientId: string): Promise<PatientSummary | null> {
  try {
    const { data } = await supabase
      .from('patient_summaries')
      .select('*')
      .eq('patient_id', patientId)
      .eq('status', 'current')
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();
    return data ? mapToPatientSummary(data) : null;
  } catch { return null; }
}

export async function getVisitSummary(encounterId: string): Promise<VisitSummary | null> {
  try {
    const { data } = await supabase
      .from('visit_summaries')
      .select('*')
      .eq('encounter_id', encounterId)
      .order('version', { ascending: false })
      .limit(1)
      .single();
    return data ? mapToVisitSummary(data) : null;
  } catch { return null; }
}

function mapToPatientSummary(data: any): PatientSummary {
  return {
    id: data.id, patientId: data.patient_id, healthId: data.health_id, summaryType: data.summary_type, status: data.status,
    allergies: data.allergies || [], medications: data.medications || [], conditions: data.conditions || [],
    immunizations: data.immunizations || [], procedures: data.procedures || [], diagnosticResults: data.diagnostic_results || [],
    imagingSummary: data.imaging_summary || [], vitalSigns: data.vital_signs || [], carePlans: data.care_plans || [],
    socialHistory: data.social_history, pregnancyStatus: data.pregnancy_status, devices: data.devices || [],
    advanceDirectives: data.advance_directives, sourceSystems: data.source_systems || [],
    authoringOrganization: data.authoring_organization, generationTrigger: data.generation_trigger,
    dataRecencyNotes: data.data_recency_notes, consentReference: data.consent_reference,
    redactionApplied: data.redaction_applied, redactedSections: data.redacted_sections || [],
    accessLevel: data.access_level, shareToken: data.share_token, shareTokenExpiresAt: data.share_token_expires_at,
    qrCodeData: data.qr_code_data, generatedAt: data.generated_at, generatedBy: data.generated_by,
    lastAccessedAt: data.last_accessed_at, expiresAt: data.expires_at,
  };
}

function mapToVisitSummary(data: any): VisitSummary {
  return {
    id: data.id, encounterId: data.encounter_id, patientId: data.patient_id, status: data.status,
    version: data.version, previousVersionId: data.previous_version_id, amendmentReason: data.amendment_reason,
    facilityId: data.facility_id, facilityName: data.facility_name, servicePoint: data.service_point,
    visitType: data.visit_type, visitStart: data.visit_start, visitEnd: data.visit_end,
    attendingProviders: data.attending_providers || [], presentingComplaint: data.presenting_complaint,
    chiefComplaintCoded: data.chief_complaint_coded, keyFindings: data.key_findings,
    diagnoses: data.diagnoses || [], proceduresPerformed: data.procedures_performed || [],
    medicationsPrescribed: data.medications_prescribed || [], medicationsChanged: data.medications_changed || [],
    investigationsOrdered: data.investigations_ordered || [], investigationsPending: data.investigations_pending || [],
    imagingPerformed: data.imaging_performed || [], allergiesVerified: data.allergies_verified || [],
    disposition: data.disposition, dispositionDetails: data.disposition_details, followUpPlan: data.follow_up_plan,
    followUpAppointments: data.follow_up_appointments || [], returnPrecautions: data.return_precautions,
    referralsMade: data.referrals_made || [], encounterNoteLink: data.encounter_note_link,
    labResultsLink: data.lab_results_link, imagingLink: data.imaging_link, attachments: data.attachments || [],
    providerSummaryHtml: data.provider_summary_html, patientSummaryHtml: data.patient_summary_html,
    providerSummaryPdfPath: data.provider_summary_pdf_path, patientSummaryPdfPath: data.patient_summary_pdf_path,
    signedBy: data.signed_by, signedAt: data.signed_at, coSigners: data.co_signers || [],
    shareToken: data.share_token, shareTokenExpiresAt: data.share_token_expires_at, qrCodeData: data.qr_code_data,
    createdAt: data.created_at, updatedAt: data.updated_at, finalizedAt: data.finalized_at,
  };
}
