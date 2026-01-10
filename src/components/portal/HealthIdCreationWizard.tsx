/**
 * Health ID Self-Service Creation Wizard
 * Allows patients to request Health ID creation through the portal
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  ArrowRight, 
  User, 
  Phone, 
  Shield, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

interface HealthIdCreationWizardProps {
  onComplete: () => void;
  onCancel: () => void;
}

type Step = 'intro' | 'personal' | 'contact' | 'verify' | 'consent' | 'complete';

interface FormData {
  givenNames: string;
  familyName: string;
  dateOfBirth: string;
  sex: string;
  nationalId: string;
  phonePrimary: string;
  email: string;
  province: string;
  district: string;
  consentGiven: boolean;
  dataUsageAgreed: boolean;
}

const STEPS: { key: Step; label: string; description: string }[] = [
  { key: 'intro', label: 'Welcome', description: 'Introduction to Health ID' },
  { key: 'personal', label: 'Personal Info', description: 'Basic personal details' },
  { key: 'contact', label: 'Contact', description: 'Contact information' },
  { key: 'verify', label: 'Verify', description: 'Phone verification' },
  { key: 'consent', label: 'Consent', description: 'Terms and consent' },
  { key: 'complete', label: 'Complete', description: 'Registration complete' },
];

const PROVINCES = [
  'Bulawayo',
  'Harare',
  'Manicaland',
  'Mashonaland Central',
  'Mashonaland East',
  'Mashonaland West',
  'Masvingo',
  'Matabeleland North',
  'Matabeleland South',
  'Midlands',
];

export function HealthIdCreationWizard({ onComplete, onCancel }: HealthIdCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>('intro');
  const [formData, setFormData] = useState<FormData>({
    givenNames: '',
    familyName: '',
    dateOfBirth: '',
    sex: '',
    nationalId: '',
    phonePrimary: '',
    email: '',
    province: '',
    district: '',
    consentGiven: false,
    dataUsageAgreed: false,
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedHealthId, setGeneratedHealthId] = useState<string | null>(null);

  const currentStepIndex = STEPS.findIndex(s => s.key === currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const updateFormData = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    const stepIndex = STEPS.findIndex(s => s.key === currentStep);
    if (stepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[stepIndex + 1].key);
    }
  };

  const handleBack = () => {
    const stepIndex = STEPS.findIndex(s => s.key === currentStep);
    if (stepIndex > 0) {
      setCurrentStep(STEPS[stepIndex - 1].key);
    }
  };

  const handleSendOtp = async () => {
    if (!formData.phonePrimary) {
      toast.error('Please enter a phone number');
      return;
    }
    setLoading(true);
    // Simulate OTP send
    await new Promise(resolve => setTimeout(resolve, 1500));
    setOtpSent(true);
    setLoading(false);
    toast.success('Verification code sent to your phone');
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }
    setLoading(true);
    // Simulate OTP verification
    await new Promise(resolve => setTimeout(resolve, 1000));
    setOtpVerified(true);
    setLoading(false);
    toast.success('Phone number verified');
    handleNext();
  };

  const handleSubmit = async () => {
    if (!formData.consentGiven || !formData.dataUsageAgreed) {
      toast.error('Please accept all required consents');
      return;
    }
    
    setLoading(true);
    // Simulate Health ID creation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate a mock Health ID
    const randomNum = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
    const checksum = 'ABCD';
    const healthId = `HID-${randomNum}-${checksum}-1`;
    setGeneratedHealthId(healthId);
    setLoading(false);
    setCurrentStep('complete');
    toast.success('Health ID created successfully!');
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'intro':
        return true;
      case 'personal':
        return formData.givenNames && formData.familyName && formData.dateOfBirth && formData.sex;
      case 'contact':
        return formData.phonePrimary;
      case 'verify':
        return otpVerified;
      case 'consent':
        return formData.consentGiven && formData.dataUsageAgreed;
      default:
        return true;
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Create Your Health ID</CardTitle>
            <CardDescription>{STEPS[currentStepIndex]?.description}</CardDescription>
          </div>
          <Badge variant="outline">
            Step {currentStepIndex + 1} of {STEPS.length}
          </Badge>
        </div>
        <Progress value={progress} className="mt-4" />
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Step: Intro */}
        {currentStep === 'intro' && (
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h3 className="font-semibold flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-primary" />
                What is a Health ID?
              </h3>
              <p className="text-sm text-muted-foreground">
                Your Health ID is a unique identifier that links all your health records across 
                different healthcare facilities. It ensures continuity of care and helps 
                healthcare providers access your medical history when needed.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">With your Health ID, you can:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-success mt-0.5" />
                  <span>Check in at any health facility using your QR code</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-success mt-0.5" />
                  <span>Access your health records from anywhere</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-success mt-0.5" />
                  <span>Book appointments and join queues remotely</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-success mt-0.5" />
                  <span>Receive test results and follow-up notifications</span>
                </li>
              </ul>
            </div>

            <div className="p-3 bg-muted rounded-lg flex items-start gap-2">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> Some services may require in-person verification at a 
                healthcare facility. You will be notified if additional verification is needed.
              </p>
            </div>
          </div>
        )}

        {/* Step: Personal Info */}
        {currentStep === 'personal' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="givenNames">Given Names *</Label>
                <Input
                  id="givenNames"
                  value={formData.givenNames}
                  onChange={(e) => updateFormData('givenNames', e.target.value)}
                  placeholder="First and middle names"
                />
              </div>
              <div>
                <Label htmlFor="familyName">Family Name *</Label>
                <Input
                  id="familyName"
                  value={formData.familyName}
                  onChange={(e) => updateFormData('familyName', e.target.value)}
                  placeholder="Surname"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
              />
            </div>

            <div>
              <Label>Sex *</Label>
              <RadioGroup
                value={formData.sex}
                onValueChange={(value) => updateFormData('sex', value)}
                className="flex gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male" className="font-normal">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female" className="font-normal">Female</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="nationalId">National ID (Optional)</Label>
              <Input
                id="nationalId"
                value={formData.nationalId}
                onChange={(e) => updateFormData('nationalId', e.target.value)}
                placeholder="e.g., 63-123456A78"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Providing your National ID speeds up verification
              </p>
            </div>
          </div>
        )}

        {/* Step: Contact */}
        {currentStep === 'contact' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="phonePrimary">Phone Number *</Label>
              <Input
                id="phonePrimary"
                value={formData.phonePrimary}
                onChange={(e) => updateFormData('phonePrimary', e.target.value)}
                placeholder="+263 77 123 4567"
              />
              <p className="text-xs text-muted-foreground mt-1">
                We'll send a verification code to this number
              </p>
            </div>

            <div>
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <Label htmlFor="province">Province</Label>
              <select
                id="province"
                value={formData.province}
                onChange={(e) => updateFormData('province', e.target.value)}
                className="w-full h-10 px-3 border border-input bg-background rounded-md text-sm"
              >
                <option value="">Select province</option>
                {PROVINCES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="district">District</Label>
              <Input
                id="district"
                value={formData.district}
                onChange={(e) => updateFormData('district', e.target.value)}
                placeholder="e.g., Harare Urban"
              />
            </div>
          </div>
        )}

        {/* Step: Verify */}
        {currentStep === 'verify' && (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg flex items-center gap-3">
              <Phone className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">Verify your phone number</p>
                <p className="text-sm text-muted-foreground">{formData.phonePrimary}</p>
              </div>
            </div>

            {!otpSent ? (
              <Button onClick={handleSendOtp} disabled={loading} className="w-full">
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Send Verification Code
              </Button>
            ) : !otpVerified ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="otp">Enter the 6-digit code</Label>
                  <Input
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="text-center text-2xl font-mono tracking-widest"
                    maxLength={6}
                  />
                </div>
                <Button onClick={handleVerifyOtp} disabled={loading || otp.length !== 6} className="w-full">
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Verify Code
                </Button>
                <Button variant="ghost" onClick={handleSendOtp} disabled={loading} className="w-full">
                  Resend Code
                </Button>
              </div>
            ) : (
              <div className="p-4 bg-success/10 border border-success/20 rounded-lg flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-success" />
                <div>
                  <p className="font-medium text-success">Phone verified!</p>
                  <p className="text-sm text-muted-foreground">Continue to the next step</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step: Consent */}
        {currentStep === 'consent' && (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="consent"
                  checked={formData.consentGiven}
                  onCheckedChange={(checked) => updateFormData('consentGiven', checked as boolean)}
                />
                <div className="space-y-1">
                  <Label htmlFor="consent" className="font-medium">
                    I consent to the creation of my Health ID *
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    I understand that my Health ID will be used to link my health records across 
                    healthcare facilities for continuity of care.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="dataUsage"
                  checked={formData.dataUsageAgreed}
                  onCheckedChange={(checked) => updateFormData('dataUsageAgreed', checked as boolean)}
                />
                <div className="space-y-1">
                  <Label htmlFor="dataUsage" className="font-medium">
                    I agree to the data usage terms *
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    My data will be handled in accordance with the Health Information Privacy 
                    regulations. I can request access to or correction of my data at any time.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">
                <AlertCircle className="h-3 w-3 inline mr-1" />
                By proceeding, you confirm that the information provided is accurate. 
                Providing false information may affect your access to health services.
              </p>
            </div>
          </div>
        )}

        {/* Step: Complete */}
        {currentStep === 'complete' && generatedHealthId && (
          <div className="space-y-4 text-center">
            <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>

            <div>
              <h3 className="text-xl font-semibold">Health ID Created!</h3>
              <p className="text-muted-foreground">
                Your Health ID has been successfully created
              </p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Your Health ID</p>
              <p className="font-mono text-xl font-bold">{generatedHealthId}</p>
            </div>

            <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg text-left">
              <p className="text-sm">
                <AlertCircle className="h-4 w-4 inline mr-1 text-warning" />
                <strong>Status: Pending Verification</strong>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Visit a health facility with your National ID to complete verification 
                and unlock all features.
              </p>
            </div>

            <Button onClick={onComplete} className="w-full">
              View My Health ID
            </Button>
          </div>
        )}

        {/* Navigation Buttons */}
        {currentStep !== 'complete' && (
          <div className="flex justify-between pt-4 border-t">
            {currentStep === 'intro' ? (
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            ) : (
              <Button variant="ghost" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}

            {currentStep === 'consent' ? (
              <Button onClick={handleSubmit} disabled={!canProceed() || loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Health ID
              </Button>
            ) : currentStep !== 'verify' ? (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Continue
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
