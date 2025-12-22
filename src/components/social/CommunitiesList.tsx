import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Plus,
  Search,
  Lock,
  Globe,
  Shield,
  Heart,
  Activity,
  Stethoscope,
  Sparkles,
} from "lucide-react";

interface Community {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  cover_image_url: string;
  avatar_url: string;
  privacy: string;
  is_verified: boolean;
  member_count: number;
  post_count: number;
  created_at: string;
  is_member?: boolean;
}

interface CommunitiesListProps {
  onSelectCommunity: (community: Community) => void;
}

export function CommunitiesList({ onSelectCommunity }: CommunitiesListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCommunity, setNewCommunity] = useState({
    name: "",
    description: "",
    category: "general",
    privacy: "public",
  });

  const categories = [
    { id: "all", label: "All", icon: Globe },
    { id: "support", label: "Support Groups", icon: Heart },
    { id: "condition", label: "Health Conditions", icon: Activity },
    { id: "wellness", label: "Wellness", icon: Sparkles },
    { id: "professional", label: "Professional", icon: Stethoscope },
  ];

  useEffect(() => {
    fetchCommunities();
  }, [selectedCategory]);

  const fetchCommunities = async () => {
    try {
      let query = supabase
        .from('communities')
        .select('*')
        .order('member_count', { ascending: false });

      if (selectedCategory !== "all") {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Check user memberships
      let userMemberships: string[] = [];
      if (user) {
        const { data: memberships } = await supabase
          .from('community_members')
          .select('community_id')
          .eq('user_id', user.id);
        userMemberships = (memberships || []).map(m => m.community_id);
      }

      const communitiesWithMembership = (data || []).map(c => ({
        ...c,
        is_member: userMemberships.includes(c.id)
      }));

      setCommunities(communitiesWithMembership);
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCommunity = async () => {
    if (!newCommunity.name.trim() || !user) return;

    setCreating(true);
    try {
      const slug = newCommunity.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      const { data, error } = await supabase.from('communities').insert({
        name: newCommunity.name,
        slug: slug + '-' + Date.now(),
        description: newCommunity.description,
        category: newCommunity.category,
        privacy: newCommunity.privacy,
        created_by: user.id,
      }).select().single();

      if (error) throw error;

      // Auto-join as owner
      await supabase.from('community_members').insert({
        community_id: data.id,
        user_id: user.id,
        role: 'owner',
      });

      toast({ title: "Community created successfully!" });
      setShowCreateDialog(false);
      setNewCommunity({ name: "", description: "", category: "general", privacy: "public" });
      fetchCommunities();
    } catch (error: any) {
      toast({ title: "Error creating community", description: error.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleJoinCommunity = async (communityId: string) => {
    if (!user) return;

    try {
      await supabase.from('community_members').insert({
        community_id: communityId,
        user_id: user.id,
        role: 'member',
      });

      toast({ title: "Joined community!" });
      fetchCommunities();
    } catch (error: any) {
      toast({ title: "Error joining community", description: error.message, variant: "destructive" });
    }
  };

  const handleLeaveCommunity = async (communityId: string) => {
    if (!user) return;

    try {
      await supabase.from('community_members').delete()
        .eq('community_id', communityId)
        .eq('user_id', user.id);

      toast({ title: "Left community" });
      fetchCommunities();
    } catch (error: any) {
      toast({ title: "Error leaving community", description: error.message, variant: "destructive" });
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.id === category);
    return cat?.icon || Globe;
  };

  const filteredCommunities = communities.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <Skeleton className="h-16 w-16 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Communities</h2>
          <p className="text-sm text-muted-foreground">
            Connect with others who share your health journey
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              Create Community
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a Community</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Input
                  placeholder="Community name"
                  value={newCommunity.name}
                  onChange={(e) => setNewCommunity({ ...newCommunity, name: e.target.value })}
                />
              </div>
              <div>
                <Textarea
                  placeholder="Description"
                  value={newCommunity.description}
                  onChange={(e) => setNewCommunity({ ...newCommunity, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  value={newCommunity.category}
                  onValueChange={(v) => setNewCommunity({ ...newCommunity, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="support">Support Group</SelectItem>
                    <SelectItem value="condition">Health Condition</SelectItem>
                    <SelectItem value="wellness">Wellness</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={newCommunity.privacy}
                  onValueChange={(v) => setNewCommunity({ ...newCommunity, privacy: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Privacy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="invite_only">Invite Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateCommunity} disabled={creating} className="w-full">
                {creating ? "Creating..." : "Create Community"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search communities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat.id)}
            className="shrink-0"
          >
            <cat.icon className="h-4 w-4 mr-1" />
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Communities Grid */}
      <ScrollArea className="h-[calc(100vh-400px)]">
        <div className="grid gap-4 md:grid-cols-2">
          {filteredCommunities.length === 0 ? (
            <Card className="md:col-span-2">
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-1">No communities found</h3>
                <p className="text-sm text-muted-foreground">
                  Create the first community or try a different search
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredCommunities.map((community) => {
              const CategoryIcon = getCategoryIcon(community.category);
              return (
                <Card 
                  key={community.id} 
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => onSelectCommunity(community)}
                >
                  <div className="h-20 bg-gradient-to-r from-primary/20 to-primary/5" />
                  <CardContent className="pt-0 -mt-8">
                    <div className="flex gap-4">
                      <Avatar className="h-16 w-16 border-4 border-background">
                        <AvatarImage src={community.avatar_url || ""} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <CategoryIcon className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 pt-8">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{community.name}</h3>
                          {community.is_verified && (
                            <Shield className="h-4 w-4 text-primary" />
                          )}
                          {community.privacy !== 'public' && (
                            <Lock className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {community.description || "No description"}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {community.member_count}
                            </span>
                            <Badge variant="secondary" className="capitalize">
                              {community.category}
                            </Badge>
                          </div>
                          {community.is_member ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLeaveCommunity(community.id);
                              }}
                            >
                              Joined
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleJoinCommunity(community.id);
                              }}
                            >
                              Join
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
