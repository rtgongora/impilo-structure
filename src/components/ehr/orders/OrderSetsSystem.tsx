import { useState } from "react";
import { Search, Filter, Plus, Bug, Wind, Heart, Salad, Droplet, Scissors, Baby, Siren } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { OrderSetCard } from "./OrderSetCard";
import { OrderSetDialog } from "./OrderSetDialog";
import { MOCK_ORDER_SETS, ORDER_SET_CATEGORIES, type OrderSet } from "./orderSetsData";

const categoryIcons: Record<string, React.ElementType> = {
  infectious: Bug,
  respiratory: Wind,
  cardiac: Heart,
  gastrointestinal: Salad,
  endocrine: Droplet,
  surgical: Scissors,
  obstetric: Baby,
  paediatric: Baby,
  emergency: Siren,
};

export function OrderSetsSystem() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedOrderSet, setSelectedOrderSet] = useState<OrderSet | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredOrderSets = MOCK_ORDER_SETS.filter(os => {
    const matchesSearch = searchQuery === "" || 
      os.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      os.condition.toLowerCase().includes(searchQuery.toLowerCase()) ||
      os.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = activeCategory === "all" || os.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleOrderSetClick = (orderSet: OrderSet) => {
    setSelectedOrderSet(orderSet);
    setDialogOpen(true);
  };

  // Count order sets per category
  const categoryCounts = ORDER_SET_CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = MOCK_ORDER_SETS.filter(os => os.category === cat.id).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">Order Sets</h1>
            <p className="text-sm text-muted-foreground">Pre-defined order bundles for common conditions</p>
          </div>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Create Order Set
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search order sets by name or condition..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Categories Sidebar */}
        <div className="w-56 border-r p-4 overflow-y-auto hidden lg:block">
          <h3 className="text-sm font-medium mb-3">Categories</h3>
          <div className="space-y-1">
            <Button
              variant={activeCategory === "all" ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start"
              onClick={() => setActiveCategory("all")}
            >
              All Order Sets
              <Badge variant="secondary" className="ml-auto">{MOCK_ORDER_SETS.length}</Badge>
            </Button>
            {ORDER_SET_CATEGORIES.map(cat => {
              const Icon = categoryIcons[cat.id];
              return (
                <Button
                  key={cat.id}
                  variant={activeCategory === cat.id ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setActiveCategory(cat.id)}
                >
                  {Icon && <Icon className="h-4 w-4 mr-2" />}
                  {cat.name}
                  <Badge variant="secondary" className="ml-auto">{categoryCounts[cat.id] || 0}</Badge>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Mobile Category Tabs */}
        <div className="lg:hidden border-b px-4 py-2 w-full overflow-x-auto">
          <div className="flex gap-2">
            <Button
              variant={activeCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory("all")}
            >
              All
            </Button>
            {ORDER_SET_CATEGORIES.map(cat => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Order Sets Grid */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            {filteredOrderSets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredOrderSets.map(orderSet => (
                  <OrderSetCard
                    key={orderSet.id}
                    orderSet={orderSet}
                    onClick={handleOrderSetClick}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No order sets found matching your criteria.</p>
                <p className="text-sm mt-1">Try adjusting your search or category filter.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <OrderSetDialog
        orderSet={selectedOrderSet}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
