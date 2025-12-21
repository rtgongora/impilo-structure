import { useState } from "react";
import { Grid3X3, List, RefreshCw, Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BedCard, type BedData } from "./BedCard";
import { WardStats } from "./WardStats";
import { BedActionDialog } from "./BedActionDialog";

const WARDS = [
  { id: 'medical', name: 'Medical Ward', capacity: 20 },
  { id: 'surgical', name: 'Surgical Ward', capacity: 16 },
  { id: 'maternity', name: 'Maternity Ward', capacity: 12 },
  { id: 'paediatric', name: 'Paediatric Ward', capacity: 10 },
  { id: 'icu', name: 'ICU', capacity: 8 },
  { id: 'hdu', name: 'HDU', capacity: 6 },
];

const generateMockBeds = (): BedData[] => {
  const beds: BedData[] = [];
  const statuses: BedData['status'][] = ['available', 'occupied', 'reserved', 'maintenance', 'cleaning'];
  const acuityLevels: BedData['patient']['acuityLevel'][] = ['critical', 'high', 'medium', 'low'];
  const diagnoses = ['Pneumonia', 'Diabetes Management', 'Post-op Care', 'Heart Failure', 'Malaria', 'Typhoid', 'Trauma'];
  const names = ['John Mwangi', 'Mary Wanjiku', 'Peter Ochieng', 'Grace Akinyi', 'James Kamau', 'Susan Njeri', 'David Kipchoge', 'Jane Atieno'];

  WARDS.forEach(ward => {
    for (let i = 1; i <= ward.capacity; i++) {
      const status = statuses[Math.floor(Math.random() * 100) % 5];
      const bed: BedData = {
        id: `${ward.id}-${i}`,
        bedNumber: `${ward.id.toUpperCase().slice(0, 3)}-${String(i).padStart(2, '0')}`,
        wardId: ward.id,
        status: status === 'occupied' || Math.random() > 0.4 ? 'occupied' : status,
      };

      if (bed.status === 'occupied') {
        bed.patient = {
          id: `P-${ward.id}-${i}`,
          name: names[Math.floor(Math.random() * names.length)],
          mrn: `MRN-${Math.floor(Math.random() * 90000) + 10000}`,
          admissionDate: new Date(Date.now() - Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000),
          diagnosis: diagnoses[Math.floor(Math.random() * diagnoses.length)],
          attendingPhysician: `Dr. ${['Mwangi', 'Ochieng', 'Kamau', 'Njeri'][Math.floor(Math.random() * 4)]}`,
          acuityLevel: acuityLevels[Math.floor(Math.random() * 4)],
        };
      } else if (bed.status === 'reserved') {
        bed.reservedFor = 'Expected admission from Casualty';
      }

      beds.push(bed);
    }
  });

  return beds;
};

export function BedManagement() {
  const [beds, setBeds] = useState<BedData[]>(generateMockBeds);
  const [activeWard, setActiveWard] = useState('medical');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedBed, setSelectedBed] = useState<BedData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const wardBeds = beds.filter(b => b.wardId === activeWard);
  const filteredBeds = filterStatus === 'all' 
    ? wardBeds 
    : wardBeds.filter(b => b.status === filterStatus);

  const currentWard = WARDS.find(w => w.id === activeWard);

  const handleBedClick = (bed: BedData) => {
    setSelectedBed(bed);
    setDialogOpen(true);
  };

  const handleBedAction = (bedId: string, action: string) => {
    setBeds(prev => prev.map(bed => {
      if (bed.id !== bedId) return bed;
      
      switch (action) {
        case 'discharge':
        case 'transfer':
          return { ...bed, status: 'cleaning' as const, patient: undefined };
        case 'reserve':
          return { ...bed, status: 'reserved' as const, reservedFor: 'Pending admission' };
        case 'available':
          return { ...bed, status: 'available' as const, reservedFor: undefined };
        case 'admit':
          return {
            ...bed,
            status: 'occupied' as const,
            patient: {
              id: `P-${Date.now()}`,
              name: 'New Patient',
              mrn: `MRN-${Math.floor(Math.random() * 90000) + 10000}`,
              admissionDate: new Date(),
              diagnosis: 'To be determined',
              attendingPhysician: 'Dr. Mwangi',
              acuityLevel: 'medium' as const,
            },
          };
        default:
          return bed;
      }
    }));
  };

  // Calculate total stats
  const totalBeds = beds.length;
  const totalOccupied = beds.filter(b => b.status === 'occupied').length;
  const totalAvailable = beds.filter(b => b.status === 'available').length;

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">Bed Management</h1>
            <p className="text-sm text-muted-foreground">
              Hospital-wide: {totalOccupied}/{totalBeds} beds occupied • {totalAvailable} available
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setBeds(generateMockBeds())}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <Tabs value={activeWard} onValueChange={setActiveWard} className="flex-1">
            <TabsList className="w-full justify-start">
              {WARDS.map(ward => {
                const wardData = beds.filter(b => b.wardId === ward.id);
                const occupied = wardData.filter(b => b.status === 'occupied').length;
                return (
                  <TabsTrigger key={ward.id} value={ward.id} className="gap-1">
                    {ward.name}
                    <span className="text-xs text-muted-foreground">({occupied}/{ward.capacity})</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[130px] h-8">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Beds</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="cleaning">Cleaning</SelectItem>
              </SelectContent>
            </Select>

            <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as 'grid' | 'list')}>
              <ToggleGroupItem value="grid" size="sm">
                <Grid3X3 className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" size="sm">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {currentWard && (
            <WardStats beds={wardBeds} wardName={currentWard.name} />
          )}

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
              {filteredBeds.map(bed => (
                <BedCard key={bed.id} bed={bed} compact onClick={handleBedClick} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredBeds.map(bed => (
                <BedCard key={bed.id} bed={bed} onClick={handleBedClick} />
              ))}
            </div>
          )}

          {filteredBeds.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No beds match the current filter</p>
          )}
        </div>
      </ScrollArea>

      <BedActionDialog
        bed={selectedBed}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAction={handleBedAction}
      />
    </div>
  );
}
