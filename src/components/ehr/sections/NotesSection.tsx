import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileEdit, Paperclip, Clock, User } from "lucide-react";

const MOCK_NOTES = [
  {
    id: 1,
    type: "Progress Note",
    author: "Dr. Mwangi",
    date: "2024-12-21 10:30",
    preview:
      "Patient continues to improve. UTI symptoms resolving with antibiotic therapy. Blood glucose levels stable.",
  },
  {
    id: 2,
    type: "Nursing Note",
    author: "Nurse Kamau",
    date: "2024-12-21 08:00",
    preview:
      "Morning assessment complete. Vital signs stable. Patient reports decreased pain. Eating and drinking well.",
  },
  {
    id: 3,
    type: "Admission Note",
    author: "Dr. Mwangi",
    date: "2024-12-19 09:15",
    preview:
      "65-year-old female admitted with symptoms of urinary tract infection. History of T2DM and HTN.",
  },
];

const MOCK_ATTACHMENTS = [
  {
    id: 1,
    name: "Chest X-Ray Report.pdf",
    type: "PDF",
    date: "2024-12-19",
    size: "245 KB",
  },
  {
    id: 2,
    name: "Lab Results - BMP.pdf",
    type: "PDF",
    date: "2024-12-20",
    size: "128 KB",
  },
];

export function NotesSection() {
  return (
    <div className="space-y-6">
      {/* Clinical Notes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileEdit className="w-5 h-5 text-primary" />
            Clinical Notes
          </CardTitle>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1" />
            New Note
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {MOCK_NOTES.map((note) => (
              <div
                key={note.id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{note.type}</Badge>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {note.author}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {note.date}
                  </span>
                </div>
                <p className="text-sm text-foreground line-clamp-2">{note.preview}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Attachments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Paperclip className="w-5 h-5 text-primary" />
            Attachments
          </CardTitle>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Upload
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {MOCK_ATTACHMENTS.map((attachment) => (
              <div
                key={attachment.id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                    <Paperclip className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{attachment.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {attachment.date} • {attachment.size}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">{attachment.type}</Badge>
              </div>
            ))}
            <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground">
              Drag and drop files here or click to upload
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
