import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Heart, Scale, Thermometer, Droplets, Activity, Plus, TrendingUp, 
  TrendingDown, Minus, Share2, AlertCircle, Clock
} from "lucide-react";
import { format } from "date-fns";

interface VitalReading {
  id: string;
  vital_type: string;
  value_numeric: number;
  value_secondary?: number;
  unit: string;
  recorded_at: string;
  context?: string;
  source: string;
  shared_with_provider: boolean;
}

const VITAL_TYPES = [
  { value: "weight", label: "Weight", icon: Scale, unit: "kg", color: "blue" },
  { value: "blood_pressure", label: "Blood Pressure", icon: Heart, unit: "mmHg", color: "red" },
  { value: "heart_rate", label: "Heart Rate", icon: Activity, unit: "bpm", color: "pink" },
  { value: "blood_glucose", label: "Blood Glucose", icon: Droplets, unit: "mmol/L", color: "purple" },
  { value: "oxygen_saturation", label: "Oxygen Saturation", icon: Activity, unit: "%", color: "cyan" },
  { value: "temperature", label: "Temperature", icon: Thermometer, unit: "°C", color: "orange" },
];

const CONTEXTS = [
  { value: "resting", label: "Resting" },
  { value: "post_exercise", label: "Post Exercise" },
  { value: "fasting", label: "Fasting" },
  { value: "post_meal", label: "After Meal" },
];

export function WellnessVitalsTracker() {
  const [showAddVital, setShowAddVital] = useState(false);
  const [selectedVitalType, setSelectedVitalType] = useState("weight");
  const [newReading, setNewReading] = useState({
    value: "",
    value_secondary: "",
    context: "resting",
    share_with_provider: false,
  });

  // Demo data
  const latestReadings: Record<string, VitalReading> = {
    weight: { id: "1", vital_type: "weight", value_numeric: 72.5, unit: "kg", recorded_at: new Date().toISOString(), context: "morning", source: "manual", shared_with_provider: false },
    blood_pressure: { id: "2", vital_type: "blood_pressure", value_numeric: 120, value_secondary: 80, unit: "mmHg", recorded_at: new Date(Date.now() - 3600000).toISOString(), context: "resting", source: "device", shared_with_provider: true },
    heart_rate: { id: "3", vital_type: "heart_rate", value_numeric: 72, unit: "bpm", recorded_at: new Date().toISOString(), context: "resting", source: "device", shared_with_provider: false },
    blood_glucose: { id: "4", vital_type: "blood_glucose", value_numeric: 5.4, unit: "mmol/L", recorded_at: new Date(Date.now() - 7200000).toISOString(), context: "fasting", source: "manual", shared_with_provider: true },
  };

  const recentHistory: VitalReading[] = [
    { id: "h1", vital_type: "weight", value_numeric: 72.5, unit: "kg", recorded_at: new Date().toISOString(), source: "manual", shared_with_provider: false },
    { id: "h2", vital_type: "blood_pressure", value_numeric: 120, value_secondary: 80, unit: "mmHg", recorded_at: new Date(Date.now() - 3600000).toISOString(), context: "resting", source: "device", shared_with_provider: true },
    { id: "h3", vital_type: "weight", value_numeric: 72.8, unit: "kg", recorded_at: new Date(Date.now() - 86400000).toISOString(), source: "manual", shared_with_provider: false },
    { id: "h4", vital_type: "heart_rate", value_numeric: 68, unit: "bpm", recorded_at: new Date(Date.now() - 86400000).toISOString(), context: "resting", source: "device", shared_with_provider: false },
    { id: "h5", vital_type: "blood_glucose", value_numeric: 5.2, unit: "mmol/L", recorded_at: new Date(Date.now() - 172800000).toISOString(), context: "fasting", source: "manual", shared_with_provider: true },
  ];

  const handleAddVital = () => {
    console.log("Adding vital:", { type: selectedVitalType, ...newReading });
    setShowAddVital(false);
    setNewReading({ value: "", value_secondary: "", context: "resting", share_with_provider: false });
  };

  const getVitalIcon = (type: string) => {
    const vital = VITAL_TYPES.find(v => v.value === type);
    return vital?.icon || Heart;
  };

  const getVitalColor = (type: string) => {
    const vital = VITAL_TYPES.find(v => v.value === type);
    return vital?.color || "gray";
  };

  const formatVitalValue = (reading: VitalReading) => {
    if (reading.vital_type === "blood_pressure" && reading.value_secondary) {
      return `${reading.value_numeric}/${reading.value_secondary}`;
    }
    return reading.value_numeric.toString();
  };

  const getTrend = (type: string): "up" | "down" | "stable" => {
    // Mock trend calculation
    const trends: Record<string, "up" | "down" | "stable"> = {
      weight: "down",
      blood_pressure: "stable",
      heart_rate: "stable",
      blood_glucose: "up",
    };
    return trends[type] || "stable";
  };

  const TrendIcon = ({ trend }: { trend: "up" | "down" | "stable" }) => {
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-orange-500" />;
    if (trend === "down") return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {VITAL_TYPES.slice(0, 4).map(vitalType => {
          const reading = latestReadings[vitalType.value];
          const Icon = vitalType.icon;
          const trend = getTrend(vitalType.value);
          
          return (
            <Card key={vitalType.value} className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`h-5 w-5 text-${vitalType.color}-500`} />
                  {reading?.shared_with_provider && (
                    <Badge variant="outline" className="text-xs">
                      <Share2 className="h-3 w-3 mr-1" />
                      Shared
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">{vitalType.label}</div>
                {reading ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{formatVitalValue(reading)}</span>
                      <span className="text-sm text-muted-foreground">{vitalType.unit}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <TrendIcon trend={trend} />
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(reading.recorded_at), "h:mm a")}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-muted-foreground text-sm mt-2">No data</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Vital / History */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Record Vitals</CardTitle>
            <Button size="sm" onClick={() => setShowAddVital(!showAddVital)}>
              <Plus className="h-4 w-4 mr-1" />
              Log Reading
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showAddVital && (
            <div className="p-4 border rounded-lg mb-4 bg-muted/30">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Vital Type</Label>
                  <Select value={selectedVitalType} onValueChange={setSelectedVitalType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VITAL_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedVitalType === "blood_pressure" ? (
                  <>
                    <div>
                      <Label>Systolic (top number)</Label>
                      <Input 
                        type="number" 
                        placeholder="e.g., 120"
                        value={newReading.value}
                        onChange={(e) => setNewReading({ ...newReading, value: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Diastolic (bottom number)</Label>
                      <Input 
                        type="number" 
                        placeholder="e.g., 80"
                        value={newReading.value_secondary}
                        onChange={(e) => setNewReading({ ...newReading, value_secondary: e.target.value })}
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <Label>Value ({VITAL_TYPES.find(v => v.value === selectedVitalType)?.unit})</Label>
                    <Input 
                      type="number" 
                      step="0.1"
                      placeholder="Enter value"
                      value={newReading.value}
                      onChange={(e) => setNewReading({ ...newReading, value: e.target.value })}
                    />
                  </div>
                )}

                <div>
                  <Label>Context</Label>
                  <Select value={newReading.context} onValueChange={(v) => setNewReading({ ...newReading, context: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTEXTS.map(ctx => (
                        <SelectItem key={ctx.value} value={ctx.value}>{ctx.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <Switch 
                  checked={newReading.share_with_provider}
                  onCheckedChange={(checked) => setNewReading({ ...newReading, share_with_provider: checked })}
                />
                <div>
                  <Label className="text-sm font-normal">Share with my healthcare provider</Label>
                  <p className="text-xs text-muted-foreground">This reading will be visible during appointments</p>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button onClick={handleAddVital}>Save Reading</Button>
                <Button variant="outline" onClick={() => setShowAddVital(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {/* Recent History */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Recent Readings</h4>
            {recentHistory.map(reading => {
              const Icon = getVitalIcon(reading.vital_type);
              const vitalInfo = VITAL_TYPES.find(v => v.value === reading.vital_type);
              
              return (
                <div key={reading.id} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className={`h-10 w-10 rounded-full bg-${vitalInfo?.color || "gray"}-100 dark:bg-${vitalInfo?.color || "gray"}-900/30 flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 text-${vitalInfo?.color || "gray"}-600`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{vitalInfo?.label}</span>
                      {reading.context && (
                        <Badge variant="secondary" className="text-xs capitalize">{reading.context}</Badge>
                      )}
                      {reading.shared_with_provider && (
                        <Share2 className="h-3 w-3 text-blue-500" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(reading.recorded_at), "MMM d, h:mm a")}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-semibold">{formatVitalValue(reading)}</span>
                    <span className="text-sm text-muted-foreground ml-1">{reading.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200">Informational Only</p>
                <p className="text-amber-700 dark:text-amber-300 mt-1">
                  These readings are for personal wellness tracking. They are not clinical measurements and should not be used for medical diagnosis.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
