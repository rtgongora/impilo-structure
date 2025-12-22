import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { 
  Save, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  User,
  MessageSquare,
  History,
  Pill,
  Users,
  Home,
  ClipboardList,
  Stethoscope,
  Heart,
  Wind,
  Activity,
  Brain,
  Baby,
  Scissors,
  HeartPulse,
  Bone,
} from "lucide-react";
import { 
  ClerkingTemplate, 
  ClerkingSection, 
  ClerkingField,
  CadreLevel,
  filterSectionsByRole 
} from "@/data/clerkingTemplates";
import { format } from "date-fns";

interface ClerkingFormEditorProps {
  template: ClerkingTemplate;
  cadreLevel: CadreLevel;
  encounterId?: string;
  onSave?: (data: Record<string, any>) => void;
  onSign?: (data: Record<string, any>) => void;
  initialData?: Record<string, any>;
}

const iconMap: Record<string, any> = {
  User,
  MessageSquare,
  FileText,
  History,
  Pill,
  Users,
  Home,
  ClipboardList,
  Stethoscope,
  Heart,
  Wind,
  Activity,
  Brain,
  Baby,
  Scissors,
  HeartPulse,
  Bone,
};

export function ClerkingFormEditor({
  template,
  cadreLevel,
  encounterId,
  onSave,
  onSign,
  initialData = {}
}: ClerkingFormEditorProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>([template.sections[0]?.id]);

  // Filter sections based on cadre level
  const filteredSections = filterSectionsByRole(template.sections, cadreLevel);

  // Calculate completion percentage
  const calculateCompletion = () => {
    let totalRequired = 0;
    let completedRequired = 0;

    filteredSections.forEach(section => {
      section.fields.forEach(field => {
        if (field.required) {
          totalRequired++;
          const value = formData[field.id];
          if (value && (typeof value === 'string' ? value.trim() : true)) {
            completedRequired++;
          }
        }
      });
    });

    return totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 0;
  };

  const completion = calculateCompletion();

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleCheckboxGroupChange = (fieldId: string, option: string, checked: boolean) => {
    setFormData(prev => {
      const currentValues = prev[fieldId] || [];
      if (checked) {
        return { ...prev, [fieldId]: [...currentValues, option] };
      } else {
        return { ...prev, [fieldId]: currentValues.filter((v: string) => v !== option) };
      }
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      onSave?.(formData);
      setLastSaved(new Date());
      toast.success("Clerking saved successfully");
    } catch (error) {
      toast.error("Failed to save clerking");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSign = async () => {
    if (completion < 100) {
      toast.error("Please complete all required fields before signing");
      return;
    }
    onSign?.(formData);
    toast.success("Clerking signed successfully");
  };

  const renderField = (field: ClerkingField) => {
    const value = formData[field.id];

    switch (field.type) {
      case 'text':
        return (
          <Input
            id={field.id}
            value={value || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
          />
        );

      case 'textarea':
        return (
          <Textarea
            id={field.id}
            value={value || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className="min-h-[100px]"
          />
        );

      case 'number':
        return (
          <Input
            id={field.id}
            type="number"
            value={value || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
          />
        );

      case 'date':
        return (
          <Input
            id={field.id}
            type="date"
            value={value || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          />
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={value || false}
              onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
            />
            <label htmlFor={field.id} className="text-sm cursor-pointer">
              {field.label}
            </label>
          </div>
        );

      case 'select':
        return (
          <Select
            value={value || ''}
            onValueChange={(v) => handleFieldChange(field.id, v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'checkbox-group':
        return (
          <div className="grid grid-cols-2 gap-2">
            {field.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.id}-${option}`}
                  checked={(value || []).includes(option)}
                  onCheckedChange={(checked) => 
                    handleCheckboxGroupChange(field.id, option, checked as boolean)
                  }
                />
                <label 
                  htmlFor={`${field.id}-${option}`} 
                  className="text-sm cursor-pointer"
                >
                  {option}
                </label>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-card flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{template.name}</h2>
          <p className="text-sm text-muted-foreground">{template.description}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="flex items-center gap-2">
              <Progress value={completion} className="w-32 h-2" />
              <span className="text-sm font-medium">{completion}%</span>
            </div>
            {lastSaved && (
              <p className="text-xs text-muted-foreground">
                Last saved: {format(lastSaved, "HH:mm:ss")}
              </p>
            )}
          </div>
          <Button variant="outline" onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button onClick={handleSign} disabled={completion < 100}>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Sign & Complete
          </Button>
        </div>
      </div>

      {/* Form Content */}
      <ScrollArea className="flex-1 p-4">
        <Accordion
          type="multiple"
          value={expandedSections}
          onValueChange={setExpandedSections}
          className="space-y-4"
        >
          {filteredSections.map((section) => {
            const Icon = iconMap[section.icon] || FileText;
            const sectionFields = section.fields;
            const hasRequiredFields = sectionFields.some(f => f.required);
            const allRequiredFilled = sectionFields
              .filter(f => f.required)
              .every(f => {
                const val = formData[f.id];
                return val && (typeof val === 'string' ? val.trim() : true);
              });

            return (
              <AccordionItem 
                key={section.id} 
                value={section.id}
                className="border rounded-lg"
              >
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      hasRequiredFields && !allRequiredFilled 
                        ? 'bg-warning/10 text-warning' 
                        : 'bg-primary/10 text-primary'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-medium">{section.title}</span>
                    {hasRequiredFields && allRequiredFilled && (
                      <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Complete
                      </Badge>
                    )}
                    {hasRequiredFields && !allRequiredFilled && (
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Required
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4 pt-2">
                    {sectionFields.map((field) => {
                      if (field.type === 'checkbox') {
                        return (
                          <div key={field.id}>
                            {renderField(field)}
                          </div>
                        );
                      }

                      return (
                        <div key={field.id} className="space-y-2">
                          <Label htmlFor={field.id} className="flex items-center gap-1">
                            {field.label}
                            {field.required && <span className="text-destructive">*</span>}
                          </Label>
                          {renderField(field)}
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </ScrollArea>
    </div>
  );
}
