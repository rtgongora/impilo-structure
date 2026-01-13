import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
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
  ChevronRight,
  Upload,
  Camera,
  FileText,
  Scan,
  DollarSign,
  Navigation,
  Award,
  X,
  Eye,
  ShoppingBag,
  Zap
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Product {
  id: string;
  name: string;
  description: string;
  category: "medication" | "device" | "consumable" | "service" | "wellness";
  isRegulated: boolean;
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
    distance?: number;
  };
  deliveryOptions: ("pickup" | "delivery")[];
  estimatedDelivery?: string;
}

interface VendorBid {
  id: string;
  vendorName: string;
  vendorType: "pharmacy" | "facility";
  verified: boolean;
  rating: number;
  distance: number;
  location: string;
  canFillComplete: boolean;
  itemsAvailable: number;
  totalItems: number;
  totalPrice: number;
  deliveryFee: number;
  estimatedReady: string;
  deliveryOptions: ("pickup" | "delivery")[];
  expiresAt: Date;
}

interface PrescriptionItem {
  name: string;
  dosage: string;
  quantity: number;
  instructions: string;
}

interface UploadedPrescription {
  id: string;
  fileName: string;
  uploadedAt: Date;
  status: "scanning" | "authenticating" | "authenticated" | "rejected" | "auctioning" | "bids_received";
  prescribedBy?: string;
  prescribedDate?: Date;
  items: PrescriptionItem[];
  bids: VendorBid[];
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
  const [showRegulatedOnly, setShowRegulatedOnly] = useState(false);
  const [uploadedPrescription, setUploadedPrescription] = useState<UploadedPrescription | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [maxDistance, setMaxDistance] = useState([25]);
  const [sortBy, setSortBy] = useState("price");
  const [filterCompleteOnly, setFilterCompleteOnly] = useState(false);

  // Mock products - mix of regulated and unregulated
  const products: Product[] = [
    {
      id: "1",
      name: "Paracetamol 500mg",
      description: "Pain relief and fever reducer. Pack of 20 tablets.",
      category: "medication",
      isRegulated: true,
      price: 2.50,
      currency: "USD",
      unit: "pack",
      inStock: true,
      stockLevel: 150,
      isPrescriptionRequired: false,
      seller: { name: "City Pharmacy", type: "pharmacy", verified: true, rating: 4.8, location: "Harare CBD", distance: 2.3 },
      deliveryOptions: ["pickup", "delivery"],
      estimatedDelivery: "Same day"
    },
    {
      id: "2",
      name: "Digital Blood Pressure Monitor",
      description: "Automatic BP monitor with memory function.",
      category: "device",
      isRegulated: true,
      price: 45.00,
      currency: "USD",
      unit: "unit",
      inStock: true,
      stockLevel: 25,
      isPrescriptionRequired: false,
      seller: { name: "MedEquip Supplies", type: "vendor", verified: true, rating: 4.5, location: "Borrowdale", distance: 8.1 },
      deliveryOptions: ["pickup", "delivery"],
      estimatedDelivery: "2-3 days"
    },
    {
      id: "3",
      name: "Vitamin D3 1000IU",
      description: "Daily vitamin supplement. 60 capsules.",
      category: "wellness",
      isRegulated: false,
      price: 12.00,
      currency: "USD",
      unit: "bottle",
      inStock: true,
      stockLevel: 200,
      isPrescriptionRequired: false,
      seller: { name: "Wellness Hub", type: "vendor", verified: true, rating: 4.6, location: "Avondale", distance: 5.2 },
      deliveryOptions: ["pickup", "delivery"],
      estimatedDelivery: "1-2 days"
    },
    {
      id: "4",
      name: "Yoga Mat - Premium",
      description: "Non-slip exercise mat for yoga and fitness.",
      category: "wellness",
      isRegulated: false,
      price: 25.00,
      currency: "USD",
      unit: "unit",
      inStock: true,
      stockLevel: 50,
      isPrescriptionRequired: false,
      seller: { name: "FitLife Store", type: "vendor", verified: true, rating: 4.4, location: "Eastgate", distance: 4.8 },
      deliveryOptions: ["delivery"],
      estimatedDelivery: "2-3 days"
    },
    {
      id: "5",
      name: "First Aid Kit - Home",
      description: "Comprehensive first aid kit with 50+ items.",
      category: "consumable",
      isRegulated: false,
      price: 25.00,
      currency: "USD",
      unit: "kit",
      inStock: true,
      stockLevel: 30,
      isPrescriptionRequired: false,
      seller: { name: "Safety Plus", type: "vendor", verified: true, rating: 4.4, location: "Mt Pleasant", distance: 6.5 },
      deliveryOptions: ["delivery"],
      estimatedDelivery: "1-2 days"
    },
    {
      id: "6",
      name: "Blood Glucose Test Strips",
      description: "Compatible with AccuCheck monitors. Box of 50.",
      category: "consumable",
      isRegulated: true,
      price: 15.00,
      currency: "USD",
      unit: "box",
      inStock: true,
      stockLevel: 200,
      isPrescriptionRequired: false,
      seller: { name: "Diabetes Care", type: "facility", verified: true, rating: 4.7, location: "Eastlea", distance: 3.2 },
      deliveryOptions: ["pickup"],
      estimatedDelivery: "Ready for pickup"
    }
  ];

  // Mock vendor bids for prescription auction
  const mockBids: VendorBid[] = [
    {
      id: "bid1",
      vendorName: "City Pharmacy",
      vendorType: "pharmacy",
      verified: true,
      rating: 4.8,
      distance: 2.3,
      location: "Harare CBD",
      canFillComplete: true,
      itemsAvailable: 3,
      totalItems: 3,
      totalPrice: 45.50,
      deliveryFee: 3.00,
      estimatedReady: "2 hours",
      deliveryOptions: ["pickup", "delivery"],
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000)
    },
    {
      id: "bid2",
      vendorName: "HealthFirst Pharmacy",
      vendorType: "pharmacy",
      verified: true,
      rating: 4.9,
      distance: 5.8,
      location: "Avondale",
      canFillComplete: true,
      itemsAvailable: 3,
      totalItems: 3,
      totalPrice: 42.00,
      deliveryFee: 5.00,
      estimatedReady: "Same day",
      deliveryOptions: ["pickup", "delivery"],
      expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000)
    },
    {
      id: "bid3",
      vendorName: "MediCare Pharmacy",
      vendorType: "pharmacy",
      verified: true,
      rating: 4.5,
      distance: 1.2,
      location: "Eastgate Mall",
      canFillComplete: false,
      itemsAvailable: 2,
      totalItems: 3,
      totalPrice: 28.00,
      deliveryFee: 2.00,
      estimatedReady: "1 hour",
      deliveryOptions: ["pickup"],
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000)
    },
    {
      id: "bid4",
      vendorName: "Parirenyatwa Pharmacy",
      vendorType: "facility",
      verified: true,
      rating: 4.6,
      distance: 4.5,
      location: "Parirenyatwa Hospital",
      canFillComplete: true,
      itemsAvailable: 3,
      totalItems: 3,
      totalPrice: 38.50,
      deliveryFee: 0,
      estimatedReady: "30 minutes",
      deliveryOptions: ["pickup"],
      expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000)
    }
  ];

  const categories = [
    { id: "medication", name: "Medications", icon: <Pill className="h-4 w-4" />, regulated: true },
    { id: "device", name: "Medical Devices", icon: <Stethoscope className="h-4 w-4" />, regulated: true },
    { id: "consumable", name: "Consumables", icon: <Package className="h-4 w-4" />, regulated: true },
    { id: "wellness", name: "Wellness", icon: <Heart className="h-4 w-4" />, regulated: false },
    { id: "service", name: "Services", icon: <Zap className="h-4 w-4" />, regulated: false }
  ];

  const getCartQuantity = (productId: string) => {
    const item = cart.find(i => i.productId === productId);
    return item?.quantity || 0;
  };

  const addToCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === productId);
      if (existing) {
        return prev.map(i => i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { productId, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i);
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
    const matchesRegulated = !showRegulatedOnly || p.isRegulated;
    return matchesSearch && matchesCategory && matchesRegulated;
  });

  const handlePrescriptionUpload = () => {
    // Simulate prescription upload and processing
    setUploadedPrescription({
      id: "rx-001",
      fileName: "prescription_scan.jpg",
      uploadedAt: new Date(),
      status: "scanning",
      items: [],
      bids: []
    });
    setIsUploadDialogOpen(false);

    // Simulate scanning process
    setTimeout(() => {
      setUploadedPrescription(prev => prev ? { ...prev, status: "authenticating" } : null);
    }, 1500);

    setTimeout(() => {
      setUploadedPrescription(prev => prev ? {
        ...prev,
        status: "authenticated",
        prescribedBy: "Dr. Sarah Moyo",
        prescribedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        items: [
          { name: "Metformin 500mg", dosage: "500mg", quantity: 60, instructions: "Take 1 tablet twice daily" },
          { name: "Amlodipine 5mg", dosage: "5mg", quantity: 30, instructions: "Take 1 tablet once daily" },
          { name: "Aspirin 75mg", dosage: "75mg", quantity: 30, instructions: "Take 1 tablet daily with food" }
        ]
      } : null);
    }, 3000);

    setTimeout(() => {
      setUploadedPrescription(prev => prev ? { ...prev, status: "auctioning" } : null);
    }, 4000);

    setTimeout(() => {
      setUploadedPrescription(prev => prev ? { ...prev, status: "bids_received", bids: mockBids } : null);
      setActiveTab("prescription-bids");
    }, 5500);
  };

  const getSortedBids = () => {
    if (!uploadedPrescription?.bids) return [];
    let bids = [...uploadedPrescription.bids];
    
    if (filterCompleteOnly) {
      bids = bids.filter(b => b.canFillComplete);
    }
    
    bids = bids.filter(b => b.distance <= maxDistance[0]);

    switch (sortBy) {
      case "price":
        return bids.sort((a, b) => (a.totalPrice + a.deliveryFee) - (b.totalPrice + b.deliveryFee));
      case "distance":
        return bids.sort((a, b) => a.distance - b.distance);
      case "rating":
        return bids.sort((a, b) => b.rating - a.rating);
      case "time":
        return bids.sort((a, b) => a.estimatedReady.localeCompare(b.estimatedReady));
      default:
        return bids;
    }
  };

  const getStatusProgress = () => {
    switch (uploadedPrescription?.status) {
      case "scanning": return 25;
      case "authenticating": return 50;
      case "authenticated": return 75;
      case "auctioning": return 90;
      case "bids_received": return 100;
      default: return 0;
    }
  };

  const getStatusLabel = () => {
    switch (uploadedPrescription?.status) {
      case "scanning": return "Scanning prescription...";
      case "authenticating": return "Authenticating with prescriber...";
      case "authenticated": return "Prescription verified!";
      case "auctioning": return "Requesting quotes from vendors...";
      case "bids_received": return "Quotes received!";
      case "rejected": return "Prescription could not be verified";
      default: return "";
    }
  };

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
                  <p className="text-sm text-muted-foreground">Total: ${totalPrice.toFixed(2)}</p>
                </div>
              </div>
              <Button>Checkout <ChevronRight className="h-4 w-4 ml-1" /></Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prescription Upload Processing Status */}
      {uploadedPrescription && uploadedPrescription.status !== "bids_received" && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scan className="h-5 w-5 text-primary animate-pulse" />
                  <span className="font-medium">{getStatusLabel()}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setUploadedPrescription(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Progress value={getStatusProgress()} className="h-2" />
              {uploadedPrescription.status === "authenticated" && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800">
                    <CheckCircle className="h-4 w-4 inline mr-1" />
                    Verified by {uploadedPrescription.prescribedBy}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto">
          <TabsList className="inline-flex w-max min-w-full">
            <TabsTrigger value="browse">Browse Products</TabsTrigger>
            <TabsTrigger value="availability">Check Availability</TabsTrigger>
            <TabsTrigger value="upload-rx">Upload Prescription</TabsTrigger>
            {uploadedPrescription?.status === "bids_received" && (
              <TabsTrigger value="prescription-bids" className="relative">
                Vendor Quotes
                <Badge className="ml-2 bg-green-500">{uploadedPrescription.bids.length}</Badge>
              </TabsTrigger>
            )}
            <TabsTrigger value="my-prescriptions">My ePrescriptions</TabsTrigger>
            <TabsTrigger value="orders">Order History</TabsTrigger>
          </TabsList>
        </div>

        {/* Browse Products Tab */}
        <TabsContent value="browse" className="space-y-4">
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products and services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={showRegulatedOnly}
                      onCheckedChange={setShowRegulatedOnly}
                      id="regulated-filter"
                    />
                    <Label htmlFor="regulated-filter" className="text-sm whitespace-nowrap">
                      Health products only
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
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
                    className="flex items-center gap-1 whitespace-nowrap"
                  >
                    {cat.icon}
                    {cat.name}
                    {cat.regulated && <Shield className="h-3 w-3 ml-1 text-primary" />}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {filteredProducts.map((product) => (
              <Card key={product.id} className={!product.inStock ? "opacity-60" : ""}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold">{product.name}</h3>
                        {product.isRegulated && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            <Shield className="h-3 w-3 mr-1" />
                            Regulated
                          </Badge>
                        )}
                        {product.isPrescriptionRequired && (
                          <Badge variant="outline" className="text-xs">Rx Required</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{product.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {product.seller.verified && <CheckCircle className="h-3 w-3" />}
                      {product.seller.name}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {product.seller.rating}
                    </div>
                    {product.seller.distance && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {product.seller.distance}km
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold">
                        ${product.price.toFixed(2)}
                        <span className="text-sm font-normal text-muted-foreground">/{product.unit}</span>
                      </p>
                      {product.inStock ? (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          In Stock
                        </p>
                      ) : (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Out of Stock
                        </p>
                      )}
                    </div>

                    {product.inStock && !product.isPrescriptionRequired && (
                      <div className="flex items-center gap-2">
                        {getCartQuantity(product.id) > 0 ? (
                          <div className="flex items-center gap-2">
                            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => removeFromCart(product.id)}>
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-6 text-center font-medium">{getCartQuantity(product.id)}</span>
                            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => addToCart(product.id)}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" onClick={() => addToCart(product.id)}>Add to Cart</Button>
                        )}
                      </div>
                    )}
                    {product.isPrescriptionRequired && (
                      <Button size="sm" variant="outline" onClick={() => setActiveTab("upload-rx")}>
                        <FileText className="h-4 w-4 mr-1" />
                        Need Rx
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Check Availability Tab */}
        <TabsContent value="availability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5" />
                Check Product Availability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Search for a specific medication or product to see which vendors have it in stock near you.
              </p>
              
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Enter product name (e.g., Metformin 500mg)" className="pl-9" />
                </div>
                <Button>
                  <Navigation className="h-4 w-4 mr-2" />
                  Search Nearby
                </Button>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Within {maxDistance[0]}km
                </Label>
                <Slider
                  value={maxDistance}
                  onValueChange={setMaxDistance}
                  max={50}
                  min={1}
                  step={1}
                  className="w-32"
                />
              </div>
            </CardContent>
          </Card>

          {/* Sample availability results */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Availability Results for "Metformin 500mg"</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockBids.slice(0, 3).map(vendor => (
                  <div key={vendor.id} className="p-3 rounded-lg border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${vendor.canFillComplete ? "bg-green-100" : "bg-yellow-100"}`}>
                        <Package className={`h-4 w-4 ${vendor.canFillComplete ? "text-green-600" : "text-yellow-600"}`} />
                      </div>
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          {vendor.vendorName}
                          {vendor.verified && <CheckCircle className="h-3 w-3 text-green-500" />}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {vendor.location} • {vendor.distance}km away
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={vendor.canFillComplete ? "default" : "secondary"}>
                        {vendor.canFillComplete ? "In Stock" : "Limited Stock"}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">{vendor.estimatedReady}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upload Prescription Tab */}
        <TabsContent value="upload-rx" className="space-y-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Physical Prescription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Don't have an ePrescription? Upload a photo of your physical prescription. 
                We'll scan it, authenticate with the prescriber, and get quotes from verified vendors.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-32 flex flex-col gap-2 border-dashed border-2">
                      <Camera className="h-8 w-8 text-muted-foreground" />
                      <span>Take Photo</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upload Prescription</DialogTitle>
                      <DialogDescription>
                        Take a clear photo of your prescription. Make sure all text is readable.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="border-2 border-dashed rounded-lg p-8 text-center">
                        <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Camera preview would appear here</p>
                      </div>
                      <div className="bg-amber-50 p-3 rounded-lg text-sm text-amber-800">
                        <AlertTriangle className="h-4 w-4 inline mr-2" />
                        Ensure the prescription includes: prescriber name, date, medications, and signature.
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handlePrescriptionUpload}>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload & Process
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-32 flex flex-col gap-2 border-dashed border-2">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <span>Upload File</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upload Prescription File</DialogTitle>
                      <DialogDescription>
                        Upload a scanned copy or photo of your prescription (PDF, JPG, PNG).
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50">
                        <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Click to browse or drag and drop</p>
                        <p className="text-xs text-muted-foreground mt-1">Max 10MB • PDF, JPG, PNG</p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline">Cancel</Button>
                      <Button onClick={handlePrescriptionUpload}>
                        <Scan className="h-4 w-4 mr-2" />
                        Scan & Process
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">How it works</h4>
                <ol className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">1</span>
                    Upload a clear photo of your prescription
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">2</span>
                    We scan and extract medication details using AI
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">3</span>
                    Prescription is verified with the prescriber's records
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">4</span>
                    Verified vendors submit quotes with pricing and availability
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">5</span>
                    Choose the best option based on price, distance, or completeness
                  </li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prescription Bids Tab */}
        <TabsContent value="prescription-bids" className="space-y-4">
          {uploadedPrescription && (
            <>
              {/* Prescription Details */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Verified Prescription
                    </CardTitle>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Authenticated
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4 text-sm">
                    <span className="text-muted-foreground">
                      Prescribed by: <strong>{uploadedPrescription.prescribedBy}</strong>
                    </span>
                    <span className="text-muted-foreground">
                      Date: <strong>{uploadedPrescription.prescribedDate?.toLocaleDateString()}</strong>
                    </span>
                  </div>
                  <div className="space-y-2">
                    {uploadedPrescription.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.instructions}</p>
                        </div>
                        <Badge variant="secondary">Qty: {item.quantity}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Filter Controls */}
              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm whitespace-nowrap">Sort by:</Label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="price">Lowest Price</SelectItem>
                          <SelectItem value="distance">Nearest</SelectItem>
                          <SelectItem value="rating">Highest Rated</SelectItem>
                          <SelectItem value="time">Fastest Ready</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label className="text-sm whitespace-nowrap flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        Max {maxDistance[0]}km
                      </Label>
                      <Slider
                        value={maxDistance}
                        onValueChange={setMaxDistance}
                        max={50}
                        min={1}
                        step={1}
                        className="w-24"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={filterCompleteOnly}
                        onCheckedChange={setFilterCompleteOnly}
                        id="complete-filter"
                      />
                      <Label htmlFor="complete-filter" className="text-sm whitespace-nowrap">
                        Can fill complete Rx only
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Vendor Bids */}
              <div className="space-y-3">
                {getSortedBids().length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No vendors match your filters. Try adjusting the distance or removing filters.</p>
                    </CardContent>
                  </Card>
                ) : (
                  getSortedBids().map((bid, index) => (
                    <Card key={bid.id} className={index === 0 ? "border-green-300 bg-green-50/50" : ""}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${bid.vendorType === "pharmacy" ? "bg-blue-100" : "bg-purple-100"}`}>
                              <Pill className={`h-5 w-5 ${bid.vendorType === "pharmacy" ? "text-blue-600" : "text-purple-600"}`} />
                            </div>
                            <div>
                              <p className="font-semibold flex items-center gap-2">
                                {bid.vendorName}
                                {bid.verified && <CheckCircle className="h-4 w-4 text-green-500" />}
                                {index === 0 && (
                                  <Badge className="bg-green-500">
                                    <Award className="h-3 w-3 mr-1" />
                                    Best Match
                                  </Badge>
                                )}
                              </p>
                              <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <MapPin className="h-3 w-3" />
                                {bid.location} • {bid.distance}km
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 ml-2" />
                                {bid.rating}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">${bid.totalPrice.toFixed(2)}</p>
                            {bid.deliveryFee > 0 && (
                              <p className="text-xs text-muted-foreground">+ ${bid.deliveryFee.toFixed(2)} delivery</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mb-3 text-sm">
                          <Badge variant={bid.canFillComplete ? "default" : "secondary"}>
                            {bid.canFillComplete ? (
                              <><CheckCircle className="h-3 w-3 mr-1" /> Complete Rx</>
                            ) : (
                              <><AlertTriangle className="h-3 w-3 mr-1" /> {bid.itemsAvailable}/{bid.totalItems} items</>
                            )}
                          </Badge>
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Ready in {bid.estimatedReady}
                          </span>
                          {bid.deliveryOptions.includes("delivery") && (
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Truck className="h-3 w-3" />
                              Delivery available
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button className="flex-1">
                            <ShoppingBag className="h-4 w-4 mr-2" />
                            Select This Vendor
                          </Button>
                          <Button variant="outline">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </>
          )}
        </TabsContent>

        {/* My ePrescriptions Tab */}
        <TabsContent value="my-prescriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active ePrescriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                These are electronic prescriptions issued by your healthcare providers. 
                Click to send to marketplace for vendor quotes.
              </p>
              <div className="space-y-4">
                <div className="p-4 rounded-lg border">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">Diabetes Management</h4>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Metformin 500mg (60) • Prescribed by Dr. Sarah Moyo
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Issued: Jan 10, 2024 • 2 refills remaining
                      </p>
                    </div>
                    <Button size="sm">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Get Quotes
                    </Button>
                  </div>
                </div>
                <div className="p-4 rounded-lg border">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">Hypertension Control</h4>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Amlodipine 5mg (30), Aspirin 75mg (30) • Prescribed by Dr. James Chikwanda
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Issued: Jan 8, 2024 • 1 refill remaining
                      </p>
                    </div>
                    <Button size="sm">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Get Quotes
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Order History Tab */}
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
                      <p className="text-xs text-muted-foreground">Jan 10, 2024 • City Pharmacy</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Delivered</Badge>
                  </div>
                  <div className="text-sm">
                    <p>Metformin 500mg x 1, Amlodipine 5mg x 1</p>
                    <p className="font-medium mt-1">Total: $48.50</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">Order #ORD-2024-002</p>
                      <p className="text-xs text-muted-foreground">Jan 8, 2024 • HealthFirst Pharmacy</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">Ready for Pickup</Badge>
                  </div>
                  <div className="text-sm">
                    <p>Blood Glucose Test Strips x 2</p>
                    <p className="font-medium mt-1">Total: $30.00</p>
                  </div>
                  <Button variant="link" className="p-0 h-auto mt-2">Get Directions</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
