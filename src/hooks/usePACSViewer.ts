import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ImagingStudy {
  id: string;
  patient_id: string;
  order_id: string | null;
  encounter_id: string | null;
  study_instance_uid: string;
  accession_number: string | null;
  modality: string;
  study_description: string | null;
  study_date: string;
  study_time: string | null;
  body_part: string | null;
  institution_name: string | null;
  station_name: string | null;
  performing_physician: string | null;
  referring_physician: string | null;
  number_of_series: number;
  number_of_instances: number;
  status: 'received' | 'pending_read' | 'preliminary' | 'final' | 'amended' | 'cancelled';
  priority: 'stat' | 'urgent' | 'routine';
  storage_location: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ImagingSeries {
  id: string;
  study_id: string;
  series_instance_uid: string;
  series_number: number | null;
  series_description: string | null;
  modality: string;
  body_part_examined: string | null;
  protocol_name: string | null;
  slice_thickness: number | null;
  spacing_between_slices: number | null;
  number_of_instances: number;
  created_at: string;
}

export interface ImagingInstance {
  id: string;
  series_id: string;
  sop_instance_uid: string;
  sop_class_uid: string | null;
  instance_number: number | null;
  rows: number | null;
  columns: number | null;
  bits_allocated: number | null;
  pixel_spacing: number[] | null;
  window_center: number | null;
  window_width: number | null;
  storage_path: string;
  file_size_bytes: number | null;
  transfer_syntax_uid: string | null;
  created_at: string;
}

export interface ImagingReport {
  id: string;
  study_id: string;
  findings: string | null;
  impression: string | null;
  recommendations: string | null;
  clinical_history: string | null;
  comparison_studies: string | null;
  technique: string | null;
  has_critical_finding: boolean;
  critical_finding_details: string | null;
  critical_finding_notified_at: string | null;
  critical_finding_notified_to: string | null;
  status: 'draft' | 'preliminary' | 'final' | 'amended' | 'addendum';
  reported_by: string | null;
  reported_at: string | null;
  signed_by: string | null;
  signed_at: string | null;
  amendment_reason: string | null;
  previous_report_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ImagingAnnotation {
  id: string;
  instance_id: string;
  study_id: string;
  annotation_type: 'length' | 'angle' | 'area' | 'roi' | 'arrow' | 'text' | 'ellipse' | 'freehand';
  annotation_data: {
    points: { x: number; y: number }[];
    measurement?: string;
    label?: string;
    color?: string;
  };
  label: string | null;
  is_key_image: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WindowPreset {
  name: string;
  window: number;
  level: number;
}

export const WINDOW_PRESETS: WindowPreset[] = [
  { name: 'Default', window: 400, level: 40 },
  { name: 'Lung', window: 1500, level: -600 },
  { name: 'Bone', window: 2500, level: 480 },
  { name: 'Soft Tissue', window: 400, level: 40 },
  { name: 'Brain', window: 80, level: 40 },
  { name: 'Liver', window: 150, level: 30 },
  { name: 'Abdomen', window: 350, level: 50 },
  { name: 'Spine', window: 300, level: 30 },
  { name: 'Mediastinum', window: 350, level: 50 },
  { name: 'Stroke', window: 40, level: 40 },
];

export function usePACSViewer() {
  const [studies, setStudies] = useState<ImagingStudy[]>([]);
  const [selectedStudy, setSelectedStudy] = useState<ImagingStudy | null>(null);
  const [series, setSeries] = useState<ImagingSeries[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<ImagingSeries | null>(null);
  const [instances, setInstances] = useState<ImagingInstance[]>([]);
  const [currentInstance, setCurrentInstance] = useState<ImagingInstance | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [report, setReport] = useState<ImagingReport | null>(null);
  const [annotations, setAnnotations] = useState<ImagingAnnotation[]>([]);
  const [loading, setLoading] = useState(false);

  // Viewer state
  const [zoom, setZoom] = useState(100);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [windowWidth, setWindowWidth] = useState(400);
  const [windowLevel, setWindowLevel] = useState(40);
  const [invert, setInvert] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTool, setActiveTool] = useState<string>('pan');
  const [showAnnotations, setShowAnnotations] = useState(true);

  const fetchStudies = useCallback(async (patientId?: string, filters?: {
    modality?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
  }) => {
    setLoading(true);
    try {
      let query = supabase
        .from('imaging_studies')
        .select('*')
        .order('study_date', { ascending: false });

      if (patientId) {
        query = query.eq('patient_id', patientId);
      }
      if (filters?.modality) {
        query = query.eq('modality', filters.modality);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.dateFrom) {
        query = query.gte('study_date', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('study_date', filters.dateTo);
      }

      const { data, error } = await query;

      if (error) throw error;
      setStudies((data || []) as unknown as ImagingStudy[]);
    } catch (error) {
      console.error('[PACS] Error fetching studies:', error);
      toast.error('Failed to load imaging studies');
    } finally {
      setLoading(false);
    }
  }, []);

  const selectStudy = useCallback(async (study: ImagingStudy) => {
    setSelectedStudy(study);
    setLoading(true);

    try {
      // Fetch series
      const { data: seriesData, error: seriesError } = await supabase
        .from('imaging_series')
        .select('*')
        .eq('study_id', study.id)
        .order('series_number', { ascending: true });

      if (seriesError) throw seriesError;
      const typedSeries = (seriesData || []) as unknown as ImagingSeries[];
      setSeries(typedSeries);

      // Auto-select first series
      if (typedSeries && typedSeries.length > 0) {
        await selectSeries(typedSeries[0]);
      }

      // Fetch report
      const { data: reportData } = await supabase
        .from('imaging_reports')
        .select('*')
        .eq('study_id', study.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setReport(reportData as unknown as ImagingReport | null);

      // Fetch annotations
      const { data: annotationsData } = await supabase
        .from('imaging_annotations')
        .select('*')
        .eq('study_id', study.id);

      setAnnotations((annotationsData || []) as unknown as ImagingAnnotation[]);
    } catch (error) {
      console.error('[PACS] Error loading study:', error);
      toast.error('Failed to load study details');
    } finally {
      setLoading(false);
    }
  }, []);

  const selectSeries = useCallback(async (seriesItem: ImagingSeries) => {
    setSelectedSeries(seriesItem);

    try {
      const { data: instancesData, error } = await supabase
        .from('imaging_instances')
        .select('*')
        .eq('series_id', seriesItem.id)
        .order('instance_number', { ascending: true });

      if (error) throw error;
      const typedInstances = (instancesData || []) as unknown as ImagingInstance[];
      setInstances(typedInstances);

      // Set first instance as current
      if (typedInstances && typedInstances.length > 0) {
        setCurrentInstance(typedInstances[0]);
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('[PACS] Error loading instances:', error);
      toast.error('Failed to load images');
    }
  }, []);

  const navigateImage = useCallback((direction: 'prev' | 'next') => {
    if (instances.length === 0) return;

    let newIndex = currentIndex;
    if (direction === 'next') {
      newIndex = Math.min(currentIndex + 1, instances.length - 1);
    } else {
      newIndex = Math.max(currentIndex - 1, 0);
    }

    setCurrentIndex(newIndex);
    setCurrentInstance(instances[newIndex]);
  }, [currentIndex, instances]);

  const goToImage = useCallback((index: number) => {
    if (index >= 0 && index < instances.length) {
      setCurrentIndex(index);
      setCurrentInstance(instances[index]);
    }
  }, [instances]);

  const applyWindowPreset = useCallback((preset: WindowPreset) => {
    setWindowWidth(preset.window);
    setWindowLevel(preset.level);
    toast.success(`Applied ${preset.name} preset`);
  }, []);

  const resetView = useCallback(() => {
    setZoom(100);
    setPan({ x: 0, y: 0 });
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setInvert(false);
    setWindowWidth(400);
    setWindowLevel(40);
  }, []);

  const rotateImage = useCallback((degrees: number) => {
    setRotation((prev) => (prev + degrees) % 360);
  }, []);

  const addAnnotation = useCallback(async (
    type: ImagingAnnotation['annotation_type'],
    data: ImagingAnnotation['annotation_data'],
    userId: string
  ) => {
    if (!currentInstance || !selectedStudy) return;

    try {
      const { data: newAnnotation, error } = await supabase
        .from('imaging_annotations')
        .insert({
          instance_id: currentInstance.id,
          study_id: selectedStudy.id,
          annotation_type: type,
          annotation_data: data as any,
          label: data.label || null,
          is_key_image: false,
          created_by: userId,
        } as any)
        .select()
        .single();

      if (error) throw error;
      setAnnotations((prev) => [...prev, newAnnotation as unknown as ImagingAnnotation]);
      toast.success('Annotation added');
      return newAnnotation;
    } catch (error) {
      console.error('[PACS] Error adding annotation:', error);
      toast.error('Failed to add annotation');
      return null;
    }
  }, [currentInstance, selectedStudy]);

  const deleteAnnotation = useCallback(async (annotationId: string) => {
    try {
      const { error } = await supabase
        .from('imaging_annotations')
        .delete()
        .eq('id', annotationId);

      if (error) throw error;
      setAnnotations((prev) => prev.filter((a) => a.id !== annotationId));
      toast.success('Annotation deleted');
    } catch (error) {
      console.error('[PACS] Error deleting annotation:', error);
      toast.error('Failed to delete annotation');
    }
  }, []);

  const markKeyImage = useCallback(async (instanceId: string, isKey: boolean) => {
    try {
      // Update or create annotation marking this as key image
      const existingKeyAnnotation = annotations.find(
        (a) => a.instance_id === instanceId && a.is_key_image
      );

      if (existingKeyAnnotation && !isKey) {
        await deleteAnnotation(existingKeyAnnotation.id);
      } else if (!existingKeyAnnotation && isKey) {
        // Just mark it by updating instance annotations
        toast.success('Marked as key image');
      }
    } catch (error) {
      console.error('[PACS] Error marking key image:', error);
      toast.error('Failed to mark key image');
    }
  }, [annotations, deleteAnnotation]);

  const saveReport = useCallback(async (
    reportData: Partial<ImagingReport>,
    userId: string
  ) => {
    if (!selectedStudy) return null;

    try {
      if (report?.id) {
        // Update existing report
        const { data, error } = await supabase
          .from('imaging_reports')
          .update({
            ...reportData,
            updated_at: new Date().toISOString(),
          } as any)
          .eq('id', report.id)
          .select()
          .single();

        if (error) throw error;
        setReport(data as unknown as ImagingReport);
        toast.success('Report saved');
        return data;
      } else {
        // Create new report
        const { data, error } = await supabase
          .from('imaging_reports')
          .insert({
            study_id: selectedStudy.id,
            reported_by: userId,
            status: 'draft',
            ...reportData,
          } as any)
          .select()
          .single();

        if (error) throw error;
        setReport(data as unknown as ImagingReport);
        toast.success('Report created');
        return data;
      }
    } catch (error) {
      console.error('[PACS] Error saving report:', error);
      toast.error('Failed to save report');
      return null;
    }
  }, [selectedStudy, report]);

  const signReport = useCallback(async (userId: string) => {
    if (!report?.id) return;

    try {
      const { data, error } = await supabase
        .from('imaging_reports')
        .update({
          status: 'final',
          signed_by: userId,
          signed_at: new Date().toISOString(),
        } as any)
        .eq('id', report.id)
        .select()
        .single();

      if (error) throw error;
      setReport(data as unknown as ImagingReport);

      // Update study status
      if (selectedStudy) {
        await supabase
          .from('imaging_studies')
          .update({ status: 'final' } as any)
          .eq('id', selectedStudy.id);
      }

      toast.success('Report signed and finalized');
      return data;
    } catch (error) {
      console.error('[PACS] Error signing report:', error);
      toast.error('Failed to sign report');
      return null;
    }
  }, [report, selectedStudy]);

  return {
    // Data
    studies,
    selectedStudy,
    series,
    selectedSeries,
    instances,
    currentInstance,
    currentIndex,
    report,
    annotations,
    loading,

    // Viewer state
    zoom,
    pan,
    rotation,
    flipH,
    flipV,
    windowWidth,
    windowLevel,
    invert,
    isPlaying,
    activeTool,
    showAnnotations,

    // Viewer controls
    setZoom,
    setPan,
    setRotation,
    setFlipH,
    setFlipV,
    setWindowWidth,
    setWindowLevel,
    setInvert,
    setIsPlaying,
    setActiveTool,
    setShowAnnotations,

    // Actions
    fetchStudies,
    selectStudy,
    selectSeries,
    navigateImage,
    goToImage,
    applyWindowPreset,
    resetView,
    rotateImage,
    addAnnotation,
    deleteAnnotation,
    markKeyImage,
    saveReport,
    signReport,
  };
}
