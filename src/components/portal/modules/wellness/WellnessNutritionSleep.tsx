import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Utensils, Droplets, Moon, Coffee, Apple, Salad, Pizza, Cookie,
  Plus, Clock, Star, TrendingUp, Bed, Sun, Camera
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const MEAL_TYPES = [
  { value: "breakfast", label: "Breakfast", icon: Coffee, time: "Morning" },
  { value: "lunch", label: "Lunch", icon: Salad, time: "Midday" },
  { value: "dinner", label: "Dinner", icon: Pizza, time: "Evening" },
  { value: "snack", label: "Snack", icon: Cookie, time: "Any time" },
];

const DIETARY_TAGS = [
  "vegetarian", "vegan", "low_salt", "low_sugar", "high_protein", 
  "gluten_free", "diabetic_friendly", "heart_healthy"
];

export function WellnessNutritionSleep() {
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [showAddSleep, setShowAddSleep] = useState(false);
  const [activeTab, setActiveTab] = useState("nutrition");
  
  const [newMeal, setNewMeal] = useState({
    meal_type: "lunch",
    description: "",
    calories: "",
    dietary_tags: [] as string[],
  });

  const [newSleep, setNewSleep] = useState({
    bedtime: "22:00",
    wake_time: "06:30",
    quality_rating: 4,
    notes: "",
  });

  // Demo data
  const todayNutrition = {
    waterIntake: 1500,
    waterGoal: 2000,
    caloriesLogged: 1450,
    mealsLogged: 2,
    lastMeal: { type: "lunch", time: "12:30 PM", description: "Grilled chicken salad with quinoa" },
  };

  const todaySleep = {
    duration: 7.5,
    quality: 4,
    bedtime: "22:30",
    wakeTime: "06:00",
    weeklyAverage: 7.2,
  };

  const recentMeals = [
    { id: "1", meal_type: "breakfast", log_time: "07:30", meal_description: "Oatmeal with banana and honey", calories: 350 },
    { id: "2", meal_type: "lunch", log_time: "12:30", meal_description: "Grilled chicken salad with quinoa", calories: 550 },
    { id: "3", meal_type: "snack", log_time: "15:00", meal_description: "Apple and almonds", calories: 200 },
  ];

  const recentSleep = [
    { id: "1", sleep_date: new Date().toISOString(), duration_hours: 7.5, quality_rating: 4 },
    { id: "2", sleep_date: new Date(Date.now() - 86400000).toISOString(), duration_hours: 6.5, quality_rating: 3 },
    { id: "3", sleep_date: new Date(Date.now() - 172800000).toISOString(), duration_hours: 8, quality_rating: 5 },
    { id: "4", sleep_date: new Date(Date.now() - 259200000).toISOString(), duration_hours: 7, quality_rating: 4 },
  ];

  const handleAddWater = (amount: number) => {
    console.log("Adding water:", amount);
  };

  const handleSaveMeal = () => {
    console.log("Saving meal:", newMeal);
    setShowAddMeal(false);
    setNewMeal({ meal_type: "lunch", description: "", calories: "", dietary_tags: [] });
  };

  const handleSaveSleep = () => {
    console.log("Saving sleep:", newSleep);
    setShowAddSleep(false);
  };

  const getMealIcon = (type: string) => {
    const meal = MEAL_TYPES.find(m => m.value === type);
    return meal?.icon || Utensils;
  };

  const QualityStars = ({ rating, onChange }: { rating: number; onChange?: (r: number) => void }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          onClick={() => onChange?.(star)}
          disabled={!onChange}
          className={cn(
            "transition-colors",
            onChange && "hover:text-yellow-400 cursor-pointer"
          )}
        >
          <Star 
            className={cn(
              "h-5 w-5",
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
            )} 
          />
        </button>
      ))}
    </div>
  );

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="nutrition" className="flex items-center gap-2">
          <Utensils className="h-4 w-4" />
          Nutrition
        </TabsTrigger>
        <TabsTrigger value="sleep" className="flex items-center gap-2">
          <Moon className="h-4 w-4" />
          Sleep
        </TabsTrigger>
      </TabsList>

      {/* Nutrition Tab */}
      <TabsContent value="nutrition" className="space-y-6">
        {/* Hydration Card */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Droplets className="h-5 w-5 text-blue-500" />
              Hydration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-blue-600">
                    {(todayNutrition.waterIntake / 1000).toFixed(1)}L
                  </span>
                  <span className="text-muted-foreground">/ {(todayNutrition.waterGoal / 1000).toFixed(1)}L</span>
                </div>
                <Progress 
                  value={(todayNutrition.waterIntake / todayNutrition.waterGoal) * 100} 
                  className="h-3"
                />
              </div>
              <div className="flex gap-2">
                {[250, 500].map(amount => (
                  <Button 
                    key={amount}
                    variant="outline" 
                    size="sm"
                    onClick={() => handleAddWater(amount)}
                    className="flex flex-col h-auto py-2"
                  >
                    <Droplets className="h-4 w-4 text-blue-500" />
                    <span className="text-xs">{amount}ml</span>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meals Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Utensils className="h-5 w-5 text-green-500" />
                Today's Meals
              </CardTitle>
              <Button size="sm" onClick={() => setShowAddMeal(!showAddMeal)}>
                <Plus className="h-4 w-4 mr-1" />
                Log Meal
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showAddMeal && (
              <div className="p-4 border rounded-lg mb-4 bg-muted/30">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Meal Type</Label>
                    <Select value={newMeal.meal_type} onValueChange={(v) => setNewMeal({ ...newMeal, meal_type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MEAL_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Calories (optional)</Label>
                    <Input 
                      type="number" 
                      placeholder="e.g., 500"
                      value={newMeal.calories}
                      onChange={(e) => setNewMeal({ ...newMeal, calories: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Description</Label>
                    <Textarea 
                      placeholder="What did you eat?"
                      value={newMeal.description}
                      onChange={(e) => setNewMeal({ ...newMeal, description: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Tags (optional)</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {DIETARY_TAGS.map(tag => (
                        <Badge 
                          key={tag}
                          variant={newMeal.dietary_tags.includes(tag) ? "default" : "outline"}
                          className="cursor-pointer capitalize"
                          onClick={() => setNewMeal(prev => ({
                            ...prev,
                            dietary_tags: prev.dietary_tags.includes(tag)
                              ? prev.dietary_tags.filter(t => t !== tag)
                              : [...prev.dietary_tags, tag]
                          }))}
                        >
                          {tag.replace("_", " ")}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleSaveMeal}>Save Meal</Button>
                  <Button variant="outline">
                    <Camera className="h-4 w-4 mr-1" />
                    Add Photo
                  </Button>
                  <Button variant="ghost" onClick={() => setShowAddMeal(false)}>Cancel</Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {recentMeals.map(meal => {
                const Icon = getMealIcon(meal.meal_type);
                return (
                  <div key={meal.id} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">{meal.meal_type}</span>
                        <span className="text-xs text-muted-foreground">{meal.log_time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{meal.meal_description}</p>
                    </div>
                    {meal.calories && (
                      <Badge variant="secondary">{meal.calories} kcal</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Sleep Tab */}
      <TabsContent value="sleep" className="space-y-6">
        {/* Last Night's Sleep */}
        <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border-indigo-200 dark:border-indigo-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Moon className="h-5 w-5 text-indigo-500" />
                Last Night
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => setShowAddSleep(!showAddSleep)}>
                <Plus className="h-4 w-4 mr-1" />
                Log Sleep
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                  {todaySleep.duration}h
                </div>
                <div className="text-sm text-muted-foreground">Duration</div>
              </div>
              <div className="text-center">
                <QualityStars rating={todaySleep.quality} />
                <div className="text-sm text-muted-foreground mt-1">Quality</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Moon className="h-4 w-4 text-indigo-400" />
                    {todaySleep.bedtime}
                  </div>
                  <div className="flex items-center gap-1">
                    <Sun className="h-4 w-4 text-yellow-500" />
                    {todaySleep.wakeTime}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground mt-1">Schedule</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {showAddSleep && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Log Sleep</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Bedtime</Label>
                  <Input 
                    type="time"
                    value={newSleep.bedtime}
                    onChange={(e) => setNewSleep({ ...newSleep, bedtime: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Wake Time</Label>
                  <Input 
                    type="time"
                    value={newSleep.wake_time}
                    onChange={(e) => setNewSleep({ ...newSleep, wake_time: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="mb-2 block">Sleep Quality</Label>
                  <QualityStars 
                    rating={newSleep.quality_rating} 
                    onChange={(r) => setNewSleep({ ...newSleep, quality_rating: r })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Notes (optional)</Label>
                  <Textarea 
                    placeholder="How did you sleep?"
                    value={newSleep.notes}
                    onChange={(e) => setNewSleep({ ...newSleep, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleSaveSleep}>Save</Button>
                <Button variant="ghost" onClick={() => setShowAddSleep(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sleep History */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Sleep History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentSleep.map(sleep => (
                <div key={sleep.id} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <Bed className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">
                      {format(new Date(sleep.sleep_date), "EEEE, MMM d")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {sleep.duration_hours} hours
                    </div>
                  </div>
                  <QualityStars rating={sleep.quality_rating} />
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Weekly Average</span>
                <span className="text-lg font-bold text-indigo-600">{todaySleep.weeklyAverage}h</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
