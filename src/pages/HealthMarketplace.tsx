import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VendorRatingDisplay } from "@/components/marketplace/VendorRating";
import { PackageDeals } from "@/components/marketplace/PackageDeals";
import {
  Search,
  Filter,
  Package,
  Building2,
  MapPin,
  Star,
  Truck,
  Clock,
  ArrowLeft,
  ShoppingCart,
  Store,
  ChevronRight,
  Lock,
  AlertCircle,
  Sparkles,
} from "lucide-react";

interface VendorProduct {
  id: string;
  vendor_id: string;
  product_id: string;
  stock_quantity: number;
  unit_price: number;
  currency: string;
  discount_percent: number;
  is_available: boolean;
  is_featured: boolean;
  lead_time_days: number;
  product?: {
    id: string;
    name: string;
    generic_name: string | null;
    image_url: string | null;
    requires_prescription: boolean;
    is_controlled: boolean;
    strength: string | null;
    dosage_form: string | null;
  } | null;
  vendor?: {
    id: string;
    name: string;
    vendor_type: string;
    city: string | null;
    province: string | null;
    rating: number;
    delivery_available: boolean;
  } | null;
}

interface Vendor {
  id: string;
  name: string;
  vendor_type: string;
  city: string | null;
  province: string | null;
  rating: number;
  total_reviews: number;
  delivery_available: boolean;
  logo_url: string | null;
}

export default function HealthMarketplace() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("products");
  const [sortBy, setSortBy] = useState("price_low");

  // Fetch vendor products (marketplace listings)
  const { data: vendorProducts = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["marketplace-products", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("vendor_products")
        .select(`
          *,
          product:products(id, name, generic_name, image_url, requires_prescription, is_controlled, strength, dosage_form),
          vendor:vendors(id, name, vendor_type, city, province, rating, delivery_available)
        `)
        .eq("is_available", true)
        .gt("stock_quantity", 0);

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data as VendorProduct[];
    },
    enabled: !!user, // Only fetch if logged in
  });

  // Fetch vendors
  const { data: vendors = [], isLoading: loadingVendors } = useQuery({
    queryKey: ["marketplace-vendors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("status", "approved")
        .order("rating", { ascending: false });
      if (error) throw error;
      return data as Vendor[];
    },
    enabled: !!user,
  });

  // Filter and sort products
  const filteredProducts = vendorProducts
    .filter((vp) => {
      if (!searchTerm) return true;
      const lowerSearch = searchTerm.toLowerCase();
      return (
        vp.product?.name.toLowerCase().includes(lowerSearch) ||
        vp.product?.generic_name?.toLowerCase().includes(lowerSearch) ||
        vp.vendor?.name.toLowerCase().includes(lowerSearch)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price_low":
          return a.unit_price - b.unit_price;
        case "price_high":
          return b.unit_price - a.unit_price;
        case "rating":
          return (b.vendor?.rating || 0) - (a.vendor?.rating || 0);
        default:
          return 0;
      }
    });

  const formatPrice = (price: number, currency: string = "ZAR") => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency,
    }).format(price);
  };

  // Not logged in view
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-lg font-semibold">Health Marketplace</h1>
                  <p className="text-xs text-muted-foreground">Compare prices & order from verified vendors</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="max-w-md mx-auto text-center p-8">
            <Lock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <CardTitle className="mb-2">Sign In Required</CardTitle>
            <CardDescription className="mb-6">
              Please sign in to browse the Health Marketplace and compare prices from verified vendors.
            </CardDescription>
            <Button onClick={() => navigate("/auth")} className="w-full">
              Sign In to Continue
            </Button>
          </Card>
        </main>
      </div>
    );
  }

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
                <h1 className="text-lg font-semibold">Health Marketplace</h1>
                <p className="text-xs text-muted-foreground">Compare prices & order from verified vendors</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Cart (0)
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products or vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price_low">Price: Low to High</SelectItem>
              <SelectItem value="price_high">Price: High to Low</SelectItem>
              <SelectItem value="rating">Vendor Rating</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Package Deals Section */}
        <div className="mb-8">
          <PackageDeals />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="vendors" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Vendors
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            {loadingProducts ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-24 bg-muted rounded mb-3" />
                      <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <Card className="p-12 text-center">
                <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No products available</h3>
                <p className="text-muted-foreground">
                  {searchTerm
                    ? "Try adjusting your search terms"
                    : "Check back later for available products"}
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map((vp) => (
                  <Card
                    key={vp.id}
                    className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all group"
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-3 mb-3">
                        <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                          {vp.product?.image_url ? (
                            <img
                              src={vp.product.image_url}
                              alt={vp.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm line-clamp-2 mb-1">
                            {vp.product?.name}
                          </h3>
                          {vp.product?.generic_name && (
                            <p className="text-xs text-muted-foreground truncate">
                              {vp.product.generic_name}
                            </p>
                          )}
                          <div className="flex gap-1 mt-1">
                            {vp.product?.requires_prescription && (
                              <Badge variant="destructive" className="text-xs">Rx</Badge>
                            )}
                            {vp.is_featured && (
                              <Badge variant="secondary" className="text-xs">Featured</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="border-t pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-lg font-bold text-primary">
                              {formatPrice(vp.unit_price, vp.currency)}
                            </p>
                            {vp.discount_percent > 0 && (
                              <Badge variant="outline" className="text-xs text-green-600">
                                {vp.discount_percent}% off
                              </Badge>
                            )}
                          </div>
                          <Badge
                            variant={vp.stock_quantity > 10 ? "secondary" : "outline"}
                            className="text-xs"
                          >
                            {vp.stock_quantity > 10 ? "In Stock" : `${vp.stock_quantity} left`}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                          <Store className="h-3 w-3" />
                          <span className="truncate">{vp.vendor?.name}</span>
                          <div className="flex items-center gap-1 ml-auto">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>{vp.vendor?.rating?.toFixed(1) || "N/A"}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {vp.vendor?.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {vp.vendor.city}
                            </span>
                          )}
                          {vp.vendor?.delivery_available && (
                            <span className="flex items-center gap-1 text-green-600">
                              <Truck className="h-3 w-3" />
                              Delivery
                            </span>
                          )}
                          {vp.lead_time_days > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {vp.lead_time_days}d lead
                            </span>
                          )}
                        </div>
                      </div>

                      <Button className="w-full mt-4" size="sm">
                        Add to Cart
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="vendors">
            {loadingVendors ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-16 bg-muted rounded mb-3" />
                      <div className="h-4 bg-muted rounded w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : vendors.length === 0 ? (
              <Card className="p-12 text-center">
                <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No verified vendors</h3>
                <p className="text-muted-foreground">Vendors are being onboarded</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {vendors.map((vendor) => (
                  <Card
                    key={vendor.id}
                    className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all group"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-14 h-14 bg-muted rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                          {vendor.logo_url ? (
                            <img
                              src={vendor.logo_url}
                              alt={vendor.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Store className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{vendor.name}</h3>
                          <Badge variant="secondary" className="text-xs capitalize">
                            {vendor.vendor_type}
                          </Badge>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{vendor.rating.toFixed(1)}</span>
                          <span className="text-muted-foreground">
                            ({vendor.total_reviews} reviews)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                        {vendor.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {vendor.city}, {vendor.province}
                          </span>
                        )}
                        {vendor.delivery_available && (
                          <span className="flex items-center gap-1 text-green-600">
                            <Truck className="h-3 w-3" />
                            Delivers
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
