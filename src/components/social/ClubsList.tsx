import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Search, 
  Plus, 
  Users, 
  Dumbbell, 
  Heart, 
  Apple, 
  Brain, 
  HandHeart,
  Trophy,
  Calendar,
  CheckCircle 
} from "lucide-react";

interface Club {
  id: string;
  name: string;
  slug: string;
  description: string;
  club_type: string;
  category: string;
  cover_image_url: string;
  avatar_url: string;
  privacy: string;
  has_events: boolean;
  has_challenges: boolean;
  has_leaderboard: boolean;
  member_count: number;
  is_verified: boolean;
  created_at: string;
  is_member?: boolean;
}

interface ClubsListProps {
  onSelectClub: (club: Club) => void;
}

const clubTypes = [
  { value: "health", label: "Health", icon: Heart },
  { value: "wellness", label: "Wellness", icon: HandHeart },
  { value: "fitness", label: "Fitness", icon: Dumbbell },
  { value: "nutrition", label: "Nutrition", icon: Apple },
  { value: "mental_health", label: "Mental Health", icon: Brain },
  { value: "support", label: "Support", icon: Users },
];

export function ClubsList({ onSelectClub }: ClubsListProps) {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newClub, setNewClub] = useState({
    name: "",
    description: "",
    club_type: "health",
    category: "general",
    privacy: "public",
    has_events: true,
    has_challenges: true,
    has_leaderboard: false,
  });

  useEffect(() => {
    fetchClubs();
  }, [user, selectedType]);

  const fetchClubs = async () => {
    try {
      let query = supabase.from("clubs").select("*").eq("is_active", true);

      if (selectedType) {
        query = query.eq("club_type", selectedType);
      }

      const { data, error } = await query.order("member_count", { ascending: false });

      if (error) throw error;

      let clubsData = data || [];

      // Check membership status
      if (user && clubsData.length > 0) {
        const { data: memberships } = await supabase
          .from("club_members")
          .select("club_id")
          .eq("user_id", user.id);

        const memberClubIds = new Set(memberships?.map(m => m.club_id) || []);
        clubsData = clubsData.map(club => ({
          ...club,
          is_member: memberClubIds.has(club.id)
        }));
      }

      setClubs(clubsData);
    } catch (error) {
      console.error("Error fetching clubs:", error);
      toast.error("Failed to load clubs");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClub = async () => {
    if (!user || !newClub.name.trim()) {
      toast.error("Please enter a club name");
      return;
    }

    try {
      const slug = newClub.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

      const { data, error } = await supabase.from("clubs").insert({
        ...newClub,
        slug,
        created_by: user.id,
      }).select().single();

      if (error) throw error;

      // Auto-join as owner
      await supabase.from("club_members").insert({
        club_id: data.id,
        user_id: user.id,
        role: "owner",
      });

      toast.success("Club created successfully!");
      setShowCreateDialog(false);
      setNewClub({
        name: "",
        description: "",
        club_type: "health",
        category: "general",
        privacy: "public",
        has_events: true,
        has_challenges: true,
        has_leaderboard: false,
      });
      fetchClubs();
    } catch (error: any) {
      console.error("Error creating club:", error);
      toast.error(error.message || "Failed to create club");
    }
  };

  const handleJoinClub = async (clubId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Please sign in to join clubs");
      return;
    }

    try {
      await supabase.from("club_members").insert({
        club_id: clubId,
        user_id: user.id,
        role: "member",
      });

      toast.success("Joined club successfully!");
      fetchClubs();
    } catch (error) {
      console.error("Error joining club:", error);
      toast.error("Failed to join club");
    }
  };

  const handleLeaveClub = async (clubId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    try {
      await supabase.from("club_members")
        .delete()
        .eq("club_id", clubId)
        .eq("user_id", user.id);

      toast.success("Left club successfully!");
      fetchClubs();
    } catch (error) {
      console.error("Error leaving club:", error);
      toast.error("Failed to leave club");
    }
  };

  const getClubTypeIcon = (type: string) => {
    const clubType = clubTypes.find(t => t.value === type);
    const Icon = clubType?.icon || Users;
    return <Icon className="h-4 w-4" />;
  };

  const filteredClubs = clubs.filter(club =>
    club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    club.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-20" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with search and create */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clubs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Club
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create a Health/Wellness Club</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Club Name</Label>
                <Input
                  value={newClub.name}
                  onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
                  placeholder="e.g., Morning Runners Club"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newClub.description}
                  onChange={(e) => setNewClub({ ...newClub, description: e.target.value })}
                  placeholder="What is this club about?"
                  rows={3}
                />
              </div>
              <div>
                <Label>Club Type</Label>
                <Select
                  value={newClub.club_type}
                  onValueChange={(value) => setNewClub({ ...newClub, club_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {clubTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Privacy</Label>
                <Select
                  value={newClub.privacy}
                  onValueChange={(value) => setNewClub({ ...newClub, privacy: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public - Anyone can join</SelectItem>
                    <SelectItem value="private">Private - Requires approval</SelectItem>
                    <SelectItem value="invite_only">Invite Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newClub.has_events}
                    onChange={(e) => setNewClub({ ...newClub, has_events: e.target.checked })}
                    className="rounded"
                  />
                  <Calendar className="h-4 w-4" />
                  Events
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newClub.has_challenges}
                    onChange={(e) => setNewClub({ ...newClub, has_challenges: e.target.checked })}
                    className="rounded"
                  />
                  <Trophy className="h-4 w-4" />
                  Challenges
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newClub.has_leaderboard}
                    onChange={(e) => setNewClub({ ...newClub, has_leaderboard: e.target.checked })}
                    className="rounded"
                  />
                  <Trophy className="h-4 w-4" />
                  Leaderboard
                </label>
              </div>
              <Button onClick={handleCreateClub} className="w-full">
                Create Club
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Type filters */}
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-2">
          <Button
            variant={selectedType === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedType(null)}
          >
            All
          </Button>
          {clubTypes.map((type) => (
            <Button
              key={type.value}
              variant={selectedType === type.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType(type.value)}
              className="flex items-center gap-2"
            >
              <type.icon className="h-4 w-4" />
              {type.label}
            </Button>
          ))}
        </div>
      </ScrollArea>

      {/* Clubs grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClubs.map((club) => (
          <Card
            key={club.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onSelectClub(club)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    {getClubTypeIcon(club.club_type)}
                  </div>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {club.name}
                      {club.is_verified && (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      )}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {clubTypes.find(t => t.value === club.club_type)?.label || club.club_type}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <CardDescription className="line-clamp-2">
                {club.description || "No description"}
              </CardDescription>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {club.member_count}
                  </span>
                  {club.has_events && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Events
                    </span>
                  )}
                  {club.has_challenges && (
                    <span className="flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      Challenges
                    </span>
                  )}
                </div>
                
                {club.is_member ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => handleLeaveClub(club.id, e)}
                  >
                    Joined
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={(e) => handleJoinClub(club.id, e)}
                  >
                    Join
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClubs.length === 0 && (
        <div className="text-center py-12">
          <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No clubs found</h3>
          <p className="text-muted-foreground">
            {searchQuery ? "Try a different search term" : "Be the first to create a club!"}
          </p>
        </div>
      )}
    </div>
  );
}
