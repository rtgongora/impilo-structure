import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { 
  Package, 
  Download, 
  RefreshCw, 
  FileSpreadsheet,
  Building2
} from "lucide-react";
import { PHIDService, PHIDBatch } from "@/services/phidService";

const FACILITIES = [
  { id: "FAC-001", name: "Parirenyatwa Group of Hospitals" },
  { id: "FAC-002", name: "Mpilo Central Hospital" },
  { id: "FAC-003", name: "Harare Central Hospital" },
  { id: "FAC-004", name: "Sally Mugabe Central Hospital" },
  { id: "FAC-005", name: "United Bulawayo Hospitals" },
];

export function IdBatchGenerator() {
  const [selectedFacility, setSelectedFacility] = useState("");
  const [batchSize, setBatchSize] = useState("50");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBatch, setGeneratedBatch] = useState<PHIDBatch | null>(null);

  const handleGenerateBatch = async () => {
    if (!selectedFacility) {
      toast.error("Please select a facility");
      return;
    }

    const size = parseInt(batchSize);
    if (isNaN(size) || size < 1 || size > 1000) {
      toast.error("Batch size must be between 1 and 1000");
      return;
    }

    setIsGenerating(true);
    try {
      const batch = await PHIDService.generateBatch(selectedFacility, size);
      setGeneratedBatch(batch);
      toast.success(`Generated ${batch.count} PHIDs for ${batch.facilityName}`);
    } catch (error) {
      toast.error("Failed to generate batch");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!generatedBatch) return;

    const csv = PHIDService.exportBatchAsCSV(generatedBatch);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `phid-batch-${generatedBatch.facilityId}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          Batch PHID Generation
        </CardTitle>
        <CardDescription>
          Pre-generate PHIDs for offline facility use
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Facility</Label>
            <Select value={selectedFacility} onValueChange={setSelectedFacility}>
              <SelectTrigger>
                <SelectValue placeholder="Select facility" />
              </SelectTrigger>
              <SelectContent>
                {FACILITIES.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      {f.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Batch Size</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="1"
                max="1000"
                value={batchSize}
                onChange={(e) => setBatchSize(e.target.value)}
                placeholder="1-1000"
              />
              <Button
                onClick={handleGenerateBatch}
                disabled={isGenerating || !selectedFacility}
              >
                {isGenerating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Package className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {generatedBatch && (
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{generatedBatch.facilityName}</p>
                <p className="text-sm text-muted-foreground">
                  Generated {generatedBatch.count} PHIDs
                </p>
              </div>
              <Button variant="outline" onClick={handleDownloadCSV}>
                <Download className="w-4 h-4 mr-2" />
                Download CSV
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline">
                <FileSpreadsheet className="w-3 h-3 mr-1" />
                {generatedBatch.count} IDs
              </Badge>
              <Badge variant="secondary">
                {new Date(generatedBatch.generatedAt).toLocaleDateString()}
              </Badge>
            </div>

            <ScrollArea className="h-40 border rounded-md p-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {generatedBatch.phids.slice(0, 100).map((phid, i) => (
                  <code 
                    key={i} 
                    className="text-xs font-mono bg-background p-1 rounded text-center"
                  >
                    {PHIDService.format(phid)}
                  </code>
                ))}
                {generatedBatch.phids.length > 100 && (
                  <div className="col-span-full text-center text-sm text-muted-foreground">
                    ... and {generatedBatch.phids.length - 100} more (download CSV for full list)
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
