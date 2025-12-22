import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Pill, 
  Plus, 
  Trash2, 
  Search, 
  AlertTriangle, 
  ShieldAlert,
  FileText,
  Send
} from "lucide-react";
import { toast } from "sonner";
import { useFormulary, useCreatePrescription, type FormularyItem } from "@/hooks/usePrescriptionData";

interface PrescriptionItemForm {
  medication_name: string;
  generic_name?: string;
  dosage: string;
  dosage_unit: string;
  frequency: string;
  route: string;
  duration?: string;
  quantity: number;
  instructions?: string;
  indication?: string;
  is_controlled: boolean;
  schedule?: string;
}

interface EPrescriptionBuilderProps {
  patientId: string;
  patientName: string;
  encounterId?: string;
  onComplete?: () => void;
}

const FREQUENCIES = [
  { value: "OD", label: "Once daily (OD)" },
  { value: "BD", label: "Twice daily (BD)" },
  { value: "TDS", label: "Three times daily (TDS)" },
  { value: "QID", label: "Four times daily (QID)" },
  { value: "Q4H", label: "Every 4 hours" },
  { value: "Q6H", label: "Every 6 hours" },
  { value: "Q8H", label: "Every 8 hours" },
  { value: "Q12H", label: "Every 12 hours" },
  { value: "PRN", label: "As needed (PRN)" },
  { value: "STAT", label: "Immediately (STAT)" },
  { value: "HS", label: "At bedtime (HS)" },
  { value: "AC", label: "Before meals (AC)" },
  { value: "PC", label: "After meals (PC)" },
  { value: "WEEKLY", label: "Weekly" },
];

const ROUTES = [
  { value: "PO", label: "Oral (PO)" },
  { value: "IV", label: "Intravenous (IV)" },
  { value: "IM", label: "Intramuscular (IM)" },
  { value: "SC", label: "Subcutaneous (SC)" },
  { value: "SL", label: "Sublingual (SL)" },
  { value: "TOP", label: "Topical" },
  { value: "INH", label: "Inhalation" },
  { value: "PR", label: "Rectal (PR)" },
  { value: "PV", label: "Vaginal (PV)" },
  { value: "OPTH", label: "Ophthalmic" },
  { value: "OTIC", label: "Otic (ear)" },
  { value: "NASAL", label: "Nasal" },
  { value: "TD", label: "Transdermal" },
];

export function EPrescriptionBuilder({ patientId, patientName, encounterId, onComplete }: EPrescriptionBuilderProps) {
  const { formulary, searchFormulary } = useFormulary();
  const { createPrescription, creating } = useCreatePrescription();
  
  const [items, setItems] = useState<PrescriptionItemForm[]>([]);
  const [showFormulary, setShowFormulary] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FormularyItem[]>([]);
  const [currentItem, setCurrentItem] = useState<Partial<PrescriptionItemForm>>({});

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      const results = await searchFormulary(query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const selectFromFormulary = (drug: FormularyItem) => {
    setCurrentItem({
      medication_name: drug.medication_name,
      generic_name: drug.generic_name || undefined,
      dosage: drug.available_strengths?.[0] || "",
      dosage_unit: "mg",
      is_controlled: drug.is_controlled,
      schedule: drug.dea_schedule || undefined,
    });
    setShowFormulary(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const addItem = () => {
    if (!currentItem.medication_name || !currentItem.dosage || !currentItem.frequency || !currentItem.route) {
      toast.error("Please complete all required fields");
      return;
    }

    setItems([...items, {
      medication_name: currentItem.medication_name!,
      generic_name: currentItem.generic_name,
      dosage: currentItem.dosage!,
      dosage_unit: currentItem.dosage_unit || "mg",
      frequency: currentItem.frequency!,
      route: currentItem.route!,
      duration: currentItem.duration,
      quantity: currentItem.quantity || 1,
      instructions: currentItem.instructions,
      indication: currentItem.indication,
      is_controlled: currentItem.is_controlled || false,
      schedule: currentItem.schedule,
    }]);

    setCurrentItem({});
    toast.success("Medication added to prescription");
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast.error("Please add at least one medication");
      return;
    }

    const result = await createPrescription(patientId, encounterId, items);
    if (result) {
      setItems([]);
      onComplete?.();
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            ePrescription Builder
          </div>
          <Badge variant="outline">{patientName}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden flex flex-col gap-4">
        {/* Add Medication Form */}
        <Card className="border-dashed">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Pill className="h-4 w-4 text-primary" />
              <h4 className="font-medium">Add Medication</h4>
              <Dialog open={showFormulary} onOpenChange={setShowFormulary}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="ml-auto">
                    <Search className="h-4 w-4 mr-1" />
                    Formulary
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Search Formulary</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Search medications..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      autoFocus
                    />
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-2">
                        {searchResults.map((drug) => (
                          <div
                            key={drug.id}
                            className="p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors"
                            onClick={() => selectFromFormulary(drug)}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">{drug.medication_name}</p>
                                {drug.generic_name && (
                                  <p className="text-sm text-muted-foreground">{drug.generic_name}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                  {drug.drug_class} • {drug.therapeutic_category}
                                </p>
                              </div>
                              <div className="flex flex-col gap-1 items-end">
                                <Badge
                                  variant={drug.formulary_status === "formulary" ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {drug.formulary_status}
                                </Badge>
                                {drug.is_controlled && (
                                  <Badge variant="destructive" className="text-xs">
                                    <ShieldAlert className="h-3 w-3 mr-1" />
                                    C-{drug.dea_schedule}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {drug.black_box_warning && (
                              <div className="mt-2 p-2 bg-destructive/10 rounded text-xs text-destructive flex items-start gap-1">
                                <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                                <span>{drug.black_box_warning}</span>
                              </div>
                            )}
                          </div>
                        ))}
                        {searchQuery.length >= 2 && searchResults.length === 0 && (
                          <p className="text-center text-muted-foreground py-8">No medications found</p>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Medication Name *</Label>
                <Input
                  value={currentItem.medication_name || ""}
                  onChange={(e) => setCurrentItem({ ...currentItem, medication_name: e.target.value })}
                  placeholder="Enter medication name"
                />
              </div>
              <div>
                <Label>Dosage *</Label>
                <div className="flex gap-2">
                  <Input
                    value={currentItem.dosage || ""}
                    onChange={(e) => setCurrentItem({ ...currentItem, dosage: e.target.value })}
                    placeholder="500"
                    className="w-24"
                  />
                  <Select
                    value={currentItem.dosage_unit || "mg"}
                    onValueChange={(v) => setCurrentItem({ ...currentItem, dosage_unit: v })}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mg">mg</SelectItem>
                      <SelectItem value="g">g</SelectItem>
                      <SelectItem value="mcg">mcg</SelectItem>
                      <SelectItem value="mL">mL</SelectItem>
                      <SelectItem value="units">units</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  value={currentItem.quantity || ""}
                  onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 0 })}
                  placeholder="30"
                />
              </div>
              <div>
                <Label>Frequency *</Label>
                <Select
                  value={currentItem.frequency || ""}
                  onValueChange={(v) => setCurrentItem({ ...currentItem, frequency: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Route *</Label>
                <Select
                  value={currentItem.route || ""}
                  onValueChange={(v) => setCurrentItem({ ...currentItem, route: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ROUTES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Duration</Label>
                <Input
                  value={currentItem.duration || ""}
                  onChange={(e) => setCurrentItem({ ...currentItem, duration: e.target.value })}
                  placeholder="7 days"
                />
              </div>
              <div>
                <Label>Indication</Label>
                <Input
                  value={currentItem.indication || ""}
                  onChange={(e) => setCurrentItem({ ...currentItem, indication: e.target.value })}
                  placeholder="Infection"
                />
              </div>
              <div className="col-span-2">
                <Label>Instructions</Label>
                <Textarea
                  value={currentItem.instructions || ""}
                  onChange={(e) => setCurrentItem({ ...currentItem, instructions: e.target.value })}
                  placeholder="Take with food, avoid alcohol..."
                  rows={2}
                />
              </div>
            </div>

            <Button onClick={addItem} className="w-full">
              <Plus className="h-4 w-4 mr-1" />
              Add to Prescription
            </Button>
          </CardContent>
        </Card>

        {/* Prescription Items */}
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Prescription Items ({items.length})</h4>
          </div>
          <ScrollArea className="h-[calc(100%-40px)]">
            <div className="space-y-2">
              {items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Pill className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No medications added yet</p>
                </div>
              ) : (
                items.map((item, index) => (
                  <Card key={index} className="border-l-4 border-l-primary">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.medication_name}</span>
                            {item.is_controlled && (
                              <Badge variant="destructive" className="text-xs">
                                <ShieldAlert className="h-3 w-3 mr-1" />
                                Controlled
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {item.dosage} {item.dosage_unit} • {item.frequency} • {item.route}
                          </p>
                          <p className="text-sm">
                            Qty: {item.quantity} {item.duration && `• ${item.duration}`}
                          </p>
                          {item.instructions && (
                            <p className="text-xs text-muted-foreground mt-1">{item.instructions}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={items.length === 0 || creating}
          size="lg"
          className="w-full"
        >
          <Send className="h-4 w-4 mr-2" />
          {creating ? "Creating..." : "Send to Pharmacy"}
        </Button>
      </CardContent>
    </Card>
  );
}
