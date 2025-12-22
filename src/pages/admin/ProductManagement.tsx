import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Search,
  Building2,
  Store,
  Package,
  Tag,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
} from "lucide-react";

type ApprovalStatus = "pending" | "approved" | "suspended" | "rejected";

interface Manufacturer {
  id: string;
  name: string;
  registration_number: string | null;
  country: string | null;
  contact_email: string | null;
  is_verified: boolean;
  status: ApprovalStatus;
  created_at: string;
}

interface Vendor {
  id: string;
  name: string;
  vendor_type: string;
  registration_number: string | null;
  license_number: string | null;
  city: string | null;
  province: string | null;
  is_verified: boolean;
  status: ApprovalStatus;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category_type: string;
  is_active: boolean;
  requires_prescription: boolean;
  is_controlled: boolean;
}

interface Product {
  id: string;
  name: string;
  generic_name: string | null;
  sku: string | null;
  requires_prescription: boolean;
  is_controlled: boolean;
  is_active: boolean;
  status: ApprovalStatus;
  created_at: string;
  category?: { name: string } | null;
  manufacturer?: { name: string } | null;
}

const statusColors: Record<ApprovalStatus, string> = {
  pending: "bg-yellow-500",
  approved: "bg-green-500",
  suspended: "bg-orange-500",
  rejected: "bg-red-500",
};

export default function ProductManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("products");
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  // Fetch manufacturers
  const { data: manufacturers = [], isLoading: loadingManufacturers } = useQuery({
    queryKey: ["admin-manufacturers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("manufacturers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Manufacturer[];
    },
  });

  // Fetch vendors
  const { data: vendors = [], isLoading: loadingVendors } = useQuery({
    queryKey: ["admin-vendors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Vendor[];
    },
  });

  // Fetch categories
  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_categories")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as Category[];
    },
  });

  // Fetch products
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:product_categories(name),
          manufacturer:manufacturers(name)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ table, id, status }: { table: "manufacturers" | "vendors" | "products"; id: string; status: ApprovalStatus }) => {
      const { error } = await supabase
        .from(table)
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-manufacturers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-vendors"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: "Status updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error updating status", description: error.message, variant: "destructive" });
    },
  });

  const getStatusBadge = (status: ApprovalStatus) => (
    <Badge className={`${statusColors[status]} text-white capitalize`}>
      {status}
    </Badge>
  );

  const handleStatusChange = (table: "manufacturers" | "vendors" | "products", id: string, newStatus: ApprovalStatus) => {
    updateStatusMutation.mutate({ table, id, status: newStatus });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold">Product Registry Management</h1>
                <p className="text-xs text-muted-foreground">
                  Manage manufacturers, vendors, categories & products
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Building2 className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{manufacturers.length}</p>
                  <p className="text-xs text-muted-foreground">Manufacturers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Store className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{vendors.length}</p>
                  <p className="text-xs text-muted-foreground">Vendors</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Tag className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{categories.length}</p>
                  <p className="text-xs text-muted-foreground">Categories</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Package className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{products.length}</p>
                  <p className="text-xs text-muted-foreground">Products</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="manufacturers">Manufacturers</TabsTrigger>
              <TabsTrigger value="vendors">Vendors</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-[200px]"
                />
              </div>
              <Button onClick={() => navigate(`/admin/product-registry/${activeTab}/new`)}>
                <Plus className="h-4 w-4 mr-2" />
                Add New
              </Button>
            </div>
          </div>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Generic Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Manufacturer</TableHead>
                      <TableHead>Flags</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products
                      .filter((p) =>
                        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.generic_name?.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.generic_name || "-"}</TableCell>
                          <TableCell>{product.category?.name || "-"}</TableCell>
                          <TableCell>{product.manufacturer?.name || "-"}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {product.requires_prescription && (
                                <Badge variant="destructive" className="text-xs">Rx</Badge>
                              )}
                              {product.is_controlled && (
                                <Badge variant="outline" className="text-xs">Controlled</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(product.status as ApprovalStatus)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {product.status === "pending" && (
                                <>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-green-600"
                                    onClick={() => handleStatusChange("products", product.id, "approved")}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-red-600"
                                    onClick={() => handleStatusChange("products", product.id, "rejected")}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {product.status === "approved" && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-orange-600"
                                  onClick={() => handleStatusChange("products", product.id, "suspended")}
                                >
                                  <Clock className="h-4 w-4" />
                                </Button>
                              )}
                              {product.status === "suspended" && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-green-600"
                                  onClick={() => handleStatusChange("products", product.id, "approved")}
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </Card>
          </TabsContent>

          {/* Manufacturers Tab */}
          <TabsContent value="manufacturers">
            <Card>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Registration #</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Verified</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {manufacturers
                      .filter((m) => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((manufacturer) => (
                        <TableRow key={manufacturer.id}>
                          <TableCell className="font-medium">{manufacturer.name}</TableCell>
                          <TableCell>{manufacturer.registration_number || "-"}</TableCell>
                          <TableCell>{manufacturer.country || "-"}</TableCell>
                          <TableCell>{manufacturer.contact_email || "-"}</TableCell>
                          <TableCell>
                            {manufacturer.is_verified ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(manufacturer.status as ApprovalStatus)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {manufacturer.status === "pending" && (
                                <>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-green-600"
                                    onClick={() => handleStatusChange("manufacturers", manufacturer.id, "approved")}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-red-600"
                                    onClick={() => handleStatusChange("manufacturers", manufacturer.id, "rejected")}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </Card>
          </TabsContent>

          {/* Vendors Tab */}
          <TabsContent value="vendors">
            <Card>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>License #</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Verified</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendors
                      .filter((v) => v.name.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((vendor) => (
                        <TableRow key={vendor.id}>
                          <TableCell className="font-medium">{vendor.name}</TableCell>
                          <TableCell className="capitalize">{vendor.vendor_type}</TableCell>
                          <TableCell>{vendor.license_number || "-"}</TableCell>
                          <TableCell>
                            {vendor.city && vendor.province
                              ? `${vendor.city}, ${vendor.province}`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {vendor.is_verified ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(vendor.status as ApprovalStatus)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {vendor.status === "pending" && (
                                <>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-green-600"
                                    onClick={() => handleStatusChange("vendors", vendor.id, "approved")}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-red-600"
                                    onClick={() => handleStatusChange("vendors", vendor.id, "rejected")}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <Card>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Prescription</TableHead>
                      <TableHead>Controlled</TableHead>
                      <TableHead>Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories
                      .filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((category) => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                          <TableCell className="capitalize">{category.category_type.replace("_", " ")}</TableCell>
                          <TableCell>
                            {category.requires_prescription ? (
                              <Badge variant="destructive" className="text-xs">Yes</Badge>
                            ) : (
                              <span className="text-muted-foreground">No</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {category.is_controlled ? (
                              <Badge variant="outline" className="text-xs">Yes</Badge>
                            ) : (
                              <span className="text-muted-foreground">No</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {category.is_active ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
