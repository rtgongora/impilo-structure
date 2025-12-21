import React from 'react';
import { usePermissions, Permission, ClinicalRole } from '@/hooks/usePermissions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

interface RoleGateProps {
  children: React.ReactNode;
  /** Required permission(s) - user needs at least one if array */
  permission?: Permission | Permission[];
  /** Required role(s) - user needs at least one if array */
  role?: ClinicalRole | ClinicalRole[];
  /** If true, user needs ALL permissions (default: any) */
  requireAll?: boolean;
  /** What to show when access is denied */
  fallback?: React.ReactNode;
  /** If true, shows nothing instead of fallback when denied */
  hideOnDeny?: boolean;
}

export const RoleGate: React.FC<RoleGateProps> = ({
  children,
  permission,
  role,
  requireAll = false,
  fallback,
  hideOnDeny = false,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isRole, loading } = usePermissions();

  if (loading) {
    return null;
  }

  let hasAccess = true;

  // Check role-based access
  if (role) {
    hasAccess = isRole(role);
  }

  // Check permission-based access
  if (hasAccess && permission) {
    const permissions = Array.isArray(permission) ? permission : [permission];
    
    if (requireAll) {
      hasAccess = hasAllPermissions(permissions);
    } else {
      hasAccess = hasAnyPermission(permissions);
    }
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (hideOnDeny) {
    return null;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <Alert variant="destructive" className="max-w-md mx-auto my-8">
      <ShieldAlert className="h-4 w-4" />
      <AlertTitle>Access Denied</AlertTitle>
      <AlertDescription>
        You don't have permission to access this feature. Contact your administrator if you believe this is an error.
      </AlertDescription>
    </Alert>
  );
};

// Utility component for conditionally hiding elements
export const PermissionHide: React.FC<{
  children: React.ReactNode;
  permission?: Permission | Permission[];
  role?: ClinicalRole | ClinicalRole[];
  requireAll?: boolean;
}> = ({ children, permission, role, requireAll }) => (
  <RoleGate 
    permission={permission} 
    role={role} 
    requireAll={requireAll}
    hideOnDeny
  >
    {children}
  </RoleGate>
);
