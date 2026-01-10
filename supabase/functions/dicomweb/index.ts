/**
 * DICOMweb Edge Function
 * Implements QIDO-RS, WADO-RS, and STOW-RS endpoints
 * 
 * Endpoints:
 * - GET /dicomweb/studies - QIDO-RS: Query studies
 * - GET /dicomweb/studies/{studyUID} - WADO-RS: Retrieve study
 * - GET /dicomweb/studies/{studyUID}/series - QIDO-RS: Query series
 * - GET /dicomweb/studies/{studyUID}/series/{seriesUID}/instances - QIDO-RS: Query instances
 * - GET /dicomweb/studies/{studyUID}/series/{seriesUID}/instances/{instanceUID} - WADO-RS: Retrieve instance
 * - POST /dicomweb/studies - STOW-RS: Store instances
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface DicomWebStudy {
  '00080020': { vr: 'DA'; Value: string[] }; // StudyDate
  '00080030': { vr: 'TM'; Value?: string[] }; // StudyTime
  '00080050': { vr: 'SH'; Value?: string[] }; // AccessionNumber
  '00080060': { vr: 'CS'; Value: string[] }; // ModalitiesInStudy
  '00080090': { vr: 'PN'; Value?: { Alphabetic: string }[] }; // ReferringPhysicianName
  '00081030': { vr: 'LO'; Value?: string[] }; // StudyDescription
  '00100010': { vr: 'PN'; Value?: { Alphabetic: string }[] }; // PatientName
  '00100020': { vr: 'LO'; Value?: string[] }; // PatientID
  '0020000D': { vr: 'UI'; Value: string[] }; // StudyInstanceUID
  '00201206': { vr: 'IS'; Value: number[] }; // NumberOfStudyRelatedSeries
  '00201208': { vr: 'IS'; Value: number[] }; // NumberOfStudyRelatedInstances
}

interface DicomWebSeries {
  '00080060': { vr: 'CS'; Value: string[] }; // Modality
  '0008103E': { vr: 'LO'; Value?: string[] }; // SeriesDescription
  '00180015': { vr: 'CS'; Value?: string[] }; // BodyPartExamined
  '0020000E': { vr: 'UI'; Value: string[] }; // SeriesInstanceUID
  '00200011': { vr: 'IS'; Value?: number[] }; // SeriesNumber
  '00201209': { vr: 'IS'; Value: number[] }; // NumberOfSeriesRelatedInstances
}

interface DicomWebInstance {
  '00080016': { vr: 'UI'; Value?: string[] }; // SOPClassUID
  '00080018': { vr: 'UI'; Value: string[] }; // SOPInstanceUID
  '00200013': { vr: 'IS'; Value?: number[] }; // InstanceNumber
  '00280010': { vr: 'US'; Value?: number[] }; // Rows
  '00280011': { vr: 'US'; Value?: number[] }; // Columns
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Remove 'dicomweb' prefix if present
    if (pathParts[0] === 'dicomweb') {
      pathParts.shift();
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Route handling
    if (req.method === 'GET') {
      // QIDO-RS: Query Studies
      if (pathParts[0] === 'studies' && !pathParts[1]) {
        return await queryStudies(supabase, url.searchParams);
      }
      
      // WADO-RS: Retrieve Study / QIDO-RS: Query Series
      if (pathParts[0] === 'studies' && pathParts[1]) {
        const studyUID = pathParts[1];
        
        if (pathParts[2] === 'series' && !pathParts[3]) {
          return await querySeries(supabase, studyUID);
        }
        
        if (pathParts[2] === 'series' && pathParts[3]) {
          const seriesUID = pathParts[3];
          
          if (pathParts[4] === 'instances' && !pathParts[5]) {
            return await queryInstances(supabase, studyUID, seriesUID);
          }
          
          if (pathParts[4] === 'instances' && pathParts[5]) {
            const instanceUID = pathParts[5];
            return await retrieveInstance(supabase, studyUID, seriesUID, instanceUID);
          }
        }
        
        // Retrieve entire study metadata
        return await retrieveStudy(supabase, studyUID);
      }
    }

    // STOW-RS: Store instances
    if (req.method === 'POST' && pathParts[0] === 'studies') {
      return await storeInstances(supabase, req);
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: unknown) {
    console.error('[DICOMweb] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

/**
 * QIDO-RS: Query Studies
 */
async function queryStudies(supabase: any, params: URLSearchParams): Promise<Response> {
  let query = supabase
    .from('imaging_studies')
    .select('*')
    .order('study_date', { ascending: false });

  // Apply DICOM query parameters
  const patientId = params.get('PatientID') || params.get('00100020');
  const studyDate = params.get('StudyDate') || params.get('00080020');
  const modality = params.get('ModalitiesInStudy') || params.get('00080060');
  const accession = params.get('AccessionNumber') || params.get('00080050');
  const limit = parseInt(params.get('limit') || '100');
  const offset = parseInt(params.get('offset') || '0');

  if (patientId) {
    query = query.eq('patient_id', patientId);
  }
  if (studyDate) {
    // Support date ranges (YYYYMMDD-YYYYMMDD)
    if (studyDate.includes('-')) {
      const [from, to] = studyDate.split('-');
      query = query.gte('study_date', formatDicomDate(from));
      query = query.lte('study_date', formatDicomDate(to));
    } else {
      query = query.eq('study_date', formatDicomDate(studyDate));
    }
  }
  if (modality) {
    query = query.eq('modality', modality);
  }
  if (accession) {
    query = query.eq('accession_number', accession);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    throw new Error(`Query failed: ${error.message}`);
  }

  // Convert to DICOM JSON format
  const dicomStudies: DicomWebStudy[] = (data || []).map((study: any) => ({
    '00080020': { vr: 'DA', Value: [study.study_date?.replace(/-/g, '') || ''] },
    '00080030': study.study_time ? { vr: 'TM', Value: [study.study_time] } : { vr: 'TM' },
    '00080050': study.accession_number ? { vr: 'SH', Value: [study.accession_number] } : { vr: 'SH' },
    '00080060': { vr: 'CS', Value: [study.modality] },
    '00080090': study.referring_physician ? { vr: 'PN', Value: [{ Alphabetic: study.referring_physician }] } : { vr: 'PN' },
    '00081030': study.study_description ? { vr: 'LO', Value: [study.study_description] } : { vr: 'LO' },
    '00100010': { vr: 'PN', Value: [{ Alphabetic: 'Patient' }] }, // Would need patient join
    '00100020': { vr: 'LO', Value: [study.patient_id] },
    '0020000D': { vr: 'UI', Value: [study.study_instance_uid] },
    '00201206': { vr: 'IS', Value: [study.number_of_series || 0] },
    '00201208': { vr: 'IS', Value: [study.number_of_instances || 0] },
  }));

  return new Response(
    JSON.stringify(dicomStudies),
    {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/dicom+json',
      },
    }
  );
}

/**
 * QIDO-RS: Query Series
 */
async function querySeries(supabase: any, studyUID: string): Promise<Response> {
  // First get study ID
  const { data: study, error: studyError } = await supabase
    .from('imaging_studies')
    .select('id')
    .eq('study_instance_uid', studyUID)
    .single();

  if (studyError || !study) {
    return new Response(
      JSON.stringify({ error: 'Study not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { data, error } = await supabase
    .from('imaging_series')
    .select('*')
    .eq('study_id', study.id)
    .order('series_number', { ascending: true });

  if (error) {
    throw new Error(`Query failed: ${error.message}`);
  }

  const dicomSeries: DicomWebSeries[] = (data || []).map((series: any) => ({
    '00080060': { vr: 'CS', Value: [series.modality] },
    '0008103E': series.series_description ? { vr: 'LO', Value: [series.series_description] } : { vr: 'LO' },
    '00180015': series.body_part_examined ? { vr: 'CS', Value: [series.body_part_examined] } : { vr: 'CS' },
    '0020000E': { vr: 'UI', Value: [series.series_instance_uid] },
    '00200011': series.series_number ? { vr: 'IS', Value: [series.series_number] } : { vr: 'IS' },
    '00201209': { vr: 'IS', Value: [series.number_of_instances || 0] },
  }));

  return new Response(
    JSON.stringify(dicomSeries),
    {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/dicom+json',
      },
    }
  );
}

/**
 * QIDO-RS: Query Instances
 */
async function queryInstances(supabase: any, studyUID: string, seriesUID: string): Promise<Response> {
  // Get series ID
  const { data: series, error: seriesError } = await supabase
    .from('imaging_series')
    .select('id')
    .eq('series_instance_uid', seriesUID)
    .single();

  if (seriesError || !series) {
    return new Response(
      JSON.stringify({ error: 'Series not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { data, error } = await supabase
    .from('imaging_instances')
    .select('*')
    .eq('series_id', series.id)
    .order('instance_number', { ascending: true });

  if (error) {
    throw new Error(`Query failed: ${error.message}`);
  }

  const dicomInstances: DicomWebInstance[] = (data || []).map((instance: any) => ({
    '00080016': instance.sop_class_uid ? { vr: 'UI', Value: [instance.sop_class_uid] } : { vr: 'UI' },
    '00080018': { vr: 'UI', Value: [instance.sop_instance_uid] },
    '00200013': instance.instance_number ? { vr: 'IS', Value: [instance.instance_number] } : { vr: 'IS' },
    '00280010': instance.rows ? { vr: 'US', Value: [instance.rows] } : { vr: 'US' },
    '00280011': instance.columns ? { vr: 'US', Value: [instance.columns] } : { vr: 'US' },
  }));

  return new Response(
    JSON.stringify(dicomInstances),
    {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/dicom+json',
      },
    }
  );
}

/**
 * WADO-RS: Retrieve Study Metadata
 */
async function retrieveStudy(supabase: any, studyUID: string): Promise<Response> {
  const { data: study, error: studyError } = await supabase
    .from('imaging_studies')
    .select(`
      *,
      imaging_series (
        *,
        imaging_instances (*)
      )
    `)
    .eq('study_instance_uid', studyUID)
    .single();

  if (studyError || !study) {
    return new Response(
      JSON.stringify({ error: 'Study not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify(study),
    {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/dicom+json',
      },
    }
  );
}

/**
 * WADO-RS: Retrieve Instance
 */
async function retrieveInstance(
  supabase: any,
  studyUID: string,
  seriesUID: string,
  instanceUID: string
): Promise<Response> {
  // Get instance storage path
  const { data: instance, error: instanceError } = await supabase
    .from('imaging_instances')
    .select('storage_path')
    .eq('sop_instance_uid', instanceUID)
    .single();

  if (instanceError || !instance) {
    return new Response(
      JSON.stringify({ error: 'Instance not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Download from storage
  const { data, error: downloadError } = await supabase.storage
    .from('dicom-images')
    .download(instance.storage_path);

  if (downloadError || !data) {
    return new Response(
      JSON.stringify({ error: 'Failed to retrieve DICOM file' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(data, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/dicom',
      'Content-Disposition': `attachment; filename="${instanceUID}.dcm"`,
    },
  });
}

/**
 * STOW-RS: Store Instances
 */
async function storeInstances(supabase: any, req: Request): Promise<Response> {
  const contentType = req.headers.get('content-type') || '';
  
  if (!contentType.includes('multipart/related')) {
    return new Response(
      JSON.stringify({ error: 'Content-Type must be multipart/related' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Parse multipart data
  const formData = await req.formData();
  const storedInstances: string[] = [];
  const failedInstances: string[] = [];

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      try {
        // Generate unique path
        const instanceUID = crypto.randomUUID();
        const storagePath = `uploads/${instanceUID}.dcm`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('dicom-images')
          .upload(storagePath, value, {
            contentType: 'application/dicom',
          });

        if (uploadError) {
          failedInstances.push(instanceUID);
          continue;
        }

        storedInstances.push(instanceUID);
      } catch (e) {
        console.error('[STOW-RS] Error storing instance:', e);
        failedInstances.push(key);
      }
    }
  }

  // Return STOW-RS response
  const response = {
    '00081190': { vr: 'UR', Value: storedInstances.map(uid => `/studies/${uid}`) },
    '00081198': failedInstances.length > 0 ? {
      vr: 'SQ',
      Value: failedInstances.map(uid => ({
        '00081150': { vr: 'UI', Value: [uid] },
        '00081155': { vr: 'UI', Value: [uid] },
        '00081197': { vr: 'US', Value: [272] }, // Processing failure
      })),
    } : undefined,
  };

  return new Response(
    JSON.stringify(response),
    {
      status: storedInstances.length > 0 ? 200 : 409,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/dicom+json',
      },
    }
  );
}

/**
 * Format DICOM date (YYYYMMDD) to ISO (YYYY-MM-DD)
 */
function formatDicomDate(dicomDate: string): string {
  if (!dicomDate || dicomDate.length !== 8) return dicomDate;
  return `${dicomDate.slice(0, 4)}-${dicomDate.slice(4, 6)}-${dicomDate.slice(6, 8)}`;
}
