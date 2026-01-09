import { useState } from "react";
import { Building2, ChevronDown, MapPin, Stethoscope } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFacility, FacilityInfo, LevelOfCare } from "@/contexts/FacilityContext";

const LEVEL_COLORS: Record<LevelOfCare, string> = {
  quaternary: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  tertiary: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  secondary: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  primary: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
};

const LEVEL_LABELS: Record<LevelOfCare, string> = {
  quaternary: "Central",
  tertiary: "Provincial",
  secondary: "District",
  primary: "Primary",
};

export function FacilitySelector() {
  const {
    currentFacility,
    availableFacilities,
    selectFacility,
    isLoading,
  } = useFacility();
  const [open, setOpen] = useState(false);

  const handleSelect = async (facility: FacilityInfo) => {
    await selectFacility(facility.id);
    setOpen(false);
  };

  // Group facilities by level of care
  const groupedFacilities = availableFacilities.reduce((acc, facility) => {
    const level = facility.level_of_care || 'other';
    if (!acc[level]) acc[level] = [];
    acc[level].push(facility);
    return acc;
  }, {} as Record<string, FacilityInfo[]>);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 h-9 px-2"
        onClick={() => setOpen(true)}
        disabled={isLoading}
      >
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="max-w-[150px] truncate text-sm">
          {currentFacility?.name || "Select Facility"}
        </span>
        {currentFacility?.level_of_care && (
          <Badge variant="secondary" className={`text-xs ${LEVEL_COLORS[currentFacility.level_of_care]}`}>
            {LEVEL_LABELS[currentFacility.level_of_care]}
          </Badge>
        )}
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Select Your Facility
            </DialogTitle>
            <DialogDescription>
              Choose the facility you're currently working at. This will determine which modules and features are available.
            </DialogDescription>
          </DialogHeader>

          <Command className="rounded-lg border shadow-md">
            <CommandInput placeholder="Search facilities..." />
            <CommandList>
              <CommandEmpty>No facility found.</CommandEmpty>
              <ScrollArea className="h-[300px]">
                {(['quaternary', 'tertiary', 'secondary', 'primary'] as LevelOfCare[]).map(level => {
                  const facilities = groupedFacilities[level];
                  if (!facilities?.length) return null;
                  
                  return (
                    <CommandGroup 
                      key={level} 
                      heading={
                        <span className="flex items-center gap-2">
                          <Badge className={LEVEL_COLORS[level]}>
                            {LEVEL_LABELS[level]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            ({facilities.length})
                          </span>
                        </span>
                      }
                    >
                      {facilities.map(facility => (
                        <CommandItem
                          key={facility.id}
                          value={facility.name}
                          onSelect={() => handleSelect(facility)}
                          className="cursor-pointer"
                        >
                          <div className="flex flex-col gap-1 w-full">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{facility.name}</span>
                              {facility.id === currentFacility?.id && (
                                <Badge variant="default" className="text-xs">Current</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Stethoscope className="h-3 w-3" />
                              <span>{facility.facility_type_name}</span>
                              {facility.facility_code && (
                                <>
                                  <span>•</span>
                                  <MapPin className="h-3 w-3" />
                                  <span>{facility.facility_code}</span>
                                </>
                              )}
                            </div>
                            {facility.capabilities.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {facility.capabilities.slice(0, 5).map(cap => (
                                  <Badge key={cap} variant="outline" className="text-[10px] px-1 py-0">
                                    {cap.replace(/_/g, ' ')}
                                  </Badge>
                                ))}
                                {facility.capabilities.length > 5 && (
                                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                                    +{facility.capabilities.length - 5} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  );
                })}
                
                {/* Other facilities without a level */}
                {groupedFacilities['other']?.length > 0 && (
                  <CommandGroup heading="Other Facilities">
                    {groupedFacilities['other'].map(facility => (
                      <CommandItem
                        key={facility.id}
                        value={facility.name}
                        onSelect={() => handleSelect(facility)}
                        className="cursor-pointer"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{facility.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {facility.facility_type_name}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </ScrollArea>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
