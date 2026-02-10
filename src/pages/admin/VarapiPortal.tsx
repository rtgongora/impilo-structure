import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, User, BookOpen, Award, ShieldAlert, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function VarapiPortal() {
  const navigate = useNavigate();
  const [stepUpShown, setStepUpShown] = useState(false);

  // Mock: use first provider as "me"
  const { data: provider } = useQuery({
    queryKey: ["varapi_portal_me"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("varapi_providers").select("*").eq("status", "ACTIVE").limit(1).single();
      return data;
    },
  });

  const { data: licenses } = useQuery({
    queryKey: ["varapi_portal_licenses", provider?.provider_public_id],
    queryFn: async () => {
      if (!provider) return [];
      const { data } = await (supabase as any).from("varapi_licenses").select("*").eq("provider_public_id", provider.provider_public_id).order("valid_to", { ascending: false });
      return data || [];
    },
    enabled: !!provider,
  });

  const { data: cpdCycles } = useQuery({
    queryKey: ["varapi_portal_cpd_cycles", provider?.provider_public_id],
    queryFn: async () => {
      if (!provider) return [];
      const { data } = await (supabase as any).from("varapi_cpd_cycles").select("*").eq("provider_public_id", provider.provider_public_id).order("cycle_year", { ascending: false });
      return data || [];
    },
    enabled: !!provider,
  });

  const { data: cpdEvents } = useQuery({
    queryKey: ["varapi_portal_cpd_events", provider?.provider_public_id],
    queryFn: async () => {
      if (!provider) return [];
      const { data } = await (supabase as any).from("varapi_cpd_events").select("*").eq("provider_public_id", provider.provider_public_id).order("occurred_at", { ascending: false });
      return data || [];
    },
    enabled: !!provider,
  });

  const { data: certificates } = useQuery({
    queryKey: ["varapi_portal_certs", provider?.provider_public_id],
    queryFn: async () => {
      if (!provider) return [];
      const { data } = await (supabase as any).from("varapi_documents").select("*").eq("owner_type", "PROVIDER").eq("owner_id", provider.provider_public_id).eq("doc_type", "CERTIFICATE");
      return data || [];
    },
    enabled: !!provider,
  });

  const activeLicense = licenses?.find((l: any) => l.license_status === "VALID");

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}><ArrowLeft className="h-4 w-4" /></Button>
          <div><h1 className="text-2xl font-bold flex items-center gap-2"><User className="h-6 w-6" />Provider Portal</h1><p className="text-muted-foreground text-sm">My status, CPD tracker, certificates</p></div>
        </div>

        {!provider ? (
          <Alert><AlertDescription>No active provider found. Register a provider first.</AlertDescription></Alert>
        ) : (
          <Tabs defaultValue="status">
            <TabsList><TabsTrigger value="status">My Status</TabsTrigger><TabsTrigger value="cpd">CPD Tracker</TabsTrigger><TabsTrigger value="certs">Certificates</TabsTrigger></TabsList>

            <TabsContent value="status">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card><CardHeader><CardTitle>Profile</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Public ID</span><span className="font-mono">{provider.provider_public_id}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge className={provider.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>{provider.status}</Badge></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Cadre</span><span>{provider.cadre_code}</span></div>
                    </div>
                  </CardContent>
                </Card>
                <Card><CardHeader><CardTitle>License Status</CardTitle></CardHeader>
                  <CardContent>
                    {activeLicense ? (
                      <div className="space-y-2 text-sm">
                        <Badge className="bg-green-100 text-green-800">VALID</Badge>
                        <div className="flex justify-between"><span className="text-muted-foreground">Valid From</span><span>{activeLicense.valid_from?.slice(0, 10)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Valid To</span><span>{activeLicense.valid_to?.slice(0, 10) || "∞"}</span></div>
                      </div>
                    ) : <p className="text-muted-foreground text-sm">No active license</p>}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="cpd">
              <div className="space-y-4">
                {(cpdCycles || []).map((c: any) => (
                  <Card key={c.id}><CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-4 w-4" />{c.cycle_year} CPD Cycle</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm"><span>{c.achieved_points} / {c.required_points} points</span><Badge>{c.status}</Badge></div>
                        <Progress value={c.required_points > 0 ? (c.achieved_points / c.required_points) * 100 : 0} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Card><CardHeader><CardTitle>CPD Activities</CardTitle></CardHeader>
                  <CardContent>
                    {(cpdEvents || []).map((e: any) => (
                      <div key={e.id} className="flex justify-between items-center border-b py-2 text-sm">
                        <div><Badge variant="outline">{e.event_type}</Badge><span className="ml-2">{e.points} pts</span></div>
                        <span className="text-xs text-muted-foreground">{new Date(e.occurred_at).toLocaleDateString()} • {e.source}</span>
                      </div>
                    ))}
                    {!cpdEvents?.length && <p className="text-muted-foreground text-sm">No CPD activities recorded</p>}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="certs">
              <Card><CardHeader><CardTitle className="flex items-center gap-2"><Award className="h-4 w-4" />Certificates</CardTitle></CardHeader>
                <CardContent>
                  {(certificates || []).map((c: any) => (
                    <div key={c.id} className="flex justify-between items-center border-b py-2">
                      <div><p className="text-sm font-medium">{c.doc_type}</p><p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</p></div>
                      <Button size="sm" variant="outline" onClick={() => { setStepUpShown(true); toast.info("Step-up authentication required for certificate download."); }}><Download className="h-4 w-4 mr-1" />Download</Button>
                    </div>
                  ))}
                  {!certificates?.length && <p className="text-muted-foreground text-sm">No certificates</p>}
                  {stepUpShown && (
                    <Alert className="mt-4 border-yellow-500">
                      <ShieldAlert className="h-4 w-4" />
                      <AlertDescription>Step-up authentication required. In production, this triggers MFA/biometric verification before download.</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
