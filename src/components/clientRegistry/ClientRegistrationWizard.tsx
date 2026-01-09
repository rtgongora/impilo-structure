/**
 * Client Registration Wizard
 * Multi-step form for registering new clients
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  User, 
  MapPin, 
  Phone, 
  CreditCard,
  Users,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientRegistrationWizardProps {
  onSuccess: () => void;
  onCancel: () => void;
  createClient: (client: {
    given_names: string;
    family_name: string;
    sex: 'male' | 'female' | 'other' | 'unknown';
    date_of_birth?: string;
    [key: string]: unknown;
  }) => Promise<unknown>;
}

const STEPS = [
  { id: 'identity', label: 'Identity', icon: User },
  { id: 'demographics', label: 'Demographics', icon: MapPin },
  { id: 'contact', label: 'Contact', icon: Phone },
  { id: 'identifiers', label: 'Identifiers', icon: CreditCard },
  { id: 'relationships', label: 'Relationships', icon: Users },
  { id: 'confirm', label: 'Confirm', icon: CheckCircle },
];

export function ClientRegistrationWizard({ 
  onSuccess, 
  onCancel,
  createClient 
}: ClientRegistrationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    // Identity
    given_names: '',
    family_name: '',
    other_names: '',
    sex: '' as 'male' | 'female' | 'other' | 'unknown' | '',
    date_of_birth: '',
    estimated_dob: false,
    dob_confidence: 'exact' as 'exact' | 'year_month' | 'year_only' | 'estimated',
    
    // Demographics
    place_of_birth: '',
    nationality: 'ZW',
    
    // Address
    address_line1: '',
    village: '',
    ward: '',
    district: '',
    province: '',
    
    // Contact
    phone_primary: '',
    phone_secondary: '',
    email: '',
    
    // Identifiers
    national_id: '',
    passport: '',
    birth_registration: '',
    
    // Relationships
    next_of_kin_name: '',
    next_of_kin_phone: '',
    next_of_kin_relationship: '',
  });

  const updateField = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!formData.given_names || !formData.family_name || !formData.sex) {
      return;
    }
    
    setLoading(true);
    try {
      await createClient({
        given_names: formData.given_names,
        family_name: formData.family_name,
        other_names: formData.other_names || undefined,
        sex: formData.sex as 'male' | 'female' | 'other' | 'unknown',
        date_of_birth: formData.date_of_birth || undefined,
        estimated_dob: formData.estimated_dob,
        dob_confidence: formData.estimated_dob ? formData.dob_confidence : 'exact',
        place_of_birth: formData.place_of_birth || undefined,
        nationality: formData.nationality,
        address_line1: formData.address_line1 || undefined,
        village: formData.village || undefined,
        ward: formData.ward || undefined,
        district: formData.district || undefined,
        province: formData.province || undefined,
        phone_primary: formData.phone_primary || undefined,
        phone_secondary: formData.phone_secondary || undefined,
        email: formData.email || undefined,
        lifecycle_state: 'draft',
      });
      onSuccess();
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const provinces = [
    'Harare', 'Bulawayo', 'Manicaland', 'Mashonaland Central',
    'Mashonaland East', 'Mashonaland West', 'Masvingo',
    'Matabeleland North', 'Matabeleland South', 'Midlands',
  ];

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Identity
        return formData.given_names && formData.family_name && formData.sex;
      case 5: // Confirm
        return formData.given_names && formData.family_name && formData.sex;
      default:
        return true;
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors",
                index < currentStep
                  ? "bg-primary border-primary text-primary-foreground"
                  : index === currentStep
                  ? "border-primary text-primary"
                  : "border-muted-foreground/30 text-muted-foreground/50"
              )}
            >
              {index < currentStep ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <step.icon className="h-4 w-4" />
              )}
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  "w-12 h-0.5 mx-2",
                  index < currentStep ? "bg-primary" : "bg-muted-foreground/30"
                )}
              />
            )}
          </div>
        ))}
      </div>
      <p className="text-center text-sm text-muted-foreground">
        Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].label}
      </p>

      {/* Step Content */}
      <div className="min-h-[300px]">
        {/* Step 1: Identity */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Given Names *</Label>
                <Input
                  placeholder="First and middle names"
                  value={formData.given_names}
                  onChange={(e) => updateField('given_names', e.target.value)}
                />
              </div>
              <div>
                <Label>Family Name *</Label>
                <Input
                  placeholder="Surname"
                  value={formData.family_name}
                  onChange={(e) => updateField('family_name', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Other Names</Label>
              <Input
                placeholder="Alias, nickname, etc."
                value={formData.other_names}
                onChange={(e) => updateField('other_names', e.target.value)}
              />
            </div>
            <div>
              <Label>Sex *</Label>
              <RadioGroup
                value={formData.sex}
                onValueChange={(v) => updateField('sex', v)}
                className="flex gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female">Female</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other">Other</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="unknown" id="unknown" />
                  <Label htmlFor="unknown">Unknown</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => updateField('date_of_birth', e.target.value)}
                />
              </div>
              <div className="flex items-end gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="estimated"
                    checked={formData.estimated_dob}
                    onCheckedChange={(v) => updateField('estimated_dob', v)}
                  />
                  <Label htmlFor="estimated">Estimated DOB</Label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Demographics */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Place of Birth</Label>
              <Input
                placeholder="City or village of birth"
                value={formData.place_of_birth}
                onChange={(e) => updateField('place_of_birth', e.target.value)}
              />
            </div>
            <div>
              <Label>Nationality</Label>
              <Select value={formData.nationality} onValueChange={(v) => updateField('nationality', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select nationality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ZW">Zimbabwe</SelectItem>
                  <SelectItem value="ZA">South Africa</SelectItem>
                  <SelectItem value="MZ">Mozambique</SelectItem>
                  <SelectItem value="ZM">Zambia</SelectItem>
                  <SelectItem value="BW">Botswana</SelectItem>
                  <SelectItem value="MW">Malawi</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Address Line 1</Label>
              <Input
                placeholder="Street address or stand number"
                value={formData.address_line1}
                onChange={(e) => updateField('address_line1', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Village/Suburb</Label>
                <Input
                  placeholder="Village or suburb"
                  value={formData.village}
                  onChange={(e) => updateField('village', e.target.value)}
                />
              </div>
              <div>
                <Label>Ward</Label>
                <Input
                  placeholder="Ward"
                  value={formData.ward}
                  onChange={(e) => updateField('ward', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>District</Label>
                <Input
                  placeholder="District"
                  value={formData.district}
                  onChange={(e) => updateField('district', e.target.value)}
                />
              </div>
              <div>
                <Label>Province</Label>
                <Select value={formData.province} onValueChange={(v) => updateField('province', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select province" />
                  </SelectTrigger>
                  <SelectContent>
                    {provinces.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Contact */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <Label>Primary Phone</Label>
              <Input
                type="tel"
                placeholder="+263 77 123 4567"
                value={formData.phone_primary}
                onChange={(e) => updateField('phone_primary', e.target.value)}
              />
            </div>
            <div>
              <Label>Secondary Phone</Label>
              <Input
                type="tel"
                placeholder="Alternative number"
                value={formData.phone_secondary}
                onChange={(e) => updateField('phone_secondary', e.target.value)}
              />
            </div>
            <div>
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Step 4: Identifiers */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add any official identification documents. These help with de-duplication and verification.
            </p>
            <div>
              <Label>National ID Number</Label>
              <Input
                placeholder="e.g., 63-123456-A-78"
                value={formData.national_id}
                onChange={(e) => updateField('national_id', e.target.value)}
              />
            </div>
            <div>
              <Label>Passport Number</Label>
              <Input
                placeholder="Passport number if available"
                value={formData.passport}
                onChange={(e) => updateField('passport', e.target.value)}
              />
            </div>
            <div>
              <Label>Birth Registration Number</Label>
              <Input
                placeholder="Birth certificate number"
                value={formData.birth_registration}
                onChange={(e) => updateField('birth_registration', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Step 5: Relationships */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Record next of kin and emergency contacts.
            </p>
            <div>
              <Label>Next of Kin Name</Label>
              <Input
                placeholder="Full name"
                value={formData.next_of_kin_name}
                onChange={(e) => updateField('next_of_kin_name', e.target.value)}
              />
            </div>
            <div>
              <Label>Next of Kin Phone</Label>
              <Input
                type="tel"
                placeholder="Contact number"
                value={formData.next_of_kin_phone}
                onChange={(e) => updateField('next_of_kin_phone', e.target.value)}
              />
            </div>
            <div>
              <Label>Relationship</Label>
              <Select 
                value={formData.next_of_kin_relationship} 
                onValueChange={(v) => updateField('next_of_kin_relationship', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spouse">Spouse</SelectItem>
                  <SelectItem value="mother">Mother</SelectItem>
                  <SelectItem value="father">Father</SelectItem>
                  <SelectItem value="sibling">Sibling</SelectItem>
                  <SelectItem value="child">Child</SelectItem>
                  <SelectItem value="guardian">Guardian</SelectItem>
                  <SelectItem value="next_of_kin">Next of Kin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 6: Confirm */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-semibold mb-3">Registration Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Full Name</p>
                  <p className="font-medium">{formData.given_names} {formData.family_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Sex</p>
                  <p className="font-medium capitalize">{formData.sex}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">
                    {formData.date_of_birth || 'Not provided'}
                    {formData.estimated_dob && ' (estimated)'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{formData.phone_primary || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Province</p>
                  <p className="font-medium">{formData.province || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">National ID</p>
                  <p className="font-medium">{formData.national_id || 'Not provided'}</p>
                </div>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> The client will be registered in <strong>Draft</strong> status. 
                A Health ID will be generated automatically. Activate the record after verification.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={currentStep === 0 ? onCancel : handleBack}>
          {currentStep === 0 ? 'Cancel' : (
            <>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </>
          )}
        </Button>
        {currentStep < STEPS.length - 1 ? (
          <Button onClick={handleNext} disabled={!canProceed()}>
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={!canProceed() || loading}>
            {loading ? 'Registering...' : 'Register Client'}
          </Button>
        )}
      </div>
    </div>
  );
}
