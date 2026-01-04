import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Search,
  FileJson,
  Download,
  Upload,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  User,
  FileText,
  Pill,
  Activity,
  Stethoscope,
  Calendar,
  Building2,
  Copy,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FHIRResource {
  resourceType: string;
  id: string;
  meta?: {
    versionId?: string;
    lastUpdated?: string;
    profile?: string[];
  };
  [key: string]: any;
}

const RESOURCE_ICONS: Record<string, React.ReactNode> = {
  Patient: <User className="h-4 w-4" />,
  Observation: <Activity className="h-4 w-4" />,
  MedicationRequest: <Pill className="h-4 w-4" />,
  Condition: <Stethoscope className="h-4 w-4" />,
  Encounter: <Calendar className="h-4 w-4" />,
  Organization: <Building2 className="h-4 w-4" />,
  DocumentReference: <FileText className="h-4 w-4" />,
};

const MOCK_FHIR_BUNDLE: { resourceType: string; entry: { resource: FHIRResource }[] } = {
  resourceType: "Bundle",
  entry: [
    {
      resource: {
        resourceType: "Patient",
        id: "patient-001",
        meta: {
          versionId: "1",
          lastUpdated: "2024-01-15T10:30:00Z",
          profile: ["http://hl7.org/fhir/StructureDefinition/Patient"]
        },
        identifier: [
          { system: "urn:impilo:phid", value: "123A456B" }
        ],
        name: [{ family: "Moyo", given: ["John", "Tendai"] }],
        gender: "male",
        birthDate: "1985-03-15",
        address: [{ city: "Harare", country: "Zimbabwe" }],
        telecom: [{ system: "phone", value: "+263771234567" }]
      }
    },
    {
      resource: {
        resourceType: "Observation",
        id: "obs-bp-001",
        meta: { lastUpdated: "2024-01-15T09:45:00Z" },
        status: "final",
        category: [{ coding: [{ code: "vital-signs", display: "Vital Signs" }] }],
        code: { coding: [{ system: "http://loinc.org", code: "85354-9", display: "Blood Pressure" }] },
        subject: { reference: "Patient/patient-001" },
        effectiveDateTime: "2024-01-15T09:30:00Z",
        component: [
          { code: { coding: [{ code: "8480-6", display: "Systolic" }] }, valueQuantity: { value: 128, unit: "mmHg" } },
          { code: { coding: [{ code: "8462-4", display: "Diastolic" }] }, valueQuantity: { value: 82, unit: "mmHg" } }
        ]
      }
    },
    {
      resource: {
        resourceType: "MedicationRequest",
        id: "medrx-001",
        meta: { lastUpdated: "2024-01-10T14:20:00Z" },
        status: "active",
        intent: "order",
        medicationCodeableConcept: {
          coding: [{ system: "http://www.nlm.nih.gov/research/umls/rxnorm", code: "311995", display: "Metformin 500mg" }]
        },
        subject: { reference: "Patient/patient-001" },
        dosageInstruction: [{ text: "Take 1 tablet twice daily with meals", timing: { repeat: { frequency: 2, period: 1, periodUnit: "d" } } }]
      }
    },
    {
      resource: {
        resourceType: "Condition",
        id: "cond-001",
        meta: { lastUpdated: "2024-01-05T11:00:00Z" },
        clinicalStatus: { coding: [{ code: "active", display: "Active" }] },
        code: { coding: [{ system: "http://snomed.info/sct", code: "44054006", display: "Type 2 Diabetes Mellitus" }] },
        subject: { reference: "Patient/patient-001" },
        onsetDateTime: "2022-06-15"
      }
    }
  ]
};

export function FHIRResourceViewer() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedResource, setSelectedResource] = useState<FHIRResource | null>(
    MOCK_FHIR_BUNDLE.entry[0].resource
  );
  const [resourceFilter, setResourceFilter] = useState<string>("all");
  const [expandedPaths, setExpandedPaths] = useState<string[]>(["root"]);
  const [viewMode, setViewMode] = useState<"tree" | "json">("tree");

  const togglePath = (path: string) => {
    setExpandedPaths(prev =>
      prev.includes(path)
        ? prev.filter(p => p !== path)
        : [...prev, path]
    );
  };

  const resourceTypes = [...new Set(MOCK_FHIR_BUNDLE.entry.map(e => e.resource.resourceType))];

  const filteredResources = MOCK_FHIR_BUNDLE.entry.filter(entry => {
    const matchesSearch = entry.resource.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.resource.resourceType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = resourceFilter === "all" || entry.resource.resourceType === resourceFilter;
    return matchesSearch && matchesFilter;
  });

  const renderValue = (value: any, path: string, depth: number = 0): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">null</span>;
    }

    if (typeof value === "boolean") {
      return <span className="text-purple-500">{value.toString()}</span>;
    }

    if (typeof value === "number") {
      return <span className="text-blue-500">{value}</span>;
    }

    if (typeof value === "string") {
      if (value.startsWith("http")) {
        return (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
            {value.length > 50 ? value.substring(0, 50) + "..." : value}
            <ExternalLink className="h-3 w-3" />
          </a>
        );
      }
      return <span className="text-green-600">"{value}"</span>;
    }

    if (Array.isArray(value)) {
      const isExpanded = expandedPaths.includes(path);
      return (
        <Collapsible open={isExpanded} onOpenChange={() => togglePath(path)}>
          <CollapsibleTrigger className="flex items-center gap-1 hover:text-primary">
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            <span className="text-muted-foreground">[{value.length} items]</span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="ml-4 border-l pl-2 mt-1 space-y-1">
              {value.map((item, idx) => (
                <div key={idx}>
                  <span className="text-muted-foreground text-xs">[{idx}]</span>{" "}
                  {renderValue(item, `${path}[${idx}]`, depth + 1)}
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      );
    }

    if (typeof value === "object") {
      const keys = Object.keys(value);
      const isExpanded = expandedPaths.includes(path);
      return (
        <Collapsible open={isExpanded} onOpenChange={() => togglePath(path)}>
          <CollapsibleTrigger className="flex items-center gap-1 hover:text-primary">
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            <span className="text-muted-foreground">{"{"}{keys.length} properties{"}"}</span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="ml-4 border-l pl-2 mt-1 space-y-1">
              {keys.map(key => (
                <div key={key}>
                  <span className="text-orange-500">{key}</span>:{" "}
                  {renderValue(value[key], `${path}.${key}`, depth + 1)}
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return <span>{String(value)}</span>;
  };

  return (
    <div className="grid grid-cols-12 gap-4 h-full">
      {/* Resource List */}
      <div className="col-span-4 border-r">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileJson className="h-4 w-4" />
              FHIR Resources
            </CardTitle>
            <div className="flex gap-2 mt-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8"
                />
              </div>
            </div>
            <Select value={resourceFilter} onValueChange={setResourceFilter}>
              <SelectTrigger className="h-8 mt-2">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {resourceTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[450px]">
              <div className="space-y-1 p-2">
                {filteredResources.map((entry) => {
                  const resource = entry.resource;
                  const Icon = RESOURCE_ICONS[resource.resourceType] || <FileJson className="h-4 w-4" />;
                  
                  return (
                    <div
                      key={resource.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                        selectedResource?.id === resource.id
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-muted"
                      )}
                      onClick={() => {
                        setSelectedResource(resource);
                        setExpandedPaths(["root"]);
                      }}
                    >
                      <div className="p-2 bg-muted rounded">
                        {Icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{resource.resourceType}</p>
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          {resource.id}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        v{resource.meta?.versionId || "1"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Resource Detail */}
      <div className="col-span-8">
        {selectedResource ? (
          <Card className="h-full">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded">
                    {RESOURCE_ICONS[selectedResource.resourceType] || <FileJson className="h-5 w-5" />}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{selectedResource.resourceType}</CardTitle>
                    <CardDescription className="font-mono">{selectedResource.id}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex border rounded">
                    <Button
                      size="sm"
                      variant={viewMode === "tree" ? "secondary" : "ghost"}
                      className="rounded-r-none"
                      onClick={() => setViewMode("tree")}
                    >
                      Tree
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === "json" ? "secondary" : "ghost"}
                      className="rounded-l-none"
                      onClick={() => setViewMode("json")}
                    >
                      JSON
                    </Button>
                  </div>
                  <Button variant="outline" size="sm">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {selectedResource.meta && (
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span>Version: {selectedResource.meta.versionId}</span>
                  <span>Updated: {selectedResource.meta.lastUpdated}</span>
                  {selectedResource.meta.profile && (
                    <Badge variant="outline" className="text-xs">
                      {selectedResource.meta.profile[0]?.split("/").pop()}
                    </Badge>
                  )}
                </div>
              )}
            </CardHeader>

            <CardContent className="p-0">
              <ScrollArea className="h-[450px]">
                {viewMode === "tree" ? (
                  <div className="p-4 font-mono text-sm">
                    {renderValue(selectedResource, "root", 0)}
                  </div>
                ) : (
                  <pre className="p-4 text-sm overflow-x-auto">
                    {JSON.stringify(selectedResource, null, 2)}
                  </pre>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        ) : (
          <Card className="h-full flex items-center justify-center">
            <CardContent className="text-center text-muted-foreground">
              <FileJson className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a resource to view details</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
