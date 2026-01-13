import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Baby, User, MapPin, FileText, ChevronRight, ChevronLeft, Check, 
  Calendar, Building2, Users, Clock, AlertTriangle, Save, Send
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
import { ZIMBABWE_PROVINCES, type BirthNotification, type NotifierRole, type BirthPlurality } from "./types";

interface Step {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: Step[] = [
  { id: "child", title: "Child Details", description: "Newborn information", icon: Baby },
  { id: "mother", title: "Mother", description: "Mother's details", icon: User },
  { id: "father", title: "Father", description: "Father's details", icon: Users },
  { id: "birth-place", title: "Birth Place", description: "Location of birth", icon: MapPin },
  { id: "notifier", title: "Notifier", description: "Who is reporting", icon: FileText },
  { id: "review", title: "Review", description: "Confirm details", icon: Check },
];

interface BirthNotificationFormProps {
  encounterId?: string;
  patientId?: string;
  facilityId?: string;
  onComplete?: (notification: BirthNotification) => void;
  onCancel?: () => void;
}

interface FormData {
  // Child
  childGivenNames: string;
  childFamilyName: string;
  childSex: string;
  dateOfBirth: string;
  timeOfBirth: string;
  isDateEstimated: boolean;
  birthWeightGrams: string;
  plurality: BirthPlurality;
  birthOrder: string;
  
  // Mother
  motherGivenNames: string;
  motherFamilyName: string;
  motherMaidenName: string;
  motherDateOfBirth: string;
  motherNationalId: string;
  motherPassport: string;
  motherOccupation: string;
  motherEducation: string;
  motherMaritalStatus: string;
  motherResidenceProvince: string;
  motherResidenceDistrict: string;
  motherResidenceWard: string;
  motherResidenceVillage: string;
  
  // Father
  fatherGivenNames: string;
  fatherFamilyName: string;
  fatherNationalId: string;
  fatherPassport: string;
  fatherDateOfBirth: string;
  fatherOccupation: string;
  fatherEducation: string;
  fatherMaritalStatus: string;
  fatherAcknowledged: boolean;
  fatherResidenceProvince: string;
  fatherResidenceDistrict: string;
  
  // Birth Place
  birthAtFacility: boolean;
  facilityWard: string;
  facilityRoom: string;
  communityProvince: string;
  communityDistrict: string;
  communityWard: string;
  communityVillage: string;
  birthAttendantName: string;
  birthAttendantRole: string;
  birthAttendantQualification: string;
  
  // Notifier
  notifierRole: NotifierRole;
  notifierName: string;
  notifierContact: string;
  notifierRelationship: string;
  
  // Late registration
  isLateRegistration: boolean;
  lateRegistrationReason: string;
}

const initialFormData: FormData = {
  // Child
  childGivenNames: "",
  childFamilyName: "",
  childSex: "",
  dateOfBirth: "",
  timeOfBirth: "",
  isDateEstimated: false,
  birthWeightGrams: "",
  plurality: "singleton",
  birthOrder: "1",
  
  // Mother
  motherGivenNames: "",
  motherFamilyName: "",
  motherMaidenName: "",
  motherDateOfBirth: "",
  motherNationalId: "",
  motherPassport: "",
  motherOccupation: "",
  motherEducation: "",
  motherMaritalStatus: "",
  motherResidenceProvince: "",
  motherResidenceDistrict: "",
  motherResidenceWard: "",
  motherResidenceVillage: "",
  
  // Father
  fatherGivenNames: "",
  fatherFamilyName: "",
  fatherNationalId: "",
  fatherPassport: "",
  fatherDateOfBirth: "",
  fatherOccupation: "",
  fatherEducation: "",
  fatherMaritalStatus: "",
  fatherAcknowledged: false,
  fatherResidenceProvince: "",
  fatherResidenceDistrict: "",
  
  // Birth Place
  birthAtFacility: true,
  facilityWard: "",
  facilityRoom: "",
  communityProvince: "",
  communityDistrict: "",
  communityWard: "",
  communityVillage: "",
  birthAttendantName: "",
  birthAttendantRole: "",
  birthAttendantQualification: "",
  
  // Notifier
  notifierRole: "health_worker",
  notifierName: "",
  notifierContact: "",
  notifierRelationship: "",
  
  // Late registration
  isLateRegistration: false,
  lateRegistrationReason: "",
};

export function BirthNotificationForm({ 
  encounterId, 
  patientId, 
  facilityId,
  onComplete, 
  onCancel 
}: BirthNotificationFormProps) {
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

  const calculateMotherAge = (): number | null => {
    if (!formData.motherDateOfBirth || !formData.dateOfBirth) return null;
    const motherDob = new Date(formData.motherDateOfBirth);
    const birthDate = new Date(formData.dateOfBirth);
    const age = Math.floor((birthDate.getTime() - motherDob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return age;
  };

  const saveDraft = async () => {
    setIsSavingDraft(true);
    try {
      const { error } = await supabase
        .from('birth_notifications')
        .insert([{
          source: 'facility',
          child_given_names: formData.childGivenNames || null,
          child_family_name: formData.childFamilyName || null,
          child_sex: formData.childSex || 'unknown',
          date_of_birth: formData.dateOfBirth || new Date().toISOString().split('T')[0],
          time_of_birth: formData.timeOfBirth || null,
          is_date_estimated: formData.isDateEstimated,
          birth_weight_grams: formData.birthWeightGrams ? parseInt(formData.birthWeightGrams) : null,
          plurality: formData.plurality,
          birth_order: parseInt(formData.birthOrder) || 1,
          mother_given_names: formData.motherGivenNames || 'Unknown',
          mother_family_name: formData.motherFamilyName || 'Unknown',
          mother_maiden_name: formData.motherMaidenName || null,
          mother_date_of_birth: formData.motherDateOfBirth || null,
          mother_national_id: formData.motherNationalId || null,
          mother_passport: formData.motherPassport || null,
          mother_occupation: formData.motherOccupation || null,
          mother_education_level: formData.motherEducation || null,
          mother_marital_status: formData.motherMaritalStatus || null,
          mother_age_at_birth: calculateMotherAge(),
          mother_residence_province: formData.motherResidenceProvince || null,
          mother_residence_district: formData.motherResidenceDistrict || null,
          mother_residence_ward: formData.motherResidenceWard || null,
          mother_residence_village: formData.motherResidenceVillage || null,
          father_given_names: formData.fatherGivenNames || null,
          father_family_name: formData.fatherFamilyName || null,
          father_national_id: formData.fatherNationalId || null,
          father_passport: formData.fatherPassport || null,
          father_date_of_birth: formData.fatherDateOfBirth || null,
          father_occupation: formData.fatherOccupation || null,
          father_education_level: formData.fatherEducation || null,
          father_marital_status: formData.fatherMaritalStatus || null,
          father_acknowledged: formData.fatherAcknowledged,
          father_residence_province: formData.fatherResidenceProvince || null,
          father_residence_district: formData.fatherResidenceDistrict || null,
          facility_id: facilityId || null,
          facility_ward: formData.facilityWard || null,
          facility_room: formData.facilityRoom || null,
          community_province: formData.communityProvince || null,
          community_district: formData.communityDistrict || null,
          community_ward: formData.communityWard || null,
          community_village: formData.communityVillage || null,
          birth_attendant_name: formData.birthAttendantName || null,
          birth_attendant_role: formData.birthAttendantRole || null,
          birth_attendant_qualification: formData.birthAttendantQualification || null,
          notifier_role: formData.notifierRole,
          notifier_name: formData.notifierName || 'Draft User',
          notifier_contact: formData.notifierContact || null,
          notifier_relationship: formData.notifierRelationship || null,
          is_late_registration: formData.isLateRegistration,
          late_registration_reason: formData.lateRegistrationReason || null,
          encounter_id: encounterId || null,
          visit_id: null,
          birth_occurred_at: formData.dateOfBirth 
            ? `${formData.dateOfBirth}T${formData.timeOfBirth || '00:00'}:00`
            : new Date().toISOString(),
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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('birth_notifications')
        .insert([{
          status: 'submitted',
          source: 'facility',
          child_given_names: formData.childGivenNames || null,
          child_family_name: formData.childFamilyName || null,
          child_sex: formData.childSex,
          date_of_birth: formData.dateOfBirth,
          time_of_birth: formData.timeOfBirth || null,
          is_date_estimated: formData.isDateEstimated,
          birth_weight_grams: formData.birthWeightGrams ? parseInt(formData.birthWeightGrams) : null,
          plurality: formData.plurality,
          birth_order: parseInt(formData.birthOrder) || 1,
          mother_given_names: formData.motherGivenNames,
          mother_family_name: formData.motherFamilyName,
          mother_maiden_name: formData.motherMaidenName || null,
          mother_date_of_birth: formData.motherDateOfBirth || null,
          mother_national_id: formData.motherNationalId || null,
          mother_passport: formData.motherPassport || null,
          mother_occupation: formData.motherOccupation || null,
          mother_education_level: formData.motherEducation || null,
          mother_marital_status: formData.motherMaritalStatus || null,
          mother_age_at_birth: calculateMotherAge(),
          mother_residence_province: formData.motherResidenceProvince || null,
          mother_residence_district: formData.motherResidenceDistrict || null,
          mother_residence_ward: formData.motherResidenceWard || null,
          mother_residence_village: formData.motherResidenceVillage || null,
          father_given_names: formData.fatherGivenNames || null,
          father_family_name: formData.fatherFamilyName || null,
          father_national_id: formData.fatherNationalId || null,
          father_passport: formData.fatherPassport || null,
          father_date_of_birth: formData.fatherDateOfBirth || null,
          father_occupation: formData.fatherOccupation || null,
          father_education_level: formData.fatherEducation || null,
          father_marital_status: formData.fatherMaritalStatus || null,
          father_acknowledged: formData.fatherAcknowledged,
          father_residence_province: formData.fatherResidenceProvince || null,
          father_residence_district: formData.fatherResidenceDistrict || null,
          facility_id: facilityId || null,
          facility_ward: formData.facilityWard || null,
          facility_room: formData.facilityRoom || null,
          community_province: formData.communityProvince || null,
          community_district: formData.communityDistrict || null,
          community_ward: formData.communityWard || null,
          community_village: formData.communityVillage || null,
          birth_attendant_name: formData.birthAttendantName || null,
          birth_attendant_role: formData.birthAttendantRole || null,
          birth_attendant_qualification: formData.birthAttendantQualification || null,
          notifier_role: formData.notifierRole,
          notifier_name: formData.notifierName,
          notifier_contact: formData.notifierContact || null,
          notifier_relationship: formData.notifierRelationship || null,
          is_late_registration: formData.isLateRegistration,
          late_registration_reason: formData.lateRegistrationReason || null,
          encounter_id: encounterId || null,
          visit_id: null,
          birth_occurred_at: `${formData.dateOfBirth}T${formData.timeOfBirth || '00:00'}:00`,
          submitted_at: new Date().toISOString(),
        }] as any)
        .select()
        .single();

      if (error) throw error;
      
      toast.success("Birth notification submitted", {
        description: `Notification #${data.notification_number} created`
      });
      
      onComplete?.(data as unknown as BirthNotification);
    } catch (error) {
      console.error('Submit error:', error);
      toast.error("Failed to submit notification");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    const step = STEPS[currentStep];

    switch (step.id) {
      case "child":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="childGivenNames">Given Name(s)</Label>
                <Input
                  id="childGivenNames"
                  value={formData.childGivenNames}
                  onChange={(e) => updateField("childGivenNames", e.target.value)}
                  placeholder="Child's given name(s)"
                />
                <p className="text-xs text-muted-foreground">May be left blank if unnamed</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="childFamilyName">Family Name</Label>
                <Input
                  id="childFamilyName"
                  value={formData.childFamilyName}
                  onChange={(e) => updateField("childFamilyName", e.target.value)}
                  placeholder="Family/surname"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sex *</Label>
              <RadioGroup
                value={formData.childSex}
                onValueChange={(v) => updateField("childSex", v)}
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
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="indeterminate" id="indeterminate" />
                  <Label htmlFor="indeterminate">Indeterminate</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => updateField("dateOfBirth", e.target.value)}
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
                <Label htmlFor="timeOfBirth">Time of Birth</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="timeOfBirth"
                    type="time"
                    value={formData.timeOfBirth}
                    onChange={(e) => updateField("timeOfBirth", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birthWeightGrams">Birth Weight (grams)</Label>
                <Input
                  id="birthWeightGrams"
                  type="number"
                  value={formData.birthWeightGrams}
                  onChange={(e) => updateField("birthWeightGrams", e.target.value)}
                  placeholder="e.g., 3200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plurality">Plurality</Label>
                <Select 
                  value={formData.plurality} 
                  onValueChange={(v) => updateField("plurality", v as BirthPlurality)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="singleton">Singleton</SelectItem>
                    <SelectItem value="twin">Twin</SelectItem>
                    <SelectItem value="triplet">Triplet</SelectItem>
                    <SelectItem value="quadruplet">Quadruplet</SelectItem>
                    <SelectItem value="higher">Higher order</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthOrder">Birth Order</Label>
                <Input
                  id="birthOrder"
                  type="number"
                  min="1"
                  value={formData.birthOrder}
                  onChange={(e) => updateField("birthOrder", e.target.value)}
                  placeholder="1"
                />
              </div>
            </div>

            <div className="p-4 bg-warning-muted rounded-lg border border-warning/30">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <Label className="font-medium">Late Registration Check</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isLateRegistration"
                  checked={formData.isLateRegistration}
                  onCheckedChange={(checked) => updateField("isLateRegistration", !!checked)}
                />
                <Label htmlFor="isLateRegistration" className="text-sm">
                  This is a late registration (more than 42 days after birth)
                </Label>
              </div>
              {formData.isLateRegistration && (
                <div className="mt-3">
                  <Label htmlFor="lateRegistrationReason">Reason for late registration *</Label>
                  <Textarea
                    id="lateRegistrationReason"
                    value={formData.lateRegistrationReason}
                    onChange={(e) => updateField("lateRegistrationReason", e.target.value)}
                    placeholder="Explain why the registration is late"
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          </div>
        );

      case "mother":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="motherGivenNames">Given Name(s) *</Label>
                <Input
                  id="motherGivenNames"
                  value={formData.motherGivenNames}
                  onChange={(e) => updateField("motherGivenNames", e.target.value)}
                  placeholder="Mother's given names"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="motherFamilyName">Family Name *</Label>
                <Input
                  id="motherFamilyName"
                  value={formData.motherFamilyName}
                  onChange={(e) => updateField("motherFamilyName", e.target.value)}
                  placeholder="Family/surname"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="motherMaidenName">Maiden Name</Label>
                <Input
                  id="motherMaidenName"
                  value={formData.motherMaidenName}
                  onChange={(e) => updateField("motherMaidenName", e.target.value)}
                  placeholder="Birth surname"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="motherDateOfBirth">Date of Birth</Label>
                <Input
                  id="motherDateOfBirth"
                  type="date"
                  value={formData.motherDateOfBirth}
                  onChange={(e) => updateField("motherDateOfBirth", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="motherNationalId">National ID</Label>
                <Input
                  id="motherNationalId"
                  value={formData.motherNationalId}
                  onChange={(e) => updateField("motherNationalId", e.target.value)}
                  placeholder="e.g., 63-123456-A-44"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="motherPassport">Passport Number</Label>
                <Input
                  id="motherPassport"
                  value={formData.motherPassport}
                  onChange={(e) => updateField("motherPassport", e.target.value)}
                  placeholder="If applicable"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="motherOccupation">Occupation</Label>
                <Input
                  id="motherOccupation"
                  value={formData.motherOccupation}
                  onChange={(e) => updateField("motherOccupation", e.target.value)}
                  placeholder="Occupation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="motherEducation">Education Level</Label>
                <Select 
                  value={formData.motherEducation} 
                  onValueChange={(v) => updateField("motherEducation", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="primary">Primary</SelectItem>
                    <SelectItem value="secondary">Secondary</SelectItem>
                    <SelectItem value="tertiary">Tertiary</SelectItem>
                    <SelectItem value="university">University</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="motherMaritalStatus">Marital Status</Label>
                <Select 
                  value={formData.motherMaritalStatus} 
                  onValueChange={(v) => updateField("motherMaritalStatus", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                    <SelectItem value="cohabiting">Cohabiting</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Mother's Residence</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="motherResidenceProvince">Province</Label>
                  <Select 
                    value={formData.motherResidenceProvince} 
                    onValueChange={(v) => updateField("motherResidenceProvince", v)}
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
                  <Label htmlFor="motherResidenceDistrict">District</Label>
                  <Input
                    id="motherResidenceDistrict"
                    value={formData.motherResidenceDistrict}
                    onChange={(e) => updateField("motherResidenceDistrict", e.target.value)}
                    placeholder="District"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motherResidenceWard">Ward</Label>
                  <Input
                    id="motherResidenceWard"
                    value={formData.motherResidenceWard}
                    onChange={(e) => updateField("motherResidenceWard", e.target.value)}
                    placeholder="Ward"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motherResidenceVillage">Village/Location</Label>
                  <Input
                    id="motherResidenceVillage"
                    value={formData.motherResidenceVillage}
                    onChange={(e) => updateField("motherResidenceVillage", e.target.value)}
                    placeholder="Village or location"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case "father":
        return (
          <div className="space-y-6">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Checkbox
                  id="fatherAcknowledged"
                  checked={formData.fatherAcknowledged}
                  onCheckedChange={(checked) => updateField("fatherAcknowledged", !!checked)}
                />
                <Label htmlFor="fatherAcknowledged" className="font-medium">
                  Father acknowledges paternity
                </Label>
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                Father details will be included on the birth certificate if acknowledged
              </p>
            </div>

            {formData.fatherAcknowledged && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fatherGivenNames">Given Name(s)</Label>
                    <Input
                      id="fatherGivenNames"
                      value={formData.fatherGivenNames}
                      onChange={(e) => updateField("fatherGivenNames", e.target.value)}
                      placeholder="Father's given names"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fatherFamilyName">Family Name</Label>
                    <Input
                      id="fatherFamilyName"
                      value={formData.fatherFamilyName}
                      onChange={(e) => updateField("fatherFamilyName", e.target.value)}
                      placeholder="Family/surname"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fatherDateOfBirth">Date of Birth</Label>
                    <Input
                      id="fatherDateOfBirth"
                      type="date"
                      value={formData.fatherDateOfBirth}
                      onChange={(e) => updateField("fatherDateOfBirth", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fatherNationalId">National ID</Label>
                    <Input
                      id="fatherNationalId"
                      value={formData.fatherNationalId}
                      onChange={(e) => updateField("fatherNationalId", e.target.value)}
                      placeholder="e.g., 63-123456-A-44"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fatherPassport">Passport Number</Label>
                    <Input
                      id="fatherPassport"
                      value={formData.fatherPassport}
                      onChange={(e) => updateField("fatherPassport", e.target.value)}
                      placeholder="If applicable"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fatherOccupation">Occupation</Label>
                    <Input
                      id="fatherOccupation"
                      value={formData.fatherOccupation}
                      onChange={(e) => updateField("fatherOccupation", e.target.value)}
                      placeholder="Occupation"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fatherEducation">Education Level</Label>
                    <Select 
                      value={formData.fatherEducation} 
                      onValueChange={(v) => updateField("fatherEducation", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="primary">Primary</SelectItem>
                        <SelectItem value="secondary">Secondary</SelectItem>
                        <SelectItem value="tertiary">Tertiary</SelectItem>
                        <SelectItem value="university">University</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fatherMaritalStatus">Marital Status</Label>
                    <Select 
                      value={formData.fatherMaritalStatus} 
                      onValueChange={(v) => updateField("fatherMaritalStatus", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="divorced">Divorced</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                        <SelectItem value="cohabiting">Cohabiting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Father's Residence</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fatherResidenceProvince">Province</Label>
                      <Select 
                        value={formData.fatherResidenceProvince} 
                        onValueChange={(v) => updateField("fatherResidenceProvince", v)}
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
                      <Label htmlFor="fatherResidenceDistrict">District</Label>
                      <Input
                        id="fatherResidenceDistrict"
                        value={formData.fatherResidenceDistrict}
                        onChange={(e) => updateField("fatherResidenceDistrict", e.target.value)}
                        placeholder="District"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case "birth-place":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Place of Birth *</Label>
              <RadioGroup
                value={formData.birthAtFacility ? "facility" : "community"}
                onValueChange={(v) => updateField("birthAtFacility", v === "facility")}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="facility" id="facility" />
                  <Label htmlFor="facility">Health Facility</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="community" id="community" />
                  <Label htmlFor="community">Community / Home</Label>
                </div>
              </RadioGroup>
            </div>

            {formData.birthAtFacility ? (
              <div className="p-4 bg-muted/30 rounded-lg space-y-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  <h4 className="font-medium">Facility Details</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="facilityWard">Ward / Unit</Label>
                    <Input
                      id="facilityWard"
                      value={formData.facilityWard}
                      onChange={(e) => updateField("facilityWard", e.target.value)}
                      placeholder="e.g., Maternity Ward"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="facilityRoom">Room / Bed</Label>
                    <Input
                      id="facilityRoom"
                      value={formData.facilityRoom}
                      onChange={(e) => updateField("facilityRoom", e.target.value)}
                      placeholder="e.g., Room 4, Bed 2"
                    />
                  </div>
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

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Birth Attendant</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthAttendantName">Name</Label>
                  <Input
                    id="birthAttendantName"
                    value={formData.birthAttendantName}
                    onChange={(e) => updateField("birthAttendantName", e.target.value)}
                    placeholder="Attendant's name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthAttendantRole">Role</Label>
                  <Select 
                    value={formData.birthAttendantRole} 
                    onValueChange={(v) => updateField("birthAttendantRole", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="midwife">Midwife</SelectItem>
                      <SelectItem value="nurse">Nurse</SelectItem>
                      <SelectItem value="traditional_birth_attendant">Traditional Birth Attendant</SelectItem>
                      <SelectItem value="community_health_worker">Community Health Worker</SelectItem>
                      <SelectItem value="family_member">Family Member</SelectItem>
                      <SelectItem value="unattended">Unattended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthAttendantQualification">Qualification</Label>
                  <Input
                    id="birthAttendantQualification"
                    value={formData.birthAttendantQualification}
                    onChange={(e) => updateField("birthAttendantQualification", e.target.value)}
                    placeholder="e.g., Registered Nurse"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case "notifier":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Notifier Role *</Label>
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
                  <SelectItem value="traditional_leader">Traditional Leader</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="notifierName">Notifier Name *</Label>
                <Input
                  id="notifierName"
                  value={formData.notifierName}
                  onChange={(e) => updateField("notifierName", e.target.value)}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notifierContact">Contact Number</Label>
                <Input
                  id="notifierContact"
                  value={formData.notifierContact}
                  onChange={(e) => updateField("notifierContact", e.target.value)}
                  placeholder="Phone number"
                />
              </div>
            </div>

            {formData.notifierRole === "family_member" && (
              <div className="space-y-2">
                <Label htmlFor="notifierRelationship">Relationship to Child</Label>
                <Select 
                  value={formData.notifierRelationship} 
                  onValueChange={(v) => updateField("notifierRelationship", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mother">Mother</SelectItem>
                    <SelectItem value="father">Father</SelectItem>
                    <SelectItem value="grandparent">Grandparent</SelectItem>
                    <SelectItem value="aunt_uncle">Aunt/Uncle</SelectItem>
                    <SelectItem value="sibling">Sibling</SelectItem>
                    <SelectItem value="other_relative">Other Relative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        );

      case "review":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Baby className="w-4 h-4" />
                    Child Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Name:</span> {formData.childGivenNames || "(Unnamed)"} {formData.childFamilyName}</p>
                  <p><span className="text-muted-foreground">Sex:</span> {formData.childSex}</p>
                  <p><span className="text-muted-foreground">Date of Birth:</span> {formData.dateOfBirth} {formData.timeOfBirth && `at ${formData.timeOfBirth}`}</p>
                  {formData.birthWeightGrams && <p><span className="text-muted-foreground">Weight:</span> {formData.birthWeightGrams}g</p>}
                  <p><span className="text-muted-foreground">Plurality:</span> {formData.plurality} (Birth order: {formData.birthOrder})</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Mother
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Name:</span> {formData.motherGivenNames} {formData.motherFamilyName}</p>
                  {formData.motherNationalId && <p><span className="text-muted-foreground">ID:</span> {formData.motherNationalId}</p>}
                  {formData.motherResidenceProvince && (
                    <p><span className="text-muted-foreground">Residence:</span> {formData.motherResidenceVillage}, {formData.motherResidenceDistrict}, {formData.motherResidenceProvince}</p>
                  )}
                </CardContent>
              </Card>

              {formData.fatherAcknowledged && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Father
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <p><span className="text-muted-foreground">Name:</span> {formData.fatherGivenNames} {formData.fatherFamilyName}</p>
                    {formData.fatherNationalId && <p><span className="text-muted-foreground">ID:</span> {formData.fatherNationalId}</p>}
                    <Badge variant="outline" className="mt-1">Paternity Acknowledged</Badge>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Birth Place
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Type:</span> {formData.birthAtFacility ? "Health Facility" : "Community"}</p>
                  {formData.birthAtFacility ? (
                    <>
                      {formData.facilityWard && <p><span className="text-muted-foreground">Ward:</span> {formData.facilityWard}</p>}
                      {formData.facilityRoom && <p><span className="text-muted-foreground">Room:</span> {formData.facilityRoom}</p>}
                    </>
                  ) : (
                    <p><span className="text-muted-foreground">Location:</span> {formData.communityVillage}, {formData.communityDistrict}, {formData.communityProvince}</p>
                  )}
                  {formData.birthAttendantName && (
                    <p><span className="text-muted-foreground">Attendant:</span> {formData.birthAttendantName} ({formData.birthAttendantRole})</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {formData.isLateRegistration && (
              <Card className="border-warning">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-warning">
                    <AlertTriangle className="w-4 h-4" />
                    Late Registration
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p>{formData.lateRegistrationReason}</p>
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
          <h2 className="text-xl font-bold">Birth Notification</h2>
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
