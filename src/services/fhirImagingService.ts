/**
 * FHIR Imaging Service
 * Publishes ImagingStudy and DiagnosticReport resources to SHR
 */

import { supabase } from '@/integrations/supabase/client';

interface FHIRCoding {
  system: string;
  code: string;
  display: string;
}

interface FHIRReference {
  reference: string;
  display?: string;
}

interface FHIRImagingStudy {
  resourceType: 'ImagingStudy';
  id: string;
  identifier: Array<{
    system: string;
    value: string;
  }>;
  status: 'registered' | 'available' | 'cancelled' | 'entered-in-error';
  subject: FHIRReference;
  encounter?: FHIRReference;
  started: string;
  numberOfSeries: number;
  numberOfInstances: number;
  modality: FHIRCoding[];
  description?: string;
  procedureReference?: FHIRReference;
  location?: FHIRReference;
  reasonCode?: FHIRCoding[];
  note?: Array<{ text: string }>;
  series: FHIRImagingSeries[];
}

interface FHIRImagingSeries {
  uid: string;
  number?: number;
  modality: FHIRCoding;
  description?: string;
  numberOfInstances: number;
  bodySite?: FHIRCoding;
  laterality?: FHIRCoding;
  started?: string;
  performer?: Array<{
    function?: FHIRCoding;
    actor: FHIRReference;
  }>;
  instance: FHIRImagingInstance[];
}

interface FHIRImagingInstance {
  uid: string;
  sopClass: FHIRCoding;
  number?: number;
  title?: string;
}

interface FHIRDiagnosticReport {
  resourceType: 'DiagnosticReport';
  id: string;
  identifier: Array<{
    system: string;
    value: string;
  }>;
  basedOn?: FHIRReference[];
  status: 'registered' | 'partial' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'appended' | 'cancelled' | 'entered-in-error';
  category: FHIRCoding[];
  code: FHIRCoding;
  subject: FHIRReference;
  encounter?: FHIRReference;
  effectiveDateTime: string;
  issued: string;
  performer: FHIRReference[];
  resultsInterpreter?: FHIRReference[];
  imagingStudy?: FHIRReference[];
  conclusion?: string;
  conclusionCode?: FHIRCoding[];
  presentedForm?: Array<{
    contentType: string;
    data?: string;
    url?: string;
    title?: string;
  }>;
}

// Modality to DICOM UID mapping
const MODALITY_CODES: Record<string, FHIRCoding> = {
  'CR': { system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'CR', display: 'Computed Radiography' },
  'CT': { system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'CT', display: 'Computed Tomography' },
  'MR': { system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'MR', display: 'Magnetic Resonance' },
  'MRI': { system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'MR', display: 'Magnetic Resonance' },
  'US': { system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'US', display: 'Ultrasound' },
  'XR': { system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'DX', display: 'Digital Radiography' },
  'DX': { system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'DX', display: 'Digital Radiography' },
  'NM': { system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'NM', display: 'Nuclear Medicine' },
  'PT': { system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'PT', display: 'Positron Emission Tomography' },
  'MG': { system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'MG', display: 'Mammography' },
  'RF': { system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'RF', display: 'Radio Fluoroscopy' },
  'XA': { system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'XA', display: 'X-Ray Angiography' },
};

// Body site SNOMED codes
const BODY_SITE_CODES: Record<string, FHIRCoding> = {
  'HEAD': { system: 'http://snomed.info/sct', code: '69536005', display: 'Head structure' },
  'CHEST': { system: 'http://snomed.info/sct', code: '51185008', display: 'Thoracic structure' },
  'ABDOMEN': { system: 'http://snomed.info/sct', code: '818983003', display: 'Abdomen' },
  'PELVIS': { system: 'http://snomed.info/sct', code: '12921003', display: 'Pelvis' },
  'SPINE': { system: 'http://snomed.info/sct', code: '421060004', display: 'Vertebral column' },
  'EXTREMITY': { system: 'http://snomed.info/sct', code: '66019005', display: 'Extremity' },
  'BRAIN': { system: 'http://snomed.info/sct', code: '12738006', display: 'Brain structure' },
  'HEART': { system: 'http://snomed.info/sct', code: '80891009', display: 'Heart structure' },
};

/**
 * Convert internal imaging study to FHIR ImagingStudy
 */
export async function toFHIRImagingStudy(studyId: string): Promise<FHIRImagingStudy | null> {
  try {
    // Fetch study with related data
    const { data: study, error: studyError } = await supabase
      .from('imaging_studies')
      .select(`
        *,
        imaging_series (
          *,
          imaging_instances (*)
        )
      `)
      .eq('id', studyId)
      .single();
    
    if (studyError || !study) {
      console.error('[FHIR] Study not found:', studyError);
      return null;
    }
    
    // Get patient info
    const { data: patient } = await supabase
      .from('patients')
      .select('id, first_name, last_name, mrn')
      .eq('id', study.patient_id)
      .single();
    
    const modalityCoding = MODALITY_CODES[study.modality] || {
      system: 'http://dicom.nema.org/resources/ontology/DCM',
      code: study.modality,
      display: study.modality,
    };
    
    // Map status
    const statusMap: Record<string, 'registered' | 'available' | 'cancelled'> = {
      'received': 'registered',
      'pending_read': 'available',
      'preliminary': 'available',
      'final': 'available',
      'amended': 'available',
      'cancelled': 'cancelled',
    };
    
    // Build series array
    const series: FHIRImagingSeries[] = (study.imaging_series || []).map((s: any) => ({
      uid: s.series_instance_uid,
      number: s.series_number,
      modality: MODALITY_CODES[s.modality] || modalityCoding,
      description: s.series_description || undefined,
      numberOfInstances: s.number_of_instances || 0,
      bodySite: s.body_part_examined ? (BODY_SITE_CODES[s.body_part_examined.toUpperCase()] || undefined) : undefined,
      instance: (s.imaging_instances || []).map((i: any) => ({
        uid: i.sop_instance_uid,
        sopClass: {
          system: 'urn:ietf:rfc:3986',
          code: i.sop_class_uid || 'unknown',
          display: 'SOP Class',
        },
        number: i.instance_number || undefined,
      })),
    }));
    
    const fhirStudy: FHIRImagingStudy = {
      resourceType: 'ImagingStudy',
      id: study.id,
      identifier: [
        {
          system: 'urn:dicom:uid',
          value: `urn:oid:${study.study_instance_uid}`,
        },
      ],
      status: statusMap[study.status] || 'available',
      subject: {
        reference: `Patient/${patient?.mrn || study.patient_id}`,
        display: patient ? `${patient.first_name} ${patient.last_name}` : undefined,
      },
      started: `${study.study_date}T${study.study_time || '00:00:00'}`,
      numberOfSeries: study.number_of_series || series.length,
      numberOfInstances: study.number_of_instances || series.reduce((acc, s) => acc + s.numberOfInstances, 0),
      modality: [modalityCoding],
      description: study.study_description || undefined,
      series,
    };
    
    if (study.encounter_id) {
      fhirStudy.encounter = {
        reference: `Encounter/${study.encounter_id}`,
      };
    }
    
    if (study.accession_number) {
      fhirStudy.identifier.push({
        system: 'urn:impilo:accession',
        value: study.accession_number,
      });
    }
    
    return fhirStudy;
  } catch (error) {
    console.error('[FHIR] Error converting to ImagingStudy:', error);
    return null;
  }
}

/**
 * Convert internal report to FHIR DiagnosticReport
 */
export async function toFHIRDiagnosticReport(reportId: string): Promise<FHIRDiagnosticReport | null> {
  try {
    // Fetch report with study
    const { data: report, error: reportError } = await supabase
      .from('imaging_reports')
      .select(`
        *,
        imaging_studies!inner (
          *
        )
      `)
      .eq('id', reportId)
      .single();
    
    if (reportError || !report) {
      console.error('[FHIR] Report not found:', reportError);
      return null;
    }
    
    const study = report.imaging_studies;
    
    // Get patient
    const { data: patient } = await supabase
      .from('patients')
      .select('id, first_name, last_name, mrn')
      .eq('id', study.patient_id)
      .single();
    
    // Get reporter info
    let performerRef: FHIRReference | null = null;
    if (report.reported_by) {
      const { data: reporter } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', report.reported_by)
        .single();
      
      performerRef = {
        reference: `Practitioner/${report.reported_by}`,
        display: reporter?.display_name || undefined,
      };
    }
    
    // Map status
    const statusMap: Record<string, FHIRDiagnosticReport['status']> = {
      'draft': 'registered',
      'preliminary': 'preliminary',
      'final': 'final',
      'amended': 'amended',
      'addendum': 'appended',
    };
    
    const fhirReport: FHIRDiagnosticReport = {
      resourceType: 'DiagnosticReport',
      id: report.id,
      identifier: [
        {
          system: 'urn:impilo:report',
          value: report.id,
        },
      ],
      status: statusMap[report.status] || 'final',
      category: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
          code: 'RAD',
          display: 'Radiology',
        },
      ],
      code: {
        system: 'http://loinc.org',
        code: '18748-4',
        display: 'Diagnostic imaging study',
      },
      subject: {
        reference: `Patient/${patient?.mrn || study.patient_id}`,
        display: patient ? `${patient.first_name} ${patient.last_name}` : undefined,
      },
      effectiveDateTime: study.study_date,
      issued: report.updated_at || report.created_at,
      performer: performerRef ? [performerRef] : [],
      imagingStudy: [
        {
          reference: `ImagingStudy/${study.id}`,
        },
      ],
      conclusion: report.impression || undefined,
    };
    
    if (study.encounter_id) {
      fhirReport.encounter = {
        reference: `Encounter/${study.encounter_id}`,
      };
    }
    
    // Add findings as presented form if available
    if (report.findings) {
      fhirReport.presentedForm = [
        {
          contentType: 'text/plain',
          data: btoa(report.findings),
          title: 'Findings',
        },
      ];
    }
    
    return fhirReport;
  } catch (error) {
    console.error('[FHIR] Error converting to DiagnosticReport:', error);
    return null;
  }
}

/**
 * Publish imaging study to SHR
 * Note: This stores the FHIR resource for future SHR integration
 */
export async function publishImagingStudyToSHR(studyId: string): Promise<boolean> {
  try {
    const fhirStudy = await toFHIRImagingStudy(studyId);
    if (!fhirStudy) return false;
    
    // Log the FHIR resource - actual SHR publishing would happen via edge function
    console.log('[FHIR] ImagingStudy ready for SHR:', studyId, fhirStudy.resourceType);
    return true;
  } catch (error) {
    console.error('[FHIR] Error preparing ImagingStudy:', error);
    return false;
  }
}

/**
 * Publish diagnostic report to SHR
 * Note: This prepares the FHIR resource for future SHR integration
 */
export async function publishDiagnosticReportToSHR(reportId: string): Promise<boolean> {
  try {
    const fhirReport = await toFHIRDiagnosticReport(reportId);
    if (!fhirReport) return false;
    
    // Log the FHIR resource - actual SHR publishing would happen via edge function
    console.log('[FHIR] DiagnosticReport ready for SHR:', reportId, fhirReport.resourceType);
    return true;
  } catch (error) {
    console.error('[FHIR] Error preparing DiagnosticReport:', error);
    return false;
  }
}
