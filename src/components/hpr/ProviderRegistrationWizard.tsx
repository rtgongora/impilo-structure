/**
 * Provider Registration Wizard - Multi-step registration for new health providers
 * Captures all required information including documents, licenses, and initial affiliation
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  User,
  GraduationCap,
  Building,
  FileText,
  CheckCircle,
  Upload,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Award,
  Briefcase,
} from 'lucide-react';
import { PROVIDER_CADRES } from '@/types/hpr';
import { HPRService } from '@/services/hprService';

interface ProviderRegistrationWizardProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  // Step 1: Personal Information
  first_name: string;
  surname: string;
  other_names: string;
  date_of_birth: string;
  sex: 'male' | 'female' | 'other';
  national_id: string;
  passport_number: string;
  nationality: string;
  marital_status: string;
  address_line1: string;
  city: string;
  province: string;
  email: string;
  phone: string;
  
  // Step 2: Professional Information
  cadre: string;
  specialty: string;
  council_id: string;
  registration_number: string;
  registration_date: string;
  registration_expires: string;
  license_category: string;
  
  // Step 3: Education & Qualifications
  qualifications: Array<{
    qualification_name: string;
    institution: string;
    year_obtained: string;
    country: string;
  }>;
  
  // Step 4: Initial Facility Affiliation
  facility_id: string;
  facility_name: string;
  position: string;
  department: string;
  start_date: string;
  employment_type: string;
  
  // Step 5: Documents
  documents: Array<{
    document_type: string;
    file?: File;
    document_number?: string;
    issue_date?: string;
    expiry_date?: string;
  }>;
}

const STEPS = [
  { id: 1, title: 'Personal Info', icon: User },
  { id: 2, title: 'Professional', icon: Award },
  { id: 3, title: 'Education', icon: GraduationCap },
  { id: 4, title: 'Affiliation', icon: Building },
  { id: 5, title: 'Documents', icon: FileText },
  { id: 6, title: 'Review', icon: CheckCircle },
];

const MARITAL_STATUS_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
];

const EMPLOYMENT_TYPES = [
  { value: 'permanent', label: 'Permanent' },
  { value: 'contract', label: 'Contract' },
  { value: 'locum', label: 'Locum' },
  { value: 'volunteer', label: 'Volunteer' },
  { value: 'intern', label: 'Intern' },
];

const REQUIRED_DOCUMENTS = [
  { type: 'national_id', label: 'National ID', required: true },
  { type: 'professional_license', label: 'Professional License/Certificate', required: true },
  { type: 'degree_certificate', label: 'Degree/Diploma Certificate', required: true },
  { type: 'passport_photo', label: 'Passport Photo', required: true },
  { type: 'cv_resume', label: 'CV/Resume', required: false },
];

export function ProviderRegistrationWizard({ onSuccess, onCancel }: ProviderRegistrationWizardProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [councils, setCouncils] = useState<Array<{ id: string; code: string; name: string; abbreviation: string }>>([]);
  const [facilities, setFacilities] = useState<Array<{ id: string; name: string }>>([]);
  
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    surname: '',
    other_names: '',
    date_of_birth: '',
    sex: 'male',
    national_id: '',
    passport_number: '',
    nationality: 'Zimbabwean',
    marital_status: 'single',
    address_line1: '',
    city: '',
    province: '',
    email: '',
    phone: '',
    cadre: '',
    specialty: '',
    council_id: '',
    registration_number: '',
    registration_date: '',
    registration_expires: '',
    license_category: 'practitioner',
    qualifications: [{ qualification_name: '', institution: '', year_obtained: '', country: 'Zimbabwe' }],
    facility_id: '',
    facility_name: '',
    position: '',
    department: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    employment_type: 'permanent',
    documents: REQUIRED_DOCUMENTS.map(d => ({ document_type: d.type })),
  });

  useEffect(() => {
    loadReferenceData();
  }, []);

  const loadReferenceData = async () => {
    const [councilsResult, facilitiesResult] = await Promise.all([
      supabase.from('professional_councils').select('id, code, name, abbreviation').eq('is_active', true),
      supabase.from('facilities').select('id, name').eq('is_active', true).limit(100),
    ]);
    
    if (councilsResult.data) setCouncils(councilsResult.data);
    if (facilitiesResult.data) setFacilities(facilitiesResult.data);
  };

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.first_name && formData.surname && formData.date_of_birth && formData.sex);
      case 2:
        return !!(formData.cadre && formData.council_id && formData.registration_number);
      case 3:
        return formData.qualifications.length > 0 && formData.qualifications[0].qualification_name !== '';
      case 4:
        return true; // Optional
      case 5:
        return true; // Will validate on submit
      case 6:
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // 1. Create the provider
      const provider = await HPRService.createProvider({
        first_name: formData.first_name,
        surname: formData.surname,
        other_names: formData.other_names || undefined,
        date_of_birth: formData.date_of_birth,
        sex: formData.sex,
        national_id: formData.national_id || undefined,
        passport_number: formData.passport_number || undefined,
        cadre: formData.cadre,
        specialty: formData.specialty || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
      });

      // 2. Add license if council info provided
      if (formData.council_id && formData.registration_number) {
        const council = councils.find(c => c.id === formData.council_id);
        // @ts-ignore - provider_id exists in DB but types may not be synced
        await supabase.from('provider_licenses').insert({
          provider_id: provider.id,
          council_id: formData.council_id,
          council_name: council?.name || 'Unknown Council',
          license_category: formData.license_category || 'practitioner',
          registration_number: formData.registration_number,
          issue_date: formData.registration_date || format(new Date(), 'yyyy-MM-dd'),
          expiry_date: formData.registration_expires || format(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
          status: 'active',
        } as any);
      }

      // 3. Add education records
      for (const qual of formData.qualifications) {
        if (qual.qualification_name && qual.institution) {
          // @ts-ignore - provider_id exists in DB but types may not be synced
          await supabase.from('provider_education').insert({
            provider_id: provider.id,
            education_level: 'tertiary',
            degree_name: qual.qualification_name,
            institution_name: qual.institution,
            institution_country: qual.country || 'Zimbabwe',
            graduation_date: qual.year_obtained ? `${qual.year_obtained}-01-01` : null,
            status: 'completed',
          } as any);
        }
      }

      // 4. Add facility affiliation if provided
      if (formData.facility_id && formData.position) {
        // @ts-ignore - provider_id exists in DB but types may not be synced
        await supabase.from('provider_affiliations').insert({
          provider_id: provider.id,
          facility_id: formData.facility_id,
          facility_name: formData.facility_name || 'Facility',
          role: formData.position,
          department: formData.department || null,
          start_date: formData.start_date,
          employment_type: formData.employment_type || 'permanent',
          privileges: [],
          is_primary: true,
          is_active: true,
        } as any);
      }

      // 5. Upload documents
      for (const doc of formData.documents) {
        if (doc.file) {
          const filePath = `${provider.id}/${doc.document_type}_${Date.now()}_${doc.file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('provider-documents')
            .upload(filePath, doc.file);

          if (!uploadError) {
            const docInfo = REQUIRED_DOCUMENTS.find(d => d.type === doc.document_type);
            // @ts-ignore - provider_id exists in DB but types may not be synced
            await supabase.from('provider_documents').insert({
              provider_id: provider.id,
              document_type_code: doc.document_type,
              title: docInfo?.label || doc.document_type,
              file_name: doc.file.name,
              file_path: filePath,
              file_size: doc.file.size,
              mime_type: doc.file.type,
              document_number: doc.document_number || null,
              issue_date: doc.issue_date || null,
              expiry_date: doc.expiry_date || null,
              uploaded_by: user?.id,
            } as any);
          }
        }
      }

      toast.success('Provider registered successfully! UPID: ' + provider.upid);
      onSuccess();
    } catch (error) {
      console.error('Registration failed:', error);
      toast.error('Failed to register provider. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const addQualification = () => {
    updateField('qualifications', [
      ...formData.qualifications,
      { qualification_name: '', institution: '', year_obtained: '', country: 'Zimbabwe' }
    ]);
  };

  const updateQualification = (index: number, field: string, value: string) => {
    const updated = [...formData.qualifications];
    updated[index] = { ...updated[index], [field]: value };
    updateField('qualifications', updated);
  };

  const updateDocument = (index: number, field: string, value: any) => {
    const updated = [...formData.documents];
    updated[index] = { ...updated[index], [field]: value };
    updateField('documents', updated);
  };

  const handleFileUpload = (index: number, files: FileList | null) => {
    if (files && files[0]) {
      updateDocument(index, 'file', files[0]);
    }
  };

  const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            
            return (
              <div
                key={step.id}
                className={`flex flex-col items-center gap-1 ${
                  isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-muted-foreground'
                }`}
              >
                <div className={`p-2 rounded-full ${
                  isActive ? 'bg-primary text-primary-foreground' : 
                  isCompleted ? 'bg-green-600 text-white' : 'bg-muted'
                }`}>
                  {isCompleted ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span className="text-xs font-medium hidden md:block">{step.title}</span>
              </div>
            );
          })}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input
                  value={formData.first_name}
                  onChange={(e) => updateField('first_name', e.target.value)}
                  placeholder="First name"
                />
              </div>
              <div className="space-y-2">
                <Label>Surname *</Label>
                <Input
                  value={formData.surname}
                  onChange={(e) => updateField('surname', e.target.value)}
                  placeholder="Surname"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Other Names</Label>
              <Input
                value={formData.other_names}
                onChange={(e) => updateField('other_names', e.target.value)}
                placeholder="Middle names"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date of Birth *</Label>
                <Input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => updateField('date_of_birth', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Sex *</Label>
                <Select value={formData.sex} onValueChange={(v) => updateField('sex', v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>National ID</Label>
                <Input
                  value={formData.national_id}
                  onChange={(e) => updateField('national_id', e.target.value)}
                  placeholder="e.g., 63-123456-X-78"
                />
              </div>
              <div className="space-y-2">
                <Label>Passport Number</Label>
                <Input
                  value={formData.passport_number}
                  onChange={(e) => updateField('passport_number', e.target.value)}
                  placeholder="Passport number"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nationality</Label>
                <Input
                  value={formData.nationality}
                  onChange={(e) => updateField('nationality', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Marital Status</Label>
                <Select value={formData.marital_status} onValueChange={(v) => updateField('marital_status', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MARITAL_STATUS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={formData.address_line1}
                onChange={(e) => updateField('address_line1', e.target.value)}
                placeholder="Street address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City/Town</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  placeholder="City"
                />
              </div>
              <div className="space-y-2">
                <Label>Province</Label>
                <Input
                  value={formData.province}
                  onChange={(e) => updateField('province', e.target.value)}
                  placeholder="Province"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+263 77 123 4567"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Professional Information */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Award className="h-5 w-5" />
              Professional Information
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cadre/Profession *</Label>
                <Select value={formData.cadre} onValueChange={(v) => updateField('cadre', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select cadre" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDER_CADRES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Specialty</Label>
                <Input
                  value={formData.specialty}
                  onChange={(e) => updateField('specialty', e.target.value)}
                  placeholder="e.g., Cardiology, Pediatrics"
                />
              </div>
            </div>

            <Separator className="my-4" />
            <h4 className="font-medium">Professional Registration</h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Professional Council *</Label>
                <Select value={formData.council_id} onValueChange={(v) => updateField('council_id', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select council" />
                  </SelectTrigger>
                  <SelectContent>
                    {councils.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.abbreviation} - {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Registration Number *</Label>
                <Input
                  value={formData.registration_number}
                  onChange={(e) => updateField('registration_number', e.target.value)}
                  placeholder="Council registration number"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Registration Date</Label>
                <Input
                  type="date"
                  value={formData.registration_date}
                  onChange={(e) => updateField('registration_date', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={formData.registration_expires}
                  onChange={(e) => updateField('registration_expires', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>License Category</Label>
              <Select value={formData.license_category} onValueChange={(v) => updateField('license_category', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="practitioner">Practitioner</SelectItem>
                  <SelectItem value="specialist">Specialist</SelectItem>
                  <SelectItem value="intern">Intern</SelectItem>
                  <SelectItem value="temporary">Temporary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 3: Education & Qualifications */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Education & Qualifications
              </h3>
              <Button variant="outline" size="sm" onClick={addQualification}>
                Add Qualification
              </Button>
            </div>

            {formData.qualifications.map((qual, index) => (
              <Card key={index}>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Qualification/Degree *</Label>
                      <Input
                        value={qual.qualification_name}
                        onChange={(e) => updateQualification(index, 'qualification_name', e.target.value)}
                        placeholder="e.g., MBChB, BSc Nursing"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Institution *</Label>
                      <Input
                        value={qual.institution}
                        onChange={(e) => updateQualification(index, 'institution', e.target.value)}
                        placeholder="University/College name"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Year Obtained</Label>
                      <Input
                        type="number"
                        min="1950"
                        max={new Date().getFullYear()}
                        value={qual.year_obtained}
                        onChange={(e) => updateQualification(index, 'year_obtained', e.target.value)}
                        placeholder="Year"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Input
                        value={qual.country}
                        onChange={(e) => updateQualification(index, 'country', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Step 4: Initial Facility Affiliation */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Building className="h-5 w-5" />
              Initial Facility Affiliation
            </h3>
            <p className="text-sm text-muted-foreground">
              Optional: Link the provider to their primary facility. This can also be done later.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Facility</Label>
                <Select value={formData.facility_id} onValueChange={(v) => {
                  updateField('facility_id', v);
                  const fac = facilities.find(f => f.id === v);
                  if (fac) updateField('facility_name', fac.name);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select facility" />
                  </SelectTrigger>
                  <SelectContent>
                    {facilities.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Position/Role</Label>
                <Input
                  value={formData.position}
                  onChange={(e) => updateField('position', e.target.value)}
                  placeholder="e.g., Medical Officer, Staff Nurse"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department</Label>
                <Input
                  value={formData.department}
                  onChange={(e) => updateField('department', e.target.value)}
                  placeholder="e.g., Outpatients, Surgery"
                />
              </div>
              <div className="space-y-2">
                <Label>Employment Type</Label>
                <Select value={formData.employment_type} onValueChange={(v) => updateField('employment_type', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => updateField('start_date', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Step 5: Documents */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Supporting Documents
            </h3>
            <p className="text-sm text-muted-foreground">
              Upload scanned copies of required documents. Maximum 10MB per file.
            </p>

            <div className="space-y-4">
              {formData.documents.map((doc, index) => {
                const docInfo = REQUIRED_DOCUMENTS.find(d => d.type === doc.document_type);
                return (
                  <Card key={index}>
                    <CardContent className="pt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{docInfo?.label || doc.document_type}</h4>
                          {docInfo?.required && (
                            <Badge variant="secondary" className="text-xs">Required</Badge>
                          )}
                        </div>
                        {doc.file && (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {doc.file.name}
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileUpload(index, e.target.files)}
                            className="cursor-pointer"
                          />
                        </div>
                        <Input
                          placeholder="Document #"
                          value={doc.document_number || ''}
                          onChange={(e) => updateDocument(index, 'document_number', e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 6: Review */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Review & Submit
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p><strong>Name:</strong> {formData.first_name} {formData.other_names} {formData.surname}</p>
                  <p><strong>DOB:</strong> {formData.date_of_birth}</p>
                  <p><strong>Sex:</strong> {formData.sex}</p>
                  <p><strong>National ID:</strong> {formData.national_id || '-'}</p>
                  <p><strong>Email:</strong> {formData.email || '-'}</p>
                  <p><strong>Phone:</strong> {formData.phone || '-'}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Professional Information</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p><strong>Cadre:</strong> {PROVIDER_CADRES.find(c => c.value === formData.cadre)?.label || formData.cadre}</p>
                  <p><strong>Specialty:</strong> {formData.specialty || '-'}</p>
                  <p><strong>Council:</strong> {councils.find(c => c.id === formData.council_id)?.abbreviation || '-'}</p>
                  <p><strong>Registration #:</strong> {formData.registration_number}</p>
                  <p><strong>Expires:</strong> {formData.registration_expires || '-'}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Qualifications</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  {formData.qualifications.filter(q => q.qualification_name).map((q, i) => (
                    <p key={i}>{q.qualification_name} - {q.institution} ({q.year_obtained})</p>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Documents</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  {formData.documents.filter(d => d.file).map((d, i) => (
                    <p key={i} className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      {REQUIRED_DOCUMENTS.find(r => r.type === d.document_type)?.label}
                    </p>
                  ))}
                  {formData.documents.filter(d => !d.file).length > 0 && (
                    <p className="text-yellow-600 flex items-center gap-2 mt-2">
                      <AlertTriangle className="h-3 w-3" />
                      {formData.documents.filter(d => !d.file).length} documents not uploaded
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm">
                By submitting this registration, you confirm that all information provided is accurate and complete.
                The provider will be registered in <strong>Draft</strong> status pending council verification.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4 border-t">
        <div>
          {currentStep > 1 && (
            <Button variant="outline" onClick={prevStep}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          {currentStep < STEPS.length ? (
            <Button onClick={nextStep}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Submit Registration
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
