import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Users,
  Heart,
  Activity,
  Target,
  Calendar,
  MapPin,
  Plus,
  Search,
  MessageSquare,
  Trophy,
  Flame,
  Footprints,
  Utensils,
  Moon,
  Droplets,
  ChevronRight,
  Star,
  Clock,
  CheckCircle2
} from "lucide-react";

interface Community {
  id: string;
  name: string;
  type: "health" | "fitness" | "support" | "wellness";
  members: number;
  description: string;
  isJoined: boolean;
  image?: string;
  recentActivity?: string;
}

interface WellnessGoal {
  id: string;
  type: "steps" | "water" | "sleep" | "nutrition";
  target: number;
  current: number;
  unit: string;
  streak: number;
}

interface WellnessEvent {
  id: string;
  title: string;
  type: "run" | "walk" | "yoga" | "screening" | "workshop";
  date: string;
  location: string;
  participants: number;
  isRegistered: boolean;
}

const MOCK_COMMUNITIES: Community[] = [
  {
    id: "1",
    name: "Diabetes Support Zimbabwe",
    type: "support",
    members: 1240,
    description: "A supportive community for people living with diabetes",
    isJoined: true,
    recentActivity: "New post: 'Managing blood sugar during holidays'"
  },
  {
    id: "2",
    name: "Harare Running Club",
    type: "fitness",
    members: 856,
    description: "Weekly runs and fitness challenges in Harare",
    isJoined: true,
    recentActivity: "Saturday morning run at Borrowdale"
  },
  {
    id: "3",
    name: "Heart Health Warriors",
    type: "health",
    members: 432,
    description: "Support and education for cardiovascular health",
    isJoined: false
  },
  {
    id: "4",
    name: "Mindfulness & Mental Health",
    type: "wellness",
    members: 2100,
    description: "Resources and community for mental wellness",
    isJoined: false
  },
  {
    id: "5",
    name: "New Mothers Circle",
    type: "support",
    members: 678,
    description: "Support network for new and expecting mothers",
    isJoined: false
  }
];

const MOCK_GOALS: WellnessGoal[] = [
  { id: "1", type: "steps", target: 10000, current: 6234, unit: "steps", streak: 5 },
  { id: "2", type: "water", target: 8, current: 5, unit: "glasses", streak: 12 },
  { id: "3", type: "sleep", target: 8, current: 7, unit: "hours", streak: 3 },
  { id: "4", type: "nutrition", target: 5, current: 3, unit: "servings", streak: 7 }
];

const MOCK_EVENTS: WellnessEvent[] = [
  {
    id: "1",
    title: "5K Fun Run for Heart Health",
    type: "run",
    date: "2024-02-10",
    location: "Borrowdale Race Course",
    participants: 234,
    isRegistered: true
  },
  {
    id: "2",
    title: "Free Diabetes Screening",
    type: "screening",
    date: "2024-01-28",
    location: "City General Hospital",
    participants: 89,
    isRegistered: false
  },
  {
    id: "3",
    title: "Morning Yoga in the Park",
    type: "yoga",
    date: "2024-01-27",
    location: "Harare Gardens",
    participants: 45,
    isRegistered: false
  }
];

export function PortalCommunities() {
  const [searchQuery, setSearchQuery] = useState("");

  const joinedCommunities = MOCK_COMMUNITIES.filter(c => c.isJoined);
  const suggestedCommunities = MOCK_COMMUNITIES.filter(c => !c.isJoined);

  const getGoalIcon = (type: string) => {
    switch (type) {
      case "steps": return Footprints;
      case "water": return Droplets;
      case "sleep": return Moon;
      case "nutrition": return Utensils;
      default: return Activity;
    }
  };

  const getGoalColor = (type: string) => {
    switch (type) {
      case "steps": return "text-primary";
      case "water": return "text-info";
      case "sleep": return "text-purple-500";
      case "nutrition": return "text-success";
      default: return "text-muted-foreground";
    }
  };

  const getCommunityIcon = (type: string) => {
    switch (type) {
      case "health": return Heart;
      case "fitness": return Activity;
      case "support": return Users;
      case "wellness": return Star;
      default: return Users;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Communities & Wellness
          </h2>
          <p className="text-sm text-muted-foreground">
            Connect with others and track your health goals
          </p>
        </div>
      </div>

      <Tabs defaultValue="goals">
        <TabsList>
          <TabsTrigger value="goals">My Goals</TabsTrigger>
          <TabsTrigger value="communities">Communities</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        {/* Goals */}
        <TabsContent value="goals" className="space-y-4">
          {/* Streak Banner */}
          <Card className="bg-gradient-to-r from-warning/10 to-warning/5 border-warning/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-warning/10">
                  <Flame className="h-8 w-8 text-warning" />
                </div>
                <div>
                  <p className="font-bold text-lg">12 Day Streak!</p>
                  <p className="text-sm text-muted-foreground">Keep up the great work on your water goal</p>
                </div>
                <Trophy className="h-8 w-8 text-warning ml-auto" />
              </div>
            </CardContent>
          </Card>

          {/* Daily Goals */}
          <div className="grid grid-cols-2 gap-4">
            {MOCK_GOALS.map(goal => {
              const Icon = getGoalIcon(goal.type);
              const progress = (goal.current / goal.target) * 100;
              return (
                <Card key={goal.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${getGoalColor(goal.type)}`} />
                        <span className="font-medium capitalize">{goal.type}</span>
                      </div>
                      {goal.streak > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          <Flame className="h-3 w-3 mr-1" />
                          {goal.streak}
                        </Badge>
                      )}
                    </div>
                    <div className="text-center mb-3">
                      <p className="text-3xl font-bold">{goal.current}</p>
                      <p className="text-sm text-muted-foreground">of {goal.target} {goal.unit}</p>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="flex justify-between mt-3">
                      <Button size="sm" variant="outline" className="text-xs">
                        Log
                      </Button>
                      <Button size="sm" variant="ghost" className="text-xs">
                        Edit Goal
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Button variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add New Goal
          </Button>
        </TabsContent>

        {/* Communities */}
        <TabsContent value="communities" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search communities..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* My Communities */}
          {joinedCommunities.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3">My Communities</h3>
              <div className="space-y-3">
                {joinedCommunities.map(community => {
                  const Icon = getCommunityIcon(community.type);
                  return (
                    <Card key={community.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-lg bg-primary/10">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{community.name}</p>
                              <Badge variant="secondary" className="text-xs">{community.members} members</Badge>
                            </div>
                            {community.recentActivity && (
                              <p className="text-sm text-muted-foreground truncate">
                                {community.recentActivity}
                              </p>
                            )}
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Suggested */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Suggested for You</h3>
            <div className="space-y-3">
              {suggestedCommunities.map(community => {
                const Icon = getCommunityIcon(community.type);
                return (
                  <Card key={community.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-muted">
                          <Icon className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{community.name}</p>
                          <p className="text-sm text-muted-foreground">{community.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {community.members} members
                          </p>
                        </div>
                        <Button size="sm">Join</Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* Events */}
        <TabsContent value="events" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Upcoming health and wellness events</p>
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              View Calendar
            </Button>
          </div>

          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {MOCK_EVENTS.map(event => (
                <Card key={event.id} className={event.isRegistered ? "border-primary/50" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${
                          event.isRegistered ? "bg-primary/10" : "bg-muted"
                        }`}>
                          <Activity className={`h-6 w-6 ${
                            event.isRegistered ? "text-primary" : "text-muted-foreground"
                          }`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{event.title}</p>
                            {event.isRegistered && (
                              <Badge className="bg-success text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Registered
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(event.date).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric"
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {event.location}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            <Users className="h-3 w-3 inline mr-1" />
                            {event.participants} participants
                          </p>
                        </div>
                      </div>
                      {!event.isRegistered && (
                        <Button size="sm">Register</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
