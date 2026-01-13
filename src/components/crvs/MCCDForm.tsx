import { useState } from "react";
import { motion } from "framer-motion";
import { 
  FileText, User, Calendar, ChevronRight, ChevronLeft, Check, 
  Save, Send, AlertTriangle, Stethoscope, Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
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
  immediateCauseCode: string;
  immediateCauseDescription: string;
  immediateCauseDuration: string;
  
  antecedent1Code: string;
  antecedent1Description: string;
  antecedent1Duration: string;
  
  antecedent2Code: string;
  antecedent2Description: string;
  antecedent2Duration: string;
  
  underlyingCauseCode: string;
  underlyingCauseDescription: string;
  underlyingCauseDuration: string;
  
  // Part II - Contributing conditions
  contributingConditions: string;
  
  // Additional info
  wasSurgeryPerformed: boolean;
  surgeryDate: string;
  surgeryProcedure: string;
  
  wasAutopsyPerformed: boolean;
  autopsyFindingsAvailable: boolean;
  
  // For maternal deaths
  wasPregnant: boolean;
  pregnancyContribution: string;
  weeksPregnant: string;
  
  // For infant deaths
  wasMultiplePregnancy: boolean;
  stillborn: boolean;
  birthWeightGrams: string;
  gestationalAge: string;
  
  // Additional notes
  additionalNotes: string;
}

const initialFormData: FormData = {
  certifyingPhysicianName: "",
  certifyingPhysicianQualification: "",
  certifyingPhysicianRegistration: "",
  certificationDate: new Date().toISOString().split('T')[0],
  
  immediateCauseCode: "",
  immediateCauseDescription: "",
  immediateCauseDuration: "",
  
  antecedent1Code: "",
  antecedent1Description: "",
  antecedent1Duration: "",
  
  antecedent2Code: "",
  antecedent2Description: "",
  antecedent2Duration: "",
  
  underlyingCauseCode: "",
  underlyingCauseDescription: "",
  underlyingCauseDuration: "",
  
  contributingConditions: "",
  
  wasSurgeryPerformed: false,
  surgeryDate: "",
  surgeryProcedure: "",
  
  wasAutopsyPerformed: false,
  autopsyFindingsAvailable: false,
  
  wasPregnant: false,
  pregnancyContribution: "",
  weeksPregnant: "",
  
  wasMultiplePregnancy: false,
  stillborn: false,
  birthWeightGrams: "",
  gestationalAge: "",
  
  additionalNotes: "",
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
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('mccd_records')
        .insert({
          death_notification_id: deathNotificationId,
          certifying_physician_name: formData.certifyingPhysicianName,
          certifying_physician_qualification: formData.certifyingPhysicianQualification || null,
          certifying_physician_registration: formData.certifyingPhysicianRegistration || null,
          certification_date: formData.certificationDate,
          immediate_cause_code: formData.immediateCauseCode || null,
          immediate_cause_description: formData.immediateCauseDescription || null,
          immediate_cause_duration: formData.immediateCauseDuration || null,
          antecedent_cause_1_code: formData.antecedent1Code || null,
          antecedent_cause_1_description: formData.antecedent1Description || null,
          antecedent_cause_1_duration: formData.antecedent1Duration || null,
          antecedent_cause_2_code: formData.antecedent2Code || null,
          antecedent_cause_2_description: formData.antecedent2Description || null,
          antecedent_cause_2_duration: formData.antecedent2Duration || null,
          underlying_cause_code: formData.underlyingCauseCode || null,
          underlying_cause_description: formData.underlyingCauseDescription || null,
          underlying_cause_duration: formData.underlyingCauseDuration || null,
          contributing_conditions: formData.contributingConditions || null,
          was_surgery_performed: formData.wasSurgeryPerformed,
          surgery_date: formData.surgeryDate || null,
          surgery_procedure: formData.surgeryProcedure || null,
          was_autopsy_performed: formData.wasAutopsyPerformed,
          autopsy_findings_available: formData.autopsyFindingsAvailable,
          was_pregnant: formData.wasPregnant,
          pregnancy_contribution: formData.pregnancyContribution || null,
          weeks_pregnant: formData.weeksPregnant ? parseInt(formData.weeksPregnant) : null,
          was_multiple_pregnancy: formData.wasMultiplePregnancy,
          stillborn: formData.stillborn,
          birth_weight_grams: formData.birthWeightGrams ? parseInt(formData.birthWeightGrams) : null,
          gestational_age_weeks: formData.gestationalAge ? parseInt(formData.gestationalAge) : null,
          status: 'signed',
        });

      if (error) throw error;
      
      // Update death notification to link MCCD
      await supabase
        .from('death_notifications')
        .update({ cause_of_death_type: 'mccd' })
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
        .insert({
          death_notification_id: deathNotificationId,
          certifying_physician_name: formData.certifyingPhysicianName || 'Draft',
          certification_date: formData.certificationDate,
          status: 'draft',
        });

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
              <Label htmlFor="certifyingPhysicianQualification">Qualification</Label>
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
              <span className="font-medium">Immediate Cause</span>
              <span className="text-sm text-muted-foreground">(Disease or condition directly leading to death)</span>
            </div>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="immediateCauseCode">ICD Code</Label>
                <Input
                  id="immediateCauseCode"
                  value={formData.immediateCauseCode}
                  onChange={(e) => updateField("immediateCauseCode", e.target.value)}
                  placeholder="ICD-11"
                />
              </div>
              <div className="col-span-8 space-y-2">
                <Label htmlFor="immediateCauseDescription">Description *</Label>
                <Input
                  id="immediateCauseDescription"
                  value={formData.immediateCauseDescription}
                  onChange={(e) => updateField("immediateCauseDescription", e.target.value)}
                  placeholder="e.g., Acute respiratory failure"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="immediateCauseDuration">Duration</Label>
                <Input
                  id="immediateCauseDuration"
                  value={formData.immediateCauseDuration}
                  onChange={(e) => updateField("immediateCauseDuration", e.target.value)}
                  placeholder="e.g., 2 days"
                />
              </div>
            </div>
          </div>

          {/* Antecedent Cause 1 */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary">b</Badge>
              <span className="font-medium">Antecedent Cause</span>
              <span className="text-sm text-muted-foreground">(Due to or as a consequence of)</span>
            </div>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-2 space-y-2">
                <Input
                  value={formData.antecedent1Code}
                  onChange={(e) => updateField("antecedent1Code", e.target.value)}
                  placeholder="ICD-11"
                />
              </div>
              <div className="col-span-8 space-y-2">
                <Input
                  value={formData.antecedent1Description}
                  onChange={(e) => updateField("antecedent1Description", e.target.value)}
                  placeholder="e.g., Pneumonia"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Input
                  value={formData.antecedent1Duration}
                  onChange={(e) => updateField("antecedent1Duration", e.target.value)}
                  placeholder="e.g., 5 days"
                />
              </div>
            </div>
          </div>

          {/* Antecedent Cause 2 */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary">c</Badge>
              <span className="font-medium">Antecedent Cause</span>
              <span className="text-sm text-muted-foreground">(Due to or as a consequence of)</span>
            </div>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-2 space-y-2">
                <Input
                  value={formData.antecedent2Code}
                  onChange={(e) => updateField("antecedent2Code", e.target.value)}
                  placeholder="ICD-11"
                />
              </div>
              <div className="col-span-8 space-y-2">
                <Input
                  value={formData.antecedent2Description}
                  onChange={(e) => updateField("antecedent2Description", e.target.value)}
                  placeholder="e.g., HIV/AIDS"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Input
                  value={formData.antecedent2Duration}
                  onChange={(e) => updateField("antecedent2Duration", e.target.value)}
                  placeholder="e.g., 3 years"
                />
              </div>
            </div>
          </div>

          {/* Underlying Cause */}
          <div className="p-4 border-2 border-primary/30 rounded-lg bg-primary/5">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="default">d</Badge>
              <span className="font-medium">Underlying Cause</span>
              <span className="text-sm text-muted-foreground">(The disease that initiated the train of events)</span>
            </div>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-2 space-y-2">
                <Input
                  value={formData.underlyingCauseCode}
                  onChange={(e) => updateField("underlyingCauseCode", e.target.value)}
                  placeholder="ICD-11"
                />
              </div>
              <div className="col-span-8 space-y-2">
                <Input
                  value={formData.underlyingCauseDescription}
                  onChange={(e) => updateField("underlyingCauseDescription", e.target.value)}
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
          {/* Surgery */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="wasSurgeryPerformed"
                checked={formData.wasSurgeryPerformed}
                onCheckedChange={(checked) => updateField("wasSurgeryPerformed", !!checked)}
              />
              <Label htmlFor="wasSurgeryPerformed">Was surgery performed within 4 weeks of death?</Label>
            </div>
            {formData.wasSurgeryPerformed && (
              <div className="grid grid-cols-2 gap-4 ml-6">
                <div className="space-y-2">
                  <Label htmlFor="surgeryDate">Surgery Date</Label>
                  <Input
                    id="surgeryDate"
                    type="date"
                    value={formData.surgeryDate}
                    onChange={(e) => updateField("surgeryDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="surgeryProcedure">Procedure</Label>
                  <Input
                    id="surgeryProcedure"
                    value={formData.surgeryProcedure}
                    onChange={(e) => updateField("surgeryProcedure", e.target.value)}
                    placeholder="Type of surgery"
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Autopsy */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="wasAutopsyPerformed"
                checked={formData.wasAutopsyPerformed}
                onCheckedChange={(checked) => updateField("wasAutopsyPerformed", !!checked)}
              />
              <Label htmlFor="wasAutopsyPerformed">Was an autopsy performed?</Label>
            </div>
            {formData.wasAutopsyPerformed && (
              <div className="ml-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="autopsyFindingsAvailable"
                    checked={formData.autopsyFindingsAvailable}
                    onCheckedChange={(checked) => updateField("autopsyFindingsAvailable", !!checked)}
                  />
                  <Label htmlFor="autopsyFindingsAvailable">Were findings used to determine cause of death?</Label>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Maternal Death */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="wasPregnant"
                checked={formData.wasPregnant}
                onCheckedChange={(checked) => updateField("wasPregnant", !!checked)}
              />
              <Label htmlFor="wasPregnant">For females: Was the deceased pregnant or recently pregnant?</Label>
            </div>
            {formData.wasPregnant && (
              <div className="grid grid-cols-2 gap-4 ml-6">
                <div className="space-y-2">
                  <Label htmlFor="weeksPregnant">Weeks Pregnant</Label>
                  <Input
                    id="weeksPregnant"
                    type="number"
                    value={formData.weeksPregnant}
                    onChange={(e) => updateField("weeksPregnant", e.target.value)}
                    placeholder="Weeks"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pregnancyContribution">Pregnancy Contribution</Label>
                  <Select 
                    value={formData.pregnancyContribution} 
                    onValueChange={(v) => updateField("pregnancyContribution", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="during_pregnancy">Death during pregnancy</SelectItem>
                      <SelectItem value="during_delivery">Death during delivery</SelectItem>
                      <SelectItem value="within_42_days">Within 42 days of termination</SelectItem>
                      <SelectItem value="within_1_year">43 days to 1 year after termination</SelectItem>
                      <SelectItem value="not_related">Pregnancy not related to death</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Infant Death */}
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="stillborn"
                  checked={formData.stillborn}
                  onCheckedChange={(checked) => updateField("stillborn", !!checked)}
                />
                <Label htmlFor="stillborn">Stillborn</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="wasMultiplePregnancy"
                  checked={formData.wasMultiplePregnancy}
                  onCheckedChange={(checked) => updateField("wasMultiplePregnancy", !!checked)}
                />
                <Label htmlFor="wasMultiplePregnancy">Multiple pregnancy</Label>
              </div>
            </div>
            {(formData.stillborn || formData.wasMultiplePregnancy) && (
              <div className="grid grid-cols-2 gap-4 ml-6">
                <div className="space-y-2">
                  <Label htmlFor="birthWeightGrams">Birth Weight (grams)</Label>
                  <Input
                    id="birthWeightGrams"
                    type="number"
                    value={formData.birthWeightGrams}
                    onChange={(e) => updateField("birthWeightGrams", e.target.value)}
                    placeholder="Grams"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gestationalAge">Gestational Age (weeks)</Label>
                  <Input
                    id="gestationalAge"
                    type="number"
                    value={formData.gestationalAge}
                    onChange={(e) => updateField("gestationalAge", e.target.value)}
                    placeholder="Weeks"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            variant="outline"
            onClick={saveDraft}
            disabled={isSavingDraft}
          >
            {isSavingDraft ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Save className="w-4 h-4 mr-2" />
                </motion.div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </>
            )}
          </Button>
        </div>
        
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Send className="w-4 h-4 mr-2" />
              </motion.div>
              Signing...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Sign & Submit MCCD
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
