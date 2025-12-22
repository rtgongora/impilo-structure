import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertCircle, Bell, Check, CheckCircle, Clock, Send, 
  Phone, ArrowUpCircle, User, MapPin, AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

interface ClinicalPage {
  id: string;
  page_number: string;
  sender_id: string;
  recipient_id: string | null;
  recipient_role: string | null;
  department: string | null;
  priority: string;
  page_type: string;
  message: string;
  patient_id: string | null;
  callback_number: string | null;
  location: string | null;
  status: string;
  acknowledged_at: string | null;
  escalation_level: number;
  created_at: string;
  sender?: { display_name: string };
  patient?: { first_name: string; last_name: string; mrn: string };
}

export function ClinicalPaging() {
  const { user, profile } = useAuth();
  const [pages, setPages] = useState<ClinicalPage[]>([]);
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
  const [isNewPageOpen, setIsNewPageOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // New page form
  const [newPage, setNewPage] = useState({
    recipient_role: "",
    department: "",
    priority: "routine",
    page_type: "callback",
    message: "",
    callback_number: "",
    location: "",
  });

  useEffect(() => {
    if (!user) return;
    fetchPages();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("pages-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "clinical_pages",
        },
        () => {
          fetchPages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeTab]);

  const fetchPages = async () => {
    if (!user) return;
    setIsLoading(true);

    const query = supabase
      .from("clinical_pages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (activeTab === "received") {
      query.eq("recipient_id", user.id);
    } else {
      query.eq("sender_id", user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching pages:", error);
    } else {
      setPages(data || []);
    }
    setIsLoading(false);
  };

  const sendPage = async () => {
    if (!user || !newPage.message.trim()) {
      toast.error("Message is required");
      return;
    }

    const { error } = await supabase.from("clinical_pages").insert({
      sender_id: user.id,
      recipient_role: newPage.recipient_role || null,
      department: newPage.department || null,
      priority: newPage.priority,
      page_type: newPage.page_type,
      message: newPage.message,
      callback_number: newPage.callback_number || null,
      location: newPage.location || null,
      page_number: "", // Will be auto-generated
    });

    if (error) {
      toast.error("Failed to send page");
      console.error("Error sending page:", error);
    } else {
      toast.success("Page sent successfully");
      setIsNewPageOpen(false);
      setNewPage({
        recipient_role: "",
        department: "",
        priority: "routine",
        page_type: "callback",
        message: "",
        callback_number: "",
        location: "",
      });
    }
  };

  const acknowledgePage = async (pageId: string) => {
    const { error } = await supabase
      .from("clinical_pages")
      .update({
        status: "acknowledged",
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: user?.id,
      })
      .eq("id", pageId);

    if (error) {
      toast.error("Failed to acknowledge page");
    } else {
      toast.success("Page acknowledged");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "stat":
        return "bg-destructive text-destructive-foreground";
      case "urgent":
        return "bg-warning text-warning-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "stat":
        return <AlertCircle className="w-4 h-4" />;
      case "urgent":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "acknowledged":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "escalated":
        return <ArrowUpCircle className="w-4 h-4 text-warning" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getPageTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      callback: "Callback",
      code: "Code",
      consult: "Consult",
      lab: "Lab",
      pharmacy: "Pharmacy",
    };
    return types[type] || type;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Clinical Paging
          </CardTitle>
          <Dialog open={isNewPageOpen} onOpenChange={setIsNewPageOpen}>
            <DialogTrigger asChild>
              <Button>
                <Send className="w-4 h-4 mr-2" />
                Send Page
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Send Clinical Page</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={newPage.priority}
                      onValueChange={(v) => setNewPage({ ...newPage, priority: v })}
                    >
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
                  <div className="space-y-2">
                    <Label>Page Type</Label>
                    <Select
                      value={newPage.page_type}
                      onValueChange={(v) => setNewPage({ ...newPage, page_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="callback">Callback</SelectItem>
                        <SelectItem value="code">Code</SelectItem>
                        <SelectItem value="consult">Consult</SelectItem>
                        <SelectItem value="lab">Lab</SelectItem>
                        <SelectItem value="pharmacy">Pharmacy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Recipient Role</Label>
                    <Select
                      value={newPage.recipient_role}
                      onValueChange={(v) => setNewPage({ ...newPage, recipient_role: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="physician">Physician</SelectItem>
                        <SelectItem value="nurse">Nurse</SelectItem>
                        <SelectItem value="specialist">Specialist</SelectItem>
                        <SelectItem value="pharmacist">Pharmacist</SelectItem>
                        <SelectItem value="lab_tech">Lab Tech</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select
                      value={newPage.department}
                      onValueChange={(v) => setNewPage({ ...newPage, department: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select dept" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="emergency">Emergency</SelectItem>
                        <SelectItem value="icu">ICU</SelectItem>
                        <SelectItem value="surgery">Surgery</SelectItem>
                        <SelectItem value="medicine">Medicine</SelectItem>
                        <SelectItem value="pediatrics">Pediatrics</SelectItem>
                        <SelectItem value="ob_gyn">OB/GYN</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Message *</Label>
                  <Textarea
                    placeholder="Enter page message..."
                    value={newPage.message}
                    onChange={(e) => setNewPage({ ...newPage, message: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Callback Number</Label>
                    <Input
                      placeholder="e.g., Ext 4521"
                      value={newPage.callback_number}
                      onChange={(e) => setNewPage({ ...newPage, callback_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      placeholder="e.g., Ward 5, Bed 12"
                      value={newPage.location}
                      onChange={(e) => setNewPage({ ...newPage, location: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsNewPageOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={sendPage}>
                    <Send className="w-4 h-4 mr-2" />
                    Send Page
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={activeTab === "received" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("received")}
          >
            Received
          </Button>
          <Button
            variant={activeTab === "sent" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("sent")}
          >
            Sent
          </Button>
        </div>

        {/* Pages List */}
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : pages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>No pages {activeTab === "received" ? "received" : "sent"}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pages.map((page) => (
                <div
                  key={page.id}
                  className={`p-4 rounded-lg border ${
                    page.priority === "stat"
                      ? "border-destructive/50 bg-destructive/5"
                      : page.priority === "urgent"
                      ? "border-warning/50 bg-warning/5"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getPriorityColor(page.priority)}>
                          {getPriorityIcon(page.priority)}
                          <span className="ml-1 uppercase">{page.priority}</span>
                        </Badge>
                        <Badge variant="outline">{getPageTypeLabel(page.page_type)}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {page.page_number}
                        </span>
                      </div>

                      <p className="text-sm font-medium mb-1">{page.message}</p>

                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {page.callback_number && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {page.callback_number}
                          </span>
                        )}
                        {page.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {page.location}
                          </span>
                        )}
                        {page.department && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {page.department}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 mb-2">
                        {getStatusIcon(page.status)}
                        <span className="text-xs capitalize">{page.status}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(page.created_at), { addSuffix: true })}
                      </p>
                      {activeTab === "received" && page.status === "sent" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2"
                          onClick={() => acknowledgePage(page.id)}
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
