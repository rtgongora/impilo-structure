import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Pill, Plus, Play, Pause, XCircle, CheckCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface MedicationFormData {
  medication_name: string;
  generic_name: string;
  dosage: string;
  dosage_unit: string;
  route: string;
  frequency: string;
  duration: string;
  instructions: string;
  indication: string;
  is_prn: boolean;
  prn_reason: string;
}

interface MedicationOrder {
  id: string;
  medication_name: string;
  generic_name: string | null;
  dosage: string;
  dosage_unit: string;
  route: string;
  frequency: string;
  duration: string | null;
  instructions: string | null;
  indication: string | null;
  status: string;
  is_prn: boolean;
  start_date: string;
  end_date: string | null;
}

interface MedicationOrdersProps {
  encounterId: string;
  patientId?: string;
  existingOrders?: MedicationOrder[];
  onOrderSaved?: () => void;
}

const ROUTES = [
  { value: 'oral', label: 'Oral (PO)' },
  { value: 'iv', label: 'Intravenous (IV)' },
  { value: 'im', label: 'Intramuscular (IM)' },
  { value: 'sc', label: 'Subcutaneous (SC)' },
  { value: 'topical', label: 'Topical' },
  { value: 'inhaled', label: 'Inhaled' },
  { value: 'rectal', label: 'Rectal (PR)' },
  { value: 'sublingual', label: 'Sublingual (SL)' },
  { value: 'transdermal', label: 'Transdermal' },
  { value: 'ophthalmic', label: 'Ophthalmic' },
  { value: 'otic', label: 'Otic' },
  { value: 'nasal', label: 'Nasal' },
  { value: 'other', label: 'Other' },
];

const FREQUENCIES = [
  'Once daily (OD)',
  'Twice daily (BD)',
  'Three times daily (TDS)',
  'Four times daily (QDS)',
  'Every 4 hours (Q4H)',
  'Every 6 hours (Q6H)',
  'Every 8 hours (Q8H)',
  'Every 12 hours (Q12H)',
  'At bedtime (Nocte)',
  'As needed (PRN)',
  'Stat (immediately)',
  'Weekly',
];

export function MedicationOrders({ encounterId, patientId: propPatientId, existingOrders = [], onOrderSaved }: MedicationOrdersProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [patientId, setPatientId] = useState(propPatientId || '');

  // Fetch patient ID from encounter if not provided
  useEffect(() => {
    if (!propPatientId && encounterId) {
      supabase
        .from('encounters')
        .select('patient_id')
        .eq('id', encounterId)
        .single()
        .then(({ data }) => {
          if (data?.patient_id) setPatientId(data.patient_id);
        });
    }
  }, [propPatientId, encounterId]);
  const { register, handleSubmit, reset, setValue, watch } = useForm<MedicationFormData>({
    defaultValues: {
      medication_name: '',
      generic_name: '',
      dosage: '',
      dosage_unit: 'mg',
      route: 'oral',
      frequency: 'Once daily (OD)',
      duration: '',
      instructions: '',
      indication: '',
      is_prn: false,
      prn_reason: '',
    }
  });

  const isPrn = watch('is_prn');

  const onSubmit = async (data: MedicationFormData) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('medication_orders')
        .insert({
          encounter_id: encounterId,
          patient_id: patientId,
          medication_name: data.medication_name,
          generic_name: data.generic_name || null,
          dosage: data.dosage,
          dosage_unit: data.dosage_unit,
          route: data.route,
          frequency: data.frequency,
          duration: data.duration || null,
          instructions: data.instructions || null,
          indication: data.indication || null,
          is_prn: data.is_prn,
          prn_reason: data.is_prn ? data.prn_reason : null,
          status: 'active',
        });
      
      if (error) throw error;
      toast.success('Medication order created successfully');
      reset();
      setDialogOpen(false);
      onOrderSaved?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create order');
    } finally {
      setSaving(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('medication_orders')
        .update({ 
          status,
          end_date: status === 'discontinued' || status === 'completed' ? new Date().toISOString() : null,
        })
        .eq('id', orderId);
      
      if (error) throw error;
      toast.success(`Order ${status}`);
      onOrderSaved?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update order');
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-700 border-yellow-300',
    active: 'bg-green-500/10 text-green-700 border-green-300',
    completed: 'bg-blue-500/10 text-blue-700 border-blue-300',
    discontinued: 'bg-red-500/10 text-red-700 border-red-300',
    cancelled: 'bg-gray-500/10 text-gray-700 border-gray-300',
  };

  const activeOrders = existingOrders.filter(o => o.status === 'active' || o.status === 'pending');
  const inactiveOrders = existingOrders.filter(o => o.status !== 'active' && o.status !== 'pending');

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Active Medication Orders
              <Badge variant="secondary">{activeOrders.length}</Badge>
            </CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  New Order
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>New Medication Order</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="medication_name">Medication Name *</Label>
                      <Input
                        id="medication_name"
                        {...register('medication_name', { required: true })}
                        placeholder="e.g., Paracetamol"
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <Label htmlFor="generic_name">Generic Name</Label>
                      <Input
                        id="generic_name"
                        {...register('generic_name')}
                        placeholder="e.g., Acetaminophen"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="dosage">Dosage *</Label>
                      <div className="flex gap-2">
                        <Input
                          id="dosage"
                          {...register('dosage', { required: true })}
                          placeholder="500"
                        />
                        <Select 
                          value={watch('dosage_unit')} 
                          onValueChange={(v) => setValue('dosage_unit', v)}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mg">mg</SelectItem>
                            <SelectItem value="g">g</SelectItem>
                            <SelectItem value="mcg">mcg</SelectItem>
                            <SelectItem value="ml">ml</SelectItem>
                            <SelectItem value="units">units</SelectItem>
                            <SelectItem value="tabs">tabs</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="route">Route *</Label>
                      <Select 
                        value={watch('route')} 
                        onValueChange={(v) => setValue('route', v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROUTES.map(route => (
                            <SelectItem key={route.value} value={route.value}>
                              {route.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="frequency">Frequency *</Label>
                      <Select 
                        value={watch('frequency')} 
                        onValueChange={(v) => setValue('frequency', v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FREQUENCIES.map(freq => (
                            <SelectItem key={freq} value={freq}>
                              {freq}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="duration">Duration</Label>
                      <Input
                        id="duration"
                        {...register('duration')}
                        placeholder="e.g., 5 days"
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <Label htmlFor="indication">Indication</Label>
                      <Input
                        id="indication"
                        {...register('indication')}
                        placeholder="e.g., For pain relief"
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <Label htmlFor="instructions">Special Instructions</Label>
                      <Textarea
                        id="instructions"
                        {...register('instructions')}
                        placeholder="e.g., Take with food"
                        rows={2}
                      />
                    </div>
                    
                    <div className="col-span-2 flex items-center gap-2">
                      <Switch
                        id="is_prn"
                        checked={isPrn}
                        onCheckedChange={(v) => setValue('is_prn', v)}
                      />
                      <Label htmlFor="is_prn">PRN (As Needed)</Label>
                    </div>
                    
                    {isPrn && (
                      <div className="col-span-2">
                        <Label htmlFor="prn_reason">PRN Reason</Label>
                        <Input
                          id="prn_reason"
                          {...register('prn_reason')}
                          placeholder="e.g., For breakthrough pain"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Order'
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {activeOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No active medication orders
                </p>
              ) : (
                activeOrders.map((order) => (
                  <div key={order.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{order.medication_name}</span>
                          {order.is_prn && (
                            <Badge variant="outline" className="text-xs">PRN</Badge>
                          )}
                          <Badge className={statusColors[order.status]}>
                            {order.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {order.dosage} {order.dosage_unit} • {order.route} • {order.frequency}
                        </p>
                        {order.instructions && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {order.instructions}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Started: {format(new Date(order.start_date), 'MMM d, yyyy')}
                          {order.duration && ` • Duration: ${order.duration}`}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-green-600"
                          title="Mark Complete"
                          onClick={() => updateOrderStatus(order.id, 'completed')}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-600"
                          title="Discontinue"
                          onClick={() => updateOrderStatus(order.id, 'discontinued')}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {inactiveOrders.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Order History</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {inactiveOrders.map((order) => (
                  <div key={order.id} className="p-3 border rounded-lg opacity-60">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{order.medication_name}</span>
                      <Badge className={statusColors[order.status]}>
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {order.dosage} {order.dosage_unit} • {order.route} • {order.frequency}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
