import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ShoppingCart, 
  Search, 
  Filter,
  Star,
  MapPin,
  Clock,
  Truck,
  Shield,
  Package,
  Pill,
  Stethoscope,
  Heart,
  CheckCircle,
  AlertTriangle,
  Plus,
  Minus,
  ChevronRight
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  category: "medication" | "device" | "consumable" | "service";
  price: number;
  currency: string;
  unit: string;
  inStock: boolean;
  stockLevel?: number;
  isPrescriptionRequired: boolean;
  seller: {
    name: string;
    type: "pharmacy" | "facility" | "vendor";
    verified: boolean;
    rating: number;
    location: string;
  };
  deliveryOptions: ("pickup" | "delivery")[];
  estimatedDelivery?: string;
  image?: string;
}

interface CartItem {
  productId: string;
  quantity: number;
}

export const PortalMarketplace = () => {
  const [activeTab, setActiveTab] = useState("browse");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const products: Product[] = [
    {
      id: "1",
      name: "Paracetamol 500mg",
      description: "Pain relief and fever reducer. Pack of 20 tablets.",
      category: "medication",
      price: 2.50,
      currency: "USD",
      unit: "pack",
      inStock: true,
      stockLevel: 150,
      isPrescriptionRequired: false,
      seller: {
        name: "City Pharmacy",
        type: "pharmacy",
        verified: true,
        rating: 4.8,
        location: "Harare CBD"
      },
      deliveryOptions: ["pickup", "delivery"],
      estimatedDelivery: "Same day"
    },
    {
      id: "2",
      name: "Digital Blood Pressure Monitor",
      description: "Automatic BP monitor with memory function and irregular heartbeat detection.",
      category: "device",
      price: 45.00,
      currency: "USD",
      unit: "unit",
      inStock: true,
      stockLevel: 25,
      isPrescriptionRequired: false,
      seller: {
        name: "MedEquip Supplies",
        type: "vendor",
        verified: true,
        rating: 4.5,
        location: "Borrowdale"
      },
      deliveryOptions: ["pickup", "delivery"],
      estimatedDelivery: "2-3 days"
    },
    {
      id: "3",
      name: "Metformin 500mg",
      description: "Diabetes medication. Pack of 60 tablets. Prescription required.",
      category: "medication",
      price: 8.00,
      currency: "USD",
      unit: "pack",
      inStock: true,
      stockLevel: 80,
      isPrescriptionRequired: true,
      seller: {
        name: "HealthFirst Pharmacy",
        type: "pharmacy",
        verified: true,
        rating: 4.9,
        location: "Avondale"
      },
      deliveryOptions: ["pickup", "delivery"],
      estimatedDelivery: "Same day"
    },
    {
      id: "4",
      name: "Blood Glucose Test Strips",
      description: "Compatible with AccuCheck monitors. Box of 50 strips.",
      category: "consumable",
      price: 15.00,
      currency: "USD",
      unit: "box",
      inStock: true,
      stockLevel: 200,
      isPrescriptionRequired: false,
      seller: {
        name: "Diabetes Care Center",
        type: "facility",
        verified: true,
        rating: 4.7,
        location: "Eastlea"
      },
      deliveryOptions: ["pickup"],
      estimatedDelivery: "Ready for pickup"
    },
    {
      id: "5",
      name: "Teleconsultation - General",
      description: "30-minute virtual consultation with a general practitioner.",
      category: "service",
      price: 20.00,
      currency: "USD",
      unit: "session",
      inStock: true,
      isPrescriptionRequired: false,
      seller: {
        name: "Impilo Telehealth",
        type: "facility",
        verified: true,
        rating: 4.6,
        location: "Virtual"
      },
      deliveryOptions: ["pickup"]
    },
    {
      id: "6",
      name: "First Aid Kit - Home",
      description: "Comprehensive first aid kit with 50+ items for home use.",
      category: "consumable",
      price: 25.00,
      currency: "USD",
      unit: "kit",
      inStock: false,
      stockLevel: 0,
      isPrescriptionRequired: false,
      seller: {
        name: "Safety Plus",
        type: "vendor",
        verified: true,
        rating: 4.4,
        location: "Mt Pleasant"
      },
      deliveryOptions: ["delivery"],
      estimatedDelivery: "Out of stock"
    }
  ];

  const categories = [
    { id: "medication", name: "Medications", icon: <Pill className="h-4 w-4" /> },
    { id: "device", name: "Medical Devices", icon: <Stethoscope className="h-4 w-4" /> },
    { id: "consumable", name: "Consumables", icon: <Package className="h-4 w-4" /> },
    { id: "service", name: "Services", icon: <Heart className="h-4 w-4" /> }
  ];

  const getCartQuantity = (productId: string) => {
    const item = cart.find(i => i.productId === productId);
    return item?.quantity || 0;
  };

  const addToCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === productId);
      if (existing) {
        return prev.map(i => 
          i.productId === productId 
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { productId, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(i =>
          i.productId === productId
            ? { ...i, quantity: i.quantity - 1 }
            : i
        );
      }
      return prev.filter(i => i.productId !== productId);
    });
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId);
    return sum + (product?.price || 0) * item.quantity;
  }, 0);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Cart Summary */}
      {totalItems > 0 && (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{totalItems} item(s) in cart</p>
                  <p className="text-sm text-muted-foreground">
                    Total: ${totalPrice.toFixed(2)}
                  </p>
                </div>
              </div>
              <Button>
                Checkout
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Regulatory Notice */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Regulated Marketplace</p>
              <p className="text-sm text-amber-700">
                All sellers are verified. Prescription medications require valid prescriptions. 
                Products comply with MoHCC regulations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products and services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory(null)}
        >
          All
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat.id)}
            className="flex items-center gap-1"
          >
            {cat.icon}
            {cat.name}
          </Button>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="prescriptions">My Prescriptions</TabsTrigger>
          <TabsTrigger value="orders">Order History</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {filteredProducts.map((product) => (
              <Card key={product.id} className={!product.inStock ? "opacity-60" : ""}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{product.name}</h3>
                        {product.isPrescriptionRequired && (
                          <Badge variant="outline" className="text-xs">
                            Rx Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {product.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {product.seller.verified && <CheckCircle className="h-3 w-3" />}
                      {product.seller.name}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {product.seller.rating}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {product.seller.location}
                    </span>
                    {product.estimatedDelivery && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {product.estimatedDelivery}
                      </span>
                    )}
                    {product.deliveryOptions.includes("delivery") && (
                      <span className="flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        Delivery
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold">
                        ${product.price.toFixed(2)}
                        <span className="text-sm font-normal text-muted-foreground">
                          /{product.unit}
                        </span>
                      </p>
                      {product.inStock ? (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          In Stock ({product.stockLevel})
                        </p>
                      ) : (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Out of Stock
                        </p>
                      )}
                    </div>

                    {product.inStock && (
                      <div className="flex items-center gap-2">
                        {getCartQuantity(product.id) > 0 ? (
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8"
                              onClick={() => removeFromCart(product.id)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-6 text-center font-medium">
                              {getCartQuantity(product.id)}
                            </span>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8"
                              onClick={() => addToCart(product.id)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => addToCart(product.id)}
                            disabled={product.isPrescriptionRequired}
                          >
                            {product.isPrescriptionRequired ? "View Rx" : "Add to Cart"}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="prescriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active Prescriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg border">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">Metformin 500mg</h4>
                      <p className="text-sm text-muted-foreground">
                        Take 1 tablet twice daily with meals
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Prescribed by Dr. Sarah Moyo • 2 refills remaining
                      </p>
                    </div>
                    <Button size="sm">
                      Order Refill
                    </Button>
                  </div>
                </div>
                <div className="p-4 rounded-lg border">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">Amlodipine 5mg</h4>
                      <p className="text-sm text-muted-foreground">
                        Take 1 tablet once daily
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Prescribed by Dr. James Chikwanda • 1 refill remaining
                      </p>
                    </div>
                    <Button size="sm">
                      Order Refill
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">Order #ORD-2024-001</p>
                      <p className="text-xs text-muted-foreground">Jan 10, 2024</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Delivered</Badge>
                  </div>
                  <div className="text-sm">
                    <p>Paracetamol 500mg x 2, Blood Glucose Strips x 1</p>
                    <p className="font-medium mt-1">Total: $20.00</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">Order #ORD-2024-002</p>
                      <p className="text-xs text-muted-foreground">Jan 8, 2024</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">In Transit</Badge>
                  </div>
                  <div className="text-sm">
                    <p>Digital Blood Pressure Monitor x 1</p>
                    <p className="font-medium mt-1">Total: $45.00</p>
                  </div>
                  <Button variant="link" className="p-0 h-auto mt-2">
                    Track Order
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
