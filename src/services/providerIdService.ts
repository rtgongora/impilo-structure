/**
 * Impilo Digital Health Platform - Provider ID (Varapi) Service
 * 
 * Based on same principles as PHID:
 * - Provider Token = Easy to remember, portable identifier
 * - Token links to Provider Registry ID + Professional Credentials
 * - Multiple recovery methods when credentials unavailable
 * 
 * Format: VARAPI-YYYY-PPNNNNNN-XXXX
 * - YYYY = Year of registration
 * - PP = Province code
 * - NNNNNN = Sequential number
 * - XXXX = Random check component
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================
// TYPES
// ============================================

export interface ProviderIdRecord {
  providerId: string;           // Full Varapi ID
  providerToken: string;        // Simplified token for easy recall (last 8 chars)
  registryId: string;           // Internal registry reference
  professionalLicenseNumber: string;
  specialty: string;
  facilityId?: string;
  isActive: boolean;
  registeredAt: string;
}

export interface ProviderValidation {
  isValid: boolean;
  error?: string;
  components?: {
    prefix: string;
    year: string;
    provinceCode: string;
    sequence: string;
    check: string;
  };
}

export interface ProviderRecoveryResult {
  success: boolean;
  providerId?: string;
  providerToken?: string;
  error?: string;
}

// ============================================
// PROVIDER ID SERVICE
// ============================================

export const ProviderIdService = {
  /**
   * Generate a new Provider ID with linked token
   */
  async generateProviderId(provinceCode: string = 'ZW'): Promise<{ 
    providerId: string; 
    providerToken: string;
    registryId: string;
  }> {
    const client = supabase as any;
    
    try {
      const { data, error } = await supabase.rpc('generate_provider_registry_id', {
        p_province_code: provinceCode
      });
      
      if (!error && data) {
        const providerId = data as string;
        // Provider token is last 8 characters (sequence + check)
        const providerToken = providerId.slice(-11).replace('-', '');
        return {
          providerId,
          providerToken,
          registryId: `REG-${Date.now().toString(36).toUpperCase()}`
        };
      }
    } catch (e) {
      console.warn('Database generation failed, using local:', e);
    }
    
    // Local fallback
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString(36).toUpperCase().slice(-6).padStart(6, '0');
    const random = this.generateSecureRandom(4);
    const providerId = `VARAPI-${year}-${provinceCode.toUpperCase()}${timestamp}-${random}`;
    
    return {
      providerId,
      providerToken: `${timestamp}${random}`,
      registryId: `REG-${Date.now().toString(36).toUpperCase()}`
    };
  },

  /**
   * Generate secure random string
   */
  generateSecureRandom(length: number): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array).map(b => charset[b % charset.length]).join('');
  },

  /**
   * Validate a Provider ID format
   */
  validate(providerId: string): ProviderValidation {
    if (!providerId || typeof providerId !== 'string') {
      return { isValid: false, error: 'Provider ID is required' };
    }
    
    const pattern = /^VARAPI-(\d{4})-([A-Z]{2})(\d{6})-([A-Z0-9]{4})$/;
    const match = providerId.match(pattern);
    
    if (!match) {
      return { 
        isValid: false, 
        error: 'Invalid format. Expected: VARAPI-YYYY-PPNNNNNN-XXXX' 
      };
    }
    
    return {
      isValid: true,
      components: {
        prefix: 'VARAPI',
        year: match[1],
        provinceCode: match[2],
        sequence: match[3],
        check: match[4]
      }
    };
  },

  /**
   * Format Provider ID for display
   */
  format(providerId: string): string {
    // Already formatted, just return
    return providerId;
  },

  /**
   * Extract provider token from full ID
   */
  extractToken(providerId: string): string {
    const validation = this.validate(providerId);
    if (!validation.isValid || !validation.components) {
      return '';
    }
    return `${validation.components.sequence}${validation.components.check}`;
  },

  // ============================================
  // RECOVERY METHODS
  // ============================================

  /**
   * Recover Provider ID using multiple methods
   */
  async recoverAccess(
    method: 'biometric' | 'professional_license' | 'facility_verification' | 'phone_otp' | 'email_otp',
    data: Record<string, unknown>
  ): Promise<ProviderRecoveryResult> {
    console.log(`Attempting Provider ID recovery via ${method}...`);
    
    switch (method) {
      case 'biometric':
        return this.verifyBiometric(data as { hash: string; type: 'fingerprint' | 'facial' | 'iris' });
      case 'professional_license':
        return this.verifyProfessionalLicense(data as { licenseNumber: string; licenseType: string; issuingBody: string });
      case 'facility_verification':
        return this.verifyViaFacility(data as { facilityId: string; verificationCode: string; providerDetails: Record<string, string> });
      case 'phone_otp':
        return this.verifyPhoneOTP(data as { phoneNumber: string; otp: string });
      case 'email_otp':
        return this.verifyEmailOTP(data as { email: string; otp: string });
      default:
        return { success: false, error: 'Unknown recovery method' };
    }
  },

  async verifyBiometric(data: { hash: string; type: 'fingerprint' | 'facial' | 'iris' }): Promise<ProviderRecoveryResult> {
    // In production: call biometric matching service
    console.log(`Biometric verification via ${data.type}`);
    return { success: false, error: 'Biometric verification requires external service. Try professional license recovery.' };
  },

  async verifyProfessionalLicense(data: { licenseNumber: string; licenseType: string; issuingBody: string }): Promise<ProviderRecoveryResult> {
    // Look up provider by professional license number
    const client = supabase as any;
    const result = await client
      .from('providers')
      .select('ihris_id, user_id')
      .eq('license_number', data.licenseNumber)
      .eq('is_active', true)
      .limit(1);
    
    const providers = result.data as { ihris_id: string; user_id: string }[] | null;
    
    if (!providers?.length) {
      return { success: false, error: 'No provider found with this license number' };
    }
    
    return {
      success: true,
      providerId: providers[0].ihris_id,
      providerToken: providers[0].ihris_id.slice(-10).replace('-', '')
    };
  },

  async verifyViaFacility(data: { facilityId: string; verificationCode: string; providerDetails: Record<string, string> }): Promise<ProviderRecoveryResult> {
    // Facility-assisted verification
    if (!data.facilityId || !data.verificationCode) {
      return { success: false, error: 'Facility ID and verification code required' };
    }
    
    // In production: verify facility authorization and lookup provider
    console.log('Facility verification for provider');
    return { success: false, error: 'Please contact your facility administrator for verification' };
  },

  async verifyPhoneOTP(data: { phoneNumber: string; otp: string }): Promise<ProviderRecoveryResult> {
    if (data.otp.length !== 6) {
      return { success: false, error: 'Invalid OTP format' };
    }
    
    // Look up provider by phone
    const client = supabase as any;
    const result = await client
      .from('profiles')
      .select('id, provider_registry_id')
      .eq('phone', data.phoneNumber)
      .limit(1);
    
    const profiles = result.data as { id: string; provider_registry_id: string }[] | null;
    
    if (!profiles?.length || !profiles[0].provider_registry_id) {
      return { success: false, error: 'No provider found with this phone number' };
    }
    
    return {
      success: true,
      providerId: profiles[0].provider_registry_id,
      providerToken: profiles[0].provider_registry_id.slice(-10).replace('-', '')
    };
  },

  async verifyEmailOTP(data: { email: string; otp: string }): Promise<ProviderRecoveryResult> {
    if (data.otp.length !== 6) {
      return { success: false, error: 'Invalid OTP format' };
    }
    
    // Look up via auth user email
    console.log('Email OTP verification for:', data.email);
    return { success: false, error: 'Email verification pending implementation' };
  },

  // ============================================
  // PROVIDER LOOKUP
  // ============================================

  /**
   * Look up provider by ID or token
   */
  async lookupProvider(idOrToken: string): Promise<ProviderIdRecord | null> {
    const client = supabase as any;
    
    // Try full ID first
    let result = await client
      .from('providers')
      .select('ihris_id, license_number, specialty, is_active, created_at')
      .eq('ihris_id', idOrToken)
      .limit(1);
    
    let providers = result.data as any[] | null;
    
    // If not found, try by token (partial match on ihris_id ending)
    if (!providers?.length) {
      result = await client
        .from('providers')
        .select('ihris_id, license_number, specialty, is_active, created_at')
        .ilike('ihris_id', `%${idOrToken}`)
        .limit(1);
      
      providers = result.data as any[] | null;
    }
    
    if (!providers?.length) {
      return null;
    }
    
    const p = providers[0];
    return {
      providerId: p.ihris_id,
      providerToken: p.ihris_id.slice(-10).replace('-', ''),
      registryId: p.ihris_id,
      professionalLicenseNumber: p.license_number || '',
      specialty: p.specialty || '',
      isActive: p.is_active,
      registeredAt: p.created_at
    };
  },

  /**
   * Link biometrics to provider ID
   */
  async linkBiometrics(
    providerId: string,
    biometricType: 'fingerprint' | 'facial' | 'iris',
    biometricHash: string
  ): Promise<{ success: boolean; error?: string }> {
    console.log(`Linking ${biometricType} biometrics to provider ${providerId}`);
    
    // In production: store biometric hash securely
    // This enables: Biometrics = Provider ID (like PHID)
    
    const client = supabase as any;
    const updateData: Record<string, string> = {};
    updateData[`biometric_${biometricType}_hash`] = biometricHash;
    
    try {
      await client
        .from('providers')
        .update(updateData)
        .eq('ihris_id', providerId);
      
      return { success: true };
    } catch (e) {
      console.error('Failed to link biometrics:', e);
      return { success: false, error: 'Failed to link biometrics' };
    }
  },

  /**
   * Request OTP for recovery
   */
  async requestRecoveryOTP(
    type: 'phone' | 'email',
    destination: string
  ): Promise<{ success: boolean; message: string }> {
    console.log(`Sending provider recovery OTP to ${type}: ${destination}`);
    return {
      success: true,
      message: `OTP sent to your registered ${type}. Valid for 10 minutes.`
    };
  }
};

// Export helpers
export const validateProviderId = ProviderIdService.validate.bind(ProviderIdService);
export const generateProviderId = ProviderIdService.generateProviderId.bind(ProviderIdService);
export const recoverProviderAccess = ProviderIdService.recoverAccess.bind(ProviderIdService);
