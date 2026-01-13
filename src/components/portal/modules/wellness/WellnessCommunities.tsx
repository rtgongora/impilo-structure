import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Users,
  Search,
  Plus,
  Heart,
  MessageCircle,
  Share2,
  Trophy,
  MapPin,
  Globe,
  Lock,
  Crown,
  TrendingUp
} from "lucide-react";

interface Community {
  id: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  isPrivate: boolean;
  isJoined: boolean;
  image?: string;
  recentActivity: string;
}

interface Post {
  id: string;
  author: string;
  authorAvatar?: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  isLiked: boolean;
}

const MOCK_COMMUNITIES: Community[] = [
  {
    id: "1",
    name: "Harare Running Club",
    description: "Join fellow runners in Harare for weekly runs and fitness tips",
    category: "running",
    memberCount: 342,
    isPrivate: false,
    isJoined: true,
    recentActivity: "5 members completed morning run today"
  },
  {
    id: "2",
    name: "Diabetes Lifestyle Support",
    description: "A supportive community for managing diabetes through lifestyle changes",
    category: "support",
    memberCount: 187,
    isPrivate: true,
    isJoined: true,
    recentActivity: "New meal plan shared by nutritionist"
  },
  {
    id: "3",
    name: "Yoga & Mindfulness ZW",
    description: "Daily yoga sessions and mindfulness practices for wellbeing",
    category: "yoga",
    memberCount: 256,
    isPrivate: false,
    isJoined: false,
    recentActivity: "Live session starting in 2 hours"
  },
  {
    id: "4",
    name: "Weight Loss Warriors",
    description: "Track progress together and share healthy recipes",
    category: "fitness",
    memberCount: 423,
    isPrivate: false,
    isJoined: false,
    recentActivity: "Member lost 10kg - celebration post!"
  },
  {
    id: "5",
    name: "Mental Health Peers",
    description: "Safe space for mental health support and discussions",
    category: "mental_health",
    memberCount: 128,
    isPrivate: true,
    isJoined: false,
    recentActivity: "Weekly check-in thread active"
  }
];

const MOCK_POSTS: Post[] = [
  {
    id: "1",
    author: "Sarah M.",
    content: "Just completed my first 5K run! Thanks to everyone who encouraged me. This community is amazing! 🏃‍♀️",
    timestamp: "2 hours ago",
    likes: 24,
    comments: 8,
    isLiked: false
  },
  {
    id: "2",
    author: "David K.",
    content: "Pro tip: Try morning runs before 6 AM - cooler temperature and less traffic. See you all at the park tomorrow!",
    timestamp: "5 hours ago",
    likes: 45,
    comments: 12,
    isLiked: true
  },
  {
    id: "3",
    author: "Grace T.",
    content: "Week 4 of training complete! Went from struggling with 1km to running 3km continuously. Consistency is key!",
    timestamp: "1 day ago",
    likes: 67,
    comments: 15,
    isLiked: false
  }
];

const CATEGORY_LABELS: Record<string, string> = {
  running: "Running",
  yoga: "Yoga",
  fitness: "Fitness",
  support: "Support Group",
  mental_health: "Mental Health"
};

const CATEGORY_COLORS: Record<string, string> = {
  running: "bg-success/10 text-success",
  yoga: "bg-purple-100 text-purple-700",
  fitness: "bg-primary/10 text-primary",
  support: "bg-warning/10 text-warning",
  mental_health: "bg-info/10 text-info"
};

export function WellnessCommunities() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("my-communities");
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(MOCK_COMMUNITIES[0]);
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [newPost, setNewPost] = useState("");

  const myCommunities = MOCK_COMMUNITIES.filter(c => c.isJoined);
  const discoverCommunities = MOCK_COMMUNITIES.filter(c => !c.isJoined);

  const filteredCommunities = (activeTab === "my-communities" ? myCommunities : discoverCommunities)
    .filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleLike = (postId: string) => {
    setPosts(posts.map(p => 
      p.id === postId 
        ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
        : p
    ));
  };

  const handlePost = () => {
    if (!newPost.trim()) return;
    const post: Post = {
      id: Date.now().toString(),
      author: "You",
      content: newPost,
      timestamp: "Just now",
      likes: 0,
      comments: 0,
      isLiked: false
    };
    setPosts([post, ...posts]);
    setNewPost("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Wellness Communities</h2>
          <p className="text-sm text-muted-foreground">Connect with others on your wellness journey</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Community
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Community</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Input placeholder="Community Name" />
              <Textarea placeholder="Description" />
              <div className="flex items-center gap-4">
                <Button variant="outline" className="flex-1">
                  <Globe className="h-4 w-4 mr-2" />
                  Public
                </Button>
                <Button variant="outline" className="flex-1">
                  <Lock className="h-4 w-4 mr-2" />
                  Private
                </Button>
              </div>
              <Button className="w-full">Create Community</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Communities List */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search communities..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="my-communities" className="flex-1">My Communities</TabsTrigger>
              <TabsTrigger value="discover" className="flex-1">Discover</TabsTrigger>
            </TabsList>

            <TabsContent value="my-communities" className="mt-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredCommunities.map(community => (
                    <Card 
                      key={community.id}
                      className={`cursor-pointer hover:bg-accent/50 transition-colors ${
                        selectedCommunity?.id === community.id ? 'border-primary' : ''
                      }`}
                      onClick={() => setSelectedCommunity(community)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10">
                              <Users className="h-5 w-5 text-primary" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{community.name}</span>
                              {community.isPrivate && <Lock className="h-3 w-3 text-muted-foreground" />}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{community.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className={`text-xs ${CATEGORY_COLORS[community.category]}`}>
                                {CATEGORY_LABELS[community.category]}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{community.memberCount} members</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="discover" className="mt-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredCommunities.map(community => (
                    <Card key={community.id} className="hover:bg-accent/50 transition-colors">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10">
                              <Users className="h-5 w-5 text-primary" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{community.name}</span>
                              {community.isPrivate && <Lock className="h-3 w-3 text-muted-foreground" />}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{community.description}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-muted-foreground">{community.memberCount} members</span>
                              <Button size="sm" variant="outline">
                                <Plus className="h-3 w-3 mr-1" />
                                Join
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Community Feed */}
        <div className="lg:col-span-2">
          {selectedCommunity ? (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10">
                        <Users className="h-6 w-6 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {selectedCommunity.name}
                        {selectedCommunity.isPrivate && <Lock className="h-4 w-4 text-muted-foreground" />}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{selectedCommunity.memberCount} members</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Leaderboard
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{selectedCommunity.recentActivity}</p>
              </CardHeader>
              <CardContent>
                {/* New Post */}
                <div className="border rounded-lg p-3 mb-4">
                  <Textarea
                    placeholder="Share your wellness journey..."
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    className="border-0 p-0 resize-none focus-visible:ring-0"
                    rows={2}
                  />
                  <div className="flex justify-end mt-2">
                    <Button size="sm" onClick={handlePost} disabled={!newPost.trim()}>
                      Post
                    </Button>
                  </div>
                </div>

                {/* Posts Feed */}
                <ScrollArea className="h-[350px]">
                  <div className="space-y-4">
                    {posts.map(post => (
                      <div key={post.id} className="border rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{post.author[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-medium text-sm">{post.author}</span>
                            <span className="text-xs text-muted-foreground ml-2">{post.timestamp}</span>
                          </div>
                        </div>
                        <p className="text-sm mb-3">{post.content}</p>
                        <div className="flex items-center gap-4">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={post.isLiked ? 'text-destructive' : ''}
                            onClick={() => handleLike(post.id)}
                          >
                            <Heart className={`h-4 w-4 mr-1 ${post.isLiked ? 'fill-current' : ''}`} />
                            {post.likes}
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MessageCircle className="h-4 w-4 mr-1" />
                            {post.comments}
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Share2 className="h-4 w-4 mr-1" />
                            Share
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a community to view posts</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
