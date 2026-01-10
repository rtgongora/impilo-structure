import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PatientSummaryViewer, VisitSummaryViewer } from "@/components/summaries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, ShieldX, Clock } from "lucide-react";
import type { PatientSummary, VisitSummary } from "@/types/summary";

export default function SharedSummary() {
  const { type, token } = useParams<{ type: 'ips' | 'visit'; token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patientSummary, setPatientSummary] = useState<PatientSummary | null>(null);
  const [visitSummary, setVisitSummary] = useState<VisitSummary | null>(null);
  const [accessInfo, setAccessInfo] = useState<{
    accessLevel: string;
    expiresAt: string;
    recipientType: string;
  } | null>(null);

  useEffect(() => {
    async function validateAndFetchSummary() {
      if (!token || !type) {
        setError("Invalid share link");
        setLoading(false);
        return;
      }

      try {
        // Validate the share token
        const { data: shareToken, error: tokenError } = await supabase
          .from('summary_share_tokens')
          .select('*')
          .eq('token', token)
          .eq('summary_type', type)
          .is('revoked_at', null)
          .single();

        if (tokenError || !shareToken) {
          setError("This share link is invalid or has been revoked");
          setLoading(false);
          return;
        }

        // Check expiration
        if (new Date(shareToken.expires_at) < new Date()) {
          setError("This share link has expired");
          setLoading(false);
          return;
        }

        // Check max access count
        if (shareToken.max_access_count && shareToken.current_access_count >= shareToken.max_access_count) {
          setError("This share link has reached its maximum access limit");
          setLoading(false);
          return;
        }

        setAccessInfo({
          accessLevel: shareToken.access_level,
          expiresAt: shareToken.expires_at,
          recipientType: shareToken.recipient_type,
        });

        // Log access
        await supabase.from('summary_access_log').insert([{
          summary_type: type,
          summary_id: shareToken.summary_id,
          patient_id: shareToken.patient_id,
          access_type: 'view',
          accessed_via: 'share_link',
          share_token_id: shareToken.id,
        }]);

        // Increment access count
        await supabase
          .from('summary_share_tokens')
          .update({ 
            current_access_count: (shareToken.current_access_count || 0) + 1,
            last_accessed_at: new Date().toISOString(),
          })
          .eq('id', shareToken.id);

        // Fetch the actual summary
        if (type === 'ips') {
          const { data } = await supabase
            .from('patient_summaries')
            .select('*')
            .eq('id', shareToken.summary_id)
            .single();
          
          if (data) {
            setPatientSummary(mapToPatientSummary(data));
          }
        } else {
          const { data } = await supabase
            .from('visit_summaries')
            .select('*')
            .eq('id', shareToken.summary_id)
            .single();
          
          if (data) {
            setVisitSummary(mapToVisitSummary(data));
          }
        }
      } catch (err) {
        console.error('Error fetching shared summary:', err);
        setError("An error occurred while loading the summary");
      } finally {
        setLoading(false);
      }
    }

    validateAndFetchSummary();
  }, [token, type]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Validating access and loading summary...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <ShieldX className="w-16 h-16 text-destructive mx-auto mb-4" />
            <CardTitle className="text-destructive">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Security Banner */}
      <div className="bg-primary/10 border-b border-primary/20 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">Secure Shared Summary</span>
          </div>
          {accessInfo && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Badge variant="outline">{accessInfo.accessLevel}</Badge>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Expires: {new Date(accessInfo.expiresAt).toLocaleDateString()}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        {type === 'ips' && patientSummary && (
          <PatientSummaryViewer 
            patientId={patientSummary.patientId}
            patientName="Patient"
            healthId={patientSummary.healthId}
          />
        )}
        {type === 'visit' && visitSummary && (
          <VisitSummaryViewer 
            encounterId={visitSummary.encounterId}
            patientName="Patient"
          />
        )}
      </div>
    </div>
  );
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
