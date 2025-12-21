import React, { useContext, useState } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, Settings, Shield, UserCog } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PermissionsDisplay } from './PermissionsDisplay';

export const UserMenu: React.FC = () => {
  const context = useContext(AuthContext);
  const { hasPermission, isRole } = usePermissions();
  const navigate = useNavigate();
  const [showPermissions, setShowPermissions] = useState(false);

  const isAdmin = hasPermission('manage_users') || isRole('admin');

  // Gracefully handle missing context during HMR
  if (!context) return null;

  const { user, profile, signOut } = context;

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/auth');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'doctor':
        return 'default';
      case 'nurse':
        return 'secondary';
      case 'specialist':
        return 'outline';
      case 'admin':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {profile?.display_name ? getInitials(profile.display_name) : <User className="w-4 h-4" />}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <p className="text-sm font-medium leading-none">
              {profile?.display_name || 'User'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            <div className="flex items-center gap-2 pt-1">
              {profile?.role && (
                <Badge variant={getRoleBadgeVariant(profile.role)} className="capitalize text-xs">
                  {profile.role}
                </Badge>
              )}
              {profile?.specialty && (
                <span className="text-xs text-muted-foreground">
                  {profile.specialty}
                </span>
              )}
            </div>
            {profile?.department && (
              <span className="text-xs text-muted-foreground">
                {profile.department}
              </span>
            )}
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="cursor-pointer"
          onClick={() => navigate('/profile')}
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Profile Settings</span>
        </DropdownMenuItem>

        <DropdownMenuItem 
          className="cursor-pointer"
          onClick={() => setShowPermissions(true)}
        >
          <Shield className="mr-2 h-4 w-4" />
          <span>View Permissions</span>
        </DropdownMenuItem>

        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => navigate('/admin')}
            >
              <UserCog className="mr-2 h-4 w-4" />
              <span>Admin Dashboard</span>
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleSignOut}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <Dialog open={showPermissions} onOpenChange={setShowPermissions}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="sr-only">Your Permissions</DialogTitle>
        </DialogHeader>
        <PermissionsDisplay />
      </DialogContent>
    </Dialog>
    </>
  );
};
