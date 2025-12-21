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
  IdCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { BiometricCapture, BiometricData, BiometricSummary, BiometricType } from "./BiometricCapture";
import { ConsentCapture, ConsentData } from "./ConsentCapture";
import { cn } from "@/lib/utils";

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
  { id: "consent", title: "Consent", description: "Data & treatment consent", icon: Shield },
  { id: "review", title: "Review", description: "Confirm details", icon: FileCheck },
];

interface ClientData {
  // Demographics
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
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

  const handleComplete = () => {
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
            
            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="occupation">Occupation</Label>
                <Input
                  id="occupation"
                  value={clientData.occupation}
                  onChange={(e) => updateField("occupation", e.target.value)}
                  placeholder="Enter occupation"
                />
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
          {currentStep < STEPS.length - 1 ? (
            <Button onClick={nextStep}>
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleComplete} className="bg-success hover:bg-success/90">
              <Check className="w-4 h-4 mr-1" />
              Complete Registration
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
