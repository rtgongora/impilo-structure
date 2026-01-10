/**
 * Hanging Protocols - Automatic study layout based on modality and body part
 * Configures viewport layouts and window presets for optimal reading
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Layout,
  Settings,
  Save,
  Plus,
  Trash2,
  Copy,
  Check,
  Grid3X3,
  Maximize2,
  Columns,
  Rows,
} from 'lucide-react';

export interface HangingProtocol {
  id: string;
  name: string;
  description: string;
  modality: string[];
  bodyPart: string[];
  priority: number;
  isDefault: boolean;
  isSystem: boolean;
  layout: ViewportLayout;
  viewports: ViewportConfig[];
  windowPresets: Record<string, WindowPreset>;
  sortCriteria: SortCriteria[];
}

export interface ViewportLayout {
  rows: number;
  columns: number;
}

export interface ViewportConfig {
  index: number;
  seriesSelector: SeriesSelector;
  imageSelector: ImageSelector;
  windowPreset: string;
  colormap?: string;
  initialZoom?: number;
  synchronization?: SynchronizationConfig;
}

export interface SeriesSelector {
  type: 'byIndex' | 'byDescription' | 'byModality' | 'byBodyPart' | 'best';
  value?: string | number;
  fallback?: SeriesSelector;
}

export interface ImageSelector {
  type: 'first' | 'middle' | 'last' | 'byIndex' | 'keyImage';
  value?: number;
}

export interface WindowPreset {
  name: string;
  windowWidth: number;
  windowCenter: number;
}

export interface SortCriteria {
  field: 'seriesNumber' | 'instanceNumber' | 'acquisitionTime' | 'sliceLocation';
  direction: 'asc' | 'desc';
}

export interface SynchronizationConfig {
  groupId: string;
  type: 'scroll' | 'zoom' | 'pan' | 'window' | 'all';
}

// Built-in protocols
export const SYSTEM_PROTOCOLS: HangingProtocol[] = [
  {
    id: 'ct-chest',
    name: 'CT Chest',
    description: 'Standard chest CT with lung and mediastinal windows',
    modality: ['CT'],
    bodyPart: ['CHEST', 'THORAX'],
    priority: 100,
    isDefault: false,
    isSystem: true,
    layout: { rows: 2, columns: 2 },
    viewports: [
      {
        index: 0,
        seriesSelector: { type: 'best' },
        imageSelector: { type: 'middle' },
        windowPreset: 'lung',
        synchronization: { groupId: 'main', type: 'scroll' },
      },
      {
        index: 1,
        seriesSelector: { type: 'best' },
        imageSelector: { type: 'middle' },
        windowPreset: 'mediastinum',
        synchronization: { groupId: 'main', type: 'scroll' },
      },
      {
        index: 2,
        seriesSelector: { type: 'byDescription', value: '3D' },
        imageSelector: { type: 'first' },
        windowPreset: 'bone',
      },
      {
        index: 3,
        seriesSelector: { type: 'best' },
        imageSelector: { type: 'first' },
        windowPreset: 'soft-tissue',
      },
    ],
    windowPresets: {
      lung: { name: 'Lung', windowWidth: 1500, windowCenter: -600 },
      mediastinum: { name: 'Mediastinum', windowWidth: 350, windowCenter: 50 },
      bone: { name: 'Bone', windowWidth: 2500, windowCenter: 480 },
      'soft-tissue': { name: 'Soft Tissue', windowWidth: 400, windowCenter: 40 },
    },
    sortCriteria: [{ field: 'instanceNumber', direction: 'asc' }],
  },
  {
    id: 'ct-brain',
    name: 'CT Brain',
    description: 'Neuroradiology CT with brain and stroke windows',
    modality: ['CT'],
    bodyPart: ['HEAD', 'BRAIN'],
    priority: 100,
    isDefault: false,
    isSystem: true,
    layout: { rows: 1, columns: 2 },
    viewports: [
      {
        index: 0,
        seriesSelector: { type: 'best' },
        imageSelector: { type: 'middle' },
        windowPreset: 'brain',
        synchronization: { groupId: 'main', type: 'all' },
      },
      {
        index: 1,
        seriesSelector: { type: 'best' },
        imageSelector: { type: 'middle' },
        windowPreset: 'stroke',
        synchronization: { groupId: 'main', type: 'all' },
      },
    ],
    windowPresets: {
      brain: { name: 'Brain', windowWidth: 80, windowCenter: 40 },
      stroke: { name: 'Stroke', windowWidth: 40, windowCenter: 40 },
      bone: { name: 'Bone', windowWidth: 2500, windowCenter: 480 },
    },
    sortCriteria: [{ field: 'instanceNumber', direction: 'asc' }],
  },
  {
    id: 'mri-brain',
    name: 'MRI Brain',
    description: 'Standard brain MRI protocol with multiple sequences',
    modality: ['MR', 'MRI'],
    bodyPart: ['HEAD', 'BRAIN'],
    priority: 90,
    isDefault: false,
    isSystem: true,
    layout: { rows: 2, columns: 2 },
    viewports: [
      {
        index: 0,
        seriesSelector: { type: 'byDescription', value: 'T1' },
        imageSelector: { type: 'middle' },
        windowPreset: 'default',
      },
      {
        index: 1,
        seriesSelector: { type: 'byDescription', value: 'T2' },
        imageSelector: { type: 'middle' },
        windowPreset: 'default',
      },
      {
        index: 2,
        seriesSelector: { type: 'byDescription', value: 'FLAIR' },
        imageSelector: { type: 'middle' },
        windowPreset: 'default',
      },
      {
        index: 3,
        seriesSelector: { type: 'byDescription', value: 'DWI' },
        imageSelector: { type: 'middle' },
        windowPreset: 'default',
      },
    ],
    windowPresets: {
      default: { name: 'Default', windowWidth: 400, windowCenter: 200 },
    },
    sortCriteria: [
      { field: 'seriesNumber', direction: 'asc' },
      { field: 'instanceNumber', direction: 'asc' },
    ],
  },
  {
    id: 'xray-chest',
    name: 'X-Ray Chest',
    description: 'Chest radiograph PA and Lateral',
    modality: ['CR', 'DX', 'XR'],
    bodyPart: ['CHEST'],
    priority: 100,
    isDefault: false,
    isSystem: true,
    layout: { rows: 1, columns: 2 },
    viewports: [
      {
        index: 0,
        seriesSelector: { type: 'byIndex', value: 0 },
        imageSelector: { type: 'first' },
        windowPreset: 'default',
      },
      {
        index: 1,
        seriesSelector: { type: 'byIndex', value: 1 },
        imageSelector: { type: 'first' },
        windowPreset: 'default',
      },
    ],
    windowPresets: {
      default: { name: 'Default', windowWidth: 4096, windowCenter: 2048 },
    },
    sortCriteria: [{ field: 'seriesNumber', direction: 'asc' }],
  },
  {
    id: 'us-abdomen',
    name: 'US Abdomen',
    description: 'Abdominal ultrasound review',
    modality: ['US'],
    bodyPart: ['ABDOMEN'],
    priority: 80,
    isDefault: false,
    isSystem: true,
    layout: { rows: 2, columns: 3 },
    viewports: Array.from({ length: 6 }, (_, i) => ({
      index: i,
      seriesSelector: { type: 'byIndex' as const, value: i },
      imageSelector: { type: 'first' as const },
      windowPreset: 'default',
    })),
    windowPresets: {
      default: { name: 'Default', windowWidth: 255, windowCenter: 128 },
    },
    sortCriteria: [{ field: 'seriesNumber', direction: 'asc' }],
  },
  {
    id: 'default-single',
    name: 'Single Viewport',
    description: 'Default single image display',
    modality: [],
    bodyPart: [],
    priority: 0,
    isDefault: true,
    isSystem: true,
    layout: { rows: 1, columns: 1 },
    viewports: [
      {
        index: 0,
        seriesSelector: { type: 'best' },
        imageSelector: { type: 'first' },
        windowPreset: 'default',
      },
    ],
    windowPresets: {
      default: { name: 'Default', windowWidth: 400, windowCenter: 40 },
    },
    sortCriteria: [{ field: 'instanceNumber', direction: 'asc' }],
  },
];

interface HangingProtocolManagerProps {
  protocols: HangingProtocol[];
  activeProtocol: HangingProtocol | null;
  onProtocolSelect: (protocol: HangingProtocol) => void;
  onProtocolSave?: (protocol: HangingProtocol) => void;
  onProtocolDelete?: (protocolId: string) => void;
  studyModality?: string;
  studyBodyPart?: string;
}

export function HangingProtocolManager({
  protocols,
  activeProtocol,
  onProtocolSelect,
  onProtocolSave,
  onProtocolDelete,
  studyModality,
  studyBodyPart,
}: HangingProtocolManagerProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingProtocol, setEditingProtocol] = useState<HangingProtocol | null>(null);

  const matchingProtocols = protocols.filter((p) => {
    if (p.modality.length === 0 && p.bodyPart.length === 0) return p.isDefault;
    const modalityMatch = p.modality.length === 0 || (studyModality && p.modality.includes(studyModality));
    const bodyPartMatch = p.bodyPart.length === 0 || (studyBodyPart && p.bodyPart.includes(studyBodyPart));
    return modalityMatch && bodyPartMatch;
  }).sort((a, b) => b.priority - a.priority);

  const handleEdit = (protocol: HangingProtocol) => {
    setEditingProtocol({ ...protocol });
    setIsEditorOpen(true);
  };

  const handleDuplicate = (protocol: HangingProtocol) => {
    const newProtocol: HangingProtocol = {
      ...protocol,
      id: `custom-${Date.now()}`,
      name: `${protocol.name} (Copy)`,
      isSystem: false,
      isDefault: false,
    };
    onProtocolSave?.(newProtocol);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Layout className="h-4 w-4" />
          Hanging Protocols
        </h3>
        <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-3 w-3 mr-1" />
              New
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProtocol ? 'Edit Protocol' : 'Create Protocol'}
              </DialogTitle>
            </DialogHeader>
            <ProtocolEditor
              protocol={editingProtocol}
              onSave={(p) => {
                onProtocolSave?.(p);
                setIsEditorOpen(false);
                setEditingProtocol(null);
              }}
              onCancel={() => {
                setIsEditorOpen(false);
                setEditingProtocol(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Matching protocols for current study */}
      {matchingProtocols.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Suggested for this study</p>
          {matchingProtocols.slice(0, 3).map((protocol) => (
            <ProtocolCard
              key={protocol.id}
              protocol={protocol}
              isActive={activeProtocol?.id === protocol.id}
              onSelect={() => onProtocolSelect(protocol)}
              onEdit={() => handleEdit(protocol)}
              onDuplicate={() => handleDuplicate(protocol)}
              onDelete={() => onProtocolDelete?.(protocol.id)}
            />
          ))}
        </div>
      )}

      {/* All protocols */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">All Protocols</p>
        <ScrollArea className="h-48">
          <div className="space-y-2 pr-4">
            {protocols.map((protocol) => (
              <ProtocolCard
                key={protocol.id}
                protocol={protocol}
                isActive={activeProtocol?.id === protocol.id}
                onSelect={() => onProtocolSelect(protocol)}
                onEdit={() => handleEdit(protocol)}
                onDuplicate={() => handleDuplicate(protocol)}
                onDelete={() => onProtocolDelete?.(protocol.id)}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

function ProtocolCard({
  protocol,
  isActive,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  protocol: HangingProtocol;
  isActive: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const LayoutIcon = protocol.layout.columns === 1 && protocol.layout.rows === 1
    ? Maximize2
    : protocol.layout.rows === 1
    ? Columns
    : protocol.layout.columns === 1
    ? Rows
    : Grid3X3;

  return (
    <Card 
      className={`cursor-pointer transition-all ${isActive ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
      onClick={onSelect}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-muted rounded">
              <LayoutIcon className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm">{protocol.name}</h4>
                {isActive && <Check className="h-3 w-3 text-primary" />}
                {protocol.isSystem && (
                  <Badge variant="outline" className="text-xs">System</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{protocol.description}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  {protocol.layout.rows}×{protocol.layout.columns}
                </span>
                {protocol.modality.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {protocol.modality.join(', ')}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDuplicate}>
              <Copy className="h-3 w-3" />
            </Button>
            {!protocol.isSystem && (
              <>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onEdit}>
                  <Settings className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-destructive" 
                  onClick={onDelete}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProtocolEditor({
  protocol,
  onSave,
  onCancel,
}: {
  protocol: HangingProtocol | null;
  onSave: (protocol: HangingProtocol) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(protocol?.name || 'New Protocol');
  const [description, setDescription] = useState(protocol?.description || '');
  const [rows, setRows] = useState(protocol?.layout.rows || 1);
  const [columns, setColumns] = useState(protocol?.layout.columns || 1);
  const [modality, setModality] = useState(protocol?.modality.join(', ') || '');
  const [bodyPart, setBodyPart] = useState(protocol?.bodyPart.join(', ') || '');

  const handleSave = () => {
    const newProtocol: HangingProtocol = {
      id: protocol?.id || `custom-${Date.now()}`,
      name,
      description,
      modality: modality.split(',').map(m => m.trim()).filter(Boolean),
      bodyPart: bodyPart.split(',').map(b => b.trim()).filter(Boolean),
      priority: protocol?.priority || 50,
      isDefault: false,
      isSystem: false,
      layout: { rows, columns },
      viewports: Array.from({ length: rows * columns }, (_, i) => ({
        index: i,
        seriesSelector: { type: 'byIndex' as const, value: i },
        imageSelector: { type: 'first' as const },
        windowPreset: 'default',
      })),
      windowPresets: {
        default: { name: 'Default', windowWidth: 400, windowCenter: 40 },
      },
      sortCriteria: [{ field: 'instanceNumber', direction: 'asc' }],
    };
    onSave(newProtocol);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <input
            id="name"
            className="w-full px-3 py-2 border rounded-md bg-background"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <input
            id="description"
            className="w-full px-3 py-2 border rounded-md bg-background"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Layout</Label>
          <div className="flex items-center gap-2">
            <Select value={rows.toString()} onValueChange={(v) => setRows(parseInt(v))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map((n) => (
                  <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>×</span>
            <Select value={columns.toString()} onValueChange={(v) => setColumns(parseInt(v))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map((n) => (
                  <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="modality">Modalities (comma-separated)</Label>
          <input
            id="modality"
            className="w-full px-3 py-2 border rounded-md bg-background"
            value={modality}
            onChange={(e) => setModality(e.target.value)}
            placeholder="CT, MR, US"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bodyPart">Body Parts (comma-separated)</Label>
        <input
          id="bodyPart"
          className="w-full px-3 py-2 border rounded-md bg-background"
          value={bodyPart}
          onChange={(e) => setBodyPart(e.target.value)}
          placeholder="CHEST, HEAD, ABDOMEN"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-1" />
          Save Protocol
        </Button>
      </div>
    </div>
  );
}

/**
 * Auto-select best matching protocol for a study
 */
export function selectBestProtocol(
  protocols: HangingProtocol[],
  modality: string,
  bodyPart: string
): HangingProtocol {
  const matches = protocols
    .filter((p) => {
      if (p.modality.length === 0 && p.bodyPart.length === 0) return p.isDefault;
      const modalityMatch = p.modality.length === 0 || p.modality.includes(modality);
      const bodyPartMatch = p.bodyPart.length === 0 || p.bodyPart.includes(bodyPart);
      return modalityMatch && bodyPartMatch;
    })
    .sort((a, b) => b.priority - a.priority);

  return matches[0] || protocols.find(p => p.isDefault) || protocols[0];
}

export default HangingProtocolManager;
