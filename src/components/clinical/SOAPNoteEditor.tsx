import { useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { DictationButton } from "@/components/ui/dictation-button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { FileText, Save, Clock, CheckCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface SOAPNoteFormData {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

interface SOAPNote {
  id: string;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  is_signed: boolean;
  created_at: string;
  author_id: string | null;
}

interface SOAPNoteEditorProps {
  encounterId: string;
  existingNotes?: SOAPNote[];
  onNoteSaved?: () => void;
}

export function SOAPNoteEditor({ encounterId, existingNotes = [], onNoteSaved }: SOAPNoteEditorProps) {
  const [saving, setSaving] = useState(false);
  const [selectedNote, setSelectedNote] = useState<SOAPNote | null>(null);
  
  const { register, handleSubmit, reset, setValue, watch, formState: { isDirty } } = useForm<SOAPNoteFormData>({
    defaultValues: {
      subjective: '',
      objective: '',
      assessment: '',
      plan: '',
    }
  });

  const loadNote = (note: SOAPNote) => {
    setSelectedNote(note);
    setValue('subjective', note.subjective || '');
    setValue('objective', note.objective || '');
    setValue('assessment', note.assessment || '');
    setValue('plan', note.plan || '');
  };

  const onSubmit = async (data: SOAPNoteFormData) => {
    setSaving(true);
    try {
      if (selectedNote) {
        // Update existing note
        const { error } = await supabase
          .from('clinical_notes')
          .update({
            subjective: data.subjective,
            objective: data.objective,
            assessment: data.assessment,
            plan: data.plan,
          })
          .eq('id', selectedNote.id);
        
        if (error) throw error;
        toast.success('Note updated successfully');
      } else {
        // Create new note
        const { error } = await supabase
          .from('clinical_notes')
          .insert({
            encounter_id: encounterId,
            note_type: 'soap',
            subjective: data.subjective,
            objective: data.objective,
            assessment: data.assessment,
            plan: data.plan,
          });
        
        if (error) throw error;
        toast.success('SOAP note saved successfully');
        reset();
      }
      
      onNoteSaved?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const signNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('clinical_notes')
        .update({
          is_signed: true,
          signed_at: new Date().toISOString(),
        })
        .eq('id', noteId);
      
      if (error) throw error;
      toast.success('Note signed successfully');
      onNoteSaved?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign note');
    }
  };

  const startNewNote = () => {
    setSelectedNote(null);
    reset();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Note Editor */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {selectedNote ? 'Edit SOAP Note' : 'New SOAP Note'}
              </CardTitle>
              {selectedNote && (
                <Button variant="outline" size="sm" onClick={startNewNote}>
                  New Note
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="subjective" className="text-base font-semibold text-blue-600">
                    S - Subjective
                  </Label>
                  <DictationButton
                    value={watch('subjective')}
                    onValueChange={(v) => setValue('subjective', v, { shouldDirty: true })}
                    size="sm"
                    className="h-6 w-6"
                  />
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  Patient's symptoms, history, and concerns in their own words
                </p>
                <Textarea
                  id="subjective"
                  {...register('subjective')}
                  placeholder="Chief complaint, history of present illness, review of systems..."
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="objective" className="text-base font-semibold text-green-600">
                    O - Objective
                  </Label>
                  <DictationButton
                    value={watch('objective')}
                    onValueChange={(v) => setValue('objective', v, { shouldDirty: true })}
                    size="sm"
                    className="h-6 w-6"
                  />
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  Physical examination findings, vital signs, test results
                </p>
                <Textarea
                  id="objective"
                  {...register('objective')}
                  placeholder="Vital signs, physical exam findings, lab results, imaging..."
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="assessment" className="text-base font-semibold text-orange-600">
                    A - Assessment
                  </Label>
                  <DictationButton
                    value={watch('assessment')}
                    onValueChange={(v) => setValue('assessment', v, { shouldDirty: true })}
                    size="sm"
                    className="h-6 w-6"
                  />
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  Diagnosis, differential diagnoses, clinical reasoning
                </p>
                <Textarea
                  id="assessment"
                  {...register('assessment')}
                  placeholder="Working diagnosis, differential diagnoses, clinical impression..."
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="plan" className="text-base font-semibold text-purple-600">
                    P - Plan
                  </Label>
                  <DictationButton
                    value={watch('plan')}
                    onValueChange={(v) => setValue('plan', v, { shouldDirty: true })}
                    size="sm"
                    className="h-6 w-6"
                  />
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  Treatment plan, medications, follow-up, patient education
                </p>
                <Textarea
                  id="plan"
                  {...register('plan')}
                  placeholder="Medications, procedures, referrals, follow-up appointments..."
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="submit" disabled={saving || !isDirty}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Note
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Previous Notes */}
      <div>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Previous Notes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="p-4 space-y-2">
                {existingNotes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No previous notes for this encounter
                  </p>
                ) : (
                  existingNotes.map((note) => (
                    <div
                      key={note.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedNote?.id === note.id 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => loadNote(note)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(note.created_at), 'MMM d, yyyy HH:mm')}
                          </span>
                        </div>
                        {note.is_signed ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Signed
                          </Badge>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              signNote(note.id);
                            }}
                          >
                            Sign
                          </Button>
                        )}
                      </div>
                      <p className="text-sm line-clamp-2">
                        {note.assessment || note.subjective || 'No content'}
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
