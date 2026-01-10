/**
 * MPR Viewer - Multi-Planar Reconstruction
 * Shows Axial, Sagittal, and Coronal views with synchronized crosshairs
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  Link, 
  Unlink,
  ChevronUp,
  ChevronDown,
  Maximize2,
  Grid3X3,
} from 'lucide-react';

interface MPRViewerProps {
  volumeData: VolumeData | null;
  onSliceChange?: (plane: 'axial' | 'sagittal' | 'coronal', index: number) => void;
  className?: string;
}

interface VolumeData {
  width: number;
  height: number;
  depth: number;
  voxelData: Int16Array | Uint16Array;
  spacing: [number, number, number];
  windowWidth: number;
  windowCenter: number;
}

interface CrosshairPosition {
  x: number;
  y: number;
  z: number;
}

export function MPRViewer({ volumeData, onSliceChange, className = '' }: MPRViewerProps) {
  const [crosshair, setCrosshair] = useState<CrosshairPosition>({ x: 0, y: 0, z: 0 });
  const [linkedScrolling, setLinkedScrolling] = useState(true);
  const [activePane, setActivePane] = useState<'axial' | 'sagittal' | 'coronal' | null>(null);
  const [layout, setLayout] = useState<'2x2' | '1x3' | 'single'>('2x2');
  const [focusedPlane, setFocusedPlane] = useState<'axial' | 'sagittal' | 'coronal'>('axial');
  
  const axialCanvasRef = useRef<HTMLCanvasElement>(null);
  const sagittalCanvasRef = useRef<HTMLCanvasElement>(null);
  const coronalCanvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize crosshair to center of volume
  useEffect(() => {
    if (volumeData) {
      setCrosshair({
        x: Math.floor(volumeData.width / 2),
        y: Math.floor(volumeData.height / 2),
        z: Math.floor(volumeData.depth / 2),
      });
    }
  }, [volumeData]);

  // Render MPR slices
  useEffect(() => {
    if (!volumeData) return;
    
    // Render Axial (XY plane at Z)
    renderSlice(axialCanvasRef.current, volumeData, 'axial', crosshair.z);
    
    // Render Sagittal (YZ plane at X)
    renderSlice(sagittalCanvasRef.current, volumeData, 'sagittal', crosshair.x);
    
    // Render Coronal (XZ plane at Y)
    renderSlice(coronalCanvasRef.current, volumeData, 'coronal', crosshair.y);
    
  }, [volumeData, crosshair]);

  const renderSlice = (
    canvas: HTMLCanvasElement | null,
    volume: VolumeData,
    plane: 'axial' | 'sagittal' | 'coronal',
    sliceIndex: number
  ) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let sliceWidth: number, sliceHeight: number;
    
    switch (plane) {
      case 'axial':
        sliceWidth = volume.width;
        sliceHeight = volume.height;
        break;
      case 'sagittal':
        sliceWidth = volume.height;
        sliceHeight = volume.depth;
        break;
      case 'coronal':
        sliceWidth = volume.width;
        sliceHeight = volume.depth;
        break;
    }
    
    canvas.width = sliceWidth;
    canvas.height = sliceHeight;
    
    const imageData = ctx.createImageData(sliceWidth, sliceHeight);
    const pixels = imageData.data;
    
    const windowMin = volume.windowCenter - volume.windowWidth / 2;
    const windowMax = volume.windowCenter + volume.windowWidth / 2;
    
    for (let y = 0; y < sliceHeight; y++) {
      for (let x = 0; x < sliceWidth; x++) {
        let voxelValue: number;
        
        switch (plane) {
          case 'axial': {
            const idx = sliceIndex * volume.width * volume.height + y * volume.width + x;
            voxelValue = volume.voxelData[idx] || 0;
            break;
          }
          case 'sagittal': {
            const idx = (sliceHeight - 1 - y) * volume.width * volume.height + x * volume.width + sliceIndex;
            voxelValue = volume.voxelData[idx] || 0;
            break;
          }
          case 'coronal': {
            const idx = (sliceHeight - 1 - y) * volume.width * volume.height + sliceIndex * volume.width + x;
            voxelValue = volume.voxelData[idx] || 0;
            break;
          }
        }
        
        // Apply window/level
        let pixelValue: number;
        if (voxelValue <= windowMin) {
          pixelValue = 0;
        } else if (voxelValue >= windowMax) {
          pixelValue = 255;
        } else {
          pixelValue = ((voxelValue - windowMin) / volume.windowWidth) * 255;
        }
        
        const pixelIndex = (y * sliceWidth + x) * 4;
        pixels[pixelIndex] = pixelValue;
        pixels[pixelIndex + 1] = pixelValue;
        pixels[pixelIndex + 2] = pixelValue;
        pixels[pixelIndex + 3] = 255;
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Draw crosshairs
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.7)';
    ctx.lineWidth = 1;
    
    let crossX: number, crossY: number;
    
    switch (plane) {
      case 'axial':
        crossX = crosshair.x;
        crossY = crosshair.y;
        break;
      case 'sagittal':
        crossX = crosshair.y;
        crossY = sliceHeight - crosshair.z - 1;
        break;
      case 'coronal':
        crossX = crosshair.x;
        crossY = sliceHeight - crosshair.z - 1;
        break;
    }
    
    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(0, crossY);
    ctx.lineTo(sliceWidth, crossY);
    ctx.stroke();
    
    // Vertical line
    ctx.beginPath();
    ctx.moveTo(crossX, 0);
    ctx.lineTo(crossX, sliceHeight);
    ctx.stroke();
  };

  const handleCanvasClick = useCallback((
    plane: 'axial' | 'sagittal' | 'coronal',
    e: React.MouseEvent<HTMLCanvasElement>
  ) => {
    if (!volumeData) return;
    
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);
    
    let newCrosshair = { ...crosshair };
    
    switch (plane) {
      case 'axial':
        newCrosshair.x = Math.max(0, Math.min(volumeData.width - 1, x));
        newCrosshair.y = Math.max(0, Math.min(volumeData.height - 1, y));
        break;
      case 'sagittal':
        newCrosshair.y = Math.max(0, Math.min(volumeData.height - 1, x));
        newCrosshair.z = Math.max(0, Math.min(volumeData.depth - 1, canvas.height - 1 - y));
        break;
      case 'coronal':
        newCrosshair.x = Math.max(0, Math.min(volumeData.width - 1, x));
        newCrosshair.z = Math.max(0, Math.min(volumeData.depth - 1, canvas.height - 1 - y));
        break;
    }
    
    setCrosshair(newCrosshair);
    onSliceChange?.(plane, plane === 'axial' ? newCrosshair.z : plane === 'sagittal' ? newCrosshair.x : newCrosshair.y);
  }, [volumeData, crosshair, onSliceChange]);

  const handleScroll = useCallback((plane: 'axial' | 'sagittal' | 'coronal', delta: number) => {
    if (!volumeData) return;
    
    let newCrosshair = { ...crosshair };
    
    switch (plane) {
      case 'axial':
        newCrosshair.z = Math.max(0, Math.min(volumeData.depth - 1, crosshair.z + delta));
        break;
      case 'sagittal':
        newCrosshair.x = Math.max(0, Math.min(volumeData.width - 1, crosshair.x + delta));
        break;
      case 'coronal':
        newCrosshair.y = Math.max(0, Math.min(volumeData.height - 1, crosshair.y + delta));
        break;
    }
    
    setCrosshair(newCrosshair);
    onSliceChange?.(plane, plane === 'axial' ? newCrosshair.z : plane === 'sagittal' ? newCrosshair.x : newCrosshair.y);
  }, [volumeData, crosshair, onSliceChange]);

  const MPRPane = ({ 
    plane, 
    canvasRef,
    sliceIndex,
    maxSlices,
  }: { 
    plane: 'axial' | 'sagittal' | 'coronal';
    canvasRef: React.RefObject<HTMLCanvasElement>;
    sliceIndex: number;
    maxSlices: number;
  }) => (
    <Card className={`flex flex-col ${layout === 'single' && focusedPlane !== plane ? 'hidden' : ''}`}>
      <CardHeader className="py-2 px-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium capitalize">{plane}</CardTitle>
          <Badge variant="outline" className="text-xs">
            {sliceIndex + 1}/{maxSlices}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => handleScroll(plane, -1)}
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => handleScroll(plane, 1)}
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => {
              setFocusedPlane(plane);
              setLayout('single');
            }}
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-1 relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain cursor-crosshair bg-black"
          onClick={(e) => handleCanvasClick(plane, e)}
          onWheel={(e) => {
            e.preventDefault();
            handleScroll(plane, e.deltaY > 0 ? 1 : -1);
          }}
        />
        {/* Slice position indicator */}
        <div className="absolute bottom-2 left-2 text-xs text-green-400 font-mono">
          {plane === 'axial' && `Z: ${sliceIndex}`}
          {plane === 'sagittal' && `X: ${sliceIndex}`}
          {plane === 'coronal' && `Y: ${sliceIndex}`}
        </div>
      </CardContent>
    </Card>
  );

  if (!volumeData) {
    return (
      <div className={`flex items-center justify-center bg-zinc-900 ${className}`}>
        <div className="text-center text-zinc-500">
          <div className="text-4xl mb-4">📊</div>
          <p>No volume data available for MPR</p>
          <p className="text-sm">Load a multi-slice study to enable MPR</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-zinc-900 ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-zinc-700">
        <div className="flex items-center gap-2">
          <Button
            variant={layout === '2x2' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setLayout('2x2')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={layout === 'single' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setLayout('single')}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={linkedScrolling ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setLinkedScrolling(!linkedScrolling)}
          >
            {linkedScrolling ? <Link className="h-4 w-4" /> : <Unlink className="h-4 w-4" />}
            <span className="ml-1 text-xs">{linkedScrolling ? 'Linked' : 'Unlinked'}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCrosshair({
              x: Math.floor(volumeData.width / 2),
              y: Math.floor(volumeData.height / 2),
              z: Math.floor(volumeData.depth / 2),
            })}
          >
            <RefreshCw className="h-4 w-4" />
            <span className="ml-1 text-xs">Reset</span>
          </Button>
        </div>
        
        <div className="text-xs text-zinc-400">
          Position: ({crosshair.x}, {crosshair.y}, {crosshair.z})
        </div>
      </div>
      
      {/* MPR Grid */}
      <div className={`flex-1 p-2 grid gap-2 ${layout === '2x2' ? 'grid-cols-2 grid-rows-2' : 'grid-cols-1'}`}>
        <MPRPane 
          plane="axial" 
          canvasRef={axialCanvasRef}
          sliceIndex={crosshair.z}
          maxSlices={volumeData.depth}
        />
        <MPRPane 
          plane="sagittal" 
          canvasRef={sagittalCanvasRef}
          sliceIndex={crosshair.x}
          maxSlices={volumeData.width}
        />
        <MPRPane 
          plane="coronal" 
          canvasRef={coronalCanvasRef}
          sliceIndex={crosshair.y}
          maxSlices={volumeData.height}
        />
        
        {/* Info panel in 2x2 mode */}
        {layout === '2x2' && (
          <Card className="flex flex-col">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-sm font-medium">Volume Info</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-3 space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Dimensions</span>
                  <span>{volumeData.width} × {volumeData.height} × {volumeData.depth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Voxel Size</span>
                  <span>{volumeData.spacing.map(s => s.toFixed(2)).join(' × ')} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Window</span>
                  <span>W: {volumeData.windowWidth} L: {volumeData.windowCenter}</span>
                </div>
              </div>
              
              <div className="pt-2 border-t border-zinc-700 space-y-2">
                <p className="text-zinc-400">Slice Positions</p>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Axial (Z)</span>
                  <Slider
                    value={[crosshair.z]}
                    min={0}
                    max={volumeData.depth - 1}
                    onValueChange={([v]) => setCrosshair(c => ({ ...c, z: v }))}
                    className="w-24"
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Sagittal (X)</span>
                  <Slider
                    value={[crosshair.x]}
                    min={0}
                    max={volumeData.width - 1}
                    onValueChange={([v]) => setCrosshair(c => ({ ...c, x: v }))}
                    className="w-24"
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Coronal (Y)</span>
                  <Slider
                    value={[crosshair.y]}
                    min={0}
                    max={volumeData.height - 1}
                    onValueChange={([v]) => setCrosshair(c => ({ ...c, y: v }))}
                    className="w-24"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default MPRViewer;
