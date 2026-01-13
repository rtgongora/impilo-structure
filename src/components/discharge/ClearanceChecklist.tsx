import { useState } from "react";
import { 
  Check, Clock, AlertTriangle, X, Ban,
  Stethoscope, Heart, Pill, FlaskConical, ScanLine,
  DollarSign, ClipboardCheck, FileText, FileCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  DischargeClearance, 
  ClearanceType, 
  ClearanceStatus,
  ChecklistItem,
  CLEARANCE_LABELS 
} from "./types";

interface ClearanceChecklistProps {
  clearance: DischargeClearance;
  onUpdate?: () => void;
  readOnly?: boolean;
}

const CLEARANCE_ICONS: Record<ClearanceType, React.ComponentType<{ className?: string }>> = {
  clinical: Stethoscope,
  nursing: Heart,
  pharmacy: Pill,
  laboratory: FlaskConical,
  imaging: ScanLine,
  financial: DollarSign,
  administrative: ClipboardCheck,
  records: FileText,
  crvs: FileCheck
};

const STATUS_CONFIG: Record<ClearanceStatus, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  pending: { icon: Clock, color: "text-yellow-600 bg-yellow-50 border-yellow-200", label: "Pending" },
  in_progress: { icon: Clock, color: "text-blue-600 bg-blue-50 border-blue-200", label: "In Progress" },
  cleared: { icon: Check, color: "text-green-600 bg-green-50 border-green-200", label: "Cleared" },
  blocked: { icon: X, color: "text-red-600 bg-red-50 border-red-200", label: "Blocked" },
  waived: { icon: Ban, color: "text-purple-600 bg-purple-50 border-purple-200", label: "Waived" },
  not_applicable: { icon: Ban, color: "text-muted-foreground bg-muted", label: "N/A" }
};

export function ClearanceChecklist({ clearance, onUpdate, readOnly = false }: ClearanceChecklistProps) {
  const [completedItems, setCompletedItems] = useState<string[]>(
    (clearance.completed_items || []).map(item => item.id)
  );
  const [notes, setNotes] = useState(clearance.notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [blockReason, setBlockReason] = useState("");

  const Icon = CLEARANCE_ICONS[clearance.clearance_type];
  const statusConfig = STATUS_CONFIG[clearance.status];
  const StatusIcon = statusConfig.icon;
  
  const checklistItems = clearance.checklist_items || [];
  const requiredItems = checklistItems.filter(item => item.required);
  const allRequiredComplete = requiredItems.every(item => completedItems.includes(item.id));

  const handleToggleItem = (itemId: string) => {
    if (readOnly || clearance.status === 'cleared') return;
    setCompletedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleClear = async () => {
    if (!allRequiredComplete) {
      toast.error("Complete all required items before clearing");
      return;
    }

    setIsSubmitting(true);
    try {
      const completedItemsData = checklistItems
        .filter(item => completedItems.includes(item.id))
        .map(item => ({ ...item, completed: true }));

      const { error } = await supabase
        .from('discharge_clearances')
        .update({
          status: 'cleared',
          cleared_at: new Date().toISOString(),
          completed_items: completedItemsData,
          notes
        } as any)
        .eq('id', clearance.id);

      if (error) throw error;
      toast.success("Clearance approved");
      onUpdate?.();
    } catch (error) {
      console.error('Clear error:', error);
      toast.error("Failed to approve clearance");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBlock = async () => {
    if (!blockReason.trim()) {
      toast.error("Please provide a reason for blocking");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('discharge_clearances')
        .update({
          status: 'blocked',
          blocked_reason: blockReason,
          notes
        } as any)
        .eq('id', clearance.id);

      if (error) throw error;
      toast.success("Clearance blocked");
      onUpdate?.();
    } catch (error) {
      console.error('Block error:', error);
      toast.error("Failed to block clearance");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={cn(
      "border-l-4",
      clearance.status === 'cleared' && "border-l-green-500",
      clearance.status === 'blocked' && "border-l-red-500",
      clearance.status === 'pending' && "border-l-yellow-500",
      clearance.status === 'in_progress' && "border-l-blue-500"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base">
                {CLEARANCE_LABELS[clearance.clearance_type]}
              </CardTitle>
              <CardDescription>
                Step {clearance.sequence_order}
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className={statusConfig.color}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Checklist Items */}
        <div className="space-y-2">
          {checklistItems.map((item) => (
            <div 
              key={item.id}
              className={cn(
                "flex items-center gap-3 p-2 rounded-lg border transition-colors",
                completedItems.includes(item.id) ? "bg-green-50 border-green-200" : "bg-background",
                !readOnly && clearance.status !== 'cleared' && "cursor-pointer hover:bg-muted/50"
              )}
              onClick={() => handleToggleItem(item.id)}
            >
              <Checkbox 
                checked={completedItems.includes(item.id)}
                disabled={readOnly || clearance.status === 'cleared'}
              />
              <span className={cn(
                "flex-1",
                completedItems.includes(item.id) && "line-through text-muted-foreground"
              )}>
                {item.label}
              </span>
              {item.required && (
                <Badge variant="outline" className="text-xs">Required</Badge>
              )}
            </div>
          ))}
        </div>

        {/* Block Reason (if blocked) */}
        {clearance.status === 'blocked' && clearance.blocked_reason && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 font-medium mb-1">
              <AlertTriangle className="w-4 h-4" />
              Blocked
            </div>
            <p className="text-sm text-red-600">{clearance.blocked_reason}</p>
          </div>
        )}

        {/* Notes */}
        {!readOnly && clearance.status !== 'cleared' && (
          <Textarea
            placeholder="Add notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[60px]"
          />
        )}

        {/* Block Reason Input */}
        {!readOnly && clearance.status !== 'cleared' && clearance.status !== 'blocked' && (
          <Textarea
            placeholder="Reason for blocking (if applicable)..."
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            className="min-h-[40px]"
          />
        )}

        {/* Actions */}
        {!readOnly && clearance.status !== 'cleared' && clearance.status !== 'blocked' && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleClear}
              disabled={!allRequiredComplete || isSubmitting}
              className="flex-1"
            >
              <Check className="w-4 h-4 mr-2" />
              Approve Clearance
            </Button>
            <Button
              variant="destructive"
              onClick={handleBlock}
              disabled={isSubmitting}
            >
              <X className="w-4 h-4 mr-2" />
              Block
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
