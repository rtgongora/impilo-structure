import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  UserCheck, 
  Building2, 
  Shield, 
  RefreshCw,
  Key,
  QrCode,
  Fingerprint,
  Search,
  Package
} from "lucide-react";
import { IdGenerationCard } from "@/components/id/IdGenerationCard";
import { IdRecoveryPanel } from "@/components/id/IdRecoveryPanel";
import { IdValidationCard } from "@/components/id/IdValidationCard";
import { IdBatchGenerator } from "@/components/id/IdBatchGenerator";
import { PHIDService, formatPHID } from "@/services/phidService";
import { ProviderIdService } from "@/services/providerIdService";
import { IdGenerationService } from "@/services/idGenerationService";
import { supabase } from "@/integrations/supabase/client";

type TabValue = "generate" | "validate" | "batch" | "recovery" | "architecture";

export default function IdServices() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab") as TabValue | null;
  const [activeTab, setActiveTab] = useState<TabValue>(tabFromUrl || "generate");

  // Sync tab from URL on mount and when URL changes
  useEffect(() => {
    const validTabs: TabValue[] = ["generate", "validate", "batch", "recovery", "architecture"];
    if (tabFromUrl && validTabs.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    const newTab = value as TabValue;
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };
  // Generate PHID with linked IDs
  const handleGeneratePHID = async () => {
    const result = await PHIDService.generatePHID();
    return {
      primaryId: formatPHID(result.phid),
      token: result.phid,
      secondaryIds: {
        clientRegistryId: result.clientRegistryId,
        shrId: result.shrId
      }
    };
  };

  // Generate Provider ID
  const handleGenerateProviderId = async (provinceCode?: string) => {
    const result = await ProviderIdService.generateProviderId(provinceCode || "ZW");
    return {
      primaryId: result.providerId,
      token: result.providerToken,
      secondaryIds: {
        registryId: result.registryId
      }
    };
  };

  // Generate Facility ID
  const handleGenerateFacilityId = async (provinceCode?: string) => {
    const result = await IdGenerationService.generateFacilityRegistryId(provinceCode || "ZW");
    return {
      primaryId: result
    };
  };

  // Send ID via email
  const handleSendToEmail = async (id: string, email: string) => {
    const { error } = await supabase.functions.invoke("send-secure-id", {
      body: {
        recipientEmail: email,
        recipientName: "Recipient",
        idValue: id,
        idType: "impilo",
        deliveryMethod: "email"
      }
    });
    
    if (error) throw error;
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Identity Services</h1>
            <p className="text-muted-foreground">Generate, validate, and recover Impilo health identifiers</p>
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
              <div className="flex gap-2 flex-wrap">
                <Badge>Biometric Linked</Badge>
                <Badge variant="secondary">Multi-Recovery</Badge>
                <Badge variant="outline">Offline Ready</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="generate" className="gap-2">
              <Key className="w-4 h-4" />
              <span className="hidden sm:inline">Generate</span>
            </TabsTrigger>
            <TabsTrigger value="validate" className="gap-2">
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Validate</span>
            </TabsTrigger>
            <TabsTrigger value="batch" className="gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Batch</span>
            </TabsTrigger>
            <TabsTrigger value="recovery" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Recovery</span>
            </TabsTrigger>
            <TabsTrigger value="architecture" className="gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Architecture</span>
            </TabsTrigger>
          </TabsList>

          {/* Generate Tab */}
          <TabsContent value="generate" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Patient PHID */}
              <IdGenerationCard
                title="Patient PHID"
                description="Patient Health ID for client identity"
                icon={User}
                format="DDDSDDDX (e.g., 123-A-456-8)"
                onGenerate={handleGeneratePHID}
                onSendToEmail={handleSendToEmail}
                idLabels={{
                  primary: "Patient Token (PHID)",
                  token: "Raw PHID",
                  secondary: {
                    clientRegistryId: "Client Registry ID",
                    shrId: "SHR ID"
                  }
                }}
              />

              {/* Provider ID */}
              <IdGenerationCard
                title="Provider ID (Varapi)"
                description="Healthcare worker identity"
                icon={UserCheck}
                format="VARAPI-YYYY-PPNNNNNN-XXXX"
                onGenerate={handleGenerateProviderId}
                showProvinceSelector
                onSendToEmail={handleSendToEmail}
                idLabels={{
                  primary: "Provider ID",
                  token: "Provider Token",
                  secondary: {
                    registryId: "Registry ID"
                  }
                }}
              />

              {/* Facility ID */}
              <IdGenerationCard
                title="Facility ID (Thuso)"
                description="Health facility identity"
                icon={Building2}
                format="THUSO-PP-NNNNNN-XXX"
                onGenerate={handleGenerateFacilityId}
                showProvinceSelector
                idLabels={{
                  primary: "Facility ID"
                }}
              />
            </div>
          </TabsContent>

          {/* Validate Tab */}
          <TabsContent value="validate" className="space-y-4">
            <IdValidationCard />
          </TabsContent>

          {/* Batch Tab */}
          <TabsContent value="batch" className="space-y-4">
            <IdBatchGenerator />
          </TabsContent>

          {/* Recovery Tab */}
          <TabsContent value="recovery" className="space-y-4">
            <IdRecoveryPanel />
          </TabsContent>

          {/* Architecture Tab */}
          <TabsContent value="architecture" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* PHID Architecture */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Patient PHID Architecture</h3>
                      <p className="text-sm text-muted-foreground">Portable token linking to full identity</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <QrCode className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Portable Token</p>
                        <p className="text-sm text-muted-foreground">8-character ID patient can easily remember and carry</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Fingerprint className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Biometric = PHID</p>
                        <p className="text-sm text-muted-foreground">Biometrics directly resolve to patient identity</p>
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

                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs font-mono text-center">
                      PHID → Client Registry ID → SHR ID → Health Record
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Provider ID Architecture */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <UserCheck className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Provider ID Architecture</h3>
                      <p className="text-sm text-muted-foreground">Healthcare worker identity system</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Key className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Varapi Format</p>
                        <p className="text-sm text-muted-foreground">Year, province, sequence, and check component</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Fingerprint className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Biometric Binding</p>
                        <p className="text-sm text-muted-foreground">Same architecture as PHID for instant verification</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Building2 className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Facility Verification</p>
                        <p className="text-sm text-muted-foreground">Recovery via employing facility</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs font-mono text-center">
                      Provider ID → iHRIS Registry → Professional License → Access
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Facility ID Architecture */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Building2 className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Facility ID Architecture</h3>
                      <p className="text-sm text-muted-foreground">Health facility registry (Thuso/GOFR)</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Key className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Thuso Format</p>
                        <p className="text-sm text-muted-foreground">Province code, sequence, and verification</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Shield className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium">GOFR Integration</p>
                        <p className="text-sm text-muted-foreground">Global Open Facility Registry compliant</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs font-mono text-center">
                      Facility ID → GOFR → Location Data → Services
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Security Overview */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-100 rounded-lg">
                      <Shield className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Security Model</h3>
                      <p className="text-sm text-muted-foreground">Cryptographic security across all IDs</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Luhn Check Digit</Badge>
                      <span className="text-sm text-muted-foreground">Validation integrity</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Web Crypto API</Badge>
                      <span className="text-sm text-muted-foreground">Secure random generation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Database Sequences</Badge>
                      <span className="text-sm text-muted-foreground">Guaranteed uniqueness</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Audit Logging</Badge>
                      <span className="text-sm text-muted-foreground">Complete generation trail</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
