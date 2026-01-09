/**
 * Facility Registration Wizard
 * Multi-step form for registering new facilities
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Settings,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Save,
} from 'lucide-react';
import { useFacilityData, useFacilityTypes, useFacilityOwnershipTypes, useFacilityAdminHierarchies, useFacilityServiceCategories } from '@/hooks/useFacilityData';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { OperationalStatus } from '@/types/facility';

interface FacilityRegistrationWizardProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const STEPS = [
  { id: 1, title: 'Basic Information', icon: Building2 },
  { id: 2, title: 'Location', icon: MapPin },
  { id: 3, title: 'Contact & Operations', icon: Phone },
  { id: 4, title: 'Infrastructure', icon: Settings },
  { id: 5, title: 'Review', icon: CheckCircle },
];

export const FacilityRegistrationWizard = ({ onSuccess, onCancel }: FacilityRegistrationWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Basic
    name: '',
    short_name: '',
    facility_type_id: '',
    ownership_type_id: '',
    operational_status: 'operational' as OperationalStatus,
    // Location
    admin_hierarchy_id: '',
    physical_address: '',
    city: '',
    postal_code: '',
    latitude: '',
    longitude: '',
    // Contact & Operations
    phone: '',
    phone_alt: '',
    email: '',
    website: '',
    is_24hr: false,
    // Infrastructure
    bed_count: '',
    cot_count: '',
    has_electricity: false,
    has_water: false,
    has_internet: false,
    // Managing Org
    managing_org_name: '',
    license_number: '',
    // Services
    selectedServices: [] as string[],
  });

  const { createFacility } = useFacilityData();
  const { types: facilityTypes } = useFacilityTypes();
  const { types: ownershipTypes } = useFacilityOwnershipTypes();
  const { hierarchies: provinces } = useFacilityAdminHierarchies(1);
  const { categories: serviceCategories } = useFacilityServiceCategories();

  const updateFormData = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const facility = await createFacility({
        name: formData.name,
        short_name: formData.short_name || undefined,
        facility_type_id: formData.facility_type_id || undefined,
        ownership_type_id: formData.ownership_type_id || undefined,
        operational_status: formData.operational_status,
        admin_hierarchy_id: formData.admin_hierarchy_id || undefined,
        physical_address: formData.physical_address || undefined,
        city: formData.city || undefined,
        postal_code: formData.postal_code || undefined,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        phone: formData.phone || undefined,
        phone_alt: formData.phone_alt || undefined,
        email: formData.email || undefined,
        website: formData.website || undefined,
        is_24hr: formData.is_24hr,
        bed_count: formData.bed_count ? parseInt(formData.bed_count) : undefined,
        cot_count: formData.cot_count ? parseInt(formData.cot_count) : undefined,
        has_electricity: formData.has_electricity,
        has_water: formData.has_water,
        has_internet: formData.has_internet,
        managing_org_name: formData.managing_org_name || undefined,
        license_number: formData.license_number || undefined,
      });

      if (facility) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error registering facility:', error);
      toast.error('Failed to register facility');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim() !== '';
      case 2:
        return true; // Location is optional
      case 3:
        return true; // Contact is optional
      case 4:
        return true; // Infrastructure is optional
      case 5:
        return true; // Review step
      default:
        return true;
    }
  };

  const getSelectedTypeName = () => 
    facilityTypes.find(t => t.id === formData.facility_type_id)?.name || 'Not selected';
  
  const getSelectedOwnershipName = () => 
    ownershipTypes.find(t => t.id === formData.ownership_type_id)?.name || 'Not selected';

  const getSelectedProvinceName = () => 
    provinces.find(p => p.id === formData.admin_hierarchy_id)?.name || 'Not selected';

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div 
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                currentStep >= step.id 
                  ? "bg-primary border-primary text-primary-foreground" 
                  : "border-muted-foreground/30 text-muted-foreground"
              )}
            >
              <step.icon className="h-5 w-5" />
            </div>
            <div className="ml-2 hidden sm:block">
              <p className={cn(
                "text-sm font-medium",
                currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
              )}>
                {step.title}
              </p>
            </div>
            {index < STEPS.length - 1 && (
              <div className={cn(
                "w-12 h-0.5 mx-2",
                currentStep > step.id ? "bg-primary" : "bg-muted"
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <p className="text-sm text-muted-foreground">
                Enter the facility's core identification details.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="name">Facility Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    placeholder="e.g., Harare Central Hospital"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="short_name">Short Name</Label>
                  <Input
                    id="short_name"
                    value={formData.short_name}
                    onChange={(e) => updateFormData('short_name', e.target.value)}
                    placeholder="e.g., Harare Central"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="operational_status">Operational Status</Label>
                  <Select 
                    value={formData.operational_status} 
                    onValueChange={(v) => updateFormData('operational_status', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="operational">Operational</SelectItem>
                      <SelectItem value="temporarily_closed">Temporarily Closed</SelectItem>
                      <SelectItem value="permanently_closed">Permanently Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facility_type">Facility Type</Label>
                  <Select 
                    value={formData.facility_type_id} 
                    onValueChange={(v) => updateFormData('facility_type_id', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {facilityTypes.map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownership">Ownership / Authority</Label>
                  <Select 
                    value={formData.ownership_type_id} 
                    onValueChange={(v) => updateFormData('ownership_type_id', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ownership" />
                    </SelectTrigger>
                    <SelectContent>
                      {ownershipTypes.map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Location</h3>
              <p className="text-sm text-muted-foreground">
                Specify the facility's geographic location.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="province">Province</Label>
                  <Select 
                    value={formData.admin_hierarchy_id} 
                    onValueChange={(v) => updateFormData('admin_hierarchy_id', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City / Town</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => updateFormData('city', e.target.value)}
                    placeholder="e.g., Harare"
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="address">Physical Address</Label>
                  <Textarea
                    id="address"
                    value={formData.physical_address}
                    onChange={(e) => updateFormData('physical_address', e.target.value)}
                    placeholder="Street address, building, etc."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postal_code">Postal Code</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => updateFormData('postal_code', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>GPS Coordinates</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Latitude"
                      value={formData.latitude}
                      onChange={(e) => updateFormData('latitude', e.target.value)}
                    />
                    <Input
                      placeholder="Longitude"
                      value={formData.longitude}
                      onChange={(e) => updateFormData('longitude', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Contact & Operations */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contact & Operations</h3>
              <p className="text-sm text-muted-foreground">
                Contact details and operating information.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    placeholder="+263..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_alt">Alternative Phone</Label>
                  <Input
                    id="phone_alt"
                    value={formData.phone_alt}
                    onChange={(e) => updateFormData('phone_alt', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => updateFormData('website', e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div className="col-span-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_24hr"
                      checked={formData.is_24hr}
                      onCheckedChange={(v) => updateFormData('is_24hr', v)}
                    />
                    <Label htmlFor="is_24hr">24/7 Service Availability</Label>
                  </div>
                </div>

                <Separator className="col-span-2" />

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="managing_org">Managing Organization</Label>
                  <Input
                    id="managing_org"
                    value={formData.managing_org_name}
                    onChange={(e) => updateFormData('managing_org_name', e.target.value)}
                    placeholder="Organization responsible for facility"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="license">License Number</Label>
                  <Input
                    id="license"
                    value={formData.license_number}
                    onChange={(e) => updateFormData('license_number', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Infrastructure */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Infrastructure & Services</h3>
              <p className="text-sm text-muted-foreground">
                Facility capacity and infrastructure details.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bed_count">Number of Beds</Label>
                  <Input
                    id="bed_count"
                    type="number"
                    value={formData.bed_count}
                    onChange={(e) => updateFormData('bed_count', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cot_count">Number of Cots</Label>
                  <Input
                    id="cot_count"
                    type="number"
                    value={formData.cot_count}
                    onChange={(e) => updateFormData('cot_count', e.target.value)}
                  />
                </div>

                <div className="col-span-2 space-y-3">
                  <Label>Basic Infrastructure</Label>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_electricity"
                        checked={formData.has_electricity}
                        onCheckedChange={(v) => updateFormData('has_electricity', v)}
                      />
                      <Label htmlFor="has_electricity">Electricity</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_water"
                        checked={formData.has_water}
                        onCheckedChange={(v) => updateFormData('has_water', v)}
                      />
                      <Label htmlFor="has_water">Running Water</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_internet"
                        checked={formData.has_internet}
                        onCheckedChange={(v) => updateFormData('has_internet', v)}
                      />
                      <Label htmlFor="has_internet">Internet Access</Label>
                    </div>
                  </div>
                </div>

                <Separator className="col-span-2" />

                <div className="col-span-2 space-y-3">
                  <Label>Services Offered</Label>
                  <div className="flex flex-wrap gap-2">
                    {serviceCategories.slice(0, 12).map(cat => (
                      <Badge
                        key={cat.id}
                        variant={formData.selectedServices.includes(cat.id) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          if (formData.selectedServices.includes(cat.id)) {
                            updateFormData('selectedServices', formData.selectedServices.filter(s => s !== cat.id));
                          } else {
                            updateFormData('selectedServices', [...formData.selectedServices, cat.id]);
                          }
                        }}
                      >
                        {cat.name}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Click to select services. You can add more after registration.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Review & Submit</h3>
              <p className="text-sm text-muted-foreground">
                Review the information before submitting.
              </p>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Basic Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{formData.name || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span>{getSelectedTypeName()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ownership:</span>
                      <span>{getSelectedOwnershipName()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="outline">{formData.operational_status}</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Location</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Province:</span>
                      <span>{getSelectedProvinceName()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">City:</span>
                      <span>{formData.city || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Address:</span>
                      <span className="text-right max-w-[200px] truncate">{formData.physical_address || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Contact</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone:</span>
                      <span>{formData.phone || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span>{formData.email || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">24/7:</span>
                      <span>{formData.is_24hr ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Infrastructure</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Beds:</span>
                      <span>{formData.bed_count || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Electricity:</span>
                      <span>{formData.has_electricity ? '✓' : '✗'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Water:</span>
                      <span>{formData.has_water ? '✓' : '✗'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Internet:</span>
                      <span>{formData.has_internet ? '✓' : '✗'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {formData.selectedServices.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Selected Services</h4>
                  <div className="flex flex-wrap gap-2">
                    {formData.selectedServices.map(id => {
                      const cat = serviceCategories.find(c => c.id === id);
                      return cat ? <Badge key={id} variant="secondary">{cat.name}</Badge> : null;
                    })}
                  </div>
                </div>
              )}

              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Note:</strong> The facility will be saved as a draft. You can submit it for approval after reviewing.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={currentStep === 1 ? onCancel : handleBack}>
          {currentStep === 1 ? 'Cancel' : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </>
          )}
        </Button>
        
        {currentStep < STEPS.length ? (
          <Button onClick={handleNext} disabled={!isStepValid()}>
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Saving...' : 'Save as Draft'}
          </Button>
        )}
      </div>
    </div>
  );
};
