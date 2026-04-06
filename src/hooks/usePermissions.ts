import { useAuth } from '@/contexts/AuthContext';
import { useSystemRoles } from '@/hooks/useSystemRoles';

export type ClinicalRole =
  | 'doctor' | 'specialist' | 'intern_doctor' | 'registrar' | 'consultant'
  | 'dentist' | 'dental_therapist'
  | 'nurse' | 'nurse_practitioner' | 'enrolled_nurse' | 'midwife'
  | 'physiotherapist' | 'occupational_therapist' | 'speech_therapist'
  | 'dietitian' | 'psychologist' | 'social_worker' | 'audiologist'
  | 'optometrist' | 'podiatrist' | 'biokinetician' | 'orthotist_prosthetist'
  | 'respiratory_therapist' | 'radiotherapist'
  | 'radiographer' | 'sonographer' | 'lab_tech' | 'pharmacist' | 'pharmacy_tech'
  | 'paramedic' | 'emt'
  | 'oral_hygienist'
  | 'chw' | 'env_health' | 'health_promoter'
  | 'admin' | 'health_info_officer' | 'receptionist'
  | 'patient' | 'superadmin';

export type Permission =
  | 'view_patient_records'
  | 'edit_patient_records'
  | 'prescribe_medication'
  | 'administer_medication'
  | 'order_labs'
  | 'view_lab_results'
  | 'create_referrals'
  | 'manage_teleconsults'
  | 'view_vitals'
  | 'edit_vitals'
  | 'manage_beds'
  | 'manage_queue'
  | 'view_clinical_notes'
  | 'write_clinical_notes'
  | 'manage_users'
  | 'system_admin'
  | 'critical_events'
  | 'view_care_plans'
  | 'edit_care_plans';

// Define which roles have which permissions
const rolePermissions: Record<ClinicalRole, Permission[]> = {
  superadmin: [
    'view_patient_records',
    'edit_patient_records',
    'prescribe_medication',
    'administer_medication',
    'order_labs',
    'view_lab_results',
    'create_referrals',
    'manage_teleconsults',
    'view_vitals',
    'edit_vitals',
    'manage_beds',
    'manage_queue',
    'view_clinical_notes',
    'write_clinical_notes',
    'manage_users',
    'system_admin',
    'critical_events',
    'view_care_plans',
    'edit_care_plans',
  ],
  admin: [
    'view_patient_records',
    'edit_patient_records',
    'prescribe_medication',
    'administer_medication',
    'order_labs',
    'view_lab_results',
    'create_referrals',
    'manage_teleconsults',
    'view_vitals',
    'edit_vitals',
    'manage_beds',
    'manage_queue',
    'view_clinical_notes',
    'write_clinical_notes',
    'manage_users',
    'system_admin',
    'critical_events',
    'view_care_plans',
    'edit_care_plans',
  ],
  doctor: [
    'view_patient_records', 'edit_patient_records', 'prescribe_medication',
    'order_labs', 'view_lab_results', 'create_referrals', 'manage_teleconsults',
    'view_vitals', 'edit_vitals', 'manage_beds', 'manage_queue',
    'view_clinical_notes', 'write_clinical_notes', 'critical_events',
    'view_care_plans', 'edit_care_plans',
  ],
  consultant: [
    'view_patient_records', 'edit_patient_records', 'prescribe_medication',
    'order_labs', 'view_lab_results', 'create_referrals', 'manage_teleconsults',
    'view_vitals', 'edit_vitals', 'view_clinical_notes', 'write_clinical_notes',
    'critical_events', 'view_care_plans', 'edit_care_plans',
  ],
  registrar: [
    'view_patient_records', 'edit_patient_records', 'prescribe_medication',
    'order_labs', 'view_lab_results', 'create_referrals', 'manage_teleconsults',
    'view_vitals', 'edit_vitals', 'view_clinical_notes', 'write_clinical_notes',
    'critical_events', 'view_care_plans', 'edit_care_plans',
  ],
  intern_doctor: [
    'view_patient_records', 'edit_patient_records',
    'order_labs', 'view_lab_results', 'create_referrals',
    'view_vitals', 'edit_vitals', 'view_clinical_notes', 'write_clinical_notes',
    'view_care_plans', 'edit_care_plans',
  ],
  specialist: [
    'view_patient_records', 'edit_patient_records', 'prescribe_medication',
    'order_labs', 'view_lab_results', 'create_referrals', 'manage_teleconsults',
    'view_vitals', 'view_clinical_notes', 'write_clinical_notes',
    'critical_events', 'view_care_plans', 'edit_care_plans',
  ],
  dentist: [
    'view_patient_records', 'edit_patient_records', 'prescribe_medication',
    'order_labs', 'view_lab_results', 'create_referrals',
    'view_vitals', 'view_clinical_notes', 'write_clinical_notes',
    'view_care_plans', 'edit_care_plans',
  ],
  dental_therapist: [
    'view_patient_records', 'view_lab_results',
    'view_vitals', 'view_clinical_notes', 'write_clinical_notes',
    'view_care_plans',
  ],
  nurse: [
    'view_patient_records', 'administer_medication', 'view_lab_results',
    'view_vitals', 'edit_vitals', 'manage_beds', 'manage_queue',
    'view_clinical_notes', 'write_clinical_notes', 'critical_events',
    'view_care_plans', 'edit_care_plans',
  ],
  nurse_practitioner: [
    'view_patient_records', 'edit_patient_records', 'prescribe_medication',
    'administer_medication', 'order_labs', 'view_lab_results', 'create_referrals',
    'view_vitals', 'edit_vitals', 'manage_beds', 'manage_queue',
    'view_clinical_notes', 'write_clinical_notes', 'critical_events',
    'view_care_plans', 'edit_care_plans',
  ],
  enrolled_nurse: [
    'view_patient_records', 'administer_medication', 'view_lab_results',
    'view_vitals', 'edit_vitals', 'view_clinical_notes', 'write_clinical_notes',
    'view_care_plans',
  ],
  midwife: [
    'view_patient_records', 'edit_patient_records', 'administer_medication',
    'order_labs', 'view_lab_results', 'create_referrals',
    'view_vitals', 'edit_vitals', 'view_clinical_notes', 'write_clinical_notes',
    'critical_events', 'view_care_plans', 'edit_care_plans',
  ],
  physiotherapist: [
    'view_patient_records', 'view_lab_results', 'view_vitals',
    'view_clinical_notes', 'write_clinical_notes', 'view_care_plans', 'edit_care_plans',
  ],
  occupational_therapist: [
    'view_patient_records', 'view_lab_results', 'view_vitals',
    'view_clinical_notes', 'write_clinical_notes', 'view_care_plans', 'edit_care_plans',
  ],
  speech_therapist: [
    'view_patient_records', 'view_lab_results', 'view_vitals',
    'view_clinical_notes', 'write_clinical_notes', 'view_care_plans', 'edit_care_plans',
  ],
  dietitian: [
    'view_patient_records', 'view_lab_results', 'view_vitals',
    'view_clinical_notes', 'write_clinical_notes', 'view_care_plans', 'edit_care_plans',
  ],
  psychologist: [
    'view_patient_records', 'view_lab_results', 'view_vitals',
    'view_clinical_notes', 'write_clinical_notes', 'view_care_plans', 'edit_care_plans',
  ],
  social_worker: [
    'view_patient_records', 'view_vitals', 'create_referrals',
    'view_clinical_notes', 'write_clinical_notes', 'view_care_plans', 'edit_care_plans',
  ],
  audiologist: [
    'view_patient_records', 'view_lab_results', 'view_vitals',
    'view_clinical_notes', 'write_clinical_notes', 'view_care_plans',
  ],
  optometrist: [
    'view_patient_records', 'view_lab_results', 'view_vitals',
    'view_clinical_notes', 'write_clinical_notes', 'view_care_plans', 'edit_care_plans',
  ],
  podiatrist: [
    'view_patient_records', 'view_lab_results', 'view_vitals',
    'view_clinical_notes', 'write_clinical_notes', 'view_care_plans',
  ],
  biokinetician: [
    'view_patient_records', 'view_vitals',
    'view_clinical_notes', 'write_clinical_notes', 'view_care_plans', 'edit_care_plans',
  ],
  orthotist_prosthetist: [
    'view_patient_records', 'view_vitals',
    'view_clinical_notes', 'write_clinical_notes', 'view_care_plans',
  ],
  respiratory_therapist: [
    'view_patient_records', 'view_lab_results', 'view_vitals', 'edit_vitals',
    'view_clinical_notes', 'write_clinical_notes', 'critical_events',
    'view_care_plans', 'edit_care_plans',
  ],
  radiotherapist: [
    'view_patient_records', 'view_lab_results', 'view_vitals',
    'view_clinical_notes', 'write_clinical_notes', 'view_care_plans',
  ],
  radiographer: [
    'view_patient_records', 'view_lab_results', 'view_vitals',
    'view_clinical_notes', 'write_clinical_notes',
  ],
  sonographer: [
    'view_patient_records', 'view_lab_results', 'view_vitals',
    'view_clinical_notes', 'write_clinical_notes',
  ],
  lab_tech: [
    'view_patient_records', 'view_lab_results', 'view_vitals',
    'view_clinical_notes',
  ],
  pharmacist: [
    'view_patient_records', 'administer_medication', 'view_lab_results',
    'view_vitals', 'view_clinical_notes', 'write_clinical_notes',
    'view_care_plans',
  ],
  pharmacy_tech: [
    'view_patient_records', 'administer_medication', 'view_lab_results',
    'view_vitals',
  ],
  paramedic: [
    'view_patient_records', 'edit_patient_records', 'administer_medication',
    'view_vitals', 'edit_vitals', 'view_clinical_notes', 'write_clinical_notes',
    'critical_events',
  ],
  emt: [
    'view_patient_records', 'administer_medication',
    'view_vitals', 'edit_vitals', 'critical_events',
  ],
  oral_hygienist: [
    'view_patient_records', 'view_vitals',
    'view_clinical_notes', 'write_clinical_notes',
  ],
  chw: [
    'view_patient_records', 'view_vitals', 'view_lab_results',
  ],
  env_health: [
    'view_patient_records', 'view_vitals',
    'view_clinical_notes', 'write_clinical_notes',
  ],
  health_promoter: [
    'view_patient_records', 'view_vitals',
  ],
  health_info_officer: [
    'view_patient_records', 'view_lab_results', 'view_vitals',
    'view_clinical_notes',
  ],
  receptionist: [
    'view_patient_records', 'manage_queue',
  ],
  patient: [
    'view_vitals', 'view_lab_results',
  ],
};

// Human-readable permission descriptions
export const permissionDescriptions: Record<Permission, string> = {
  view_patient_records: 'View patient records',
  edit_patient_records: 'Edit patient records',
  prescribe_medication: 'Prescribe medications',
  administer_medication: 'Administer medications',
  order_labs: 'Order laboratory tests',
  view_lab_results: 'View lab results',
  create_referrals: 'Create referrals',
  manage_teleconsults: 'Manage teleconsultations',
  view_vitals: 'View vital signs',
  edit_vitals: 'Record vital signs',
  manage_beds: 'Manage bed assignments',
  manage_queue: 'Manage patient queue',
  view_clinical_notes: 'View clinical notes',
  write_clinical_notes: 'Write clinical notes',
  manage_users: 'Manage users',
  system_admin: 'System administration',
  critical_events: 'Initiate critical events',
  view_care_plans: 'View care plans',
  edit_care_plans: 'Edit care plans',
};

export const usePermissions = () => {
  const { profile, loading } = useAuth();
  const { canBypassRestrictions, isSuperAdmin, loading: systemRolesLoading } = useSystemRoles();
  
  const role = profile?.role as ClinicalRole | undefined;
  
  // Get all possible permissions for bypass mode
  const allPermissions: Permission[] = [
    'view_patient_records',
    'edit_patient_records',
    'prescribe_medication',
    'administer_medication',
    'order_labs',
    'view_lab_results',
    'create_referrals',
    'manage_teleconsults',
    'view_vitals',
    'edit_vitals',
    'manage_beds',
    'manage_queue',
    'view_clinical_notes',
    'write_clinical_notes',
    'manage_users',
    'system_admin',
    'critical_events',
    'view_care_plans',
    'edit_care_plans',
  ];
  
  const hasPermission = (permission: Permission): boolean => {
    // Superadmins and dev/testers can bypass all restrictions
    if (canBypassRestrictions || isSuperAdmin) return true;
    if (!role) return false;
    return rolePermissions[role]?.includes(permission) ?? false;
  };
  
  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (canBypassRestrictions || isSuperAdmin) return true;
    return permissions.some(hasPermission);
  };
  
  const hasAllPermissions = (permissions: Permission[]): boolean => {
    if (canBypassRestrictions || isSuperAdmin) return true;
    return permissions.every(hasPermission);
  };
  
  const isRole = (roles: ClinicalRole | ClinicalRole[]): boolean => {
    // Superadmins can act as any role
    if (canBypassRestrictions || isSuperAdmin) return true;
    if (!role) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(role);
  };
  
  const getPermissions = (): Permission[] => {
    if (canBypassRestrictions || isSuperAdmin) return allPermissions;
    if (!role) return [];
    return rolePermissions[role] ?? [];
  };

  return {
    role: canBypassRestrictions ? 'superadmin' : role,
    loading: loading || systemRolesLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isRole,
    getPermissions,
    isAuthenticated: !!profile,
    isSuperAdmin: canBypassRestrictions || isSuperAdmin,
  };
};
