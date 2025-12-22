import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  FileText,
  Download,
  Search,
  Calendar,
  Activity,
  Pill,
  AlertTriangle,
  Syringe,
  Eye,
  ChevronRight,
  Filter,
  Printer
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface MedicalRecord {
  id: string;
  type: "encounter" | "lab" | "imaging" | "procedure";
  title: string;
  date: string;
  provider: string;
  department: string;
  summary?: string;
}

interface Allergy {
  id: string;
  allergen: string;
  reaction: string;
  severity: "mild" | "moderate" | "severe";
  verifiedDate: string;
}

interface Immunization {
  id: string;
  vaccine: string;
  date: string;
  dueDate?: string;
  status: "completed" | "due" | "overdue";
  administrator?: string;
}

const MOCK_RECORDS: MedicalRecord[] = [
  { id: "1", type: "encounter", title: "Annual Physical Examination", date: "2024-01-10", provider: "Dr. Smith", department: "General Medicine", summary: "Routine checkup, all vitals normal" },
  { id: "2", type: "lab", title: "Complete Blood Count (CBC)", date: "2024-01-10", provider: "Lab Services", department: "Laboratory", summary: "All values within normal range" },
  { id: "3", type: "imaging", title: "Chest X-Ray", date: "2023-12-15", provider: "Dr. Johnson", department: "Radiology", summary: "No abnormalities detected" },
  { id: "4", type: "encounter", title: "Follow-up Cardiology Visit", date: "2023-12-01", provider: "Dr. Johnson", department: "Cardiology", summary: "Blood pressure stable on current medication" },
  { id: "5", type: "procedure", title: "Echocardiogram", date: "2023-11-20", provider: "Dr. Johnson", department: "Cardiology", summary: "Normal cardiac function" },
  { id: "6", type: "lab", title: "Lipid Panel", date: "2023-11-15", provider: "Lab Services", department: "Laboratory", summary: "Cholesterol slightly elevated" },
];

const MOCK_ALLERGIES: Allergy[] = [
  { id: "1", allergen: "Penicillin", reaction: "Hives, Swelling", severity: "severe", verifiedDate: "2020-03-15" },
  { id: "2", allergen: "Sulfa Drugs", reaction: "Rash", severity: "moderate", verifiedDate: "2019-08-22" },
  { id: "3", allergen: "Peanuts", reaction: "Anaphylaxis", severity: "severe", verifiedDate: "2018-01-10" },
];

const MOCK_IMMUNIZATIONS: Immunization[] = [
  { id: "1", vaccine: "COVID-19 Booster", date: "2023-10-15", status: "completed", administrator: "Nurse Thompson" },
  { id: "2", vaccine: "Influenza (Flu)", date: "2023-09-20", status: "completed", administrator: "Nurse Wilson" },
  { id: "3", vaccine: "Tetanus (Tdap)", date: "2020-05-10", dueDate: "2030-05-10", status: "completed" },
  { id: "4", vaccine: "Shingles (Shingrix)", dueDate: "2024-03-01", date: "", status: "due" },
];

export function HealthRecordsViewer() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredRecords = MOCK_RECORDS.filter(record => {
    const matchesSearch = record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.provider.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === "all" || record.type === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "severe": return "bg-destructive text-destructive-foreground";
      case "moderate": return "bg-warning text-warning-foreground";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const getRecordIcon = (type: string) => {
    switch (type) {
      case "lab": return Activity;
      case "imaging": return Eye;
      case "procedure": return Syringe;
      default: return FileText;
    }
  };

  const downloadRecord = (record: MedicalRecord) => {
    toast.success(`Downloading ${record.title}...`);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm" className="flex gap-2">
            <Download className="h-4 w-4" />
            Export All
          </Button>
        </div>
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList>
          <TabsTrigger value="all">All Records</TabsTrigger>
          <TabsTrigger value="encounter">Visits</TabsTrigger>
          <TabsTrigger value="lab">Lab Results</TabsTrigger>
          <TabsTrigger value="imaging">Imaging</TabsTrigger>
          <TabsTrigger value="procedure">Procedures</TabsTrigger>
        </TabsList>

        <TabsContent value={activeCategory} className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Records List */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Medical Records</CardTitle>
                <CardDescription>{filteredRecords.length} records found</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {filteredRecords.map(record => {
                      const Icon = getRecordIcon(record.type);
                      return (
                        <div
                          key={record.id}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => setSelectedRecord(record)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{record.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {record.provider} • {format(new Date(record.date), 'MMM dd, yyyy')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={(e) => {
                              e.stopPropagation();
                              downloadRecord(record);
                            }}>
                              <Download className="h-4 w-4" />
                            </Button>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Side Panel */}
            <div className="space-y-4">
              {/* Allergies */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    Allergies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {MOCK_ALLERGIES.map(allergy => (
                      <div key={allergy.id} className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium">{allergy.allergen}</p>
                          <p className="text-xs text-muted-foreground">{allergy.reaction}</p>
                        </div>
                        <Badge className={getSeverityColor(allergy.severity)}>
                          {allergy.severity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Immunizations */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Syringe className="h-4 w-4 text-primary" />
                    Immunizations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {MOCK_IMMUNIZATIONS.map(imm => (
                      <div key={imm.id} className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium">{imm.vaccine}</p>
                          <p className="text-xs text-muted-foreground">
                            {imm.status === "due" ? `Due: ${imm.dueDate}` : imm.date}
                          </p>
                        </div>
                        <Badge variant={imm.status === "due" ? "outline" : "secondary"}>
                          {imm.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Record Detail Dialog */}
      <Dialog open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedRecord?.title}</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">{format(new Date(selectedRecord.date), 'MMMM dd, yyyy')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Provider</p>
                  <p className="font-medium">{selectedRecord.provider}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Department</p>
                  <p className="font-medium">{selectedRecord.department}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{selectedRecord.type}</p>
                </div>
              </div>
              
              <div>
                <p className="text-muted-foreground text-sm mb-2">Summary</p>
                <p className="text-sm bg-muted p-3 rounded-lg">{selectedRecord.summary}</p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => downloadRecord(selectedRecord)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline">
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
