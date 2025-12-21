import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  FileText,
  Share2,
  Activity,
  Users,
  Database,
  Bell,
  Lock,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Info,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// FHIR Consent Resource Model
export interface ConsentData {
  id: string;
  resourceType: "Consent";
  status: "draft" | "active" | "inactive" | "rejected";
  scope: ConsentScope;
  category: string;
  dateTime: Date;
  patient: { reference: string };
  performer?: { reference: string };
  organization?: { reference: string };
  policy?: ConsentPolicy[];
  provision?: ConsentProvision;
  granted: boolean;
  signature?: {
    type: string;
    when: Date;
    who: { reference: string };
    data?: string;
  };
}

interface ConsentScope {
  coding: {
    system: string;
    code: string;
    display: string;
  }[];
}

interface ConsentPolicy {
  authority: string;
  uri: string;
}

interface ConsentProvision {
  type: "deny" | "permit";
  period?: { start: Date; end?: Date };
  actor?: { role: string; reference: string }[];
  action?: string[];
  purpose?: string[];
  dataPeriod?: { start: Date; end?: Date };
  data?: { meaning: string; reference: string }[];
}

// Consent categories based on FHIR and common healthcare requirements
const CONSENT_CATEGORIES = [
  {
    id: "treatment",
    category: "Treatment Consent",
    icon: Activity,
    required: true,
    description: "Consent to receive medical treatment and care",
    scope: "patient-privacy",
    subcategories: [
      { id: "general-treatment", label: "General Medical Treatment", required: true },
      { id: "emergency", label: "Emergency Treatment", required: true },
      { id: "surgical", label: "Surgical Procedures", required: false },
      { id: "anaesthesia", label: "Anaesthesia Administration", required: false },
    ]
  },
  {
    id: "data-sharing",
    category: "Data Sharing Consent",
    icon: Share2,
    required: true,
    description: "Consent to share health information with authorized parties",
    scope: "patient-privacy",
    subcategories: [
      { id: "hie", label: "Health Information Exchange (HIE)", required: false },
      { id: "referral-providers", label: "Referral Healthcare Providers", required: false },
      { id: "insurance", label: "Insurance/Payer Organizations", required: false },
      { id: "family", label: "Family Members/Caregivers", required: false },
    ]
  },
  {
    id: "research",
    category: "Research Consent",
    icon: Database,
    required: false,
    description: "Consent for use of data in medical research",
    scope: "research",
    subcategories: [
      { id: "anonymized", label: "Anonymized Data Research", required: false },
      { id: "clinical-trials", label: "Clinical Trial Eligibility", required: false },
      { id: "genetic", label: "Genetic/Genomic Research", required: false },
    ]
  },
  {
    id: "communication",
    category: "Communication Preferences",
    icon: Bell,
    required: false,
    description: "Preferences for receiving health-related communications",
    scope: "patient-privacy",
    subcategories: [
      { id: "sms", label: "SMS/Text Messages", required: false },
      { id: "email", label: "Email Communications", required: false },
      { id: "appointment-reminders", label: "Appointment Reminders", required: false },
      { id: "health-tips", label: "Health Tips & Education", required: false },
    ]
  },
  {
    id: "privacy",
    category: "Privacy & Confidentiality",
    icon: Lock,
    required: true,
    description: "Acknowledgment of privacy policies and rights",
    scope: "patient-privacy",
    subcategories: [
      { id: "privacy-notice", label: "Privacy Notice Acknowledgment", required: true },
      { id: "data-retention", label: "Data Retention Policy", required: true },
      { id: "access-rights", label: "Right to Access Records", required: false },
    ]
  },
  {
    id: "advance-directive",
    category: "Advance Directives",
    icon: FileText,
    required: false,
    description: "Instructions for future healthcare decisions",
    scope: "adr",
    subcategories: [
      { id: "dnr", label: "Do Not Resuscitate (DNR)", required: false },
      { id: "living-will", label: "Living Will", required: false },
      { id: "healthcare-proxy", label: "Healthcare Proxy Designation", required: false },
    ]
  },
];

interface ConsentCaptureProps {
  consents: ConsentData[];
  onChange: (consents: ConsentData[]) => void;
}

export function ConsentCapture({ consents, onChange }: ConsentCaptureProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["treatment"]);
  const [activeTab, setActiveTab] = useState("categories");

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const createConsent = (categoryId: string, granted: boolean): ConsentData => {
    const category = CONSENT_CATEGORIES.find(c => c.id === categoryId);
    return {
      id: `consent-${categoryId}-${Date.now()}`,
      resourceType: "Consent",
      status: granted ? "active" : "rejected",
      scope: {
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/consentscope",
          code: category?.scope || "patient-privacy",
          display: category?.category || categoryId
        }]
      },
      category: category?.category || categoryId,
      dateTime: new Date(),
      patient: { reference: "Patient/pending" },
      granted,
      provision: {
        type: granted ? "permit" : "deny",
        period: { start: new Date() }
      }
    };
  };

  const handleConsentToggle = (categoryId: string, granted: boolean) => {
    const existingIndex = consents.findIndex(c => c.id.includes(categoryId));
    const newConsent = createConsent(categoryId, granted);
    
    if (existingIndex >= 0) {
      const updated = [...consents];
      updated[existingIndex] = newConsent;
      onChange(updated);
    } else {
      onChange([...consents, newConsent]);
    }
  };

  const isConsentGranted = (categoryId: string) => {
    return consents.find(c => c.id.includes(categoryId))?.granted || false;
  };

  const getConsentStats = () => {
    const required = CONSENT_CATEGORIES.filter(c => c.required).length;
    const requiredGranted = CONSENT_CATEGORIES.filter(c => c.required && isConsentGranted(c.id)).length;
    const optional = CONSENT_CATEGORIES.filter(c => !c.required).length;
    const optionalGranted = CONSENT_CATEGORIES.filter(c => !c.required && isConsentGranted(c.id)).length;
    
    return { required, requiredGranted, optional, optionalGranted };
  };

  const stats = getConsentStats();

  return (
    <div className="space-y-6">
      {/* Consent Summary Header */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">FHIR Consent Management</h3>
            <p className="text-sm text-muted-foreground">
              Standards-based consent capture following HL7 FHIR R4
            </p>
          </div>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <div className={cn(
              "text-lg font-bold",
              stats.requiredGranted === stats.required ? "text-success" : "text-warning"
            )}>
              {stats.requiredGranted}/{stats.required}
            </div>
            <div className="text-muted-foreground">Required</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-primary">{stats.optionalGranted}/{stats.optional}</div>
            <div className="text-muted-foreground">Optional</div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="granular">Granular Control</TabsTrigger>
          <TabsTrigger value="fhir">FHIR Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4 mt-4">
          {CONSENT_CATEGORIES.map((category) => {
            const Icon = category.icon;
            const isExpanded = expandedCategories.includes(category.id);
            const isGranted = isConsentGranted(category.id);

            return (
              <Card key={category.id} className={cn(
                "transition-all",
                isGranted && "ring-1 ring-success/50"
              )}>
                <Collapsible open={isExpanded} onOpenChange={() => toggleCategory(category.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CollapsibleTrigger className="flex items-center gap-3 text-left flex-1">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          isGranted ? "bg-success/10" : "bg-muted"
                        )}>
                          <Icon className={cn(
                            "w-5 h-5",
                            isGranted ? "text-success" : "text-muted-foreground"
                          )} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">{category.category}</CardTitle>
                            {category.required && (
                              <Badge variant="outline" className="text-xs">Required</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </CollapsibleTrigger>
                      <Switch
                        checked={isGranted}
                        onCheckedChange={(checked) => handleConsentToggle(category.id, checked)}
                        className="ml-4"
                      />
                    </div>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="pl-13 space-y-3 border-l-2 border-muted ml-5 pl-6">
                        {category.subcategories.map((sub) => (
                          <div key={sub.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Checkbox 
                                id={sub.id} 
                                disabled={!isGranted}
                                defaultChecked={isGranted}
                              />
                              <Label 
                                htmlFor={sub.id} 
                                className={cn(
                                  "text-sm cursor-pointer",
                                  !isGranted && "text-muted-foreground"
                                )}
                              >
                                {sub.label}
                                {sub.required && (
                                  <span className="text-destructive ml-1">*</span>
                                )}
                              </Label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="granular" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-5 h-5" />
                Data Sharing with Specific Parties
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Authorized Healthcare Providers</Label>
                  <Textarea 
                    placeholder="Enter names or facility IDs of authorized providers..."
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Authorized Family Members</Label>
                  <Textarea 
                    placeholder="Enter names and relationships..."
                    className="min-h-[80px]"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Data Access Period</Label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">From</Label>
                    <input type="date" className="w-full px-3 py-2 border rounded-md" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">To (Optional)</Label>
                    <input type="date" className="w-full px-3 py-2 border rounded-md" />
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-info/10 rounded-lg flex items-start gap-2">
                <Info className="w-5 h-5 text-info mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Granular consent allows you to specify exactly who can access your health data 
                  and for what time period. You can modify these preferences at any time.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fhir" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-5 h-5" />
                FHIR Consent Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 rounded-lg p-4 font-mono text-xs overflow-auto max-h-96">
                <pre>
{JSON.stringify(
  consents.length > 0 
    ? consents.map(c => ({
        resourceType: c.resourceType,
        id: c.id,
        status: c.status,
        scope: c.scope,
        category: c.category,
        dateTime: c.dateTime,
        provision: c.provision
      }))
    : { message: "No consents captured yet" },
  null, 
  2
)}
                </pre>
              </div>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Resources follow HL7 FHIR R4 Consent specification
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Missing Required Consents Warning */}
      {stats.requiredGranted < stats.required && (
        <div className="p-4 bg-warning/10 border border-warning/50 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-warning mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-warning">Required Consents Missing</p>
            <p className="text-sm text-muted-foreground">
              Please grant all required consents to proceed with registration.
              {CONSENT_CATEGORIES.filter(c => c.required && !isConsentGranted(c.id)).map(c => (
                <span key={c.id} className="ml-1 text-foreground">• {c.category}</span>
              ))}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
