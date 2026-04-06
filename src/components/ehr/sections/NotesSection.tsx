import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, FileEdit, Paperclip, Clock, User, FileText, Stethoscope, 
  Users, ClipboardList, Image, File, Download, Trash2, Eye,
  ChevronDown, ChevronUp, Calendar, Building2, PenSquare, ScanLine, FolderOpen
} from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { SOAPNoteEditor } from "@/components/clinical/SOAPNoteEditor";
import { LiveSOAPNoteEditor } from "@/components/clinical/LiveSOAPNoteEditor";
import { ClinicalDocumentScanner, ScannedDocument } from "@/components/documents/ClinicalDocumentScanner";
import { PatientDocumentsPanel } from "@/components/landela/PatientDocumentsPanel";
import { useEHR } from "@/contexts/EHRContext";
import { toast } from "sonner";

const MOCK_SOAP_NOTES = [
  {
    id: 1,
    author: "Dr. Mwangi",
    role: "Medical Officer",
    date: "2024-12-21 10:30",
    subjective: "Patient reports improved urinary symptoms. No more burning sensation. Still experiencing mild fatigue. Appetite improving.",
    objective: "Temp 36.8°C, BP 128/82, HR 78. Abdomen soft, non-tender. CVA tenderness resolved. Urine clear.",
    assessment: "1. UTI - responding to antibiotics\n2. T2DM - stable on current regimen\n3. HTN - controlled",
    plan: "1. Complete antibiotic course (2 days remaining)\n2. Repeat urinalysis tomorrow\n3. Continue current DM and HTN medications\n4. Discharge planning if labs stable",
  },
  {
    id: 2,
    author: "Dr. Ochieng",
    role: "Consultant Physician",
    date: "2024-12-20 14:00",
    subjective: "Patient complaining of dysuria and frequency. Reports poor glucose control at home. No chest pain or SOB.",
    objective: "Febrile 38.2°C, BP 142/88, HR 92. Suprapubic tenderness. CVA tenderness on right.",
    assessment: "1. Complicated UTI - likely pyelonephritis\n2. T2DM - poorly controlled\n3. HTN - suboptimal control",
    plan: "1. IV Ceftriaxone 1g BD\n2. Blood and urine cultures\n3. Review DM medications\n4. Increase antihypertensive",
  },
];

const MOCK_PROGRESS_NOTES = [
  {
    id: 1,
    type: "Progress Note",
    author: "Dr. Mwangi",
    role: "Medical Officer",
    date: "2024-12-21 10:30",
    content: "Patient continues to improve. UTI symptoms resolving with antibiotic therapy. Blood glucose levels stable with current regimen. Discussed discharge planning with patient and family.",
    tags: ["Improvement", "Discharge Planning"],
  },
  {
    id: 2,
    type: "Nursing Note",
    author: "Nurse Kamau",
    role: "Registered Nurse",
    date: "2024-12-21 08:00",
    content: "Morning assessment complete. Vital signs stable. Patient reports decreased pain (2/10 from 5/10 yesterday). Eating and drinking well. IV site clean and patent. Mobilizing independently.",
    tags: ["Vitals Stable", "Pain Improved"],
  },
  {
    id: 3,
    type: "Physiotherapy Note",
    author: "Mr. Njoroge",
    role: "Physiotherapist",
    date: "2024-12-20 15:00",
    content: "Initial mobility assessment. Patient able to walk 50m with supervision. Recommended gentle mobilization exercises. No respiratory physiotherapy required.",
    tags: ["Mobility Assessment"],
  },
];

const MOCK_WARD_ROUNDS = [
  {
    id: 1,
    date: "2024-12-21 09:00",
    type: "Consultant Round",
    lead: "Dr. Ochieng",
    team: ["Dr. Mwangi", "Nurse Kamau", "Student Wanjiru"],
    summary: "Day 3 of admission. UTI improving clinically. Discussed with team - plan for discharge tomorrow if repeat urinalysis clear. Continue current management.",
    decisions: [
      "Repeat urinalysis and CBC tomorrow AM",
      "Discharge if labs satisfactory",
      "Outpatient follow-up in DM clinic in 2 weeks",
    ],
  },
  {
    id: 2,
    date: "2024-12-20 09:15",
    type: "Consultant Round",
    lead: "Dr. Ochieng",
    team: ["Dr. Mwangi", "Nurse Achieng"],
    summary: "Day 2. Patient still febrile overnight. Blood cultures pending. Urine culture shows E. coli sensitive to ceftriaxone. Continue IV antibiotics.",
    decisions: [
      "Continue Ceftriaxone IV",
      "Monitor temperature 4-hourly",
      "Renal USS if no improvement by Day 3",
    ],
  },
  {
    id: 3,
    date: "2024-12-19 10:00",
    type: "Admission Round",
    lead: "Dr. Mwangi",
    team: ["Nurse Kamau"],
    summary: "65F admitted with complicated UTI. History of T2DM and HTN. Started on empirical IV antibiotics. Awaiting cultures.",
    decisions: [
      "Start IV Ceftriaxone",
      "Blood and urine cultures",
      "Optimize glycemic control",
      "Review in 24 hours",
    ],
  },
];

const MOCK_ATTACHMENTS = [
  {
    id: 1,
    name: "Chest X-Ray Report.pdf",
    type: "pdf",
    category: "Imaging",
    date: "2024-12-19",
    size: "245 KB",
    uploadedBy: "Dr. Mwangi",
  },
  {
    id: 2,
    name: "Lab Results - CBC & UEC.pdf",
    type: "pdf",
    category: "Laboratory",
    date: "2024-12-20",
    size: "128 KB",
    uploadedBy: "Lab System",
  },
  {
    id: 3,
    name: "Previous Discharge Summary.pdf",
    type: "pdf",
    category: "Clinical Documents",
    date: "2024-12-15",
    size: "312 KB",
    uploadedBy: "Records",
  },
  {
    id: 4,
    name: "Wound Photo - Day 1.jpg",
    type: "image",
    category: "Clinical Images",
    date: "2024-12-19",
    size: "1.2 MB",
    uploadedBy: "Nurse Kamau",
  },
  {
    id: 5,
    name: "Referral Letter.pdf",
    type: "pdf",
    category: "Correspondence",
    date: "2024-12-18",
    size: "89 KB",
    uploadedBy: "External",
  },
];

const getFileIcon = (type: string) => {
  switch (type) {
    case "pdf": return <FileText className="w-5 h-5 text-destructive" />;
    case "image": return <Image className="w-5 h-5 text-primary" />;
    default: return <File className="w-5 h-5 text-muted-foreground" />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case "Imaging": return "bg-blue-500/10 text-blue-600 border-blue-200";
    case "Laboratory": return "bg-green-500/10 text-green-600 border-green-200";
    case "Clinical Documents": return "bg-purple-500/10 text-purple-600 border-purple-200";
    case "Clinical Images": return "bg-orange-500/10 text-orange-600 border-orange-200";
    case "Correspondence": return "bg-gray-500/10 text-gray-600 border-gray-200";
    default: return "";
  }
};

export function NotesSection() {
  const [expandedSoap, setExpandedSoap] = useState<number | null>(1);
  const [expandedRound, setExpandedRound] = useState<number | null>(1);
  const { encounterId } = useParams<{ encounterId?: string }>();
  const { currentEncounter } = useEHR();
  const patientId = currentEncounter?.patient?.id;
  const [scannedAttachments, setScannedAttachments] = useState<ScannedDocument[]>([]);

  const handleDocumentScanned = (doc: ScannedDocument) => {
    setScannedAttachments(prev => [...prev, doc]);
    toast.success(`${doc.name} added to attachments`);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="soap-live" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="soap-live" className="flex items-center gap-2">
            <PenSquare className="w-4 h-4" />
            Write Note
          </TabsTrigger>
          <TabsTrigger value="soap" className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4" />
            SOAP Notes
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <FileEdit className="w-4 h-4" />
            Progress Notes
          </TabsTrigger>
          <TabsTrigger value="rounds" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Ward Rounds
          </TabsTrigger>
          <TabsTrigger value="attachments" className="flex items-center gap-2">
            <Paperclip className="w-4 h-4" />
            Attachments
          </TabsTrigger>
        </TabsList>

        {/* Live SOAP Note Editor */}
        <TabsContent value="soap-live" className="space-y-4">
          {encounterId ? (
            <LiveSOAPNoteEditor 
              encounterId={encounterId} 
              authorId="current-user"
              authorName="Current Provider"
              authorRole="Clinician"
            />
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                Select a patient encounter to write SOAP notes
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* SOAP Notes */}
        <TabsContent value="soap" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">SOAP Notes</CardTitle>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                New SOAP Note
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {MOCK_SOAP_NOTES.map((note) => (
                <div
                  key={note.id}
                  className="border rounded-lg overflow-hidden"
                >
                  <div 
                    className="p-4 bg-muted/30 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedSoap(expandedSoap === note.id ? null : note.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Stethoscope className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{note.author}</span>
                          <Badge variant="outline" className="text-xs">{note.role}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {note.date}
                        </div>
                      </div>
                    </div>
                    {expandedSoap === note.id ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>

                  {expandedSoap === note.id && (
                    <div className="p-4 space-y-4 border-t">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-blue-500/10 text-blue-600 flex items-center justify-center text-xs font-bold">S</span>
                            <span className="font-medium text-sm">Subjective</span>
                          </div>
                          <p className="text-sm text-muted-foreground pl-8">{note.subjective}</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-green-500/10 text-green-600 flex items-center justify-center text-xs font-bold">O</span>
                            <span className="font-medium text-sm">Objective</span>
                          </div>
                          <p className="text-sm text-muted-foreground pl-8">{note.objective}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-orange-500/10 text-orange-600 flex items-center justify-center text-xs font-bold">A</span>
                            <span className="font-medium text-sm">Assessment</span>
                          </div>
                          <p className="text-sm text-muted-foreground pl-8 whitespace-pre-line">{note.assessment}</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-purple-500/10 text-purple-600 flex items-center justify-center text-xs font-bold">P</span>
                            <span className="font-medium text-sm">Plan</span>
                          </div>
                          <p className="text-sm text-muted-foreground pl-8 whitespace-pre-line">{note.plan}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Button variant="outline" size="sm">
                          <FileEdit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          <Plus className="w-3 h-3 mr-1" />
                          Addendum
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Quick SOAP Entry */}
              <div className="border rounded-lg p-4 bg-muted/20">
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Quick SOAP Entry
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Subjective</label>
                    <Textarea placeholder="Patient reports..." className="mt-1 h-20 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Objective</label>
                    <Textarea placeholder="On examination..." className="mt-1 h-20 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Assessment</label>
                    <Textarea placeholder="1. Diagnosis..." className="mt-1 h-20 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Plan</label>
                    <Textarea placeholder="1. Continue..." className="mt-1 h-20 text-sm" />
                  </div>
                </div>
                <div className="flex justify-end mt-3">
                  <Button size="sm">Save SOAP Note</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Progress Notes */}
        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Progress Notes</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="cursor-pointer hover:bg-muted">All</Badge>
                <Badge variant="secondary" className="cursor-pointer">Medical</Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-muted">Nursing</Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-muted">Allied</Badge>
                <Button size="sm" className="ml-2">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Note
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {MOCK_PROGRESS_NOTES.map((note) => (
                <div
                  key={note.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{note.type}</Badge>
                        <span className="text-sm font-medium">{note.author}</span>
                        <span className="text-xs text-muted-foreground">({note.role})</span>
                      </div>
                      <p className="text-sm text-foreground mb-2">{note.content}</p>
                      <div className="flex items-center gap-2">
                        {note.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {note.date}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Quick Note Entry */}
              <div className="border border-dashed rounded-lg p-4">
                <Textarea 
                  placeholder="Type a quick progress note..." 
                  className="min-h-[80px] mb-2"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                      Progress Note
                    </Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                      Nursing Note
                    </Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                      Handover
                    </Badge>
                  </div>
                  <Button size="sm">Add Note</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ward Rounds */}
        <TabsContent value="rounds" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Ward Round Documentation</CardTitle>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Document Round
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {MOCK_WARD_ROUNDS.map((round) => (
                <div
                  key={round.id}
                  className="border rounded-lg overflow-hidden"
                >
                  <div 
                    className="p-4 bg-muted/30 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedRound(expandedRound === round.id ? null : round.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{round.type}</Badge>
                          <span className="font-medium">Led by {round.lead}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Calendar className="w-3 h-3" />
                          {round.date}
                          <span className="mx-1">•</span>
                          <Users className="w-3 h-3" />
                          {round.team.length} team members
                        </div>
                      </div>
                    </div>
                    {expandedRound === round.id ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>

                  {expandedRound === round.id && (
                    <div className="p-4 space-y-4 border-t">
                      <div>
                        <h5 className="text-xs font-medium text-muted-foreground mb-1">Team Present</h5>
                        <div className="flex flex-wrap gap-2">
                          {round.team.map((member, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              <User className="w-3 h-3 mr-1" />
                              {member}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h5 className="text-xs font-medium text-muted-foreground mb-1">Summary</h5>
                        <p className="text-sm">{round.summary}</p>
                      </div>

                      <div>
                        <h5 className="text-xs font-medium text-muted-foreground mb-2">Decisions & Actions</h5>
                        <div className="space-y-2">
                          {round.decisions.map((decision, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <ClipboardList className="w-4 h-4 text-primary mt-0.5" />
                              <span className="text-sm">{decision}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Button variant="outline" size="sm">
                          <FileEdit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          <Plus className="w-3 h-3 mr-1" />
                          Add Follow-up
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attachments */}
        <TabsContent value="attachments" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Documents & Attachments</CardTitle>
              <div className="flex gap-2">
                <ClinicalDocumentScanner
                  variant="button"
                  context="encounter"
                  onDocumentScanned={handleDocumentScanned}
                  buttonLabel="Scan"
                />
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  Upload
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Category Filter */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <Badge variant="secondary" className="cursor-pointer">All Files</Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-muted">Imaging</Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-muted">Laboratory</Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-muted">Clinical Documents</Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-muted">Clinical Images</Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-muted">Correspondence</Badge>
              </div>

              <div className="space-y-2">
                {MOCK_ATTACHMENTS.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="p-3 border rounded-lg hover:bg-muted/50 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                        {getFileIcon(attachment.type)}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{attachment.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{attachment.date}</span>
                          <span>•</span>
                          <span>{attachment.size}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {attachment.uploadedBy}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs ${getCategoryColor(attachment.category)}`}>
                        {attachment.category}
                      </Badge>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Upload Zone */}
              <div className="mt-4 p-6 border-2 border-dashed rounded-lg text-center hover:bg-muted/30 transition-colors cursor-pointer">
                <Paperclip className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Drag and drop files here</p>
                <p className="text-xs text-muted-foreground mt-1">
                  or click to browse • PDF, JPG, PNG up to 10MB
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
