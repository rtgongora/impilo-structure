import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Smile, Meh, Frown, Heart, Brain, Battery, Sun, Cloud, 
  Moon, Zap, Coffee, BookOpen, Plus, Calendar, TrendingUp
} from "lucide-react";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";

interface MoodLog {
  id: string;
  log_date: string;
  mood_rating: number;
  energy_level: number;
  stress_level: number;
  mood_tags: string[];
  notes?: string;
}

const MOOD_LEVELS = [
  { value: 1, label: "Very Low", icon: Frown, color: "text-red-500", bg: "bg-red-100 dark:bg-red-900/30" },
  { value: 2, label: "Low", icon: Frown, color: "text-orange-500", bg: "bg-orange-100 dark:bg-orange-900/30" },
  { value: 3, label: "Okay", icon: Meh, color: "text-yellow-500", bg: "bg-yellow-100 dark:bg-yellow-900/30" },
  { value: 4, label: "Good", icon: Smile, color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/30" },
  { value: 5, label: "Excellent", icon: Smile, color: "text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
];

const MOOD_TAGS = [
  { value: "happy", label: "Happy", icon: Smile },
  { value: "calm", label: "Calm", icon: Sun },
  { value: "anxious", label: "Anxious", icon: Cloud },
  { value: "sad", label: "Sad", icon: Frown },
  { value: "motivated", label: "Motivated", icon: Zap },
  { value: "tired", label: "Tired", icon: Moon },
  { value: "stressed", label: "Stressed", icon: Brain },
  { value: "grateful", label: "Grateful", icon: Heart },
  { value: "focused", label: "Focused", icon: Coffee },
  { value: "creative", label: "Creative", icon: BookOpen },
];

export function WellnessMoodTracker() {
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [checkIn, setCheckIn] = useState({
    mood_rating: 3,
    energy_level: 3,
    stress_level: 3,
    mood_tags: [] as string[],
    notes: "",
  });

  // Demo data - 7 day history
  const moodHistory: MoodLog[] = Array.from({ length: 7 }, (_, i) => ({
    id: `mood-${i}`,
    log_date: subDays(new Date(), i).toISOString(),
    mood_rating: Math.floor(Math.random() * 3) + 3,
    energy_level: Math.floor(Math.random() * 3) + 2,
    stress_level: Math.floor(Math.random() * 3) + 1,
    mood_tags: ["calm", "focused"].slice(0, Math.floor(Math.random() * 2) + 1),
    notes: i === 0 ? "Had a productive morning workout" : undefined,
  }));

  const todaysMood = moodHistory[0];
  const averageMood = (moodHistory.reduce((sum, m) => sum + m.mood_rating, 0) / moodHistory.length).toFixed(1);
  const averageEnergy = (moodHistory.reduce((sum, m) => sum + m.energy_level, 0) / moodHistory.length).toFixed(1);

  const toggleMoodTag = (tag: string) => {
    setCheckIn(prev => ({
      ...prev,
      mood_tags: prev.mood_tags.includes(tag)
        ? prev.mood_tags.filter(t => t !== tag)
        : [...prev.mood_tags, tag]
    }));
  };

  const handleSaveCheckIn = () => {
    console.log("Saving mood check-in:", checkIn);
    setShowCheckIn(false);
    setCheckIn({ mood_rating: 3, energy_level: 3, stress_level: 3, mood_tags: [], notes: "" });
  };

  const MoodSelector = ({ 
    value, 
    onChange, 
    label 
  }: { 
    value: number; 
    onChange: (v: number) => void; 
    label: string;
  }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex gap-2">
        {MOOD_LEVELS.map(level => {
          const Icon = level.icon;
          return (
            <button
              key={level.value}
              onClick={() => onChange(level.value)}
              className={cn(
                "flex-1 p-3 rounded-lg border-2 transition-all",
                value === level.value
                  ? `${level.bg} border-current ${level.color}`
                  : "border-transparent bg-muted/50 hover:bg-muted"
              )}
            >
              <Icon className={cn("h-6 w-6 mx-auto", value === level.value ? level.color : "text-muted-foreground")} />
              <span className={cn("text-xs mt-1 block", value === level.value ? "font-medium" : "text-muted-foreground")}>
                {level.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const getMoodLevel = (rating: number) => MOOD_LEVELS.find(m => m.value === rating) || MOOD_LEVELS[2];

  return (
    <div className="space-y-6">
      {/* Today's Status / Quick Check-in */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-500" />
                How are you feeling?
              </CardTitle>
              {!showCheckIn && (
                <Button size="sm" onClick={() => setShowCheckIn(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Check In
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {showCheckIn ? (
              <div className="space-y-6">
                <MoodSelector 
                  value={checkIn.mood_rating} 
                  onChange={(v) => setCheckIn({ ...checkIn, mood_rating: v })}
                  label="Overall Mood"
                />
                
                <MoodSelector 
                  value={checkIn.energy_level} 
                  onChange={(v) => setCheckIn({ ...checkIn, energy_level: v })}
                  label="Energy Level"
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium">How would you describe your state?</label>
                  <div className="flex flex-wrap gap-2">
                    {MOOD_TAGS.map(tag => {
                      const Icon = tag.icon;
                      const isSelected = checkIn.mood_tags.includes(tag.value);
                      return (
                        <button
                          key={tag.value}
                          onClick={() => toggleMoodTag(tag.value)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 transition-all",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted hover:bg-muted/80"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {tag.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes (optional)</label>
                  <Textarea 
                    placeholder="Any thoughts or reflections..."
                    value={checkIn.notes}
                    onChange={(e) => setCheckIn({ ...checkIn, notes: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSaveCheckIn}>Save Check-in</Button>
                  <Button variant="outline" onClick={() => setShowCheckIn(false)}>Cancel</Button>
                </div>
              </div>
            ) : todaysMood ? (
              <div className="flex items-center gap-6">
                <div className={cn("p-4 rounded-xl", getMoodLevel(todaysMood.mood_rating).bg)}>
                  {(() => {
                    const Icon = getMoodLevel(todaysMood.mood_rating).icon;
                    return <Icon className={cn("h-12 w-12", getMoodLevel(todaysMood.mood_rating).color)} />;
                  })()}
                </div>
                <div className="flex-1">
                  <div className="text-lg font-medium">{getMoodLevel(todaysMood.mood_rating).label}</div>
                  <div className="text-sm text-muted-foreground">
                    Logged at {format(new Date(todaysMood.log_date), "h:mm a")}
                  </div>
                  {todaysMood.mood_tags.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {todaysMood.mood_tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="capitalize text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {todaysMood.notes && (
                    <p className="text-sm text-muted-foreground mt-2 italic">"{todaysMood.notes}"</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Meh className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No check-in today yet</p>
                <Button size="sm" className="mt-4" onClick={() => setShowCheckIn(true)}>
                  Start Check-in
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              7-Day Average
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smile className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Mood</span>
                </div>
                <span className="text-xl font-bold">{averageMood}/5</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Battery className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm">Energy</span>
                </div>
                <span className="text-xl font-bold">{averageEnergy}/5</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <span className="text-sm">Check-ins</span>
                </div>
                <span className="text-xl font-bold">{moodHistory.length}/7</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mood History Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Mood History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {[...moodHistory].reverse().map(log => {
              const level = getMoodLevel(log.mood_rating);
              const Icon = level.icon;
              return (
                <div key={log.id} className="flex-1 text-center">
                  <div className={cn("p-2 rounded-lg mb-1", level.bg)}>
                    <Icon className={cn("h-6 w-6 mx-auto", level.color)} />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(log.log_date), "EEE")}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Mindfulness Resources */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            Mindfulness & Relaxation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Sun className="h-8 w-8 text-yellow-500" />
              <span className="font-medium">Breathing Exercise</span>
              <span className="text-xs text-muted-foreground">2 minutes</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Moon className="h-8 w-8 text-indigo-500" />
              <span className="font-medium">Sleep Hygiene Tips</span>
              <span className="text-xs text-muted-foreground">Better rest</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <BookOpen className="h-8 w-8 text-green-500" />
              <span className="font-medium">Gratitude Journal</span>
              <span className="text-xs text-muted-foreground">Daily practice</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
