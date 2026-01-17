import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ShoppingCart,
  Plus,
  Check,
  Clock,
  Truck,
  PackageCheck,
  X,
  FileText,
  Loader2,
} from "lucide-react";
import { usePurchaseOrders, useStockItems } from "@/hooks/useStockManagement";
import { format } from "date-fns";

interface PurchaseOrderManagerProps {
  preSelectedItemId?: string;
}

export function PurchaseOrderManager({ preSelectedItemId }: PurchaseOrderManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [formData, setFormData] = useState({
    supplier_id: "",
    expected_delivery_date: "",
    notes: "",
    items: [] as { stock_item_id: string; quantity_ordered: number; unit_cost: number }[],
  });
  const [newItem, setNewItem] = useState({ stock_item_id: "", quantity: "1", unit_cost: "0" });

  const { orders, isLoading, createOrder, updateOrderStatus, addOrderItem } = usePurchaseOrders();
  const { items: stockItems } = useStockItems();

  const filteredOrders = orders.filter(o => {
    if (activeTab === "pending") return ['draft', 'pending_approval'].includes(o.status);
    if (activeTab === "approved") return ['approved', 'ordered'].includes(o.status);
    if (activeTab === "received") return ['partial_received', 'received'].includes(o.status);
    if (activeTab === "cancelled") return o.status === 'cancelled';
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText className="h-4 w-4" />;
      case 'pending_approval': return <Clock className="h-4 w-4" />;
      case 'approved': return <Check className="h-4 w-4" />;
      case 'ordered': return <Truck className="h-4 w-4" />;
      case 'received': return <PackageCheck className="h-4 w-4" />;
      case 'cancelled': return <X className="h-4 w-4" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-muted';
      case 'pending_approval': return 'bg-amber-500';
      case 'approved': return 'bg-blue-500';
      case 'ordered': return 'bg-purple-500';
      case 'partial_received': return 'bg-orange-500';
      case 'received': return 'bg-green-500';
      case 'cancelled': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  const handleAddItemToForm = () => {
    if (!newItem.stock_item_id) return;
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        stock_item_id: newItem.stock_item_id,
        quantity_ordered: parseInt(newItem.quantity),
        unit_cost: parseFloat(newItem.unit_cost),
      }],
    }));
    setNewItem({ stock_item_id: "", quantity: "1", unit_cost: "0" });
  };

  const handleCreateOrder = async () => {
    try {
      const order = await createOrder.mutateAsync({
        supplier_id: formData.supplier_id || null,
        expected_delivery_date: formData.expected_delivery_date || null,
        notes: formData.notes || null,
        status: 'draft',
        total_amount: formData.items.reduce((sum, i) => sum + (i.quantity_ordered * i.unit_cost), 0),
      });

      // Add items to order
      for (const item of formData.items) {
        await addOrderItem.mutateAsync({
          purchase_order_id: order.id,
          ...item,
          quantity_received: 0,
          notes: null,
        });
      }

      setIsCreateOpen(false);
      setFormData({ supplier_id: "", expected_delivery_date: "", notes: "", items: [] });
    } catch (error) {
      console.error("Failed to create PO:", error);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Purchase Orders
            </CardTitle>
            <CardDescription>Manage reorder requests</CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                New PO
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Purchase Order</DialogTitle>
                <DialogDescription>Add items to reorder</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Expected Delivery</Label>
                    <Input
                      type="date"
                      value={formData.expected_delivery_date}
                      onChange={(e) => setFormData(p => ({ ...p, expected_delivery_date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                      placeholder="Order notes..."
                    />
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Add Items</h4>
                  <div className="grid grid-cols-4 gap-2">
                    <Select value={newItem.stock_item_id} onValueChange={(v) => {
                      const item = stockItems.find(i => i.id === v);
                      setNewItem(p => ({ ...p, stock_item_id: v, unit_cost: item?.unit_cost?.toString() || "0" }));
                    }}>
                      <SelectTrigger className="col-span-2">
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        {stockItems.map(item => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} ({item.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem(p => ({ ...p, quantity: e.target.value }))}
                    />
                    <Button onClick={handleAddItemToForm}>Add</Button>
                  </div>

                  {formData.items.length > 0 && (
                    <Table className="mt-4">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Unit Cost</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.items.map((item, idx) => {
                          const stockItem = stockItems.find(i => i.id === item.stock_item_id);
                          return (
                            <TableRow key={idx}>
                              <TableCell>{stockItem?.name}</TableCell>
                              <TableCell className="text-right">{item.quantity_ordered}</TableCell>
                              <TableCell className="text-right">${item.unit_cost.toFixed(2)}</TableCell>
                              <TableCell className="text-right">
                                ${(item.quantity_ordered * item.unit_cost).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    Total: ${formData.items.reduce((sum, i) => sum + (i.quantity_ordered * i.unit_cost), 0).toFixed(2)}
                  </span>
                  <Button onClick={handleCreateOrder} disabled={formData.items.length === 0 || createOrder.isPending}>
                    {createOrder.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Order
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="px-4">
            <TabsList className="w-full">
              <TabsTrigger value="pending" className="flex-1">Pending</TabsTrigger>
              <TabsTrigger value="approved" className="flex-1">Approved</TabsTrigger>
              <TabsTrigger value="received" className="flex-1">Received</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="mt-0">
            <ScrollArea className="h-[350px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No orders in this status
                </div>
              ) : (
                <div className="divide-y">
                  {filteredOrders.map((order) => (
                    <div key={order.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium">{order.order_number}</span>
                            <Badge className={`${getStatusColor(order.status)} text-white gap-1`}>
                              {getStatusIcon(order.status)}
                              {order.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {format(new Date(order.order_date), 'MMM dd, yyyy')}
                            {order.expected_delivery_date && (
                              <> • Expected: {format(new Date(order.expected_delivery_date), 'MMM dd')}</>
                            )}
                          </p>
                          <p className="font-medium mt-2">
                            ${order.total_amount.toFixed(2)} {order.currency}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {order.status === 'draft' && (
                            <Button
                              size="sm"
                              onClick={() => updateOrderStatus.mutate({ id: order.id, status: 'pending_approval' })}
                            >
                              Submit
                            </Button>
                          )}
                          {order.status === 'pending_approval' && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => updateOrderStatus.mutate({ 
                                id: order.id, 
                                status: 'approved',
                                approvedBy: 'Current User',
                              })}
                            >
                              Approve
                            </Button>
                          )}
                          {order.status === 'approved' && (
                            <Button
                              size="sm"
                              onClick={() => updateOrderStatus.mutate({ id: order.id, status: 'ordered' })}
                            >
                              Mark Ordered
                            </Button>
                          )}
                          {order.status === 'ordered' && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => updateOrderStatus.mutate({ id: order.id, status: 'received' })}
                            >
                              Receive
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
