/**
 * PII Protection Hook
 * 
 * Controls visibility of Personally Identifiable Information (PII)
 * in queue displays and patient lists. Implements "minimum necessary"
 * principle from HIPAA Privacy Rule.
 * 
 * Standards:
 * - HIPAA Privacy Rule (45 CFR 164.502(b)) - Minimum necessary
 * - GDPR Article 5(1)(c) - Data minimization
 * - HL7 FHIR Security Labels - Restricted/Confidential
 */

import { useState, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";

export type PIIField = 
  | "fullName"
  | "dateOfBirth"
  | "mrn"
  | "phone"
  | "address"
  | "email"
  | "healthId";

export type PIIMaskLevel = "none" | "partial" | "full";

export interface PIISettings {
  maskLevel: PIIMaskLevel;
  authorizedFields: PIIField[];
  revealedPatients: Set<string>; // Patient IDs that have been explicitly revealed
  sessionTimeout: number; // Minutes before auto-mask
}

const DEFAULT_SETTINGS: PIISettings = {
  maskLevel: "partial",
  authorizedFields: ["fullName"], // Only show name by default
  revealedPatients: new Set(),
  sessionTimeout: 15,
};

// Masking utilities
export function maskName(name: string, level: PIIMaskLevel): string {
  if (level === "none") return name;
  if (level === "full") return "•••• ••••";
  
  const parts = name.split(" ");
  if (parts.length === 1) {
    return parts[0].charAt(0) + "•••";
  }
  // Show first initial + masked last name
  return `${parts[0].charAt(0)}. ${parts[parts.length - 1].charAt(0)}•••`;
}

export function maskMRN(mrn: string, level: PIIMaskLevel): string {
  if (level === "none") return mrn;
  if (level === "full") return "•••-••••-•••";
  
  // Show last 4 characters only
  const visible = mrn.slice(-4);
  return `•••-${visible}`;
}

export function maskDOB(dob: string, level: PIIMaskLevel): string {
  if (level === "none") return dob;
  if (level === "full") return "••/••/••••";
  
  // Show year only
  const year = dob.split("-")[0] || dob.split("/").pop();
  return `••/••/${year}`;
}

export function maskPhone(phone: string, level: PIIMaskLevel): string {
  if (level === "none") return phone;
  if (level === "full") return "••• ••• ••••";
  
  // Show last 4 digits
  const clean = phone.replace(/\D/g, "");
  return `••• ••• ${clean.slice(-4)}`;
}

export function maskHealthId(healthId: string, level: PIIMaskLevel): string {
  if (level === "none") return healthId;
  if (level === "full") return "•••-•-•••-•";
  
  // Show first 3 and last character (check digit)
  return `${healthId.slice(0, 3)}-•-•••-${healthId.slice(-1)}`;
}

export function usePIIProtection() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PIISettings>(DEFAULT_SETTINGS);
  const [revealTimeouts, setRevealTimeouts] = useState<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Check if user has elevated access (e.g., attending physician, assigned nurse)
  const hasElevatedAccess = useMemo(() => {
    // In production, this would check user's role and care relationships
    return false; // Default to protected view
  }, [user]);

  // Reveal PII for a specific patient (requires authorization)
  const revealPatientPII = useCallback((patientId: string) => {
    setSettings(prev => ({
      ...prev,
      revealedPatients: new Set(prev.revealedPatients).add(patientId),
    }));

    // Auto-mask after timeout
    const timeout = setTimeout(() => {
      setSettings(prev => {
        const revealed = new Set(prev.revealedPatients);
        revealed.delete(patientId);
        return { ...prev, revealedPatients: revealed };
      });
    }, settings.sessionTimeout * 60 * 1000);

    setRevealTimeouts(prev => {
      const existing = prev.get(patientId);
      if (existing) clearTimeout(existing);
      return new Map(prev).set(patientId, timeout);
    });
  }, [settings.sessionTimeout]);

  // Hide PII for a specific patient
  const hidePatientPII = useCallback((patientId: string) => {
    setSettings(prev => {
      const revealed = new Set(prev.revealedPatients);
      revealed.delete(patientId);
      return { ...prev, revealedPatients: revealed };
    });

    const timeout = revealTimeouts.get(patientId);
    if (timeout) {
      clearTimeout(timeout);
      setRevealTimeouts(prev => {
        const next = new Map(prev);
        next.delete(patientId);
        return next;
      });
    }
  }, [revealTimeouts]);

  // Check if patient's PII is currently revealed
  const isPatientRevealed = useCallback((patientId: string): boolean => {
    return settings.revealedPatients.has(patientId) || hasElevatedAccess;
  }, [settings.revealedPatients, hasElevatedAccess]);

  // Get mask level for a patient
  const getPatientMaskLevel = useCallback((patientId: string): PIIMaskLevel => {
    if (isPatientRevealed(patientId)) return "none";
    return settings.maskLevel;
  }, [isPatientRevealed, settings.maskLevel]);

  // Mask patient data based on settings
  const maskPatientData = useCallback(<T extends {
    id: string;
    name?: string;
    fullName?: string;
    mrn?: string;
    dateOfBirth?: string;
    dob?: string;
    phone?: string;
    healthId?: string;
  }>(patient: T): T => {
    const level = getPatientMaskLevel(patient.id);
    if (level === "none") return patient;

    return {
      ...patient,
      name: patient.name ? maskName(patient.name, level) : undefined,
      fullName: patient.fullName ? maskName(patient.fullName, level) : undefined,
      mrn: patient.mrn ? maskMRN(patient.mrn, level) : undefined,
      dateOfBirth: patient.dateOfBirth ? maskDOB(patient.dateOfBirth, level) : undefined,
      dob: patient.dob ? maskDOB(patient.dob, level) : undefined,
      phone: patient.phone ? maskPhone(patient.phone, level) : undefined,
      healthId: patient.healthId ? maskHealthId(patient.healthId, level) : undefined,
    };
  }, [getPatientMaskLevel]);

  // Update global mask level
  const setMaskLevel = useCallback((level: PIIMaskLevel) => {
    setSettings(prev => ({ ...prev, maskLevel: level }));
  }, []);

  return {
    settings,
    maskLevel: settings.maskLevel,
    setMaskLevel,
    revealPatientPII,
    hidePatientPII,
    isPatientRevealed,
    getPatientMaskLevel,
    maskPatientData,
    maskName,
    maskMRN,
    maskDOB,
    maskPhone,
    maskHealthId,
    hasElevatedAccess,
  };
}
