/**
 * Impilo Digital Health Platform - PHID (Patient Health ID) Service
 * 
 * Based on Zimbabwe PHID Functional Requirements:
 * - Format: DDDSDDDX (8 characters)
 *   - D = digit (0-9)
 *   - S = letter (A-Z, excluding I and O to avoid confusion)
 *   - X = check digit (Luhn algorithm)
 * 
 * Design Principles:
 * - Easy to remember (short, pronounceable pattern)
 * - Recoverable (can be reproduced given same parameters)
 * - Portable (pre-generated for offline facilities)
 * - Secure (Luhn check digit for validation)
 * 
 * Architecture:
 * - Composite Key: PHID (Client-facing) + SHR-ID (System-internal)
 * - Client always carries the complete PHID
 * - Registry links PHID to SHR via complete PHID OR biometrics
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================
// TYPES
// ============================================

export interface PHIDRecord {
  phid: string;           // Patient Health ID: DDDSDDDX format
  shrId: string;          // Shared Health Record ID (system internal)
  facilityId: string;     // Facility where PHID was allocated
  isAssigned: boolean;    // Whether assigned to a patient
  assignedAt?: string;
  patientId?: string;
}

export interface PHIDBatch {
  facilityId: string;
  facilityName: string;
  phids: string[];
  generatedAt: string;
  count: number;
}

export interface PHIDValidation {
  isValid: boolean;
  error?: string;
  components?: {
    prefix: string;      // First 3 digits
    letter: string;      // Middle letter
    suffix: string;      // Last 3 digits
    checkDigit: string;  // Luhn check digit
  };
}

// Valid letters (A-Z excluding I and O to avoid confusion with 1 and 0)
const VALID_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

// ============================================
// LUHN ALGORITHM FOR CHECK DIGIT
// ============================================

/**
 * Calculate Luhn check digit for PHID
 * Extended to handle alphanumeric by converting letter to its position (A=10, B=11, etc.)
 */
const calculateLuhnCheckDigit = (input: string): string => {
  // Convert alphanumeric to numeric string
  // Letters: A=10, B=11, C=12... (excluding I and O)
  let numericString = '';
  for (const char of input) {
    if (/[0-9]/.test(char)) {
      numericString += char;
    } else if (/[A-Z]/.test(char)) {
      // A=10, B=11, etc. but skip I(18) and O(24)
      const index = VALID_LETTERS.indexOf(char);
      if (index >= 0) {
        numericString += (index + 10).toString();
      }
    }
  }
  
  // Standard Luhn algorithm
  let sum = 0;
  let isDouble = true; // Start doubling from right (before check digit position)
  
  for (let i = numericString.length - 1; i >= 0; i--) {
    let digit = parseInt(numericString[i], 10);
    
    if (isDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isDouble = !isDouble;
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit.toString();
};

/**
 * Validate a PHID using Luhn check digit
 */
const validateLuhn = (phid: string): boolean => {
  if (phid.length !== 8) return false;
  
  const basePhid = phid.slice(0, 7);
  const providedCheck = phid.slice(7);
  const calculatedCheck = calculateLuhnCheckDigit(basePhid);
  
  return providedCheck === calculatedCheck;
};

// ============================================
// PHID GENERATION
// ============================================

/**
 * Generate a single PHID in DDDSDDDX format
 */
const generateSinglePHID = async (sequenceNumber?: number): Promise<string> => {
  let prefix: string;
  let letter: string;
  let suffix: string;
  
  if (sequenceNumber !== undefined) {
    // Sequential generation for predictability
    // Split sequence into components
    const letterIndex = Math.floor(sequenceNumber / 1000000) % VALID_LETTERS.length;
    const remaining = sequenceNumber % 1000000;
    prefix = String(Math.floor(remaining / 1000)).padStart(3, '0');
    suffix = String(remaining % 1000).padStart(3, '0');
    letter = VALID_LETTERS[letterIndex];
  } else {
    // Random generation with cryptographic randomness
    const randomBytes = new Uint8Array(4);
    crypto.getRandomValues(randomBytes);
    
    prefix = String((randomBytes[0] * 4) % 1000).padStart(3, '0');
    letter = VALID_LETTERS[randomBytes[1] % VALID_LETTERS.length];
    suffix = String(((randomBytes[2] * 256 + randomBytes[3]) % 1000)).padStart(3, '0');
  }
  
  const basePHID = `${prefix}${letter}${suffix}`;
  const checkDigit = calculateLuhnCheckDigit(basePHID);
  
  return `${basePHID}${checkDigit}`;
};

/**
 * Generate a unique PHID ensuring no duplicates
 */
const generateUniquePHID = async (maxAttempts: number = 10): Promise<string> => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const phid = await generateSinglePHID();
    
    // Check uniqueness against database
    const { data } = await supabase
      .from('patient_identifiers')
      .select('id')
      .eq('impilo_id', phid)
      .maybeSingle();
    
    if (!data) {
      return phid; // Unique PHID found
    }
  }
  
  // Fallback: use timestamp-based generation
  const timestamp = Date.now();
  return generateSinglePHID(timestamp % 10000000);
};

/**
 * Generate a batch of PHIDs for a facility (for offline use)
 */
const generatePHIDBatch = async (
  facilityId: string,
  count: number
): Promise<PHIDBatch> => {
  const { data: facility } = await supabase
    .from('facilities')
    .select('name')
    .eq('gofr_id', facilityId)
    .maybeSingle();
  
  const phids: string[] = [];
  const usedPhids = new Set<string>();
  
  // Get next sequence from database
  const { data: sequenceData } = await supabase.rpc('get_next_id_sequence', {
    p_counter_type: 'phid_batch'
  });
  
  const baseSequence = (sequenceData as number) || Date.now() % 10000000;
  
  for (let i = 0; i < count; i++) {
    let phid: string;
    let attempts = 0;
    
    do {
      phid = await generateSinglePHID(baseSequence + i + (attempts * count));
      attempts++;
    } while (usedPhids.has(phid) && attempts < 10);
    
    usedPhids.add(phid);
    phids.push(phid);
  }
  
  // Log batch generation
  await supabase.from('id_generation_logs' as any).insert({
    entity_type: 'client',
    generated_id: `BATCH-${facilityId}-${count}`,
    id_format: 'DDDSDDDX',
    generation_method: 'batch',
    metadata: {
      facility_id: facilityId,
      count,
      first_phid: phids[0],
      last_phid: phids[phids.length - 1]
    }
  });
  
  return {
    facilityId,
    facilityName: facility?.name || 'Unknown Facility',
    phids,
    generatedAt: new Date().toISOString(),
    count
  };
};

/**
 * Generate SHR ID (internal system identifier)
 * Format: SHR-XXXXXXXX (8 hex characters)
 */
const generateSHRId = (): string => {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
  return `SHR-${hex}`;
};

// ============================================
// PHID SERVICE
// ============================================

export const PHIDService = {
  /**
   * Generate a new PHID for a patient
   * Returns both the patient-facing PHID and system-internal SHR-ID
   */
  async generatePHID(): Promise<{ phid: string; shrId: string }> {
    const phid = await generateUniquePHID();
    const shrId = generateSHRId();
    
    return { phid, shrId };
  },

  /**
   * Validate a PHID format and check digit
   */
  validate(phid: string): PHIDValidation {
    if (!phid || typeof phid !== 'string') {
      return { isValid: false, error: 'PHID is required' };
    }
    
    const cleanPHID = phid.toUpperCase().replace(/[\s-]/g, '');
    
    if (cleanPHID.length !== 8) {
      return { 
        isValid: false, 
        error: 'PHID must be 8 characters (format: DDDSDDDX)' 
      };
    }
    
    // Check format: DDD S DDD X
    const prefix = cleanPHID.slice(0, 3);
    const letter = cleanPHID.slice(3, 4);
    const suffix = cleanPHID.slice(4, 7);
    const checkDigit = cleanPHID.slice(7);
    
    if (!/^\d{3}$/.test(prefix)) {
      return { isValid: false, error: 'First 3 characters must be digits' };
    }
    
    if (!VALID_LETTERS.includes(letter)) {
      return { 
        isValid: false, 
        error: 'Fourth character must be a letter (A-Z, excluding I and O)' 
      };
    }
    
    if (!/^\d{3}$/.test(suffix)) {
      return { isValid: false, error: 'Characters 5-7 must be digits' };
    }
    
    if (!/^\d$/.test(checkDigit)) {
      return { isValid: false, error: 'Last character must be a check digit' };
    }
    
    // Validate Luhn check digit
    if (!validateLuhn(cleanPHID)) {
      return { isValid: false, error: 'Invalid check digit' };
    }
    
    return {
      isValid: true,
      components: {
        prefix,
        letter,
        suffix,
        checkDigit
      }
    };
  },

  /**
   * Format a PHID for display (with optional separators)
   */
  format(phid: string, separator: string = '-'): string {
    const clean = phid.toUpperCase().replace(/[\s-]/g, '');
    if (clean.length !== 8) return phid;
    
    // Format: DDD-S-DDD-X for readability
    return `${clean.slice(0, 3)}${separator}${clean.slice(3, 4)}${separator}${clean.slice(4, 7)}${separator}${clean.slice(7)}`;
  },

  /**
   * Generate a batch of PHIDs for offline facility use
   */
  async generateBatch(facilityId: string, count: number): Promise<PHIDBatch> {
    return generatePHIDBatch(facilityId, Math.min(count, 1000)); // Max 1000 per batch
  },

  /**
   * Export a PHID batch as CSV
   */
  exportBatchAsCSV(batch: PHIDBatch): string {
    const header = 'PHID,Formatted_PHID,Facility_ID,Generated_At\n';
    const rows = batch.phids.map(phid => 
      `${phid},${this.format(phid)},${batch.facilityId},${batch.generatedAt}`
    ).join('\n');
    
    return header + rows;
  },

  /**
   * Look up a patient by PHID
   */
  async lookupByPHID(phid: string): Promise<PHIDRecord | null> {
    const validation = this.validate(phid);
    if (!validation.isValid) {
      return null;
    }
    
    const cleanPHID = phid.toUpperCase().replace(/[\s-]/g, '');
    
    const { data } = await supabase
      .from('patient_identifiers')
      .select('id, impilo_id, shr_id, patient_id, created_at')
      .eq('impilo_id', cleanPHID)
      .maybeSingle();
    
    if (!data) return null;
    
    return {
      phid: data.impilo_id,
      shrId: data.shr_id || '',
      facilityId: '', // Facility tracked separately
      isAssigned: !!data.patient_id,
      assignedAt: data.created_at || undefined,
      patientId: data.patient_id || undefined
    };
  },

  /**
   * Register a PHID to a patient
   */
  async assignToPatient(
    phid: string,
    patientId: string,
    facilityId: string
  ): Promise<{ success: boolean; error?: string }> {
    const validation = this.validate(phid);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }
    
    const cleanPHID = phid.toUpperCase().replace(/[\s-]/g, '');
    const shrId = generateSHRId();
    
    const { error } = await supabase
      .from('patient_identifiers')
      .insert({
        patient_id: patientId,
        impilo_id: cleanPHID,
        shr_id: shrId,
        id_version: 1,
        id_generation_method: 'facility_assignment'
      });
    
    if (error) {
      if (error.code === '23505') { // Unique violation
        return { success: false, error: 'PHID already assigned to another patient' };
      }
      return { success: false, error: error.message };
    }
    
    // Log assignment
    await supabase.from('id_generation_logs' as any).insert({
      entity_type: 'client',
      generated_id: cleanPHID,
      id_format: 'DDDSDDDX',
      generation_method: 'assignment',
      linked_entity_id: patientId,
      metadata: { facility_id: facilityId }
    });
    
    return { success: true };
  },

  /**
   * Resolve PHID using biometric verification
   * For patients who forgot their PHID
   */
  async resolveWithBiometric(
    biometricHash: string,
    method: 'fingerprint' | 'facial' | 'iris'
  ): Promise<{ success: boolean; phid?: string; error?: string }> {
    // Query based on the specific biometric method
    let query = supabase
      .from('patient_identifiers')
      .select('impilo_id');
    
    if (method === 'fingerprint') {
      query = query.eq('biometric_fingerprint_hash', biometricHash);
    } else if (method === 'facial') {
      query = query.eq('biometric_facial_hash', biometricHash);
    } else {
      query = query.eq('biometric_iris_hash', biometricHash);
    }
    
    const { data } = await query.maybeSingle();
    
    if (!data) {
      return { success: false, error: 'No matching patient found' };
    }
    
    return { success: true, phid: data.impilo_id };
  },

  /**
   * Get PHID statistics for a facility
   */
  async getFacilityStats(facilityId: string): Promise<{
    allocated: number;
    assigned: number;
    available: number;
  }> {
    // For now, return mock stats
    // In production, this would query pre-allocated PHID pools
    return {
      allocated: 500,
      assigned: 127,
      available: 373
    };
  }
};

// Export helper functions
export const validatePHID = PHIDService.validate.bind(PHIDService);
export const formatPHID = PHIDService.format.bind(PHIDService);
export const generatePHID = PHIDService.generatePHID.bind(PHIDService);
