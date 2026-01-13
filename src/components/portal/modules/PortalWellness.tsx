import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, Heart, Brain, Utensils, Users, Trophy, ShoppingBag, 
  Smartphone, Bell, TrendingUp
} from "lucide-react";
import { WellnessActivityTracker } from "./wellness/WellnessActivityTracker";
import { WellnessVitalsTracker } from "./wellness/WellnessVitalsTracker";
import { WellnessMoodTracker } from "./wellness/WellnessMoodTracker";
import { WellnessNutritionSleep } from "./wellness/WellnessNutritionSleep";

export function PortalWellness() {
  const [activeTab, setActiveTab] = useState("overview");

  // Demo stats
  const todayStats = {
    steps: 7234,
    stepsGoal: 10000,
    water: 1500,
    waterGoal: 2000,
    sleep: 7.5,
    mood: 4,
    streak: 7,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Wellness & Lifestyle</h2>
          <p className="text-muted-foreground">Track your daily health and wellness activities</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Trophy className="h-4 w-4 text-yellow-500" />
          {todayStats.streak} day streak
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            <div>
              <div className="text-lg font-bold">{todayStats.steps.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">steps</div>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-green-500" />
            <div>
              <div className="text-lg font-bold">{(todayStats.water / 1000).toFixed(1)}L</div>
              <div className="text-xs text-muted-foreground">water</div>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            <div>
              <div className="text-lg font-bold">{todayStats.sleep}h</div>
              <div className="text-xs text-muted-foreground">sleep</div>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            <div>
              <div className="text-lg font-bold">{todayStats.mood}/5</div>
              <div className="text-xs text-muted-foreground">mood</div>
            </div>
          </div>
        </Card>
        <Card className="p-3 hidden md:block">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <div>
              <div className="text-lg font-bold">Good</div>
              <div className="text-xs text-muted-foreground">trend</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">
            <TrendingUp className="h-4 w-4 mr-1 hidden sm:inline" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="activity" className="text-xs sm:text-sm">
            <Activity className="h-4 w-4 mr-1 hidden sm:inline" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="vitals" className="text-xs sm:text-sm">
            <Heart className="h-4 w-4 mr-1 hidden sm:inline" />
            Vitals
          </TabsTrigger>
          <TabsTrigger value="mood" className="text-xs sm:text-sm">
            <Brain className="h-4 w-4 mr-1 hidden sm:inline" />
            Mood
          </TabsTrigger>
          <TabsTrigger value="nutrition" className="text-xs sm:text-sm hidden lg:flex">
            <Utensils className="h-4 w-4 mr-1" />
            Nutrition
          </TabsTrigger>
          <TabsTrigger value="community" className="text-xs sm:text-sm hidden lg:flex">
            <Users className="h-4 w-4 mr-1" />
            Community
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  Activity Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Track steps, exercise, and active minutes. Set goals and build streaks.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Vitals Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Log weight, BP, heart rate, and glucose. Share with providers when needed.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-500" />
                  Communities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Join wellness groups, participate in challenges, and connect with others.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-purple-500" />
                  Device Sync
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Connect fitness trackers and health devices for automatic data sync.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <WellnessActivityTracker />
        </TabsContent>

        <TabsContent value="vitals" className="mt-6">
          <WellnessVitalsTracker />
        </TabsContent>

        <TabsContent value="mood" className="mt-6">
          <WellnessMoodTracker />
        </TabsContent>

        <TabsContent value="nutrition" className="mt-6">
          <WellnessNutritionSleep />
        </TabsContent>

        <TabsContent value="community" className="mt-6">
          <Card className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Wellness Communities</h3>
            <p className="text-muted-foreground">
              Join fitness groups, participate in challenges, and connect with others on their wellness journey.
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
