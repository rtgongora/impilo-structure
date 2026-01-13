import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Footprints, Bike, Dumbbell, Heart, Timer, Flame, TrendingUp, 
  Plus, Target, Trophy, Calendar, Smartphone
} from "lucide-react";
import { format } from "date-fns";

interface ActivityLog {
  id: string;
  activity_type: string;
  activity_date: string;
  steps?: number;
  distance_meters?: number;
  duration_minutes?: number;
  calories_burned?: number;
  source: string;
}

interface Goal {
  id: string;
  goal_type: string;
  target_value: number;
  target_unit: string;
  period: string;
  current_value: number;
}

interface Streak {
  streak_type: string;
  current_streak: number;
  longest_streak: number;
}

const ACTIVITY_TYPES = [
  { value: "steps", label: "Steps", icon: Footprints },
  { value: "walk", label: "Walk", icon: Footprints },
  { value: "run", label: "Run", icon: TrendingUp },
  { value: "cycling", label: "Cycling", icon: Bike },
  { value: "gym", label: "Gym", icon: Dumbbell },
  { value: "yoga", label: "Yoga", icon: Heart },
  { value: "swimming", label: "Swimming", icon: TrendingUp },
  { value: "sports", label: "Sports", icon: Trophy },
];

export function WellnessActivityTracker() {
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [newActivity, setNewActivity] = useState({
    activity_type: "steps",
    steps: "",
    duration_minutes: "",
    distance_meters: "",
    calories_burned: "",
  });

  // Demo data
  const todayStats = {
    steps: 7234,
    stepsGoal: 10000,
    activeMinutes: 45,
    activeMinutesGoal: 60,
    caloriesBurned: 320,
    distance: 5.2,
  };

  const goals: Goal[] = [
    { id: "1", goal_type: "steps", target_value: 10000, target_unit: "steps", period: "daily", current_value: 7234 },
    { id: "2", goal_type: "active_minutes", target_value: 60, target_unit: "minutes", period: "daily", current_value: 45 },
    { id: "3", goal_type: "exercise_sessions", target_value: 5, target_unit: "sessions", period: "weekly", current_value: 3 },
  ];

  const streaks: Streak[] = [
    { streak_type: "steps", current_streak: 7, longest_streak: 21 },
    { streak_type: "exercise", current_streak: 3, longest_streak: 14 },
  ];

  const recentActivities: ActivityLog[] = [
    { id: "1", activity_type: "walk", activity_date: new Date().toISOString(), steps: 3200, duration_minutes: 35, distance_meters: 2400, calories_burned: 150, source: "manual" },
    { id: "2", activity_type: "gym", activity_date: new Date(Date.now() - 86400000).toISOString(), duration_minutes: 45, calories_burned: 280, source: "manual" },
    { id: "3", activity_type: "run", activity_date: new Date(Date.now() - 172800000).toISOString(), distance_meters: 5000, duration_minutes: 30, calories_burned: 350, source: "device" },
  ];

  const handleAddActivity = () => {
    console.log("Adding activity:", newActivity);
    setShowAddActivity(false);
    setNewActivity({ activity_type: "steps", steps: "", duration_minutes: "", distance_meters: "", calories_burned: "" });
  };

  const getActivityIcon = (type: string) => {
    const activity = ACTIVITY_TYPES.find(a => a.value === type);
    return activity?.icon || Footprints;
  };

  return (
    <div className="space-y-6">
      {/* Today's Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Footprints className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-muted-foreground">Steps</span>
            </div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {todayStats.steps.toLocaleString()}
            </div>
            <Progress value={(todayStats.steps / todayStats.stepsGoal) * 100} className="mt-2 h-2" />
            <span className="text-xs text-muted-foreground">of {todayStats.stepsGoal.toLocaleString()}</span>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Timer className="h-5 w-5 text-green-600" />
              <span className="text-sm text-muted-foreground">Active</span>
            </div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">
              {todayStats.activeMinutes} min
            </div>
            <Progress value={(todayStats.activeMinutes / todayStats.activeMinutesGoal) * 100} className="mt-2 h-2" />
            <span className="text-xs text-muted-foreground">of {todayStats.activeMinutesGoal} min</span>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="h-5 w-5 text-orange-600" />
              <span className="text-sm text-muted-foreground">Calories</span>
            </div>
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">
              {todayStats.caloriesBurned}
            </div>
            <span className="text-xs text-muted-foreground">kcal burned</span>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <span className="text-sm text-muted-foreground">Distance</span>
            </div>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
              {todayStats.distance} km
            </div>
            <span className="text-xs text-muted-foreground">traveled today</span>
          </CardContent>
        </Card>
      </div>

      {/* Streaks & Goals */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Active Streaks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {streaks.map(streak => (
                <div key={streak.streak_type} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <div className="font-medium capitalize">{streak.streak_type} Streak</div>
                    <div className="text-xs text-muted-foreground">Best: {streak.longest_streak} days</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary">{streak.current_streak}</span>
                    <span className="text-sm text-muted-foreground">days</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Goals Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {goals.map(goal => (
                <div key={goal.id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize">{goal.goal_type.replace("_", " ")}</span>
                    <span className="text-muted-foreground">
                      {goal.current_value} / {goal.target_value} {goal.target_unit}
                    </span>
                  </div>
                  <Progress value={(goal.current_value / goal.target_value) * 100} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Activity / Recent Activities */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Activity Log</CardTitle>
            <Button size="sm" onClick={() => setShowAddActivity(!showAddActivity)}>
              <Plus className="h-4 w-4 mr-1" />
              Log Activity
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showAddActivity && (
            <div className="p-4 border rounded-lg mb-4 bg-muted/30">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Activity Type</Label>
                  <Select 
                    value={newActivity.activity_type} 
                    onValueChange={(v) => setNewActivity({ ...newActivity, activity_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTIVITY_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {newActivity.activity_type === "steps" && (
                  <div>
                    <Label>Steps</Label>
                    <Input 
                      type="number" 
                      placeholder="e.g., 5000"
                      value={newActivity.steps}
                      onChange={(e) => setNewActivity({ ...newActivity, steps: e.target.value })}
                    />
                  </div>
                )}
                <div>
                  <Label>Duration (minutes)</Label>
                  <Input 
                    type="number" 
                    placeholder="e.g., 30"
                    value={newActivity.duration_minutes}
                    onChange={(e) => setNewActivity({ ...newActivity, duration_minutes: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Distance (km)</Label>
                  <Input 
                    type="number" 
                    step="0.1"
                    placeholder="e.g., 3.5"
                    value={newActivity.distance_meters}
                    onChange={(e) => setNewActivity({ ...newActivity, distance_meters: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleAddActivity}>Save Activity</Button>
                <Button variant="outline" onClick={() => setShowAddActivity(false)}>Cancel</Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {recentActivities.map(activity => {
              const Icon = getActivityIcon(activity.activity_type);
              return (
                <div key={activity.id} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">{activity.activity_type}</span>
                      {activity.source === "device" && (
                        <Badge variant="outline" className="text-xs">
                          <Smartphone className="h-3 w-3 mr-1" />
                          Device
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(activity.activity_date), "MMM d, h:mm a")}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    {activity.steps && <div>{activity.steps.toLocaleString()} steps</div>}
                    {activity.duration_minutes && <div>{activity.duration_minutes} min</div>}
                    {activity.distance_meters && <div>{(activity.distance_meters / 1000).toFixed(1)} km</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
