import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Search, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { PHIDService } from "@/services/phidService";
import { ProviderIdService } from "@/services/providerIdService";
import { IdGenerationService, ID_FORMATS } from "@/services/idGenerationService";

type IdType = "patient" | "provider" | "facility";

interface ValidationResult {
  isValid: boolean;
  idType: string;
  components?: Record<string, string>;
  error?: string;
  lookupData?: Record<string, unknown>;
}

export function IdValidationCard() {
  const [idType, setIdType] = useState<IdType>("patient");
  const [idValue, setIdValue] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);

  const handleValidate = async () => {
    if (!idValue.trim()) {
      toast.error("Please enter an ID to validate");
      return;
    }

    setIsValidating(true);
    setResult(null);

    try {
      let validationResult: ValidationResult;

      switch (idType) {
        case "patient": {
          const phidValidation = PHIDService.validate(idValue);
          validationResult = {
            isValid: phidValidation.isValid,
            idType: "Patient PHID",
            components: phidValidation.components as Record<string, string>,
            error: phidValidation.error
          };
          
          if (phidValidation.isValid) {
            const lookup = await PHIDService.lookupByPHID(idValue);
            if (lookup) {
              validationResult.lookupData = {
                status: lookup.isAssigned ? "Assigned" : "Unassigned",
                shrId: lookup.shrId,
                clientRegistryId: lookup.clientRegistryId
              };
            }
          }
          break;
        }
        
        case "provider": {
          const providerValidation = ProviderIdService.validate(idValue);
          validationResult = {
            isValid: providerValidation.isValid,
            idType: "Provider ID (Varapi)",
            components: providerValidation.components as Record<string, string>,
            error: providerValidation.error
          };
          
          if (providerValidation.isValid) {
            const lookup = await ProviderIdService.lookupProvider(idValue);
            if (lookup) {
              validationResult.lookupData = {
                status: lookup.isActive ? "Active" : "Inactive",
                specialty: lookup.specialty,
                registeredAt: lookup.registeredAt
              };
            }
          }
          break;
        }
        
        case "facility": {
          const facilityValidation = IdGenerationService.validateId(idValue, "facility");
          validationResult = {
            isValid: facilityValidation.isValid,
            idType: "Facility ID (Thuso)",
            components: facilityValidation.components,
            error: facilityValidation.error
          };
          break;
        }
        
        default:
          validationResult = { isValid: false, idType: "Unknown", error: "Invalid ID type" };
      }

      setResult(validationResult);
      
      if (validationResult.isValid) {
        toast.success("ID is valid!");
      } else {
        toast.error(validationResult.error || "Invalid ID");
      }
    } catch (error) {
      setResult({
        isValid: false,
        idType: idType,
        error: "Validation error occurred"
      });
      toast.error("Validation failed");
    } finally {
      setIsValidating(false);
    }
  };

  const getFormatHint = () => {
    switch (idType) {
      case "patient":
        return "DDDSDDDX (e.g., 123-A-456-8)";
      case "provider":
        return ID_FORMATS.PROVIDER_REGISTRY.description;
      case "facility":
        return ID_FORMATS.FACILITY_REGISTRY.description;
      default:
        return "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5 text-primary" />
          ID Validation & Lookup
        </CardTitle>
        <CardDescription>
          Validate format and check if ID exists in the system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>ID Type</Label>
            <Select value={idType} onValueChange={(v) => {
              setIdType(v as IdType);
              setResult(null);
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="patient">Patient PHID</SelectItem>
                <SelectItem value="provider">Provider ID (Varapi)</SelectItem>
                <SelectItem value="facility">Facility ID (Thuso)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label>ID Value</Label>
            <div className="flex gap-2">
              <Input
                placeholder={getFormatHint()}
                value={idValue}
                onChange={(e) => setIdValue(e.target.value.toUpperCase())}
                className="font-mono"
              />
              <Button onClick={handleValidate} disabled={isValidating}>
                <Search className="w-4 h-4 mr-2" />
                Validate
              </Button>
            </div>
          </div>
        </div>

        {result && (
          <div className={`p-4 rounded-lg border ${
            result.isValid 
              ? "bg-green-50 border-green-200" 
              : "bg-destructive/10 border-destructive/20"
          }`}>
            <div className="flex items-center gap-2 mb-3">
              {result.isValid ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-destructive" />
              )}
              <span className="font-medium">
                {result.isValid ? "Valid" : "Invalid"} {result.idType}
              </span>
              {result.isValid && (
                <Badge variant="outline" className="ml-auto">
                  Format OK
                </Badge>
              )}
            </div>

            {result.error && (
              <p className="text-sm text-destructive mb-2">{result.error}</p>
            )}

            {result.components && result.isValid && (
              <div className="space-y-2 mb-3">
                <p className="text-sm font-medium text-muted-foreground">Components:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(result.components).map(([key, value]) => (
                    <div key={key} className="bg-background/50 p-2 rounded text-center">
                      <p className="text-xs text-muted-foreground capitalize">{key}</p>
                      <p className="font-mono font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.lookupData && (
              <div className="space-y-2 pt-3 border-t">
                <p className="text-sm font-medium text-muted-foreground">Registry Data:</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(result.lookupData).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-muted-foreground capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </span>
                      <span className="font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {result.isValid && !result.lookupData && (
              <div className="flex items-center gap-2 pt-2 text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4" />
                ID format valid but not found in registry
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
