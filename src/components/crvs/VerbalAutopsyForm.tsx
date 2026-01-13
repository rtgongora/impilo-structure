import { useState } from "react";
import { 
  FileText, User, Calendar, Save, Send, ClipboardList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VerbalAutopsyFormProps {
  deathNotificationId: string;
  deceasedName?: string;
  dateOfDeath?: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

interface FormData {
  interviewDate: string;
  interviewerName: string;
  respondentName: string;
  respondentRelationship: string;
  vaMethod: 'who_2022' | 'phmrc' | 'interva5' | 'custom';
  
  // Symptoms summary (simplified for demo)
  symptomsSummary: string;
  finalCauseOfDeath: string;
  algorithmResult: string;
  physicianCodedCause: string;
}

const initialFormData: FormData = {
  interviewDate: new Date().toISOString().split('T')[0],
  interviewerName: "",
  respondentName: "",
  respondentRelationship: "",
  vaMethod: "who_2022",
  symptomsSummary: "",
  finalCauseOfDeath: "",
  algorithmResult: "",
  physicianCodedCause: "",
};

export function VerbalAutopsyForm({ 
  deathNotificationId,
  deceasedName,
  dateOfDeath,
  onComplete, 
  onCancel 
}: VerbalAutopsyFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.interviewerName || !formData.respondentName || !formData.respondentRelationship) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('verbal_autopsy_records')
        .insert([{
          death_notification_id: deathNotificationId,
          interview_date: formData.interviewDate,
          interviewer_name: formData.interviewerName,
          respondent_name: formData.respondentName,
          respondent_relationship: formData.respondentRelationship,
          va_method: formData.vaMethod,
          symptoms_data: { summary: formData.symptomsSummary },
          final_cause_of_death: formData.finalCauseOfDeath || null,
          algorithm_result: formData.algorithmResult ? { result: formData.algorithmResult } : null,
          physician_coded_cause: formData.physicianCodedCause || null,
          status: 'finalized',
        }] as any);

      if (error) throw error;
      
      // Update death notification to link VA
      await supabase
        .from('death_notifications')
        .update({ cod_method: 'verbal_autopsy' })
        .eq('id', deathNotificationId);
      
      toast.success("Verbal Autopsy completed");
      onComplete?.();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error("Failed to submit Verbal Autopsy");
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveDraft = async () => {
    setIsSavingDraft(true);
    try {
      const { error } = await supabase
        .from('verbal_autopsy_records')
        .insert([{
          death_notification_id: deathNotificationId,
          interview_date: formData.interviewDate,
          interviewer_name: formData.interviewerName || 'Draft',
          respondent_name: formData.respondentName || 'Draft',
          respondent_relationship: formData.respondentRelationship || 'Unknown',
          va_method: formData.vaMethod,
          symptoms_data: { summary: formData.symptomsSummary },
          status: 'pending_interview',
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
            <ClipboardList className="w-5 h-5" />
            Verbal Autopsy Interview
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            For deaths occurring outside medical facilities
          </p>
        </div>
        {deceasedName && (
          <Badge variant="outline" className="text-sm">
            {deceasedName} {dateOfDeath && `• ${dateOfDeath}`}
          </Badge>
        )}
      </div>

      {/* Interview Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Interview Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interviewDate">Interview Date *</Label>
              <Input
                id="interviewDate"
                type="date"
                value={formData.interviewDate}
                onChange={(e) => updateField("interviewDate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vaMethod">VA Method *</Label>
              <Select 
                value={formData.vaMethod} 
                onValueChange={(v) => updateField("vaMethod", v as typeof formData.vaMethod)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="who_2022">WHO 2022 VA Instrument</SelectItem>
                  <SelectItem value="phmrc">PHMRC Short Form</SelectItem>
                  <SelectItem value="interva5">InterVA-5</SelectItem>
                  <SelectItem value="custom">Custom Instrument</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="interviewerName">Interviewer Name *</Label>
            <Input
              id="interviewerName"
              value={formData.interviewerName}
              onChange={(e) => updateField("interviewerName", e.target.value)}
              placeholder="Name of person conducting interview"
            />
          </div>
        </CardContent>
      </Card>

      {/* Respondent Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="w-4 h-4" />
            Respondent Information
          </CardTitle>
          <CardDescription>
            The person providing information about the deceased
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="respondentName">Respondent Name *</Label>
              <Input
                id="respondentName"
                value={formData.respondentName}
                onChange={(e) => updateField("respondentName", e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="respondentRelationship">Relationship to Deceased *</Label>
              <Select 
                value={formData.respondentRelationship} 
                onValueChange={(v) => updateField("respondentRelationship", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spouse">Spouse</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="child">Child</SelectItem>
                  <SelectItem value="sibling">Sibling</SelectItem>
                  <SelectItem value="other_relative">Other Relative</SelectItem>
                  <SelectItem value="neighbor">Neighbor</SelectItem>
                  <SelectItem value="friend">Friend</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Symptoms Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Symptoms and Circumstances
          </CardTitle>
          <CardDescription>
            Summary of symptoms and events leading to death
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.symptomsSummary}
            onChange={(e) => updateField("symptomsSummary", e.target.value)}
            placeholder="Describe the symptoms, duration of illness, and circumstances leading to death..."
            rows={6}
          />
        </CardContent>
      </Card>

      {/* Cause Determination */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Cause of Death Determination</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="algorithmResult">Algorithm Result</Label>
            <Input
              id="algorithmResult"
              value={formData.algorithmResult}
              onChange={(e) => updateField("algorithmResult", e.target.value)}
              placeholder="e.g., InterVA-5 result"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="physicianCodedCause">Physician Coded Cause</Label>
            <Input
              id="physicianCodedCause"
              value={formData.physicianCodedCause}
              onChange={(e) => updateField("physicianCodedCause", e.target.value)}
              placeholder="ICD-11 code if reviewed by physician"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="finalCauseOfDeath">Final Cause of Death</Label>
            <Textarea
              id="finalCauseOfDeath"
              value={formData.finalCauseOfDeath}
              onChange={(e) => updateField("finalCauseOfDeath", e.target.value)}
              placeholder="Final determination of cause of death"
              rows={2}
            />
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
            {isSubmitting ? "Submitting..." : "Complete Interview"}
          </Button>
        </div>
      </div>
    </div>
  );
}
