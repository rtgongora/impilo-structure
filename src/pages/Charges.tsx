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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Plus, 
  DollarSign, 
  Search,
  Receipt,
  Calendar,
  User,
  Ban,
  Tag,
  Percent,
  FileText
} from "lucide-react";
import { format } from "date-fns";

const Charges = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("charges");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Add Charge Dialog State
  const [isChargeDialogOpen, setIsChargeDialogOpen] = useState(false);
  const [selectedEncounter, setSelectedEncounter] = useState("");
  const [selectedChargeItem, setSelectedChargeItem] = useState("");
  const [chargeQuantity, setChargeQuantity] = useState("1");
  const [discountPercent, setDiscountPercent] = useState("");
  const [chargeNotes, setChargeNotes] = useState("");

  // Add Charge Item Dialog State
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [itemCode, setItemCode] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemCategory, setItemCategory] = useState("");
  const [itemBasePrice, setItemBasePrice] = useState("");
  const [itemIsTaxable, setItemIsTaxable] = useState(false);
  const [itemTaxRate, setItemTaxRate] = useState("15");

  // Fetch encounter charges
  const { data: encounterCharges, isLoading: chargesLoading } = useQuery({
    queryKey: ["encounter-charges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("encounter_charges")
        .select(`
          *,
          charge_items:charge_item_id(name, code, category),
          encounters:encounter_id(encounter_number, patients:patient_id(first_name, last_name, mrn))
        `)
        .order("charged_at", { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch charge items catalog
  const { data: chargeItems, isLoading: itemsLoading } = useQuery({
    queryKey: ["charge-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("charge_items")
        .select("*")
        .eq("is_active", true)
        .order("category", { ascending: true });
      
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

  // Add charge to encounter
  const addCharge = useMutation({
    mutationFn: async () => {
      const item = chargeItems?.find(i => i.id === selectedChargeItem);
      if (!item) throw new Error("Charge item not found");

      const qty = parseInt(chargeQuantity);
      const unitPrice = item.base_price;
      const discountPct = parseFloat(discountPercent) || 0;
      const discountAmount = (unitPrice * qty * discountPct) / 100;
      const subtotal = (unitPrice * qty) - discountAmount;
      const taxAmount = item.is_taxable ? (subtotal * (item.tax_rate || 0)) / 100 : 0;
      const totalAmount = subtotal + taxAmount;

      const { error } = await supabase
        .from("encounter_charges")
        .insert({
          encounter_id: selectedEncounter,
          charge_item_id: selectedChargeItem,
          quantity: qty,
          unit_price: unitPrice,
          discount_percent: discountPct || null,
          discount_amount: discountAmount || null,
          tax_amount: taxAmount || null,
          total_amount: totalAmount,
          notes: chargeNotes || null,
          charged_by: user?.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Charge added successfully");
      queryClient.invalidateQueries({ queryKey: ["encounter-charges"] });
      setIsChargeDialogOpen(false);
      resetChargeForm();
    },
    onError: (error) => {
      toast.error("Failed to add charge: " + error.message);
    },
  });

  // Create new charge item
  const createChargeItem = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("charge_items")
        .insert({
          code: itemCode,
          name: itemName,
          description: itemDescription || null,
          category: itemCategory,
          base_price: parseFloat(itemBasePrice),
          is_taxable: itemIsTaxable,
          tax_rate: itemIsTaxable ? parseFloat(itemTaxRate) : null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Charge item created successfully");
      queryClient.invalidateQueries({ queryKey: ["charge-items"] });
      setIsItemDialogOpen(false);
      resetItemForm();
    },
    onError: (error) => {
      toast.error("Failed to create charge item: " + error.message);
    },
  });

  // Void charge
  const voidCharge = useMutation({
    mutationFn: async (chargeId: string) => {
      const { error } = await supabase
        .from("encounter_charges")
        .update({
          is_voided: true,
          voided_by: user?.id,
          voided_reason: "Voided by user",
        })
        .eq("id", chargeId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Charge voided successfully");
      queryClient.invalidateQueries({ queryKey: ["encounter-charges"] });
    },
    onError: (error) => {
      toast.error("Failed to void charge: " + error.message);
    },
  });

  const resetChargeForm = () => {
    setSelectedEncounter("");
    setSelectedChargeItem("");
    setChargeQuantity("1");
    setDiscountPercent("");
    setChargeNotes("");
  };

  const resetItemForm = () => {
    setItemCode("");
    setItemName("");
    setItemDescription("");
    setItemCategory("");
    setItemBasePrice("");
    setItemIsTaxable(false);
    setItemTaxRate("15");
  };

  const filteredCharges = encounterCharges?.filter(charge => {
    const searchLower = searchTerm.toLowerCase();
    const itemName = (charge.charge_items as any)?.name?.toLowerCase() || "";
    const encounterNumber = (charge.encounters as any)?.encounter_number?.toLowerCase() || "";
    const patientName = `${(charge.encounters as any)?.patients?.first_name || ""} ${(charge.encounters as any)?.patients?.last_name || ""}`.toLowerCase();
    
    return itemName.includes(searchLower) || 
           encounterNumber.includes(searchLower) || 
           patientName.includes(searchLower);
  });

  const filteredItems = chargeItems?.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return item.name.toLowerCase().includes(searchLower) || 
           item.code.toLowerCase().includes(searchLower) ||
           item.category.toLowerCase().includes(searchLower);
  });

  const categories = [...new Set(chargeItems?.map(i => i.category) || [])];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Charges & Billing</h1>
                <p className="text-xs text-muted-foreground">Manage encounter charges and billing items</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === "charges" ? (
              <Dialog open={isChargeDialogOpen} onOpenChange={setIsChargeDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Charge
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add Encounter Charge</DialogTitle>
                    <DialogDescription>
                      Add a charge to a patient encounter
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
                      <Label>Charge Item *</Label>
                      <Select value={selectedChargeItem} onValueChange={setSelectedChargeItem}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select charge item" />
                        </SelectTrigger>
                        <SelectContent>
                          {chargeItems?.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name} - ${item.base_price.toFixed(2)}
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
                          value={chargeQuantity}
                          onChange={(e) => setChargeQuantity(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Discount %</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={discountPercent}
                          onChange={(e) => setDiscountPercent(e.target.value)}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={chargeNotes}
                        onChange={(e) => setChargeNotes(e.target.value)}
                        placeholder="Additional notes..."
                        rows={2}
                      />
                    </div>

                    {selectedChargeItem && (
                      <div className="p-3 bg-muted rounded-lg space-y-1">
                        {(() => {
                          const item = chargeItems?.find(i => i.id === selectedChargeItem);
                          const qty = parseInt(chargeQuantity) || 0;
                          const unitPrice = item?.base_price || 0;
                          const discountPct = parseFloat(discountPercent) || 0;
                          const discountAmt = (unitPrice * qty * discountPct) / 100;
                          const subtotal = (unitPrice * qty) - discountAmt;
                          const taxAmt = item?.is_taxable ? (subtotal * (item.tax_rate || 0)) / 100 : 0;
                          const total = subtotal + taxAmt;

                          return (
                            <>
                              <p className="text-sm">
                                <span className="font-medium">Subtotal:</span> ${(unitPrice * qty).toFixed(2)}
                              </p>
                              {discountAmt > 0 && (
                                <p className="text-sm text-green-600">
                                  <span className="font-medium">Discount:</span> -${discountAmt.toFixed(2)}
                                </p>
                              )}
                              {item?.is_taxable && (
                                <p className="text-sm">
                                  <span className="font-medium">Tax ({item.tax_rate}%):</span> ${taxAmt.toFixed(2)}
                                </p>
                              )}
                              <p className="text-sm font-bold">
                                <span>Total:</span> ${total.toFixed(2)}
                              </p>
                            </>
                          );
                        })()}
                      </div>
                    )}

                    <Button
                      className="w-full"
                      onClick={() => addCharge.mutate()}
                      disabled={!selectedEncounter || !selectedChargeItem || !chargeQuantity || addCharge.isPending}
                    >
                      {addCharge.isPending ? "Adding..." : "Add Charge"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Charge Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create Charge Item</DialogTitle>
                    <DialogDescription>
                      Add a new billable item to the charge catalog
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Item Code *</Label>
                        <Input
                          value={itemCode}
                          onChange={(e) => setItemCode(e.target.value)}
                          placeholder="e.g., CONS-001"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Category *</Label>
                        <Select value={itemCategory} onValueChange={setItemCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Consultation">Consultation</SelectItem>
                            <SelectItem value="Procedure">Procedure</SelectItem>
                            <SelectItem value="Laboratory">Laboratory</SelectItem>
                            <SelectItem value="Radiology">Radiology</SelectItem>
                            <SelectItem value="Pharmacy">Pharmacy</SelectItem>
                            <SelectItem value="Supplies">Supplies</SelectItem>
                            <SelectItem value="Room & Board">Room & Board</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Item Name *</Label>
                      <Input
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                        placeholder="e.g., General Consultation"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={itemDescription}
                        onChange={(e) => setItemDescription(e.target.value)}
                        placeholder="Brief description..."
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Base Price *</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={itemBasePrice}
                        onChange={(e) => setItemBasePrice(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={itemIsTaxable}
                          onCheckedChange={setItemIsTaxable}
                        />
                        <Label>Taxable</Label>
                      </div>
                      {itemIsTaxable && (
                        <div className="flex items-center gap-2">
                          <Label>Tax Rate %</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            className="w-20"
                            value={itemTaxRate}
                            onChange={(e) => setItemTaxRate(e.target.value)}
                          />
                        </div>
                      )}
                    </div>

                    <Button
                      className="w-full"
                      onClick={() => createChargeItem.mutate()}
                      disabled={!itemCode || !itemName || !itemCategory || !itemBasePrice || createChargeItem.isPending}
                    >
                      {createChargeItem.isPending ? "Creating..." : "Create Charge Item"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="charges">
              <Receipt className="h-4 w-4 mr-2" />
              Encounter Charges
            </TabsTrigger>
            <TabsTrigger value="catalog">
              <Tag className="h-4 w-4 mr-2" />
              Charge Catalog
            </TabsTrigger>
          </TabsList>

          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={activeTab === "charges" ? "Search by item, encounter, or patient..." : "Search charge items..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          <TabsContent value="charges">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Encounter Charges
                </CardTitle>
                <CardDescription>
                  All charges posted to patient encounters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Patient/Encounter</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {chargesLoading ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8">
                            Loading charges...
                          </TableCell>
                        </TableRow>
                      ) : filteredCharges?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                            No charges found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCharges?.map((charge) => (
                          <TableRow key={charge.id} className={charge.is_voided ? "opacity-50" : ""}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <div>
                                  <p className="text-sm">{format(new Date(charge.charged_at), "MMM d, yyyy")}</p>
                                  <p className="text-xs text-muted-foreground">{format(new Date(charge.charged_at), "HH:mm")}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{(charge.charge_items as any)?.name}</p>
                                <Badge variant="outline" className="text-xs">
                                  {(charge.charge_items as any)?.category}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-3 w-3 text-muted-foreground" />
                                <div>
                                  <p className="text-sm">
                                    {(charge.encounters as any)?.patients?.first_name} {(charge.encounters as any)?.patients?.last_name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {(charge.encounters as any)?.encounter_number}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{charge.quantity}</TableCell>
                            <TableCell>${charge.unit_price.toFixed(2)}</TableCell>
                            <TableCell>
                              {charge.discount_percent ? (
                                <div className="flex items-center gap-1 text-green-600">
                                  <Percent className="h-3 w-3" />
                                  <span>{charge.discount_percent}%</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">${charge.total_amount.toFixed(2)}</span>
                            </TableCell>
                            <TableCell>
                              {charge.is_voided ? (
                                <Badge variant="destructive">Voided</Badge>
                              ) : (
                                <Badge variant="secondary">Active</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {!charge.is_voided && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => voidCharge.mutate(charge.id)}
                                  disabled={voidCharge.isPending}
                                >
                                  <Ban className="h-4 w-4" />
                                </Button>
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

          <TabsContent value="catalog">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Charge Item Catalog
                </CardTitle>
                <CardDescription>
                  Master list of billable items
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Base Price</TableHead>
                        <TableHead>Tax</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itemsLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            Loading charge items...
                          </TableCell>
                        </TableRow>
                      ) : filteredItems?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No charge items found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredItems?.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <code className="text-sm bg-muted px-2 py-1 rounded">{item.code}</code>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.name}</p>
                                {item.description && (
                                  <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.category}</Badge>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">${item.base_price.toFixed(2)}</span>
                            </TableCell>
                            <TableCell>
                              {item.is_taxable ? (
                                <Badge variant="secondary">{item.tax_rate}%</Badge>
                              ) : (
                                <span className="text-muted-foreground">Non-taxable</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.is_active ? "default" : "secondary"}>
                                {item.is_active ? "Active" : "Inactive"}
                              </Badge>
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
        </Tabs>
      </main>
    </div>
  );
};

export default Charges;
