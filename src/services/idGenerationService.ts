/**
 * Impilo Digital Health Platform - ID Generation Service
 * 
 * Centralized ID Generation for all registry entities:
 * - Client Registry ID (CR-ID): Identifies patient in Client Registry
 * - SHR ID: Links to Shared Health Record
 * - Composite Impilo ID: CR-ID + SHR-ID (client always has complete key)
 * - Provider Registry ID (Varapi): Healthcare worker identity
 * - Facility Registry ID (Thuso): Health facility identity
 * 
 * Security: Client Registry requires complete Impilo ID OR biometrics to link to SHR
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================
// TYPES
// ============================================

export interface CompositeImpiloId {
  impiloId: string;           // Full composite ID (CR-ID|SHR-ID)
  memorableId: string;        // Easy to remember PHID format: DDDSDDDX
  clientRegistryId: string;   // Client Registry component
  shrId: string;              // Shared Health Record component
  version: number;
  generatedAt: string;
}

export interface GeneratedId {
  id: string;
  entityType: 'client' | 'provider' | 'facility' | 'shr_record';
  format: string;
  generatedAt: string;
}

export interface IdValidationResult {
  isValid: boolean;
  entityType?: string;
  components?: {
    prefix?: string;
    date?: string;
    sequence?: string;
    random?: string;
    province?: string;
  };
  error?: string;
}

// ============================================
// ID FORMAT SPECIFICATIONS
// ============================================

export const ID_FORMATS = {
  CLIENT_REGISTRY: {
    prefix: 'CR',
    pattern: /^CR-\d{8}-\d{6}-[A-Z0-9]{4}$/,
    description: 'CR-YYYYMMDD-NNNNNN-XXXX',
    example: 'CR-20241222-000001-A1B2'
  },
  SHR: {
    prefix: 'SHR',
    pattern: /^SHR-\d{8}-[A-Z0-9]{6}$/,
    description: 'SHR-NNNNNNNN-XXXXXX',
    example: 'SHR-00000001-ABC123'
  },
  IMPILO_COMPOSITE: {
    prefix: 'CR',
    pattern: /^CR-\d{8}-\d{6}-[A-Z0-9]{4}\|SHR-\d{8}-[A-Z0-9]{6}$/,
    description: 'CR-YYYYMMDD-NNNNNN-XXXX|SHR-NNNNNNNN-XXXXXX',
    example: 'CR-20241222-000001-A1B2|SHR-00000001-ABC123'
  },
  PROVIDER_REGISTRY: {
    prefix: 'VARAPI',
    pattern: /^VARAPI-\d{4}-[A-Z]{2}\d{6}-[A-Z0-9]{4}$/,
    description: 'VARAPI-YYYY-PPNNNNNN-XXXX',
    example: 'VARAPI-2024-ZW000001-X1Y2'
  },
  FACILITY_REGISTRY: {
    prefix: 'THUSO',
    pattern: /^THUSO-[A-Z]{2}-\d{6}-[A-Z0-9]{3}$/,
    description: 'THUSO-PP-NNNNNN-XXX',
    example: 'THUSO-ZW-000001-A1B'
  },
  // Legacy format for backward compatibility
  IMPILO_LEGACY: {
    prefix: 'IMP',
    pattern: /^IMP-\d{4}-\d{4}-\d{4}$/,
    description: 'IMP-XXXX-XXXX-XXXX',
    example: 'IMP-1234-5678-9012'
  }
} as const;

// ============================================
// LOCAL ID GENERATION (Cryptographic)
// ============================================

/**
 * Generate cryptographically secure random string
 */
const generateSecureRandom = (length: number, charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'): string => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map(byte => charset[byte % charset.length])
    .join('');
};

/**
 * Calculate Luhn check digit for a numeric string
 * Used for PHID validation (DDDSDDDX format)
 */
const calculateLuhnCheckDigit = (digits: string): number => {
  let sum = 0;
  let isSecond = true; // Start from right, we're adding a check digit
  
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10);
    if (isSecond) {
      d = d * 2;
      if (d > 9) d = d - 9;
    }
    sum += d;
    isSecond = !isSecond;
  }
  
  return (10 - (sum % 10)) % 10;
};

/**
 * Generate memorable PHID in format DDDSDDDX
 * D = digit 0-9
 * S = letter A-Z (excluding I, O to avoid confusion)
 * X = Luhn check digit
 * 
 * Per PHID Functional Requirements document:
 * - Easy to memorize format
 * - Check digit for validation
 * - Unique per patient
 */
const generateMemorablePHID = (): string => {
  // Letters excluding I and O (to avoid confusion with 1 and 0)
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  
  // Generate first 3 digits
  const firstDigits = String(Math.floor(Math.random() * 900) + 100); // 100-999
  
  // Generate middle letter
  const letterArray = new Uint8Array(1);
  crypto.getRandomValues(letterArray);
  const letter = letters[letterArray[0] % letters.length];
  
  // Generate last 3 digits
  const lastDigits = String(Math.floor(Math.random() * 900) + 100); // 100-999
  
  // Calculate Luhn check digit on all digits
  const allDigits = firstDigits + lastDigits;
  const checkDigit = calculateLuhnCheckDigit(allDigits);
  
  return `${firstDigits}${letter}${lastDigits}${checkDigit}`;
};

/**
 * Generate local Client Registry ID (fallback when DB unavailable)
 */
const generateLocalClientRegistryId = (): string => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = generateSecureRandom(4);
  const sequence = timestamp.slice(-6).padStart(6, '0');
  return `CR-${dateStr}-${sequence}-${random}`;
};

/**
 * Generate local SHR ID (fallback when DB unavailable)
 */
const generateLocalShrId = (): string => {
  const timestamp = Date.now().toString().slice(-8).padStart(8, '0');
  const random = generateSecureRandom(6);
  return `SHR-${timestamp}-${random}`;
};

/**
 * Generate local Provider Registry ID (fallback when DB unavailable)
 */
const generateLocalProviderRegistryId = (provinceCode: string = 'ZW'): string => {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString(36).toUpperCase().slice(-6).padStart(6, '0');
  const random = generateSecureRandom(4);
  return `VARAPI-${year}-${provinceCode.toUpperCase()}${timestamp}-${random}`;
};

/**
 * Generate local Facility Registry ID (fallback when DB unavailable)
 */
const generateLocalFacilityRegistryId = (provinceCode: string = 'ZW'): string => {
  const timestamp = Date.now().toString(36).toUpperCase().slice(-6).padStart(6, '0');
  const random = generateSecureRandom(3);
  return `THUSO-${provinceCode.toUpperCase()}-${timestamp}-${random}`;
};

// ============================================
// ID GENERATION SERVICE
// ============================================

export const IdGenerationService = {
  /**
   * Generate a complete Composite Impilo ID (Client Registry ID + SHR ID)
   * This is the primary ID that clients will receive and carry with them
   */
  async generateImpiloId(): Promise<CompositeImpiloId> {
    // Generate memorable PHID (DDDSDDDX format) - easy for patients to remember
    const memorableId = generateMemorablePHID();
    
    try {
      // Try database function first for guaranteed uniqueness
      const { data, error } = await supabase.rpc('generate_impilo_id');
      
      if (!error && data && data.length > 0) {
        const result = data[0];
        return {
          impiloId: result.impilo_id,
          memorableId, // Easy to memorize ID for the patient
          clientRegistryId: result.client_registry_id,
          shrId: result.shr_id,
          version: 1,
          generatedAt: new Date().toISOString()
        };
      }
    } catch (e) {
      console.warn('Database ID generation failed, using local generation:', e);
    }
    
    // Fallback to local cryptographic generation
    const clientRegistryId = generateLocalClientRegistryId();
    const shrId = generateLocalShrId();
    
    return {
      impiloId: `${clientRegistryId}|${shrId}`,
      memorableId, // Easy to memorize ID for the patient
      clientRegistryId,
      shrId,
      version: 1,
      generatedAt: new Date().toISOString()
    };
  },

  /**
   * Generate Client Registry ID only (for linking existing SHR)
   */
  async generateClientRegistryId(): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('generate_client_registry_id');
      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.warn('Database ID generation failed, using local generation:', e);
    }
    
    return generateLocalClientRegistryId();
  },

  /**
   * Generate SHR ID only (for new health records)
   */
  async generateShrId(): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('generate_shr_id');
      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.warn('Database ID generation failed, using local generation:', e);
    }
    
    return generateLocalShrId();
  },

  /**
   * Generate Provider Registry ID (Varapi ID)
   */
  async generateProviderRegistryId(provinceCode: string = 'ZW'): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('generate_provider_registry_id', {
        p_province_code: provinceCode
      });
      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.warn('Database ID generation failed, using local generation:', e);
    }
    
    return generateLocalProviderRegistryId(provinceCode);
  },

  /**
   * Generate Facility Registry ID (Thuso ID)
   */
  async generateFacilityRegistryId(provinceCode: string = 'ZW'): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('generate_facility_registry_id', {
        p_province_code: provinceCode
      });
      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.warn('Database ID generation failed, using local generation:', e);
    }
    
    return generateLocalFacilityRegistryId(provinceCode);
  },

  /**
   * Parse a composite Impilo ID into its components
   */
  parseImpiloId(impiloId: string): { clientRegistryId: string; shrId: string } | null {
    if (!impiloId || !impiloId.includes('|')) {
      // Check if it's a legacy format
      if (ID_FORMATS.IMPILO_LEGACY.pattern.test(impiloId)) {
        return {
          clientRegistryId: impiloId,
          shrId: '' // Legacy IDs don't have SHR component
        };
      }
      return null;
    }
    
    const [clientRegistryId, shrId] = impiloId.split('|');
    return { clientRegistryId, shrId };
  },

  /**
   * Validate an ID against its expected format
   */
  validateId(id: string, entityType: 'client' | 'provider' | 'facility' | 'shr' | 'impilo'): IdValidationResult {
    if (!id || typeof id !== 'string') {
      return { isValid: false, error: 'Invalid ID: empty or not a string' };
    }

    let format: typeof ID_FORMATS[keyof typeof ID_FORMATS];
    
    switch (entityType) {
      case 'client':
        format = ID_FORMATS.CLIENT_REGISTRY;
        break;
      case 'shr':
        format = ID_FORMATS.SHR;
        break;
      case 'impilo':
        format = ID_FORMATS.IMPILO_COMPOSITE;
        // Also accept legacy format
        if (ID_FORMATS.IMPILO_LEGACY.pattern.test(id)) {
          return {
            isValid: true,
            entityType: 'impilo_legacy',
            components: { prefix: 'IMP' }
          };
        }
        break;
      case 'provider':
        format = ID_FORMATS.PROVIDER_REGISTRY;
        break;
      case 'facility':
        format = ID_FORMATS.FACILITY_REGISTRY;
        break;
      default:
        return { isValid: false, error: `Unknown entity type: ${entityType}` };
    }

    if (!format.pattern.test(id)) {
      return {
        isValid: false,
        error: `Invalid ${entityType} ID format. Expected: ${format.description}`
      };
    }

    // Parse components for additional info
    const parts = id.split('-');
    return {
      isValid: true,
      entityType,
      components: {
        prefix: parts[0],
        date: parts[1],
        sequence: parts[2],
        random: parts[3]
      }
    };
  },

  /**
   * Log ID generation for audit purposes
   */
  async logIdGeneration(
    entityType: 'client' | 'provider' | 'facility' | 'shr_record',
    generatedId: string,
    linkedEntityId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      await supabase.from('id_generation_logs' as any).insert({
        entity_type: entityType,
        generated_id: generatedId,
        id_format: entityType === 'client' ? 'composite' : 'standard',
        generation_method: 'cryptographic',
        entropy_source: 'Web Crypto API',
        linked_entity_id: linkedEntityId,
        metadata
      });
    } catch (e) {
      console.error('Failed to log ID generation:', e);
    }
  },

  /**
   * Check if an ID already exists in the system
   */
  async checkIdExists(
    id: string,
    entityType: 'client' | 'provider' | 'facility'
  ): Promise<boolean> {
    try {
      let query;
      
      switch (entityType) {
        case 'client':
          // Check both impilo_id and client_registry_id columns
          query = supabase
            .from('patient_identifiers')
            .select('id')
            .or(`impilo_id.eq.${id},client_registry_id.eq.${id}`)
            .limit(1);
          break;
        case 'provider':
          query = supabase
            .from('profiles')
            .select('id')
            .eq('provider_registry_id', id)
            .limit(1);
          break;
        case 'facility':
          query = supabase
            .from('facilities')
            .select('id')
            .eq('gofr_id', id)
            .limit(1);
          break;
        default:
          return false;
      }
      
      const { data } = await query;
      return (data?.length ?? 0) > 0;
    } catch (e) {
      console.error('Failed to check ID existence:', e);
      return false;
    }
  },

  /**
   * Link Client Registry ID to SHR ID using biometric verification
   * This is called when a client presents biometrics but only has partial ID
   */
  async linkClientToShr(
    clientRegistryId: string,
    biometricHash: string,
    biometricMethod: 'fingerprint' | 'facial' | 'iris'
  ): Promise<{ success: boolean; shrId?: string; error?: string }> {
    try {
      // First verify biometrics match the client registry ID
      const hashColumn = `biometric_${biometricMethod}_hash`;
      const { data } = await supabase
        .from('patient_identifiers')
        .select('shr_id, biometric_fingerprint_hash, biometric_facial_hash, biometric_iris_hash')
        .eq('client_registry_id', clientRegistryId)
        .maybeSingle();
      
      if (!data) {
        return { success: false, error: 'Client Registry ID not found' };
      }
      
      // Get the stored hash based on method
      let storedHash: string | null = null;
      if (biometricMethod === 'fingerprint') {
        storedHash = data.biometric_fingerprint_hash;
      } else if (biometricMethod === 'facial') {
        storedHash = data.biometric_facial_hash;
      } else if (biometricMethod === 'iris') {
        storedHash = data.biometric_iris_hash;
      }
      
      // Verify biometric (in production, this would use proper matching)
      if (storedHash && storedHash !== biometricHash) {
        return { success: false, error: 'Biometric verification failed' };
      }
      
      return { success: true, shrId: (data as any).shr_id };
    } catch (e) {
      console.error('Failed to link client to SHR:', e);
      return { success: false, error: 'System error during linking' };
    }
  },

  /**
   * Resolve full Impilo ID from partial information
   * Requires either complete ID or biometrics + partial ID
   */
  async resolveImpiloId(
    partialId: string,
    biometricHash?: string,
    biometricMethod?: 'fingerprint' | 'facial' | 'iris'
  ): Promise<{ success: boolean; impiloId?: string; components?: CompositeImpiloId; error?: string }> {
    // Check if it's already a complete ID
    const parsed = this.parseImpiloId(partialId);
    if (parsed && parsed.shrId) {
      return {
        success: true,
        impiloId: partialId,
        components: {
          impiloId: partialId,
          memorableId: '', // Not available for resolved IDs
          clientRegistryId: parsed.clientRegistryId,
          shrId: parsed.shrId,
          version: 1,
          generatedAt: new Date().toISOString()
        }
      };
    }
    
    // If partial ID only, require biometrics to resolve
    if (!biometricHash || !biometricMethod) {
      return {
        success: false,
        error: 'Complete Impilo ID or biometric verification required to resolve SHR link'
      };
    }
    
    // Use biometrics to link and resolve
    const linkResult = await this.linkClientToShr(partialId, biometricHash, biometricMethod);
    if (!linkResult.success || !linkResult.shrId) {
      return { success: false, error: linkResult.error };
    }
    
    const fullImpiloId = `${partialId}|${linkResult.shrId}`;
    return {
      success: true,
      impiloId: fullImpiloId,
      components: {
        impiloId: fullImpiloId,
        memorableId: '', // Not available for resolved IDs
        clientRegistryId: partialId,
        shrId: linkResult.shrId,
        version: 1,
        generatedAt: new Date().toISOString()
      }
    };
  }
};

// Export individual functions for convenience
export const generateImpiloId = IdGenerationService.generateImpiloId.bind(IdGenerationService);
export const generateClientRegistryId = IdGenerationService.generateClientRegistryId.bind(IdGenerationService);
export const generateShrId = IdGenerationService.generateShrId.bind(IdGenerationService);
export const generateProviderRegistryId = IdGenerationService.generateProviderRegistryId.bind(IdGenerationService);
export const generateFacilityRegistryId = IdGenerationService.generateFacilityRegistryId.bind(IdGenerationService);
export const validateId = IdGenerationService.validateId.bind(IdGenerationService);
export const parseImpiloId = IdGenerationService.parseImpiloId.bind(IdGenerationService);
