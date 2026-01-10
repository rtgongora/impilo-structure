import { useState, useCallback, useEffect, useRef } from "react";
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
import { DicomCanvas, DicomCanvasRef, Annotation, ViewerState } from "./DicomCanvas";
import { fetchDicomImage, DicomImage } from "@/services/dicomService";
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
  Loader2,
  Upload,
  RefreshCw,
  Star,
  AlertTriangle
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
  const canvasRef = useRef<DicomCanvasRef>(null);
  
  // Local state for mock data fallback
  const [localStudy, setLocalStudy] = useState(mockStudies[0]);
  const [localSeries, setLocalSeries] = useState(mockSeries[0]);
  const [localImage, setLocalImage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalityFilter, setModalityFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"1x1" | "2x2" | "1x2" | "mpr">("1x1");
  const [reportFindings, setReportFindings] = useState("");
  const [reportImpression, setReportImpression] = useState("");
  
  // DICOM rendering state
  const [dicomImage, setDicomImage] = useState<DicomImage | null>(null);
  const [localAnnotations, setLocalAnnotations] = useState<Annotation[]>([]);
  const [pixelInfo, setPixelInfo] = useState<{ x: number; y: number; value: number } | null>(null);

  // Viewer state for DicomCanvas
  const viewerState: ViewerState = {
    zoom: pacs.zoom,
    pan: pacs.pan,
    rotation: pacs.rotation,
    flipH: pacs.flipH,
    flipV: pacs.flipV,
    windowWidth: pacs.windowWidth,
    windowCenter: pacs.windowLevel,
    invert: pacs.invert,
  };

  // Derive data - use hook data if available, otherwise mock
  const hasDbData = pacs.studies.length > 0;
  const studiesForDisplay = hasDbData ? pacs.studies : [];
  const selectedStudy = pacs.selectedStudy;
  const currentSeries = pacs.selectedSeries;
  const totalImages = pacs.instances.length || localSeries.images;
  const currentImageIndex = pacs.currentIndex + 1 || localImage;

  // Load studies on mount
  useEffect(() => {
    pacs.fetchStudies();
  }, []);

  // Auto-select first study from database when loaded
  useEffect(() => {
    if (pacs.studies.length > 0 && !pacs.selectedStudy) {
      pacs.selectStudy(pacs.studies[0]);
    }
  }, [pacs.studies]);

  // Load DICOM image when instance changes
  useEffect(() => {
    if (pacs.currentInstance?.storage_path) {
      fetchDicomImage(pacs.currentInstance.storage_path).then((img) => {
        if (img) setDicomImage(img);
      });
    }
  }, [pacs.currentInstance]);

  // Populate report form when report loads
  useEffect(() => {
    if (pacs.report) {
      setReportFindings(pacs.report.findings || "");
      setReportImpression(pacs.report.impression || "");
    }
  }, [pacs.report]);

  // Handle viewer state changes from canvas
  const handleViewerStateChange = useCallback((state: Partial<ViewerState>) => {
    if (state.zoom !== undefined) pacs.setZoom(state.zoom);
    if (state.pan !== undefined) pacs.setPan(state.pan);
    if (state.windowWidth !== undefined) pacs.setWindowWidth(state.windowWidth);
    if (state.windowCenter !== undefined) pacs.setWindowLevel(state.windowCenter);
  }, [pacs]);

  // Handle annotation add
  const handleAnnotationAdd = useCallback((annotation: Omit<Annotation, 'id'>) => {
    const newAnnotation: Annotation = {
      ...annotation,
      id: `ann-${Date.now()}`,
    };
    setLocalAnnotations((prev) => [...prev, newAnnotation]);
    toast.success(`${annotation.type} measurement added`);
  }, []);

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

  // Filter studies from database or use mock for fallback
  const filteredStudies = hasDbData 
    ? studiesForDisplay.filter(study => {
        const patientName = study.patient ? `${study.patient.first_name} ${study.patient.last_name}` : '';
        const matchesSearch = patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (study.patient?.mrn || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (study.study_description || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesModality = modalityFilter === "all" || study.modality === modalityFilter;
        return matchesSearch && matchesModality;
      })
    : mockStudies.filter(study => {
        const matchesSearch = study.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          study.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          study.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesModality = modalityFilter === "all" || study.modality === modalityFilter;
        return matchesSearch && matchesModality;
      });

  // Display values
  const displayStudy = selectedStudy ? {
    patientName: selectedStudy.patient ? `${selectedStudy.patient.first_name} ${selectedStudy.patient.last_name}` : 'Unknown Patient',
    patientId: selectedStudy.patient?.mrn || selectedStudy.patient_id,
    studyDate: selectedStudy.study_date,
    modality: selectedStudy.modality,
    description: selectedStudy.study_description || '',
    bodyPart: selectedStudy.body_part || '',
    images: selectedStudy.number_of_instances,
    series: selectedStudy.number_of_series,
    accession: selectedStudy.accession_number || '',
  } : localStudy;

  // Display series from database or mock
  const displaySeriesList = pacs.series.length > 0 ? pacs.series.map(s => ({
    id: s.id,
    name: s.series_description || `Series ${s.series_number}`,
    images: s.number_of_instances,
    thickness: s.slice_thickness ? `${s.slice_thickness}mm` : 'N/A',
  })) : mockSeries;

  const displaySeries = currentSeries ? {
    id: currentSeries.id,
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
              {pacs.loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredStudies.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No studies found
                </div>
              ) : (
                filteredStudies.map((study) => {
                  const isDbStudy = 'patient' in study;
                  const patientName = isDbStudy 
                    ? (study.patient ? `${study.patient.first_name} ${study.patient.last_name}` : 'Unknown')
                    : (study as any).patientName;
                  const patientId = isDbStudy 
                    ? (study.patient?.mrn || study.patient_id)
                    : (study as any).patientId;
                  const studyDate = isDbStudy ? study.study_date : (study as any).studyDate;
                  const description = isDbStudy ? (study.study_description || '') : (study as any).description;
                  const seriesCount = isDbStudy ? study.number_of_series : (study as any).series;
                  const imageCount = isDbStudy ? study.number_of_instances : (study as any).images;
                  const isSelected = pacs.selectedStudy?.id === study.id;

                  return (
                    <Card
                      key={study.id}
                      className={`cursor-pointer transition-all hover:border-primary ${
                        isSelected ? "border-primary bg-primary/5" : ""
                      }`}
                      onClick={() => {
                        if (isDbStudy) {
                          pacs.selectStudy(study as any);
                        } else {
                          setLocalStudy(study as any);
                        }
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <Badge className={`${getModalityBadgeColor(study.modality)} text-white`}>
                            {study.modality}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{studyDate}</span>
                        </div>
                        <h4 className="font-medium text-sm">{patientName}</h4>
                        <p className="text-xs text-muted-foreground">{patientId}</p>
                        <p className="text-xs text-muted-foreground mt-1">{description}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Layers className="w-3 h-3" />
                          <span>{seriesCount} series</span>
                          <FileImage className="w-3 h-3 ml-2" />
                          <span>{imageCount} images</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* Series Panel */}
          <div className="border-t border-border">
            <div className="p-3">
              <h3 className="text-sm font-medium mb-2">Series</h3>
              <div className="space-y-1">
                {displaySeriesList.map((series) => (
                  <div
                    key={series.id}
                    className={`p-2 rounded cursor-pointer text-sm transition-colors ${
                      displaySeries.id === series.id
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => {
                      const dbSeries = pacs.series.find(s => s.id === series.id);
                      if (dbSeries) {
                        pacs.selectSeries(dbSeries);
                      } else {
                        setLocalSeries(series as any);
                      }
                    }}
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
          <div className="flex-1 relative">
            {/* Real DICOM Canvas */}
            <DicomCanvas
              ref={canvasRef}
              image={dicomImage}
              viewerState={viewerState}
              activeTool={pacs.activeTool}
              showAnnotations={pacs.showAnnotations}
              annotations={localAnnotations}
              onAnnotationAdd={handleAnnotationAdd}
              onViewerStateChange={handleViewerStateChange}
              onPixelProbe={(x, y, value) => setPixelInfo({ x, y, value })}
              className="absolute inset-0"
            />

            {/* Loading state */}
            {pacs.loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80 z-10">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}

            {/* DICOM Overlay Info */}
            <div className="absolute top-4 left-4 text-xs text-green-400 font-mono space-y-1 pointer-events-none z-20">
              <p>{displayStudy.patientName}</p>
              <p>{displayStudy.patientId}</p>
              <p>{displayStudy.studyDate}</p>
            </div>
            <div className="absolute top-4 right-4 text-xs text-green-400 font-mono text-right space-y-1 pointer-events-none z-20">
              <p>{displayStudy.modality}</p>
              <p>{displayStudy.bodyPart}</p>
              <p>ACC: {displayStudy.accession}</p>
            </div>
            <div className="absolute bottom-4 left-4 text-xs text-green-400 font-mono space-y-1 pointer-events-none z-20">
              <p>W: {pacs.windowWidth} L: {pacs.windowLevel}</p>
              <p>Zoom: {pacs.zoom}%</p>
              {pixelInfo && (
                <p>Pixel ({pixelInfo.x}, {pixelInfo.y}): {pixelInfo.value.toFixed(0)} HU</p>
              )}
            </div>
            <div className="absolute bottom-4 right-4 text-xs text-green-400 font-mono text-right pointer-events-none z-20">
              <p>Im: {currentImageIndex}/{totalImages}</p>
              <p>Se: {displaySeries.name}</p>
            </div>

            {/* Tool indicators */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none z-20">
              <Badge variant="secondary" className="bg-zinc-800/80 text-green-400 border-green-400/30">
                {pacs.activeTool.charAt(0).toUpperCase() + pacs.activeTool.slice(1)}
              </Badge>
            </div>

            {/* Annotations count */}
            {localAnnotations.length > 0 && (
              <div className="absolute top-12 right-4 pointer-events-none z-20">
                <Badge variant="outline" className="bg-zinc-800/80 text-yellow-400 border-yellow-400/30">
                  <Ruler className="w-3 h-3 mr-1" />
                  {localAnnotations.length} measurements
                </Badge>
              </div>
            )}
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
