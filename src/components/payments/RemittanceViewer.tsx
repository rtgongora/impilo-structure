import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  FileText, 
  Download, 
  Search, 
  ChevronDown, 
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Building2,
  Hash,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ClaimLine {
  serviceDate: string;
  procedureCode: string;
  description: string;
  chargedAmount: number;
  allowedAmount: number;
  paidAmount: number;
  adjustmentReason: string;
  patientResponsibility: number;
}

interface RemittanceAdvice {
  id: string;
  eraNumber: string;
  payerName: string;
  checkNumber: string;
  checkDate: string;
  totalPaid: number;
  claimCount: number;
  status: "processed" | "pending" | "partial";
  claims: {
    claimNumber: string;
    patientName: string;
    dateOfService: string;
    chargedAmount: number;
    allowedAmount: number;
    paidAmount: number;
    adjustments: number;
    patientResponsibility: number;
    status: "paid" | "denied" | "partial";
    denialReason?: string;
    lines: ClaimLine[];
  }[];
}

const MOCK_REMITTANCES: RemittanceAdvice[] = [
  {
    id: "1",
    eraNumber: "ERA-2024-00156",
    payerName: "PSMAS",
    checkNumber: "CHK-789456",
    checkDate: "2024-01-15",
    totalPaid: 45680.00,
    claimCount: 12,
    status: "processed",
    claims: [
      {
        claimNumber: "CLM-2024-001234",
        patientName: "John Moyo",
        dateOfService: "2024-01-05",
        chargedAmount: 5500.00,
        allowedAmount: 4800.00,
        paidAmount: 4320.00,
        adjustments: 700.00,
        patientResponsibility: 480.00,
        status: "paid",
        lines: [
          { serviceDate: "2024-01-05", procedureCode: "99213", description: "Office Visit - Level 3", chargedAmount: 1500.00, allowedAmount: 1200.00, paidAmount: 1080.00, adjustmentReason: "Contractual Adjustment", patientResponsibility: 120.00 },
          { serviceDate: "2024-01-05", procedureCode: "80053", description: "Comprehensive Metabolic Panel", chargedAmount: 800.00, allowedAmount: 650.00, paidAmount: 585.00, adjustmentReason: "Contractual Adjustment", patientResponsibility: 65.00 },
          { serviceDate: "2024-01-05", procedureCode: "71046", description: "Chest X-Ray, 2 Views", chargedAmount: 1200.00, allowedAmount: 950.00, paidAmount: 855.00, adjustmentReason: "Contractual Adjustment", patientResponsibility: 95.00 },
        ]
      },
      {
        claimNumber: "CLM-2024-001235",
        patientName: "Grace Ndlovu",
        dateOfService: "2024-01-06",
        chargedAmount: 3200.00,
        allowedAmount: 0,
        paidAmount: 0,
        adjustments: 3200.00,
        patientResponsibility: 0,
        status: "denied",
        denialReason: "Prior authorization required",
        lines: [
          { serviceDate: "2024-01-06", procedureCode: "72148", description: "MRI Lumbar Spine", chargedAmount: 3200.00, allowedAmount: 0, paidAmount: 0, adjustmentReason: "CO-4: Prior auth required", patientResponsibility: 0 },
        ]
      },
      {
        claimNumber: "CLM-2024-001236",
        patientName: "Tinashe Chikwanha",
        dateOfService: "2024-01-07",
        chargedAmount: 8500.00,
        allowedAmount: 7200.00,
        paidAmount: 5760.00,
        adjustments: 1300.00,
        patientResponsibility: 1440.00,
        status: "partial",
        denialReason: "Service partially covered",
        lines: [
          { serviceDate: "2024-01-07", procedureCode: "99214", description: "Office Visit - Level 4", chargedAmount: 2000.00, allowedAmount: 1800.00, paidAmount: 1440.00, adjustmentReason: "Contractual Adjustment", patientResponsibility: 360.00 },
          { serviceDate: "2024-01-07", procedureCode: "93000", description: "Electrocardiogram", chargedAmount: 500.00, allowedAmount: 400.00, paidAmount: 320.00, adjustmentReason: "Contractual Adjustment", patientResponsibility: 80.00 },
        ]
      }
    ]
  },
  {
    id: "2",
    eraNumber: "ERA-2024-00155",
    payerName: "CIMAS",
    checkNumber: "CHK-789123",
    checkDate: "2024-01-12",
    totalPaid: 28450.00,
    claimCount: 8,
    status: "processed",
    claims: []
  }
];

export function RemittanceViewer() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedERA, setSelectedERA] = useState<RemittanceAdvice | null>(MOCK_REMITTANCES[0]);
  const [expandedClaims, setExpandedClaims] = useState<string[]>([]);

  const toggleClaimExpansion = (claimNumber: string) => {
    setExpandedClaims(prev =>
      prev.includes(claimNumber)
        ? prev.filter(c => c !== claimNumber)
        : [...prev, claimNumber]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
      case "processed":
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "denied":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "partial":
      case "pending":
        return <AlertCircle className="h-4 w-4 text-warning" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      paid: "bg-success/10 text-success",
      processed: "bg-success/10 text-success",
      denied: "bg-destructive/10 text-destructive",
      partial: "bg-warning/10 text-warning",
      pending: "bg-warning/10 text-warning",
    };
    return variants[status] || "bg-muted text-muted-foreground";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-12 gap-4 h-full">
      {/* ERA List */}
      <div className="col-span-4 border-r">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Remittance Advices (ERA)
            </CardTitle>
            <div className="flex gap-2 mt-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search ERA..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-28 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="processed">Processed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="space-y-1 p-2">
                {MOCK_REMITTANCES.map((era) => (
                  <div
                    key={era.id}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer transition-colors",
                      selectedERA?.id === era.id ? "bg-primary/10 border border-primary/30" : "hover:bg-muted"
                    )}
                    onClick={() => setSelectedERA(era)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{era.eraNumber}</span>
                      {getStatusIcon(era.status)}
                    </div>
                    <p className="text-xs text-muted-foreground">{era.payerName}</p>
                    <div className="flex items-center justify-between mt-2 text-xs">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(era.checkDate), "MMM d, yyyy")}
                      </span>
                      <span className="font-semibold text-success">
                        {formatCurrency(era.totalPaid)}
                      </span>
                    </div>
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {era.claimCount} claims
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* ERA Detail */}
      <div className="col-span-8">
        {selectedERA ? (
          <Card className="h-full">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{selectedERA.eraNumber}</CardTitle>
                  <CardDescription>{selectedERA.payerName}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Download 835
                  </Button>
                  <Button size="sm">Post Payments</Button>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-4 mt-4">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Check Number</p>
                  <p className="font-semibold">{selectedERA.checkNumber}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Check Date</p>
                  <p className="font-semibold">{format(new Date(selectedERA.checkDate), "MMM d, yyyy")}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Total Claims</p>
                  <p className="font-semibold">{selectedERA.claimCount}</p>
                </div>
                <div className="bg-success/10 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Total Paid</p>
                  <p className="font-semibold text-success">{formatCurrency(selectedERA.totalPaid)}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <div className="p-4 space-y-3">
                  {selectedERA.claims.map((claim) => (
                    <Collapsible
                      key={claim.claimNumber}
                      open={expandedClaims.includes(claim.claimNumber)}
                      onOpenChange={() => toggleClaimExpansion(claim.claimNumber)}
                    >
                      <div className="border rounded-lg overflow-hidden">
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-4">
                              {getStatusIcon(claim.status)}
                              <div className="text-left">
                                <p className="font-medium">{claim.claimNumber}</p>
                                <p className="text-sm text-muted-foreground">{claim.patientName}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-6 text-sm">
                              <div className="text-right">
                                <p className="text-muted-foreground">Charged</p>
                                <p className="font-medium">{formatCurrency(claim.chargedAmount)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-muted-foreground">Paid</p>
                                <p className="font-medium text-success">{formatCurrency(claim.paidAmount)}</p>
                              </div>
                              <Badge className={getStatusBadge(claim.status)}>
                                {claim.status}
                              </Badge>
                              <ChevronDown className={cn(
                                "h-4 w-4 transition-transform",
                                expandedClaims.includes(claim.claimNumber) && "rotate-180"
                              )} />
                            </div>
                          </div>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <div className="border-t bg-muted/30 p-4">
                            {claim.denialReason && (
                              <div className="mb-3 p-2 bg-destructive/10 rounded text-sm text-destructive">
                                <strong>Denial Reason:</strong> {claim.denialReason}
                              </div>
                            )}
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-left text-muted-foreground">
                                  <th className="pb-2">Date</th>
                                  <th className="pb-2">Code</th>
                                  <th className="pb-2">Description</th>
                                  <th className="pb-2 text-right">Charged</th>
                                  <th className="pb-2 text-right">Allowed</th>
                                  <th className="pb-2 text-right">Paid</th>
                                  <th className="pb-2 text-right">Patient</th>
                                </tr>
                              </thead>
                              <tbody>
                                {claim.lines.map((line, idx) => (
                                  <tr key={idx} className="border-t">
                                    <td className="py-2">{format(new Date(line.serviceDate), "MM/dd")}</td>
                                    <td className="py-2 font-mono">{line.procedureCode}</td>
                                    <td className="py-2">{line.description}</td>
                                    <td className="py-2 text-right">{formatCurrency(line.chargedAmount)}</td>
                                    <td className="py-2 text-right">{formatCurrency(line.allowedAmount)}</td>
                                    <td className="py-2 text-right text-success">{formatCurrency(line.paidAmount)}</td>
                                    <td className="py-2 text-right">{formatCurrency(line.patientResponsibility)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        ) : (
          <Card className="h-full flex items-center justify-center">
            <CardContent className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select an ERA to view details</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
