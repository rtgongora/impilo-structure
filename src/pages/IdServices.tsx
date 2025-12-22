import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Fingerprint, 
  User, 
  Building2, 
  Shield, 
  Copy, 
  CheckCircle, 
  RefreshCw,
  Key,
  Smartphone,
  Mail,
  FileText,
  UserCheck,
  QrCode
} from "lucide-react";
import { PHIDService, formatPHID } from "@/services/phidService";
import { ProviderIdService } from "@/services/providerIdService";
import { IdGenerationService } from "@/services/idGenerationService";

export default function IdServices() {
  const [activeTab, setActiveTab] = useState("patient");
  const [generatedPHID, setGeneratedPHID] = useState<{ phid: string; shrId: string; clientRegistryId: string } | null>(null);
  const [generatedProviderId, setGeneratedProviderId] = useState<{ providerId: string; providerToken: string } | null>(null);
  const [generatedFacilityId, setGeneratedFacilityId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [provinceCode, setProvinceCode] = useState("ZW");

  // Recovery state
  const [recoveryMethod, setRecoveryMethod] = useState<string>("id_document");
  const [recoveryData, setRecoveryData] = useState<Record<string, string>>({});

  const handleGeneratePHID = async () => {
    setIsGenerating(true);
    try {
      const result = await PHIDService.generatePHID();
      setGeneratedPHID(result);
      toast.success("Patient PHID generated successfully");
    } catch (error) {
      toast.error("Failed to generate PHID");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateProviderId = async () => {
    setIsGenerating(true);
    try {
      const result = await ProviderIdService.generateProviderId(provinceCode);
      setGeneratedProviderId(result);
      toast.success("Provider ID generated successfully");
    } catch (error) {
      toast.error("Failed to generate Provider ID");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateFacilityId = async () => {
    setIsGenerating(true);
    try {
      const result = await IdGenerationService.generateFacilityRegistryId(provinceCode);
      setGeneratedFacilityId(result);
      toast.success("Facility ID generated successfully");
    } catch (error) {
      toast.error("Failed to generate Facility ID");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const recoveryMethods = [
    { id: "biometric", label: "Biometric", icon: Fingerprint, description: "Fingerprint, facial, or iris scan" },
    { id: "id_document", label: "ID Document", icon: FileText, description: "National ID, passport verification" },
    { id: "phone_otp", label: "Phone OTP", icon: Smartphone, description: "SMS verification code" },
    { id: "email_otp", label: "Email OTP", icon: Mail, description: "Email verification code" },
    { id: "provider_verification", label: "Provider Verify", icon: UserCheck, description: "Healthcare provider assisted" },
  ];

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">ID Generation Services</h1>
            <p className="text-muted-foreground">Generate and manage Impilo health identifiers</p>
          </div>
          <Badge variant="outline" className="text-primary border-primary">
            <Shield className="w-3 h-3 mr-1" />
            Cryptographically Secure
          </Badge>
        </div>

        {/* Architecture Overview Card */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Key className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Composite Identity Architecture</h3>
                <p className="text-sm text-muted-foreground">
                  Patient Token (PHID) → Links to → Client Registry ID + SHR ID → Full Health Record Access
                </p>
              </div>
              <div className="flex gap-2">
                <Badge>Biometric Linked</Badge>
                <Badge variant="secondary">Multi-Recovery</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="patient" className="gap-2">
              <User className="w-4 h-4" />
              Patient ID (PHID)
            </TabsTrigger>
            <TabsTrigger value="provider" className="gap-2">
              <UserCheck className="w-4 h-4" />
              Provider ID (Varapi)
            </TabsTrigger>
            <TabsTrigger value="facility" className="gap-2">
              <Building2 className="w-4 h-4" />
              Facility ID (Thuso)
            </TabsTrigger>
            <TabsTrigger value="recovery" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              ID Recovery
            </TabsTrigger>
          </TabsList>

          {/* Patient PHID Tab */}
          <TabsContent value="patient" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Generate Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Patient Health ID (PHID)
                  </CardTitle>
                  <CardDescription>
                    Format: DDDSDDDX (e.g., 123-A-456-8) - Easy to remember, portable
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={handleGeneratePHID} 
                    disabled={isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Key className="w-4 h-4 mr-2" />
                    )}
                    Generate New PHID
                  </Button>

                  {generatedPHID && (
                    <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Patient Token (PHID)</span>
                        <div className="flex items-center gap-2">
                          <code className="text-lg font-mono font-bold text-primary">
                            {formatPHID(generatedPHID.phid)}
                          </code>
                          <Button size="icon" variant="ghost" onClick={() => copyToClipboard(generatedPHID.phid)}>
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Client Registry ID</span>
                        <code className="font-mono text-xs">{generatedPHID.clientRegistryId}</code>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">SHR ID</span>
                        <code className="font-mono text-xs">{generatedPHID.shrId}</code>
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          <CheckCircle className="w-3 h-3 inline mr-1 text-green-500" />
                          Biometric linking available for instant recovery
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle>PHID Architecture</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <QrCode className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Portable Token</p>
                        <p className="text-sm text-muted-foreground">8-character ID patient can easily remember</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Fingerprint className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Biometric = PHID</p>
                        <p className="text-sm text-muted-foreground">Biometrics directly link to patient identity</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Shield className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">Multi-Recovery</p>
                        <p className="text-sm text-muted-foreground">5 recovery methods when token lost</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Provider ID Tab */}
          <TabsContent value="provider" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-primary" />
                    Provider Registry ID (Varapi)
                  </CardTitle>
                  <CardDescription>
                    Format: VARAPI-YYYY-PPNNNNNN-XXXX - Healthcare worker identity
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Province Code</Label>
                    <Select value={provinceCode} onValueChange={setProvinceCode}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select province" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ZW">Zimbabwe (ZW)</SelectItem>
                        <SelectItem value="HA">Harare (HA)</SelectItem>
                        <SelectItem value="BU">Bulawayo (BU)</SelectItem>
                        <SelectItem value="MA">Manicaland (MA)</SelectItem>
                        <SelectItem value="MW">Mashonaland West (MW)</SelectItem>
                        <SelectItem value="ME">Mashonaland East (ME)</SelectItem>
                        <SelectItem value="MC">Mashonaland Central (MC)</SelectItem>
                        <SelectItem value="MT">Matabeleland North (MT)</SelectItem>
                        <SelectItem value="MS">Matabeleland South (MS)</SelectItem>
                        <SelectItem value="MV">Masvingo (MV)</SelectItem>
                        <SelectItem value="MD">Midlands (MD)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={handleGenerateProviderId} 
                    disabled={isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Key className="w-4 h-4 mr-2" />
                    )}
                    Generate Provider ID
                  </Button>

                  {generatedProviderId && (
                    <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Full Provider ID</span>
                        <div className="flex items-center gap-2">
                          <code className="font-mono font-bold text-primary">
                            {generatedProviderId.providerId}
                          </code>
                          <Button size="icon" variant="ghost" onClick={() => copyToClipboard(generatedProviderId.providerId)}>
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Provider Token</span>
                        <code className="font-mono text-lg font-bold">{generatedProviderId.providerToken}</code>
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          <Fingerprint className="w-3 h-3 inline mr-1 text-green-500" />
                          Biometrics = Provider ID for instant verification
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Provider ID Architecture</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Professional License Link</p>
                        <p className="text-sm text-muted-foreground">Links to medical council registration</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Fingerprint className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Biometric = Provider ID</p>
                        <p className="text-sm text-muted-foreground">Same concept as patient PHID</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Building2 className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium">Facility Verification</p>
                        <p className="text-sm text-muted-foreground">Recovery via employing facility</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Facility ID Tab */}
          <TabsContent value="facility" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    Facility Registry ID (Thuso)
                  </CardTitle>
                  <CardDescription>
                    Format: THUSO-PP-NNNNNN-XXX - Health facility identity
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Province Code</Label>
                    <Select value={provinceCode} onValueChange={setProvinceCode}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select province" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ZW">Zimbabwe (ZW)</SelectItem>
                        <SelectItem value="HA">Harare (HA)</SelectItem>
                        <SelectItem value="BU">Bulawayo (BU)</SelectItem>
                        <SelectItem value="MA">Manicaland (MA)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={handleGenerateFacilityId} 
                    disabled={isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Key className="w-4 h-4 mr-2" />
                    )}
                    Generate Facility ID
                  </Button>

                  {generatedFacilityId && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Facility ID</span>
                        <div className="flex items-center gap-2">
                          <code className="text-lg font-mono font-bold text-primary">
                            {generatedFacilityId}
                          </code>
                          <Button size="icon" variant="ghost" onClick={() => copyToClipboard(generatedFacilityId)}>
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Facility Registry</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Facility IDs link to the GOFR (Global Open Facility Registry) for interoperability 
                    across health information systems.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Recovery Tab */}
          <TabsContent value="recovery" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-primary" />
                  ID Recovery Methods
                </CardTitle>
                <CardDescription>
                  Multiple fallback options when primary identifier is unavailable
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {recoveryMethods.map((method) => (
                    <Card 
                      key={method.id}
                      className={`cursor-pointer transition-all ${recoveryMethod === method.id ? 'ring-2 ring-primary' : 'hover:bg-muted/50'}`}
                      onClick={() => setRecoveryMethod(method.id)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                          <method.icon className="w-6 h-6 text-primary" />
                        </div>
                        <h4 className="font-medium text-sm">{method.label}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{method.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">How Recovery Works</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• <strong>Primary:</strong> Biometrics instantly resolve to full identity</li>
                    <li>• <strong>Fallback 1:</strong> National ID + Date of Birth verification</li>
                    <li>• <strong>Fallback 2:</strong> OTP to registered phone/email</li>
                    <li>• <strong>Fallback 3:</strong> Healthcare provider in-person verification</li>
                    <li>• <strong>Fallback 4:</strong> Security questions (if pre-registered)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
