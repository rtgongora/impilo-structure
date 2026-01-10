import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { usePACSViewer, WINDOW_PRESETS } from "@/hooks/usePACSViewer";
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
  Eye,
  EyeOff,
  Crosshair,
  MousePointer,
  ArrowUpRight,
  Triangle,
  Type,
  Save,
  Loader2
} from "lucide-react";

// Mock DICOM studies (fallback when no database data)
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
  const pacs = usePACSViewer();
  
  // Local state for mock data fallback
  const [localStudy, setLocalStudy] = useState(mockStudies[0]);
  const [localSeries, setLocalSeries] = useState(mockSeries[0]);
  const [localImage, setLocalImage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalityFilter, setModalityFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"1x1" | "2x2" | "1x2" | "mpr">("1x1");
  const [reportFindings, setReportFindings] = useState("");
  const [reportImpression, setReportImpression] = useState("");

  // Derive data - use hook data if available, otherwise mock
  const hasDbData = pacs.studies.length > 0;
  const selectedStudy = hasDbData ? pacs.selectedStudy : null;
  const currentSeries = hasDbData ? pacs.selectedSeries : null;
  const totalImages = hasDbData 
    ? pacs.instances.length 
    : localSeries.images;
  const currentImageIndex = hasDbData 
    ? pacs.currentIndex + 1 
    : localImage;

  // Load studies on mount
  useEffect(() => {
    pacs.fetchStudies();
  }, []);

  // Populate report form when report loads
  useEffect(() => {
    if (pacs.report) {
      setReportFindings(pacs.report.findings || "");
      setReportImpression(pacs.report.impression || "");
    }
  }, [pacs.report]);

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
    { id: "select", icon: MousePointer, label: "Select" },
    { id: "pan", icon: Move, label: "Pan" },
    { id: "zoom", icon: ZoomIn, label: "Zoom" },
    { id: "window", icon: SunMedium, label: "Window/Level" },
    { id: "crosshairs", icon: Crosshair, label: "Crosshairs" },
  ];

  const measureTools = [
    { id: "measure", icon: Ruler, label: "Length" },
    { id: "angle", icon: Triangle, label: "Angle" },
    { id: "circle", icon: Circle, label: "Circle ROI" },
    { id: "rectangle", icon: Square, label: "Rectangle ROI" },
    { id: "arrow", icon: ArrowUpRight, label: "Arrow" },
    { id: "annotate", icon: Type, label: "Text Annotation" },
  ];

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (hasDbData) {
      pacs.navigateImage(direction);
    } else {
      if (direction === 'next') {
        setLocalImage(Math.min(localSeries.images, localImage + 1));
      } else {
        setLocalImage(Math.max(1, localImage - 1));
      }
    }
  };

  const handleGoToImage = (index: number) => {
    if (hasDbData) {
      pacs.goToImage(index - 1);
    } else {
      setLocalImage(index);
    }
  };

  const handleSaveReport = async () => {
    await pacs.saveReport({
      findings: reportFindings,
      impression: reportImpression,
    }, 'current-user'); // Replace with actual user ID
  };

  const filteredStudies = mockStudies.filter(study => {
    const matchesSearch = study.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      study.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      study.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModality = modalityFilter === "all" || study.modality === modalityFilter;
    return matchesSearch && matchesModality;
  });

  // Display values
  const displayStudy = selectedStudy ? {
    patientName: 'Patient', // Would come from patient join
    patientId: selectedStudy.patient_id,
    studyDate: selectedStudy.study_date,
    modality: selectedStudy.modality,
    description: selectedStudy.study_description || '',
    bodyPart: selectedStudy.body_part || '',
    images: selectedStudy.number_of_instances,
    series: selectedStudy.number_of_series,
    accession: selectedStudy.accession_number || '',
  } : localStudy;

  const displaySeries = currentSeries ? {
    name: currentSeries.series_description || `Series ${currentSeries.series_number}`,
    images: currentSeries.number_of_instances,
    thickness: currentSeries.slice_thickness ? `${currentSeries.slice_thickness}mm` : 'N/A',
  } : localSeries;


  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-workspace-header border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">PACS Imaging Viewer</h1>
            <Badge variant="outline">{displayStudy.modality}</Badge>
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
                    localStudy.id === study.id ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => setLocalStudy(study)}
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
                      localSeries.id === series.id
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setLocalSeries(series)}
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
                  variant={pacs.activeTool === tool.id ? "secondary" : "ghost"}
                  size="sm"
                  className={pacs.activeTool === tool.id ? "bg-primary text-primary-foreground" : "text-zinc-400 hover:text-white"}
                  onClick={() => pacs.setActiveTool(tool.id)}
                  title={tool.label}
                >
                  <tool.icon className="w-4 h-4" />
                </Button>
              ))}
              <div className="w-px h-6 bg-zinc-700 mx-2" />
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white" onClick={() => pacs.rotateImage(-90)}>
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white" onClick={() => pacs.rotateImage(90)}>
                <RotateCw className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className={pacs.flipH ? "text-primary" : "text-zinc-400 hover:text-white"} onClick={() => pacs.setFlipH(!pacs.flipH)}>
                <FlipHorizontal className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className={pacs.flipV ? "text-primary" : "text-zinc-400 hover:text-white"} onClick={() => pacs.setFlipV(!pacs.flipV)}>
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
                className={pacs.showAnnotations ? "text-primary" : "text-zinc-400"}
                onClick={() => pacs.setShowAnnotations(!pacs.showAnnotations)}
              >
                {pacs.showAnnotations ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
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
                filter: `brightness(${(pacs.windowLevel + 1000) / 1000}) contrast(${pacs.windowWidth / 400}) ${pacs.invert ? 'invert(1)' : ''}`,
                transform: `scale(${pacs.zoom / 100}) rotate(${pacs.rotation}deg) scaleX(${pacs.flipH ? -1 : 1}) scaleY(${pacs.flipV ? -1 : 1})`,
                translate: `${pacs.pan.x}px ${pacs.pan.y}px`
              }}
            >
              {/* Loading state */}
              {pacs.loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80 z-10">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}
              
              {/* Placeholder for actual DICOM rendering */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-zinc-500">
                  <FileImage className="w-24 h-24 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">{displayStudy.description}</p>
                  <p className="text-sm">{displaySeries.name} - Image {currentImageIndex}/{totalImages}</p>
                </div>
              </div>

              {/* DICOM Overlay Info */}
              <div className="absolute top-4 left-4 text-xs text-green-400 font-mono space-y-1">
                <p>{displayStudy.patientName}</p>
                <p>{displayStudy.patientId}</p>
                <p>{displayStudy.studyDate}</p>
              </div>
              <div className="absolute top-4 right-4 text-xs text-green-400 font-mono text-right space-y-1">
                <p>{displayStudy.modality}</p>
                <p>{displayStudy.bodyPart}</p>
                <p>ACC: {displayStudy.accession}</p>
              </div>
              <div className="absolute bottom-4 left-4 text-xs text-green-400 font-mono space-y-1">
                <p>W: {pacs.windowWidth} L: {pacs.windowLevel}</p>
                <p>Zoom: {pacs.zoom}%</p>
              </div>
              <div className="absolute bottom-4 right-4 text-xs text-green-400 font-mono text-right">
                <p>Im: {currentImageIndex}/{totalImages}</p>
                <p>Se: {displaySeries.name}</p>
              </div>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="bg-zinc-900 border-t border-zinc-700 px-4 py-3">
            <div className="flex items-center gap-6">
              {/* Playback Controls */}
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-zinc-400" onClick={() => handleGoToImage(1)}>
                  <SkipBack className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-zinc-400" onClick={() => handleNavigate('prev')}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={pacs.isPlaying ? "text-primary" : "text-zinc-400"}
                  onClick={() => pacs.setIsPlaying(!pacs.isPlaying)}
                >
                  {pacs.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="sm" className="text-zinc-400" onClick={() => handleNavigate('next')}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-zinc-400" onClick={() => handleGoToImage(totalImages)}>
                  <SkipForward className="w-4 h-4" />
                </Button>
              </div>

              {/* Image Slider */}
              <div className="flex-1">
                <Slider
                  value={[currentImageIndex]}
                  min={1}
                  max={totalImages}
                  step={1}
                  onValueChange={(value) => handleGoToImage(value[0])}
                  className="w-full"
                />
              </div>

              {/* Zoom */}
              <div className="flex items-center gap-2">
                <ZoomOut className="w-4 h-4 text-zinc-400" />
                <Slider
                  value={[pacs.zoom]}
                  min={50}
                  max={400}
                  step={10}
                  onValueChange={(value) => pacs.setZoom(value[0])}
                  className="w-24"
                />
                <ZoomIn className="w-4 h-4 text-zinc-400" />
                <span className="text-xs text-zinc-400 w-12">{pacs.zoom}%</span>
              </div>

              {/* Window/Level */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2" title="Window Level">
                  <SunMedium className="w-4 h-4 text-zinc-400" />
                  <Slider
                    value={[pacs.windowLevel]}
                    min={-1000}
                    max={1000}
                    step={10}
                    onValueChange={(value) => pacs.setWindowLevel(value[0])}
                    className="w-20"
                  />
                </div>
                <div className="flex items-center gap-2" title="Window Width">
                  <Contrast className="w-4 h-4 text-zinc-400" />
                  <Slider
                    value={[pacs.windowWidth]}
                    min={1}
                    max={4000}
                    step={10}
                    onValueChange={(value) => pacs.setWindowWidth(value[0])}
                    className="w-20"
                  />
                </div>
                <Select onValueChange={(name) => {
                  const preset = WINDOW_PRESETS.find(p => p.name === name);
                  if (preset) pacs.applyWindowPreset(preset);
                }}>
                  <SelectTrigger className="w-28 h-8 text-xs bg-zinc-800 border-zinc-700 text-zinc-300">
                    <SelectValue placeholder="Presets" />
                  </SelectTrigger>
                  <SelectContent>
                    {WINDOW_PRESETS.map((preset) => (
                      <SelectItem key={preset.name} value={preset.name}>{preset.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    <span className="font-medium">{displayStudy.patientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID</span>
                    <span className="font-medium">{displayStudy.patientId}</span>
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
                    <span className="font-medium">{displayStudy.modality}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">{displayStudy.studyDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Body Part</span>
                    <span className="font-medium">{displayStudy.bodyPart}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Accession</span>
                    <span className="font-medium">{displayStudy.accession}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Series</span>
                    <span className="font-medium">{displayStudy.series}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Images</span>
                    <span className="font-medium">{displayStudy.images}</span>
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
                    <span className="font-medium">{displaySeries.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Thickness</span>
                    <span className="font-medium">{displaySeries.thickness}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Images</span>
                    <span className="font-medium">{displaySeries.images}</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="report" className="p-4 space-y-4">
              {pacs.report ? (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs">Findings</Label>
                    <Textarea 
                      value={reportFindings}
                      onChange={(e) => setReportFindings(e.target.value)}
                      placeholder="Enter findings..."
                      className="min-h-[120px] text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Impression</Label>
                    <Textarea 
                      value={reportImpression}
                      onChange={(e) => setReportImpression(e.target.value)}
                      placeholder="Enter impression..."
                      className="min-h-[80px] text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveReport}>
                      <Save className="w-3 h-3 mr-1" />
                      Save Draft
                    </Button>
                    <Badge variant={pacs.report.status === 'final' ? 'default' : 'secondary'}>
                      {pacs.report.status}
                    </Badge>
                  </div>
                </>
              ) : (
                <Card>
                  <CardContent className="p-4 text-center text-muted-foreground">
                    <FileImage className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No radiology report available</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => handleSaveReport()}>
                      Create Report
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
