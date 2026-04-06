/**
 * Live SOAP Note Editor
 * Uses database-backed clinical notes with signing workflow
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { DictationButton } from "@/components/ui/dictation-button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  FileText, 
  Save, 
  Clock, 
  CheckCircle, 
  Loader2, 
  PenTool,
  AlertCircle,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import { useClinicalNotes, type NoteType, type NoteInput, NOTE_TYPE_LABELS } from "@/hooks/useClinicalNotes";

interface SOAPNoteFormData {
  note_type: NoteType;
  note_title: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

interface LiveSOAPNoteEditorProps {
  encounterId: string;
  patientId?: string;
  authorId: string;
  authorName?: string;
  authorRole?: string;
}

export function LiveSOAPNoteEditor({ 
  encounterId, 
  patientId,
  authorId,
  authorName,
  authorRole,
}: LiveSOAPNoteEditorProps) {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  
  const { 
    notes, 
    draftNotes,
    isLoading, 
    createNote, 
    updateNote, 
    signNote,
    refetch,
  } = useClinicalNotes({ encounterId });

  const { register, handleSubmit, reset, setValue, watch, formState: { isDirty } } = useForm<SOAPNoteFormData>({
    defaultValues: {
      note_type: 'soap_note',
      note_title: '',
      subjective: '',
      objective: '',
      assessment: '',
      plan: '',
    }
  });

  const selectedNote = notes.find(n => n.id === selectedNoteId);
  const noteType = watch('note_type');

  const loadNote = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      setSelectedNoteId(noteId);
      setValue('note_type', note.note_type);
      setValue('note_title', note.note_title || '');
      setValue('subjective', note.subjective || '');
      setValue('objective', note.objective || '');
      setValue('assessment', note.assessment || '');
      setValue('plan', note.plan || '');
    }
  };

  const onSubmit = async (data: SOAPNoteFormData) => {
    if (selectedNoteId) {
      await updateNote.mutateAsync({
        id: selectedNoteId,
        note_type: data.note_type,
        note_title: data.note_title,
        subjective: data.subjective,
        objective: data.objective,
        assessment: data.assessment,
        plan: data.plan,
      });
    } else {
      const input: NoteInput = {
        encounter_id: encounterId,
        patient_id: patientId,
        note_type: data.note_type,
        note_title: data.note_title || NOTE_TYPE_LABELS[data.note_type],
        subjective: data.subjective,
        objective: data.objective,
        assessment: data.assessment,
        plan: data.plan,
        author_id: authorId,
        author_name: authorName,
        author_role: authorRole,
      };
      await createNote.mutateAsync(input);
      reset();
    }
  };

  const handleSign = async () => {
    if (selectedNoteId) {
      await signNote.mutateAsync({ id: selectedNoteId, signed_by: authorId });
      setSelectedNoteId(null);
      reset();
    }
  };

  const startNewNote = () => {
    setSelectedNoteId(null);
    reset();
  };

  const isSaving = createNote.isPending || updateNote.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Note Editor */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {selectedNote ? 'Edit Clinical Note' : 'New Clinical Note'}
              </CardTitle>
              <div className="flex items-center gap-2">
                {selectedNote && !selectedNote.is_signed && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSign}
                    disabled={signNote.isPending}
                  >
                    {signNote.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <PenTool className="h-4 w-4 mr-2" />
                    )}
                    Sign Note
                  </Button>
                )}
                {selectedNote && (
                  <Button variant="outline" size="sm" onClick={startNewNote}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Note
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Note Type</Label>
                  <Select 
                    value={noteType} 
                    onValueChange={(v) => setValue('note_type', v as NoteType)}
                    disabled={!!selectedNote?.is_signed}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="soap_note">SOAP Note</SelectItem>
                      <SelectItem value="progress_note">Progress Note</SelectItem>
                      <SelectItem value="admission_note">Admission Note</SelectItem>
                      <SelectItem value="consultation_note">Consultation Note</SelectItem>
                      <SelectItem value="procedure_note">Procedure Note</SelectItem>
                      <SelectItem value="discharge_note">Discharge Note</SelectItem>
                      <SelectItem value="nursing_note">Nursing Note</SelectItem>
                      <SelectItem value="daily_note">Daily Note</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Title (optional)</Label>
                  <input 
                    {...register('note_title')}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                    placeholder="Note title..."
                    disabled={!!selectedNote?.is_signed}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="subjective" className="text-base font-semibold text-blue-600">
                    S - Subjective
                  </Label>
                  {!selectedNote?.is_signed && (
                    <DictationButton
                      value={watch('subjective')}
                      onValueChange={(v) => setValue('subjective', v, { shouldDirty: true })}
                      size="sm"
                      className="h-6 w-6"
                    />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  Patient's symptoms, history, and concerns
                </p>
                <Textarea
                  id="subjective"
                  {...register('subjective')}
                  placeholder="Chief complaint, history of present illness..."
                  rows={4}
                  className="resize-none"
                  disabled={!!selectedNote?.is_signed}
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="objective" className="text-base font-semibold text-green-600">
                    O - Objective
                  </Label>
                  {!selectedNote?.is_signed && (
                    <DictationButton
                      value={watch('objective')}
                      onValueChange={(v) => setValue('objective', v, { shouldDirty: true })}
                      size="sm"
                      className="h-6 w-6"
                    />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  Physical examination findings, vitals, test results
                </p>
                <Textarea
                  id="objective"
                  {...register('objective')}
                  placeholder="Vital signs, physical exam findings, lab results..."
                  rows={4}
                  className="resize-none"
                  disabled={!!selectedNote?.is_signed}
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="assessment" className="text-base font-semibold text-orange-600">
                    A - Assessment
                  </Label>
                  {!selectedNote?.is_signed && (
                    <DictationButton
                      value={watch('assessment')}
                      onValueChange={(v) => setValue('assessment', v, { shouldDirty: true })}
                      size="sm"
                      className="h-6 w-6"
                    />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  Diagnosis, differential, clinical reasoning
                </p>
                <Textarea
                  id="assessment"
                  {...register('assessment')}
                  placeholder="Working diagnosis, differential diagnoses..."
                  rows={3}
                  className="resize-none"
                  disabled={!!selectedNote?.is_signed}
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="plan" className="text-base font-semibold text-purple-600">
                    P - Plan
                  </Label>
                  {!selectedNote?.is_signed && (
                    <DictationButton
                      value={watch('plan')}
                      onValueChange={(v) => setValue('plan', v, { shouldDirty: true })}
                      size="sm"
                      className="h-6 w-6"
                    />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  Treatment plan, medications, follow-up
                </p>
                <Textarea
                  id="plan"
                  {...register('plan')}
                  placeholder="Medications, procedures, referrals..."
                  rows={4}
                  className="resize-none"
                  disabled={!!selectedNote?.is_signed}
                />
              </div>

              {!selectedNote?.is_signed && (
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="submit" disabled={isSaving || !isDirty}>
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {selectedNote ? 'Update Note' : 'Save Note'}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Notes List */}
      <div>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Encounter Notes</span>
              {draftNotes.length > 0 && (
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {draftNotes.length} Draft
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="p-4 space-y-2">
                {notes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No notes for this encounter
                  </p>
                ) : (
                  notes.map((note) => (
                    <div
                      key={note.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedNoteId === note.id 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => loadNote(note.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          {NOTE_TYPE_LABELS[note.note_type] || note.note_type}
                        </Badge>
                        {note.is_signed ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Signed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            Draft
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(note.note_datetime), 'MMM d, yyyy HH:mm')}
                      </div>
                      {note.author_name && (
                        <div className="text-xs text-muted-foreground mb-1">
                          By: {note.author_name}
                        </div>
                      )}
                      <p className="text-sm line-clamp-2">
                        {note.assessment || note.subjective || note.content || 'No content'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
