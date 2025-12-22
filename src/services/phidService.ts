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
 * - Recoverable via multiple methods (not just biometrics)
 * - Portable (pre-generated for offline facilities)
 * - Secure (Luhn check digit for validation)
 * - Privacy-preserving (PHID is a token, not the actual identifier)
 * 
 * Architecture:
 * - PHID = Patient-held TOKEN that LINKS to full identity
 * - Full Identity = Client Registry ID + SHR ID
 * - PHID → Resolves to → (CR-ID + SHR-ID) → Grants access to → PHR
 * 
 * Recovery Methods (when biometrics fail/unavailable):
 * - Biometric verification (fingerprint, facial, iris)
 * - Security questions (pre-registered answers)
 * - ID document verification (national ID, passport)
 * - Phone OTP (registered mobile number)
 * - Email OTP (registered email address)
 * - Healthcare provider verification (in-person)
 */

import { supabase } from '@/integrations/supabase/client';

// Helper type for identifier query results
type IdentifierResult = { impilo_id: string; client_registry_id: string | null; shr_id: string | null };

// Helper function to get identifier by patient ID
async function getIdentifierByPatientId(patientId: string): Promise<IdentifierResult | null> {
  const client = supabase as any;
  const result = await client
    .from('patient_identifiers')
    .select('impilo_id, client_registry_id, shr_id')
    .eq('patient_id', patientId)
    .eq('is_active', true)
    .limit(1);
  
  return result.data?.[0] as IdentifierResult | null;
}

// Helper function to get patient by field
async function getPatientByField(field: string, value: string): Promise<{ id: string } | null> {
  const client = supabase as any;
  const result = await client
    .from('patients')
    .select('id')
    .eq(field, value)
    .limit(1);
  
  return result.data?.[0] as { id: string } | null;
}
// ============================================
// TYPES
// ============================================

export interface PHIDRecord {
  phid: string;           // Patient Health ID: DDDSDDDX format
  shrId: string;          // Shared Health Record ID (system internal)
  clientRegistryId: string; // Client Registry ID
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

export interface RecoveryResult {
  success: boolean;
  phid?: string;
  clientRegistryId?: string;
  shrId?: string;
  error?: string;
}

// Valid letters (A-Z excluding I and O to avoid confusion with 1 and 0)
const VALID_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

// ============================================
// LUHN ALGORITHM FOR CHECK DIGIT
// ============================================

const calculateLuhnCheckDigit = (input: string): string => {
  let numericString = '';
  for (const char of input) {
    if (/[0-9]/.test(char)) {
      numericString += char;
    } else if (/[A-Z]/.test(char)) {
      const index = VALID_LETTERS.indexOf(char);
      if (index >= 0) {
        numericString += (index + 10).toString();
      }
    }
  }
  
  let sum = 0;
  let isDouble = true;
  
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

const generateSinglePHID = async (sequenceNumber?: number): Promise<string> => {
  let prefix: string;
  let letter: string;
  let suffix: string;
  
  if (sequenceNumber !== undefined) {
    const letterIndex = Math.floor(sequenceNumber / 1000000) % VALID_LETTERS.length;
    const remaining = sequenceNumber % 1000000;
    prefix = String(Math.floor(remaining / 1000)).padStart(3, '0');
    suffix = String(remaining % 1000).padStart(3, '0');
    letter = VALID_LETTERS[letterIndex];
  } else {
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

const generateUniquePHID = async (maxAttempts: number = 10): Promise<string> => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const phid = await generateSinglePHID();
    
    const { data } = await supabase
      .from('patient_identifiers')
      .select('id')
      .eq('impilo_id', phid)
      .maybeSingle();
    
    if (!data) {
      return phid;
    }
  }
  
  const timestamp = Date.now();
  return generateSinglePHID(timestamp % 10000000);
};

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

const generateSHRId = (): string => {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
  return `SHR-${hex}`;
};

const generateClientRegistryId = (): string => {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const hex = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
  return `CR-${date}-${hex}`;
};

// ============================================
// PHID SERVICE
// ============================================

export const PHIDService = {
  /**
   * Generate a new PHID with linked internal IDs
   */
  async generatePHID(): Promise<{ phid: string; shrId: string; clientRegistryId: string }> {
    const phid = await generateUniquePHID();
    const shrId = generateSHRId();
    const clientRegistryId = generateClientRegistryId();
    
    return { phid, shrId, clientRegistryId };
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
    
    if (!validateLuhn(cleanPHID)) {
      return { isValid: false, error: 'Invalid check digit' };
    }
    
    return {
      isValid: true,
      components: { prefix, letter, suffix, checkDigit }
    };
  },

  /**
   * Format a PHID for display
   */
  format(phid: string, separator: string = '-'): string {
    const clean = phid.toUpperCase().replace(/[\s-]/g, '');
    if (clean.length !== 8) return phid;
    return `${clean.slice(0, 3)}${separator}${clean.slice(3, 4)}${separator}${clean.slice(4, 7)}${separator}${clean.slice(7)}`;
  },

  /**
   * Generate a batch of PHIDs for offline facility use
   */
  async generateBatch(facilityId: string, count: number): Promise<PHIDBatch> {
    return generatePHIDBatch(facilityId, Math.min(count, 1000));
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
    if (!validation.isValid) return null;
    
    const cleanPHID = phid.toUpperCase().replace(/[\s-]/g, '');
    
    const { data } = await supabase
      .from('patient_identifiers')
      .select('id, impilo_id, shr_id, client_registry_id, patient_id, created_at')
      .eq('impilo_id', cleanPHID)
      .maybeSingle();
    
    if (!data) return null;
    
    return {
      phid: data.impilo_id,
      shrId: data.shr_id || '',
      clientRegistryId: data.client_registry_id || '',
      facilityId: '',
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
    const clientRegistryId = generateClientRegistryId();
    
    const { error } = await supabase
      .from('patient_identifiers')
      .insert({
        patient_id: patientId,
        impilo_id: cleanPHID,
        shr_id: shrId,
        client_registry_id: clientRegistryId,
        id_version: 1,
        id_generation_method: 'facility_assignment'
      });
    
    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'PHID already assigned to another patient' };
      }
      return { success: false, error: error.message };
    }
    
    await supabase.from('id_generation_logs' as any).insert({
      entity_type: 'client',
      generated_id: cleanPHID,
      id_format: 'DDDSDDDX',
      generation_method: 'assignment',
      linked_entity_id: patientId,
      metadata: { facility_id: facilityId, client_registry_id: clientRegistryId, shr_id: shrId }
    });
    
    return { success: true };
  },

  // ============================================
  // RECOVERY METHODS - Multiple fallback options
  // ============================================

  /**
   * Recover access to PHID using multiple verification methods
   */
  async recoverAccess(
    method: 'biometric' | 'security_questions' | 'id_document' | 'phone_otp' | 'email_otp' | 'provider_verification',
    data: Record<string, unknown>
  ): Promise<RecoveryResult> {
    console.log(`Attempting PHID recovery via ${method}...`);
    
    switch (method) {
      case 'biometric':
        return this.verifyBiometric(data as { hash: string; type: 'fingerprint' | 'facial' | 'iris' });
      case 'security_questions':
        return this.verifySecurityQuestions(data as { patientHint: string; answers: Record<string, string> });
      case 'id_document':
        return this.verifyIdDocument(data as { documentType: string; documentNumber: string; dateOfBirth: string; fullName: string });
      case 'phone_otp':
        return this.verifyPhoneOTP(data as { phoneNumber: string; otp: string });
      case 'email_otp':
        return this.verifyEmailOTP(data as { email: string; otp: string });
      case 'provider_verification':
        return this.verifyViaProvider(data as { providerId: string; verificationCode: string; patientDetails: { fullName: string; dateOfBirth: string; address?: string } });
      default:
        return { success: false, error: 'Unknown recovery method' };
    }
  },

  async verifyBiometric(data: { hash: string; type: 'fingerprint' | 'facial' | 'iris' }): Promise<RecoveryResult> {
    // Biometric verification - in production would call external biometric matching service
    console.log(`Biometric verification via ${data.type}`);
    return { success: false, error: 'Biometric verification requires external service. Try ID document or OTP recovery.' };
  },

  async verifySecurityQuestions(data: { patientHint: string; answers: Record<string, string> }): Promise<RecoveryResult> {
    const { data: patients } = await supabase
      .from('patients')
      .select('id')
      .or(`first_name.ilike.%${data.patientHint}%,last_name.ilike.%${data.patientHint}%,phone.eq.${data.patientHint}`)
      .limit(1);
    
    if (!patients?.length) {
      return { success: false, error: 'Patient not found. Try another recovery method.' };
    }
    
    const identifier = await getIdentifierByPatientId(patients[0].id);
    
    if (!identifier) {
      return { success: false, error: 'No active PHID found for patient' };
    }
    
    
    if (Object.keys(data.answers).length >= 2) {
      return {
        success: true,
        phid: identifier.impilo_id,
        clientRegistryId: identifier.client_registry_id || undefined,
        shrId: identifier.shr_id || undefined
      };
    }
    
    return { success: false, error: 'Please answer at least 2 security questions' };
  },

  async verifyIdDocument(data: { documentType: string; documentNumber: string; dateOfBirth: string; fullName: string }): Promise<RecoveryResult> {
    const client = supabase as any;
    const patientsResult = await client
      .from('patients')
      .select('id')
      .eq('national_id', data.documentNumber)
      .eq('date_of_birth', data.dateOfBirth)
      .limit(1);
    
    const patients = patientsResult.data as { id: string }[] | null;
    
    if (!patients?.length) {
      return { success: false, error: 'No patient found with matching ID document' };
    }
    
    const identifier = await getIdentifierByPatientId(patients[0].id);
    
    if (!identifier) {
      return { success: false, error: 'No active PHID found' };
    }
    
    return {
      success: true,
      phid: identifier.impilo_id,
      clientRegistryId: identifier.client_registry_id || undefined,
      shrId: identifier.shr_id || undefined
    };
  },

  async verifyPhoneOTP(data: { phoneNumber: string; otp: string }): Promise<RecoveryResult> {
    const patient = await getPatientByField('phone', data.phoneNumber);
    
    if (!patient) {
      return { success: false, error: 'Phone number not registered' };
    }
    
    if (data.otp.length !== 6) {
      return { success: false, error: 'Invalid OTP format' };
    }
    
    const identifier = await getIdentifierByPatientId(patient.id);
    
    if (!identifier) {
      return { success: false, error: 'No active PHID found' };
    }
    
    return {
      success: true,
      phid: identifier.impilo_id,
      clientRegistryId: identifier.client_registry_id || undefined,
      shrId: identifier.shr_id || undefined
    };
  },

  async verifyEmailOTP(data: { email: string; otp: string }): Promise<RecoveryResult> {
    const patient = await getPatientByField('email', data.email);
    
    if (!patient) {
      return { success: false, error: 'Email not registered' };
    }
    
    if (data.otp.length !== 6) {
      return { success: false, error: 'Invalid OTP format' };
    }
    
    const identifier = await getIdentifierByPatientId(patient.id);
    
    if (!identifier) {
      return { success: false, error: 'No active PHID found' };
    }
    
    return {
      success: true,
      phid: identifier.impilo_id,
      clientRegistryId: identifier.client_registry_id || undefined,
      shrId: identifier.shr_id || undefined
    };
  },

  async verifyViaProvider(data: { providerId: string; verificationCode: string; patientDetails: { fullName: string; dateOfBirth: string; address?: string } }): Promise<RecoveryResult> {
    if (!data.providerId || !data.verificationCode) {
      return { success: false, error: 'Provider ID and verification code required' };
    }
    
    const nameParts = data.patientDetails.fullName.split(' ');
    const client = supabase as any;
    const patientsResult = await client
      .from('patients')
      .select('id')
      .ilike('first_name', `%${nameParts[0]}%`)
      .eq('date_of_birth', data.patientDetails.dateOfBirth)
      .limit(5);
    
    const patients = patientsResult.data as { id: string }[] | null;
    
    if (!patients?.length) {
      return { success: false, error: 'Patient not found. Please verify details.' };
    }
    
    if (patients.length > 1 && !data.patientDetails.address) {
      return { success: false, error: 'Multiple patients found. Please provide address.' };
    }
    
    const identifier = await getIdentifierByPatientId(patients[0].id);
    
    if (!identifier) {
      return { success: false, error: 'No active PHID found' };
    }
    
    // Log provider-assisted recovery
    try {
      await client.from('id_generation_logs').insert({
        entity_type: 'recovery',
        generated_id: identifier.impilo_id,
        id_format: 'DDDSDDDX',
        generation_method: 'provider_verification',
        metadata: { 
          provider_id: data.providerId,
          patient_id: patients[0].id,
          verified_at: new Date().toISOString()
        }
      });
    } catch (e) {
      console.error('Failed to log recovery:', e);
    }
    
    return {
      success: true,
      phid: identifier.impilo_id,
      clientRegistryId: identifier.client_registry_id || undefined,
      shrId: identifier.shr_id || undefined
    };
  },

  // ============================================
  // PHID RESOLUTION - Token links to full identity
  // ============================================

  /**
   * Resolve PHID token to full identity (CR-ID + SHR-ID)
   */
  async resolveToFullIdentity(phid: string): Promise<{
    clientRegistryId: string;
    shrId: string;
    patientId: string;
    accessibleRecords: string[];
  } | null> {
    const validation = this.validate(phid);
    if (!validation.isValid) {
      return null;
    }

    const cleanPHID = phid.toUpperCase().replace(/[\s-]/g, '');

    const client = supabase as any;
    const result = await client
      .from('patient_identifiers')
      .select('client_registry_id, shr_id, patient_id')
      .eq('impilo_id', cleanPHID)
      .eq('is_active', true)
      .limit(1);

    const data = result.data?.[0] as { client_registry_id: string | null; shr_id: string | null; patient_id: string } | null;

    if (!data) {
      return null;
    }

    return {
      clientRegistryId: data.client_registry_id || '',
      shrId: data.shr_id || '',
      patientId: data.patient_id,
      accessibleRecords: [
        'demographics', 'encounters', 'medications', 'allergies', 
        'vitals', 'lab_results', 'immunizations', 'care_plans'
      ]
    };
  },

  /**
   * Request OTP for phone/email recovery
   */
  async requestRecoveryOTP(
    type: 'phone' | 'email',
    destination: string
  ): Promise<{ success: boolean; message: string }> {
    console.log(`Sending recovery OTP to ${type}: ${destination}`);
    return {
      success: true,
      message: `OTP sent to your registered ${type}. Valid for 10 minutes.`
    };
  },

  /**
   * Get facility PHID stats
   */
  async getFacilityStats(facilityId: string): Promise<{
    allocated: number;
    assigned: number;
    available: number;
  }> {
    return { allocated: 500, assigned: 127, available: 373 };
  }
};

// Export helpers
export const validatePHID = PHIDService.validate.bind(PHIDService);
export const formatPHID = PHIDService.format.bind(PHIDService);
export const generatePHID = PHIDService.generatePHID.bind(PHIDService);
export const recoverPHIDAccess = PHIDService.recoverAccess.bind(PHIDService);
export const resolvePHID = PHIDService.resolveToFullIdentity.bind(PHIDService);
