import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Copy, Key, RefreshCw, CheckCircle, Send, Mail } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface GeneratedIdData {
  primaryId: string;
  token?: string;
  secondaryIds?: Record<string, string>;
}

interface IdGenerationCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  format: string;
  onGenerate: (provinceCode?: string) => Promise<GeneratedIdData>;
  showProvinceSelector?: boolean;
  onSendToEmail?: (id: string, email: string) => Promise<void>;
  idLabels?: {
    primary: string;
    token?: string;
    secondary?: Record<string, string>;
  };
}

const PROVINCES = [
  { code: "ZW", name: "Zimbabwe (ZW)" },
  { code: "HA", name: "Harare (HA)" },
  { code: "BU", name: "Bulawayo (BU)" },
  { code: "MA", name: "Manicaland (MA)" },
  { code: "MW", name: "Mashonaland West (MW)" },
  { code: "ME", name: "Mashonaland East (ME)" },
  { code: "MC", name: "Mashonaland Central (MC)" },
  { code: "MT", name: "Matabeleland North (MT)" },
  { code: "MS", name: "Matabeleland South (MS)" },
  { code: "MV", name: "Masvingo (MV)" },
  { code: "MD", name: "Midlands (MD)" },
];

export function IdGenerationCard({
  title,
  description,
  icon: Icon,
  format,
  onGenerate,
  showProvinceSelector = false,
  onSendToEmail,
  idLabels = { primary: "Generated ID" }
}: IdGenerationCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState<GeneratedIdData | null>(null);
  const [provinceCode, setProvinceCode] = useState("ZW");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await onGenerate(showProvinceSelector ? provinceCode : undefined);
      setGeneratedData(result);
      toast.success(`${title} generated successfully`);
    } catch (error) {
      toast.error(`Failed to generate ${title}`);
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleSendEmail = async () => {
    if (!generatedData || !recipientEmail || !onSendToEmail) return;
    
    setIsSending(true);
    try {
      await onSendToEmail(generatedData.primaryId, recipientEmail);
      toast.success("ID sent to email successfully");
      setRecipientEmail("");
    } catch (error) {
      toast.error("Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>
          Format: {format}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {showProvinceSelector && (
          <div className="space-y-2">
            <Label>Province Code</Label>
            <Select value={provinceCode} onValueChange={setProvinceCode}>
              <SelectTrigger>
                <SelectValue placeholder="Select province" />
              </SelectTrigger>
              <SelectContent>
                {PROVINCES.map((p) => (
                  <SelectItem key={p.code} value={p.code}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Key className="w-4 h-4 mr-2" />
          )}
          Generate {title}
        </Button>

        {generatedData && (
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            {/* Primary ID */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{idLabels.primary}</span>
              <div className="flex items-center gap-2">
                <code className="text-lg font-mono font-bold text-primary">
                  {generatedData.primaryId}
                </code>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => copyToClipboard(generatedData.primaryId, idLabels.primary)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Token if available */}
            {generatedData.token && idLabels.token && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{idLabels.token}</span>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-lg font-bold">
                    {generatedData.token}
                  </code>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => copyToClipboard(generatedData.token!, idLabels.token!)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Secondary IDs */}
            {generatedData.secondaryIds && idLabels.secondary && (
              Object.entries(generatedData.secondaryIds).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {idLabels.secondary?.[key] || key}
                  </span>
                  <code className="font-mono text-xs">{value}</code>
                </div>
              ))
            )}

            {/* Email delivery */}
            {onSendToEmail && (
              <div className="pt-3 border-t space-y-2">
                <Label className="text-xs">Send to recipient</Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="recipient@email.com"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSendEmail}
                    disabled={!recipientEmail || isSending}
                  >
                    {isSending ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                <CheckCircle className="w-3 h-3 inline mr-1 text-green-500" />
                Cryptographically secure • Biometric linking available
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
