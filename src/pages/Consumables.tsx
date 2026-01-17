import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Plus, 
  Package, 
  Search,
  Syringe,
  Calendar,
  User,
  MapPin,
  FileText,
  DollarSign,
  Settings
} from "lucide-react";
import { format } from "date-fns";
import { ChargeCaptureQueue } from "@/components/charges/ChargeCaptureQueue";
import { PricingRulesManager } from "@/components/charges/PricingRulesManager";

const Consumables = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("usage");
  const [searchTerm, setSearchTerm] = useState("");
  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false);
  const [selectedEncounter, setSelectedEncounter] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [batchNumber, setBatchNumber] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch consumable usage records
  const { data: usageRecords, isLoading: usageLoading } = useQuery({
    queryKey: ["consumable-usage"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consumable_usage")
        .select(`
          *,
          stock_items:stock_item_id(name, sku, unit_of_measure),
          stock_locations:location_id(name),
          encounters:encounter_id(encounter_number, patients:patient_id(first_name, last_name))
        `)
        .order("administered_at", { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch stock items (consumables only)
  const { data: stockItems } = useQuery({
    queryKey: ["stock-items-consumables"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_items")
        .select("*")
        .eq("is_consumable", true)
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch locations
  const { data: locations } = useQuery({
    queryKey: ["stock-locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_locations")
        .select("*")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch active encounters
  const { data: encounters } = useQuery({
    queryKey: ["active-encounters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("encounters")
        .select(`
          id,
          encounter_number,
          patients:patient_id(first_name, last_name, mrn)
        `)
        .eq("status", "active")
        .order("admission_date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Record consumable usage
  const recordUsage = useMutation({
    mutationFn: async () => {
      const item = stockItems?.find(i => i.id === selectedItem);
      if (!item) throw new Error("Item not found");

      const qty = parseInt(quantity);
      const unitCost = item.unit_cost;
      const totalCost = qty * unitCost;

      const { error } = await supabase
        .from("consumable_usage")
        .insert({
          encounter_id: selectedEncounter,
          stock_item_id: selectedItem,
          location_id: selectedLocation,
          quantity: qty,
          unit_cost: unitCost,
          total_cost: totalCost,
          batch_number: batchNumber || null,
          notes: notes || null,
          administered_by: user?.id,
        });

      if (error) throw error;

      // Update stock levels
      const { data: stockLevel, error: stockError } = await supabase
        .from("stock_levels")
        .select("*")
        .eq("item_id", selectedItem)
        .eq("location_id", selectedLocation)
        .maybeSingle();

      if (stockError) throw stockError;

      if (stockLevel) {
        await supabase
          .from("stock_levels")
          .update({ 
            quantity_on_hand: Math.max(0, stockLevel.quantity_on_hand - qty),
            updated_at: new Date().toISOString()
          })
          .eq("id", stockLevel.id);
      }

      // Create stock movement record
      await supabase
        .from("stock_movements")
        .insert({
          item_id: selectedItem,
          from_location_id: selectedLocation,
          quantity: qty,
          movement_type: "consumption",
          reason: `Patient consumption - ${notes || 'No notes'}`,
          performed_by: user?.id,
          encounter_id: selectedEncounter,
          batch_number: batchNumber || null,
          unit_cost: unitCost,
        });
    },
    onSuccess: () => {
      toast.success("Consumable usage recorded successfully");
      queryClient.invalidateQueries({ queryKey: ["consumable-usage"] });
      queryClient.invalidateQueries({ queryKey: ["stock-levels"] });
      setIsRecordDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to record usage: " + error.message);
    },
  });

  const resetForm = () => {
    setSelectedEncounter("");
    setSelectedItem("");
    setSelectedLocation("");
    setQuantity("1");
    setBatchNumber("");
    setNotes("");
  };

  const filteredRecords = usageRecords?.filter(record => {
    const searchLower = searchTerm.toLowerCase();
    const itemName = (record.stock_items as any)?.name?.toLowerCase() || "";
    const encounterNumber = (record.encounters as any)?.encounter_number?.toLowerCase() || "";
    const patientName = `${(record.encounters as any)?.patients?.first_name || ""} ${(record.encounters as any)?.patients?.last_name || ""}`.toLowerCase();
    
    return itemName.includes(searchLower) || 
           encounterNumber.includes(searchLower) || 
           patientName.includes(searchLower);
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Syringe className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Consumables & Charges</h1>
                <p className="text-xs text-muted-foreground">Track usage, billing, and pricing</p>
              </div>
            </div>
          </div>

          <Dialog open={isRecordDialogOpen} onOpenChange={setIsRecordDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Record Usage
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Record Consumable Usage</DialogTitle>
                <DialogDescription>
                  Record consumables used for a patient encounter
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Patient Encounter *</Label>
                  <Select value={selectedEncounter} onValueChange={setSelectedEncounter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select encounter" />
                    </SelectTrigger>
                    <SelectContent>
                      {encounters?.map((encounter) => (
                        <SelectItem key={encounter.id} value={encounter.id}>
                          {encounter.encounter_number} - {(encounter.patients as any)?.first_name} {(encounter.patients as any)?.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Consumable Item *</Label>
                  <Select value={selectedItem} onValueChange={setSelectedItem}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select item" />
                    </SelectTrigger>
                    <SelectContent>
                      {stockItems?.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} ({item.sku})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Dispensing Location *</Label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations?.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quantity *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Batch Number</Label>
                    <Input
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes..."
                    rows={2}
                  />
                </div>

                {selectedItem && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">
                      <span className="font-medium">Unit Cost:</span>{" "}
                      ${stockItems?.find(i => i.id === selectedItem)?.unit_cost?.toFixed(2) || "0.00"}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Total Cost:</span>{" "}
                      ${((stockItems?.find(i => i.id === selectedItem)?.unit_cost || 0) * parseInt(quantity || "0")).toFixed(2)}
                    </p>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={() => recordUsage.mutate()}
                  disabled={!selectedEncounter || !selectedItem || !selectedLocation || !quantity || recordUsage.isPending}
                >
                  {recordUsage.isPending ? "Recording..." : "Record Usage"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="usage" className="gap-1">
              <Package className="h-3 w-3" />
              Usage Records
            </TabsTrigger>
            <TabsTrigger value="charge-queue" className="gap-1">
              <DollarSign className="h-3 w-3" />
              Charge Queue
            </TabsTrigger>
            <TabsTrigger value="pricing" className="gap-1">
              <Settings className="h-3 w-3" />
              Pricing Rules
            </TabsTrigger>
          </TabsList>

          <TabsContent value="usage">
            {/* Search */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by item, encounter, or patient..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Usage Records Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Usage Records
                </CardTitle>
                <CardDescription>
                  Recent consumable usage across all encounters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date/Time</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Patient/Encounter</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usageLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            Loading usage records...
                          </TableCell>
                        </TableRow>
                      ) : filteredRecords?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No usage records found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRecords?.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <div>
                                  <p className="text-sm">{format(new Date(record.administered_at), "MMM d, yyyy")}</p>
                                  <p className="text-xs text-muted-foreground">{format(new Date(record.administered_at), "HH:mm")}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{(record.stock_items as any)?.name}</p>
                                <p className="text-xs text-muted-foreground">{(record.stock_items as any)?.sku}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {record.quantity} {(record.stock_items as any)?.unit_of_measure}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-3 w-3 text-muted-foreground" />
                                <div>
                                  <p className="text-sm">
                                    {(record.encounters as any)?.patients?.first_name} {(record.encounters as any)?.patients?.last_name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {(record.encounters as any)?.encounter_number}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">{(record.stock_locations as any)?.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">${record.total_cost.toFixed(2)}</span>
                            </TableCell>
                            <TableCell>
                              {record.notes ? (
                                <div className="flex items-center gap-1">
                                  <FileText className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm truncate max-w-[150px]">{record.notes}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="charge-queue">
            <ChargeCaptureQueue />
          </TabsContent>

          <TabsContent value="pricing">
            <PricingRulesManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Consumables;
