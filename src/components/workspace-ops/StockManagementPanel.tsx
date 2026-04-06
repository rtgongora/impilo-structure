import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Package, ShoppingCart, Truck, ClipboardCheck, AlertTriangle,
  Plus, Search, BarChart3, ArrowRightLeft, Trash2, Eye, RefreshCw,
  Calendar, Box, TrendingDown, CheckCircle2, XCircle, Clock
} from "lucide-react";
import { toast } from "sonner";

type StockTab = 'inventory' | 'orders' | 'receiving' | 'transfers' | 'alerts';

// Mock data
const INVENTORY_ITEMS = [
  { id: '1', name: 'Paracetamol 500mg', code: 'MED-001', category: 'Medication', onHand: 450, reorderLevel: 200, unit: 'tablets', expiry: '2026-12-15', location: 'Pharmacy Store', status: 'ok' },
  { id: '2', name: 'Surgical Gloves (L)', code: 'SUP-012', category: 'Supplies', onHand: 85, reorderLevel: 100, unit: 'boxes', expiry: '2027-03-20', location: 'Main Store', status: 'low' },
  { id: '3', name: 'IV Normal Saline 1L', code: 'MED-044', category: 'Medication', onHand: 0, reorderLevel: 50, unit: 'bags', expiry: null, location: 'Pharmacy Store', status: 'out' },
  { id: '4', name: 'Amoxicillin 250mg', code: 'MED-008', category: 'Medication', onHand: 320, reorderLevel: 150, unit: 'capsules', expiry: '2026-06-10', location: 'Pharmacy Store', status: 'expiring' },
  { id: '5', name: 'Bandage Crepe 10cm', code: 'SUP-003', category: 'Supplies', onHand: 200, reorderLevel: 100, unit: 'rolls', expiry: '2028-01-01', location: 'Ward Store', status: 'ok' },
  { id: '6', name: 'Diazepam 5mg', code: 'MED-CS01', category: 'Controlled', onHand: 24, reorderLevel: 20, unit: 'ampoules', expiry: '2026-09-30', location: 'Pharmacy Safe', status: 'ok' },
  { id: '7', name: 'Oxygen Cylinder (Size F)', code: 'EQP-007', category: 'Equipment', onHand: 3, reorderLevel: 5, unit: 'cylinders', expiry: null, location: 'Gas Store', status: 'low' },
  { id: '8', name: 'Disposable Syringes 5ml', code: 'SUP-021', category: 'Supplies', onHand: 1200, reorderLevel: 500, unit: 'pieces', expiry: '2027-08-15', location: 'Main Store', status: 'ok' },
];

const PURCHASE_ORDERS = [
  { id: 'PO-20260401-0001', supplier: 'MedSupply SA', items: 5, total: 'R12,450', status: 'pending_approval', date: '2026-04-01', priority: 'normal' },
  { id: 'PO-20260403-0002', supplier: 'PharmaWholesale', items: 12, total: 'R34,800', status: 'approved', date: '2026-04-03', priority: 'urgent' },
  { id: 'PO-20260404-0003', supplier: 'SurgicalDirect', items: 3, total: 'R8,200', status: 'shipped', date: '2026-04-04', priority: 'normal' },
  { id: 'PO-20260405-0004', supplier: 'MedSupply SA', items: 8, total: 'R22,100', status: 'delivered', date: '2026-04-05', priority: 'normal' },
  { id: 'PO-20260406-0005', supplier: 'LabEquip Co', items: 2, total: 'R67,500', status: 'draft', date: '2026-04-06', priority: 'normal' },
];

const PENDING_RECEIPTS = [
  { id: 'GRN-001', poNumber: 'PO-20260404-0003', supplier: 'SurgicalDirect', items: 3, expectedDate: '2026-04-07', status: 'in_transit' },
  { id: 'GRN-002', poNumber: 'PO-20260403-0002', supplier: 'PharmaWholesale', items: 12, expectedDate: '2026-04-06', status: 'arrived' },
];

const TRANSFERS = [
  { id: 'TRF-001', from: 'Main Store', to: 'Ward Store A', items: 4, status: 'pending', requestedBy: 'Sr. Moyo', date: '2026-04-06' },
  { id: 'TRF-002', from: 'Pharmacy Store', to: 'Emergency', items: 2, status: 'completed', requestedBy: 'Dr. Nkomo', date: '2026-04-05' },
];

function getStatusBadge(status: string) {
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    ok: { label: 'In Stock', variant: 'default' },
    low: { label: 'Low Stock', variant: 'secondary' },
    out: { label: 'Out of Stock', variant: 'destructive' },
    expiring: { label: 'Expiring Soon', variant: 'outline' },
    draft: { label: 'Draft', variant: 'outline' },
    pending_approval: { label: 'Pending Approval', variant: 'secondary' },
    approved: { label: 'Approved', variant: 'default' },
    shipped: { label: 'Shipped', variant: 'secondary' },
    delivered: { label: 'Delivered', variant: 'default' },
    in_transit: { label: 'In Transit', variant: 'secondary' },
    arrived: { label: 'Arrived', variant: 'default' },
    pending: { label: 'Pending', variant: 'secondary' },
    completed: { label: 'Completed', variant: 'default' },
  };
  const cfg = map[status] || { label: status, variant: 'outline' as const };
  return <Badge variant={cfg.variant} className="text-xs">{cfg.label}</Badge>;
}

export function StockManagementPanel() {
  const [activeTab, setActiveTab] = useState<StockTab>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [newOrderOpen, setNewOrderOpen] = useState(false);

  const filteredItems = INVENTORY_ITEMS.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const lowStockCount = INVENTORY_ITEMS.filter(i => i.status === 'low' || i.status === 'out').length;
  const expiringCount = INVENTORY_ITEMS.filter(i => i.status === 'expiring').length;

  return (
    <div className="space-y-3">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-3 pb-2 px-3">
          <div className="flex items-center gap-2"><Package className="h-4 w-4 text-blue-500" /><span className="text-xs text-muted-foreground">Total Items</span></div>
          <p className="text-lg font-bold">{INVENTORY_ITEMS.length}</p>
        </CardContent></Card>
        <Card className={lowStockCount > 0 ? 'border-amber-300 dark:border-amber-700' : ''}><CardContent className="pt-3 pb-2 px-3">
          <div className="flex items-center gap-2"><TrendingDown className="h-4 w-4 text-amber-500" /><span className="text-xs text-muted-foreground">Low/Out</span></div>
          <p className="text-lg font-bold text-amber-600">{lowStockCount}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 pb-2 px-3">
          <div className="flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-green-500" /><span className="text-xs text-muted-foreground">Open Orders</span></div>
          <p className="text-lg font-bold">{PURCHASE_ORDERS.filter(po => !['delivered', 'cancelled'].includes(po.status)).length}</p>
        </CardContent></Card>
        <Card className={expiringCount > 0 ? 'border-red-300 dark:border-red-700' : ''}><CardContent className="pt-3 pb-2 px-3">
          <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-red-500" /><span className="text-xs text-muted-foreground">Expiring Soon</span></div>
          <p className="text-lg font-bold text-red-600">{expiringCount}</p>
        </CardContent></Card>
      </div>

      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as StockTab)}>
        <TabsList>
          <TabsTrigger value="inventory" className="gap-1.5 text-xs"><Package className="h-3.5 w-3.5" />Inventory</TabsTrigger>
          <TabsTrigger value="orders" className="gap-1.5 text-xs"><ShoppingCart className="h-3.5 w-3.5" />Purchase Orders</TabsTrigger>
          <TabsTrigger value="receiving" className="gap-1.5 text-xs"><Truck className="h-3.5 w-3.5" />Receiving</TabsTrigger>
          <TabsTrigger value="transfers" className="gap-1.5 text-xs"><ArrowRightLeft className="h-3.5 w-3.5" />Transfers</TabsTrigger>
          <TabsTrigger value="alerts" className="gap-1.5 text-xs"><AlertTriangle className="h-3.5 w-3.5" />Alerts {lowStockCount > 0 && <Badge variant="destructive" className="text-[10px] h-4 px-1 ml-1">{lowStockCount}</Badge>}</TabsTrigger>
        </TabsList>

        {/* Inventory */}
        <TabsContent value="inventory" className="mt-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search items..." className="pl-9 h-9" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Medication">Medication</SelectItem>
                <SelectItem value="Supplies">Supplies</SelectItem>
                <SelectItem value="Controlled">Controlled</SelectItem>
                <SelectItem value="Equipment">Equipment</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" className="gap-1" onClick={() => setNewOrderOpen(true)}><Plus className="h-3.5 w-3.5" />New Order</Button>
          </div>
          <ScrollArea className="h-[400px]">
            <div className="space-y-1">
              {filteredItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold ${item.status === 'out' ? 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400' : item.status === 'low' ? 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'}`}>
                      {item.code.split('-')[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.code} • {item.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-semibold">{item.onHand} <span className="text-xs font-normal text-muted-foreground">{item.unit}</span></p>
                      {item.onHand <= item.reorderLevel && <p className="text-[10px] text-amber-600">Reorder at {item.reorderLevel}</p>}
                    </div>
                    {getStatusBadge(item.status)}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Purchase Orders */}
        <TabsContent value="orders" className="mt-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">{PURCHASE_ORDERS.length} orders</p>
            <Button size="sm" className="gap-1" onClick={() => { setNewOrderOpen(true); }}><Plus className="h-3.5 w-3.5" />Create Order</Button>
          </div>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {PURCHASE_ORDERS.map(po => (
                <Card key={po.id} className="cursor-pointer hover:bg-muted/30">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{po.id}</p>
                          {po.priority === 'urgent' && <Badge variant="destructive" className="text-[10px]">Urgent</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{po.supplier} • {po.items} items • {po.total}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{po.date}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(po.status)}
                        {po.status === 'pending_approval' && (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); toast.success(`${po.id} approved`); }}>
                            Approve
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Receiving */}
        <TabsContent value="receiving" className="mt-3">
          <div className="mb-3">
            <p className="text-sm text-muted-foreground">{PENDING_RECEIPTS.length} pending deliveries</p>
          </div>
          <div className="space-y-2">
            {PENDING_RECEIPTS.map(grn => (
              <Card key={grn.id}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{grn.id}</p>
                      <p className="text-xs text-muted-foreground">PO: {grn.poNumber} • {grn.supplier} • {grn.items} items</p>
                      <p className="text-xs text-muted-foreground">Expected: {grn.expectedDate}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(grn.status)}
                      {grn.status === 'arrived' && (
                        <Button size="sm" className="h-7 text-xs gap-1" onClick={() => toast.success(`${grn.id} received and verified`)}>
                          <ClipboardCheck className="h-3 w-3" />Receive
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {PENDING_RECEIPTS.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">No pending deliveries</div>
            )}
          </div>
        </TabsContent>

        {/* Transfers */}
        <TabsContent value="transfers" className="mt-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">{TRANSFERS.length} transfers</p>
            <Button size="sm" className="gap-1"><ArrowRightLeft className="h-3.5 w-3.5" />Request Transfer</Button>
          </div>
          <div className="space-y-2">
            {TRANSFERS.map(t => (
              <Card key={t.id}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{t.id}</p>
                      <p className="text-xs text-muted-foreground">{t.from} → {t.to} • {t.items} items</p>
                      <p className="text-xs text-muted-foreground">By {t.requestedBy} • {t.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(t.status)}
                      {t.status === 'pending' && (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toast.success(`${t.id} approved`)}>
                          Approve
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Alerts */}
        <TabsContent value="alerts" className="mt-3">
          <div className="space-y-2">
            {INVENTORY_ITEMS.filter(i => i.status !== 'ok').map(item => (
              <Card key={item.id} className={`border-l-4 ${item.status === 'out' ? 'border-l-red-500' : item.status === 'low' ? 'border-l-amber-500' : 'border-l-orange-400'}`}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        {item.status === 'out' ? <XCircle className="h-4 w-4 text-red-500" /> : item.status === 'expiring' ? <Clock className="h-4 w-4 text-orange-500" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}
                        <p className="text-sm font-medium">{item.name}</p>
                      </div>
                      <p className="text-xs text-muted-foreground ml-6">
                        {item.status === 'out' ? 'Out of stock – immediate reorder required' : item.status === 'low' ? `${item.onHand} ${item.unit} remaining (reorder level: ${item.reorderLevel})` : `Expires ${item.expiry}`}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => toast.info(`Order initiated for ${item.name}`)}>
                      <ShoppingCart className="h-3 w-3" />Reorder
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* New Order Dialog */}
      <Dialog open={newOrderOpen} onOpenChange={setNewOrderOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Create Purchase Order</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Supplier</Label><Select><SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger><SelectContent><SelectItem value="medsupply">MedSupply SA</SelectItem><SelectItem value="pharma">PharmaWholesale</SelectItem><SelectItem value="surgical">SurgicalDirect</SelectItem></SelectContent></Select></div>
            <div><Label className="text-xs">Priority</Label><Select><SelectTrigger><SelectValue placeholder="Normal" /></SelectTrigger><SelectContent><SelectItem value="normal">Normal</SelectItem><SelectItem value="urgent">Urgent</SelectItem><SelectItem value="emergency">Emergency</SelectItem></SelectContent></Select></div>
            <div><Label className="text-xs">Notes</Label><Textarea placeholder="Order notes..." className="h-20" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOrderOpen(false)}>Cancel</Button>
            <Button onClick={() => { setNewOrderOpen(false); toast.success('Purchase order created'); }}>Create Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
