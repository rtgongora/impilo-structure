import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Package,
  ArrowLeft,
  Plus,
  Search,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  BarChart3,
  Warehouse,
  ArrowRightLeft,
  ClipboardList,
  ShoppingCart,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { StockAlertsDashboard } from "@/components/stock/StockAlertsDashboard";
import { PurchaseOrderManager } from "@/components/stock/PurchaseOrderManager";
import { StockCountWorkflow } from "@/components/stock/StockCountWorkflow";

interface StockItem {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category_id: string | null;
  unit_of_measure: string;
  unit_cost: number;
  selling_price: number;
  reorder_level: number;
  is_consumable: boolean;
  is_chargeable: boolean;
  is_active: boolean;
}

interface StockLevel {
  id: string;
  item_id: string;
  location_id: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  batch_number: string | null;
  expiry_date: string | null;
  stock_items?: StockItem;
  stock_locations?: StockLocation;
}

interface StockLocation {
  id: string;
  name: string;
  location_type: string;
  is_active: boolean;
}

interface StockCategory {
  id: string;
  name: string;
  description: string | null;
}

const Stock = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("items");
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [locations, setLocations] = useState<StockLocation[]>([]);
  const [categories, setCategories] = useState<StockCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false);
  const [isMovementOpen, setIsMovementOpen] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [itemsRes, levelsRes, locationsRes, categoriesRes] = await Promise.all([
        supabase.from("stock_items").select("*").order("name"),
        supabase.from("stock_levels").select("*, stock_items(*), stock_locations(*)"),
        supabase.from("stock_locations").select("*").order("name"),
        supabase.from("stock_categories").select("*").order("name"),
      ]);

      if (itemsRes.error) throw itemsRes.error;
      if (levelsRes.error) throw levelsRes.error;
      if (locationsRes.error) throw locationsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      setStockItems(itemsRes.data || []);
      setStockLevels(levelsRes.data || []);
      setLocations(locationsRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error("Error fetching stock data:", error);
      toast.error("Failed to load stock data");
    } finally {
      setLoading(false);
    }
  };

  const getTotalStock = (itemId: string) => {
    return stockLevels
      .filter(sl => sl.item_id === itemId)
      .reduce((sum, sl) => sum + sl.quantity_on_hand, 0);
  };

  const getLowStockItems = () => {
    return stockItems.filter(item => {
      const total = getTotalStock(item.id);
      return total <= item.reorder_level;
    });
  };

  const filteredItems = stockItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Stock Management</h1>
                <p className="text-xs text-muted-foreground">Inventory, items, and movements</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Dialog open={isMovementOpen} onOpenChange={setIsMovementOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Stock Movement
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Stock Movement</DialogTitle>
                  <DialogDescription>Transfer, receive, or issue stock</DialogDescription>
                </DialogHeader>
                <StockMovementForm 
                  items={stockItems} 
                  locations={locations} 
                  onSuccess={() => { setIsMovementOpen(false); fetchAllData(); }} 
                />
              </DialogContent>
            </Dialog>

            <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Stock Item</DialogTitle>
                  <DialogDescription>Add a new item to inventory</DialogDescription>
                </DialogHeader>
                <AddStockItemForm 
                  categories={categories}
                  onSuccess={() => { setIsAddItemOpen(false); fetchAllData(); }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stockItems.length}</p>
                <p className="text-xs text-muted-foreground">Total Items</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Warehouse className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{locations.length}</p>
                <p className="text-xs text-muted-foreground">Locations</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{getLowStockItems().length}</p>
                <p className="text-xs text-muted-foreground">Low Stock Items</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{categories.length}</p>
                <p className="text-xs text-muted-foreground">Categories</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alert */}
        {getLowStockItems().length > 0 && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span className="font-medium text-orange-800">Low Stock Alert</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {getLowStockItems().slice(0, 5).map(item => (
                  <Badge key={item.id} variant="outline" className="bg-white">
                    {item.name} ({getTotalStock(item.id)}/{item.reorder_level})
                  </Badge>
                ))}
                {getLowStockItems().length > 5 && (
                  <Badge variant="secondary">+{getLowStockItems().length - 5} more</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-4">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="items">Stock Items</TabsTrigger>
              <TabsTrigger value="levels">Stock Levels</TabsTrigger>
              <TabsTrigger value="locations">Locations</TabsTrigger>
              <TabsTrigger value="alerts" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Alerts
              </TabsTrigger>
              <TabsTrigger value="purchase-orders" className="gap-1">
                <ShoppingCart className="h-3 w-3" />
                Purchase Orders
              </TabsTrigger>
              <TabsTrigger value="stock-counts" className="gap-1">
                <ClipboardList className="h-3 w-3" />
                Stock Counts
              </TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>

          <TabsContent value="items">
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "No items found" : "No stock items added yet"}
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SKU</TableHead>
                          <TableHead>Item Name</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead className="text-right">Unit Cost</TableHead>
                          <TableHead className="text-right">Selling Price</TableHead>
                          <TableHead className="text-right">Total Stock</TableHead>
                          <TableHead className="text-right">Reorder Level</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredItems.map((item) => {
                          const totalStock = getTotalStock(item.id);
                          const isLow = totalStock <= item.reorder_level;
                          return (
                            <TableRow key={item.id}>
                              <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{item.name}</p>
                                  <div className="flex gap-1 mt-1">
                                    {item.is_consumable && <Badge variant="outline" className="text-xs">Consumable</Badge>}
                                    {item.is_chargeable && <Badge variant="outline" className="text-xs">Chargeable</Badge>}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{item.unit_of_measure}</TableCell>
                              <TableCell className="text-right">${item.unit_cost.toFixed(2)}</TableCell>
                              <TableCell className="text-right">${item.selling_price.toFixed(2)}</TableCell>
                              <TableCell className="text-right">
                                <span className={isLow ? "text-orange-600 font-medium" : ""}>
                                  {totalStock}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">{item.reorder_level}</TableCell>
                              <TableCell>
                                {isLow ? (
                                  <Badge variant="destructive" className="gap-1">
                                    <TrendingDown className="h-3 w-3" />
                                    Low
                                  </Badge>
                                ) : (
                                  <Badge variant="default" className="gap-1 bg-green-600">
                                    <TrendingUp className="h-3 w-3" />
                                    OK
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="levels">
            <Card>
              <CardContent className="p-0">
                {stockLevels.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No stock levels recorded yet
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Reserved</TableHead>
                          <TableHead>Batch</TableHead>
                          <TableHead>Expiry</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stockLevels.map((level) => (
                          <TableRow key={level.id}>
                            <TableCell className="font-medium">
                              {level.stock_items?.name || "Unknown"}
                            </TableCell>
                            <TableCell>{level.stock_locations?.name || "Unknown"}</TableCell>
                            <TableCell className="text-right">{level.quantity_on_hand}</TableCell>
                            <TableCell className="text-right">{level.quantity_reserved}</TableCell>
                            <TableCell>{level.batch_number || "-"}</TableCell>
                            <TableCell>{level.expiry_date || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="locations">
            <div className="flex justify-end mb-4">
              <Dialog open={isAddLocationOpen} onOpenChange={setIsAddLocationOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Location
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Stock Location</DialogTitle>
                    <DialogDescription>Add a new storage location</DialogDescription>
                  </DialogHeader>
                  <AddLocationForm onSuccess={() => { setIsAddLocationOpen(false); fetchAllData(); }} />
                </DialogContent>
              </Dialog>
            </div>
            <Card>
              <CardContent className="p-0">
                {locations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No locations added yet
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Location Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Items</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {locations.map((location) => {
                        const itemCount = stockLevels.filter(sl => sl.location_id === location.id).length;
                        return (
                          <TableRow key={location.id}>
                            <TableCell className="font-medium">{location.name}</TableCell>
                            <TableCell className="capitalize">{location.location_type.replace("_", " ")}</TableCell>
                            <TableCell>
                              <Badge variant={location.is_active ? "default" : "secondary"}>
                                {location.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">{itemCount}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts">
            <StockAlertsDashboard />
          </TabsContent>

          <TabsContent value="purchase-orders">
            <PurchaseOrderManager />
          </TabsContent>

          <TabsContent value="stock-counts">
            <StockCountWorkflow />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

// Add Stock Item Form
const AddStockItemForm = ({ categories, onSuccess }: { categories: StockCategory[], onSuccess: () => void }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    description: "",
    unit_of_measure: "unit",
    unit_cost: "0",
    selling_price: "0",
    reorder_level: "10",
    is_consumable: true,
    is_chargeable: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("stock_items").insert({
        sku: formData.sku,
        name: formData.name,
        description: formData.description || null,
        unit_of_measure: formData.unit_of_measure,
        unit_cost: parseFloat(formData.unit_cost),
        selling_price: parseFloat(formData.selling_price),
        reorder_level: parseInt(formData.reorder_level),
        is_consumable: formData.is_consumable,
        is_chargeable: formData.is_chargeable,
      });
      if (error) throw error;
      toast.success("Stock item added");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to add item");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>SKU *</Label>
          <Input 
            value={formData.sku} 
            onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
            placeholder="e.g., MED-001"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Unit of Measure</Label>
          <Select value={formData.unit_of_measure} onValueChange={(v) => setFormData(prev => ({ ...prev, unit_of_measure: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unit">Unit</SelectItem>
              <SelectItem value="box">Box</SelectItem>
              <SelectItem value="pack">Pack</SelectItem>
              <SelectItem value="bottle">Bottle</SelectItem>
              <SelectItem value="vial">Vial</SelectItem>
              <SelectItem value="tablet">Tablet</SelectItem>
              <SelectItem value="ml">ml</SelectItem>
              <SelectItem value="mg">mg</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Item Name *</Label>
        <Input 
          value={formData.name} 
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Item name"
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea 
          value={formData.description} 
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Item description"
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Unit Cost</Label>
          <Input 
            type="number" 
            step="0.01"
            value={formData.unit_cost} 
            onChange={(e) => setFormData(prev => ({ ...prev, unit_cost: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Selling Price</Label>
          <Input 
            type="number" 
            step="0.01"
            value={formData.selling_price} 
            onChange={(e) => setFormData(prev => ({ ...prev, selling_price: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Reorder Level</Label>
          <Input 
            type="number" 
            value={formData.reorder_level} 
            onChange={(e) => setFormData(prev => ({ ...prev, reorder_level: e.target.value }))}
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Add Item
      </Button>
    </form>
  );
};

// Add Location Form
const AddLocationForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    location_type: "pharmacy",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("stock_locations").insert(formData);
      if (error) throw error;
      toast.success("Location added");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to add location");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Location Name *</Label>
        <Input 
          value={formData.name} 
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Main Pharmacy"
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Location Type</Label>
        <Select value={formData.location_type} onValueChange={(v) => setFormData(prev => ({ ...prev, location_type: v }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="main_store">Main Store</SelectItem>
            <SelectItem value="pharmacy">Pharmacy</SelectItem>
            <SelectItem value="ward">Ward</SelectItem>
            <SelectItem value="theatre">Theatre</SelectItem>
            <SelectItem value="lab">Laboratory</SelectItem>
            <SelectItem value="radiology">Radiology</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea 
          value={formData.description} 
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Location description"
        />
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Add Location
      </Button>
    </form>
  );
};

// Stock Movement Form
const StockMovementForm = ({ items, locations, onSuccess }: { items: StockItem[], locations: StockLocation[], onSuccess: () => void }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    item_id: "",
    movement_type: "receipt",
    from_location_id: "",
    to_location_id: "",
    quantity: "1",
    batch_number: "",
    reason: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Insert movement record
      const { error: movementError } = await supabase.from("stock_movements").insert({
        item_id: formData.item_id,
        movement_type: formData.movement_type,
        from_location_id: formData.from_location_id || null,
        to_location_id: formData.to_location_id || null,
        quantity: parseInt(formData.quantity),
        batch_number: formData.batch_number || null,
        reason: formData.reason || null,
      });
      if (movementError) throw movementError;

      // Update stock levels
      if (formData.movement_type === "receipt" && formData.to_location_id) {
        // Check if level exists
        const { data: existing } = await supabase
          .from("stock_levels")
          .select("*")
          .eq("item_id", formData.item_id)
          .eq("location_id", formData.to_location_id)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("stock_levels")
            .update({ quantity_on_hand: existing.quantity_on_hand + parseInt(formData.quantity) })
            .eq("id", existing.id);
        } else {
          await supabase.from("stock_levels").insert({
            item_id: formData.item_id,
            location_id: formData.to_location_id,
            quantity_on_hand: parseInt(formData.quantity),
            batch_number: formData.batch_number || null,
          });
        }
      }

      toast.success("Stock movement recorded");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to record movement");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Movement Type</Label>
        <Select value={formData.movement_type} onValueChange={(v) => setFormData(prev => ({ ...prev, movement_type: v }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="receipt">Receipt (Stock In)</SelectItem>
            <SelectItem value="issue">Issue (Stock Out)</SelectItem>
            <SelectItem value="transfer">Transfer</SelectItem>
            <SelectItem value="adjustment">Adjustment</SelectItem>
            <SelectItem value="return">Return</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Item *</Label>
        <Select value={formData.item_id} onValueChange={(v) => setFormData(prev => ({ ...prev, item_id: v }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select item" />
          </SelectTrigger>
          <SelectContent>
            {items.map(item => (
              <SelectItem key={item.id} value={item.id}>{item.name} ({item.sku})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {(formData.movement_type === "issue" || formData.movement_type === "transfer") && (
          <div className="space-y-2">
            <Label>From Location</Label>
            <Select value={formData.from_location_id} onValueChange={(v) => setFormData(prev => ({ ...prev, from_location_id: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map(loc => (
                  <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {(formData.movement_type === "receipt" || formData.movement_type === "transfer") && (
          <div className="space-y-2">
            <Label>To Location *</Label>
            <Select value={formData.to_location_id} onValueChange={(v) => setFormData(prev => ({ ...prev, to_location_id: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map(loc => (
                  <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Quantity *</Label>
          <Input 
            type="number" 
            value={formData.quantity} 
            onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
            min="1"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Batch Number</Label>
          <Input 
            value={formData.batch_number} 
            onChange={(e) => setFormData(prev => ({ ...prev, batch_number: e.target.value }))}
            placeholder="Optional"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Reason/Notes</Label>
        <Textarea 
          value={formData.reason} 
          onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
          placeholder="Reason for movement"
        />
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Record Movement
      </Button>
    </form>
  );
};

export default Stock;
