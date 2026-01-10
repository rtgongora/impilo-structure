/**
 * DicomCanvas - Real DICOM image rendering with Cornerstone-like capabilities
 * Handles actual pixel data rendering, window/level, measurements, and annotations
 */

import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { DicomImage, renderDicomToCanvas, DicomMeasurements } from '@/services/dicomService';

export interface ViewerState {
  zoom: number;
  pan: { x: number; y: number };
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  windowWidth: number;
  windowCenter: number;
  invert: boolean;
}

export interface Annotation {
  id: string;
  type: 'length' | 'angle' | 'ellipse' | 'rectangle' | 'arrow' | 'text' | 'freehand';
  points: { x: number; y: number }[];
  measurement?: string;
  label?: string;
  color?: string;
  isComplete: boolean;
}

export interface DicomCanvasProps {
  image: DicomImage | null;
  viewerState: ViewerState;
  activeTool: string;
  showAnnotations: boolean;
  annotations: Annotation[];
  onAnnotationAdd?: (annotation: Omit<Annotation, 'id'>) => void;
  onAnnotationUpdate?: (id: string, annotation: Partial<Annotation>) => void;
  onViewerStateChange?: (state: Partial<ViewerState>) => void;
  onPixelProbe?: (x: number, y: number, value: number) => void;
  className?: string;
}

export interface DicomCanvasRef {
  resetView: () => void;
  fitToWindow: () => void;
  exportImage: () => string | null;
}

export const DicomCanvas = forwardRef<DicomCanvasRef, DicomCanvasProps>(({
  image,
  viewerState,
  activeTool,
  showAnnotations,
  annotations,
  onAnnotationAdd,
  onAnnotationUpdate,
  onViewerStateChange,
  onPixelProbe,
  className = '',
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [currentAnnotation, setCurrentAnnotation] = useState<Partial<Annotation> | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    resetView: () => {
      onViewerStateChange?.({
        zoom: 100,
        pan: { x: 0, y: 0 },
        rotation: 0,
        flipH: false,
        flipV: false,
        invert: false,
      });
    },
    fitToWindow: () => {
      if (!image || !containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      const scaleX = containerWidth / image.width;
      const scaleY = containerHeight / image.height;
      const scale = Math.min(scaleX, scaleY) * 100;
      onViewerStateChange?.({ zoom: scale, pan: { x: 0, y: 0 } });
    },
    exportImage: () => {
      if (!canvasRef.current) return null;
      return canvasRef.current.toDataURL('image/png');
    },
  }));

  // Track container size
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Render DICOM image
  useEffect(() => {
    if (!image || !canvasRef.current) return;
    
    renderDicomToCanvas(
      canvasRef.current,
      image,
      viewerState.windowWidth,
      viewerState.windowCenter,
      {
        invert: viewerState.invert,
        zoom: viewerState.zoom / 100,
        panX: viewerState.pan.x,
        panY: viewerState.pan.y,
        rotation: viewerState.rotation,
        flipH: viewerState.flipH,
        flipV: viewerState.flipV,
      }
    );
  }, [image, viewerState]);

  // Render annotations overlay
  useEffect(() => {
    if (!overlayCanvasRef.current || !image) return;
    
    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = containerSize.width || 512;
    canvas.height = containerSize.height || 512;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!showAnnotations) return;
    
    // Apply transformations for annotations
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(viewerState.zoom / 100, viewerState.zoom / 100);
    ctx.translate(-image.width / 2 + viewerState.pan.x, -image.height / 2 + viewerState.pan.y);
    
    // Draw each annotation
    const allAnnotations = [...annotations, ...(currentAnnotation ? [currentAnnotation as Annotation] : [])];
    
    for (const ann of allAnnotations) {
      const color = ann.color || '#00ff00';
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2 / (viewerState.zoom / 100);
      ctx.font = `${14 / (viewerState.zoom / 100)}px monospace`;
      
      const points = ann.points || [];
      if (points.length === 0) continue;
      
      switch (ann.type) {
        case 'length':
          if (points.length >= 2) {
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            ctx.lineTo(points[1].x, points[1].y);
            ctx.stroke();
            
            // Draw endpoints
            ctx.beginPath();
            ctx.arc(points[0].x, points[0].y, 4 / (viewerState.zoom / 100), 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(points[1].x, points[1].y, 4 / (viewerState.zoom / 100), 0, Math.PI * 2);
            ctx.fill();
            
            // Draw measurement
            if (ann.measurement) {
              const midX = (points[0].x + points[1].x) / 2;
              const midY = (points[0].y + points[1].y) / 2;
              ctx.fillText(ann.measurement, midX + 5, midY - 5);
            }
          }
          break;
          
        case 'angle':
          if (points.length >= 3) {
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            ctx.lineTo(points[1].x, points[1].y);
            ctx.lineTo(points[2].x, points[2].y);
            ctx.stroke();
            
            // Draw angle arc
            const angle1 = Math.atan2(points[0].y - points[1].y, points[0].x - points[1].x);
            const angle2 = Math.atan2(points[2].y - points[1].y, points[2].x - points[1].x);
            ctx.beginPath();
            ctx.arc(points[1].x, points[1].y, 20 / (viewerState.zoom / 100), angle1, angle2);
            ctx.stroke();
            
            if (ann.measurement) {
              ctx.fillText(ann.measurement, points[1].x + 25, points[1].y);
            }
          }
          break;
          
        case 'ellipse':
          if (points.length >= 2) {
            const centerX = (points[0].x + points[1].x) / 2;
            const centerY = (points[0].y + points[1].y) / 2;
            const radiusX = Math.abs(points[1].x - points[0].x) / 2;
            const radiusY = Math.abs(points[1].y - points[0].y) / 2;
            
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
            ctx.stroke();
            
            if (ann.measurement) {
              ctx.fillText(ann.measurement, centerX, centerY - radiusY - 5);
            }
          }
          break;
          
        case 'rectangle':
          if (points.length >= 2) {
            const x = Math.min(points[0].x, points[1].x);
            const y = Math.min(points[0].y, points[1].y);
            const w = Math.abs(points[1].x - points[0].x);
            const h = Math.abs(points[1].y - points[0].y);
            
            ctx.strokeRect(x, y, w, h);
            
            if (ann.measurement) {
              ctx.fillText(ann.measurement, x, y - 5);
            }
          }
          break;
          
        case 'arrow':
          if (points.length >= 2) {
            const headLen = 15 / (viewerState.zoom / 100);
            const dx = points[1].x - points[0].x;
            const dy = points[1].y - points[0].y;
            const angle = Math.atan2(dy, dx);
            
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            ctx.lineTo(points[1].x, points[1].y);
            ctx.lineTo(points[1].x - headLen * Math.cos(angle - Math.PI / 6), points[1].y - headLen * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(points[1].x, points[1].y);
            ctx.lineTo(points[1].x - headLen * Math.cos(angle + Math.PI / 6), points[1].y - headLen * Math.sin(angle + Math.PI / 6));
            ctx.stroke();
            
            if (ann.label) {
              ctx.fillText(ann.label, points[0].x, points[0].y - 5);
            }
          }
          break;
          
        case 'text':
          if (points.length >= 1 && ann.label) {
            ctx.fillText(ann.label, points[0].x, points[0].y);
          }
          break;
          
        case 'freehand':
          if (points.length >= 2) {
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
              ctx.lineTo(points[i].x, points[i].y);
            }
            if (ann.isComplete) {
              ctx.closePath();
            }
            ctx.stroke();
          }
          break;
      }
    }
    
    ctx.restore();
  }, [annotations, currentAnnotation, showAnnotations, viewerState, containerSize, image]);

  // Convert screen coordinates to image coordinates
  const screenToImage = useCallback((screenX: number, screenY: number): { x: number; y: number } => {
    if (!image || !containerRef.current) return { x: 0, y: 0 };
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const relX = screenX - rect.left - centerX;
    const relY = screenY - rect.top - centerY;
    
    const scale = viewerState.zoom / 100;
    const imgX = relX / scale + image.width / 2 - viewerState.pan.x;
    const imgY = relY / scale + image.height / 2 - viewerState.pan.y;
    
    return { x: imgX, y: imgY };
  }, [image, viewerState]);

  // Handle mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!image) return;
    
    const imagePos = screenToImage(e.clientX, e.clientY);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    
    // Start annotation if using measurement tool
    if (['measure', 'angle', 'circle', 'rectangle', 'arrow', 'annotate', 'freehand'].includes(activeTool)) {
      const typeMap: Record<string, Annotation['type']> = {
        measure: 'length',
        angle: 'angle',
        circle: 'ellipse',
        rectangle: 'rectangle',
        arrow: 'arrow',
        annotate: 'text',
        freehand: 'freehand',
      };
      
      setCurrentAnnotation({
        type: typeMap[activeTool] || 'length',
        points: [imagePos],
        isComplete: false,
        color: '#00ff00',
      });
    }
  }, [image, activeTool, screenToImage]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!image) return;
    
    const imagePos = screenToImage(e.clientX, e.clientY);
    
    // Pixel probe
    if (onPixelProbe && imagePos.x >= 0 && imagePos.x < image.width && imagePos.y >= 0 && imagePos.y < image.height) {
      const idx = Math.floor(imagePos.y) * image.width + Math.floor(imagePos.x);
      const pixelData = image.getPixelData();
      if (idx >= 0 && idx < pixelData.length) {
        const value = pixelData[idx] * image.slope + image.intercept;
        onPixelProbe(Math.floor(imagePos.x), Math.floor(imagePos.y), value);
      }
    }
    
    if (!isDragging) return;
    
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    if (activeTool === 'pan') {
      onViewerStateChange?.({
        pan: {
          x: viewerState.pan.x + dx / (viewerState.zoom / 100),
          y: viewerState.pan.y + dy / (viewerState.zoom / 100),
        },
      });
      setDragStart({ x: e.clientX, y: e.clientY });
    } else if (activeTool === 'zoom') {
      const zoomDelta = dy * -0.5;
      onViewerStateChange?.({
        zoom: Math.max(10, Math.min(1000, viewerState.zoom + zoomDelta)),
      });
      setDragStart({ x: e.clientX, y: e.clientY });
    } else if (activeTool === 'window') {
      onViewerStateChange?.({
        windowWidth: Math.max(1, viewerState.windowWidth + dx * 2),
        windowCenter: viewerState.windowCenter + dy * 2,
      });
      setDragStart({ x: e.clientX, y: e.clientY });
    } else if (currentAnnotation) {
      // Update annotation being drawn
      if (currentAnnotation.type === 'freehand') {
        setCurrentAnnotation({
          ...currentAnnotation,
          points: [...(currentAnnotation.points || []), imagePos],
        });
      } else if (currentAnnotation.type === 'angle') {
        if ((currentAnnotation.points?.length || 0) < 3) {
          const points = currentAnnotation.points || [];
          if (points.length === 1) {
            setCurrentAnnotation({
              ...currentAnnotation,
              points: [points[0], imagePos],
            });
          } else if (points.length === 2) {
            setCurrentAnnotation({
              ...currentAnnotation,
              points: [points[0], points[1], imagePos],
            });
          }
        }
      } else {
        const points = currentAnnotation.points || [];
        setCurrentAnnotation({
          ...currentAnnotation,
          points: [points[0], imagePos],
        });
      }
    }
  }, [image, isDragging, dragStart, activeTool, viewerState, currentAnnotation, onViewerStateChange, onPixelProbe, screenToImage]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    setIsDragging(false);
    
    if (currentAnnotation && currentAnnotation.points && currentAnnotation.points.length >= 2) {
      const points = currentAnnotation.points;
      let measurement = '';
      
      const pixelSpacing: [number, number] = [
        image?.rowPixelSpacing || 1,
        image?.columnPixelSpacing || 1,
      ];
      
      if (currentAnnotation.type === 'length' && points.length >= 2) {
        const dist = DicomMeasurements.calculateDistance(points[0], points[1], pixelSpacing);
        measurement = `${dist.toFixed(1)} mm`;
      } else if (currentAnnotation.type === 'angle' && points.length >= 3) {
        const angle = DicomMeasurements.calculateAngle(points[0], points[1], points[2]);
        measurement = `${angle.toFixed(1)}°`;
      } else if (currentAnnotation.type === 'ellipse' && points.length >= 2) {
        const rx = Math.abs(points[1].x - points[0].x) / 2 * pixelSpacing[1];
        const ry = Math.abs(points[1].y - points[0].y) / 2 * pixelSpacing[0];
        const area = Math.PI * rx * ry;
        measurement = `Area: ${area.toFixed(1)} mm²`;
      } else if (currentAnnotation.type === 'rectangle' && points.length >= 2) {
        const w = Math.abs(points[1].x - points[0].x) * pixelSpacing[1];
        const h = Math.abs(points[1].y - points[0].y) * pixelSpacing[0];
        measurement = `${w.toFixed(1)} × ${h.toFixed(1)} mm`;
      }
      
      onAnnotationAdd?.({
        ...currentAnnotation,
        measurement,
        isComplete: true,
      } as Omit<Annotation, 'id'>);
    }
    
    setCurrentAnnotation(null);
  }, [currentAnnotation, image, onAnnotationAdd]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -10 : 10;
    onViewerStateChange?.({
      zoom: Math.max(10, Math.min(1000, viewerState.zoom + delta)),
    });
  }, [viewerState.zoom, onViewerStateChange]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-black ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      style={{ cursor: getCursorForTool(activeTool) }}
    >
      {/* Main DICOM canvas */}
      <canvas
        ref={canvasRef}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        style={{
          imageRendering: 'pixelated',
          transform: `translate(-50%, -50%) scale(${viewerState.zoom / 100})`,
        }}
      />
      
      {/* Annotations overlay */}
      <canvas
        ref={overlayCanvasRef}
        className="absolute inset-0 pointer-events-none"
        width={containerSize.width}
        height={containerSize.height}
      />
      
      {/* No image placeholder */}
      {!image && (
        <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
          <div className="text-center">
            <div className="text-6xl mb-4">🩻</div>
            <p className="text-lg">No DICOM image loaded</p>
            <p className="text-sm">Select a study to view images</p>
          </div>
        </div>
      )}
    </div>
  );
});

DicomCanvas.displayName = 'DicomCanvas';

function getCursorForTool(tool: string): string {
  switch (tool) {
    case 'pan': return 'grab';
    case 'zoom': return 'zoom-in';
    case 'window': return 'ns-resize';
    case 'measure':
    case 'angle':
    case 'circle':
    case 'rectangle':
    case 'arrow':
    case 'annotate':
    case 'freehand':
      return 'crosshair';
    default:
      return 'default';
  }
}

export default DicomCanvas;
