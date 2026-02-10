import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Key, RefreshCw, ShieldAlert, Fingerprint, Eye, EyeOff, Copy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { varapiClient } from "@/lib/kernel/varapi/varapiClient";

export default function VarapiTokens() {
  const navigate = useNavigate();
  const [issueProviderId, setIssueProviderId] = useState("");
  const [issuedToken, setIssuedToken] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [rotateCurrentToken, setRotateCurrentToken] = useState("");
  const [rotatedToken, setRotatedToken] = useState<string | null>(null);
  const [recoveryInput, setRecoveryInput] = useState("");
  const [recoveryMsg, setRecoveryMsg] = useState("");
  const [issuing, setIssuing] = useState(false);

  const { data: tokens } = useQuery({
    queryKey: ["varapi_tokens"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("varapi_provider_tokens").select("id, tenant_id, provider_public_id, status, issued_at, rotated_at, last_used_at").order("issued_at", { ascending: false }).limit(50);
      return data || [];
    },
  });

  const { data: bindings } = useQuery({
    queryKey: ["varapi_bio_bindings"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("varapi_biometric_bindings").select("*").order("created_at", { ascending: false }).limit(20);
      return data || [];
    },
  });

  const handleIssue = async () => {
    if (!issueProviderId) return;
    setIssuing(true);
    const { data, error } = await varapiClient.issueToken({ provider_public_id: issueProviderId });
    setIssuing(false);
    if (error) { toast.error("Issue failed"); return; }
    const d = data as any;
    setIssuedToken(d?.token || null);
    setShowToken(true);
    toast.success("Token issued — ONE-TIME display");
  };

  const handleRotate = async () => {
    const { data } = await varapiClient.rotateToken({ current_token: rotateCurrentToken });
    const d = data as any;
    if (d?.rotated) { setRotatedToken(d.token); toast.success("Token rotated"); }
    else toast.info(d?.message || "Rotation result");
  };

  const handleRecovery = async () => {
    const { data } = await varapiClient.startRecovery({ identifier: recoveryInput });
    const d = data as any;
    setRecoveryMsg(d?.message || "Recovery flow initiated.");
  };

  const statusColor = (s: string) => ({ ACTIVE: "bg-green-100 text-green-800", ROTATED: "bg-yellow-100 text-yellow-800", REVOKED: "bg-red-100 text-red-800" }[s] || "bg-muted");

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}><ArrowLeft className="h-4 w-4" /></Button>
          <div><h1 className="text-2xl font-bold flex items-center gap-2"><Key className="h-6 w-6" />VARAPI — Token & Biometric Ops</h1><p className="text-muted-foreground text-sm">Issue, rotate, recover VA tokens. Biometric bindings.</p></div>
        </div>

        <Tabs defaultValue="issue">
          <TabsList><TabsTrigger value="issue">Issue Token</TabsTrigger><TabsTrigger value="rotate">Rotate</TabsTrigger><TabsTrigger value="recovery">Recovery</TabsTrigger><TabsTrigger value="bindings">Biometric Bindings</TabsTrigger><TabsTrigger value="log">Token Log</TabsTrigger></TabsList>

          <TabsContent value="issue">
            <Card><CardHeader><CardTitle>Issue VA Token</CardTitle><CardDescription>Generates VA-XXXXXXXXXX[check]. Stored as HMAC lookup_hash + Argon2 verifier. Token shown ONCE.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Provider Public ID</Label><Input value={issueProviderId} onChange={e => setIssueProviderId(e.target.value)} placeholder="Enter provider_public_id" /></div>
                <Button onClick={handleIssue} disabled={issuing || !issueProviderId}>{issuing ? "Issuing..." : "Issue Token"}</Button>
                {issuedToken && (
                  <Alert className="border-yellow-500 bg-yellow-50">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>⚠️ ONE-TIME TOKEN REVEAL</AlertTitle>
                    <AlertDescription>
                      <div className="flex items-center gap-2 mt-2">
                        <code className="bg-white px-3 py-2 rounded border font-mono text-lg tracking-wider">{showToken ? issuedToken : "VA-••••••••••X"}</code>
                        <Button size="icon" variant="ghost" onClick={() => setShowToken(!showToken)}>{showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                        <Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(issuedToken); toast.success("Copied"); }}><Copy className="h-4 w-4" /></Button>
                      </div>
                      <p className="text-xs text-yellow-700 mt-2">This token will NEVER be shown again. Store securely.</p>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rotate">
            <Card><CardHeader><CardTitle>Rotate Token</CardTitle><CardDescription>Requires current valid token to rotate.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Current VA Token</Label><Input type="password" value={rotateCurrentToken} onChange={e => setRotateCurrentToken(e.target.value)} placeholder="VA-..." /></div>
                <Button onClick={handleRotate}><RefreshCw className="h-4 w-4 mr-2" />Rotate</Button>
                {rotatedToken && <Alert className="border-green-500 bg-green-50"><AlertDescription><code className="font-mono">{rotatedToken}</code> — store securely.</AlertDescription></Alert>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recovery">
            <Card><CardHeader><CardTitle>Token Recovery</CardTitle><CardDescription>Generic response — never reveals whether provider/token exists (enumeration resistance).</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Identifier (phone/email/biometric ref)</Label><Input value={recoveryInput} onChange={e => setRecoveryInput(e.target.value)} /></div>
                <Button onClick={handleRecovery}>Start Recovery</Button>
                {recoveryMsg && <Alert><AlertDescription>{recoveryMsg}</AlertDescription></Alert>}
                <p className="text-xs text-muted-foreground">Step-up authentication will be required (modeled, not enforced in prototype).</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bindings">
            <Card><CardHeader><CardTitle>Biometric Bindings</CardTitle><CardDescription>Reference-only storage. No templates stored.</CardDescription></CardHeader>
              <CardContent>
                {(bindings || []).map((b: any) => (
                  <div key={b.id} className="flex justify-between items-center border-b py-2 text-sm">
                    <div><p className="font-mono text-xs">{b.provider_public_id}</p><p className="text-muted-foreground">Ref: {b.biometric_ref}</p></div>
                    <Badge className={b.status === "BOUND" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>{b.status}</Badge>
                  </div>
                ))}
                {!bindings?.length && <p className="text-muted-foreground text-sm">No bindings</p>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="log">
            <Card><CardHeader><CardTitle>Token Log</CardTitle><CardDescription>Shows hashed records only — no plaintext tokens stored.</CardDescription></CardHeader>
              <CardContent>
                {(tokens || []).map((t: any) => (
                  <div key={t.id} className="flex justify-between items-center border-b py-2 text-sm">
                    <div><p className="font-mono text-xs">{t.provider_public_id}</p><p className="text-xs text-muted-foreground">Issued: {new Date(t.issued_at).toLocaleString()}</p></div>
                    <Badge className={statusColor(t.status)}>{t.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
