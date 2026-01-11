import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, CreditCard, User, Building2 } from "lucide-react";

export interface MedicalAidData {
  hasMedicalAid: boolean;
  providerName: string;
  schemeName: string;
  memberNumber: string;
  principalMember: string;
  principalMemberNumber: string;
  dependantCode: string;
  relationshipToPrincipal: string;
  validFrom: string;
  validTo: string;
  authorizationRequired: boolean;
  providerPhone: string;
  providerEmail: string;
  notes: string;
}

export const initialMedicalAidData: MedicalAidData = {
  hasMedicalAid: false,
  providerName: "",
  schemeName: "",
  memberNumber: "",
  principalMember: "",
  principalMemberNumber: "",
  dependantCode: "",
  relationshipToPrincipal: "",
  validFrom: "",
  validTo: "",
  authorizationRequired: false,
  providerPhone: "",
  providerEmail: "",
  notes: ""
};

// Medical Aid Providers in Zimbabwe
const MEDICAL_AID_PROVIDERS = [
  { value: "cimas", label: "CIMAS" },
  { value: "psmas", label: "PSMAS" },
  { value: "first_mutual", label: "First Mutual Health" },
  { value: "fidelity", label: "Fidelity Life" },
  { value: "bonvie", label: "Bonvie" },
  { value: "cellmed", label: "CellMed" },
  { value: "masca", label: "MASCA" },
  { value: "premier_service", label: "Premier Service Medical Aid Society" },
  { value: "health_plus", label: "HealthPlus" },
  { value: "altfin", label: "Altfin Medical Aid" },
  { value: "cabs", label: "CABS Medical Aid" },
  { value: "momentum", label: "Momentum Health" },
  { value: "discovery", label: "Discovery Health" },
  { value: "medscheme", label: "Medscheme" },
  { value: "other", label: "Other" }
];

interface MedicalAidCaptureProps {
  data: MedicalAidData;
  onChange: (data: MedicalAidData) => void;
}

export function MedicalAidCapture({ data, onChange }: MedicalAidCaptureProps) {
  const updateField = <K extends keyof MedicalAidData>(field: K, value: MedicalAidData[K]) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Medical Aid Status */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Checkbox
              id="hasMedicalAid"
              checked={data.hasMedicalAid}
              onCheckedChange={(checked) => updateField("hasMedicalAid", checked as boolean)}
            />
            <Label htmlFor="hasMedicalAid" className="cursor-pointer text-base font-medium">
              Client has Medical Aid / Health Insurance
            </Label>
          </div>
          <p className="text-sm text-muted-foreground mt-2 ml-6">
            Select this if the client is covered by medical aid or health insurance
          </p>
        </CardContent>
      </Card>

      {data.hasMedicalAid && (
        <>
          {/* Provider & Scheme */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Medical Aid Provider
              </CardTitle>
              <CardDescription>
                Select the medical aid provider and scheme details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="providerName">Provider Name *</Label>
                  <Select value={data.providerName} onValueChange={(v) => updateField("providerName", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {MEDICAL_AID_PROVIDERS.map(provider => (
                        <SelectItem key={provider.value} value={provider.value}>
                          {provider.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schemeName">Scheme / Plan Name</Label>
                  <Input
                    id="schemeName"
                    value={data.schemeName}
                    onChange={(e) => updateField("schemeName", e.target.value)}
                    placeholder="e.g., Gold, Silver, Executive"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Membership Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Membership Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="memberNumber">Member Number *</Label>
                  <Input
                    id="memberNumber"
                    value={data.memberNumber}
                    onChange={(e) => updateField("memberNumber", e.target.value)}
                    placeholder="Enter membership number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dependantCode">Dependant Code</Label>
                  <Input
                    id="dependantCode"
                    value={data.dependantCode}
                    onChange={(e) => updateField("dependantCode", e.target.value)}
                    placeholder="e.g., 00, 01, 02"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="validFrom">Valid From</Label>
                  <Input
                    id="validFrom"
                    type="date"
                    value={data.validFrom}
                    onChange={(e) => updateField("validFrom", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validTo">Valid To</Label>
                  <Input
                    id="validTo"
                    type="date"
                    value={data.validTo}
                    onChange={(e) => updateField("validTo", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Principal Member (if different) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                Principal Member (If Different)
              </CardTitle>
              <CardDescription>
                Complete if client is a dependant on someone else's medical aid
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="principalMember">Principal Member Name</Label>
                  <Input
                    id="principalMember"
                    value={data.principalMember}
                    onChange={(e) => updateField("principalMember", e.target.value)}
                    placeholder="Leave blank if client is principal"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="principalMemberNumber">Principal Member Number</Label>
                  <Input
                    id="principalMemberNumber"
                    value={data.principalMemberNumber}
                    onChange={(e) => updateField("principalMemberNumber", e.target.value)}
                    placeholder="Principal's membership number"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="relationshipToPrincipal">Relationship to Principal</Label>
                <Select value={data.relationshipToPrincipal} onValueChange={(v) => updateField("relationshipToPrincipal", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self">Self (Principal Member)</SelectItem>
                    <SelectItem value="spouse">Spouse</SelectItem>
                    <SelectItem value="child">Child</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="sibling">Sibling</SelectItem>
                    <SelectItem value="other_dependant">Other Dependant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Provider Contact & Authorization */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Authorization & Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="authorizationRequired"
                  checked={data.authorizationRequired}
                  onCheckedChange={(checked) => updateField("authorizationRequired", checked as boolean)}
                />
                <Label htmlFor="authorizationRequired" className="cursor-pointer">
                  Pre-authorization required for services
                </Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="providerPhone">Medical Aid Contact Phone</Label>
                  <Input
                    id="providerPhone"
                    value={data.providerPhone}
                    onChange={(e) => updateField("providerPhone", e.target.value)}
                    placeholder="Provider's contact number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="providerEmail">Medical Aid Contact Email</Label>
                  <Input
                    id="providerEmail"
                    type="email"
                    value={data.providerEmail}
                    onChange={(e) => updateField("providerEmail", e.target.value)}
                    placeholder="Provider's email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={data.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  placeholder="Any additional notes about coverage, exclusions, etc."
                />
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
