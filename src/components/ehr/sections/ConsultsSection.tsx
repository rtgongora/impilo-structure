import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Send, Clock, CheckCircle } from "lucide-react";

const MOCK_CONSULTS = [
  {
    id: 1,
    specialty: "Endocrinology",
    reason: "Diabetes management review",
    status: "pending",
    requested: "2024-12-21 09:00",
    requestedBy: "Dr. Mwangi",
  },
  {
    id: 2,
    specialty: "Infectious Disease",
    reason: "Recurrent UTI evaluation",
    status: "scheduled",
    requested: "2024-12-20 14:00",
    scheduledDate: "2024-12-22 10:00",
    requestedBy: "Dr. Mwangi",
  },
];

const MOCK_REFERRALS = [
  {
    id: 1,
    destination: "Diabetes Clinic",
    reason: "Outpatient diabetes management",
    status: "pending",
    date: "2024-12-21",
  },
];

export function ConsultsSection() {
  return (
    <div className="space-y-6">
      {/* Consults */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Consultations
          </CardTitle>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Request Consult
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {MOCK_CONSULTS.map((consult) => (
              <div
                key={consult.id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {consult.status === "pending" ? (
                      <Clock className="w-5 h-5 text-warning" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-success" />
                    )}
                    <div>
                      <h4 className="font-medium">{consult.specialty}</h4>
                      <p className="text-sm text-muted-foreground">{consult.reason}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Requested: {consult.requested}
                        {consult.scheduledDate && ` • Scheduled: ${consult.scheduledDate}`}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={consult.status === "pending" ? "secondary" : "default"}
                    className="capitalize"
                  >
                    {consult.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Referrals */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            Referrals
          </CardTitle>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1" />
            New Referral
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {MOCK_REFERRALS.map((referral) => (
              <div
                key={referral.id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{referral.destination}</h4>
                    <p className="text-sm text-muted-foreground">{referral.reason}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Created: {referral.date}
                    </p>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {referral.status}
                  </Badge>
                </div>
              </div>
            ))}
            <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground">
              Click to create a new referral
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
