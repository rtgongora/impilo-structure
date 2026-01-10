import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLabTestCatalog, type LabTestCatalogItem } from "@/hooks/lims/useLabTestCatalog";
import { useLabOrderEntry } from "@/hooks/lims/useLabOrderEntry";
import { Search, Plus, Minus, FlaskConical, Clock, AlertTriangle, ShoppingCart, X, Stethoscope } from "lucide-react";

interface LabOrderEntryFormProps {
  patientId: string;
  patientName: string;
  encounterId?: string;
  onOrderCreated?: (order: any) => void;
}

export function LabOrderEntryForm({ patientId, patientName, encounterId, onOrderCreated }: LabOrderEntryFormProps) {
  const { tests, loading, categories } = useLabTestCatalog();
  const { createLabOrder, creating } = useLabOrderEntry();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<LabTestCatalogItem[]>([]);
  const [priority, setPriority] = useState<"routine" | "urgent" | "stat">("routine");
  const [clinicalIndication, setClinicalIndication] = useState("");
  const [diagnosisCode, setDiagnosisCode] = useState("");
  const [notes, setNotes] = useState("");
  const [infectionFlags, setInfectionFlags] = useState<string[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  const filteredTests = tests.filter(test => {
    const matchesSearch = test.test_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.test_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (test.loinc_code?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || test.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (test: LabTestCatalogItem) => {
    if (!cart.find(t => t.id === test.id)) {
      setCart([...cart, test]);
    }
  };

  const removeFromCart = (testId: string) => {
    setCart(cart.filter(t => t.id !== testId));
  };

  const handleSubmit = async () => {
    const order = await createLabOrder({
      tests: cart,
      patient_id: patientId,
      encounter_id: encounterId,
      priority,
      clinical_indication: clinicalIndication || undefined,
      diagnosis_code: diagnosisCode || undefined,
      notes: notes || undefined,
      infection_control_flags: infectionFlags.length > 0 ? infectionFlags : undefined,
    });

    if (order) {
      setCart([]);
      setClinicalIndication("");
      setDiagnosisCode("");
      setNotes("");
      setPriority("routine");
      setInfectionFlags([]);
      onOrderCreated?.(order);
    }
  };

  const toggleInfectionFlag = (flag: string) => {
    setInfectionFlags(prev => 
      prev.includes(flag) ? prev.filter(f => f !== flag) : [...prev, flag]
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
      {/* Test Catalog */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-primary" />
                Test Catalog
              </CardTitle>
              <Badge variant="outline">{patientName}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search and Filter */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search tests by name, code, or LOINC..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Test List */}
            <Tabs defaultValue="tests">
              <TabsList>
                <TabsTrigger value="tests">Available Tests</TabsTrigger>
                <TabsTrigger value="panels">Panels</TabsTrigger>
                <TabsTrigger value="frequent">Frequently Ordered</TabsTrigger>
              </TabsList>
              
              <TabsContent value="tests">
                <ScrollArea className="h-[400px]">
                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <p className="text-muted-foreground">Loading tests...</p>
                    </div>
                  ) : filteredTests.length === 0 ? (
                    <div className="flex items-center justify-center h-32">
                      <p className="text-muted-foreground">No tests found</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredTests.map(test => (
                        <div
                          key={test.id}
                          className={`p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer ${
                            cart.find(t => t.id === test.id) ? "bg-primary/10 border-primary" : ""
                          }`}
                          onClick={() => addToCart(test)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{test.test_name}</span>
                                {test.requires_fasting && (
                                  <Badge variant="outline" className="text-xs">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Fasting
                                  </Badge>
                                )}
                                {test.is_panel && (
                                  <Badge className="bg-purple-500 text-xs">Panel</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                <span className="font-mono">{test.test_code}</span>
                                {test.loinc_code && <span>LOINC: {test.loinc_code}</span>}
                                <Badge variant="secondary" className="text-xs">{test.category}</Badge>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Specimen: {test.specimen_type} • TAT: {test.turnaround_time_hours}h
                              </div>
                            </div>
                            <Button
                              variant={cart.find(t => t.id === test.id) ? "default" : "outline"}
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (cart.find(t => t.id === test.id)) {
                                  removeFromCart(test.id);
                                } else {
                                  addToCart(test);
                                }
                              }}
                            >
                              {cart.find(t => t.id === test.id) ? (
                                <><Minus className="h-4 w-4" /></>
                              ) : (
                                <><Plus className="h-4 w-4" /></>
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="panels">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {tests.filter(t => t.is_panel).map(test => (
                      <div
                        key={test.id}
                        className={`p-3 border rounded-lg hover:bg-accent/50 cursor-pointer ${
                          cart.find(t => t.id === test.id) ? "bg-primary/10 border-primary" : ""
                        }`}
                        onClick={() => addToCart(test)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{test.test_name}</span>
                            <Badge className="bg-purple-500 text-xs ml-2">Panel</Badge>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(test);
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="frequent">
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  Frequently ordered tests will appear here based on usage
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Order Cart */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Order Cart ({cart.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Select tests to add to order
              </p>
            ) : (
              <>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {cart.map(test => (
                      <div key={test.id} className="flex items-center justify-between p-2 bg-accent/50 rounded">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{test.test_name}</p>
                          <p className="text-xs text-muted-foreground">{test.specimen_type}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromCart(test.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Priority */}
                <div>
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="routine">Routine</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="stat">STAT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Clinical Indication */}
                <div>
                  <Label>Clinical Indication</Label>
                  <Input
                    value={clinicalIndication}
                    onChange={(e) => setClinicalIndication(e.target.value)}
                    placeholder="Reason for ordering..."
                  />
                </div>

                {/* Show More Details */}
                <Dialog open={showDetails} onOpenChange={setShowDetails}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full" size="sm">
                      <Stethoscope className="h-4 w-4 mr-2" />
                      More Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Order Details</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>ICD-11 Diagnosis Code</Label>
                        <Input
                          value={diagnosisCode}
                          onChange={(e) => setDiagnosisCode(e.target.value)}
                          placeholder="e.g., 5A11"
                        />
                      </div>
                      <div>
                        <Label>Infection Control Flags</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {["MRSA", "VRE", "C. diff", "TB", "COVID-19", "Hepatitis B", "HIV"].map(flag => (
                            <Badge
                              key={flag}
                              variant={infectionFlags.includes(flag) ? "default" : "outline"}
                              className="cursor-pointer"
                              onClick={() => toggleInfectionFlag(flag)}
                            >
                              {infectionFlags.includes(flag) && <AlertTriangle className="h-3 w-3 mr-1" />}
                              {flag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label>Additional Notes</Label>
                        <Textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Special instructions..."
                          rows={3}
                        />
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button 
                  className="w-full" 
                  onClick={handleSubmit}
                  disabled={creating || cart.length === 0}
                >
                  {creating ? "Creating Order..." : `Submit Order (${cart.length} tests)`}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
