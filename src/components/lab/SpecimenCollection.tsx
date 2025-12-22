import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TestTube, QrCode, Thermometer, AlertTriangle, CheckCircle2, Clock, MapPin } from "lucide-react";
import { useCreateSpecimen, useSpecimens, type Specimen } from "@/hooks/useSpecimenData";

interface SpecimenCollectionProps {
  patientId: string;
  patientName: string;
  encounterId?: string;
  labOrderId?: string;
  onComplete?: (specimen: Specimen) => void;
}

const SPECIMEN_TYPES = [
  { value: "blood", label: "Blood" },
  { value: "urine", label: "Urine" },
  { value: "stool", label: "Stool" },
  { value: "swab", label: "Swab" },
  { value: "tissue", label: "Tissue/Biopsy" },
  { value: "csf", label: "CSF (Cerebrospinal Fluid)" },
  { value: "sputum", label: "Sputum" },
  { value: "aspirate", label: "Aspirate" },
];

const COLLECTION_METHODS = [
  { value: "venipuncture", label: "Venipuncture" },
  { value: "fingerstick", label: "Fingerstick" },
  { value: "midstream", label: "Midstream Clean Catch" },
  { value: "catheter", label: "Catheter" },
  { value: "swab", label: "Swab" },
  { value: "biopsy", label: "Biopsy" },
  { value: "aspiration", label: "Aspiration" },
];

const CONTAINER_TYPES = [
  { value: "edta", label: "EDTA (Purple)" },
  { value: "sst", label: "SST (Gold/Red)" },
  { value: "citrate", label: "Citrate (Blue)" },
  { value: "heparin", label: "Heparin (Green)" },
  { value: "plain", label: "Plain (Red)" },
  { value: "urine_cup", label: "Urine Cup" },
  { value: "sterile_container", label: "Sterile Container" },
  { value: "culture_swab", label: "Culture Swab" },
];

export function SpecimenCollection({ patientId, patientName, encounterId, labOrderId, onComplete }: SpecimenCollectionProps) {
  const { createSpecimen, creating } = useCreateSpecimen();
  const { specimens, refetch } = useSpecimens(patientId);

  const [formData, setFormData] = useState({
    specimen_type: "",
    specimen_source: "",
    collection_site: "",
    collection_method: "",
    volume_collected: "",
    volume_unit: "mL",
    container_type: "",
    preservative: "",
    fasting_status: "unknown" as "fasting" | "non-fasting" | "unknown",
    collection_notes: "",
    priority: "routine",
    temperature_requirement: "",
    is_biohazard: false,
  });

  const handleSubmit = async () => {
    if (!formData.specimen_type) {
      return;
    }

    const result = await createSpecimen({
      patient_id: patientId,
      encounter_id: encounterId,
      lab_order_id: labOrderId,
      ...formData,
    });

    if (result) {
      setFormData({
        specimen_type: "",
        specimen_source: "",
        collection_site: "",
        collection_method: "",
        volume_collected: "",
        volume_unit: "mL",
        container_type: "",
        preservative: "",
        fasting_status: "unknown",
        collection_notes: "",
        priority: "routine",
        temperature_requirement: "",
        is_biohazard: false,
      });
      refetch();
      onComplete?.(result as Specimen);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "collected": return "bg-blue-500";
      case "in-transit": return "bg-yellow-500";
      case "received": return "bg-green-500";
      case "processing": return "bg-purple-500";
      case "completed": return "bg-success";
      case "rejected": return "bg-destructive";
      default: return "bg-muted";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
      {/* Collection Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5 text-primary" />
            Collect Specimen
          </CardTitle>
          <Badge variant="outline">{patientName}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Specimen Type *</Label>
              <Select value={formData.specimen_type} onValueChange={(v) => setFormData({ ...formData, specimen_type: v })}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {SPECIMEN_TYPES.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="stat">STAT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Collection Method</Label>
              <Select value={formData.collection_method} onValueChange={(v) => setFormData({ ...formData, collection_method: v })}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {COLLECTION_METHODS.map((m) => (<SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Container Type</Label>
              <Select value={formData.container_type} onValueChange={(v) => setFormData({ ...formData, container_type: v })}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {CONTAINER_TYPES.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Source/Site</Label>
              <Input value={formData.specimen_source} onChange={(e) => setFormData({ ...formData, specimen_source: e.target.value })} placeholder="Left arm, wound..." />
            </div>
            <div>
              <Label>Volume</Label>
              <div className="flex gap-1">
                <Input value={formData.volume_collected} onChange={(e) => setFormData({ ...formData, volume_collected: e.target.value })} placeholder="5" className="w-20" />
                <Select value={formData.volume_unit} onValueChange={(v) => setFormData({ ...formData, volume_unit: v })}>
                  <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mL">mL</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Fasting Status</Label>
              <Select value={formData.fasting_status} onValueChange={(v) => setFormData({ ...formData, fasting_status: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fasting">Fasting</SelectItem>
                  <SelectItem value="non-fasting">Non-fasting</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Temperature</Label>
              <Input value={formData.temperature_requirement} onChange={(e) => setFormData({ ...formData, temperature_requirement: e.target.value })} placeholder="Room temp, refrigerated..." />
            </div>
          </div>
          
          <div>
            <Label>Collection Notes</Label>
            <Textarea value={formData.collection_notes} onChange={(e) => setFormData({ ...formData, collection_notes: e.target.value })} placeholder="Any observations..." rows={2} />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="biohazard" checked={formData.is_biohazard} onCheckedChange={(c) => setFormData({ ...formData, is_biohazard: !!c })} />
            <Label htmlFor="biohazard" className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Biohazard
            </Label>
          </div>

          <Button onClick={handleSubmit} disabled={!formData.specimen_type || creating} className="w-full">
            <QrCode className="h-4 w-4 mr-2" />
            {creating ? "Collecting..." : "Collect & Generate Label"}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Specimens */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Recent Specimens</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <div className="space-y-2 p-4 pt-0">
              {specimens.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No specimens collected</p>
              ) : (
                specimens.slice(0, 10).map((spec) => (
                  <Card key={spec.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">{spec.specimen_id}</span>
                            <Badge className={getStatusColor(spec.status)}>{spec.status}</Badge>
                          </div>
                          <p className="text-sm font-medium mt-1">{spec.specimen_type}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(spec.collected_at).toLocaleTimeString()}</span>
                            {spec.collection_site && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{spec.collection_site}</span>}
                          </div>
                        </div>
                        {spec.is_biohazard && <AlertTriangle className="h-4 w-4 text-warning" />}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
