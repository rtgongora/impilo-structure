/**
 * OpenHIE Registry Integration Services
 * 
 * This module provides mock implementations for:
 * - MOSIP Client Registry (Patient/Client IDs - Impilo ID)
 * - iHRIS Provider Registry (Healthcare Provider IDs)
 * - GOFR Global Open Facility Registry (Facility IDs)
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================
// TYPES
// ============================================

export interface ProviderRegistryRecord {
  id: string;
  providerId: string;
  fullName: string;
  role: string;
  specialty?: string;
  department?: string;
  facilityId: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  status: 'active' | 'inactive' | 'suspended';
  biometricEnrolled: boolean;
  createdAt: string;
}

export interface ClientRegistryRecord {
  id: string;
  impiloId: string;
  mosipUin?: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  nationalId?: string;
  biometricEnrolled: boolean;
  verificationStatus: 'pending' | 'verified' | 'failed';
  createdAt: string;
}

export interface FacilityRegistryRecord {
  id: string;
  gofrId: string;
  name: string;
  facilityType: string;
  level: string;
  address: {
    line1?: string;
    city: string;
    province: string;
    country: string;
  };
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  contact?: {
    phone?: string;
    email?: string;
  };
  isActive: boolean;
}

export interface BiometricVerificationResult {
  success: boolean;
  method: 'fingerprint' | 'facial' | 'iris';
  confidence: number;
  matchedId?: string;
  error?: string;
}

// ============================================
// MOCK DATA GENERATORS
// ============================================

const generateProviderId = () => {
  const prefix = 'IHRIS';
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 900000) + 100000;
  return `${prefix}-${year}-${random}`;
};

const generateImpiloId = () => {
  const prefix = 'IMP';
  const segment1 = Math.floor(Math.random() * 9000) + 1000;
  const segment2 = Math.floor(Math.random() * 9000) + 1000;
  const segment3 = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${segment1}-${segment2}-${segment3}`;
};

const generateMosipUin = () => {
  const parts = [];
  for (let i = 0; i < 4; i++) {
    parts.push(Math.floor(Math.random() * 9000) + 1000);
  }
  return parts.join('-');
};

// ============================================
// PROVIDER REGISTRY SERVICE (iHRIS)
// ============================================

export const ProviderRegistryService = {
  /**
   * Look up a provider by their registry ID
   */
  async lookupProvider(providerId: string): Promise<ProviderRegistryRecord | null> {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if provider exists in our database
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('provider_registry_id', providerId)
      .maybeSingle();
    
    if (profile) {
      return {
        id: profile.id,
        providerId: profile.provider_registry_id || providerId,
        fullName: profile.display_name,
        role: profile.role,
        specialty: profile.specialty || undefined,
        department: profile.department || undefined,
        facilityId: profile.facility_id || 'GOFR-ZA-001',
        licenseNumber: profile.license_number || undefined,
        status: 'active',
        biometricEnrolled: !!(profile.biometric_fingerprint_hash || profile.biometric_facial_hash || profile.biometric_iris_hash),
        createdAt: profile.created_at
      };
    }
    
    return null;
  },

  /**
   * Register a new provider in the registry
   */
  async registerProvider(data: {
    fullName: string;
    role: string;
    specialty?: string;
    department?: string;
    facilityId: string;
    licenseNumber?: string;
  }): Promise<ProviderRegistryRecord> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const providerId = generateProviderId();
    
    return {
      id: crypto.randomUUID(),
      providerId,
      fullName: data.fullName,
      role: data.role,
      specialty: data.specialty,
      department: data.department,
      facilityId: data.facilityId,
      licenseNumber: data.licenseNumber,
      status: 'active',
      biometricEnrolled: false,
      createdAt: new Date().toISOString()
    };
  },

  /**
   * Verify provider biometrics against registry
   */
  async verifyBiometric(
    providerId: string,
    biometricHash: string,
    method: 'fingerprint' | 'facial' | 'iris'
  ): Promise<BiometricVerificationResult> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check stored biometric hash
    const hashColumn = `biometric_${method}_hash`;
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('provider_registry_id', providerId)
      .maybeSingle();
    
    if (!profile) {
      return {
        success: false,
        method,
        confidence: 0,
        error: 'Provider not found in registry'
      };
    }
    
    // In production, this would compare actual biometric templates
    // For mock, we simulate successful verification
    const storedHash = (profile as any)[hashColumn];
    
    if (storedHash && storedHash === biometricHash) {
      return {
        success: true,
        method,
        confidence: 0.95 + Math.random() * 0.05,
        matchedId: providerId
      };
    }
    
    // Simulate high confidence match for demo
    return {
      success: true,
      method,
      confidence: 0.92 + Math.random() * 0.08,
      matchedId: providerId
    };
  },

  /**
   * Enroll provider biometrics
   */
  async enrollBiometric(
    userId: string,
    biometricData: {
      type: 'fingerprint' | 'facial' | 'iris';
      hash: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const column = `biometric_${biometricData.type}_hash`;
    
    const { error } = await supabase
      .from('profiles')
      .update({
        [column]: biometricData.hash,
        biometric_enrolled_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  }
};

// ============================================
// CLIENT REGISTRY SERVICE (MOSIP)
// ============================================

export const ClientRegistryService = {
  /**
   * Look up a patient by their Impilo ID
   */
  async lookupByImpiloId(impiloId: string): Promise<ClientRegistryRecord | null> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const { data } = await supabase
      .from('patient_identifiers')
      .select('*, patients(*)')
      .eq('impilo_id', impiloId)
      .maybeSingle();
    
    if (data && data.patients) {
      const patient = data.patients as any;
      return {
        id: data.id,
        impiloId: data.impilo_id,
        mosipUin: data.mosip_uin || undefined,
        fullName: `${patient.first_name} ${patient.last_name}`,
        dateOfBirth: patient.date_of_birth,
        gender: patient.gender,
        nationalId: patient.national_id || undefined,
        biometricEnrolled: !!(data.biometric_fingerprint_hash || data.biometric_facial_hash || data.biometric_iris_hash),
        verificationStatus: data.verified_at ? 'verified' : 'pending',
        createdAt: data.created_at
      };
    }
    
    return null;
  },

  /**
   * Register a new client/patient in the registry
   */
  async registerClient(patientId: string, nationalId?: string): Promise<{ impiloId: string; mosipUin: string }> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const impiloId = generateImpiloId();
    const mosipUin = generateMosipUin();
    
    await supabase.from('patient_identifiers').insert({
      patient_id: patientId,
      impilo_id: impiloId,
      mosip_uin: mosipUin
    });
    
    return { impiloId, mosipUin };
  },

  /**
   * Verify patient biometrics
   */
  async verifyBiometric(
    impiloId: string,
    biometricHash: string,
    method: 'fingerprint' | 'facial' | 'iris'
  ): Promise<BiometricVerificationResult> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data } = await supabase
      .from('patient_identifiers')
      .select('*')
      .eq('impilo_id', impiloId)
      .maybeSingle();
    
    if (!data) {
      return {
        success: false,
        method,
        confidence: 0,
        error: 'Patient not found in registry'
      };
    }
    
    // Simulate successful biometric verification
    return {
      success: true,
      method,
      confidence: 0.94 + Math.random() * 0.06,
      matchedId: impiloId
    };
  }
};

// ============================================
// FACILITY REGISTRY SERVICE (GOFR)
// ============================================

export const FacilityRegistryService = {
  /**
   * Look up a facility by GOFR ID
   */
  async lookupFacility(gofrId: string): Promise<FacilityRegistryRecord | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const { data } = await supabase
      .from('facilities')
      .select('*')
      .eq('gofr_id', gofrId)
      .maybeSingle();
    
    if (data) {
      return {
        id: data.id,
        gofrId: data.gofr_id,
        name: data.name,
        facilityType: data.facility_type,
        level: data.level || 'Primary',
        address: {
          line1: data.address_line1 || undefined,
          city: data.city || '',
          province: data.province || '',
          country: data.country || 'South Africa'
        },
        coordinates: data.latitude && data.longitude ? {
          latitude: parseFloat(String(data.latitude)),
          longitude: parseFloat(String(data.longitude))
        } : undefined,
        contact: {
          phone: data.phone || undefined,
          email: data.email || undefined
        },
        isActive: data.is_active
      };
    }
    
    return null;
  },

  /**
   * Get all active facilities
   */
  async getAllFacilities(): Promise<FacilityRegistryRecord[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const { data } = await supabase
      .from('facilities')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    return (data || []).map(f => ({
      id: f.id,
      gofrId: f.gofr_id,
      name: f.name,
      facilityType: f.facility_type,
      level: f.level || 'Primary',
      address: {
        line1: f.address_line1 || undefined,
        city: f.city || '',
        province: f.province || '',
        country: f.country || 'South Africa'
      },
      coordinates: f.latitude && f.longitude ? {
        latitude: parseFloat(String(f.latitude)),
        longitude: parseFloat(String(f.longitude))
      } : undefined,
      contact: {
        phone: f.phone || undefined,
        email: f.email || undefined
      },
      isActive: f.is_active
    }));
  },

  /**
   * Search facilities by name or location
   */
  async searchFacilities(query: string): Promise<FacilityRegistryRecord[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const { data } = await supabase
      .from('facilities')
      .select('*')
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,city.ilike.%${query}%,province.ilike.%${query}%`)
      .limit(10);
    
    return (data || []).map(f => ({
      id: f.id,
      gofrId: f.gofr_id,
      name: f.name,
      facilityType: f.facility_type,
      level: f.level || 'Primary',
      address: {
        line1: f.address_line1 || undefined,
        city: f.city || '',
        province: f.province || '',
        country: f.country || 'South Africa'
      },
      isActive: f.is_active
    }));
  }
};

// ============================================
// BIOMETRIC UTILITIES
// ============================================

export const BiometricUtils = {
  /**
   * Generate a mock biometric hash from capture data
   * In production, this would use actual biometric template generation
   */
  generateHash(type: 'fingerprint' | 'facial' | 'iris', captureData: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return `${type.substring(0, 3).toUpperCase()}-${timestamp}-${random}`;
  },

  /**
   * Simulate biometric quality assessment
   */
  assessQuality(captureData: string): { score: number; acceptable: boolean } {
    const score = 0.75 + Math.random() * 0.25;
    return {
      score,
      acceptable: score >= 0.8
    };
  }
};
