import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  Target,
  Users,
  Clock,
  Flame,
  Medal,
  Crown,
  Star,
  TrendingUp,
  Calendar,
  Footprints,
  Heart,
  Dumbbell
} from "lucide-react";

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: "steps" | "exercise" | "hydration" | "sleep" | "mindfulness";
  target: number;
  unit: string;
  duration: string;
  startDate: string;
  endDate: string;
  participants: number;
  isJoined: boolean;
  progress?: number;
  rank?: number;
  prize?: string;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar?: string;
  score: number;
  isCurrentUser: boolean;
}

const MOCK_CHALLENGES: Challenge[] = [
  {
    id: "1",
    title: "10K Steps Daily Challenge",
    description: "Walk 10,000 steps every day for 30 days",
    type: "steps",
    target: 10000,
    unit: "steps/day",
    duration: "30 days",
    startDate: "2024-01-01",
    endDate: "2024-01-30",
    participants: 234,
    isJoined: true,
    progress: 65,
    rank: 12,
    prize: "Fitness tracker"
  },
  {
    id: "2",
    title: "Hydration Hero",
    description: "Drink 8 glasses of water daily for 2 weeks",
    type: "hydration",
    target: 8,
    unit: "glasses/day",
    duration: "14 days",
    startDate: "2024-01-15",
    endDate: "2024-01-29",
    participants: 156,
    isJoined: true,
    progress: 80,
    rank: 5,
    prize: "Water bottle set"
  },
  {
    id: "3",
    title: "Mindful January",
    description: "Complete 15 minutes of meditation daily",
    type: "mindfulness",
    target: 15,
    unit: "min/day",
    duration: "31 days",
    startDate: "2024-01-01",
    endDate: "2024-01-31",
    participants: 89,
    isJoined: false
  },
  {
    id: "4",
    title: "Workout Warrior",
    description: "Complete 20 workout sessions this month",
    type: "exercise",
    target: 20,
    unit: "sessions",
    duration: "30 days",
    startDate: "2024-01-01",
    endDate: "2024-01-30",
    participants: 312,
    isJoined: false,
    prize: "Gym membership"
  },
  {
    id: "5",
    title: "Sleep Well Challenge",
    description: "Get 7+ hours of sleep for 21 consecutive nights",
    type: "sleep",
    target: 7,
    unit: "hrs/night",
    duration: "21 days",
    startDate: "2024-01-10",
    endDate: "2024-01-31",
    participants: 178,
    isJoined: false
  }
];

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: "Sarah M.", score: 298500, isCurrentUser: false },
  { rank: 2, name: "David K.", score: 285200, isCurrentUser: false },
  { rank: 3, name: "Grace T.", score: 276800, isCurrentUser: false },
  { rank: 4, name: "Michael O.", score: 268400, isCurrentUser: false },
  { rank: 5, name: "You", score: 254600, isCurrentUser: true },
  { rank: 6, name: "Jane D.", score: 248900, isCurrentUser: false },
  { rank: 7, name: "Peter N.", score: 242100, isCurrentUser: false },
  { rank: 8, name: "Ruth M.", score: 235600, isCurrentUser: false },
];

const TYPE_ICONS: Record<string, typeof Footprints> = {
  steps: Footprints,
  exercise: Dumbbell,
  hydration: Heart,
  sleep: Clock,
  mindfulness: Star
};

const TYPE_COLORS: Record<string, string> = {
  steps: "bg-success/10 text-success",
  exercise: "bg-primary/10 text-primary",
  hydration: "bg-info/10 text-info",
  sleep: "bg-purple-100 text-purple-700",
  mindfulness: "bg-warning/10 text-warning"
};

export function WellnessChallenges() {
  const [activeTab, setActiveTab] = useState("active");
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(MOCK_CHALLENGES[0]);

  const activeChallenges = MOCK_CHALLENGES.filter(c => c.isJoined);
  const availableChallenges = MOCK_CHALLENGES.filter(c => !c.isJoined);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-medium text-muted-foreground">{rank}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Wellness Challenges</h2>
          <p className="text-sm text-muted-foreground">Compete, achieve, and celebrate wellness milestones</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Your Points</p>
            <p className="text-2xl font-bold text-primary flex items-center gap-1">
              <Flame className="h-5 w-5" />
              2,546
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Challenges Won</p>
            <p className="text-2xl font-bold flex items-center gap-1">
              <Trophy className="h-5 w-5 text-yellow-500" />
              3
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Challenges List */}
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="active" className="flex-1">My Challenges</TabsTrigger>
              <TabsTrigger value="discover" className="flex-1">Discover</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-4">
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {activeChallenges.map(challenge => {
                    const Icon = TYPE_ICONS[challenge.type];
                    return (
                      <Card 
                        key={challenge.id}
                        className={`cursor-pointer hover:bg-accent/50 transition-colors ${
                          selectedChallenge?.id === challenge.id ? 'border-primary' : ''
                        }`}
                        onClick={() => setSelectedChallenge(challenge)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${TYPE_COLORS[challenge.type]}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium truncate">{challenge.title}</h3>
                              <p className="text-xs text-muted-foreground">{challenge.duration}</p>
                              <div className="mt-2">
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span>Progress</span>
                                  <span className="font-medium">{challenge.progress}%</span>
                                </div>
                                <Progress value={challenge.progress} className="h-2" />
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <Badge variant="secondary" className="text-xs">
                                  <Trophy className="h-3 w-3 mr-1" />
                                  Rank #{challenge.rank}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {challenge.participants} participants
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  {activeChallenges.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>No active challenges</p>
                      <p className="text-sm">Browse discover tab to join one!</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="discover" className="mt-4">
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {availableChallenges.map(challenge => {
                    const Icon = TYPE_ICONS[challenge.type];
                    return (
                      <Card key={challenge.id} className="hover:bg-accent/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${TYPE_COLORS[challenge.type]}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium truncate">{challenge.title}</h3>
                              <p className="text-xs text-muted-foreground line-clamp-2">{challenge.description}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="text-xs">
                                  <Target className="h-3 w-3 mr-1" />
                                  {challenge.target} {challenge.unit}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {challenge.duration}
                                </span>
                              </div>
                              {challenge.prize && (
                                <Badge className="mt-2 text-xs bg-yellow-100 text-yellow-800">
                                  <Trophy className="h-3 w-3 mr-1" />
                                  Prize: {challenge.prize}
                                </Badge>
                              )}
                              <div className="flex items-center justify-between mt-3">
                                <span className="text-xs text-muted-foreground">
                                  <Users className="h-3 w-3 inline mr-1" />
                                  {challenge.participants} joined
                                </span>
                                <Button size="sm">Join Challenge</Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Challenge Details & Leaderboard */}
        <div className="lg:col-span-2 space-y-4">
          {selectedChallenge && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${TYPE_COLORS[selectedChallenge.type]}`}>
                        {(() => {
                          const Icon = TYPE_ICONS[selectedChallenge.type];
                          return <Icon className="h-6 w-6" />;
                        })()}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{selectedChallenge.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{selectedChallenge.description}</p>
                      </div>
                    </div>
                    {selectedChallenge.prize && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Trophy className="h-4 w-4 mr-1" />
                        {selectedChallenge.prize}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <Target className="h-5 w-5 mx-auto text-primary mb-1" />
                      <p className="text-lg font-bold">{selectedChallenge.target}</p>
                      <p className="text-xs text-muted-foreground">{selectedChallenge.unit}</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <Calendar className="h-5 w-5 mx-auto text-primary mb-1" />
                      <p className="text-lg font-bold">{selectedChallenge.duration}</p>
                      <p className="text-xs text-muted-foreground">Duration</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <Users className="h-5 w-5 mx-auto text-primary mb-1" />
                      <p className="text-lg font-bold">{selectedChallenge.participants}</p>
                      <p className="text-xs text-muted-foreground">Participants</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <Trophy className="h-5 w-5 mx-auto text-yellow-500 mb-1" />
                      <p className="text-lg font-bold">#{selectedChallenge.rank || '-'}</p>
                      <p className="text-xs text-muted-foreground">Your Rank</p>
                    </div>
                  </div>

                  {selectedChallenge.progress !== undefined && (
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span>Overall Progress</span>
                        <span className="font-medium">{selectedChallenge.progress}%</span>
                      </div>
                      <Progress value={selectedChallenge.progress} className="h-3" />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Leaderboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[250px]">
                    <div className="space-y-2">
                      {MOCK_LEADERBOARD.map(entry => (
                        <div 
                          key={entry.rank}
                          className={`flex items-center gap-3 p-3 rounded-lg ${
                            entry.isCurrentUser ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted'
                          }`}
                        >
                          <div className="w-8 flex justify-center">
                            {getRankIcon(entry.rank)}
                          </div>
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className={entry.isCurrentUser ? 'bg-primary text-primary-foreground' : ''}>
                              {entry.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <span className={`font-medium ${entry.isCurrentUser ? 'text-primary' : ''}`}>
                              {entry.name}
                            </span>
                            {entry.isCurrentUser && (
                              <Badge variant="secondary" className="ml-2 text-xs">You</Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{entry.score.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">points</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
