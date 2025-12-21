import { useAuth } from '@/contexts/AuthContext';

export type ClinicalRole = 'doctor' | 'nurse' | 'specialist' | 'patient' | 'admin';

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
    'view_patient_records',
    'edit_patient_records',
    'prescribe_medication',
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
    'critical_events',
    'view_care_plans',
    'edit_care_plans',
  ],
  specialist: [
    'view_patient_records',
    'edit_patient_records',
    'prescribe_medication',
    'order_labs',
    'view_lab_results',
    'create_referrals',
    'manage_teleconsults',
    'view_vitals',
    'view_clinical_notes',
    'write_clinical_notes',
    'critical_events',
    'view_care_plans',
    'edit_care_plans',
  ],
  nurse: [
    'view_patient_records',
    'administer_medication',
    'view_lab_results',
    'view_vitals',
    'edit_vitals',
    'manage_beds',
    'manage_queue',
    'view_clinical_notes',
    'write_clinical_notes',
    'critical_events',
    'view_care_plans',
    'edit_care_plans',
  ],
  patient: [
    'view_vitals',
    'view_lab_results',
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
  
  const role = profile?.role as ClinicalRole | undefined;
  
  const hasPermission = (permission: Permission): boolean => {
    if (!role) return false;
    return rolePermissions[role]?.includes(permission) ?? false;
  };
  
  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(hasPermission);
  };
  
  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(hasPermission);
  };
  
  const isRole = (roles: ClinicalRole | ClinicalRole[]): boolean => {
    if (!role) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(role);
  };
  
  const getPermissions = (): Permission[] => {
    if (!role) return [];
    return rolePermissions[role] ?? [];
  };

  return {
    role,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isRole,
    getPermissions,
    isAuthenticated: !!profile,
  };
};
