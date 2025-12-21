import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ClipboardCheck, Activity, Thermometer, Heart, Droplets } from "lucide-react";

export function AssessmentSection() {
  return (
    <div className="space-y-6">
      {/* Latest Vitals */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Latest Vital Signs
          </CardTitle>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Record Vitals
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            <div className="p-4 bg-muted rounded-lg text-center">
              <Heart className="w-5 h-5 mx-auto text-critical mb-2" />
              <div className="text-2xl font-semibold">72</div>
              <div className="text-xs text-muted-foreground">Heart Rate</div>
              <div className="text-xs text-muted-foreground">bpm</div>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <Activity className="w-5 h-5 mx-auto text-primary mb-2" />
              <div className="text-2xl font-semibold">120/80</div>
              <div className="text-xs text-muted-foreground">Blood Pressure</div>
              <div className="text-xs text-muted-foreground">mmHg</div>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <Thermometer className="w-5 h-5 mx-auto text-warning mb-2" />
              <div className="text-2xl font-semibold">36.8</div>
              <div className="text-xs text-muted-foreground">Temperature</div>
              <div className="text-xs text-muted-foreground">°C</div>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <Droplets className="w-5 h-5 mx-auto text-accent mb-2" />
              <div className="text-2xl font-semibold">98</div>
              <div className="text-xs text-muted-foreground">SpO2</div>
              <div className="text-xs text-muted-foreground">%</div>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <Activity className="w-5 h-5 mx-auto text-success mb-2" />
              <div className="text-2xl font-semibold">18</div>
              <div className="text-xs text-muted-foreground">Resp Rate</div>
              <div className="text-xs text-muted-foreground">/min</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground text-right">
            Last recorded: 15 minutes ago by Nurse Kamau
          </div>
        </CardContent>
      </Card>

      {/* Clinical Assessments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-primary" />
            Clinical Assessments
          </CardTitle>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1" />
            New Assessment
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Nursing Assessment</h4>
                  <p className="text-sm text-muted-foreground">
                    Completed by Nurse Kamau • 2 hours ago
                  </p>
                </div>
                <Badge variant="secondary">Complete</Badge>
              </div>
            </div>
            <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Pain Assessment</h4>
                  <p className="text-sm text-muted-foreground">Score: 3/10 • 1 hour ago</p>
                </div>
                <Badge variant="secondary">Complete</Badge>
              </div>
            </div>
            <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground">
              Click to add a new clinical assessment
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
