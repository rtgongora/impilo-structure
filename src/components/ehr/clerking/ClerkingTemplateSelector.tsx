import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Stethoscope,
  Scissors,
  Baby,
  Brain,
  AlertTriangle,
  Bone,
  Heart,
  Zap,
  ChevronRight,
  User,
  GraduationCap,
} from "lucide-react";
import { 
  CLERKING_TEMPLATES, 
  ClerkingTemplate, 
  CadreLevel, 
  Specialty 
} from "@/data/clerkingTemplates";

interface ClerkingTemplateSelectorProps {
  onSelect: (template: ClerkingTemplate, cadreLevel: CadreLevel) => void;
  onCancel?: () => void;
}

const specialtyIcons: Record<Specialty, any> = {
  'general-medicine': Stethoscope,
  'surgery': Scissors,
  'obstetrics-gynecology': Baby,
  'pediatrics': Baby,
  'psychiatry': Brain,
  'emergency': AlertTriangle,
  'orthopedics': Bone,
  'cardiology': Heart,
  'neurology': Brain,
};

const specialtyColors: Record<Specialty, string> = {
  'general-medicine': 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  'surgery': 'bg-red-500/10 text-red-600 border-red-500/30',
  'obstetrics-gynecology': 'bg-pink-500/10 text-pink-600 border-pink-500/30',
  'pediatrics': 'bg-green-500/10 text-green-600 border-green-500/30',
  'psychiatry': 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  'emergency': 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  'orthopedics': 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  'cardiology': 'bg-rose-500/10 text-rose-600 border-rose-500/30',
  'neurology': 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30',
};

const CADRE_LEVELS: { value: CadreLevel; label: string; description: string }[] = [
  { value: 'student', label: 'Medical Student', description: 'Full clerking with guided prompts' },
  { value: 'intern', label: 'Intern', description: 'Complete assessment with supervision notes' },
  { value: 'registrar', label: 'Registrar', description: 'Full access including sensitive fields' },
  { value: 'consultant', label: 'Consultant', description: 'Complete access with all fields' },
];

export function ClerkingTemplateSelector({ onSelect, onCancel }: ClerkingTemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<ClerkingTemplate | null>(null);
  const [selectedCadre, setSelectedCadre] = useState<CadreLevel>('intern');
  const [step, setStep] = useState<'template' | 'cadre'>('template');

  const handleTemplateSelect = (template: ClerkingTemplate) => {
    setSelectedTemplate(template);
    setStep('cadre');
  };

  const handleConfirm = () => {
    if (selectedTemplate) {
      onSelect(selectedTemplate, selectedCadre);
    }
  };

  if (step === 'cadre' && selectedTemplate) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setStep('template')}>
            ← Back
          </Button>
          <div>
            <h2 className="text-lg font-semibold">Select Your Role</h2>
            <p className="text-sm text-muted-foreground">
              Choose your clinical role for {selectedTemplate.name}
            </p>
          </div>
        </div>

        <RadioGroup
          value={selectedCadre}
          onValueChange={(v) => setSelectedCadre(v as CadreLevel)}
          className="space-y-3"
        >
          {CADRE_LEVELS.map((cadre) => (
            <div
              key={cadre.value}
              className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedCadre === cadre.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setSelectedCadre(cadre.value)}
            >
              <RadioGroupItem value={cadre.value} id={cadre.value} />
              <div className="flex-1">
                <Label htmlFor={cadre.value} className="text-base font-medium cursor-pointer">
                  {cadre.label}
                </Label>
                <p className="text-sm text-muted-foreground">{cadre.description}</p>
              </div>
              <GraduationCap className="w-5 h-5 text-muted-foreground" />
            </div>
          ))}
        </RadioGroup>

        <div className="flex justify-end gap-3">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button onClick={handleConfirm}>
            Start Clerking
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-lg font-semibold">Select Clerking Template</h2>
        <p className="text-sm text-muted-foreground">
          Choose the appropriate template for this patient encounter
        </p>
      </div>

      <ScrollArea className="h-[500px]">
        <div className="grid grid-cols-2 gap-4 pr-4">
          {CLERKING_TEMPLATES.map((template) => {
            const Icon = specialtyIcons[template.specialty];
            const colorClass = specialtyColors[template.specialty];

            return (
              <Card
                key={template.id}
                className={`cursor-pointer transition-all hover:border-primary hover:shadow-md ${
                  selectedTemplate?.id === template.id ? 'border-primary ring-2 ring-primary/20' : ''
                }`}
                onClick={() => handleTemplateSelect(template)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg border ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {template.sections.length} sections
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {template.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {template.sections.slice(0, 4).map((section) => (
                      <Badge key={section.id} variant="secondary" className="text-xs">
                        {section.title}
                      </Badge>
                    ))}
                    {template.sections.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.sections.length - 4} more
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
