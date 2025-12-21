import { useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Key,
  User,
  Server,
  Database,
  Fingerprint,
  Lock,
  Unlock,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  Globe,
  FileCheck,
  UserCheck,
  Settings,
  Eye,
  Smartphone
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FlowStep {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const AUTH_FLOW_STEPS: FlowStep[] = [
  {
    id: "initiate",
    label: "1. Authentication Request",
    description: "User initiates login via EHR system",
    icon: User,
    color: "bg-blue-500"
  },
  {
    id: "keycloak",
    label: "2. KeyCloak Redirect",
    description: "Redirected to KeyCloak for authentication",
    icon: Key,
    color: "bg-orange-500"
  },
  {
    id: "esignet",
    label: "3. eSignet Integration",
    description: "National ID verification via eSignet",
    icon: Globe,
    color: "bg-green-500"
  },
  {
    id: "biometric",
    label: "4. Biometric Verification",
    description: "Optional biometric authentication",
    icon: Fingerprint,
    color: "bg-purple-500"
  },
  {
    id: "token",
    label: "5. Token Generation",
    description: "JWT tokens issued by KeyCloak",
    icon: Shield,
    color: "bg-cyan-500"
  },
  {
    id: "access",
    label: "6. Access Granted",
    description: "User gains access to EHR resources",
    icon: Unlock,
    color: "bg-emerald-500"
  },
];

const CONSENT_FLOW_STEPS: FlowStep[] = [
  {
    id: "capture",
    label: "1. Consent Capture",
    description: "Collect FHIR consent resources",
    icon: FileCheck,
    color: "bg-blue-500"
  },
  {
    id: "verify",
    label: "2. Identity Verification",
    description: "Verify patient identity via eSignet",
    icon: UserCheck,
    color: "bg-green-500"
  },
  {
    id: "store",
    label: "3. Consent Storage",
    description: "Store in consent management system",
    icon: Database,
    color: "bg-purple-500"
  },
  {
    id: "enforce",
    label: "4. Policy Enforcement",
    description: "KeyCloak enforces consent policies",
    icon: Shield,
    color: "bg-orange-500"
  },
  {
    id: "audit",
    label: "5. Audit Trail",
    description: "All access logged and auditable",
    icon: Eye,
    color: "bg-cyan-500"
  },
];

export function IAMArchitecture() {
  const [activeFlow, setActiveFlow] = useState<"auth" | "consent">("auth");
  const [animatingStep, setAnimatingStep] = useState<string | null>(null);

  const simulateFlow = () => {
    const steps = activeFlow === "auth" ? AUTH_FLOW_STEPS : CONSENT_FLOW_STEPS;
    steps.forEach((step, index) => {
      setTimeout(() => {
        setAnimatingStep(step.id);
      }, index * 800);
    });
    setTimeout(() => {
      setAnimatingStep(null);
    }, steps.length * 800 + 500);
  };

  const currentSteps = activeFlow === "auth" ? AUTH_FLOW_STEPS : CONSENT_FLOW_STEPS;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Identity & Access Management</h2>
          <p className="text-muted-foreground">
            KeyCloak + eSignet integration for secure healthcare identity
          </p>
        </div>
        <Button onClick={simulateFlow} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Simulate Flow
        </Button>
      </div>

      {/* Flow Selection */}
      <Tabs value={activeFlow} onValueChange={(v) => setActiveFlow(v as "auth" | "consent")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="auth" className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            Authentication Flow
          </TabsTrigger>
          <TabsTrigger value="consent" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Consent Management Flow
          </TabsTrigger>
        </TabsList>

        <TabsContent value="auth" className="mt-6">
          {/* Architecture Diagram */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>System Architecture</CardTitle>
              <CardDescription>
                OAuth 2.0 / OpenID Connect authentication with national ID verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4 items-start">
                {/* Client Applications */}
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto rounded-xl bg-blue-500/10 border-2 border-blue-500/50 flex flex-col items-center justify-center mb-2">
                    <Smartphone className="w-8 h-8 text-blue-500" />
                  </div>
                  <h4 className="font-medium text-sm">Client Apps</h4>
                  <p className="text-xs text-muted-foreground">EHR, Mobile, Web</p>
                </div>

                <div className="flex items-center justify-center pt-8">
                  <ArrowRight className="w-8 h-8 text-muted-foreground" />
                </div>

                {/* KeyCloak */}
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto rounded-xl bg-orange-500/10 border-2 border-orange-500/50 flex flex-col items-center justify-center mb-2">
                    <Key className="w-8 h-8 text-orange-500" />
                  </div>
                  <h4 className="font-medium text-sm">KeyCloak</h4>
                  <p className="text-xs text-muted-foreground">Identity Provider</p>
                  <div className="mt-2 space-y-1">
                    <Badge variant="outline" className="text-xs">OAuth 2.0</Badge>
                    <Badge variant="outline" className="text-xs">OIDC</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-center pt-8">
                  <ArrowRight className="w-8 h-8 text-muted-foreground" />
                </div>

                {/* eSignet */}
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto rounded-xl bg-green-500/10 border-2 border-green-500/50 flex flex-col items-center justify-center mb-2">
                    <Globe className="w-8 h-8 text-green-500" />
                  </div>
                  <h4 className="font-medium text-sm">eSignet</h4>
                  <p className="text-xs text-muted-foreground">National ID System</p>
                  <div className="mt-2 space-y-1">
                    <Badge variant="outline" className="text-xs">MOSIP</Badge>
                    <Badge variant="outline" className="text-xs">Biometrics</Badge>
                  </div>
                </div>
              </div>

              {/* Supporting Services */}
              <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t">
                <Card className="bg-muted/30">
                  <CardContent className="p-4 text-center">
                    <Database className="w-8 h-8 mx-auto text-purple-500 mb-2" />
                    <h4 className="font-medium text-sm">User Directory</h4>
                    <p className="text-xs text-muted-foreground">LDAP/AD Integration</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30">
                  <CardContent className="p-4 text-center">
                    <Fingerprint className="w-8 h-8 mx-auto text-cyan-500 mb-2" />
                    <h4 className="font-medium text-sm">Biometric Service</h4>
                    <p className="text-xs text-muted-foreground">ABIS Integration</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30">
                  <CardContent className="p-4 text-center">
                    <Settings className="w-8 h-8 mx-auto text-gray-500 mb-2" />
                    <h4 className="font-medium text-sm">Policy Engine</h4>
                    <p className="text-xs text-muted-foreground">RBAC/ABAC</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consent" className="mt-6">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Consent Management Architecture</CardTitle>
              <CardDescription>
                FHIR-compliant consent capture, storage, and enforcement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {/* FHIR Server */}
                <Card className="bg-blue-500/10 border-blue-500/50">
                  <CardContent className="p-4 text-center">
                    <Server className="w-10 h-10 mx-auto text-blue-500 mb-2" />
                    <h4 className="font-medium text-sm">FHIR Server</h4>
                    <p className="text-xs text-muted-foreground">Consent Resources</p>
                    <div className="mt-2">
                      <Badge className="bg-blue-500 text-xs">R4</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Consent Engine */}
                <Card className="bg-purple-500/10 border-purple-500/50">
                  <CardContent className="p-4 text-center">
                    <Shield className="w-10 h-10 mx-auto text-purple-500 mb-2" />
                    <h4 className="font-medium text-sm">Consent Engine</h4>
                    <p className="text-xs text-muted-foreground">Policy Decisions</p>
                    <div className="mt-2">
                      <Badge className="bg-purple-500 text-xs">XACML</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* KeyCloak PDP */}
                <Card className="bg-orange-500/10 border-orange-500/50">
                  <CardContent className="p-4 text-center">
                    <Key className="w-10 h-10 mx-auto text-orange-500 mb-2" />
                    <h4 className="font-medium text-sm">KeyCloak PDP</h4>
                    <p className="text-xs text-muted-foreground">Policy Enforcement</p>
                    <div className="mt-2">
                      <Badge className="bg-orange-500 text-xs">UMA 2.0</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Audit Log */}
                <Card className="bg-green-500/10 border-green-500/50">
                  <CardContent className="p-4 text-center">
                    <Eye className="w-10 h-10 mx-auto text-green-500 mb-2" />
                    <h4 className="font-medium text-sm">Audit Service</h4>
                    <p className="text-xs text-muted-foreground">Compliance Logs</p>
                    <div className="mt-2">
                      <Badge className="bg-green-500 text-xs">ATNA</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Flow Steps */}
      <Card>
        <CardHeader>
          <CardTitle>
            {activeFlow === "auth" ? "Authentication Flow" : "Consent Management Flow"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Connection Line */}
            <div className="absolute top-8 left-8 right-8 h-0.5 bg-muted z-0" />
            
            {/* Steps */}
            <div className="relative z-10 grid grid-cols-6 gap-2">
              {currentSteps.map((step, index) => {
                const Icon = step.icon;
                const isAnimating = animatingStep === step.id;
                const isPassed = animatingStep 
                  ? currentSteps.findIndex(s => s.id === animatingStep) > index
                  : false;

                return (
                  <motion.div
                    key={step.id}
                    className="text-center"
                    animate={isAnimating ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <div className={cn(
                      "w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-2 transition-all duration-300",
                      step.color,
                      isAnimating && "ring-4 ring-offset-2 ring-current shadow-lg",
                      isPassed && "opacity-100",
                      !isAnimating && !isPassed && "opacity-70"
                    )}>
                      {isPassed ? (
                        <CheckCircle className="w-8 h-8 text-white" />
                      ) : (
                        <Icon className="w-8 h-8 text-white" />
                      )}
                    </div>
                    <h4 className="font-medium text-xs mb-1">{step.label}</h4>
                    <p className="text-xs text-muted-foreground leading-tight">
                      {step.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Details */}
      <div className="grid grid-cols-2 gap-6">
        {/* KeyCloak Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Key className="w-5 h-5 text-orange-500" />
              KeyCloak Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Realm</span>
              <code className="bg-muted px-2 py-0.5 rounded text-xs">impilo-health</code>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Protocol</span>
              <code className="bg-muted px-2 py-0.5 rounded text-xs">openid-connect</code>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Token Lifetime</span>
              <code className="bg-muted px-2 py-0.5 rounded text-xs">15 minutes</code>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Refresh Token</span>
              <code className="bg-muted px-2 py-0.5 rounded text-xs">30 days</code>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">MFA</span>
              <Badge variant="outline" className="bg-success/10 text-success">Enabled</Badge>
            </div>
          </CardContent>
        </Card>

        {/* eSignet Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-5 h-5 text-green-500" />
              eSignet Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Provider</span>
              <code className="bg-muted px-2 py-0.5 rounded text-xs">MOSIP eSignet</code>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID Type</span>
              <code className="bg-muted px-2 py-0.5 rounded text-xs">National ID (VID)</code>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Auth Modes</span>
              <div className="flex gap-1">
                <Badge variant="outline" className="text-xs">OTP</Badge>
                <Badge variant="outline" className="text-xs">Biometric</Badge>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Claims</span>
              <code className="bg-muted px-2 py-0.5 rounded text-xs">name, dob, gender</code>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="outline" className="bg-success/10 text-success">Connected</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Security Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {[
              { icon: Lock, label: "TLS 1.3", desc: "End-to-end encryption" },
              { icon: Shield, label: "PKCE", desc: "Proof Key for Code Exchange" },
              { icon: Eye, label: "Audit Logs", desc: "Complete activity tracking" },
              { icon: Fingerprint, label: "MFA", desc: "Multi-factor authentication" },
            ].map((feature) => (
              <div key={feature.label} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <feature.icon className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">{feature.label}</h4>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
