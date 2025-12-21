import { useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Activity, Save, Thermometer, Heart, Wind, Droplets, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface VitalsFormData {
  temperature: string;
  pulse_rate: string;
  respiratory_rate: string;
  blood_pressure_systolic: string;
  blood_pressure_diastolic: string;
  oxygen_saturation: string;
  pain_score: string;
  weight: string;
  height: string;
  blood_glucose: string;
  notes: string;
}

interface VitalSign {
  id: string;
  recorded_at: string;
  temperature: number | null;
  pulse_rate: number | null;
  respiratory_rate: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  oxygen_saturation: number | null;
  pain_score: number | null;
  weight: number | null;
  height: number | null;
  blood_glucose: number | null;
}

interface VitalsRecorderProps {
  encounterId: string;
  existingVitals?: VitalSign[];
  onVitalsSaved?: () => void;
}

export function VitalsRecorder({ encounterId, existingVitals = [], onVitalsSaved }: VitalsRecorderProps) {
  const [saving, setSaving] = useState(false);
  
  const { register, handleSubmit, reset } = useForm<VitalsFormData>({
    defaultValues: {
      temperature: '',
      pulse_rate: '',
      respiratory_rate: '',
      blood_pressure_systolic: '',
      blood_pressure_diastolic: '',
      oxygen_saturation: '',
      pain_score: '',
      weight: '',
      height: '',
      blood_glucose: '',
      notes: '',
    }
  });

  const onSubmit = async (data: VitalsFormData) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('vital_signs')
        .insert({
          encounter_id: encounterId,
          temperature: data.temperature ? parseFloat(data.temperature) : null,
          pulse_rate: data.pulse_rate ? parseInt(data.pulse_rate) : null,
          respiratory_rate: data.respiratory_rate ? parseInt(data.respiratory_rate) : null,
          blood_pressure_systolic: data.blood_pressure_systolic ? parseInt(data.blood_pressure_systolic) : null,
          blood_pressure_diastolic: data.blood_pressure_diastolic ? parseInt(data.blood_pressure_diastolic) : null,
          oxygen_saturation: data.oxygen_saturation ? parseInt(data.oxygen_saturation) : null,
          pain_score: data.pain_score ? parseInt(data.pain_score) : null,
          weight: data.weight ? parseFloat(data.weight) : null,
          height: data.height ? parseFloat(data.height) : null,
          blood_glucose: data.blood_glucose ? parseFloat(data.blood_glucose) : null,
          notes: data.notes || null,
        });
      
      if (error) throw error;
      toast.success('Vital signs recorded successfully');
      reset();
      onVitalsSaved?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to record vitals');
    } finally {
      setSaving(false);
    }
  };

  const getVitalStatus = (type: string, value: number | null) => {
    if (value === null) return null;
    
    const ranges: Record<string, { low: number; high: number; critical_low?: number; critical_high?: number }> = {
      temperature: { low: 36, high: 37.5, critical_low: 35, critical_high: 39 },
      pulse_rate: { low: 60, high: 100, critical_low: 40, critical_high: 150 },
      respiratory_rate: { low: 12, high: 20, critical_low: 8, critical_high: 30 },
      oxygen_saturation: { low: 95, high: 100, critical_low: 90 },
      blood_pressure_systolic: { low: 90, high: 140, critical_low: 80, critical_high: 180 },
    };
    
    const range = ranges[type];
    if (!range) return 'normal';
    
    if (range.critical_low && value < range.critical_low) return 'critical';
    if (range.critical_high && value > range.critical_high) return 'critical';
    if (value < range.low || value > range.high) return 'abnormal';
    return 'normal';
  };

  const statusColors = {
    normal: 'text-green-600',
    abnormal: 'text-yellow-600',
    critical: 'text-red-600',
  };

  const latestVitals = existingVitals[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Record New Vitals */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Record Vital Signs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="temperature" className="flex items-center gap-1">
                  <Thermometer className="h-3 w-3" />
                  Temperature (°C)
                </Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  {...register('temperature')}
                  placeholder="36.5"
                />
              </div>
              
              <div>
                <Label htmlFor="pulse_rate" className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  Pulse Rate (bpm)
                </Label>
                <Input
                  id="pulse_rate"
                  type="number"
                  {...register('pulse_rate')}
                  placeholder="72"
                />
              </div>
              
              <div>
                <Label htmlFor="respiratory_rate" className="flex items-center gap-1">
                  <Wind className="h-3 w-3" />
                  Respiratory Rate
                </Label>
                <Input
                  id="respiratory_rate"
                  type="number"
                  {...register('respiratory_rate')}
                  placeholder="16"
                />
              </div>
              
              <div>
                <Label htmlFor="oxygen_saturation" className="flex items-center gap-1">
                  <Droplets className="h-3 w-3" />
                  SpO2 (%)
                </Label>
                <Input
                  id="oxygen_saturation"
                  type="number"
                  {...register('oxygen_saturation')}
                  placeholder="98"
                />
              </div>
              
              <div className="col-span-2">
                <Label>Blood Pressure (mmHg)</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    {...register('blood_pressure_systolic')}
                    placeholder="120"
                  />
                  <span>/</span>
                  <Input
                    type="number"
                    {...register('blood_pressure_diastolic')}
                    placeholder="80"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="pain_score">Pain Score (0-10)</Label>
                <Input
                  id="pain_score"
                  type="number"
                  min="0"
                  max="10"
                  {...register('pain_score')}
                  placeholder="0"
                />
              </div>
              
              <div>
                <Label htmlFor="blood_glucose">Blood Glucose (mmol/L)</Label>
                <Input
                  id="blood_glucose"
                  type="number"
                  step="0.1"
                  {...register('blood_glucose')}
                  placeholder="5.5"
                />
              </div>
              
              <div>
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  {...register('weight')}
                  placeholder="70"
                />
              </div>
              
              <div>
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  {...register('height')}
                  placeholder="170"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Recording...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Record Vitals
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Vitals History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Vitals History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <div className="p-4 space-y-3">
              {existingVitals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No vital signs recorded for this encounter
                </p>
              ) : (
                existingVitals.map((vital) => (
                  <div key={vital.id} className="p-3 border rounded-lg">
                    <div className="text-xs text-muted-foreground mb-2">
                      {format(new Date(vital.recorded_at), 'MMM d, yyyy HH:mm')}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      {vital.temperature && (
                        <div className={statusColors[getVitalStatus('temperature', vital.temperature) || 'normal']}>
                          <span className="text-muted-foreground">Temp:</span> {vital.temperature}°C
                        </div>
                      )}
                      {vital.pulse_rate && (
                        <div className={statusColors[getVitalStatus('pulse_rate', vital.pulse_rate) || 'normal']}>
                          <span className="text-muted-foreground">HR:</span> {vital.pulse_rate}
                        </div>
                      )}
                      {vital.respiratory_rate && (
                        <div className={statusColors[getVitalStatus('respiratory_rate', vital.respiratory_rate) || 'normal']}>
                          <span className="text-muted-foreground">RR:</span> {vital.respiratory_rate}
                        </div>
                      )}
                      {vital.blood_pressure_systolic && vital.blood_pressure_diastolic && (
                        <div className={statusColors[getVitalStatus('blood_pressure_systolic', vital.blood_pressure_systolic) || 'normal']}>
                          <span className="text-muted-foreground">BP:</span> {vital.blood_pressure_systolic}/{vital.blood_pressure_diastolic}
                        </div>
                      )}
                      {vital.oxygen_saturation && (
                        <div className={statusColors[getVitalStatus('oxygen_saturation', vital.oxygen_saturation) || 'normal']}>
                          <span className="text-muted-foreground">SpO2:</span> {vital.oxygen_saturation}%
                        </div>
                      )}
                      {vital.pain_score !== null && (
                        <div>
                          <span className="text-muted-foreground">Pain:</span> {vital.pain_score}/10
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
