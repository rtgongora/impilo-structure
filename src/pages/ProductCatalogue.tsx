import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Filter, 
  Package, 
  Building2, 
  Pill, 
  FlaskConical,
  Stethoscope,
  ShieldCheck,
  Tag,
  ArrowLeft,
  Grid3X3,
  List,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Product {
  id: string;
  name: string;
  generic_name: string | null;
  description: string | null;
  sku: string | null;
  category_id: string | null;
  manufacturer_id: string | null;
  unit_of_measure: string;
  strength: string | null;
  dosage_form: string | null;
  requires_prescription: boolean;
  is_controlled: boolean;
  image_url: string | null;
  status: string;
  category?: { name: string; slug: string; category_type: string } | null;
  manufacturer?: { name: string } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category_type: string;
  icon: string | null;
  requires_prescription: boolean;
  is_controlled: boolean;
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  pharmaceutical: Pill,
  medical_device: Stethoscope,
  laboratory: FlaskConical,
  consumable: Package,
  equipment: Building2,
  ppe: ShieldCheck,
  diagnostic: FlaskConical,
  nutritional: Package,
  other: Tag,
};

export default function ProductCatalogue() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["product-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data as Category[];
    },
  });

  // Fetch products with category and manufacturer info
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["catalogue-products", selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select(`
          *,
          category:product_categories(name, slug, category_type),
          manufacturer:manufacturers(name)
        `)
        .eq("is_active", true)
        .eq("status", "approved");

      if (selectedCategory !== "all") {
        query = query.eq("category_id", selectedCategory);
      }

      const { data, error } = await query.order("name");
      if (error) throw error;
      return data as Product[];
    },
  });

  // Filter products by search term
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const lowerSearch = searchTerm.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerSearch) ||
        p.generic_name?.toLowerCase().includes(lowerSearch) ||
        p.sku?.toLowerCase().includes(lowerSearch) ||
        p.description?.toLowerCase().includes(lowerSearch)
    );
  }, [products, searchTerm]);

  const getCategoryIcon = (type: string) => {
    const Icon = categoryIcons[type] || Tag;
    return <Icon className="h-5 w-5" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold">Health Products Catalogue</h1>
                <p className="text-xs text-muted-foreground">Browse approved health products</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products by name, generic name, or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category Pills */}
        <ScrollArea className="w-full whitespace-nowrap mb-6">
          <div className="flex gap-2 pb-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
            >
              All Products
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
                className="flex items-center gap-2"
              >
                {getCategoryIcon(cat.category_type)}
                {cat.name}
              </Button>
            ))}
          </div>
        </ScrollArea>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Products Grid/List */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-3">
                  <div className="w-full h-32 bg-muted rounded-lg" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No products found</h3>
            <p className="text-muted-foreground">
              {searchTerm
                ? "Try adjusting your search terms"
                : "No approved products in this category yet"}
            </p>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all group"
                onClick={() => navigate(`/catalogue/product/${product.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <CardTitle className="text-sm line-clamp-2">{product.name}</CardTitle>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
                  </div>
                  {product.generic_name && (
                    <p className="text-xs text-muted-foreground mb-2">{product.generic_name}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {product.category && (
                      <Badge variant="secondary" className="text-xs">
                        {product.category.name}
                      </Badge>
                    )}
                    {product.requires_prescription && (
                      <Badge variant="destructive" className="text-xs">
                        Rx
                      </Badge>
                    )}
                    {product.is_controlled && (
                      <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">
                        Controlled
                      </Badge>
                    )}
                  </div>
                  {product.manufacturer && (
                    <p className="text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3 inline mr-1" />
                      {product.manufacturer.name}
                    </p>
                  )}
                  {product.strength && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {product.strength} {product.dosage_form && `• ${product.dosage_form}`}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all group"
                onClick={() => navigate(`/catalogue/product/${product.id}`)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">{product.name}</h3>
                      {product.requires_prescription && (
                        <Badge variant="destructive" className="text-xs shrink-0">Rx</Badge>
                      )}
                    </div>
                    {product.generic_name && (
                      <p className="text-sm text-muted-foreground truncate">{product.generic_name}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      {product.category && <span>{product.category.name}</span>}
                      {product.manufacturer && (
                        <>
                          <span>•</span>
                          <span>{product.manufacturer.name}</span>
                        </>
                      )}
                      {product.strength && (
                        <>
                          <span>•</span>
                          <span>{product.strength}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
