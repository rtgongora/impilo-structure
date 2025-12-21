import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  X,
  Pill,
  TestTube,
  Stethoscope,
  Zap,
  Star,
  Clock,
  Send,
  Trash2,
  Package,
} from "lucide-react";
import { toast } from "sonner";

interface OrderItem {
  id: string;
  name: string;
  type: "medication" | "lab" | "imaging" | "procedure";
  category: string;
  quantity: number;
  details?: string;
  frequency?: string;
  priority: "routine" | "urgent" | "stat";
  isFavorite?: boolean;
}

interface OrderSet {
  id: string;
  name: string;
  items: Omit<OrderItem, "id" | "quantity">[];
}

const COMMON_ITEMS: Omit<OrderItem, "id" | "quantity">[] = [
  { name: "Complete Blood Count (CBC)", type: "lab", category: "Hematology", priority: "routine" },
  { name: "Basic Metabolic Panel", type: "lab", category: "Chemistry", priority: "routine" },
  { name: "Urinalysis", type: "lab", category: "Urinalysis", priority: "routine" },
  { name: "Chest X-Ray", type: "imaging", category: "Radiology", priority: "routine" },
  { name: "CT Head without Contrast", type: "imaging", category: "CT", priority: "urgent" },
  { name: "Paracetamol 1g PO", type: "medication", category: "Analgesic", priority: "routine", frequency: "Q6H PRN" },
  { name: "Normal Saline 1L IV", type: "medication", category: "Fluids", priority: "routine", frequency: "Over 4 hours" },
  { name: "Metronidazole 500mg IV", type: "medication", category: "Antibiotic", priority: "routine", frequency: "Q8H" },
  { name: "Omeprazole 40mg IV", type: "medication", category: "GI", priority: "routine", frequency: "Daily" },
  { name: "Wound Dressing", type: "procedure", category: "Nursing", priority: "routine" },
];

const ORDER_SETS: OrderSet[] = [
  {
    id: "sepsis",
    name: "Sepsis Bundle",
    items: [
      { name: "Blood Cultures x2", type: "lab", category: "Microbiology", priority: "stat" },
      { name: "Lactate Level", type: "lab", category: "Chemistry", priority: "stat" },
      { name: "CBC with Differential", type: "lab", category: "Hematology", priority: "stat" },
      { name: "Normal Saline 30mL/kg Bolus", type: "medication", category: "Fluids", priority: "stat" },
      { name: "Ceftriaxone 2g IV", type: "medication", category: "Antibiotic", priority: "stat" },
    ],
  },
  {
    id: "chest-pain",
    name: "Chest Pain Workup",
    items: [
      { name: "Troponin I", type: "lab", category: "Cardiac", priority: "stat" },
      { name: "ECG 12-lead", type: "procedure", category: "Cardiac", priority: "stat" },
      { name: "Chest X-Ray", type: "imaging", category: "Radiology", priority: "urgent" },
      { name: "Aspirin 300mg PO", type: "medication", category: "Antiplatelet", priority: "stat" },
    ],
  },
  {
    id: "dka",
    name: "DKA Management",
    items: [
      { name: "Blood Glucose", type: "lab", category: "Chemistry", priority: "stat" },
      { name: "Basic Metabolic Panel", type: "lab", category: "Chemistry", priority: "stat" },
      { name: "Venous Blood Gas", type: "lab", category: "Chemistry", priority: "stat" },
      { name: "Urinalysis with Ketones", type: "lab", category: "Urinalysis", priority: "stat" },
      { name: "Normal Saline 1L IV", type: "medication", category: "Fluids", priority: "stat", frequency: "Over 1 hour" },
      { name: "Regular Insulin 0.1 units/kg/hr", type: "medication", category: "Endocrine", priority: "stat" },
    ],
  },
];

const typeConfig = {
  medication: { icon: Pill, color: "bg-blue-500/10 text-blue-500" },
  lab: { icon: TestTube, color: "bg-purple-500/10 text-purple-500" },
  imaging: { icon: Stethoscope, color: "bg-amber-500/10 text-amber-500" },
  procedure: { icon: Zap, color: "bg-emerald-500/10 text-emerald-500" },
};

const priorityConfig = {
  routine: { color: "bg-muted text-muted-foreground", label: "Routine" },
  urgent: { color: "bg-amber-500/10 text-amber-500", label: "Urgent" },
  stat: { color: "bg-destructive/10 text-destructive", label: "STAT" },
};

export function OrderEntrySystem() {
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const addToCart = (item: Omit<OrderItem, "id" | "quantity">) => {
    const existingIndex = cart.findIndex((c) => c.name === item.name);
    if (existingIndex >= 0) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([...cart, { ...item, id: `order-${Date.now()}`, quantity: 1 }]);
    }
    toast.success(`Added ${item.name} to orders`);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const addOrderSet = (set: OrderSet) => {
    const newItems = set.items.map((item, index) => ({
      ...item,
      id: `order-${Date.now()}-${index}`,
      quantity: 1,
    }));
    setCart((prev) => [...prev, ...newItems]);
    toast.success(`Added ${set.name} order set`);
  };

  const clearCart = () => {
    setCart([]);
  };

  const submitOrders = () => {
    toast.success(`${cart.length} orders submitted successfully`);
    setCart([]);
  };

  const filteredItems = COMMON_ITEMS.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "all") return matchesSearch;
    return matchesSearch && item.type === activeTab;
  });

  const cartTotal = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="flex gap-6 h-[600px]">
      {/* Order Catalog */}
      <div className="flex-1 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="medication">
              <Pill className="h-4 w-4 mr-1" />
              Medications
            </TabsTrigger>
            <TabsTrigger value="lab">
              <TestTube className="h-4 w-4 mr-1" />
              Labs
            </TabsTrigger>
            <TabsTrigger value="imaging">
              <Stethoscope className="h-4 w-4 mr-1" />
              Imaging
            </TabsTrigger>
            <TabsTrigger value="procedure">
              <Zap className="h-4 w-4 mr-1" />
              Procedures
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {/* Quick Order Sets */}
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Quick Order Sets
              </h4>
              <div className="flex gap-2 flex-wrap">
                {ORDER_SETS.map((set) => (
                  <Button
                    key={set.id}
                    variant="outline"
                    size="sm"
                    onClick={() => addOrderSet(set)}
                    className="text-xs"
                  >
                    <Star className="h-3 w-3 mr-1 text-amber-500" />
                    {set.name}
                  </Button>
                ))}
              </div>
            </div>

            <Separator className="my-4" />

            {/* Items List */}
            <ScrollArea className="h-[380px]">
              <div className="space-y-2">
                {filteredItems.map((item, index) => {
                  const TypeIcon = typeConfig[item.type].icon;

                  return (
                    <Card
                      key={index}
                      className="hover:shadow-md transition-all cursor-pointer"
                      onClick={() => addToCart(item)}
                    >
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${typeConfig[item.type].color}`}>
                            <TypeIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.category}
                              {item.frequency && ` • ${item.frequency}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={priorityConfig[item.priority].color}>
                            {priorityConfig[item.priority].label}
                          </Badge>
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Order Cart */}
      <Card className="w-80 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Order Cart
              {cartTotal > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {cartTotal}
                </Badge>
              )}
            </span>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col">
          {cart.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
              <div>
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No orders added yet</p>
                <p className="text-xs">Click items to add them</p>
              </div>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1">
                <div className="space-y-2">
                  {cart.map((item) => {
                    const TypeIcon = typeConfig[item.type].icon;

                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                      >
                        <div className={`h-6 w-6 rounded flex items-center justify-center ${typeConfig[item.type].color}`}>
                          <TypeIcon className="h-3 w-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{item.name}</p>
                          <Badge variant="outline" className={`text-[10px] px-1 py-0 ${priorityConfig[item.priority].color}`}>
                            {priorityConfig[item.priority].label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-xs w-4 text-center">{item.quantity}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-destructive"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              <Separator className="my-3" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Items:</span>
                  <span className="font-medium">{cartTotal}</span>
                </div>
                <Button className="w-full" onClick={submitOrders}>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Orders
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
