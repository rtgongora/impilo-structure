import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileText, CreditCard, Share2, QrCode, CheckCircle, XCircle, Printer } from "lucide-react";

export default function SuiteSelfService() {
  const [actorType, setActorType] = useState<"PROVIDER" | "CLIENT">("PROVIDER");
  const [mySubjectId, setMySubjectId] = useState("dev-provider-001");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDocType, setUploadDocType] = useState("GENERAL");
  const [shareDocId, setShareDocId] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [verifyResult, setVerifyResult] = useState<string | null>(null);
  const [printTemplate, setPrintTemplate] = useState("PROVIDER_CARD");
  const qc = useQueryClient();

  const { data: myDocs } = useQuery({
    queryKey: ["my-docs", mySubjectId],
    queryFn: async () => {
      const { data } = await supabase.from("suite_documents").select("*").eq("subject_id", mySubjectId).eq("lifecycle_state", "ACTIVE").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: myCreds } = useQuery({
    queryKey: ["my-creds", mySubjectId],
    queryFn: async () => {
      const { data } = await supabase.from("suite_credentials").select("*").eq("subject_id", mySubjectId).order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: myPrints } = useQuery({
    queryKey: ["my-prints", mySubjectId],
    queryFn: async () => {
      const { data } = await supabase.from("suite_print_jobs").select("*").eq("subject_id", mySubjectId).order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: myShares } = useQuery({
    queryKey: ["my-shares"],
    queryFn: async () => {
      const { data } = await supabase.from("suite_share_links").select("*").order("created_at", { ascending: false }).limit(20);
      return data || [];
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      await supabase.from("suite_documents").insert({
        tenant_id: "dev-tenant", subject_type: actorType, subject_id: mySubjectId,
        document_type_code: uploadDocType, source: "UPLOADED", created_by_actor_id: "dev-actor",
        mime_type: "application/pdf", storage_provider: "INTERNAL",
        storage_object_key: `uploads/${Date.now()}_mock.pdf`,
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-docs"] }); toast.success("Document uploaded"); setUploadTitle(""); },
  });

  const shareMutation = useMutation({
    mutationFn: async (docId: string) => {
      const { data } = await supabase.from("suite_share_links").insert({
        tenant_id: "dev-tenant", target_type: "DOCUMENT", target_ref: docId,
        proof_method: "OTP", created_by_actor_id: "dev-actor",
      }).select().single();
      return data;
    },
    onSuccess: (data) => { qc.invalidateQueries({ queryKey: ["my-shares"] }); toast.success(`Share created — Token: ${data?.token}`); },
  });

  const printMutation = useMutation({
    mutationFn: async () => {
      await supabase.from("suite_print_jobs").insert({
        tenant_id: "dev-tenant", subject_type: actorType, subject_id: mySubjectId,
        template_type: printTemplate, requested_by_actor_id: "dev-actor",
        payload_json: { name_placeholder: mySubjectId },
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-prints"] }); toast.success("Print job requested"); },
  });

  const handleVerify = async () => {
    const { data } = await supabase.from("suite_credentials").select("status, expires_at").eq("qr_ref_token", verifyToken).single();
    if (!data) { setVerifyResult("NOT_FOUND"); return; }
    if (data.status === "REVOKED") { setVerifyResult("REVOKED"); return; }
    if (data.expires_at && new Date(data.expires_at) < new Date()) { setVerifyResult("EXPIRED"); return; }
    setVerifyResult("VALID");
  };

  const printStatusColor = (s: string) => {
    const m: Record<string, string> = { REQUESTED: "secondary", RENDERED: "default", PRINTED: "default", COLLECTED: "outline", FAILED: "destructive" };
    return (m[s] || "default") as any;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Self-Service Portal</h1>
          <p className="text-muted-foreground">Upload docs, manage credentials, request cards</p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={actorType} onValueChange={v => setActorType(v as any)}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PROVIDER">Provider</SelectItem>
              <SelectItem value="CLIENT">Client</SelectItem>
            </SelectContent>
          </Select>
          <Input value={mySubjectId} onChange={e => setMySubjectId(e.target.value)} className="w-48" placeholder="Subject ID" />
        </div>
      </div>

      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents"><FileText className="h-3 w-3 mr-1" /> My Documents</TabsTrigger>
          <TabsTrigger value="credentials"><QrCode className="h-3 w-3 mr-1" /> Credentials</TabsTrigger>
          <TabsTrigger value="cards"><CreditCard className="h-3 w-3 mr-1" /> Cards</TabsTrigger>
          <TabsTrigger value="share"><Share2 className="h-3 w-3 mr-1" /> Share Slips</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Upload className="h-4 w-4" /> Upload Attachment</CardTitle></CardHeader>
            <CardContent className="flex gap-3">
              <Select value={uploadDocType} onValueChange={setUploadDocType}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL">General</SelectItem>
                  <SelectItem value="ID_DOCUMENT">ID Document</SelectItem>
                  <SelectItem value="LICENSE">License</SelectItem>
                  <SelectItem value="CERTIFICATE">Certificate</SelectItem>
                  <SelectItem value="REFERRAL">Referral</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => uploadMutation.mutate()}>Upload (Mock)</Button>
            </CardContent>
          </Card>

          <div className="grid gap-2">
            {myDocs?.map((doc: any) => (
              <Card key={doc.id}>
                <CardContent className="pt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{doc.document_type_code}</span>
                    <Badge variant="outline">{doc.storage_provider}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</span>
                    <Button size="sm" variant="outline" onClick={() => shareMutation.mutate(doc.id)}><Share2 className="h-3 w-3 mr-1" /> Share</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="credentials" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Verify Credential</CardTitle></CardHeader>
            <CardContent className="flex gap-3">
              <Input placeholder="QR ref token" value={verifyToken} onChange={e => setVerifyToken(e.target.value)} />
              <Button onClick={handleVerify}>Verify</Button>
              {verifyResult && (
                <Badge variant={verifyResult === "VALID" ? "default" : "destructive"} className="flex items-center gap-1">
                  {verifyResult === "VALID" ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {verifyResult}
                </Badge>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-2">
            {myCreds?.map((cred: any) => (
              <Card key={cred.id}>
                <CardContent className="pt-3 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm">{cred.credential_type}</span>
                    <span className="text-xs text-muted-foreground ml-2">by {cred.issuer}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={cred.status === "ACTIVE" ? "default" : "destructive"}>{cred.status}</Badge>
                    <span className="text-xs font-mono text-muted-foreground">{cred.qr_ref_token?.substring(0, 12)}...</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="cards" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Printer className="h-4 w-4" /> Request Card Print</CardTitle></CardHeader>
            <CardContent className="flex gap-3">
              <Select value={printTemplate} onValueChange={setPrintTemplate}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROVIDER_CARD">Provider Card</SelectItem>
                  <SelectItem value="CLIENT_CARD">Client Card</SelectItem>
                  <SelectItem value="FACILITY_BADGE">Facility Badge</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => printMutation.mutate()}>Request Print</Button>
            </CardContent>
          </Card>

          <div className="grid gap-2">
            {myPrints?.map((job: any) => (
              <Card key={job.id}>
                <CardContent className="pt-3 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm">{job.template_type}</span>
                  </div>
                  <Badge variant={printStatusColor(job.status)}>{job.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="share" className="space-y-4">
          <div className="grid gap-2">
            {myShares?.map((link: any) => (
              <Card key={link.id}>
                <CardContent className="pt-3 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-sm">{link.token}</span>
                    <span className="text-xs text-muted-foreground ml-2">{link.target_type}: {link.target_ref?.substring(0, 8)}...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={link.status === "ACTIVE" ? "default" : link.status === "CLAIMED" ? "outline" : "destructive"}>{link.status}</Badge>
                    <span className="text-xs text-muted-foreground">{link.proof_method}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
