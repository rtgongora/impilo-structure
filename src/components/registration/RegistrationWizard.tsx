import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  MapPin, 
  Fingerprint, 
  FileCheck, 
  Shield, 
  ChevronRight, 
  ChevronLeft,
  Check,
  Phone,
  Mail,
  Calendar,
  Users,
  Home,
  Building,
  IdCard,
  Loader2,
  BadgeCheck,
  Copy,
  CheckCircle2,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BiometricCapture, BiometricData, BiometricSummary, BiometricType } from "./BiometricCapture";
import { ConsentCapture, ConsentData } from "./ConsentCapture";
import { DuplicateSearchStep } from "./DuplicateSearchStep";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { ClientRegistryService, BiometricUtils } from "@/services/registryServices";
import { toast } from "sonner";

interface RegistrationStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: RegistrationStep[] = [
  { id: "demographics", title: "Demographics", description: "Basic information", icon: User },
  { id: "contact", title: "Contact", description: "Address & phone", icon: MapPin },
  { id: "identity", title: "Identity", description: "ID documents", icon: IdCard },
  { id: "biometrics", title: "Biometrics", description: "Fingerprint, iris & facial", icon: Fingerprint },
  { id: "duplicate-check", title: "Duplicate Check", description: "Search for matches", icon: Search },
  { id: "consent", title: "Consent", description: "Data & treatment consent", icon: Shield },
  { id: "review", title: "Review", description: "Confirm details", icon: FileCheck },
  { id: "complete", title: "Complete", description: "Registration confirmed", icon: BadgeCheck },
];

interface ClientData {
  // Demographics
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  employmentStatus: string;
  occupation: string;
  
  // Contact
  phone: string;
  alternatePhone: string;
  email: string;
  address: string;
  city: string;
  district: string;
  postalCode: string;
  
  // Identity
  idType: string;
  idNumber: string;
  nationalId: string;
  
  // Next of Kin
  nokName: string;
  nokRelationship: string;
  nokPhone: string;
  
  // Biometrics
  biometrics: BiometricData[];
  
  // Consent
  consents: ConsentData[];
}

const initialClientData: ClientData = {
  firstName: "",
  middleName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  maritalStatus: "",
  employmentStatus: "",
  occupation: "",
  phone: "",
  alternatePhone: "",
  email: "",
  address: "",
  city: "",
  district: "",
  postalCode: "",
  idType: "",
  idNumber: "",
  nationalId: "",
  nokName: "",
  nokRelationship: "",
  nokPhone: "",
  biometrics: [],
  consents: [],
};

interface RegistrationWizardProps {
  onComplete?: (data: ClientData) => void;
  onCancel?: () => void;
}

export function RegistrationWizard({ onComplete, onCancel }: RegistrationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [clientData, setClientData] = useState<ClientData>(initialClientData);
  const [activeBiometric, setActiveBiometric] = useState<BiometricType>("fingerprint");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<{
    patientId: string;
    mrn: string;
    impiloId: string;
    mosipUin: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const updateField = (field: keyof ClientData, value: string) => {
    setClientData(prev => ({ ...prev, [field]: value }));
  };

  const handleBiometricCapture = (data: BiometricData) => {
    setClientData(prev => ({
      ...prev,
      biometrics: [...prev.biometrics.filter(b => b.type !== data.type), data]
    }));
  };

  const handleConsentUpdate = (consents: ConsentData[]) => {
    setClientData(prev => ({ ...prev, consents }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    
    try {
      // Step 1: Create patient record in database
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .insert({
          first_name: clientData.firstName,
          middle_name: clientData.middleName || null,
          last_name: clientData.lastName,
          date_of_birth: clientData.dateOfBirth,
          gender: clientData.gender,
          national_id: clientData.nationalId || null,
          phone_primary: clientData.phone,
          phone_secondary: clientData.alternatePhone || null,
          email: clientData.email || null,
          address_line1: clientData.address,
          city: clientData.city,
          province: clientData.district,
          postal_code: clientData.postalCode || null,
          emergency_contact_name: clientData.nokName,
          emergency_contact_phone: clientData.nokPhone,
          emergency_contact_relationship: clientData.nokRelationship,
          mrn: `MRN-${Date.now()}` // Temporary, will be replaced by trigger
        })
        .select()
        .single();

      if (patientError) throw patientError;

      // Step 2: Submit to Client Registry Service (MOSIP) and get Impilo ID
      toast.info('Registering with Client Registry...', { 
        description: 'Submitting to MOSIP for identity verification'
      });
      
      const registryResult = await ClientRegistryService.registerClient(
        patient.id,
        clientData.nationalId || undefined
      );

      // Step 3: Update patient_identifiers with biometric hashes if captured
      if (clientData.biometrics.length > 0) {
        const biometricUpdates: Record<string, string> = {};
        
        clientData.biometrics.forEach(bio => {
          const hashKey = `biometric_${bio.type}_hash`;
          biometricUpdates[hashKey] = bio.hash;
        });

        await supabase
          .from('patient_identifiers')
          .update({
            ...biometricUpdates,
            biometric_enrolled_at: new Date().toISOString(),
            verified_at: new Date().toISOString()
          })
          .eq('impilo_id', registryResult.impiloId);
      }

      // Step 4: Set the result and move to completion step
      setRegistrationResult({
        patientId: patient.id,
        mrn: patient.mrn,
        impiloId: registryResult.impiloId,
        mosipUin: registryResult.mosipUin
      });

      toast.success('Client registered successfully!', {
        description: `Impilo ID: ${registryResult.impiloId}`
      });

      // Move to completion step
      setCurrentStep(STEPS.length - 1);
      
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed', {
        description: error instanceof Error ? error.message : 'An error occurred'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    onComplete?.(clientData);
  };

  const renderStepContent = () => {
    const step = STEPS[currentStep];
    
    switch (step.id) {
      case "demographics":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={clientData.firstName}
                  onChange={(e) => updateField("firstName", e.target.value)}
                  placeholder="Enter first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="middleName">Middle Name</Label>
                <Input
                  id="middleName"
                  value={clientData.middleName}
                  onChange={(e) => updateField("middleName", e.target.value)}
                  placeholder="Enter middle name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={clientData.lastName}
                  onChange={(e) => updateField("lastName", e.target.value)}
                  placeholder="Enter last name"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="dob"
                    type="date"
                    value={clientData.dateOfBirth}
                    onChange={(e) => updateField("dateOfBirth", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Gender *</Label>
                <RadioGroup
                  value={clientData.gender}
                  onValueChange={(v) => updateField("gender", v)}
                  className="flex gap-4 pt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male" className="cursor-pointer">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female" className="cursor-pointer">Female</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="other" />
                    <Label htmlFor="other" className="cursor-pointer">Other</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="marital">Marital Status</Label>
                <Select value={clientData.maritalStatus} onValueChange={(v) => updateField("maritalStatus", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="employmentStatus">Employment Status</Label>
                <Select value={clientData.employmentStatus} onValueChange={(v) => updateField("employmentStatus", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employed">Employed (Full-time)</SelectItem>
                    <SelectItem value="employed_part_time">Employed (Part-time)</SelectItem>
                    <SelectItem value="self_employed">Self-Employed</SelectItem>
                    <SelectItem value="unemployed">Unemployed</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                    <SelectItem value="homemaker">Homemaker</SelectItem>
                    <SelectItem value="disabled">Unable to Work (Disability)</SelectItem>
                    <SelectItem value="informal">Informal Sector</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation</Label>
                <Select value={clientData.occupation} onValueChange={(v) => updateField("occupation", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select occupation" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {/* Healthcare */}
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">Healthcare</div>
                    <SelectItem value="doctor">Doctor / Physician</SelectItem>
                    <SelectItem value="nurse">Nurse</SelectItem>
                    <SelectItem value="pharmacist">Pharmacist</SelectItem>
                    <SelectItem value="lab_technician">Laboratory Technician</SelectItem>
                    <SelectItem value="community_health_worker">Community Health Worker</SelectItem>
                    <SelectItem value="midwife">Midwife</SelectItem>
                    {/* Education */}
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">Education</div>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="lecturer">Lecturer / Professor</SelectItem>
                    <SelectItem value="education_admin">Education Administrator</SelectItem>
                    {/* Agriculture */}
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">Agriculture</div>
                    <SelectItem value="farmer">Farmer</SelectItem>
                    <SelectItem value="farm_worker">Farm Worker</SelectItem>
                    <SelectItem value="agricultural_extension">Agricultural Extension Officer</SelectItem>
                    {/* Business & Finance */}
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">Business & Finance</div>
                    <SelectItem value="accountant">Accountant</SelectItem>
                    <SelectItem value="banker">Banker</SelectItem>
                    <SelectItem value="business_owner">Business Owner</SelectItem>
                    <SelectItem value="sales_representative">Sales Representative</SelectItem>
                    <SelectItem value="shop_keeper">Shop Keeper / Vendor</SelectItem>
                    {/* Trades & Construction */}
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">Trades & Construction</div>
                    <SelectItem value="carpenter">Carpenter</SelectItem>
                    <SelectItem value="electrician">Electrician</SelectItem>
                    <SelectItem value="plumber">Plumber</SelectItem>
                    <SelectItem value="builder">Builder / Mason</SelectItem>
                    <SelectItem value="mechanic">Mechanic</SelectItem>
                    <SelectItem value="welder">Welder</SelectItem>
                    {/* Transport */}
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">Transport</div>
                    <SelectItem value="driver">Driver</SelectItem>
                    <SelectItem value="pilot">Pilot</SelectItem>
                    <SelectItem value="transport_operator">Transport Operator</SelectItem>
                    {/* Public Service */}
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">Public Service</div>
                    <SelectItem value="civil_servant">Civil Servant</SelectItem>
                    <SelectItem value="police_officer">Police Officer</SelectItem>
                    <SelectItem value="soldier">Soldier / Military</SelectItem>
                    <SelectItem value="firefighter">Firefighter</SelectItem>
                    {/* Domestic & Service */}
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">Domestic & Service</div>
                    <SelectItem value="domestic_worker">Domestic Worker</SelectItem>
                    <SelectItem value="gardener">Gardener</SelectItem>
                    <SelectItem value="security_guard">Security Guard</SelectItem>
                    <SelectItem value="cleaner">Cleaner</SelectItem>
                    {/* Mining & Industry */}
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">Mining & Industry</div>
                    <SelectItem value="miner">Miner</SelectItem>
                    <SelectItem value="factory_worker">Factory Worker</SelectItem>
                    <SelectItem value="engineer">Engineer</SelectItem>
                    {/* Other */}
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">Other</div>
                    <SelectItem value="clergy">Clergy / Religious Leader</SelectItem>
                    <SelectItem value="artist">Artist / Musician</SelectItem>
                    <SelectItem value="journalist">Journalist / Media</SelectItem>
                    <SelectItem value="lawyer">Lawyer</SelectItem>
                    <SelectItem value="informal_trader">Informal Trader</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="not_applicable">Not Applicable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
        
      case "contact":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={clientData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="+263 77 123 4567"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="altPhone">Alternate Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="altPhone"
                    value={clientData.alternatePhone}
                    onChange={(e) => updateField("alternatePhone", e.target.value)}
                    placeholder="+263 77 123 4567"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={clientData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="email@example.com"
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Street Address *</Label>
              <div className="relative">
                <Home className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="address"
                  value={clientData.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  placeholder="123 Main Street"
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City/Town *</Label>
                <Input
                  id="city"
                  value={clientData.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="Harare"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">District/Province</Label>
                <Select value={clientData.district} onValueChange={(v) => updateField("district", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="harare">Harare</SelectItem>
                    <SelectItem value="bulawayo">Bulawayo</SelectItem>
                    <SelectItem value="mashonaland-east">Mashonaland East</SelectItem>
                    <SelectItem value="mashonaland-west">Mashonaland West</SelectItem>
                    <SelectItem value="manicaland">Manicaland</SelectItem>
                    <SelectItem value="masvingo">Masvingo</SelectItem>
                    <SelectItem value="midlands">Midlands</SelectItem>
                    <SelectItem value="matebeleland-north">Matabeleland North</SelectItem>
                    <SelectItem value="matebeleland-south">Matabeleland South</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal">Postal Code</Label>
                <Input
                  id="postal"
                  value={clientData.postalCode}
                  onChange={(e) => updateField("postalCode", e.target.value)}
                  placeholder="00263"
                />
              </div>
            </div>
            
            {/* Next of Kin */}
            <div className="border-t pt-6">
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Next of Kin / Emergency Contact
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nokName">Full Name *</Label>
                  <Input
                    id="nokName"
                    value={clientData.nokName}
                    onChange={(e) => updateField("nokName", e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nokRel">Relationship *</Label>
                  <Select value={clientData.nokRelationship} onValueChange={(v) => updateField("nokRelationship", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spouse">Spouse</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="child">Child</SelectItem>
                      <SelectItem value="sibling">Sibling</SelectItem>
                      <SelectItem value="guardian">Guardian</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nokPhone">Phone Number *</Label>
                  <Input
                    id="nokPhone"
                    value={clientData.nokPhone}
                    onChange={(e) => updateField("nokPhone", e.target.value)}
                    placeholder="+263 77 123 4567"
                  />
                </div>
              </div>
            </div>
          </div>
        );
        
      case "identity":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="idType">ID Document Type *</Label>
                <Select value={clientData.idType} onValueChange={(v) => updateField("idType", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ID type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="national-id">National ID</SelectItem>
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="drivers-license">Driver's License</SelectItem>
                    <SelectItem value="birth-certificate">Birth Certificate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="idNumber">ID Number *</Label>
                <div className="relative">
                  <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="idNumber"
                    value={clientData.idNumber}
                    onChange={(e) => updateField("idNumber", e.target.value)}
                    placeholder="Enter ID number"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nationalId">National Registration Number</Label>
              <Input
                id="nationalId"
                value={clientData.nationalId}
                onChange={(e) => updateField("nationalId", e.target.value)}
                placeholder="XX-XXXXXXX-X-XX"
              />
            </div>
            
            {/* ID Document Upload Area */}
            <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
              <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="font-medium mb-2">Upload ID Document</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop or click to upload a scanned copy of the ID document
              </p>
              <Button variant="outline">
                Select File
              </Button>
            </div>
          </div>
        );
        
      case "biometrics":
        return (
          <div className="space-y-6">
            {/* Biometric Type Selection */}
            <div className="flex gap-2 justify-center">
              {(["fingerprint", "iris", "facial"] as BiometricType[]).map((type) => {
                const isCaptured = clientData.biometrics.some(b => b.type === type);
                return (
                  <Button
                    key={type}
                    variant={activeBiometric === type ? "default" : "outline"}
                    onClick={() => setActiveBiometric(type)}
                    className={cn(
                      "relative",
                      isCaptured && "ring-2 ring-success ring-offset-2"
                    )}
                  >
                    {type === "fingerprint" && <Fingerprint className="w-4 h-4 mr-2" />}
                    {type === "iris" && <span className="w-4 h-4 mr-2">👁</span>}
                    {type === "facial" && <span className="w-4 h-4 mr-2">📷</span>}
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                    {isCaptured && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-success-foreground" />
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>
            
            {/* Active Capture Component */}
            <BiometricCapture
              type={activeBiometric}
              onCapture={handleBiometricCapture}
              required={activeBiometric === "fingerprint"}
              onSkip={() => {
                const nextTypes: BiometricType[] = ["fingerprint", "iris", "facial"];
                const currentIndex = nextTypes.indexOf(activeBiometric);
                if (currentIndex < nextTypes.length - 1) {
                  setActiveBiometric(nextTypes[currentIndex + 1]);
                }
              }}
            />
            
            {/* Summary of captured biometrics */}
            {clientData.biometrics.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Captured Biometrics</h4>
                <BiometricSummary captures={clientData.biometrics} />
              </div>
            )}
          </div>
        );

      case "duplicate-check":
        return (
          <DuplicateSearchStep
            clientData={{
              firstName: clientData.firstName,
              middleName: clientData.middleName,
              lastName: clientData.lastName,
              dateOfBirth: clientData.dateOfBirth,
              gender: clientData.gender,
              phone: clientData.phone,
              email: clientData.email,
              nationalId: clientData.nationalId,
              idNumber: clientData.idNumber,
            }}
            onNoDuplicates={() => nextStep()}
            onSelectExisting={(clientId, healthId) => {
              // Navigate to existing client - for now just show toast
              toast.info(`Existing client selected: ${healthId}`, {
                description: 'The client record will be used instead of creating a new one'
              });
              onCancel?.();
            }}
            onProceedAnyway={() => nextStep()}
          />
        );
        
      case "consent":
        return (
          <ConsentCapture
            consents={clientData.consents}
            onChange={handleConsentUpdate}
          />
        );
        
      case "review":
        return (
          <div className="space-y-6">
            {/* Demographics Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Demographics
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Full Name:</span>
                  <p className="font-medium">
                    {clientData.firstName} {clientData.middleName} {clientData.lastName}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Date of Birth:</span>
                  <p className="font-medium">{clientData.dateOfBirth || "Not provided"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Gender:</span>
                  <p className="font-medium capitalize">{clientData.gender || "Not provided"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">ID Number:</span>
                  <p className="font-medium">{clientData.idNumber || "Not provided"}</p>
                </div>
              </CardContent>
            </Card>
            
            {/* Contact Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <p className="font-medium">{clientData.phone || "Not provided"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <p className="font-medium">{clientData.email || "Not provided"}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Address:</span>
                  <p className="font-medium">
                    {clientData.address ? `${clientData.address}, ${clientData.city}` : "Not provided"}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Biometrics Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Fingerprint className="w-4 h-4" />
                  Biometric Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BiometricSummary captures={clientData.biometrics} />
              </CardContent>
            </Card>
            
            {/* Consent Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Consent Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  {clientData.consents.filter(c => c.granted).map(consent => (
                    <span 
                      key={consent.id}
                      className="px-2 py-1 bg-success/10 text-success text-xs rounded-full flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      {consent.category}
                    </span>
                  ))}
                  {clientData.consents.filter(c => c.granted).length === 0 && (
                    <span className="text-sm text-muted-foreground">No consents granted</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "complete":
        return (
          <div className="space-y-6 text-center py-8">
            {registrationResult ? (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-24 h-24 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center"
                >
                  <CheckCircle2 className="w-14 h-14 text-emerald-500" />
                </motion.div>

                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    Registration Complete!
                  </h3>
                  <p className="text-muted-foreground">
                    Client has been successfully registered with the Client Registry Service
                  </p>
                </div>

                {/* Impilo ID Card */}
                <Card className="max-w-md mx-auto bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Impilo ID (Client Registry)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                      <span className="font-mono text-xl font-bold text-primary">
                        {registrationResult.impiloId}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(registrationResult.impiloId, 'impiloId')}
                      >
                        {copiedField === 'impiloId' ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="p-2 bg-background rounded border">
                        <p className="text-muted-foreground text-xs">MOSIP UIN</p>
                        <p className="font-mono text-xs">{registrationResult.mosipUin}</p>
                      </div>
                      <div className="p-2 bg-background rounded border">
                        <p className="text-muted-foreground text-xs">MRN</p>
                        <p className="font-mono text-xs">{registrationResult.mrn}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Patient Details Summary */}
                <div className="max-w-md mx-auto text-left">
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">
                          {clientData.firstName} {clientData.middleName} {clientData.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {clientData.gender} • DOB: {clientData.dateOfBirth}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Registry Badges */}
                <div className="flex items-center justify-center gap-3">
                  <Badge variant="outline" className="text-xs">
                    <BadgeCheck className="w-3 h-3 mr-1 text-emerald-500" />
                    MOSIP Verified
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Fingerprint className="w-3 h-3 mr-1 text-primary" />
                    {clientData.biometrics.length} Biometrics Enrolled
                  </Badge>
                </div>
              </>
            ) : (
              <div className="py-12">
                <Loader2 className="w-12 h-12 mx-auto animate-spin text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">Processing registration...</p>
              </div>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold">Client Registration</h2>
          <span className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {STEPS.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
        
        {/* Step Indicators */}
        <div className="flex justify-between mt-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isComplete = index < currentStep;
            
            return (
              <div 
                key={step.id}
                className={cn(
                  "flex flex-col items-center gap-1 cursor-pointer transition-opacity",
                  isActive ? "opacity-100" : "opacity-60",
                  index <= currentStep ? "text-primary" : "text-muted-foreground"
                )}
                onClick={() => index < currentStep && setCurrentStep(index)}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                  isComplete && "bg-primary border-primary text-primary-foreground",
                  isActive && "border-primary bg-primary/10",
                  !isComplete && !isActive && "border-muted"
                )}>
                  {isComplete ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className="text-xs font-medium hidden sm:block">{step.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{STEPS[currentStep].title}</CardTitle>
          <CardDescription>{STEPS[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <div>
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {currentStep > 0 && (
            <Button variant="outline" onClick={prevStep}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
          )}
          {currentStep < STEPS.length - 2 ? (
            <Button onClick={nextStep}>
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : currentStep === STEPS.length - 2 ? (
            <Button 
              onClick={handleComplete} 
              className="bg-success hover:bg-success/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Complete Registration
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleFinish} className="bg-primary hover:bg-primary/90">
              <Check className="w-4 h-4 mr-1" />
              Done
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
