import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  MapPin, 
  Bed, 
  Stethoscope,
  Users,
  AlertTriangle,
  Pill,
  FlaskConical,
  Scan,
  Scissors,
  Baby,
  Heart,
  Check,
  ChevronRight,
  Monitor
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { type FacilityRegistryRecord, type ProviderRegistryRecord } from '@/services/registryServices';

// Physical workspace types
export type PhysicalWorkspaceType = 
  | 'ward' 
  | 'outpatient' 
  | 'emergency' 
  | 'theatre' 
  | 'pharmacy' 
  | 'laboratory' 
  | 'radiology'
  | 'icu'
  | 'maternity'
  | 'pediatrics';

export interface PhysicalWorkspace {
  id: string;
  type: PhysicalWorkspaceType;
  name: string;
  location: string;
  workstations?: string[];
  currentOccupancy?: number;
  maxCapacity?: number;
}

export interface WorkspaceSelectionData {
  department: string;
  physicalWorkspace: PhysicalWorkspace;
  workstation?: string;
}

interface WorkspaceSelectionProps {
  facility: FacilityRegistryRecord;
  provider: ProviderRegistryRecord;
  onWorkspaceSelected: (selection: WorkspaceSelectionData) => void;
  onBack: () => void;
}

// Mock physical workspaces for the facility
const PHYSICAL_WORKSPACES: Record<string, PhysicalWorkspace[]> = {
  'Emergency': [
    { id: 'ed-main', type: 'emergency', name: 'Emergency Department', location: 'Ground Floor, Block A', workstations: ['Triage Bay 1', 'Triage Bay 2', 'Resus Bay', 'Trauma Bay', 'Minor Injuries'], currentOccupancy: 18, maxCapacity: 25 },
    { id: 'ed-obs', type: 'emergency', name: 'ED Observation Unit', location: 'Ground Floor, Block A', workstations: ['Obs Bay 1-6'], currentOccupancy: 4, maxCapacity: 6 },
  ],
  'Medical Ward': [
    { id: 'med-1', type: 'ward', name: 'Medical Ward 1 (Male)', location: 'First Floor, Block B', workstations: ['Nursing Station A', 'Nursing Station B'], currentOccupancy: 28, maxCapacity: 32 },
    { id: 'med-2', type: 'ward', name: 'Medical Ward 2 (Female)', location: 'First Floor, Block B', workstations: ['Nursing Station A', 'Nursing Station B'], currentOccupancy: 30, maxCapacity: 32 },
    { id: 'med-hdu', type: 'ward', name: 'Medical HDU', location: 'First Floor, Block B', workstations: ['HDU Station'], currentOccupancy: 6, maxCapacity: 8 },
  ],
  'Surgical Ward': [
    { id: 'surg-1', type: 'ward', name: 'Surgical Ward 1', location: 'Second Floor, Block B', workstations: ['Nursing Station'], currentOccupancy: 24, maxCapacity: 28 },
    { id: 'surg-2', type: 'ward', name: 'Surgical Ward 2', location: 'Second Floor, Block B', workstations: ['Nursing Station'], currentOccupancy: 22, maxCapacity: 28 },
  ],
  'ICU': [
    { id: 'icu-main', type: 'icu', name: 'Intensive Care Unit', location: 'Ground Floor, Block C', workstations: ['Central Monitor Station', 'Bed 1-8 Stations'], currentOccupancy: 6, maxCapacity: 8 },
    { id: 'icu-ccu', type: 'icu', name: 'Coronary Care Unit', location: 'Ground Floor, Block C', workstations: ['CCU Station'], currentOccupancy: 4, maxCapacity: 6 },
  ],
  'Maternity': [
    { id: 'mat-anc', type: 'maternity', name: 'Antenatal Clinic', location: 'Ground Floor, Block D', workstations: ['Consultation 1', 'Consultation 2', 'Ultrasound Room'] },
    { id: 'mat-labour', type: 'maternity', name: 'Labour Ward', location: 'First Floor, Block D', workstations: ['Delivery Room 1', 'Delivery Room 2', 'Delivery Room 3', 'Birth Pool Room'], currentOccupancy: 3, maxCapacity: 4 },
    { id: 'mat-postnatal', type: 'maternity', name: 'Postnatal Ward', location: 'First Floor, Block D', workstations: ['Nursing Station'], currentOccupancy: 18, maxCapacity: 24 },
    { id: 'mat-nicu', type: 'maternity', name: 'Neonatal ICU', location: 'First Floor, Block D', workstations: ['NICU Station'], currentOccupancy: 8, maxCapacity: 12 },
  ],
  'Pediatrics': [
    { id: 'ped-ward', type: 'pediatrics', name: 'Pediatric Ward', location: 'Second Floor, Block D', workstations: ['Nursing Station'], currentOccupancy: 16, maxCapacity: 20 },
    { id: 'ped-opd', type: 'outpatient', name: 'Pediatric Outpatient', location: 'Ground Floor, Block D', workstations: ['Consultation 1', 'Consultation 2'] },
  ],
  'Outpatient': [
    { id: 'opd-gen', type: 'outpatient', name: 'General OPD', location: 'Ground Floor, Block A', workstations: ['Consultation 1', 'Consultation 2', 'Consultation 3', 'Consultation 4'] },
    { id: 'opd-spec', type: 'outpatient', name: 'Specialist Clinics', location: 'Ground Floor, Block A', workstations: ['Cardiology', 'Dermatology', 'ENT', 'Ophthalmology'] },
    { id: 'opd-chron', type: 'outpatient', name: 'Chronic Disease Clinic', location: 'Ground Floor, Block A', workstations: ['HIV/ART Clinic', 'Diabetes Clinic', 'Hypertension Clinic'] },
  ],
  'Theatre': [
    { id: 'theatre-main', type: 'theatre', name: 'Main Theatre Complex', location: 'Second Floor, Block C', workstations: ['Theatre 1', 'Theatre 2', 'Theatre 3', 'Recovery Room'] },
    { id: 'theatre-minor', type: 'theatre', name: 'Minor Procedures Suite', location: 'First Floor, Block A', workstations: ['Procedure Room 1', 'Procedure Room 2'] },
  ],
  'Pharmacy': [
    { id: 'pharm-main', type: 'pharmacy', name: 'Main Pharmacy', location: 'Ground Floor, Block A', workstations: ['Dispensing Counter 1', 'Dispensing Counter 2', 'IV Prep Room'] },
    { id: 'pharm-opd', type: 'pharmacy', name: 'OPD Pharmacy', location: 'Ground Floor, Block A', workstations: ['Dispensing Window'] },
  ],
  'Laboratory': [
    { id: 'lab-main', type: 'laboratory', name: 'Main Laboratory', location: 'Ground Floor, Block E', workstations: ['Haematology', 'Biochemistry', 'Microbiology', 'Sample Reception'] },
    { id: 'lab-poc', type: 'laboratory', name: 'Point of Care Lab', location: 'Emergency Department', workstations: ['POC Station'] },
  ],
  'Radiology': [
    { id: 'rad-main', type: 'radiology', name: 'Radiology Department', location: 'Ground Floor, Block E', workstations: ['X-Ray 1', 'X-Ray 2', 'Ultrasound', 'CT Scanner', 'Reporting Station'] },
  ],
};

const DEPARTMENT_ICONS: Record<string, React.ElementType> = {
  'Emergency': AlertTriangle,
  'Medical Ward': Bed,
  'Surgical Ward': Scissors,
  'ICU': Heart,
  'Maternity': Baby,
  'Pediatrics': Users,
  'Outpatient': Stethoscope,
  'Theatre': Scissors,
  'Pharmacy': Pill,
  'Laboratory': FlaskConical,
  'Radiology': Scan,
};

const DEPARTMENTS = Object.keys(PHYSICAL_WORKSPACES);

export const WorkspaceSelection: React.FC<WorkspaceSelectionProps> = ({
  facility,
  provider,
  onWorkspaceSelected,
  onBack
}) => {
  const [step, setStep] = useState<'department' | 'workspace' | 'workstation'>('department');
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedWorkspace, setSelectedWorkspace] = useState<PhysicalWorkspace | null>(null);
  const [selectedWorkstation, setSelectedWorkstation] = useState<string | null>(null);

  const handleDepartmentSelect = (dept: string) => {
    setSelectedDepartment(dept);
    setSelectedWorkspace(null);
    setSelectedWorkstation(null);
    setStep('workspace');
  };

  const handleWorkspaceSelect = (workspace: PhysicalWorkspace) => {
    setSelectedWorkspace(workspace);
    setSelectedWorkstation(null);
    
    // If workspace has workstations, go to workstation selection
    if (workspace.workstations && workspace.workstations.length > 1) {
      setStep('workstation');
    } else if (workspace.workstations && workspace.workstations.length === 1) {
      // Auto-select single workstation
      handleComplete(workspace, workspace.workstations[0]);
    } else {
      handleComplete(workspace);
    }
  };

  const handleWorkstationSelect = (workstation: string) => {
    setSelectedWorkstation(workstation);
    if (selectedWorkspace) {
      handleComplete(selectedWorkspace, workstation);
    }
  };

  const handleComplete = (workspace: PhysicalWorkspace, workstation?: string) => {
    if (selectedDepartment) {
      onWorkspaceSelected({
        department: selectedDepartment,
        physicalWorkspace: workspace,
        workstation
      });
    }
  };

  const handleBack = () => {
    if (step === 'workstation') {
      setStep('workspace');
      setSelectedWorkstation(null);
    } else if (step === 'workspace') {
      setStep('department');
      setSelectedDepartment(null);
    } else {
      onBack();
    }
  };

  const availableWorkspaces = selectedDepartment ? PHYSICAL_WORKSPACES[selectedDepartment] || [] : [];
  const DeptIcon = selectedDepartment ? DEPARTMENT_ICONS[selectedDepartment] || Building2 : Building2;

  return (
    <Card className="w-full max-w-lg shadow-lg border-border/50">
      <CardHeader className="text-center space-y-3 pb-4">
        <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
          <Monitor className="w-7 h-7 text-primary" />
        </div>
        <div>
          <CardTitle className="text-xl font-bold text-foreground">
            Select Your Workspace
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {step === 'department' && 'Choose the department you\'re working in today'}
            {step === 'workspace' && 'Select your physical work location'}
            {step === 'workstation' && 'Choose your specific workstation'}
          </CardDescription>
        </div>
        
        {/* Context Banner */}
        <div className="flex items-center justify-center gap-4 text-xs bg-muted rounded-lg p-2">
          <div className="flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            <span className="truncate max-w-[150px]">{facility.name}</span>
          </div>
          <span className="text-muted-foreground">•</span>
          <div className="flex items-center gap-1">
            <Stethoscope className="w-3 h-3" />
            <span>{provider.fullName}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
            step === 'department' ? "bg-primary text-primary-foreground" : "bg-primary/20 text-primary"
          )}>
            1
          </div>
          <div className={cn("w-12 h-0.5", selectedDepartment ? "bg-primary" : "bg-muted")} />
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
            step === 'workspace' ? "bg-primary text-primary-foreground" : 
            selectedDepartment ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
          )}>
            2
          </div>
          <div className={cn("w-12 h-0.5", selectedWorkspace ? "bg-primary" : "bg-muted")} />
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
            step === 'workstation' ? "bg-primary text-primary-foreground" : 
            selectedWorkspace ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
          )}>
            3
          </div>
        </div>

        {/* Step 1: Department Selection */}
        {step === 'department' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ScrollArea className="h-[320px] pr-3">
              <div className="grid grid-cols-2 gap-2">
                {DEPARTMENTS.map((dept) => {
                  const Icon = DEPARTMENT_ICONS[dept] || Building2;
                  const workspaces = PHYSICAL_WORKSPACES[dept] || [];
                  const totalBeds = workspaces.reduce((sum, w) => sum + (w.maxCapacity || 0), 0);
                  const occupiedBeds = workspaces.reduce((sum, w) => sum + (w.currentOccupancy || 0), 0);
                  
                  return (
                    <button
                      key={dept}
                      onClick={() => handleDepartmentSelect(dept)}
                      className={cn(
                        "p-3 rounded-lg border text-left transition-all hover:border-primary hover:bg-primary/5",
                        "flex flex-col gap-2"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-primary/10">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium text-sm">{dept}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{workspaces.length} areas</span>
                        {totalBeds > 0 && (
                          <>
                            <span>•</span>
                            <span className={cn(
                              occupiedBeds / totalBeds > 0.9 ? "text-destructive" : ""
                            )}>
                              {occupiedBeds}/{totalBeds} beds
                            </span>
                          </>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </motion.div>
        )}

        {/* Step 2: Physical Workspace Selection */}
        {step === 'workspace' && selectedDepartment && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 mb-3 p-2 bg-muted rounded-lg">
              <DeptIcon className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">{selectedDepartment}</span>
            </div>
            
            <ScrollArea className="h-[280px] pr-3">
              <div className="space-y-2">
                {availableWorkspaces.map((workspace) => (
                  <button
                    key={workspace.id}
                    onClick={() => handleWorkspaceSelect(workspace)}
                    className={cn(
                      "w-full p-3 rounded-lg border text-left transition-all hover:border-primary hover:bg-primary/5",
                      "flex items-center justify-between gap-3"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{workspace.name}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{workspace.location}</span>
                      </div>
                      {workspace.workstations && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {workspace.workstations.slice(0, 3).map((ws) => (
                            <Badge key={ws} variant="outline" className="text-xs py-0">
                              {ws}
                            </Badge>
                          ))}
                          {workspace.workstations.length > 3 && (
                            <Badge variant="outline" className="text-xs py-0">
                              +{workspace.workstations.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {workspace.maxCapacity && (
                        <Badge 
                          variant={workspace.currentOccupancy! / workspace.maxCapacity > 0.9 ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {workspace.currentOccupancy}/{workspace.maxCapacity}
                        </Badge>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        )}

        {/* Step 3: Workstation Selection */}
        {step === 'workstation' && selectedWorkspace && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                <DeptIcon className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">{selectedDepartment}</span>
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{selectedWorkspace.name}</span>
              </div>
            </div>
            
            <ScrollArea className="h-[260px] pr-3">
              <div className="space-y-2">
                {selectedWorkspace.workstations?.map((workstation) => (
                  <button
                    key={workstation}
                    onClick={() => handleWorkstationSelect(workstation)}
                    className={cn(
                      "w-full p-3 rounded-lg border text-left transition-all hover:border-primary hover:bg-primary/5",
                      "flex items-center justify-between gap-3",
                      selectedWorkstation === workstation && "border-primary bg-primary/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-muted">
                        <Monitor className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-sm">{workstation}</span>
                    </div>
                    {selectedWorkstation === workstation && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={handleBack}>
            Back
          </Button>
          {step === 'department' && (
            <Button className="flex-1" disabled>
              Select Department
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkspaceSelection;
