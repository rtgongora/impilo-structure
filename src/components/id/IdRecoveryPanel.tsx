import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Fingerprint, 
  FileText, 
  Smartphone, 
  Mail, 
  UserCheck, 
  Shield, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Key
} from "lucide-react";
import { PHIDService } from "@/services/phidService";
import { ProviderIdService } from "@/services/providerIdService";

type RecoveryType = "patient" | "provider";

interface RecoveryMethod {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  fields: { name: string; label: string; type: string; placeholder: string }[];
}

const PATIENT_RECOVERY_METHODS: RecoveryMethod[] = [
  {
    id: "biometric",
    label: "Biometric",
    icon: Fingerprint,
    description: "Use fingerprint, facial, or iris scan to recover PHID",
    fields: [
      { name: "biometricType", label: "Biometric Type", type: "select", placeholder: "Select type" }
    ]
  },
  {
    id: "id_document",
    label: "ID Document",
    icon: FileText,
    description: "Verify identity using national ID or passport",
    fields: [
      { name: "documentType", label: "Document Type", type: "text", placeholder: "National ID / Passport" },
      { name: "documentNumber", label: "Document Number", type: "text", placeholder: "Enter document number" },
      { name: "dateOfBirth", label: "Date of Birth", type: "date", placeholder: "" },
      { name: "fullName", label: "Full Name", type: "text", placeholder: "As on document" }
    ]
  },
  {
    id: "phone_otp",
    label: "Phone OTP",
    icon: Smartphone,
    description: "Receive verification code via SMS",
    fields: [
      { name: "phoneNumber", label: "Registered Phone", type: "tel", placeholder: "+263 7X XXX XXXX" },
      { name: "otp", label: "OTP Code", type: "text", placeholder: "Enter 6-digit code" }
    ]
  },
  {
    id: "email_otp",
    label: "Email OTP",
    icon: Mail,
    description: "Receive verification code via email",
    fields: [
      { name: "email", label: "Registered Email", type: "email", placeholder: "your@email.com" },
      { name: "otp", label: "OTP Code", type: "text", placeholder: "Enter 6-digit code" }
    ]
  },
  {
    id: "provider_verification",
    label: "Provider Verify",
    icon: UserCheck,
    description: "Healthcare provider assisted recovery",
    fields: [
      { name: "providerId", label: "Provider ID", type: "text", placeholder: "VARAPI-XXXX-..." },
      { name: "verificationCode", label: "Verification Code", type: "text", placeholder: "Provider-issued code" },
      { name: "fullName", label: "Patient Name", type: "text", placeholder: "Full name" },
      { name: "dateOfBirth", label: "Date of Birth", type: "date", placeholder: "" }
    ]
  }
];

const PROVIDER_RECOVERY_METHODS: RecoveryMethod[] = [
  {
    id: "biometric",
    label: "Biometric",
    icon: Fingerprint,
    description: "Use fingerprint, facial, or iris scan",
    fields: [
      { name: "biometricType", label: "Biometric Type", type: "select", placeholder: "Select type" }
    ]
  },
  {
    id: "professional_license",
    label: "License",
    icon: FileText,
    description: "Verify using professional license number",
    fields: [
      { name: "licenseNumber", label: "License Number", type: "text", placeholder: "MED-XXXX-XXXX" },
      { name: "licenseType", label: "License Type", type: "text", placeholder: "Medical / Nursing / etc." },
      { name: "issuingBody", label: "Issuing Body", type: "text", placeholder: "Medical Council" }
    ]
  },
  {
    id: "facility_verification",
    label: "Facility",
    icon: Shield,
    description: "Verify through employing facility",
    fields: [
      { name: "facilityId", label: "Facility ID", type: "text", placeholder: "THUSO-XX-XXXXXX-XXX" },
      { name: "verificationCode", label: "Verification Code", type: "text", placeholder: "Facility-issued code" },
      { name: "employeeId", label: "Employee ID", type: "text", placeholder: "Your employee ID" }
    ]
  },
  {
    id: "phone_otp",
    label: "Phone OTP",
    icon: Smartphone,
    description: "SMS verification to registered number",
    fields: [
      { name: "phoneNumber", label: "Registered Phone", type: "tel", placeholder: "+263 7X XXX XXXX" },
      { name: "otp", label: "OTP Code", type: "text", placeholder: "Enter 6-digit code" }
    ]
  },
  {
    id: "email_otp",
    label: "Email OTP",
    icon: Mail,
    description: "Email verification",
    fields: [
      { name: "email", label: "Registered Email", type: "email", placeholder: "your@email.com" },
      { name: "otp", label: "OTP Code", type: "text", placeholder: "Enter 6-digit code" }
    ]
  }
];

export function IdRecoveryPanel() {
  const [recoveryType, setRecoveryType] = useState<RecoveryType>("patient");
  const [selectedMethod, setSelectedMethod] = useState<string>("id_document");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryResult, setRecoveryResult] = useState<{
    success: boolean;
    id?: string;
    token?: string;
    error?: string;
  } | null>(null);
  const [otpRequested, setOtpRequested] = useState(false);

  const methods = recoveryType === "patient" ? PATIENT_RECOVERY_METHODS : PROVIDER_RECOVERY_METHODS;
  const currentMethod = methods.find(m => m.id === selectedMethod);

  const handleFieldChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRequestOTP = async () => {
    const destination = formData.phoneNumber || formData.email;
    if (!destination) {
      toast.error("Please enter phone or email first");
      return;
    }

    try {
      if (recoveryType === "patient") {
        await PHIDService.requestRecoveryOTP(
          selectedMethod === "phone_otp" ? "phone" : "email",
          destination
        );
      } else {
        await ProviderIdService.requestRecoveryOTP(
          selectedMethod === "phone_otp" ? "phone" : "email",
          destination
        );
      }
      setOtpRequested(true);
      toast.success("OTP sent! Check your " + (selectedMethod === "phone_otp" ? "phone" : "email"));
    } catch (error) {
      toast.error("Failed to send OTP");
    }
  };

  const handleRecover = async () => {
    if (!currentMethod) return;

    setIsRecovering(true);
    setRecoveryResult(null);

    try {
      let result;
      
      if (recoveryType === "patient") {
        result = await PHIDService.recoverAccess(
          selectedMethod as any,
          formData
        );
        
        if (result.success) {
          setRecoveryResult({
            success: true,
            id: result.phid,
            token: result.phid
          });
          toast.success("PHID recovered successfully!");
        } else {
          setRecoveryResult({
            success: false,
            error: result.error
          });
          toast.error(result.error || "Recovery failed");
        }
      } else {
        result = await ProviderIdService.recoverAccess(
          selectedMethod as any,
          formData
        );
        
        if (result.success) {
          setRecoveryResult({
            success: true,
            id: result.providerId,
            token: result.providerToken
          });
          toast.success("Provider ID recovered successfully!");
        } else {
          setRecoveryResult({
            success: false,
            error: result.error
          });
          toast.error(result.error || "Recovery failed");
        }
      }
    } catch (error) {
      setRecoveryResult({
        success: false,
        error: "An unexpected error occurred"
      });
      toast.error("Recovery failed");
    } finally {
      setIsRecovering(false);
    }
  };

  const resetRecovery = () => {
    setFormData({});
    setRecoveryResult(null);
    setOtpRequested(false);
  };

  return (
    <div className="space-y-4">
      {/* Type Selector */}
      <Tabs value={recoveryType} onValueChange={(v) => {
        setRecoveryType(v as RecoveryType);
        setSelectedMethod(v === "patient" ? "id_document" : "professional_license");
        resetRecovery();
      }}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="patient">Patient PHID Recovery</TabsTrigger>
          <TabsTrigger value="provider">Provider ID Recovery</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Method Selection */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Recovery Method</CardTitle>
            <CardDescription>Choose verification method</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {methods.map((method) => {
              const Icon = method.icon;
              const isSelected = selectedMethod === method.id;
              
              return (
                <button
                  key={method.id}
                  onClick={() => {
                    setSelectedMethod(method.id);
                    resetRecovery();
                  }}
                  className={`w-full p-3 rounded-lg border text-left transition-colors ${
                    isSelected 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      isSelected ? "bg-primary/10" : "bg-muted"
                    }`}>
                      <Icon className={`w-4 h-4 ${
                        isSelected ? "text-primary" : "text-muted-foreground"
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{method.label}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {method.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Recovery Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {currentMethod && <currentMethod.icon className="w-5 h-5 text-primary" />}
              {currentMethod?.label} Verification
            </CardTitle>
            <CardDescription>{currentMethod?.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recoveryResult ? (
              <div className={`p-4 rounded-lg ${
                recoveryResult.success 
                  ? "bg-green-50 border border-green-200" 
                  : "bg-destructive/10 border border-destructive/20"
              }`}>
                {recoveryResult.success ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Recovery Successful!</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {recoveryType === "patient" ? "Your PHID" : "Your Provider ID"}
                        </span>
                        <code className="font-mono font-bold text-primary text-lg">
                          {recoveryResult.id}
                        </code>
                      </div>
                      {recoveryResult.token && recoveryResult.token !== recoveryResult.id && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Token</span>
                          <code className="font-mono font-bold">{recoveryResult.token}</code>
                        </div>
                      )}
                    </div>
                    <Button variant="outline" className="w-full mt-2" onClick={resetRecovery}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Start New Recovery
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-medium">Recovery Failed</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{recoveryResult.error}</p>
                    <Button variant="outline" className="w-full" onClick={resetRecovery}>
                      Try Again
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Biometric special case */}
                {selectedMethod === "biometric" ? (
                  <div className="text-center py-8 space-y-4">
                    <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                      <Fingerprint className="w-10 h-10 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Biometric Verification</p>
                      <p className="text-sm text-muted-foreground">
                        Place your finger on the scanner or look at the camera
                      </p>
                    </div>
                    <Badge variant="outline">
                      Requires biometric hardware
                    </Badge>
                    <Button disabled className="w-full">
                      <Fingerprint className="w-4 h-4 mr-2" />
                      Waiting for Biometric...
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Dynamic form fields */}
                    <div className="grid gap-4">
                      {currentMethod?.fields.map((field) => (
                        <div key={field.name} className="space-y-2">
                          <Label>{field.label}</Label>
                          <Input
                            type={field.type}
                            placeholder={field.placeholder}
                            value={formData[field.name] || ""}
                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>

                    {/* OTP Request Button */}
                    {(selectedMethod === "phone_otp" || selectedMethod === "email_otp") && !otpRequested && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleRequestOTP}
                        disabled={!formData.phoneNumber && !formData.email}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Request OTP Code
                      </Button>
                    )}

                    {/* Submit Button */}
                    <Button
                      className="w-full"
                      onClick={handleRecover}
                      disabled={isRecovering}
                    >
                      {isRecovering ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Key className="w-4 h-4 mr-2" />
                      )}
                      Recover {recoveryType === "patient" ? "PHID" : "Provider ID"}
                    </Button>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
