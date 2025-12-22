import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  Pin,
  Plus,
  Clock,
  AlertTriangle,
  BookOpen,
  Users,
  Calendar,
  CheckCircle,
  Megaphone,
  Loader2,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  target_departments: string[] | null;
  target_roles: string[] | null;
  published_at: string;
  expires_at: string | null;
  is_pinned: boolean;
  requires_acknowledgment: boolean;
  created_at: string;
}

const categoryIcons: Record<string, typeof Bell> = {
  general: Bell,
  policy: BookOpen,
  training: Calendar,
  emergency: AlertTriangle,
  shift: Clock,
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-500",
  normal: "bg-blue-500",
  high: "bg-orange-500",
  urgent: "bg-red-600",
};

const categories = ["general", "policy", "training", "emergency", "shift"];
const priorities = ["low", "normal", "high", "urgent"];

export default function ProviderNoticeboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [newAnnouncementOpen, setNewAnnouncementOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // Form state
  const [form, setForm] = useState({
    title: "",
    content: "",
    category: "general",
    priority: "normal",
    isPinned: false,
    requiresAcknowledgment: false,
    expiresIn: "",
  });

  // Fetch announcements
  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order("is_pinned", { ascending: false })
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data as Announcement[];
    },
  });

  // Create announcement
  const createAnnouncement = useMutation({
    mutationFn: async () => {
      const expiresAt = form.expiresIn
        ? new Date(Date.now() + parseInt(form.expiresIn) * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { error } = await supabase.from("announcements").insert({
        title: form.title,
        content: form.content,
        category: form.category,
        priority: form.priority,
        is_pinned: form.isPinned,
        requires_acknowledgment: form.requiresAcknowledgment,
        expires_at: expiresAt,
        published_by: user?.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setNewAnnouncementOpen(false);
      resetForm();
      toast({ title: "Announcement published" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setForm({
      title: "",
      content: "",
      category: "general",
      priority: "normal",
      isPinned: false,
      requiresAcknowledgment: false,
      expiresIn: "",
    });
  };

  const filteredAnnouncements = announcements.filter((a) => {
    if (activeTab === "all") return true;
    if (activeTab === "pinned") return a.is_pinned;
    return a.category === activeTab;
  });

  const pinnedCount = announcements.filter((a) => a.is_pinned).length;
  const urgentCount = announcements.filter((a) => a.priority === "urgent").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Megaphone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold">Provider Noticeboard</h1>
                  <p className="text-xs text-muted-foreground">Announcements & updates</p>
                </div>
              </div>
            </div>

            <Button onClick={() => setNewAnnouncementOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Announcement
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{announcements.length}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-yellow-600">{pinnedCount}</p>
              <p className="text-sm text-muted-foreground">Pinned</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{urgentCount}</p>
              <p className="text-sm text-muted-foreground">Urgent</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pinned">
              <Pin className="h-3 w-3 mr-1" />
              Pinned
            </TabsTrigger>
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat} className="capitalize">
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Announcements List */}
        <ScrollArea className="h-[calc(100vh-300px)]">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-20 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <Card className="p-12 text-center">
              <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No announcements</h3>
              <p className="text-muted-foreground">
                {activeTab === "all" ? "No announcements yet" : `No ${activeTab} announcements`}
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredAnnouncements.map((announcement) => {
                const Icon = categoryIcons[announcement.category] || Bell;
                return (
                  <Card
                    key={announcement.id}
                    className={cn(
                      "cursor-pointer hover:shadow-lg transition-all",
                      announcement.is_pinned && "border-yellow-500/50 bg-yellow-500/5",
                      announcement.priority === "urgent" && "border-red-500/50"
                    )}
                    onClick={() => setSelectedAnnouncement(announcement)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "p-2 rounded-lg shrink-0",
                          announcement.priority === "urgent" ? "bg-red-500/10" : "bg-primary/10"
                        )}>
                          <Icon className={cn(
                            "h-5 w-5",
                            announcement.priority === "urgent" ? "text-red-500" : "text-primary"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {announcement.is_pinned && (
                              <Pin className="h-4 w-4 text-yellow-600" />
                            )}
                            <h3 className="font-semibold truncate">{announcement.title}</h3>
                            <Badge className={cn("text-white text-xs shrink-0", priorityColors[announcement.priority])}>
                              {announcement.priority}
                            </Badge>
                            <Badge variant="outline" className="text-xs capitalize shrink-0">
                              {announcement.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {announcement.content}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(announcement.published_at), { addSuffix: true })}
                            </span>
                            {announcement.requires_acknowledgment && (
                              <span className="flex items-center gap-1 text-orange-600">
                                <CheckCircle className="h-3 w-3" />
                                Requires acknowledgment
                              </span>
                            )}
                            {announcement.expires_at && (
                              <span>
                                Expires {formatDistanceToNow(new Date(announcement.expires_at), { addSuffix: true })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </main>

      {/* New Announcement Dialog */}
      <Dialog open={newAnnouncementOpen} onOpenChange={setNewAnnouncementOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Announcement</DialogTitle>
            <DialogDescription>Publish a new announcement to the noticeboard</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Announcement title"
              />
            </div>

            <div className="space-y-2">
              <Label>Content *</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="Announcement content..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat} className="capitalize">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((p) => (
                      <SelectItem key={p} value={p} className="capitalize">
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Expires In</Label>
              <Select
                value={form.expiresIn}
                onValueChange={(value) => setForm((prev) => ({ ...prev, expiresIn: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Never expires" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Never expires</SelectItem>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="7">1 week</SelectItem>
                  <SelectItem value="14">2 weeks</SelectItem>
                  <SelectItem value="30">1 month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPinned}
                  onChange={(e) => setForm((prev) => ({ ...prev, isPinned: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm">Pin to top</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.requiresAcknowledgment}
                  onChange={(e) => setForm((prev) => ({ ...prev, requiresAcknowledgment: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm">Require acknowledgment</span>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNewAnnouncementOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createAnnouncement.mutate()}
              disabled={!form.title || !form.content || createAnnouncement.isPending}
            >
              {createAnnouncement.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                "Publish"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Announcement Detail Dialog */}
      <Dialog open={!!selectedAnnouncement} onOpenChange={() => setSelectedAnnouncement(null)}>
        <DialogContent className="sm:max-w-lg">
          {selectedAnnouncement && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  {selectedAnnouncement.is_pinned && <Pin className="h-4 w-4 text-yellow-600" />}
                  <Badge className={cn("text-white", priorityColors[selectedAnnouncement.priority])}>
                    {selectedAnnouncement.priority}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {selectedAnnouncement.category}
                  </Badge>
                </div>
                <DialogTitle>{selectedAnnouncement.title}</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Published {formatDistanceToNow(new Date(selectedAnnouncement.published_at), { addSuffix: true })}
                </p>
              </DialogHeader>
              <div className="py-4">
                <p className="whitespace-pre-wrap">{selectedAnnouncement.content}</p>
              </div>
              {selectedAnnouncement.requires_acknowledgment && (
                <DialogFooter>
                  <Button className="w-full">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Acknowledge
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
