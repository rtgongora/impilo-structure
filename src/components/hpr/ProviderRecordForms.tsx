/**
 * Provider HR Record Forms - Add/Edit forms for iHRIS sections
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import { IHRISService } from '@/services/ihrisService';
import {
  EDUCATION_STATUS_OPTIONS,
  EMPLOYER_TYPE_OPTIONS,
  INCIDENT_TYPE_OPTIONS,
  DISCIPLINARY_ACTION_OPTIONS,
  RELATIONSHIP_OPTIONS,
} from '@/types/ihris';

interface FormDialogProps {
  providerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// ==========================================
// ADD EDUCATION FORM
// ==========================================

export function AddEducationDialog({ providerId, open, onOpenChange, onSuccess }: FormDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    education_level: 'bachelors',
    degree_name: '',
    major: '',
    institution_name: '',
    institution_country: 'Zimbabwe',
    graduation_date: '',
    status: 'completed' as 'completed' | 'in_progress' | 'incomplete',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.degree_name || !formData.institution_name) {
      toast.error('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await IHRISService.addEducation({
        provider_id: providerId,
        ...formData,
        verified: false,
      });
      toast.success('Education record added');
      onSuccess();
      onOpenChange(false);
      setFormData({
        education_level: 'bachelors',
        degree_name: '',
        major: '',
        institution_name: '',
        institution_country: 'Zimbabwe',
        graduation_date: '',
        status: 'completed',
      });
    } catch (error) {
      console.error('Failed to add education:', error);
      toast.error('Failed to add education record');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Education / Qualification</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Education Level *</Label>
              <Select value={formData.education_level} onValueChange={(v) => setFormData(p => ({ ...p, education_level: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="certificate">Certificate</SelectItem>
                  <SelectItem value="diploma">Diploma</SelectItem>
                  <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                  <SelectItem value="masters">Master's Degree</SelectItem>
                  <SelectItem value="doctorate">Doctorate (PhD)</SelectItem>
                  <SelectItem value="fellowship">Fellowship</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status *</Label>
              <Select value={formData.status} onValueChange={(v: 'completed' | 'in_progress' | 'incomplete') => setFormData(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EDUCATION_STATUS_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Degree / Qualification Name *</Label>
            <Input
              value={formData.degree_name}
              onChange={(e) => setFormData(p => ({ ...p, degree_name: e.target.value }))}
              placeholder="e.g. Bachelor of Medicine and Surgery (MBChB)"
            />
          </div>
          <div className="space-y-2">
            <Label>Major / Specialization</Label>
            <Input
              value={formData.major}
              onChange={(e) => setFormData(p => ({ ...p, major: e.target.value }))}
              placeholder="e.g. Internal Medicine"
            />
          </div>
          <div className="space-y-2">
            <Label>Institution Name *</Label>
            <Input
              value={formData.institution_name}
              onChange={(e) => setFormData(p => ({ ...p, institution_name: e.target.value }))}
              placeholder="e.g. University of Zimbabwe"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Country</Label>
              <Input
                value={formData.institution_country}
                onChange={(e) => setFormData(p => ({ ...p, institution_country: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Graduation Date</Label>
              <Input
                type="date"
                value={formData.graduation_date}
                onChange={(e) => setFormData(p => ({ ...p, graduation_date: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// ADD TRAINING FORM
// ==========================================

export function AddTrainingDialog({ providerId, open, onOpenChange, onSuccess }: FormDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    training_name: '',
    training_type: 'cpd',
    training_provider: '',
    start_date: '',
    end_date: '',
    duration_hours: '',
    certificate_received: false,
    status: 'completed' as const,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.training_name || !formData.training_provider || !formData.start_date) {
      toast.error('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await IHRISService.addTraining({
        provider_id: providerId,
        ...formData,
        duration_hours: formData.duration_hours ? parseInt(formData.duration_hours) : undefined,
      });
      toast.success('Training record added');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to add training:', error);
      toast.error('Failed to add training record');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Training / CPD</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Training Name *</Label>
            <Input
              value={formData.training_name}
              onChange={(e) => setFormData(p => ({ ...p, training_name: e.target.value }))}
              placeholder="e.g. Advanced Cardiac Life Support (ACLS)"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Training Type</Label>
              <Select value={formData.training_type} onValueChange={(v) => setFormData(p => ({ ...p, training_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpd">CPD / CME</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="conference">Conference</SelectItem>
                  <SelectItem value="certification">Certification Course</SelectItem>
                  <SelectItem value="online">Online Course</SelectItem>
                  <SelectItem value="inservice">In-Service Training</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duration (Hours)</Label>
              <Input
                type="number"
                value={formData.duration_hours}
                onChange={(e) => setFormData(p => ({ ...p, duration_hours: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Training Provider *</Label>
            <Input
              value={formData.training_provider}
              onChange={(e) => setFormData(p => ({ ...p, training_provider: e.target.value }))}
              placeholder="e.g. American Heart Association"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Input type="date" value={formData.start_date} onChange={(e) => setFormData(p => ({ ...p, start_date: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={formData.end_date} onChange={(e) => setFormData(p => ({ ...p, end_date: e.target.value }))} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="cert"
              checked={formData.certificate_received}
              onCheckedChange={(c) => setFormData(p => ({ ...p, certificate_received: !!c }))}
            />
            <Label htmlFor="cert">Certificate Received</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// ADD EMPLOYMENT HISTORY FORM
// ==========================================

export function AddEmploymentDialog({ providerId, open, onOpenChange, onSuccess }: FormDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    employer_name: '',
    employer_type: 'government' as 'government' | 'private' | 'ngo' | 'international',
    position_title: '',
    department: '',
    country: 'Zimbabwe',
    start_date: '',
    end_date: '',
    is_current: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employer_name || !formData.position_title || !formData.start_date) {
      toast.error('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await IHRISService.addEmploymentHistory({
        provider_id: providerId,
        ...formData,
        verified: false,
      });
      toast.success('Employment record added');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to add employment:', error);
      toast.error('Failed to add employment record');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Work Experience</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Employer / Organization *</Label>
            <Input
              value={formData.employer_name}
              onChange={(e) => setFormData(p => ({ ...p, employer_name: e.target.value }))}
              placeholder="e.g. Parirenyatwa Group of Hospitals"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Employer Type</Label>
              <Select value={formData.employer_type} onValueChange={(v: 'government' | 'private' | 'ngo' | 'international') => setFormData(p => ({ ...p, employer_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EMPLOYER_TYPE_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Input value={formData.department} onChange={(e) => setFormData(p => ({ ...p, department: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Position / Job Title *</Label>
            <Input
              value={formData.position_title}
              onChange={(e) => setFormData(p => ({ ...p, position_title: e.target.value }))}
              placeholder="e.g. Registrar"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Input type="date" value={formData.start_date} onChange={(e) => setFormData(p => ({ ...p, start_date: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={formData.end_date} onChange={(e) => setFormData(p => ({ ...p, end_date: e.target.value }))} disabled={formData.is_current} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="current" checked={formData.is_current} onCheckedChange={(c) => setFormData(p => ({ ...p, is_current: !!c, end_date: '' }))} />
            <Label htmlFor="current">Currently working here</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// ADD LEAVE FORM
// ==========================================

export function AddLeaveDialog({ providerId, open, onOpenChange, onSuccess }: FormDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    days_requested: '',
    reason: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.start_date || !formData.end_date || !formData.days_requested) {
      toast.error('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await IHRISService.addLeave({
        provider_id: providerId,
        leave_type: formData.leave_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        days_requested: parseInt(formData.days_requested),
        reason: formData.reason || undefined,
        status: 'pending',
      });
      toast.success('Leave request added');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to add leave:', error);
      toast.error('Failed to add leave request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Leave Request</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Leave Type *</Label>
            <Select value={formData.leave_type} onValueChange={(v) => setFormData(p => ({ ...p, leave_type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="annual">Annual Leave</SelectItem>
                <SelectItem value="sick">Sick Leave</SelectItem>
                <SelectItem value="maternity">Maternity Leave</SelectItem>
                <SelectItem value="paternity">Paternity Leave</SelectItem>
                <SelectItem value="compassionate">Compassionate Leave</SelectItem>
                <SelectItem value="study">Study Leave</SelectItem>
                <SelectItem value="unpaid">Unpaid Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Input type="date" value={formData.start_date} onChange={(e) => setFormData(p => ({ ...p, start_date: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>End Date *</Label>
              <Input type="date" value={formData.end_date} onChange={(e) => setFormData(p => ({ ...p, end_date: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Days Requested *</Label>
            <Input type="number" value={formData.days_requested} onChange={(e) => setFormData(p => ({ ...p, days_requested: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea value={formData.reason} onChange={(e) => setFormData(p => ({ ...p, reason: e.target.value }))} rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// ADD DISCIPLINARY FORM
// ==========================================

export function AddDisciplinaryDialog({ providerId, open, onOpenChange, onSuccess }: FormDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    incident_date: '',
    incident_type: 'misconduct' as 'misconduct' | 'negligence' | 'absenteeism' | 'insubordination' | 'fraud' | 'harassment',
    description: '',
    action_type: 'written_warning' as 'verbal_warning' | 'written_warning' | 'suspension' | 'demotion' | 'termination' | 'counseling',
    action_date: '',
    action_duration_days: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.incident_date || !formData.description || !formData.action_date) {
      toast.error('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await IHRISService.addDisciplinary({
        provider_id: providerId,
        incident_date: formData.incident_date,
        incident_type: formData.incident_type,
        description: formData.description,
        action_type: formData.action_type,
        action_date: formData.action_date,
        action_duration_days: formData.action_duration_days ? parseInt(formData.action_duration_days) : undefined,
        status: 'active',
        appeal_filed: false,
      });
      toast.success('Disciplinary record added');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to add disciplinary:', error);
      toast.error('Failed to add disciplinary record');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Disciplinary Record</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Incident Date *</Label>
              <Input type="date" value={formData.incident_date} onChange={(e) => setFormData(p => ({ ...p, incident_date: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Incident Type *</Label>
              <Select value={formData.incident_type} onValueChange={(v: 'misconduct' | 'negligence' | 'absenteeism' | 'insubordination' | 'fraud' | 'harassment') => setFormData(p => ({ ...p, incident_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INCIDENT_TYPE_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Action Type *</Label>
              <Select value={formData.action_type} onValueChange={(v: 'verbal_warning' | 'written_warning' | 'suspension' | 'demotion' | 'termination' | 'counseling') => setFormData(p => ({ ...p, action_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DISCIPLINARY_ACTION_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Action Date *</Label>
              <Input type="date" value={formData.action_date} onChange={(e) => setFormData(p => ({ ...p, action_date: e.target.value }))} />
            </div>
          </div>
          {formData.action_type === 'suspension' && (
            <div className="space-y-2">
              <Label>Suspension Duration (Days)</Label>
              <Input type="number" value={formData.action_duration_days} onChange={(e) => setFormData(p => ({ ...p, action_duration_days: e.target.value }))} />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting} variant="destructive">
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// ADD PERFORMANCE EVALUATION FORM
// ==========================================

export function AddPerformanceDialog({ providerId, open, onOpenChange, onSuccess }: FormDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    evaluation_period: '',
    start_date: '',
    end_date: '',
    evaluator_name: '',
    overall_score: '',
    comments: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.evaluation_period || !formData.start_date || !formData.end_date) {
      toast.error('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await IHRISService.addPerformance({
        provider_id: providerId,
        evaluation_period: formData.evaluation_period,
        start_date: formData.start_date,
        end_date: formData.end_date,
        evaluator_name: formData.evaluator_name || undefined,
        overall_score: formData.overall_score ? parseFloat(formData.overall_score) : undefined,
        comments: formData.comments || undefined,
        status: 'draft',
      });
      toast.success('Performance evaluation added');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to add performance:', error);
      toast.error('Failed to add performance evaluation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Performance Evaluation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Evaluation Period *</Label>
            <Input
              value={formData.evaluation_period}
              onChange={(e) => setFormData(p => ({ ...p, evaluation_period: e.target.value }))}
              placeholder="e.g. 2024 Q1, Annual 2024"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Period Start *</Label>
              <Input type="date" value={formData.start_date} onChange={(e) => setFormData(p => ({ ...p, start_date: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Period End *</Label>
              <Input type="date" value={formData.end_date} onChange={(e) => setFormData(p => ({ ...p, end_date: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Evaluator Name</Label>
              <Input value={formData.evaluator_name} onChange={(e) => setFormData(p => ({ ...p, evaluator_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Overall Score (0-5)</Label>
              <Input type="number" step="0.1" min="0" max="5" value={formData.overall_score} onChange={(e) => setFormData(p => ({ ...p, overall_score: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Comments</Label>
            <Textarea value={formData.comments} onChange={(e) => setFormData(p => ({ ...p, comments: e.target.value }))} rows={3} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// ADD EMERGENCY CONTACT FORM
// ==========================================

export function AddEmergencyContactDialog({ providerId, open, onOpenChange, onSuccess }: FormDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    contact_name: '',
    relationship: 'spouse' as 'spouse' | 'parent' | 'sibling' | 'child' | 'friend' | 'other',
    phone_primary: '',
    phone_secondary: '',
    email: '',
    country: 'Zimbabwe',
    is_primary: false,
    priority_order: 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.contact_name || !formData.phone_primary) {
      toast.error('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await IHRISService.addEmergencyContact({
        provider_id: providerId,
        ...formData,
      });
      toast.success('Emergency contact added');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to add emergency contact:', error);
      toast.error('Failed to add emergency contact');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Emergency Contact</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Contact Name *</Label>
            <Input value={formData.contact_name} onChange={(e) => setFormData(p => ({ ...p, contact_name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Relationship *</Label>
              <Select value={formData.relationship} onValueChange={(v: 'spouse' | 'parent' | 'sibling' | 'child' | 'friend' | 'other') => setFormData(p => ({ ...p, relationship: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Input type="number" min="1" value={formData.priority_order} onChange={(e) => setFormData(p => ({ ...p, priority_order: parseInt(e.target.value) || 1 }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Primary Phone *</Label>
              <Input value={formData.phone_primary} onChange={(e) => setFormData(p => ({ ...p, phone_primary: e.target.value }))} placeholder="+263..." />
            </div>
            <div className="space-y-2">
              <Label>Secondary Phone</Label>
              <Input value={formData.phone_secondary} onChange={(e) => setFormData(p => ({ ...p, phone_secondary: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="primary" checked={formData.is_primary} onCheckedChange={(c) => setFormData(p => ({ ...p, is_primary: !!c }))} />
            <Label htmlFor="primary">Primary Contact</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
