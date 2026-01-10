/**
 * DICOM Service - Core DICOM handling and Cornerstone.js integration
 * Provides real DICOM parsing, rendering, and manipulation capabilities
 */

import dicomParser from 'dicom-parser';
import { supabase } from '@/integrations/supabase/client';

// DICOM Tag constants
export const DicomTags = {
  // Patient
  PatientName: 'x00100010',
  PatientID: 'x00100020',
  PatientBirthDate: 'x00100030',
  PatientSex: 'x00100040',
  
  // Study
  StudyInstanceUID: 'x0020000d',
  StudyDate: 'x00080020',
  StudyTime: 'x00080030',
  StudyDescription: 'x00081030',
  AccessionNumber: 'x00080050',
  ReferringPhysicianName: 'x00080090',
  
  // Series
  SeriesInstanceUID: 'x0020000e',
  SeriesNumber: 'x00200011',
  SeriesDescription: 'x0008103e',
  Modality: 'x00080060',
  BodyPartExamined: 'x00180015',
  
  // Instance
  SOPInstanceUID: 'x00080018',
  SOPClassUID: 'x00080016',
  InstanceNumber: 'x00200013',
  
  // Image
  Rows: 'x00280010',
  Columns: 'x00280011',
  BitsAllocated: 'x00280100',
  BitsStored: 'x00280101',
  HighBit: 'x00280102',
  PixelRepresentation: 'x00280103',
  PixelSpacing: 'x00280030',
  WindowCenter: 'x00281050',
  WindowWidth: 'x00281051',
  RescaleIntercept: 'x00281052',
  RescaleSlope: 'x00281053',
  PhotometricInterpretation: 'x00280004',
  SamplesPerPixel: 'x00280002',
  PixelData: 'x7fe00010',
  
  // Slice
  SliceThickness: 'x00180050',
  SliceLocation: 'x00201041',
  ImagePositionPatient: 'x00200032',
  ImageOrientationPatient: 'x00200037',
  SpacingBetweenSlices: 'x00180088',
  
  // Equipment
  Manufacturer: 'x00080070',
  InstitutionName: 'x00080080',
  StationName: 'x00081010',
};

export interface ParsedDicomData {
  patientName: string;
  patientId: string;
  patientBirthDate: string;
  patientSex: string;
  studyInstanceUid: string;
  studyDate: string;
  studyTime: string;
  studyDescription: string;
  accessionNumber: string;
  seriesInstanceUid: string;
  seriesNumber: number;
  seriesDescription: string;
  modality: string;
  bodyPartExamined: string;
  sopInstanceUid: string;
  sopClassUid: string;
  instanceNumber: number;
  rows: number;
  columns: number;
  bitsAllocated: number;
  bitsStored: number;
  pixelSpacing: [number, number] | null;
  windowCenter: number | null;
  windowWidth: number | null;
  rescaleIntercept: number;
  rescaleSlope: number;
  sliceThickness: number | null;
  sliceLocation: number | null;
  imagePositionPatient: [number, number, number] | null;
  imageOrientationPatient: number[] | null;
  photometricInterpretation: string;
  pixelData: Uint8Array | Int16Array | Uint16Array | null;
  manufacturer: string;
  institutionName: string;
}

export interface DicomImage {
  width: number;
  height: number;
  pixelData: Int16Array | Uint16Array | Uint8Array;
  minPixelValue: number;
  maxPixelValue: number;
  slope: number;
  intercept: number;
  windowWidth: number;
  windowCenter: number;
  invert: boolean;
  color: boolean;
  columnPixelSpacing: number;
  rowPixelSpacing: number;
  sizeInBytes: number;
  getPixelData: () => Int16Array | Uint16Array | Uint8Array;
}

/**
 * Parse DICOM file and extract metadata
 */
export function parseDicomFile(arrayBuffer: ArrayBuffer): ParsedDicomData {
  const byteArray = new Uint8Array(arrayBuffer);
  const dataSet = dicomParser.parseDicom(byteArray);
  
  const getString = (tag: string) => {
    try {
      return dataSet.string(tag) || '';
    } catch {
      return '';
    }
  };
  
  const getNumber = (tag: string, defaultValue: number = 0) => {
    try {
      const value = dataSet.uint16(tag) || dataSet.int16(tag);
      return value !== undefined ? value : defaultValue;
    } catch {
      return defaultValue;
    }
  };
  
  const getFloat = (tag: string) => {
    try {
      return dataSet.floatString(tag);
    } catch {
      return null;
    }
  };
  
  const getFloatArray = (tag: string): number[] | null => {
    try {
      const str = getString(tag);
      if (!str) return null;
      return str.split('\\').map(parseFloat);
    } catch {
      return null;
    }
  };
  
  // Extract pixel data
  let pixelData: Uint8Array | Int16Array | Uint16Array | null = null;
  try {
    const pixelDataElement = dataSet.elements[DicomTags.PixelData];
    if (pixelDataElement) {
      const bitsAllocated = getNumber(DicomTags.BitsAllocated, 16);
      const pixelRepresentation = getNumber(DicomTags.PixelRepresentation, 0);
      
      if (bitsAllocated === 8) {
        pixelData = new Uint8Array(dataSet.byteArray.buffer, pixelDataElement.dataOffset, pixelDataElement.length);
      } else if (bitsAllocated === 16) {
        if (pixelRepresentation === 0) {
          pixelData = new Uint16Array(dataSet.byteArray.buffer, pixelDataElement.dataOffset, pixelDataElement.length / 2);
        } else {
          pixelData = new Int16Array(dataSet.byteArray.buffer, pixelDataElement.dataOffset, pixelDataElement.length / 2);
        }
      }
    }
  } catch (e) {
    console.warn('Could not extract pixel data:', e);
  }
  
  const pixelSpacingArr = getFloatArray(DicomTags.PixelSpacing);
  const imagePosition = getFloatArray(DicomTags.ImagePositionPatient);
  
  return {
    patientName: getString(DicomTags.PatientName),
    patientId: getString(DicomTags.PatientID),
    patientBirthDate: getString(DicomTags.PatientBirthDate),
    patientSex: getString(DicomTags.PatientSex),
    studyInstanceUid: getString(DicomTags.StudyInstanceUID),
    studyDate: getString(DicomTags.StudyDate),
    studyTime: getString(DicomTags.StudyTime),
    studyDescription: getString(DicomTags.StudyDescription),
    accessionNumber: getString(DicomTags.AccessionNumber),
    seriesInstanceUid: getString(DicomTags.SeriesInstanceUID),
    seriesNumber: parseInt(getString(DicomTags.SeriesNumber)) || 1,
    seriesDescription: getString(DicomTags.SeriesDescription),
    modality: getString(DicomTags.Modality),
    bodyPartExamined: getString(DicomTags.BodyPartExamined),
    sopInstanceUid: getString(DicomTags.SOPInstanceUID),
    sopClassUid: getString(DicomTags.SOPClassUID),
    instanceNumber: parseInt(getString(DicomTags.InstanceNumber)) || 1,
    rows: getNumber(DicomTags.Rows),
    columns: getNumber(DicomTags.Columns),
    bitsAllocated: getNumber(DicomTags.BitsAllocated, 16),
    bitsStored: getNumber(DicomTags.BitsStored, 12),
    pixelSpacing: pixelSpacingArr && pixelSpacingArr.length >= 2 
      ? [pixelSpacingArr[0], pixelSpacingArr[1]] 
      : null,
    windowCenter: getFloat(DicomTags.WindowCenter),
    windowWidth: getFloat(DicomTags.WindowWidth),
    rescaleIntercept: getFloat(DicomTags.RescaleIntercept) || 0,
    rescaleSlope: getFloat(DicomTags.RescaleSlope) || 1,
    sliceThickness: getFloat(DicomTags.SliceThickness),
    sliceLocation: getFloat(DicomTags.SliceLocation),
    imagePositionPatient: imagePosition && imagePosition.length >= 3 
      ? [imagePosition[0], imagePosition[1], imagePosition[2]] 
      : null,
    imageOrientationPatient: getFloatArray(DicomTags.ImageOrientationPatient),
    photometricInterpretation: getString(DicomTags.PhotometricInterpretation),
    pixelData,
    manufacturer: getString(DicomTags.Manufacturer),
    institutionName: getString(DicomTags.InstitutionName),
  };
}

/**
 * Create a renderable image from DICOM data
 */
export function createDicomImage(parsed: ParsedDicomData): DicomImage | null {
  if (!parsed.pixelData || !parsed.rows || !parsed.columns) {
    return null;
  }
  
  let minPixel = Infinity;
  let maxPixel = -Infinity;
  
  for (let i = 0; i < parsed.pixelData.length; i++) {
    const val = parsed.pixelData[i];
    if (val < minPixel) minPixel = val;
    if (val > maxPixel) maxPixel = val;
  }
  
  const isColor = parsed.photometricInterpretation === 'RGB' || 
                  parsed.photometricInterpretation === 'YBR_FULL';
  const invert = parsed.photometricInterpretation === 'MONOCHROME1';
  
  return {
    width: parsed.columns,
    height: parsed.rows,
    pixelData: parsed.pixelData,
    minPixelValue: minPixel,
    maxPixelValue: maxPixel,
    slope: parsed.rescaleSlope,
    intercept: parsed.rescaleIntercept,
    windowWidth: parsed.windowWidth || (maxPixel - minPixel),
    windowCenter: parsed.windowCenter || ((maxPixel + minPixel) / 2),
    invert,
    color: isColor,
    columnPixelSpacing: parsed.pixelSpacing?.[1] || 1,
    rowPixelSpacing: parsed.pixelSpacing?.[0] || 1,
    sizeInBytes: parsed.pixelData.byteLength,
    getPixelData: () => parsed.pixelData!,
  };
}

/**
 * Apply window/level to pixel data and render to canvas
 */
export function renderDicomToCanvas(
  canvas: HTMLCanvasElement,
  image: DicomImage,
  windowWidth: number,
  windowCenter: number,
  options: {
    invert?: boolean;
    zoom?: number;
    panX?: number;
    panY?: number;
    rotation?: number;
    flipH?: boolean;
    flipV?: boolean;
  } = {}
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  const { invert = image.invert, zoom = 1, panX = 0, panY = 0, rotation = 0, flipH = false, flipV = false } = options;
  
  // Set canvas size
  canvas.width = image.width;
  canvas.height = image.height;
  
  // Create image data
  const imageData = ctx.createImageData(image.width, image.height);
  const pixels = imageData.data;
  const pixelData = image.getPixelData();
  
  // Calculate window/level parameters
  const windowMin = windowCenter - windowWidth / 2;
  const windowMax = windowCenter + windowWidth / 2;
  
  // Apply window/level and convert to grayscale
  for (let i = 0; i < pixelData.length; i++) {
    // Apply rescale slope/intercept
    let pixelValue = pixelData[i] * image.slope + image.intercept;
    
    // Apply window/level
    if (pixelValue <= windowMin) {
      pixelValue = 0;
    } else if (pixelValue >= windowMax) {
      pixelValue = 255;
    } else {
      pixelValue = ((pixelValue - windowMin) / windowWidth) * 255;
    }
    
    // Apply inversion
    if (invert) {
      pixelValue = 255 - pixelValue;
    }
    
    const pixelIndex = i * 4;
    pixels[pixelIndex] = pixelValue;     // R
    pixels[pixelIndex + 1] = pixelValue; // G
    pixels[pixelIndex + 2] = pixelValue; // B
    pixels[pixelIndex + 3] = 255;        // A
  }
  
  // Apply transforms
  ctx.save();
  ctx.translate(canvas.width / 2 + panX, canvas.height / 2 + panY);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(flipH ? -zoom : zoom, flipV ? -zoom : zoom);
  ctx.translate(-canvas.width / 2, -canvas.height / 2);
  ctx.putImageData(imageData, 0, 0);
  ctx.restore();
}

/**
 * Upload DICOM file to storage and create database records
 */
export async function uploadDicomFile(
  file: File,
  patientId: string,
  encounterId?: string
): Promise<{ studyId: string; seriesId: string; instanceId: string } | null> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const parsed = parseDicomFile(arrayBuffer);
    
    // Generate storage path
    const storagePath = `studies/${parsed.studyInstanceUid}/${parsed.seriesInstanceUid}/${parsed.sopInstanceUid}.dcm`;
    
    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('dicom-images')
      .upload(storagePath, file, {
        contentType: 'application/dicom',
        upsert: true,
      });
    
    if (uploadError) throw uploadError;
    
    // Check if study exists
    const { data: existingStudy } = await supabase
      .from('imaging_studies')
      .select('id')
      .eq('study_instance_uid', parsed.studyInstanceUid)
      .maybeSingle();
    
    let studyId: string;
    
    if (existingStudy) {
      studyId = existingStudy.id;
      // Update study counts - increment manually
      await supabase
        .from('imaging_studies')
        .update({ number_of_instances: (existingStudy as any).number_of_instances + 1 })
        .eq('id', studyId);
    } else {
      // Create new study
      const { data: newStudy, error: studyError } = await supabase
        .from('imaging_studies')
        .insert({
          patient_id: patientId,
          encounter_id: encounterId,
          study_instance_uid: parsed.studyInstanceUid,
          accession_number: parsed.accessionNumber || null,
          modality: parsed.modality,
          study_description: parsed.studyDescription || null,
          study_date: formatDicomDate(parsed.studyDate),
          study_time: parsed.studyTime || null,
          body_part: parsed.bodyPartExamined || null,
          institution_name: parsed.institutionName || null,
          number_of_series: 1,
          number_of_instances: 1,
          status: 'received',
          priority: 'routine',
        })
        .select('id')
        .single();
      
      if (studyError) throw studyError;
      studyId = newStudy.id;
    }
    
    // Check if series exists
    const { data: existingSeries } = await supabase
      .from('imaging_series')
      .select('id')
      .eq('series_instance_uid', parsed.seriesInstanceUid)
      .maybeSingle();
    
    let seriesId: string;
    
    if (existingSeries) {
      seriesId = existingSeries.id;
      // Update series instance count
      const { count } = await supabase
        .from('imaging_instances')
        .select('*', { count: 'exact', head: true })
        .eq('series_id', seriesId);
      await supabase
        .from('imaging_series')
        .update({ number_of_instances: (count || 0) + 1 })
        .eq('id', seriesId);
    } else {
      // Create new series
      const { data: newSeries, error: seriesError } = await supabase
        .from('imaging_series')
        .insert({
          study_id: studyId,
          series_instance_uid: parsed.seriesInstanceUid,
          series_number: parsed.seriesNumber,
          series_description: parsed.seriesDescription || null,
          modality: parsed.modality,
          body_part_examined: parsed.bodyPartExamined || null,
          slice_thickness: parsed.sliceThickness,
          spacing_between_slices: null,
          number_of_instances: 1,
        })
        .select('id')
        .single();
      
      if (seriesError) throw seriesError;
      seriesId = newSeries.id;
    }
    
    // Create instance record
    const { data: newInstance, error: instanceError } = await supabase
      .from('imaging_instances')
      .insert({
        series_id: seriesId,
        sop_instance_uid: parsed.sopInstanceUid,
        sop_class_uid: parsed.sopClassUid || null,
        instance_number: parsed.instanceNumber,
        rows: parsed.rows,
        columns: parsed.columns,
        bits_allocated: parsed.bitsAllocated,
        pixel_spacing: parsed.pixelSpacing,
        window_center: parsed.windowCenter,
        window_width: parsed.windowWidth,
        storage_path: storagePath,
        file_size_bytes: file.size,
      })
      .select('id')
      .single();
    
    if (instanceError) throw instanceError;
    
    return {
      studyId,
      seriesId,
      instanceId: newInstance.id,
    };
  } catch (error) {
    console.error('[DICOM] Upload error:', error);
    return null;
  }
}

/**
 * Fetch DICOM image from storage
 */
export async function fetchDicomImage(storagePath: string): Promise<DicomImage | null> {
  try {
    const { data, error } = await supabase.storage
      .from('dicom-images')
      .download(storagePath);
    
    if (error) throw error;
    
    const arrayBuffer = await data.arrayBuffer();
    const parsed = parseDicomFile(arrayBuffer);
    return createDicomImage(parsed);
  } catch (error) {
    console.error('[DICOM] Fetch error:', error);
    return null;
  }
}

/**
 * Format DICOM date (YYYYMMDD) to ISO date
 */
function formatDicomDate(dicomDate: string): string {
  if (!dicomDate || dicomDate.length !== 8) return new Date().toISOString().split('T')[0];
  return `${dicomDate.slice(0, 4)}-${dicomDate.slice(4, 6)}-${dicomDate.slice(6, 8)}`;
}

/**
 * Measurement calculations
 */
export const DicomMeasurements = {
  /**
   * Calculate distance between two points in mm
   */
  calculateDistance(
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    pixelSpacing: [number, number]
  ): number {
    const dx = (p2.x - p1.x) * pixelSpacing[1];
    const dy = (p2.y - p1.y) * pixelSpacing[0];
    return Math.sqrt(dx * dx + dy * dy);
  },
  
  /**
   * Calculate angle between three points
   */
  calculateAngle(
    p1: { x: number; y: number },
    vertex: { x: number; y: number },
    p2: { x: number; y: number }
  ): number {
    const v1 = { x: p1.x - vertex.x, y: p1.y - vertex.y };
    const v2 = { x: p2.x - vertex.x, y: p2.y - vertex.y };
    
    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    
    const cosAngle = dot / (mag1 * mag2);
    return Math.acos(Math.max(-1, Math.min(1, cosAngle))) * (180 / Math.PI);
  },
  
  /**
   * Calculate area of polygon in mm²
   */
  calculateArea(
    points: { x: number; y: number }[],
    pixelSpacing: [number, number]
  ): number {
    let area = 0;
    const n = points.length;
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    
    area = Math.abs(area) / 2;
    return area * pixelSpacing[0] * pixelSpacing[1];
  },
  
  /**
   * Calculate mean and standard deviation of pixel values in ROI
   */
  calculateROIStats(
    pixelData: Int16Array | Uint16Array | Uint8Array,
    width: number,
    points: { x: number; y: number }[],
    slope: number,
    intercept: number
  ): { mean: number; std: number; min: number; max: number; area: number } {
    // Get bounding box
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of points) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
    
    const values: number[] = [];
    
    // Check each pixel in bounding box
    for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
      for (let x = Math.floor(minX); x <= Math.ceil(maxX); x++) {
        if (pointInPolygon({ x, y }, points)) {
          const idx = y * width + x;
          if (idx >= 0 && idx < pixelData.length) {
            values.push(pixelData[idx] * slope + intercept);
          }
        }
      }
    }
    
    if (values.length === 0) {
      return { mean: 0, std: 0, min: 0, max: 0, area: 0 };
    }
    
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
    
    return {
      mean,
      std: Math.sqrt(variance),
      min: Math.min(...values),
      max: Math.max(...values),
      area: values.length,
    };
  },
};

/**
 * Point in polygon test
 */
function pointInPolygon(point: { x: number; y: number }, polygon: { x: number; y: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    
    if (((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}
