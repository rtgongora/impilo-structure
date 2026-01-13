import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Users, 
  Building2, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  FileText,
  MapPin,
  Video,
  Share2,
  Lock,
  Unlock,
  History,
  Settings
} from "lucide-react";

interface ConsentRecord {
  id: string;
  type: "care_access" | "telehealth" | "data_sharing" | "research" | "location";
  grantedTo: string;
  grantedToType: "facility" | "provider" | "program";
  purpose: string;
  grantedAt: string;
  expiresAt: string | null;
  status: "active" | "expired" | "revoked";
}

interface AccessLog {
  id: string;
  accessor: string;
  accessorRole: string;
  facility: string;
  accessedAt: string;
  purpose: string;
  dataAccessed: string[];
}

const MOCK_CONSENTS: ConsentRecord[] = [
  {
    id: "1",
    type: "care_access",
    grantedTo: "City General Hospital",
    grantedToType: "facility",
    purpose: "Ongoing treatment",
    grantedAt: "2024-01-15",
    expiresAt: "2025-01-15",
    status: "active"
  },
  {
    id: "2",
    type: "telehealth",
    grantedTo: "Dr. Sarah Johnson",
    grantedToType: "provider",
    purpose: "Cardiology consultation",
    grantedAt: "2024-01-18",
    expiresAt: null,
    status: "active"
  },
  {
    id: "3",
    type: "data_sharing",
    grantedTo: "National HIV Program",
    grantedToType: "program",
    purpose: "Continuity of care",
    grantedAt: "2023-06-01",
    expiresAt: "2024-06-01",
    status: "active"
  },
  {
    id: "4",
    type: "research",
    grantedTo: "Zimbabwe Health Research Council",
    grantedToType: "program",
    purpose: "Anonymized data for NCD study",
    grantedAt: "2023-09-01",
    expiresAt: "2024-09-01",
    status: "active"
  }
];

const MOCK_ACCESS_LOGS: AccessLog[] = [
  {
    id: "1",
    accessor: "Dr. Smith",
    accessorRole: "Physician",
    facility: "City General Hospital",
    accessedAt: "2024-01-19 10:30 AM",
    purpose: "Clinical consultation",
    dataAccessed: ["Demographics", "Medications", "Lab Results"]
  },
  {
    id: "2",
    accessor: "Nurse Moyo",
    accessorRole: "Registered Nurse",
    facility: "City General Hospital",
    accessedAt: "2024-01-19 09:15 AM",
    purpose: "Vitals documentation",
    dataAccessed: ["Demographics", "Vitals"]
  },
  {
    id: "3",
    accessor: "Lab Tech Ndlovu",
    accessorRole: "Laboratory Technician",
    facility: "PathLab Services",
    accessedAt: "2024-01-18 02:45 PM",
    purpose: "Sample collection",
    dataAccessed: ["Demographics", "Lab Orders"]
  }
];

export function PortalConsentDashboard() {
  const [consents, setConsents] = useState(MOCK_CONSENTS);
  const [privacySettings, setPrivacySettings] = useState({
    hideSensitiveEncounters: false,
    requireBreakGlass: true,
    allowExport: true,
    watermarkExports: true,
    shareLocation: false
  });

  const getConsentIcon = (type: string) => {
    switch (type) {
      case "care_access": return Building2;
      case "telehealth": return Video;
      case "data_sharing": return Share2;
      case "research": return FileText;
      case "location": return MapPin;
      default: return Shield;
    }
  };

  const getConsentLabel = (type: string) => {
    switch (type) {
      case "care_access": return "Care Access";
      case "telehealth": return "Telehealth";
      case "data_sharing": return "Data Sharing";
      case "research": return "Research";
      case "location": return "Location";
      default: return type;
    }
  };

  const revokeConsent = (id: string) => {
    setConsents(prev => prev.map(c => 
      c.id === id ? { ...c, status: "revoked" as const } : c
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Privacy & Consent Center
          </h2>
          <p className="text-sm text-muted-foreground">
            Control who can access your health information
          </p>
        </div>
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Advanced Settings
        </Button>
      </div>

      <Tabs defaultValue="consents">
        <TabsList>
          <TabsTrigger value="consents">Active Consents</TabsTrigger>
          <TabsTrigger value="access-log">Who Accessed My Record</TabsTrigger>
          <TabsTrigger value="privacy">Privacy Controls</TabsTrigger>
        </TabsList>

        {/* Active Consents */}
        <TabsContent value="consents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your Active Consent Grants</CardTitle>
              <CardDescription>
                These entities have permission to access your health information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {consents.map(consent => {
                    const Icon = getConsentIcon(consent.type);
                    return (
                      <div 
                        key={consent.id}
                        className={`p-4 border rounded-lg ${consent.status === "revoked" ? "opacity-50" : ""}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${
                              consent.status === "active" ? "bg-primary/10" : "bg-muted"
                            }`}>
                              <Icon className={`h-5 w-5 ${
                                consent.status === "active" ? "text-primary" : "text-muted-foreground"
                              }`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{consent.grantedTo}</p>
                                <Badge variant="outline" className="text-xs">
                                  {getConsentLabel(consent.type)}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{consent.purpose}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Granted: {consent.grantedAt}
                                </span>
                                {consent.expiresAt && (
                                  <span className="flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    Expires: {consent.expiresAt}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={
                              consent.status === "active" ? "bg-success" :
                              consent.status === "revoked" ? "bg-destructive" : "bg-warning"
                            }>
                              {consent.status}
                            </Badge>
                            {consent.status === "active" && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-destructive"
                                onClick={() => revokeConsent(consent.id)}
                              >
                                Revoke
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Button className="w-full">
            <Share2 className="h-4 w-4 mr-2" />
            Grant New Consent
          </Button>
        </TabsContent>

        {/* Access Log */}
        <TabsContent value="access-log" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4" />
                Record Access History
              </CardTitle>
              <CardDescription>
                See who has viewed your health information and why
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {MOCK_ACCESS_LOGS.map(log => (
                    <div key={log.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-muted">
                            <Eye className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{log.accessor}</p>
                            <p className="text-sm text-muted-foreground">
                              {log.accessorRole} at {log.facility}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Purpose: {log.purpose}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {log.dataAccessed.map(data => (
                                <Badge key={data} variant="secondary" className="text-xs">
                                  {data}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">{log.accessedAt}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                <div>
                  <p className="font-medium">Suspicious Access Alert</p>
                  <p className="text-sm text-muted-foreground">
                    You will be notified if unusual access patterns are detected on your record.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Controls */}
        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Privacy Settings</CardTitle>
              <CardDescription>
                Control how your health information is handled
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <EyeOff className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Hide Sensitive Encounters</p>
                    <p className="text-sm text-muted-foreground">
                      Mental health, HIV, and reproductive health visits require break-glass access
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={privacySettings.hideSensitiveEncounters}
                  onCheckedChange={(checked) => setPrivacySettings(prev => ({
                    ...prev, hideSensitiveEncounters: checked
                  }))}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <Lock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Require Break-Glass for Emergency Access</p>
                    <p className="text-sm text-muted-foreground">
                      Providers must document reason when accessing without consent
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={privacySettings.requireBreakGlass}
                  onCheckedChange={(checked) => setPrivacySettings(prev => ({
                    ...prev, requireBreakGlass: checked
                  }))}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Allow Record Export</p>
                    <p className="text-sm text-muted-foreground">
                      Enable downloading your health records
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={privacySettings.allowExport}
                  onCheckedChange={(checked) => setPrivacySettings(prev => ({
                    ...prev, allowExport: checked
                  }))}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Watermark Exports</p>
                    <p className="text-sm text-muted-foreground">
                      Add identifying watermark to exported documents
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={privacySettings.watermarkExports}
                  onCheckedChange={(checked) => setPrivacySettings(prev => ({
                    ...prev, watermarkExports: checked
                  }))}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Share Location in Emergencies</p>
                    <p className="text-sm text-muted-foreground">
                      Allow location sharing during emergency calls
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={privacySettings.shareLocation}
                  onCheckedChange={(checked) => setPrivacySettings(prev => ({
                    ...prev, shareLocation: checked
                  }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
