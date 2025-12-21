import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Home, Building, Ambulance, Calendar } from "lucide-react";
import { useState } from "react";

const DISPOSITION_OPTIONS = [
  { id: "discharge", label: "Discharge Home", icon: Home, description: "Patient ready for discharge" },
  { id: "transfer", label: "Transfer", icon: Building, description: "Transfer to another facility" },
  { id: "admit", label: "Admit", icon: Ambulance, description: "Admit to inpatient ward" },
  { id: "schedule", label: "Schedule Follow-up", icon: Calendar, description: "Schedule outpatient visit" },
];

export function OutcomeSection() {
  const [disposition, setDisposition] = useState<string>("");

  return (
    <div className="space-y-6">
      {/* Visit Disposition */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            Visit Disposition
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={disposition} onValueChange={setDisposition} className="grid grid-cols-2 gap-4">
            {DISPOSITION_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <div key={option.id}>
                  <RadioGroupItem value={option.id} id={option.id} className="peer sr-only" />
                  <Label
                    htmlFor={option.id}
                    className="flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary-muted transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center peer-data-[state=checked]:bg-primary/20">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </div>
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Discharge Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Discharge Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="summary" className="text-sm font-medium">Summary Notes</Label>
            <Textarea
              id="summary"
              placeholder="Enter discharge summary..."
              className="mt-2 min-h-[120px]"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Follow-up Instructions</Label>
            <Textarea
              placeholder="Enter follow-up care instructions..."
              className="mt-2 min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Discharge Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              "Medication reconciliation complete",
              "Discharge medications ordered",
              "Patient education provided",
              "Follow-up appointments scheduled",
              "Discharge documents signed",
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
              >
                <div className="w-5 h-5 rounded border-2 border-muted-foreground/50" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline">Save Draft</Button>
        <Button>Complete Encounter</Button>
      </div>
    </div>
  );
}
