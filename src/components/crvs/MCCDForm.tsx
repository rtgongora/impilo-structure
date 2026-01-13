import { useState } from "react";
import { 
  FileText, Stethoscope, Save, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MCCDFormProps {
  deathNotificationId: string;
  deceasedName?: string;
  dateOfDeath?: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

interface FormData {
  // Certifying physician
  certifyingPhysicianName: string;
  certifyingPhysicianQualification: string;
  certifyingPhysicianRegistration: string;
  certificationDate: string;
  
  // Part I - Cause of Death Chain
  immediateCause: string;
  immediateCauseIcd: string;
  immediateCauseDuration: string;
  
  antecedentCauseA: string;
  antecedentCauseAIcd: string;
  antecedentCauseADuration: string;
  
  antecedentCauseB: string;
  antecedentCauseBIcd: string;
  antecedentCauseBDuration: string;
  
  underlyingCause: string;
  underlyingCauseIcd: string;
  underlyingCauseDuration: string;
  
  // Part II - Contributing conditions
  contributingConditions: string;
  
  // Additional info
  autopsyPerformed: boolean;
  autopsyFindingsAvailable: boolean;
  
  // For maternal deaths
  wasPregnant: boolean;
  pregnancyContribution: string;
  
  // Manner of death
  mannerOfDeath: 'natural' | 'accident' | 'suicide' | 'homicide' | 'pending' | 'undetermined';
}

const initialFormData: FormData = {
  certifyingPhysicianName: "",
  certifyingPhysicianQualification: "",
  certifyingPhysicianRegistration: "",
  certificationDate: new Date().toISOString().split('T')[0],
  
  immediateCause: "",
  immediateCauseIcd: "",
  immediateCauseDuration: "",
  
  antecedentCauseA: "",
  antecedentCauseAIcd: "",
  antecedentCauseADuration: "",
  
  antecedentCauseB: "",
  antecedentCauseBIcd: "",
  antecedentCauseBDuration: "",
  
  underlyingCause: "",
  underlyingCauseIcd: "",
  underlyingCauseDuration: "",
  
  contributingConditions: "",
  
  autopsyPerformed: false,
  autopsyFindingsAvailable: false,
  
  wasPregnant: false,
  pregnancyContribution: "",
  
  mannerOfDeath: 'natural',
};

export function MCCDForm({ 
  deathNotificationId,
  deceasedName,
  dateOfDeath,
  onComplete, 
  onCancel 
}: MCCDFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.certifyingPhysicianName || !formData.certifyingPhysicianQualification || 
        !formData.immediateCause || !formData.underlyingCause || !formData.underlyingCauseIcd) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('mccd_records')
        .insert([{
          death_notification_id: deathNotificationId,
          certifier_name: formData.certifyingPhysicianName,
          certifier_qualification: formData.certifyingPhysicianQualification,
          certifier_registration_number: formData.certifyingPhysicianRegistration || null,
          certification_date: formData.certificationDate,
          immediate_cause: formData.immediateCause,
          immediate_cause_icd: formData.immediateCauseIcd || null,
          immediate_cause_duration: formData.immediateCauseDuration || null,
          antecedent_cause_a: formData.antecedentCauseA || null,
          antecedent_cause_a_icd: formData.antecedentCauseAIcd || null,
          antecedent_cause_a_duration: formData.antecedentCauseADuration || null,
          antecedent_cause_b: formData.antecedentCauseB || null,
          antecedent_cause_b_icd: formData.antecedentCauseBIcd || null,
          antecedent_cause_b_duration: formData.antecedentCauseBDuration || null,
          underlying_cause: formData.underlyingCause,
          underlying_cause_icd: formData.underlyingCauseIcd,
          contributing_conditions: formData.contributingConditions || null,
          autopsy_performed: formData.autopsyPerformed,
          autopsy_findings_available: formData.autopsyFindingsAvailable,
          pregnancy_contributed: formData.wasPregnant,
          pregnancy_status: formData.pregnancyContribution || null,
          manner_of_death: formData.mannerOfDeath,
        }] as any);

      if (error) throw error;
      
      // Update death notification to link MCCD
      await supabase
        .from('death_notifications')
        .update({ cod_method: 'mccd' })
        .eq('id', deathNotificationId);
      
      toast.success("MCCD completed and signed");
      onComplete?.();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error("Failed to submit MCCD");
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveDraft = async () => {
    setIsSavingDraft(true);
    try {
      const { error } = await supabase
        .from('mccd_records')
        .insert([{
          death_notification_id: deathNotificationId,
          certifier_name: formData.certifyingPhysicianName || 'Draft',
          certifier_qualification: formData.certifyingPhysicianQualification || 'Draft',
          certification_date: formData.certificationDate,
          immediate_cause: formData.immediateCause || 'Pending',
          underlying_cause: formData.underlyingCause || 'Pending',
          underlying_cause_icd: formData.underlyingCauseIcd || 'PENDING',
          manner_of_death: formData.mannerOfDeath,
        }] as any);

      if (error) throw error;
      toast.success("Draft saved");
    } catch (error) {
      console.error('Save draft error:', error);
      toast.error("Failed to save draft");
    } finally {
      setIsSavingDraft(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Medical Certificate of Cause of Death
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            WHO International Form (ICD-11 Coding)
          </p>
        </div>
        {deceasedName && (
          <Badge variant="outline" className="text-sm">
            {deceasedName} {dateOfDeath && `• ${dateOfDeath}`}
          </Badge>
        )}
      </div>

      {/* Certifying Physician */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Stethoscope className="w-4 h-4" />
            Certifying Physician
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="certifyingPhysicianName">Name *</Label>
              <Input
                id="certifyingPhysicianName"
                value={formData.certifyingPhysicianName}
                onChange={(e) => updateField("certifyingPhysicianName", e.target.value)}
                placeholder="Dr. Full Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="certifyingPhysicianQualification">Qualification *</Label>
              <Input
                id="certifyingPhysicianQualification"
                value={formData.certifyingPhysicianQualification}
                onChange={(e) => updateField("certifyingPhysicianQualification", e.target.value)}
                placeholder="e.g., MBChB, MD"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="certifyingPhysicianRegistration">Registration #</Label>
              <Input
                id="certifyingPhysicianRegistration"
                value={formData.certifyingPhysicianRegistration}
                onChange={(e) => updateField("certifyingPhysicianRegistration", e.target.value)}
                placeholder="Medical Council #"
              />
            </div>
          </div>
          <div className="w-48">
            <Label htmlFor="certificationDate">Certification Date *</Label>
            <Input
              id="certificationDate"
              type="date"
              value={formData.certificationDate}
              onChange={(e) => updateField("certificationDate", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Part I - Cause of Death Chain */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Part I - Disease or Condition Leading to Death</CardTitle>
          <CardDescription>
            Report the chain of events leading directly to death. Start with the immediate cause.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Immediate Cause */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Badge>a</Badge>
              <span className="font-medium">Immediate Cause *</span>
              <span className="text-sm text-muted-foreground">(Disease or condition directly leading to death)</span>
            </div>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-2 space-y-2">
                <Label>ICD Code</Label>
                <Input
                  value={formData.immediateCauseIcd}
                  onChange={(e) => updateField("immediateCauseIcd", e.target.value)}
                  placeholder="ICD-11"
                />
              </div>
              <div className="col-span-8 space-y-2">
                <Label>Description *</Label>
                <Input
                  value={formData.immediateCause}
                  onChange={(e) => updateField("immediateCause", e.target.value)}
                  placeholder="e.g., Acute respiratory failure"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Duration</Label>
                <Input
                  value={formData.immediateCauseDuration}
                  onChange={(e) => updateField("immediateCauseDuration", e.target.value)}
                  placeholder="e.g., 2 days"
                />
              </div>
            </div>
          </div>

          {/* Antecedent Cause A */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary">b</Badge>
              <span className="font-medium">Antecedent Cause</span>
              <span className="text-sm text-muted-foreground">(Due to or as a consequence of)</span>
            </div>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-2 space-y-2">
                <Input
                  value={formData.antecedentCauseAIcd}
                  onChange={(e) => updateField("antecedentCauseAIcd", e.target.value)}
                  placeholder="ICD-11"
                />
              </div>
              <div className="col-span-8 space-y-2">
                <Input
                  value={formData.antecedentCauseA}
                  onChange={(e) => updateField("antecedentCauseA", e.target.value)}
                  placeholder="e.g., Pneumonia"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Input
                  value={formData.antecedentCauseADuration}
                  onChange={(e) => updateField("antecedentCauseADuration", e.target.value)}
                  placeholder="e.g., 5 days"
                />
              </div>
            </div>
          </div>

          {/* Antecedent Cause B */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary">c</Badge>
              <span className="font-medium">Antecedent Cause</span>
              <span className="text-sm text-muted-foreground">(Due to or as a consequence of)</span>
            </div>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-2 space-y-2">
                <Input
                  value={formData.antecedentCauseBIcd}
                  onChange={(e) => updateField("antecedentCauseBIcd", e.target.value)}
                  placeholder="ICD-11"
                />
              </div>
              <div className="col-span-8 space-y-2">
                <Input
                  value={formData.antecedentCauseB}
                  onChange={(e) => updateField("antecedentCauseB", e.target.value)}
                  placeholder="e.g., HIV/AIDS"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Input
                  value={formData.antecedentCauseBDuration}
                  onChange={(e) => updateField("antecedentCauseBDuration", e.target.value)}
                  placeholder="e.g., 3 years"
                />
              </div>
            </div>
          </div>

          {/* Underlying Cause */}
          <div className="p-4 border-2 border-primary/30 rounded-lg bg-primary/5">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="default">d</Badge>
              <span className="font-medium">Underlying Cause *</span>
              <span className="text-sm text-muted-foreground">(The disease that initiated the train of events)</span>
            </div>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-2 space-y-2">
                <Input
                  value={formData.underlyingCauseIcd}
                  onChange={(e) => updateField("underlyingCauseIcd", e.target.value)}
                  placeholder="ICD-11 *"
                />
              </div>
              <div className="col-span-8 space-y-2">
                <Input
                  value={formData.underlyingCause}
                  onChange={(e) => updateField("underlyingCause", e.target.value)}
                  placeholder="e.g., HIV disease resulting in opportunistic infections"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Input
                  value={formData.underlyingCauseDuration}
                  onChange={(e) => updateField("underlyingCauseDuration", e.target.value)}
                  placeholder="e.g., 5 years"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Part II - Contributing Conditions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Part II - Other Significant Conditions</CardTitle>
          <CardDescription>
            Conditions contributing to death but not part of the main causal sequence
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.contributingConditions}
            onChange={(e) => updateField("contributingConditions", e.target.value)}
            placeholder="e.g., Diabetes mellitus type 2, Hypertension"
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Manner of Death */}
          <div className="space-y-2">
            <Label>Manner of Death *</Label>
            <Select
              value={formData.mannerOfDeath}
              onValueChange={(v) => updateField("mannerOfDeath", v as typeof formData.mannerOfDeath)}
            >
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="natural">Natural</SelectItem>
                <SelectItem value="accident">Accident</SelectItem>
                <SelectItem value="suicide">Suicide</SelectItem>
                <SelectItem value="homicide">Homicide</SelectItem>
                <SelectItem value="pending">Pending Investigation</SelectItem>
                <SelectItem value="undetermined">Undetermined</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Autopsy */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="autopsyPerformed"
                checked={formData.autopsyPerformed}
                onCheckedChange={(checked) => updateField("autopsyPerformed", !!checked)}
              />
              <Label htmlFor="autopsyPerformed">Was autopsy performed?</Label>
            </div>
            {formData.autopsyPerformed && (
              <div className="ml-6 flex items-center gap-2">
                <Checkbox
                  id="autopsyFindingsAvailable"
                  checked={formData.autopsyFindingsAvailable}
                  onCheckedChange={(checked) => updateField("autopsyFindingsAvailable", !!checked)}
                />
                <Label htmlFor="autopsyFindingsAvailable">Were findings used in determining cause?</Label>
              </div>
            )}
          </div>

          {/* Pregnancy */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="wasPregnant"
                checked={formData.wasPregnant}
                onCheckedChange={(checked) => updateField("wasPregnant", !!checked)}
              />
              <Label htmlFor="wasPregnant">Was the deceased pregnant or recently pregnant?</Label>
            </div>
            {formData.wasPregnant && (
              <div className="ml-6">
                <Label>Did pregnancy contribute to death?</Label>
                <Select
                  value={formData.pregnancyContribution}
                  onValueChange={(v) => updateField("pregnancyContribution", v)}
                >
                  <SelectTrigger className="w-64 mt-1">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_pregnant">Not pregnant in past year</SelectItem>
                    <SelectItem value="pregnant_not_contributing">Pregnant at death, did not contribute</SelectItem>
                    <SelectItem value="pregnant_contributing">Pregnant at death, contributed to death</SelectItem>
                    <SelectItem value="postpartum_not_contributing">Within 42 days postpartum, did not contribute</SelectItem>
                    <SelectItem value="postpartum_contributing">Within 42 days postpartum, contributed to death</SelectItem>
                    <SelectItem value="late_maternal">Within 1 year postpartum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={saveDraft} disabled={isSavingDraft}>
            <Save className="w-4 h-4 mr-2" />
            {isSavingDraft ? "Saving..." : "Save Draft"}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            <Send className="w-4 h-4 mr-2" />
            {isSubmitting ? "Signing..." : "Sign & Submit"}
          </Button>
        </div>
      </div>
    </div>
  );
}
