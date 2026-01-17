import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Download,
  Share2,
  Search,
  Calendar,
  Building2,
  User,
  Eye,
  Filter,
  Folder,
  FileCheck,
  FilePlus,
  FileWarning,
  Clock,
  ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface ClinicalDocument {
  id: string;
  title: string;
  type: "discharge-summary" | "visit-summary" | "lab-report" | "imaging-report" | "referral" | "consent" | "prescription" | "other";
  date: string;
  facility: string;
  author?: string;
  department?: string;
  status: "final" | "preliminary" | "amended";
  size?: string;
  isNew?: boolean;
}

const MOCK_DOCUMENTS: ClinicalDocument[] = [
  {
    id: "1",
    title: "Cardiology Consultation - Visit Summary",
    type: "visit-summary",
    date: "2024-01-18",
    facility: "City General Hospital",
    author: "Dr. Johnson",
    department: "Cardiology",
    status: "final",
    size: "245 KB",
    isNew: true
  },
  {
    id: "2",
    title: "Complete Blood Count (CBC) Results",
    type: "lab-report",
    date: "2024-01-15",
    facility: "PathLab Services",
    status: "final",
    size: "128 KB",
    isNew: true
  },
  {
    id: "3",
    title: "Lipid Panel Results",
    type: "lab-report",
    date: "2024-01-15",
    facility: "PathLab Services",
    status: "final",
    size: "98 KB"
  },
  {
    id: "4",
    title: "Chest X-Ray Report",
    type: "imaging-report",
    date: "2024-01-10",
    facility: "City General Hospital",
    author: "Dr. Williams",
    department: "Radiology",
    status: "final",
    size: "1.2 MB"
  },
  {
    id: "5",
    title: "Discharge Summary - Cardiac Observation",
    type: "discharge-summary",
    date: "2024-01-10",
    facility: "City General Hospital",
    author: "Dr. Smith",
    department: "Cardiology",
    status: "final",
    size: "356 KB"
  },
  {
    id: "6",
    title: "Referral to Endocrinology",
    type: "referral",
    date: "2024-01-05",
    facility: "City General Hospital",
    author: "Dr. Smith",
    status: "final",
    size: "89 KB"
  },
  {
    id: "7",
    title: "Echocardiogram Report",
    type: "imaging-report",
    date: "2023-11-20",
    facility: "City General Hospital",
    author: "Dr. Johnson",
    department: "Cardiology",
    status: "final",
    size: "2.1 MB"
  },
  {
    id: "8",
    title: "Annual Physical Examination Summary",
    type: "visit-summary",
    date: "2023-10-15",
    facility: "Community Clinic",
    author: "Dr. Chen",
    department: "General Medicine",
    status: "final",
    size: "189 KB"
  }
];

const documentTypeLabels: Record<string, string> = {
  "discharge-summary": "Discharge Summary",
  "visit-summary": "Visit Summary",
  "lab-report": "Lab Report",
  "imaging-report": "Imaging Report",
  "referral": "Referral",
  "consent": "Consent Form",
  "prescription": "Prescription",
  "other": "Other"
};

export function ClinicalDocuments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedDocument, setSelectedDocument] = useState<ClinicalDocument | null>(null);

  const filteredDocuments = MOCK_DOCUMENTS.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.facility.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || doc.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const newDocuments = MOCK_DOCUMENTS.filter(d => d.isNew);

  const handleDownload = (doc: ClinicalDocument) => {
    toast.success(`Downloading ${doc.title}...`);
  };

  const handleShare = (doc: ClinicalDocument) => {
    toast.success("Share link generated!");
  };

  return (
    <div className="space-y-6">
      {/* New Documents Alert */}
      {newDocuments.length > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FilePlus className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium">New Documents Available</p>
                <p className="text-sm text-muted-foreground">
                  You have {newDocuments.length} new document(s) since your last visit
                </p>
              </div>
              <Button size="sm" variant="outline">View New</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{MOCK_DOCUMENTS.length}</p>
            <p className="text-xs text-muted-foreground">Total Documents</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">
              {MOCK_DOCUMENTS.filter(d => d.type === "lab-report").length}
            </p>
            <p className="text-xs text-muted-foreground">Lab Reports</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">
              {MOCK_DOCUMENTS.filter(d => d.type === "imaging-report").length}
            </p>
            <p className="text-xs text-muted-foreground">Imaging Reports</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">
              {MOCK_DOCUMENTS.filter(d => d.type === "visit-summary" || d.type === "discharge-summary").length}
            </p>
            <p className="text-xs text-muted-foreground">Summaries</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Tabs value={typeFilter} onValueChange={setTypeFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="lab-report">Labs</TabsTrigger>
            <TabsTrigger value="imaging-report">Imaging</TabsTrigger>
            <TabsTrigger value="visit-summary">Visits</TabsTrigger>
            <TabsTrigger value="discharge-summary">Discharge</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Document List */}
      <ScrollArea className="h-[400px]">
        <div className="space-y-2">
          {filteredDocuments.map((doc) => (
            <DocumentRow 
              key={doc.id} 
              document={doc} 
              onView={() => setSelectedDocument(doc)}
              onDownload={() => handleDownload(doc)}
              onShare={() => handleShare(doc)}
            />
          ))}
          {filteredDocuments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No documents found matching your criteria.
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Document Preview Dialog */}
      <Dialog open={!!selectedDocument} onOpenChange={(open) => !open && setSelectedDocument(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedDocument?.title}</DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {format(new Date(selectedDocument.date), "MMMM dd, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Facility</p>
                  <p className="font-medium">{selectedDocument.facility}</p>
                </div>
                {selectedDocument.author && (
                  <div>
                    <p className="text-muted-foreground">Author</p>
                    <p className="font-medium">{selectedDocument.author}</p>
                  </div>
                )}
                {selectedDocument.department && (
                  <div>
                    <p className="text-muted-foreground">Department</p>
                    <p className="font-medium">{selectedDocument.department}</p>
                  </div>
                )}
              </div>

              <div className="bg-muted rounded-lg p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Document preview</p>
                <p className="text-sm text-muted-foreground">
                  Size: {selectedDocument.size}
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => handleShare(selectedDocument)}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button onClick={() => handleDownload(selectedDocument)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface DocumentRowProps {
  document: ClinicalDocument;
  onView: () => void;
  onDownload: () => void;
  onShare: () => void;
}

function DocumentRow({ document, onView, onDownload, onShare }: DocumentRowProps) {
  const getTypeIcon = () => {
    switch (document.type) {
      case "lab-report": return FileCheck;
      case "imaging-report": return Eye;
      case "discharge-summary": return FileText;
      default: return FileText;
    }
  };

  const Icon = getTypeIcon();

  return (
    <div 
      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
      onClick={onView}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${document.isNew ? "bg-primary/10" : "bg-muted"}`}>
          <Icon className={`h-4 w-4 ${document.isNew ? "text-primary" : "text-muted-foreground"}`} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm">{document.title}</p>
            {document.isNew && (
              <Badge variant="default" className="text-xs">New</Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(document.date), "MMM dd, yyyy")}
            </span>
            <span className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {document.facility}
            </span>
            {document.size && <span>{document.size}</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onShare(); }}>
          <Share2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDownload(); }}>
          <Download className="h-4 w-4" />
        </Button>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
}
