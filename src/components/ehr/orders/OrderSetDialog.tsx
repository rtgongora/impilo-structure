import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Package, FileText, Scan, Activity, Stethoscope, Utensils, Users, AlertCircle, Clock, Zap } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { OrderSet, OrderItem } from "./orderSetsData";

interface OrderSetDialogProps {
  orderSet: OrderSet | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const typeIcons: Record<string, React.ElementType> = {
  medication: Package,
  lab: FileText,
  imaging: Scan,
  procedure: Activity,
  nursing: Stethoscope,
  diet: Utensils,
  consult: Users,
};

const typeColors: Record<string, string> = {
  medication: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  lab: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  imaging: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  procedure: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  nursing: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
  diet: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  consult: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
};

const priorityIcons: Record<string, React.ElementType> = {
  stat: Zap,
  urgent: AlertCircle,
  routine: Clock,
};

const priorityColors: Record<string, string> = {
  stat: 'text-red-600 dark:text-red-400',
  urgent: 'text-orange-600 dark:text-orange-400',
  routine: 'text-muted-foreground',
};

export function OrderSetDialog({ orderSet, open, onOpenChange }: OrderSetDialogProps) {
  const [selectedOrders, setSelectedOrders] = useState<Record<string, boolean>>({});

  if (!orderSet) return null;

  const initializeSelection = () => {
    const initial: Record<string, boolean> = {};
    orderSet.orders.forEach(order => {
      initial[order.id] = order.selected;
    });
    return initial;
  };

  const currentSelection = Object.keys(selectedOrders).length > 0 ? selectedOrders : initializeSelection();

  const toggleOrder = (orderId: string) => {
    setSelectedOrders(prev => ({
      ...initializeSelection(),
      ...prev,
      [orderId]: !currentSelection[orderId],
    }));
  };

  const selectAll = () => {
    const all: Record<string, boolean> = {};
    orderSet.orders.forEach(order => {
      all[order.id] = true;
    });
    setSelectedOrders(all);
  };

  const selectNone = () => {
    const none: Record<string, boolean> = {};
    orderSet.orders.forEach(order => {
      none[order.id] = false;
    });
    setSelectedOrders(none);
  };

  const handleApply = () => {
    const selected = orderSet.orders.filter(o => currentSelection[o.id]);
    toast({
      title: "Orders Applied",
      description: `${selected.length} orders from "${orderSet.name}" have been added to the encounter.`,
    });
    setSelectedOrders({});
    onOpenChange(false);
  };

  const selectedCount = Object.values(currentSelection).filter(Boolean).length;

  // Group orders by type
  const groupedOrders = orderSet.orders.reduce((acc, order) => {
    if (!acc[order.type]) acc[order.type] = [];
    acc[order.type].push(order);
    return acc;
  }, {} as Record<string, OrderItem[]>);

  const typeOrder = ['medication', 'lab', 'imaging', 'procedure', 'nursing', 'diet', 'consult'];

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setSelectedOrders({}); }}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{orderSet.name}</DialogTitle>
          <DialogDescription>{orderSet.description}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Condition: <strong>{orderSet.condition}</strong></span>
            <Separator orientation="vertical" className="h-4" />
            <span>By {orderSet.author}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={selectAll}>Select All</Button>
            <Button variant="ghost" size="sm" onClick={selectNone}>Clear</Button>
          </div>
        </div>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4">
            {typeOrder.map(type => {
              const orders = groupedOrders[type];
              if (!orders || orders.length === 0) return null;
              
              const Icon = typeIcons[type];
              
              return (
                <div key={type}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4" />
                    <h4 className="font-medium capitalize">{type}s</h4>
                    <Badge variant="secondary" className="text-xs">{orders.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {orders.map(order => {
                      const PriorityIcon = priorityIcons[order.priority];
                      return (
                        <div
                          key={order.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                            currentSelection[order.id] ? 'bg-primary/5 border-primary/30' : 'bg-muted/30'
                          }`}
                        >
                          <Checkbox
                            checked={currentSelection[order.id]}
                            onCheckedChange={() => toggleOrder(order.id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{order.name}</span>
                              <Badge className={typeColors[order.type]} variant="secondary">
                                {order.type}
                              </Badge>
                              <PriorityIcon className={`h-4 w-4 ${priorityColors[order.priority]}`} />
                            </div>
                            <p className="text-sm text-muted-foreground">{order.details}</p>
                            {(order.frequency || order.duration) && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {order.frequency && <span>Frequency: {order.frequency}</span>}
                                {order.frequency && order.duration && <span> • </span>}
                                {order.duration && <span>Duration: {order.duration}</span>}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter className="pt-4 border-t">
          <div className="flex items-center justify-between w-full">
            <span className="text-sm text-muted-foreground">
              {selectedCount} of {orderSet.orders.length} orders selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleApply} disabled={selectedCount === 0}>
                Apply {selectedCount} Orders
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
