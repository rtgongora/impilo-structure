/**
 * Provider Edit Form - Edit existing provider core details
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { HealthProvider } from '@/types/hpr';
import { PROVIDER_CADRES, REGISTRATION_COUNCILS } from '@/types/hpr';

interface ProviderEditFormProps {
  provider: HealthProvider;
  onSuccess: () => void;
  onCancel: () => void;
}

const SPECIALTIES = [
  'General Practice',
  'Internal Medicine',
  'Pediatrics',
  'Surgery',
  'Obstetrics & Gynecology',
  'Psychiatry',
  'Anesthesiology',
  'Radiology',
  'Pathology',
  'Emergency Medicine',
  'Cardiology',
  'Dermatology',
  'Neurology',
  'Orthopedics',
  'Ophthalmology',
  'ENT',
  'Oncology',
  'Public Health',
  'Family Medicine',
];

export function ProviderEditForm({ provider, onSuccess, onCancel }: ProviderEditFormProps) {
  const [submitting, setSubmitting] = useState(false);
  
  // Cast to any for optional fields that may exist in DB but not in strict type
  const providerAny = provider as any;
  
  const [formData, setFormData] = useState({
    // Personal Information
    first_name: provider.first_name || '',
    other_names: provider.other_names || '',
    surname: provider.surname || '',
    date_of_birth: provider.date_of_birth || '',
    sex: provider.sex || 'unknown',
    national_id: provider.national_id || '',
    passport_number: provider.passport_number || '',
    nationality: provider.nationality || 'Zimbabwean',
    
    // Contact Information
    email: provider.email || '',
    phone: provider.phone || '',
    address_line1: providerAny.address_line1 || '',
    city: providerAny.city || '',
    province: providerAny.province || '',
    country: providerAny.country || 'Zimbabwe',
    
    // Professional Information
    cadre: provider.cadre || '',
    specialty: provider.specialty || '',
    sub_specialty: provider.sub_specialty || '',
    professional_council_id: providerAny.professional_council_id || '',
    council_registration_number: providerAny.council_registration_number || '',
    council_registration_expires: providerAny.council_registration_expires || '',
    
    // HR Information
    employee_number: providerAny.employee_number || '',
    hire_date: providerAny.hire_date || '',
    classification: providerAny.classification || '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.surname) {
      toast.error('First name and surname are required');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('health_providers')
        .update({
          first_name: formData.first_name,
          other_names: formData.other_names || null,
          surname: formData.surname,
          date_of_birth: formData.date_of_birth || null,
          sex: formData.sex,
          national_id: formData.national_id || null,
          passport_number: formData.passport_number || null,
          nationality: formData.nationality,
          email: formData.email || null,
          phone: formData.phone || null,
          address_line1: formData.address_line1 || null,
          city: formData.city || null,
          province: formData.province || null,
          country: formData.country || null,
          cadre: formData.cadre || null,
          specialty: formData.specialty || null,
          sub_specialty: formData.sub_specialty || null,
          professional_council_id: formData.professional_council_id || null,
          council_registration_number: formData.council_registration_number || null,
          council_registration_expires: formData.council_registration_expires || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', provider.id);

      if (error) throw error;

      // Log audit event
      await supabase.from('hpr_audit_log').insert({
        action: 'UPDATE',
        entity_type: 'health_provider',
        entity_id: provider.id,
        changes: { previous: provider, updated: formData },
        performed_by: (await supabase.auth.getUser()).data.user?.id || 'system',
      });

      toast.success('Provider updated successfully');
      onSuccess();
    } catch (error) {
      console.error('Failed to update provider:', error);
      toast.error('Failed to update provider');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm border-b pb-2">Personal Information</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">First Name *</Label>
            <Input
              id="first_name"
              value={formData.first_name}
              onChange={(e) => handleChange('first_name', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="other_names">Other Names</Label>
            <Input
              id="other_names"
              value={formData.other_names}
              onChange={(e) => handleChange('other_names', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="surname">Surname *</Label>
            <Input
              id="surname"
              value={formData.surname}
              onChange={(e) => handleChange('surname', e.target.value)}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => handleChange('date_of_birth', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sex">Sex</Label>
            <Select value={formData.sex} onValueChange={(v) => handleChange('sex', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nationality">Nationality</Label>
            <Input
              id="nationality"
              value={formData.nationality}
              onChange={(e) => handleChange('nationality', e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="national_id">National ID</Label>
            <Input
              id="national_id"
              value={formData.national_id}
              onChange={(e) => handleChange('national_id', e.target.value)}
              placeholder="e.g. 63-123456-A-42"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="passport_number">Passport Number</Label>
            <Input
              id="passport_number"
              value={formData.passport_number}
              onChange={(e) => handleChange('passport_number', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm border-b pb-2">Contact Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+263..."
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address_line1">Address</Label>
          <Input
            id="address_line1"
            value={formData.address_line1}
            onChange={(e) => handleChange('address_line1', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="province">Province</Label>
            <Select value={formData.province} onValueChange={(v) => handleChange('province', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Harare">Harare</SelectItem>
                <SelectItem value="Bulawayo">Bulawayo</SelectItem>
                <SelectItem value="Manicaland">Manicaland</SelectItem>
                <SelectItem value="Mashonaland Central">Mashonaland Central</SelectItem>
                <SelectItem value="Mashonaland East">Mashonaland East</SelectItem>
                <SelectItem value="Mashonaland West">Mashonaland West</SelectItem>
                <SelectItem value="Masvingo">Masvingo</SelectItem>
                <SelectItem value="Matabeleland North">Matabeleland North</SelectItem>
                <SelectItem value="Matabeleland South">Matabeleland South</SelectItem>
                <SelectItem value="Midlands">Midlands</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => handleChange('country', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Professional Information */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm border-b pb-2">Professional Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cadre">Cadre</Label>
            <Select value={formData.cadre} onValueChange={(v) => handleChange('cadre', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select cadre..." />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_CADRES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="specialty">Specialty</Label>
            <Select value={formData.specialty} onValueChange={(v) => handleChange('specialty', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select specialty..." />
              </SelectTrigger>
              <SelectContent>
                {SPECIALTIES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sub_specialty">Sub-Specialty</Label>
          <Input
            id="sub_specialty"
            value={formData.sub_specialty}
            onChange={(e) => handleChange('sub_specialty', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="professional_council_id">Professional Council</Label>
            <Select 
              value={formData.professional_council_id} 
              onValueChange={(v) => handleChange('professional_council_id', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select council..." />
              </SelectTrigger>
              <SelectContent>
                {REGISTRATION_COUNCILS.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="council_registration_number">Registration Number</Label>
            <Input
              id="council_registration_number"
              value={formData.council_registration_number}
              onChange={(e) => handleChange('council_registration_number', e.target.value)}
              placeholder="e.g. MDPCZ/12345"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="council_registration_expires">Registration Expires</Label>
            <Input
              id="council_registration_expires"
              type="date"
              value={formData.council_registration_expires}
              onChange={(e) => handleChange('council_registration_expires', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
