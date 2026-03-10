import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Baby, Heart, Activity, FileText, ArrowRightLeft } from "lucide-react";

const SAMPLE_BIRTHS = [
  { id: "BN-2026-001", childName: "Baby Moyo", dob: "2026-03-08", sex: "M", facility: "Parirenyatwa Hospital", status: "registered", notificationNumber: "BN-HAR-2026-001234" },
  { id: "BN-2026-002", childName: "Baby Ndlovu", dob: "2026-03-09", sex: "F", facility: "Mpilo Hospital", status: "pending_verification", notificationNumber: "BN-BUL-2026-000892" },
  { id: "BN-2026-003", childName: "Baby Chirwa", dob: "2026-03-07", sex: "M", facility: "Community (Epworth)", status: "submitted", notificationNumber: "BN-HAR-2026-001230" },
];

const SAMPLE_DEATHS = [
  { id: "DN-2026-001", deceasedCpid: "CPID-xyz789", dod: "2026-03-06", facility: "Harare Hospital", cause: "Cardiopulmonary failure", status: "registered" },
  { id: "DN-2026-002", deceasedCpid: "CPID-uvw456", dod: "2026-03-08", facility: "Community (Chitungwiza)", cause: "Under investigation", status: "pending_verification" },
];

export default function UbomiAdmin() {
  return (
    <AppLayout title="UBOMI — CRVS Interface">
      <div className="p-4 space-y-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            UBOMI — Civil Registration & Vital Statistics Interface
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Birth/death linkage protocols, identity event handling, and reconciliation patterns
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-4 text-center">
            <Baby className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">1,245</p>
            <p className="text-xs text-muted-foreground">Births This Month</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <FileText className="h-6 w-6 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">312</p>
            <p className="text-xs text-muted-foreground">Deaths This Month</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <ArrowRightLeft className="h-6 w-6 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">89</p>
            <p className="text-xs text-muted-foreground">Pending Reconciliation</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Activity className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">97.2%</p>
            <p className="text-xs text-muted-foreground">Linkage Success Rate</p>
          </CardContent></Card>
        </div>

        <Tabs defaultValue="births">
          <TabsList>
            <TabsTrigger value="births">Birth Notifications</TabsTrigger>
            <TabsTrigger value="deaths">Death Notifications</TabsTrigger>
            <TabsTrigger value="reconciliation">Identity Reconciliation</TabsTrigger>
            <TabsTrigger value="events">UBOMI Events</TabsTrigger>
          </TabsList>

          <TabsContent value="births">
            <Card>
              <CardHeader><CardTitle>Birth Notifications</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Notification #</TableHead>
                      <TableHead>Child</TableHead>
                      <TableHead>DOB</TableHead>
                      <TableHead>Sex</TableHead>
                      <TableHead>Facility</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SAMPLE_BIRTHS.map(b => (
                      <TableRow key={b.id}>
                        <TableCell className="font-mono text-xs">{b.notificationNumber}</TableCell>
                        <TableCell className="font-medium">{b.childName}</TableCell>
                        <TableCell>{b.dob}</TableCell>
                        <TableCell>{b.sex}</TableCell>
                        <TableCell>{b.facility}</TableCell>
                        <TableCell><Badge variant="outline" className="capitalize text-xs">{b.status.replace(/_/g, " ")}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deaths">
            <Card>
              <CardHeader><CardTitle>Death Notifications</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Deceased (CPID)</TableHead>
                      <TableHead>Date of Death</TableHead>
                      <TableHead>Facility</TableHead>
                      <TableHead>Cause</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SAMPLE_DEATHS.map(d => (
                      <TableRow key={d.id}>
                        <TableCell className="font-mono text-xs">{d.id}</TableCell>
                        <TableCell className="font-mono text-xs">{d.deceasedCpid}</TableCell>
                        <TableCell>{d.dod}</TableCell>
                        <TableCell>{d.facility}</TableCell>
                        <TableCell>{d.cause}</TableCell>
                        <TableCell><Badge variant="outline" className="capitalize text-xs">{d.status.replace(/_/g, " ")}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reconciliation">
            <Card>
              <CardHeader>
                <CardTitle>Identity Event Reconciliation</CardTitle>
                <CardDescription>Reconciliation between CRVS events and VITO client registry</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">
                  Reconciliation queue showing unlinked births/deaths, identity conflicts, and merge candidates
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <Card>
              <CardHeader><CardTitle>UBOMI Event Stream</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { type: "impilo.ubomi.birth.notified.v1", detail: "BN-HAR-2026-001234 — Parirenyatwa", time: "1 hr ago" },
                    { type: "impilo.ubomi.death.notified.v1", detail: "DN-2026-001 — Harare Hospital", time: "3 hrs ago" },
                    { type: "impilo.ubomi.identity.reconciled.v1", detail: "Birth linked to CPID-newborn123", time: "4 hrs ago" },
                  ].map((evt, i) => (
                    <div key={i} className="flex items-center justify-between p-2 border rounded text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">{evt.type}</Badge>
                        <span>{evt.detail}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{evt.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
