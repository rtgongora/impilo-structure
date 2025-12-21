import { useState } from "react";
import { Grid3X3, List, RefreshCw, Filter, Loader2, AlertTriangle, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BedCard } from "./BedCard";
import { WardStats } from "./WardStats";
import { BedActionDialog } from "./BedActionDialog";
import { useBedData, WARDS, type BedData } from "@/hooks/useBedData";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export function BedManagement() {
  const { beds, loading, refetch, updateBedStatus } = useBedData();
  const { careSetting, currentDepartment, isInpatientContext } = useWorkspace();
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

  // Outpatient context - show limited/relevant view
  if (careSetting === "outpatient") {
    return (
      <div className="h-full flex flex-col bg-background p-6">
        <Alert className="border-amber-500/20 bg-amber-500/5">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription>
            <strong>Outpatient Context</strong> — Bed management is primarily for inpatient care. 
            Showing observation and procedure room availability.
          </AlertDescription>
        </Alert>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Observation & Procedure Rooms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg border bg-green-500/10 border-green-500/20">
                <div className="text-2xl font-bold text-green-600">3</div>
                <div className="text-sm text-muted-foreground">Available Rooms</div>
              </div>
              <div className="p-4 rounded-lg border bg-blue-500/10 border-blue-500/20">
                <div className="text-2xl font-bold text-blue-600">2</div>
                <div className="text-sm text-muted-foreground">In Use</div>
              </div>
              <div className="p-4 rounded-lg border bg-amber-500/10 border-amber-500/20">
                <div className="text-2xl font-bold text-amber-600">1</div>
                <div className="text-sm text-muted-foreground">Being Cleaned</div>
              </div>
              <div className="p-4 rounded-lg border">
                <div className="text-2xl font-bold">6</div>
                <div className="text-sm text-muted-foreground">Total Rooms</div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-medium mb-3">Quick Actions</h4>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm">
                  Request Observation Bed
                </Button>
                <Button variant="outline" size="sm">
                  View Procedure Schedule
                </Button>
                <Button variant="outline" size="sm" onClick={refetch}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Admission Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Patients requiring admission from outpatient departments
            </p>
            <div className="text-center py-8 text-muted-foreground">
              No pending admission requests
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Emergency context - show ED beds + available inpatient beds
  if (careSetting === "emergency") {
    const edBeds = beds.filter(b => b.wardId === 'ed' || b.wardId === 'casualty');
    const availableInpatient = beds.filter(b => b.status === 'available' && b.wardId !== 'ed' && b.wardId !== 'casualty');

    return (
      <div className="h-full flex flex-col bg-background">
        <div className="border-b p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Emergency Bed Status
              </h1>
              <p className="text-sm text-muted-foreground">
                ED beds and available inpatient capacity
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={refetch}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border bg-red-500/10 border-red-500/20">
              <div className="text-2xl font-bold text-red-600">
                {beds.filter(b => b.wardId === 'ed' && b.status === 'occupied').length}
              </div>
              <div className="text-sm text-muted-foreground">ED Occupied</div>
            </div>
            <div className="p-4 rounded-lg border bg-green-500/10 border-green-500/20">
              <div className="text-2xl font-bold text-green-600">
                {beds.filter(b => b.wardId === 'ed' && b.status === 'available').length}
              </div>
              <div className="text-sm text-muted-foreground">ED Available</div>
            </div>
            <div className="p-4 rounded-lg border bg-blue-500/10 border-blue-500/20">
              <div className="text-2xl font-bold text-blue-600">{availableInpatient.length}</div>
              <div className="text-sm text-muted-foreground">Inpatient Beds Free</div>
            </div>
            <div className="p-4 rounded-lg border">
              <div className="text-2xl font-bold">{totalBeds}</div>
              <div className="text-sm text-muted-foreground">Total Hospital Beds</div>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <h3 className="font-semibold mb-3">ED Beds</h3>
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 mb-6">
            {beds.filter(b => b.wardId === 'ed' || b.wardId === 'casualty').map(bed => (
              <BedCard key={bed.id} bed={bed} compact onClick={handleBedClick} />
            ))}
          </div>

          <h3 className="font-semibold mb-3">Available Inpatient Beds by Ward</h3>
          {WARDS.filter(w => w.id !== 'ed' && w.id !== 'casualty').map(ward => {
            const wardAvailable = beds.filter(b => b.wardId === ward.id && b.status === 'available');
            if (wardAvailable.length === 0) return null;
            return (
              <div key={ward.id} className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{ward.name}</Badge>
                  <span className="text-sm text-muted-foreground">{wardAvailable.length} available</span>
                </div>
                <div className="grid grid-cols-8 md:grid-cols-12 gap-1">
                  {wardAvailable.map(bed => (
                    <BedCard key={bed.id} bed={bed} compact onClick={handleBedClick} />
                  ))}
                </div>
              </div>
            );
          })}
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

  // Inpatient / All context - full bed management
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
