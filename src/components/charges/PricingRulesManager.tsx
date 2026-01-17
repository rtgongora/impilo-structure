import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Calculator,
  Plus,
  Percent,
  DollarSign,
  Trash2,
  Edit,
  Loader2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { usePricingRules, type PricingRule } from "@/hooks/useChargeCapture";
import { format } from "date-fns";

export function PricingRulesManager() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    rule_type: "markup" as 'markup' | 'discount' | 'fixed' | 'tiered' | 'time_based',
    applies_to: "all" as 'all' | 'category' | 'item' | 'payer' | 'service',
    adjustment_type: "percentage" as 'percentage' | 'fixed_amount',
    adjustment_value: "0",
    priority: "0",
    effective_from: new Date().toISOString().split('T')[0],
    effective_to: "",
    is_active: true,
  });

  const { rules, activeRules, isLoading, createRule, updateRule, deleteRule } = usePricingRules();

  const handleSubmit = async () => {
    try {
      if (editingRule) {
        await updateRule.mutateAsync({
          id: editingRule.id,
          name: formData.name,
          description: formData.description || null,
          rule_type: formData.rule_type,
          applies_to: formData.applies_to,
          adjustment_type: formData.adjustment_type,
          adjustment_value: parseFloat(formData.adjustment_value),
          priority: parseInt(formData.priority),
          effective_from: formData.effective_from,
          effective_to: formData.effective_to || null,
          is_active: formData.is_active,
        });
      } else {
        await createRule.mutateAsync({
          name: formData.name,
          description: formData.description || null,
          rule_type: formData.rule_type,
          applies_to: formData.applies_to,
          target_id: null,
          conditions: {},
          adjustment_type: formData.adjustment_type,
          adjustment_value: parseFloat(formData.adjustment_value),
          priority: parseInt(formData.priority),
          effective_from: formData.effective_from,
          effective_to: formData.effective_to || null,
          is_active: formData.is_active,
          created_by: 'Current User',
        });
      }
      setIsCreateOpen(false);
      setEditingRule(null);
      resetForm();
    } catch (error) {
      console.error("Failed to save rule:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      rule_type: "markup",
      applies_to: "all",
      adjustment_type: "percentage",
      adjustment_value: "0",
      priority: "0",
      effective_from: new Date().toISOString().split('T')[0],
      effective_to: "",
      is_active: true,
    });
  };

  const handleEdit = (rule: PricingRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || "",
      rule_type: rule.rule_type,
      applies_to: rule.applies_to,
      adjustment_type: rule.adjustment_type,
      adjustment_value: rule.adjustment_value.toString(),
      priority: rule.priority.toString(),
      effective_from: rule.effective_from,
      effective_to: rule.effective_to || "",
      is_active: rule.is_active,
    });
    setIsCreateOpen(true);
  };

  const getRuleTypeIcon = (type: string) => {
    switch (type) {
      case 'markup': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'discount': return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'fixed': return <DollarSign className="h-4 w-4 text-blue-500" />;
      default: return <Calculator className="h-4 w-4" />;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Pricing Rules
            </CardTitle>
            <CardDescription>Configure markup, discount, and fixed pricing rules</CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) {
              setEditingRule(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Rule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingRule ? 'Edit' : 'Create'} Pricing Rule</DialogTitle>
                <DialogDescription>Configure pricing adjustments</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Rule Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g., Standard Markup"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Rule Type</Label>
                    <Select 
                      value={formData.rule_type} 
                      onValueChange={(v) => setFormData(p => ({ ...p, rule_type: v as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="markup">Markup (+)</SelectItem>
                        <SelectItem value="discount">Discount (-)</SelectItem>
                        <SelectItem value="fixed">Fixed Price</SelectItem>
                        <SelectItem value="tiered">Tiered</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Applies To</Label>
                    <Select 
                      value={formData.applies_to} 
                      onValueChange={(v) => setFormData(p => ({ ...p, applies_to: v as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Items</SelectItem>
                        <SelectItem value="category">Category</SelectItem>
                        <SelectItem value="item">Specific Item</SelectItem>
                        <SelectItem value="payer">Payer Type</SelectItem>
                        <SelectItem value="service">Service Code</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Adjustment Type</Label>
                    <Select 
                      value={formData.adjustment_type} 
                      onValueChange={(v) => setFormData(p => ({ ...p, adjustment_type: v as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed_amount">Fixed Amount ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Value</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={formData.adjustment_value}
                        onChange={(e) => setFormData(p => ({ ...p, adjustment_value: e.target.value }))}
                        className="pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {formData.adjustment_type === 'percentage' ? '%' : '$'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Input
                      type="number"
                      value={formData.priority}
                      onChange={(e) => setFormData(p => ({ ...p, priority: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Effective From</Label>
                    <Input
                      type="date"
                      value={formData.effective_from}
                      onChange={(e) => setFormData(p => ({ ...p, effective_from: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Effective To</Label>
                    <Input
                      type="date"
                      value={formData.effective_to}
                      onChange={(e) => setFormData(p => ({ ...p, effective_to: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(p => ({ ...p, is_active: checked }))}
                  />
                  <Label>Active</Label>
                </div>

                <Button 
                  onClick={handleSubmit} 
                  className="w-full"
                  disabled={!formData.name || createRule.isPending || updateRule.isPending}
                >
                  {(createRule.isPending || updateRule.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingRule ? 'Update' : 'Create'} Rule
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-2 mt-3">
          <Badge variant="default">{activeRules.length} Active</Badge>
          <Badge variant="outline">{rules.length - activeRules.length} Inactive</Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : rules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No pricing rules configured</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Adjustment</TableHead>
                  <TableHead>Applies To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id} className={!rule.is_active ? 'opacity-50' : ''}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{rule.name}</p>
                        <p className="text-xs text-muted-foreground">Priority: {rule.priority}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getRuleTypeIcon(rule.rule_type)}
                        <span className="capitalize">{rule.rule_type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {rule.adjustment_type === 'percentage' ? (
                          <><Percent className="h-3 w-3 mr-1" />{rule.adjustment_value}%</>
                        ) : (
                          <><DollarSign className="h-3 w-3 mr-1" />{rule.adjustment_value}</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">{rule.applies_to}</TableCell>
                    <TableCell>
                      <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(rule)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => deleteRule.mutate(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
