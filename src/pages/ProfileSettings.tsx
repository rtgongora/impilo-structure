import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, User, Briefcase, Building, Phone, FileText, Save, Loader2, Camera, Shield } from 'lucide-react';
import { z } from 'zod';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { TwoFactorSetup } from '@/components/auth/TwoFactorSetup';

const profileSchema = z.object({
  display_name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  specialty: z.string().trim().max(100, 'Specialty must be less than 100 characters').optional(),
  department: z.string().trim().max(100, 'Department must be less than 100 characters').optional(),
  phone: z.string().trim().max(20, 'Phone must be less than 20 characters').optional(),
  license_number: z.string().trim().max(50, 'License number must be less than 50 characters').optional(),
});

const ProfileSettings = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    specialty: '',
    department: '',
    phone: '',
    license_number: '',
  });

  const check2FAStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('totp-management', {
        body: { action: 'check' },
      });
      
      if (!error && data) {
        setTwoFactorEnabled(data.enabled);
      }
    } catch (err) {
      console.error('Error checking 2FA status:', err);
    }
  };

  useEffect(() => {
    check2FAStatus();
  }, [user]);

  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        specialty: profile.specialty || '',
        department: profile.department || '',
        phone: profile.phone || '',
        license_number: profile.license_number || '',
      });
    }
  }, [profile]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const result = profileSchema.safeParse(formData);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    if (!user || !profile) {
      toast.error('You must be logged in to update your profile');
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: formData.display_name.trim(),
        specialty: formData.specialty.trim() || null,
        department: formData.department.trim() || null,
        phone: formData.phone.trim() || null,
        license_number: formData.license_number.trim() || null,
      })
      .eq('user_id', user.id);

    if (error) {
      toast.error('Failed to update profile: ' + error.message);
    } else {
      await refreshProfile();
      toast.success('Profile updated successfully!');
    }

    setIsSubmitting(false);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-destructive text-destructive-foreground';
      case 'doctor':
        return 'bg-primary text-primary-foreground';
      case 'specialist':
        return 'bg-secondary text-secondary-foreground';
      case 'nurse':
        return 'bg-success text-success-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>
            <p className="text-muted-foreground">Manage your account information</p>
          </div>
        </div>

        {/* Avatar Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Profile Photo
            </CardTitle>
            <CardDescription>
              Upload a photo to personalize your profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AvatarUpload />
          </CardContent>
        </Card>

        {/* Two-Factor Authentication Card */}
        <TwoFactorSetup 
          isEnabled={twoFactorEnabled} 
          onStatusChange={check2FAStatus}
        />

        {/* Account Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Account Information
            </CardTitle>
            <CardDescription>
              Your email and role are set during registration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground text-sm">Email</Label>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Clinical Role</Label>
                <div className="mt-1">
                  <Badge className={getRoleBadgeColor(profile?.role || 'patient')}>
                    {profile?.role?.toUpperCase() || 'PATIENT'}
                  </Badge>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              To change your email or role, please contact your system administrator.
            </p>
          </CardContent>
        </Card>

        {/* Editable Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Profile Details
            </CardTitle>
            <CardDescription>
              Update your professional information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="display_name" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Display Name *
                </Label>
                <Input
                  id="display_name"
                  type="text"
                  placeholder="Dr. Jane Smith"
                  value={formData.display_name}
                  onChange={(e) => handleChange('display_name', e.target.value)}
                  required
                  maxLength={100}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="specialty" className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Specialty
                  </Label>
                  <Input
                    id="specialty"
                    type="text"
                    placeholder="Cardiology"
                    value={formData.specialty}
                    onChange={(e) => handleChange('specialty', e.target.value)}
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department" className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Department
                  </Label>
                  <Input
                    id="department"
                    type="text"
                    placeholder="Internal Medicine"
                    value={formData.department}
                    onChange={(e) => handleChange('department', e.target.value)}
                    maxLength={100}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    maxLength={20}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="license_number" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    License Number
                  </Label>
                  <Input
                    id="license_number"
                    type="text"
                    placeholder="MD-123456"
                    value={formData.license_number}
                    onChange={(e) => handleChange('license_number', e.target.value)}
                    maxLength={50}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate('/')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSettings;
