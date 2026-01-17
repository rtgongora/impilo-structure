import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
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
  ClipboardList,
  Plus,
  Play,
  Pause,
  Check,
  Calculator,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useStockCounts, useStockLevels } from "@/hooks/useStockManagement";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function StockCountWorkflow() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeCount, setActiveCount] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    count_type: "cycle" as 'cycle' | 'full' | 'spot' | 'annual',
    location_id: "",
  });

  const { counts, isLoading, createCount, updateCountStatus, recordCountItem } = useStockCounts();
  const { levels } = useStockLevels(formData.location_id || undefined);

  const activeCounts = counts.filter(c => c.status === 'in_progress');
  const pendingReview = counts.filter(c => c.status === 'pending_review');

  const handleStartCount = async () => {
    try {
      const count = await createCount.mutateAsync({
        count_type: formData.count_type,
        location_id: formData.location_id || null,
        status: 'in_progress',
        performed_by: 'Current User',
      });

      // Create count items from stock levels
      const levelsToCount = formData.location_id 
        ? levels.filter(l => l.location_id === formData.location_id)
        : levels;

      for (const level of levelsToCount) {
        await supabase.from("stock_count_items").insert({
          stock_count_id: count.id,
          stock_item_id: level.item_id,
          stock_level_id: level.id,
          expected_quantity: level.quantity_on_hand,
        });
      }

      setIsCreateOpen(false);
      setActiveCount(count.id);
      toast.success("Stock count started");
    } catch (error) {
      console.error("Failed to start count:", error);
    }
  };

  const getCountTypeLabel = (type: string) => {
    switch (type) {
      case 'cycle': return 'Cycle Count';
      case 'full': return 'Full Inventory';
      case 'spot': return 'Spot Check';
      case 'annual': return 'Annual Count';
      default: return type;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Stock Counts
            </CardTitle>
            <CardDescription>Inventory audits & cycle counts</CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Start Count
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start Stock Count</DialogTitle>
                <DialogDescription>Choose count type and location</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Count Type</Label>
                  <Select 
                    value={formData.count_type} 
                    onValueChange={(v) => setFormData(p => ({ ...p, count_type: v as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cycle">Cycle Count</SelectItem>
                      <SelectItem value="spot">Spot Check</SelectItem>
                      <SelectItem value="full">Full Inventory</SelectItem>
                      <SelectItem value="annual">Annual Count</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Location (optional)</Label>
                  <Select 
                    value={formData.location_id} 
                    onValueChange={(v) => setFormData(p => ({ ...p, location_id: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Locations</SelectItem>
                      {/* Would fetch locations here */}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleStartCount} className="w-full" disabled={createCount.isPending}>
                  {createCount.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Play className="h-4 w-4 mr-2" />
                  Start Count
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary */}
        <div className="flex gap-2 mt-3">
          <Badge variant="default" className="gap-1">
            <Play className="h-3 w-3" />
            {activeCounts.length} In Progress
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            {pendingReview.length} Pending Review
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[350px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : counts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No stock counts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {counts.slice(0, 10).map((count) => (
                <div
                  key={count.id}
                  className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">{count.count_number}</span>
                        <Badge
                          variant={count.status === 'in_progress' ? 'default' : 
                                  count.status === 'pending_review' ? 'secondary' :
                                  count.status === 'approved' ? 'outline' : 'destructive'}
                        >
                          {count.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {getCountTypeLabel(count.count_type)} • {format(new Date(count.count_date), 'MMM dd, yyyy')}
                      </p>
                      {count.stock_locations && (
                        <p className="text-sm text-muted-foreground">
                          Location: {count.stock_locations.name}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {count.status === 'in_progress' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setActiveCount(count.id)}
                          >
                            Continue
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => updateCountStatus.mutate({ 
                              id: count.id, 
                              status: 'pending_review' 
                            })}
                          >
                            Submit
                          </Button>
                        </>
                      )}
                      {count.status === 'pending_review' && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => updateCountStatus.mutate({ 
                            id: count.id, 
                            status: 'approved',
                            reviewedBy: 'Current User',
                          })}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Missing import
import { Clock } from "lucide-react";
