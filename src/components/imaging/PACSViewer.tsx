import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Ruler,
  Circle,
  Square,
  Pencil,
  Download,
  Share2,
  Printer,
  Grid3X3,
  Maximize2,
  SunMedium,
  Contrast,
  Move,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Layers,
  FileImage,
  Info,
  Settings,
  Eye,
  EyeOff
} from "lucide-react";

// Mock DICOM studies
const mockStudies = [
  {
    id: "STD001",
    patientName: "Sarah M. Johnson",
    patientId: "MRN-2024-001847",
    studyDate: "2024-12-20",
    modality: "CT",
    description: "CT Chest with Contrast",
    bodyPart: "Chest",
    images: 156,
    series: 4,
    status: "completed",
    accession: "ACC-2024-5847"
  },
  {
    id: "STD002",
    patientName: "James K. Ochieng",
    patientId: "MRN-2024-001832",
    studyDate: "2024-12-19",
    modality: "MRI",
    description: "MRI Brain without Contrast",
    bodyPart: "Head",
    images: 240,
    series: 6,
    status: "completed",
    accession: "ACC-2024-5832"
  },
  {
    id: "STD003",
    patientName: "Mary W. Njeri",
    patientId: "MRN-2024-001856",
    studyDate: "2024-12-20",
    modality: "XR",
    description: "X-Ray Chest PA/Lateral",
    bodyPart: "Chest",
    images: 2,
    series: 1,
    status: "pending_read",
    accession: "ACC-2024-5856"
  },
  {
    id: "STD004",
    patientName: "Peter M. Kamau",
    patientId: "MRN-2024-001801",
    studyDate: "2024-12-18",
    modality: "US",
    description: "Ultrasound Abdomen Complete",
    bodyPart: "Abdomen",
    images: 45,
    series: 2,
    status: "completed",
    accession: "ACC-2024-5801"
  },
];

const mockSeries = [
  { id: "SER001", name: "Axial", images: 52, thickness: "3mm" },
  { id: "SER002", name: "Coronal", images: 38, thickness: "3mm" },
  { id: "SER003", name: "Sagittal", images: 34, thickness: "3mm" },
  { id: "SER004", name: "3D Reconstruction", images: 32, thickness: "1mm" },
];

export function PACSViewer() {
  const [selectedStudy, setSelectedStudy] = useState(mockStudies[0]);
  const [selectedSeries, setSelectedSeries] = useState(mockSeries[0]);
  const [currentImage, setCurrentImage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [brightness, setBrightness] = useState(50);
  const [contrast, setContrast] = useState(50);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewMode, setViewMode] = useState<"1x1" | "2x2" | "1x2">("1x1");
  const [activeTool, setActiveTool] = useState<string>("pan");
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalityFilter, setModalityFilter] = useState<string>("all");

  const getModalityBadgeColor = (modality: string) => {
    switch (modality) {
      case "CT": return "bg-blue-500";
      case "MRI": return "bg-purple-500";
      case "XR": return "bg-green-500";
      case "US": return "bg-orange-500";
      default: return "bg-muted";
    }
  };

  const tools = [
    { id: "pan", icon: Move, label: "Pan" },
    { id: "zoom", icon: ZoomIn, label: "Zoom" },
    { id: "window", icon: SunMedium, label: "Window/Level" },
    { id: "measure", icon: Ruler, label: "Measure" },
    { id: "circle", icon: Circle, label: "Circle ROI" },
    { id: "rectangle", icon: Square, label: "Rectangle ROI" },
    { id: "annotate", icon: Pencil, label: "Annotate" },
  ];

  const filteredStudies = mockStudies.filter(study => {
    const matchesSearch = study.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      study.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      study.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModality = modalityFilter === "all" || study.modality === modalityFilter;
    return matchesSearch && matchesModality;
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-workspace-header border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">PACS Imaging Viewer</h1>
            <Badge variant="outline">{selectedStudy.modality}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-1" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <Printer className="w-4 h-4 mr-1" />
              Print
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Study List */}
        <div className="w-80 border-r border-border flex flex-col">
          <div className="p-3 border-b border-border space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search studies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={modalityFilter} onValueChange={setModalityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by modality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modalities</SelectItem>
                <SelectItem value="CT">CT</SelectItem>
                <SelectItem value="MRI">MRI</SelectItem>
                <SelectItem value="XR">X-Ray</SelectItem>
                <SelectItem value="US">Ultrasound</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {filteredStudies.map((study) => (
                <Card
                  key={study.id}
                  className={`cursor-pointer transition-all hover:border-primary ${
                    selectedStudy.id === study.id ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => setSelectedStudy(study)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={`${getModalityBadgeColor(study.modality)} text-white`}>
                        {study.modality}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{study.studyDate}</span>
                    </div>
                    <h4 className="font-medium text-sm">{study.patientName}</h4>
                    <p className="text-xs text-muted-foreground">{study.patientId}</p>
                    <p className="text-xs text-muted-foreground mt-1">{study.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Layers className="w-3 h-3" />
                      <span>{study.series} series</span>
                      <FileImage className="w-3 h-3 ml-2" />
                      <span>{study.images} images</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          {/* Series Panel */}
          <div className="border-t border-border">
            <div className="p-3">
              <h3 className="text-sm font-medium mb-2">Series</h3>
              <div className="space-y-1">
                {mockSeries.map((series) => (
                  <div
                    key={series.id}
                    className={`p-2 rounded cursor-pointer text-sm transition-colors ${
                      selectedSeries.id === series.id
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setSelectedSeries(series)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{series.name}</span>
                      <span className="text-xs text-muted-foreground">{series.images} imgs</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{series.thickness}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Viewer */}
        <div className="flex-1 flex flex-col bg-black">
          {/* Toolbar */}
          <div className="bg-zinc-900 border-b border-zinc-700 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-1">
              {tools.map((tool) => (
                <Button
                  key={tool.id}
                  variant={activeTool === tool.id ? "secondary" : "ghost"}
                  size="sm"
                  className={activeTool === tool.id ? "bg-primary text-primary-foreground" : "text-zinc-400 hover:text-white"}
                  onClick={() => setActiveTool(tool.id)}
                  title={tool.label}
                >
                  <tool.icon className="w-4 h-4" />
                </Button>
              ))}
              <div className="w-px h-6 bg-zinc-700 mx-2" />
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                <RotateCw className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                <FlipHorizontal className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                <FlipVertical className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "1x1" ? "secondary" : "ghost"}
                  size="sm"
                  className={viewMode === "1x1" ? "" : "text-zinc-400"}
                  onClick={() => setViewMode("1x1")}
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "1x2" ? "secondary" : "ghost"}
                  size="sm"
                  className={viewMode === "1x2" ? "" : "text-zinc-400"}
                  onClick={() => setViewMode("1x2")}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "2x2" ? "secondary" : "ghost"}
                  size="sm"
                  className={viewMode === "2x2" ? "" : "text-zinc-400"}
                  onClick={() => setViewMode("2x2")}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className={showAnnotations ? "text-primary" : "text-zinc-400"}
                onClick={() => setShowAnnotations(!showAnnotations)}
              >
                {showAnnotations ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Viewer Area */}
          <div className="flex-1 relative flex items-center justify-center">
            {/* Simulated DICOM Image */}
            <div 
              className="relative bg-zinc-800 rounded-lg overflow-hidden"
              style={{
                width: viewMode === "1x1" ? "80%" : viewMode === "1x2" ? "45%" : "45%",
                height: viewMode === "1x1" ? "85%" : "45%",
                filter: `brightness(${brightness / 50}) contrast(${contrast / 50})`,
                transform: `scale(${zoom / 100})`
              }}
            >
              {/* Placeholder for actual DICOM rendering */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-zinc-500">
                  <FileImage className="w-24 h-24 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">{selectedStudy.description}</p>
                  <p className="text-sm">{selectedSeries.name} - Image {currentImage}/{selectedSeries.images}</p>
                </div>
              </div>

              {/* DICOM Overlay Info */}
              <div className="absolute top-4 left-4 text-xs text-green-400 font-mono space-y-1">
                <p>{selectedStudy.patientName}</p>
                <p>{selectedStudy.patientId}</p>
                <p>{selectedStudy.studyDate}</p>
              </div>
              <div className="absolute top-4 right-4 text-xs text-green-400 font-mono text-right space-y-1">
                <p>{selectedStudy.modality}</p>
                <p>{selectedStudy.bodyPart}</p>
                <p>ACC: {selectedStudy.accession}</p>
              </div>
              <div className="absolute bottom-4 left-4 text-xs text-green-400 font-mono space-y-1">
                <p>W: {brightness * 40} L: {contrast * 20}</p>
                <p>Zoom: {zoom}%</p>
              </div>
              <div className="absolute bottom-4 right-4 text-xs text-green-400 font-mono text-right">
                <p>Im: {currentImage}/{selectedSeries.images}</p>
                <p>Se: {selectedSeries.name}</p>
              </div>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="bg-zinc-900 border-t border-zinc-700 px-4 py-3">
            <div className="flex items-center gap-6">
              {/* Playback Controls */}
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-zinc-400" onClick={() => setCurrentImage(1)}>
                  <SkipBack className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-zinc-400" onClick={() => setCurrentImage(Math.max(1, currentImage - 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={isPlaying ? "text-primary" : "text-zinc-400"}
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="sm" className="text-zinc-400" onClick={() => setCurrentImage(Math.min(selectedSeries.images, currentImage + 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-zinc-400" onClick={() => setCurrentImage(selectedSeries.images)}>
                  <SkipForward className="w-4 h-4" />
                </Button>
              </div>

              {/* Image Slider */}
              <div className="flex-1">
                <Slider
                  value={[currentImage]}
                  min={1}
                  max={selectedSeries.images}
                  step={1}
                  onValueChange={(value) => setCurrentImage(value[0])}
                  className="w-full"
                />
              </div>

              {/* Zoom */}
              <div className="flex items-center gap-2">
                <ZoomOut className="w-4 h-4 text-zinc-400" />
                <Slider
                  value={[zoom]}
                  min={50}
                  max={400}
                  step={10}
                  onValueChange={(value) => setZoom(value[0])}
                  className="w-24"
                />
                <ZoomIn className="w-4 h-4 text-zinc-400" />
                <span className="text-xs text-zinc-400 w-12">{zoom}%</span>
              </div>

              {/* Brightness/Contrast */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <SunMedium className="w-4 h-4 text-zinc-400" />
                  <Slider
                    value={[brightness]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(value) => setBrightness(value[0])}
                    className="w-20"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Contrast className="w-4 h-4 text-zinc-400" />
                  <Slider
                    value={[contrast]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(value) => setContrast(value[0])}
                    className="w-20"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Info */}
        <div className="w-72 border-l border-border bg-card">
          <Tabs defaultValue="info">
            <TabsList className="w-full">
              <TabsTrigger value="info" className="flex-1">Info</TabsTrigger>
              <TabsTrigger value="report" className="flex-1">Report</TabsTrigger>
            </TabsList>
            <TabsContent value="info" className="p-4 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Patient Information</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{selectedStudy.patientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID</span>
                    <span className="font-medium">{selectedStudy.patientId}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Study Information</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Modality</span>
                    <span className="font-medium">{selectedStudy.modality}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">{selectedStudy.studyDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Body Part</span>
                    <span className="font-medium">{selectedStudy.bodyPart}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Accession</span>
                    <span className="font-medium">{selectedStudy.accession}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Series</span>
                    <span className="font-medium">{selectedStudy.series}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Images</span>
                    <span className="font-medium">{selectedStudy.images}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Current Series</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{selectedSeries.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Thickness</span>
                    <span className="font-medium">{selectedSeries.thickness}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Images</span>
                    <span className="font-medium">{selectedSeries.images}</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="report" className="p-4">
              <Card>
                <CardContent className="p-4 text-center text-muted-foreground">
                  <FileImage className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No radiology report available</p>
                  <Button variant="outline" size="sm" className="mt-3">
                    Create Report
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
