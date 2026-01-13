import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, MapPin, FileText, ChevronRight, ChevronLeft, Check, 
  Calendar, Building2, Clock, AlertTriangle, Save, Send, Heart, Skull
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  ZIMBABWE_PROVINCES, MANNER_OF_DEATH, PLACE_OF_DEATH,
  type DeathNotification, type NotifierRole, type CauseOfDeathType 
} from "./types";

interface Step {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: Step[] = [
  { id: "deceased", title: "Deceased", description: "Person's details", icon: User },
  { id: "death-info", title: "Death Info", description: "Date, time, manner", icon: Skull },
  { id: "death-place", title: "Location", description: "Place of death", icon: MapPin },
  { id: "cause", title: "Cause", description: "Cause of death", icon: Heart },
  { id: "informant", title: "Informant", description: "Who is reporting", icon: FileText },
  { id: "review", title: "Review", description: "Confirm details", icon: Check },
];

interface DeathNotificationFormProps {
  encounterId?: string;
  patientId?: string;
  facilityId?: string;
  onComplete?: (notification: DeathNotification) => void;
  onCancel?: () => void;
}

interface FormData {
  // Deceased
  deceasedGivenNames: string;
  deceasedFamilyName: string;
  deceasedSex: string;
  deceasedDateOfBirth: string;
  deceasedNationalId: string;
  deceasedPassport: string;
  deceasedAgeAtDeath: string;
  deceasedOccupation: string;
  deceasedMaritalStatus: string;
  deceasedResidenceProvince: string;
  deceasedResidenceDistrict: string;
  deceasedResidenceWard: string;
  deceasedResidenceVillage: string;
  
  // Death info
  dateOfDeath: string;
  timeOfDeath: string;
  isDateEstimated: boolean;
  mannerOfDeath: string;
  
  // Death place
  placeOfDeath: string;
  deathAtFacility: boolean;
  facilityWard: string;
  communityProvince: string;
  communityDistrict: string;
  communityWard: string;
  communityVillage: string;
  
  // Cause
  causeOfDeathType: CauseOfDeathType;
  primaryCauseOfDeath: string;
  secondaryCauses: string;
  requiresMCCD: boolean;
  requiresVerbalAutopsy: boolean;
  
  // Burial
  disposalMethod: string;
  burialPermitIssued: boolean;
  burialPermitNumber: string;
  
  // Informant
  informantName: string;
  informantRelationship: string;
  informantContact: string;
  informantAddress: string;
  notifierRole: NotifierRole;
}

const initialFormData: FormData = {
  // Deceased
  deceasedGivenNames: "",
  deceasedFamilyName: "",
  deceasedSex: "",
  deceasedDateOfBirth: "",
  deceasedNationalId: "",
  deceasedPassport: "",
  deceasedAgeAtDeath: "",
  deceasedOccupation: "",
  deceasedMaritalStatus: "",
  deceasedResidenceProvince: "",
  deceasedResidenceDistrict: "",
  deceasedResidenceWard: "",
  deceasedResidenceVillage: "",
  
  // Death info
  dateOfDeath: "",
  timeOfDeath: "",
  isDateEstimated: false,
  mannerOfDeath: "natural",
  
  // Death place
  placeOfDeath: "hospital",
  deathAtFacility: true,
  facilityWard: "",
  communityProvince: "",
  communityDistrict: "",
  communityWard: "",
  communityVillage: "",
  
  // Cause
  causeOfDeathType: "mccd",
  primaryCauseOfDeath: "",
  secondaryCauses: "",
  requiresMCCD: true,
  requiresVerbalAutopsy: false,
  
  // Burial
  disposalMethod: "burial",
  burialPermitIssued: false,
  burialPermitNumber: "",
  
  // Informant
  informantName: "",
  informantRelationship: "",
  informantContact: "",
  informantAddress: "",
  notifierRole: "health_worker",
};

export function DeathNotificationForm({ 
  encounterId, 
  patientId, 
  facilityId,
  onComplete, 
  onCancel 
}: DeathNotificationFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('death_notifications')
        .insert([{
          status: 'submitted',
          source: 'facility',
          deceased_given_names: formData.deceasedGivenNames,
          deceased_family_name: formData.deceasedFamilyName,
          deceased_sex: formData.deceasedSex,
          deceased_date_of_birth: formData.deceasedDateOfBirth || null,
          deceased_national_id: formData.deceasedNationalId || null,
          deceased_passport: formData.deceasedPassport || null,
          deceased_age_years: formData.deceasedAgeAtDeath ? parseInt(formData.deceasedAgeAtDeath) : null,
          deceased_occupation: formData.deceasedOccupation || null,
          deceased_marital_status: formData.deceasedMaritalStatus || null,
          residence_province: formData.deceasedResidenceProvince || null,
          residence_district: formData.deceasedResidenceDistrict || null,
          date_of_death: formData.dateOfDeath,
          time_of_death: formData.timeOfDeath || null,
          is_date_estimated: formData.isDateEstimated,
          manner_of_death: formData.mannerOfDeath as 'natural' | 'accident' | 'suicide' | 'homicide' | 'pending' | 'undetermined',
          facility_id: facilityId || null,
          community_province: formData.communityProvince || null,
          community_district: formData.communityDistrict || null,
          community_ward: formData.communityWard || null,
          community_village: formData.communityVillage || null,
          informant_name: formData.informantName || 'Unknown',
          informant_relationship: formData.informantRelationship || 'Unknown',
          informant_contact: formData.informantContact || null,
          notifier_name: formData.informantName || 'Unknown',
          notifier_role: formData.notifierRole,
          encounter_id: encounterId || null,
          death_occurred_at: `${formData.dateOfDeath}T${formData.timeOfDeath || '00:00'}:00`,
          submitted_at: new Date().toISOString(),
        }] as any)
        .select()
        .single();

      if (error) throw error;
      
      toast.success("Death notification submitted", {
        description: `Notification #${data.notification_number} created`
      });
      
      onComplete?.(data as unknown as DeathNotification);
    } catch (error) {
      console.error('Submit error:', error);
      toast.error("Failed to submit notification");
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveDraft = async () => {
    setIsSavingDraft(true);
    try {
      const { error } = await supabase
        .from('death_notifications')
        .insert([{
          source: 'facility',
          deceased_given_names: formData.deceasedGivenNames || 'Unknown',
          deceased_family_name: formData.deceasedFamilyName || 'Unknown',
          deceased_sex: formData.deceasedSex || 'unknown',
          date_of_death: formData.dateOfDeath || new Date().toISOString().split('T')[0],
          death_occurred_at: formData.dateOfDeath 
            ? `${formData.dateOfDeath}T${formData.timeOfDeath || '00:00'}:00`
            : new Date().toISOString(),
          informant_name: formData.informantName || 'Draft User',
          informant_relationship: formData.informantRelationship || 'Unknown',
          notifier_name: formData.informantName || 'Draft User',
          notifier_role: formData.notifierRole,
          facility_id: facilityId || null,
        }] as any);

      if (error) throw error;
      toast.success("Draft saved successfully");
    } catch (error) {
      console.error('Save draft error:', error);
      toast.error("Failed to save draft");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const renderStepContent = () => {
    const step = STEPS[currentStep];

    switch (step.id) {
      case "deceased":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deceasedGivenNames">Given Name(s) *</Label>
                <Input
                  id="deceasedGivenNames"
                  value={formData.deceasedGivenNames}
                  onChange={(e) => updateField("deceasedGivenNames", e.target.value)}
                  placeholder="Deceased's given names"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deceasedFamilyName">Family Name *</Label>
                <Input
                  id="deceasedFamilyName"
                  value={formData.deceasedFamilyName}
                  onChange={(e) => updateField("deceasedFamilyName", e.target.value)}
                  placeholder="Family/surname"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sex *</Label>
              <RadioGroup
                value={formData.deceasedSex}
                onValueChange={(v) => updateField("deceasedSex", v)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female">Female</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deceasedDateOfBirth">Date of Birth</Label>
                <Input
                  id="deceasedDateOfBirth"
                  type="date"
                  value={formData.deceasedDateOfBirth}
                  onChange={(e) => updateField("deceasedDateOfBirth", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deceasedAgeAtDeath">Age at Death</Label>
                <Input
                  id="deceasedAgeAtDeath"
                  type="number"
                  value={formData.deceasedAgeAtDeath}
                  onChange={(e) => updateField("deceasedAgeAtDeath", e.target.value)}
                  placeholder="Years"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deceasedNationalId">National ID</Label>
                <Input
                  id="deceasedNationalId"
                  value={formData.deceasedNationalId}
                  onChange={(e) => updateField("deceasedNationalId", e.target.value)}
                  placeholder="e.g., 63-123456-A-44"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deceasedOccupation">Occupation</Label>
                <Input
                  id="deceasedOccupation"
                  value={formData.deceasedOccupation}
                  onChange={(e) => updateField("deceasedOccupation", e.target.value)}
                  placeholder="Occupation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deceasedMaritalStatus">Marital Status</Label>
                <Select 
                  value={formData.deceasedMaritalStatus} 
                  onValueChange={(v) => updateField("deceasedMaritalStatus", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Deceased's Residence</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deceasedResidenceProvince">Province</Label>
                  <Select 
                    value={formData.deceasedResidenceProvince} 
                    onValueChange={(v) => updateField("deceasedResidenceProvince", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      {ZIMBABWE_PROVINCES.map(province => (
                        <SelectItem key={province} value={province}>{province}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deceasedResidenceDistrict">District</Label>
                  <Input
                    id="deceasedResidenceDistrict"
                    value={formData.deceasedResidenceDistrict}
                    onChange={(e) => updateField("deceasedResidenceDistrict", e.target.value)}
                    placeholder="District"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case "death-info":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfDeath">Date of Death *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="dateOfDeath"
                    type="date"
                    value={formData.dateOfDeath}
                    onChange={(e) => updateField("dateOfDeath", e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isDateEstimated"
                    checked={formData.isDateEstimated}
                    onCheckedChange={(checked) => updateField("isDateEstimated", !!checked)}
                  />
                  <Label htmlFor="isDateEstimated" className="text-sm text-muted-foreground">
                    Date is estimated
                  </Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeOfDeath">Time of Death</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="timeOfDeath"
                    type="time"
                    value={formData.timeOfDeath}
                    onChange={(e) => updateField("timeOfDeath", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Manner of Death *</Label>
              <RadioGroup
                value={formData.mannerOfDeath}
                onValueChange={(v) => updateField("mannerOfDeath", v)}
                className="grid grid-cols-3 gap-4"
              >
                {MANNER_OF_DEATH.map(manner => (
                  <div key={manner} className="flex items-center space-x-2">
                    <RadioGroupItem value={manner} id={manner} />
                    <Label htmlFor={manner} className="capitalize">
                      {manner.replace('_', ' ')}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {(formData.mannerOfDeath === 'homicide' || 
              formData.mannerOfDeath === 'suicide' || 
              formData.mannerOfDeath === 'pending_investigation') && (
              <Card className="border-critical">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-critical">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-medium">Police Case Required</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    This death requires police involvement and a coroner/pathologist examination.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case "death-place":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Place of Death *</Label>
              <Select 
                value={formData.placeOfDeath} 
                onValueChange={(v) => {
                  updateField("placeOfDeath", v);
                  updateField("deathAtFacility", v === 'hospital' || v === 'clinic');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select place" />
                </SelectTrigger>
                <SelectContent>
                  {PLACE_OF_DEATH.map(place => (
                    <SelectItem key={place} value={place} className="capitalize">
                      {place.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.deathAtFacility ? (
              <div className="p-4 bg-muted/30 rounded-lg space-y-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  <h4 className="font-medium">Facility Details</h4>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facilityWard">Ward / Unit</Label>
                  <Input
                    id="facilityWard"
                    value={formData.facilityWard}
                    onChange={(e) => updateField("facilityWard", e.target.value)}
                    placeholder="e.g., ICU, Medical Ward"
                  />
                </div>
              </div>
            ) : (
              <div className="p-4 bg-muted/30 rounded-lg space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <h4 className="font-medium">Community Location</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="communityProvince">Province</Label>
                    <Select 
                      value={formData.communityProvince} 
                      onValueChange={(v) => updateField("communityProvince", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select province" />
                      </SelectTrigger>
                      <SelectContent>
                        {ZIMBABWE_PROVINCES.map(province => (
                          <SelectItem key={province} value={province}>{province}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="communityDistrict">District</Label>
                    <Input
                      id="communityDistrict"
                      value={formData.communityDistrict}
                      onChange={(e) => updateField("communityDistrict", e.target.value)}
                      placeholder="District"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="communityWard">Ward</Label>
                    <Input
                      id="communityWard"
                      value={formData.communityWard}
                      onChange={(e) => updateField("communityWard", e.target.value)}
                      placeholder="Ward"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="communityVillage">Village</Label>
                    <Input
                      id="communityVillage"
                      value={formData.communityVillage}
                      onChange={(e) => updateField("communityVillage", e.target.value)}
                      placeholder="Village name"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "cause":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Cause of Death Documentation *</Label>
              <RadioGroup
                value={formData.causeOfDeathType}
                onValueChange={(v) => updateField("causeOfDeathType", v as CauseOfDeathType)}
                className="grid grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="mccd" id="mccd" />
                  <Label htmlFor="mccd" className="flex-1 cursor-pointer">
                    <span className="font-medium">MCCD</span>
                    <p className="text-sm text-muted-foreground">Medical Certificate of Cause of Death</p>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="verbal_autopsy" id="verbal_autopsy" />
                  <Label htmlFor="verbal_autopsy" className="flex-1 cursor-pointer">
                    <span className="font-medium">Verbal Autopsy</span>
                    <p className="text-sm text-muted-foreground">For community deaths without physician</p>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="coroner_report" id="coroner_report" />
                  <Label htmlFor="coroner_report" className="flex-1 cursor-pointer">
                    <span className="font-medium">Coroner Report</span>
                    <p className="text-sm text-muted-foreground">Medico-legal investigation</p>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="unknown" id="unknown" />
                  <Label htmlFor="unknown" className="flex-1 cursor-pointer">
                    <span className="font-medium">Unknown</span>
                    <p className="text-sm text-muted-foreground">Cause pending investigation</p>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {formData.causeOfDeathType === 'mccd' && (
              <Card className="border-info">
                <CardContent className="p-4">
                  <p className="text-sm">
                    An MCCD form will need to be completed by the certifying physician. 
                    You can proceed with the notification and complete the MCCD separately.
                  </p>
                </CardContent>
              </Card>
            )}

            {formData.causeOfDeathType === 'verbal_autopsy' && (
              <Card className="border-warning">
                <CardContent className="p-4">
                  <p className="text-sm">
                    A verbal autopsy interview will need to be conducted with the family/informant.
                    This will be scheduled after the notification is submitted.
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <Label htmlFor="primaryCauseOfDeath">Primary Cause of Death (Provisional)</Label>
              <Input
                id="primaryCauseOfDeath"
                value={formData.primaryCauseOfDeath}
                onChange={(e) => updateField("primaryCauseOfDeath", e.target.value)}
                placeholder="Enter primary cause of death"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondaryCauses">Contributing Conditions</Label>
              <Textarea
                id="secondaryCauses"
                value={formData.secondaryCauses}
                onChange={(e) => updateField("secondaryCauses", e.target.value)}
                placeholder="Comma-separated list of contributing conditions"
              />
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Body Disposal</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="disposalMethod">Disposal Method</Label>
                  <Select 
                    value={formData.disposalMethod} 
                    onValueChange={(v) => updateField("disposalMethod", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="burial">Burial</SelectItem>
                      <SelectItem value="cremation">Cremation</SelectItem>
                      <SelectItem value="donation">Body Donation</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="burialPermitIssued"
                      checked={formData.burialPermitIssued}
                      onCheckedChange={(checked) => updateField("burialPermitIssued", !!checked)}
                    />
                    <Label htmlFor="burialPermitIssued">Burial Permit Issued</Label>
                  </div>
                  {formData.burialPermitIssued && (
                    <Input
                      id="burialPermitNumber"
                      value={formData.burialPermitNumber}
                      onChange={(e) => updateField("burialPermitNumber", e.target.value)}
                      placeholder="Permit number"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case "informant":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="informantName">Informant Name *</Label>
                <Input
                  id="informantName"
                  value={formData.informantName}
                  onChange={(e) => updateField("informantName", e.target.value)}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="informantRelationship">Relationship to Deceased</Label>
                <Select 
                  value={formData.informantRelationship} 
                  onValueChange={(v) => updateField("informantRelationship", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spouse">Spouse</SelectItem>
                    <SelectItem value="child">Child</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="sibling">Sibling</SelectItem>
                    <SelectItem value="other_relative">Other Relative</SelectItem>
                    <SelectItem value="friend">Friend</SelectItem>
                    <SelectItem value="employer">Employer</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="informantContact">Contact Number</Label>
                <Input
                  id="informantContact"
                  value={formData.informantContact}
                  onChange={(e) => updateField("informantContact", e.target.value)}
                  placeholder="Phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notifierRole">Notifier Role</Label>
                <Select 
                  value={formData.notifierRole} 
                  onValueChange={(v) => updateField("notifierRole", v as NotifierRole)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="health_worker">Health Worker</SelectItem>
                    <SelectItem value="community_health_worker">Community Health Worker</SelectItem>
                    <SelectItem value="family_member">Family Member</SelectItem>
                    <SelectItem value="police">Police</SelectItem>
                    <SelectItem value="traditional_leader">Traditional Leader</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="informantAddress">Informant Address</Label>
              <Textarea
                id="informantAddress"
                value={formData.informantAddress}
                onChange={(e) => updateField("informantAddress", e.target.value)}
                placeholder="Full address"
              />
            </div>
          </div>
        );

      case "review":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Deceased
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Name:</span> {formData.deceasedGivenNames} {formData.deceasedFamilyName}</p>
                  <p><span className="text-muted-foreground">Sex:</span> {formData.deceasedSex}</p>
                  {formData.deceasedAgeAtDeath && <p><span className="text-muted-foreground">Age:</span> {formData.deceasedAgeAtDeath} years</p>}
                  {formData.deceasedNationalId && <p><span className="text-muted-foreground">ID:</span> {formData.deceasedNationalId}</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Skull className="w-4 h-4" />
                    Death Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Date:</span> {formData.dateOfDeath} {formData.timeOfDeath && `at ${formData.timeOfDeath}`}</p>
                  <p><span className="text-muted-foreground">Manner:</span> <span className="capitalize">{formData.mannerOfDeath.replace('_', ' ')}</span></p>
                  <p><span className="text-muted-foreground">Place:</span> <span className="capitalize">{formData.placeOfDeath.replace('_', ' ')}</span></p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    Cause of Death
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Type:</span> {formData.causeOfDeathType.toUpperCase()}</p>
                  {formData.primaryCauseOfDeath && (
                    <p><span className="text-muted-foreground">Primary:</span> {formData.primaryCauseOfDeath}</p>
                  )}
                  <Badge variant="outline" className="mt-1">
                    {formData.causeOfDeathType === 'mccd' ? 'MCCD Pending' : 
                     formData.causeOfDeathType === 'verbal_autopsy' ? 'VA Pending' : 'Investigation Required'}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Informant
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Name:</span> {formData.informantName}</p>
                  {formData.informantRelationship && (
                    <p><span className="text-muted-foreground">Relationship:</span> {formData.informantRelationship}</p>
                  )}
                  {formData.informantContact && (
                    <p><span className="text-muted-foreground">Contact:</span> {formData.informantContact}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {formData.burialPermitIssued && (
              <Card className="border-success">
                <CardContent className="p-4 flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  <span>Burial Permit #{formData.burialPermitNumber} Issued</span>
                </CardContent>
              </Card>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold">Death Notification</h2>
          <Badge variant="outline">{STEPS[currentStep].title}</Badge>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between mt-3">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isComplete = index < currentStep;
            return (
              <button
                key={step.id}
                onClick={() => index <= currentStep && setCurrentStep(index)}
                className={cn(
                  "flex flex-col items-center gap-1 transition-all",
                  isActive && "text-primary",
                  isComplete && "text-success cursor-pointer",
                  !isActive && !isComplete && "text-muted-foreground"
                )}
                disabled={index > currentStep}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2",
                  isActive && "border-primary bg-primary/10",
                  isComplete && "border-success bg-success/10",
                  !isActive && !isComplete && "border-muted"
                )}>
                  {isComplete ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className="text-xs hidden md:block">{step.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {(() => {
              const Icon = STEPS[currentStep].icon;
              return <Icon className="w-5 h-5" />;
            })()}
            {STEPS[currentStep].title}
          </CardTitle>
          <CardDescription>{STEPS[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
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
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          
          {currentStep === STEPS.length - 1 ? (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Send className="w-4 h-4 mr-2" />
                  </motion.div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Notification
                </>
              )}
            </Button>
          ) : (
            <Button onClick={nextStep}>
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
