import { useState, useEffect } from "react";
import { 
  Home, 
  Building2, 
  Trees, 
  MapPin, 
  Phone, 
  Navigation,
  ChevronDown,
  ChevronUp,
  Info
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

// Zimbabwe administrative data
const PROVINCES = [
  { value: "harare", label: "Harare" },
  { value: "bulawayo", label: "Bulawayo" },
  { value: "mashonaland_central", label: "Mashonaland Central" },
  { value: "mashonaland_east", label: "Mashonaland East" },
  { value: "mashonaland_west", label: "Mashonaland West" },
  { value: "manicaland", label: "Manicaland" },
  { value: "masvingo", label: "Masvingo" },
  { value: "midlands", label: "Midlands" },
  { value: "matabeleland_north", label: "Matabeleland North" },
  { value: "matabeleland_south", label: "Matabeleland South" },
];

// Sample districts by province (would come from reference data in production)
const DISTRICTS_BY_PROVINCE: Record<string, { value: string; label: string }[]> = {
  harare: [
    { value: "harare_urban", label: "Harare Urban" },
    { value: "harare_rural", label: "Harare Rural" },
  ],
  bulawayo: [
    { value: "bulawayo_urban", label: "Bulawayo Urban" },
  ],
  mashonaland_central: [
    { value: "bindura", label: "Bindura" },
    { value: "guruve", label: "Guruve" },
    { value: "mazowe", label: "Mazowe" },
    { value: "mount_darwin", label: "Mount Darwin" },
    { value: "rushinga", label: "Rushinga" },
    { value: "shamva", label: "Shamva" },
    { value: "mbire", label: "Mbire" },
    { value: "muzarabani", label: "Muzarabani" },
  ],
  mashonaland_east: [
    { value: "chikomba", label: "Chikomba" },
    { value: "goromonzi", label: "Goromonzi" },
    { value: "hwedza", label: "Hwedza" },
    { value: "marondera", label: "Marondera" },
    { value: "mudzi", label: "Mudzi" },
    { value: "murehwa", label: "Murehwa" },
    { value: "mutoko", label: "Mutoko" },
    { value: "seke", label: "Seke" },
    { value: "uzumba_maramba_pfungwe", label: "UMP" },
  ],
  mashonaland_west: [
    { value: "chegutu", label: "Chegutu" },
    { value: "hurungwe", label: "Hurungwe" },
    { value: "kadoma", label: "Kadoma" },
    { value: "kariba", label: "Kariba" },
    { value: "makonde", label: "Makonde" },
    { value: "mhondoro_ngezi", label: "Mhondoro-Ngezi" },
    { value: "norton", label: "Norton" },
    { value: "zvimba", label: "Zvimba" },
  ],
  manicaland: [
    { value: "buhera", label: "Buhera" },
    { value: "chimanimani", label: "Chimanimani" },
    { value: "chipinge", label: "Chipinge" },
    { value: "makoni", label: "Makoni" },
    { value: "mutare", label: "Mutare" },
    { value: "mutasa", label: "Mutasa" },
    { value: "nyanga", label: "Nyanga" },
  ],
  masvingo: [
    { value: "bikita", label: "Bikita" },
    { value: "chiredzi", label: "Chiredzi" },
    { value: "chivi", label: "Chivi" },
    { value: "gutu", label: "Gutu" },
    { value: "masvingo", label: "Masvingo" },
    { value: "mwenezi", label: "Mwenezi" },
    { value: "zaka", label: "Zaka" },
  ],
  midlands: [
    { value: "chirumanzu", label: "Chirumanzu" },
    { value: "gokwe_north", label: "Gokwe North" },
    { value: "gokwe_south", label: "Gokwe South" },
    { value: "gweru", label: "Gweru" },
    { value: "kwekwe", label: "Kwekwe" },
    { value: "mberengwa", label: "Mberengwa" },
    { value: "shurugwi", label: "Shurugwi" },
    { value: "zvishavane", label: "Zvishavane" },
  ],
  matabeleland_north: [
    { value: "binga", label: "Binga" },
    { value: "bubi", label: "Bubi" },
    { value: "hwange", label: "Hwange" },
    { value: "lupane", label: "Lupane" },
    { value: "nkayi", label: "Nkayi" },
    { value: "tsholotsho", label: "Tsholotsho" },
    { value: "umguza", label: "Umguza" },
  ],
  matabeleland_south: [
    { value: "beitbridge", label: "Beitbridge" },
    { value: "bulilima", label: "Bulilima" },
    { value: "gwanda", label: "Gwanda" },
    { value: "insiza", label: "Insiza" },
    { value: "mangwe", label: "Mangwe" },
    { value: "matobo", label: "Matobo" },
    { value: "umzingwane", label: "Umzingwane" },
  ],
};

const STREET_TYPES = [
  { value: "street", label: "Street" },
  { value: "road", label: "Road" },
  { value: "avenue", label: "Avenue" },
  { value: "close", label: "Close" },
  { value: "drive", label: "Drive" },
  { value: "way", label: "Way" },
  { value: "crescent", label: "Crescent" },
  { value: "lane", label: "Lane" },
  { value: "court", label: "Court" },
];

export type SettlementType = "urban" | "peri_urban" | "rural";

export interface AddressData {
  // Administrative hierarchy
  country: string;
  province: string;
  district: string;
  localAuthority: string;
  localAuthorityType: "city_council" | "municipality" | "rdc" | "";
  ward: string;
  
  // Settlement type
  settlementType: SettlementType;
  
  // Urban fields
  houseNumber: string;
  streetName: string;
  streetType: string;
  suburb: string;
  townCity: string;
  standPlotNumber: string;
  flatUnitNumber: string;
  buildingName: string;
  nearestIntersection: string;
  
  // Rural fields
  villageName: string;
  villageHead: string;
  chiefName: string;
  householdName: string;
  headOfHousehold: string;
  relationshipToHead: string;
  
  // Landmarks (rural & peri-urban)
  nearestSchool: string;
  nearestClinic: string;
  nearestBusinessCentre: string;
  nearestChurch: string;
  nearestWaterPoint: string;
  nearestDipTank: string;
  nearestRoad: string;
  landmarkDirection: string;
  
  // Hybrid/Transitional
  farmCompoundName: string;
  plotSectionId: string;
  employerEstateName: string;
  
  // Geospatial (optional)
  gpsLatitude: string;
  gpsLongitude: string;
  gpsAccuracy: string;
  gpsCaptureMethod: string;
  
  // Contact
  phoneOwner: string;
  
  // Residence stability
  lengthOfStay: string;
  isPrimaryResidence: boolean;
  hasSecondaryAddress: boolean;
  seasonalResident: boolean;
  
  // Privacy
  sensitiveAddressFlag: boolean;
  sensitiveReason: string;
}

export const initialAddressData: AddressData = {
  country: "ZW",
  province: "",
  district: "",
  localAuthority: "",
  localAuthorityType: "",
  ward: "",
  settlementType: "urban",
  houseNumber: "",
  streetName: "",
  streetType: "",
  suburb: "",
  townCity: "",
  standPlotNumber: "",
  flatUnitNumber: "",
  buildingName: "",
  nearestIntersection: "",
  villageName: "",
  villageHead: "",
  chiefName: "",
  householdName: "",
  headOfHousehold: "",
  relationshipToHead: "",
  nearestSchool: "",
  nearestClinic: "",
  nearestBusinessCentre: "",
  nearestChurch: "",
  nearestWaterPoint: "",
  nearestDipTank: "",
  nearestRoad: "",
  landmarkDirection: "",
  farmCompoundName: "",
  plotSectionId: "",
  employerEstateName: "",
  gpsLatitude: "",
  gpsLongitude: "",
  gpsAccuracy: "",
  gpsCaptureMethod: "",
  phoneOwner: "self",
  lengthOfStay: "",
  isPrimaryResidence: true,
  hasSecondaryAddress: false,
  seasonalResident: false,
  sensitiveAddressFlag: false,
  sensitiveReason: "",
};

interface AddressCaptureProps {
  data: AddressData;
  onChange: (data: AddressData) => void;
}

export function AddressCapture({ data, onChange }: AddressCaptureProps) {
  const [showOptionalUrban, setShowOptionalUrban] = useState(false);
  const [showLandmarks, setShowLandmarks] = useState(false);
  const [showGeospatial, setShowGeospatial] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const updateField = <K extends keyof AddressData>(field: K, value: AddressData[K]) => {
    onChange({ ...data, [field]: value });
  };
  
  const isUrbanOrPeriUrban = data.settlementType === "urban" || data.settlementType === "peri_urban";
  const isRuralOrPeriUrban = data.settlementType === "rural" || data.settlementType === "peri_urban";
  
  // Get districts for selected province
  const availableDistricts = data.province ? DISTRICTS_BY_PROVINCE[data.province] || [] : [];

  // Auto-set local authority type based on settlement type
  useEffect(() => {
    if (data.settlementType === "urban") {
      updateField("localAuthorityType", "city_council");
    } else if (data.settlementType === "rural") {
      updateField("localAuthorityType", "rdc");
    }
  }, [data.settlementType]);

  return (
    <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
      {/* Settlement Type Selector */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Settlement Type *</Label>
        <RadioGroup
          value={data.settlementType}
          onValueChange={(v) => updateField("settlementType", v as SettlementType)}
          className="grid grid-cols-3 gap-3"
        >
          <div className={cn(
            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
            data.settlementType === "urban" 
              ? "border-primary bg-primary/5" 
              : "border-border hover:border-primary/50"
          )}>
            <RadioGroupItem value="urban" id="urban" />
            <Label htmlFor="urban" className="cursor-pointer flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Urban
            </Label>
          </div>
          <div className={cn(
            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
            data.settlementType === "peri_urban" 
              ? "border-primary bg-primary/5" 
              : "border-border hover:border-primary/50"
          )}>
            <RadioGroupItem value="peri_urban" id="peri_urban" />
            <Label htmlFor="peri_urban" className="cursor-pointer flex items-center gap-2">
              <Home className="w-4 h-4" />
              Peri-Urban
            </Label>
          </div>
          <div className={cn(
            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
            data.settlementType === "rural" 
              ? "border-primary bg-primary/5" 
              : "border-border hover:border-primary/50"
          )}>
            <RadioGroupItem value="rural" id="rural" />
            <Label htmlFor="rural" className="cursor-pointer flex items-center gap-2">
              <Trees className="w-4 h-4" />
              Rural
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Administrative Hierarchy - Always Required */}
      <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Administrative Location
        </h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="province">Province *</Label>
            <Select 
              value={data.province} 
              onValueChange={(v) => {
                updateField("province", v);
                updateField("district", ""); // Reset district when province changes
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select province" />
              </SelectTrigger>
              <SelectContent>
                {PROVINCES.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="district">District *</Label>
            <Select 
              value={data.district} 
              onValueChange={(v) => updateField("district", v)}
              disabled={!data.province}
            >
              <SelectTrigger>
                <SelectValue placeholder={data.province ? "Select district" : "Select province first"} />
              </SelectTrigger>
              <SelectContent>
                {availableDistricts.map(d => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="localAuthority">
              {data.settlementType === "rural" ? "Rural District Council" : "Local Authority"} *
            </Label>
            <Input
              id="localAuthority"
              value={data.localAuthority}
              onChange={(e) => updateField("localAuthority", e.target.value)}
              placeholder={data.settlementType === "rural" ? "e.g., Chivi RDC" : "e.g., Harare City Council"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ward">Ward *</Label>
            <Input
              id="ward"
              value={data.ward}
              onChange={(e) => updateField("ward", e.target.value)}
              placeholder="e.g., Ward 12 or Chikwaka"
            />
          </div>
        </div>
      </div>

      {/* Urban Address Fields */}
      {isUrbanOrPeriUrban && (
        <div className="space-y-4 p-4 bg-blue-500/5 rounded-lg border border-blue-500/20">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            Street Address
          </h4>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="houseNumber">House/Stand Number *</Label>
              <Input
                id="houseNumber"
                value={data.houseNumber}
                onChange={(e) => updateField("houseNumber", e.target.value)}
                placeholder="e.g., 123"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="streetName">Street Name *</Label>
              <Input
                id="streetName"
                value={data.streetName}
                onChange={(e) => updateField("streetName", e.target.value)}
                placeholder="e.g., Samora Machel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="streetType">Street Type</Label>
              <Select value={data.streetType} onValueChange={(v) => updateField("streetType", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {STREET_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="suburb">Suburb / Location *</Label>
              <Input
                id="suburb"
                value={data.suburb}
                onChange={(e) => updateField("suburb", e.target.value)}
                placeholder="e.g., Avondale"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="townCity">Town / City *</Label>
              <Input
                id="townCity"
                value={data.townCity}
                onChange={(e) => updateField("townCity", e.target.value)}
                placeholder="e.g., Harare"
              />
            </div>
          </div>
          
          {/* Optional Urban Fields */}
          <Collapsible open={showOptionalUrban} onOpenChange={setShowOptionalUrban}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between">
                <span className="text-sm text-muted-foreground">Property Details (Optional)</span>
                {showOptionalUrban ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="standPlotNumber">Stand/Plot Number</Label>
                  <Input
                    id="standPlotNumber"
                    value={data.standPlotNumber}
                    onChange={(e) => updateField("standPlotNumber", e.target.value)}
                    placeholder="e.g., Stand 1234"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flatUnitNumber">Flat/Unit Number</Label>
                  <Input
                    id="flatUnitNumber"
                    value={data.flatUnitNumber}
                    onChange={(e) => updateField("flatUnitNumber", e.target.value)}
                    placeholder="e.g., Unit 5B"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buildingName">Building Name</Label>
                  <Input
                    id="buildingName"
                    value={data.buildingName}
                    onChange={(e) => updateField("buildingName", e.target.value)}
                    placeholder="e.g., Century Towers"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nearestIntersection">Nearest Intersection / Cross Street</Label>
                <Input
                  id="nearestIntersection"
                  value={data.nearestIntersection}
                  onChange={(e) => updateField("nearestIntersection", e.target.value)}
                  placeholder="e.g., Corner of 1st Street and Samora Machel"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      {/* Rural Address Fields */}
      {isRuralOrPeriUrban && (
        <div className="space-y-4 p-4 bg-green-500/5 rounded-lg border border-green-500/20">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Trees className="w-4 h-4 text-green-600" />
            Village & Household
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="villageName">Village Name *</Label>
              <Input
                id="villageName"
                value={data.villageName}
                onChange={(e) => updateField("villageName", e.target.value)}
                placeholder="e.g., Chinamhora"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="householdName">Household / Homestead Name *</Label>
              <Input
                id="householdName"
                value={data.householdName}
                onChange={(e) => updateField("householdName", e.target.value)}
                placeholder="e.g., Moyo Homestead"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="villageHead">Village Head (Sabhuku)</Label>
              <Input
                id="villageHead"
                value={data.villageHead}
                onChange={(e) => updateField("villageHead", e.target.value)}
                placeholder="e.g., Sabhuku Moyo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chiefName">Chief / Traditional Authority</Label>
              <Input
                id="chiefName"
                value={data.chiefName}
                onChange={(e) => updateField("chiefName", e.target.value)}
                placeholder="e.g., Chief Chinamhora"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="headOfHousehold">Head of Household</Label>
              <Input
                id="headOfHousehold"
                value={data.headOfHousehold}
                onChange={(e) => updateField("headOfHousehold", e.target.value)}
                placeholder="Full name"
              />
            </div>
          </div>
          
          {data.headOfHousehold && (
            <div className="space-y-2">
              <Label htmlFor="relationshipToHead">Relationship to Head of Household</Label>
              <Select value={data.relationshipToHead} onValueChange={(v) => updateField("relationshipToHead", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="self">Self (I am the head)</SelectItem>
                  <SelectItem value="spouse">Spouse</SelectItem>
                  <SelectItem value="child">Child</SelectItem>
                  <SelectItem value="grandchild">Grandchild</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="sibling">Sibling</SelectItem>
                  <SelectItem value="relative">Other Relative</SelectItem>
                  <SelectItem value="non_relative">Non-Relative</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Landmarks Section (Rural & Peri-Urban) */}
      {isRuralOrPeriUrban && (
        <Collapsible open={showLandmarks} onOpenChange={setShowLandmarks}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Navigation className="w-4 h-4" />
                Descriptive Landmarks
              </span>
              {showLandmarks ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4 p-4 bg-muted/30 rounded-lg mt-2">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="w-3 h-3" />
              Add nearby landmarks to help locate the address
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nearestSchool">Nearest School</Label>
                <Input
                  id="nearestSchool"
                  value={data.nearestSchool}
                  onChange={(e) => updateField("nearestSchool", e.target.value)}
                  placeholder="e.g., Chinamhora Primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nearestClinic">Nearest Clinic / Health Facility</Label>
                <Input
                  id="nearestClinic"
                  value={data.nearestClinic}
                  onChange={(e) => updateField("nearestClinic", e.target.value)}
                  placeholder="e.g., Domboshava Clinic"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nearestBusinessCentre">Nearest Business Centre / Growth Point</Label>
                <Input
                  id="nearestBusinessCentre"
                  value={data.nearestBusinessCentre}
                  onChange={(e) => updateField("nearestBusinessCentre", e.target.value)}
                  placeholder="e.g., Murewa Growth Point"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nearestChurch">Nearest Church / Mission / Mosque</Label>
                <Input
                  id="nearestChurch"
                  value={data.nearestChurch}
                  onChange={(e) => updateField("nearestChurch", e.target.value)}
                  placeholder="e.g., St. Mary's Mission"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nearestWaterPoint">Nearest Borehole / Water Point</Label>
                <Input
                  id="nearestWaterPoint"
                  value={data.nearestWaterPoint}
                  onChange={(e) => updateField("nearestWaterPoint", e.target.value)}
                  placeholder="e.g., Village Borehole"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nearestDipTank">Nearest Dip Tank</Label>
                <Input
                  id="nearestDipTank"
                  value={data.nearestDipTank}
                  onChange={(e) => updateField("nearestDipTank", e.target.value)}
                  placeholder="e.g., Chinamhora Dip Tank"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nearestRoad">Nearest Road / Track</Label>
                <Input
                  id="nearestRoad"
                  value={data.nearestRoad}
                  onChange={(e) => updateField("nearestRoad", e.target.value)}
                  placeholder="e.g., Shamva Road"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="landmarkDirection">Distance / Direction from Landmark</Label>
              <Textarea
                id="landmarkDirection"
                value={data.landmarkDirection}
                onChange={(e) => updateField("landmarkDirection", e.target.value)}
                placeholder="e.g., 2 km east of Chinamhora Primary School, past the blue shop"
                rows={2}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Hybrid / Transitional (Peri-Urban, Farms, Mines) */}
      {data.settlementType === "peri_urban" && (
        <div className="space-y-4 p-4 bg-amber-500/5 rounded-lg border border-amber-500/20">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Home className="w-4 h-4 text-amber-600" />
            Farm / Resettlement / Compound Details (if applicable)
          </h4>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="farmCompoundName">Farm / Compound Name</Label>
              <Input
                id="farmCompoundName"
                value={data.farmCompoundName}
                onChange={(e) => updateField("farmCompoundName", e.target.value)}
                placeholder="e.g., Nyamweda Farm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plotSectionId">Plot / Section Identifier</Label>
              <Input
                id="plotSectionId"
                value={data.plotSectionId}
                onChange={(e) => updateField("plotSectionId", e.target.value)}
                placeholder="e.g., Plot 15, Section B"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employerEstateName">Employer / Estate / Mine Name</Label>
              <Input
                id="employerEstateName"
                value={data.employerEstateName}
                onChange={(e) => updateField("employerEstateName", e.target.value)}
                placeholder="e.g., Mazowe Citrus"
              />
            </div>
          </div>
        </div>
      )}

      {/* Phone Owner */}
      <div className="space-y-2">
        <Label>Phone Owner</Label>
        <Select value={data.phoneOwner} onValueChange={(v) => updateField("phoneOwner", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Who owns the phone?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="self">Self</SelectItem>
            <SelectItem value="spouse">Spouse</SelectItem>
            <SelectItem value="relative">Relative</SelectItem>
            <SelectItem value="neighbour">Neighbour</SelectItem>
            <SelectItem value="village_head">Village Head / Landlord</SelectItem>
            <SelectItem value="employer">Employer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Geospatial (Optional) */}
      <Collapsible open={showGeospatial} onOpenChange={setShowGeospatial}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              GPS Coordinates (Optional)
            </span>
            {showGeospatial ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-4 p-4 bg-muted/30 rounded-lg mt-2">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gpsLatitude">Latitude</Label>
              <Input
                id="gpsLatitude"
                value={data.gpsLatitude}
                onChange={(e) => updateField("gpsLatitude", e.target.value)}
                placeholder="e.g., -17.8252"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gpsLongitude">Longitude</Label>
              <Input
                id="gpsLongitude"
                value={data.gpsLongitude}
                onChange={(e) => updateField("gpsLongitude", e.target.value)}
                placeholder="e.g., 31.0335"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gpsCaptureMethod">Capture Method</Label>
              <Select value={data.gpsCaptureMethod} onValueChange={(v) => updateField("gpsCaptureMethod", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="device_gps">Device GPS</SelectItem>
                  <SelectItem value="map_pin">Map Pin</SelectItem>
                  <SelectItem value="manual">Manual / Approximate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Advanced Options */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground">
            <span>Advanced Options</span>
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lengthOfStay">Length of Stay at This Address</Label>
              <Select value={data.lengthOfStay} onValueChange={(v) => updateField("lengthOfStay", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="less_than_6_months">Less than 6 months</SelectItem>
                  <SelectItem value="6_to_12_months">6-12 months</SelectItem>
                  <SelectItem value="1_to_2_years">1-2 years</SelectItem>
                  <SelectItem value="2_to_5_years">2-5 years</SelectItem>
                  <SelectItem value="5_to_10_years">5-10 years</SelectItem>
                  <SelectItem value="more_than_10_years">More than 10 years</SelectItem>
                  <SelectItem value="since_birth">Since birth</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// Helper function to format address for display
export function formatAddress(data: AddressData): string {
  const parts: string[] = [];
  
  if (data.settlementType === "urban" || data.settlementType === "peri_urban") {
    if (data.houseNumber) parts.push(data.houseNumber);
    if (data.streetName) parts.push(`${data.streetName} ${data.streetType || ""}`.trim());
    if (data.suburb) parts.push(data.suburb);
    if (data.townCity) parts.push(data.townCity);
  }
  
  if (data.settlementType === "rural" || data.settlementType === "peri_urban") {
    if (data.villageName) parts.push(data.villageName);
    if (data.householdName && data.settlementType === "rural") parts.push(data.householdName);
  }
  
  const province = PROVINCES.find(p => p.value === data.province);
  if (province) parts.push(province.label);
  
  if (parts.length === 0) return "Address not provided";
  return parts.join(", ");
}
