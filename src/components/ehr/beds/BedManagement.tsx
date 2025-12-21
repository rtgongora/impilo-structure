import { useState } from "react";
import { Grid3X3, List, RefreshCw, Filter, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BedCard } from "./BedCard";
import { WardStats } from "./WardStats";
import { BedActionDialog } from "./BedActionDialog";
import { useBedData, WARDS, type BedData } from "@/hooks/useBedData";

export function BedManagement() {
  const { beds, loading, refetch, updateBedStatus } = useBedData();
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

  const handleBedAction = async (bedId: string, action: string) => {
    await updateBedStatus(bedId, action);
    setDialogOpen(false);
  };

  // Calculate total stats
  const totalBeds = beds.length;
  const totalOccupied = beds.filter(b => b.status === 'occupied').length;
  const totalAvailable = beds.filter(b => b.status === 'available').length;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
            <Button variant="outline" size="sm" onClick={refetch}>
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
