import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, FlaskConical, Clock, CheckCircle } from "lucide-react";

const MOCK_ORDERS = [
  {
    id: 1,
    type: "Lab",
    name: "Complete Blood Count",
    status: "pending",
    ordered: "2024-12-21 08:00",
    orderedBy: "Dr. Mwangi",
  },
  {
    id: 2,
    type: "Lab",
    name: "Basic Metabolic Panel",
    status: "completed",
    ordered: "2024-12-20 14:00",
    orderedBy: "Dr. Mwangi",
  },
  {
    id: 3,
    type: "Imaging",
    name: "Chest X-Ray",
    status: "completed",
    ordered: "2024-12-19 10:30",
    orderedBy: "Dr. Mwangi",
  },
];

const MOCK_RESULTS = [
  {
    id: 1,
    name: "Basic Metabolic Panel",
    date: "2024-12-20 16:30",
    status: "normal",
    highlights: ["Glucose: 126 mg/dL (H)", "Creatinine: 0.9 mg/dL"],
  },
  {
    id: 2,
    name: "Urinalysis",
    date: "2024-12-19 11:00",
    status: "abnormal",
    highlights: ["WBC: Positive", "Nitrites: Positive", "Bacteria: Moderate"],
  },
];

export function OrdersSection() {
  return (
    <div className="space-y-6">
      {/* Active Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Orders
          </CardTitle>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1" />
            New Order
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {MOCK_ORDERS.map((order) => (
              <div
                key={order.id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {order.status === "pending" ? (
                      <Clock className="w-5 h-5 text-warning" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-success" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {order.type}
                        </Badge>
                        <h4 className="font-medium">{order.name}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {order.ordered} • {order.orderedBy}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={order.status === "pending" ? "secondary" : "default"}
                    className="capitalize"
                  >
                    {order.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-primary" />
            Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {MOCK_RESULTS.map((result) => (
              <div
                key={result.id}
                className={`p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${
                  result.status === "abnormal" ? "border-l-4 border-l-warning" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{result.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{result.date}</span>
                    <Badge
                      variant={result.status === "normal" ? "secondary" : "outline"}
                      className={`capitalize ${
                        result.status === "abnormal" ? "border-warning text-warning" : ""
                      }`}
                    >
                      {result.status}
                    </Badge>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {result.highlights.join(" • ")}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
