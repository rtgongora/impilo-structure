import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Share2,
  Shield,
  Lock,
  Activity,
  Heart,
  Brain,
  Moon,
  Apple,
  Footprints,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  User,
  FileText,
  Info
} from "lucide-react";

interface WellnessDataCategory {
  id: string;
  label: string;
  icon: typeof Activity;
  description: string;
  dataPoints: string[];
  lastUpdated: string;
  recordCount: number;
}

interface SharedAccess {
  id: string;
  providerName: string;
  facility: string;
  sharedCategories: string[];
  sharedDate: string;
  expiresAt?: string;
  status: "active" | "expired" | "revoked";
}

const WELLNESS_CATEGORIES: WellnessDataCategory[] = [
  {
    id: "activity",
    label: "Activity & Movement",
    icon: Footprints,
    description: "Steps, exercise sessions, active minutes",
    dataPoints: ["Daily steps", "Exercise sessions", "Active minutes", "Distance"],
    lastUpdated: "Today",
    recordCount: 45
  },
  {
    id: "vitals",
    label: "Wellness Vitals",
    icon: Heart,
    description: "Heart rate, blood pressure, weight trends",
    dataPoints: ["Heart rate", "Blood pressure", "Weight", "BMI"],
    lastUpdated: "Yesterday",
    recordCount: 30
  },
  {
    id: "sleep",
    label: "Sleep & Rest",
    icon: Moon,
    description: "Sleep duration, quality, patterns",
    dataPoints: ["Sleep duration", "Sleep quality", "Wake times"],
    lastUpdated: "Today",
    recordCount: 28
  },
  {
    id: "nutrition",
    label: "Nutrition & Hydration",
    icon: Apple,
    description: "Meal logs, water intake, dietary notes",
    dataPoints: ["Meals logged", "Water intake", "Calorie tracking"],
    lastUpdated: "Today",
    recordCount: 52
  },
  {
    id: "mood",
    label: "Mental Wellbeing",
    icon: Brain,
    description: "Mood tracking, stress levels, energy",
    dataPoints: ["Mood entries", "Stress levels", "Energy tracking"],
    lastUpdated: "Today",
    recordCount: 21
  }
];

const MOCK_SHARED_ACCESS: SharedAccess[] = [
  {
    id: "1",
    providerName: "Dr. Sarah Johnson",
    facility: "Harare Central Clinic",
    sharedCategories: ["activity", "vitals"],
    sharedDate: "2024-01-10",
    expiresAt: "2024-04-10",
    status: "active"
  },
  {
    id: "2",
    providerName: "Wellness Coach Mary",
    facility: "FitZim Academy",
    sharedCategories: ["activity", "sleep", "nutrition"],
    sharedDate: "2024-01-05",
    status: "active"
  }
];

export function WellnessCareBridge() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareNote, setShareNote] = useState("");
  const [sharedAccess, setSharedAccess] = useState(MOCK_SHARED_ACCESS);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleShare = () => {
    // In real implementation, this would share with a selected provider
    setShareDialogOpen(false);
    setSelectedCategories([]);
    setShareNote("");
  };

  const revokeAccess = (accessId: string) => {
    setSharedAccess(prev =>
      prev.map(access =>
        access.id === accessId ? { ...access, status: "revoked" as const } : access
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Care Bridge</h2>
          <p className="text-sm text-muted-foreground">Share wellness data with your healthcare providers</p>
        </div>
      </div>

      {/* Privacy Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Your wellness data is <strong>patient-generated</strong> and <strong>patient-owned</strong>. 
          You control what you share and can revoke access at any time. 
          Shared data is clearly labeled as non-clinical wellness information.
        </AlertDescription>
      </Alert>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Share Wellness Data */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Share Wellness Data
            </CardTitle>
            <CardDescription>
              Select categories to share with a provider or attach to an appointment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[350px] pr-4">
              <div className="space-y-3">
                {WELLNESS_CATEGORIES.map(category => {
                  const Icon = category.icon;
                  const isSelected = selectedCategories.includes(category.id);
                  
                  return (
                    <div
                      key={category.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                      }`}
                      onClick={() => toggleCategory(category.id)}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          className="mt-1"
                          onCheckedChange={() => toggleCategory(category.id)}
                        />
                        <div className={`p-2 rounded-lg bg-primary/10`}>
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{category.label}</h4>
                            <Badge variant="secondary" className="text-xs">
                              {category.recordCount} records
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3 inline mr-1" />
                            Last updated: {category.lastUpdated}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="mt-4 pt-4 border-t">
              <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="w-full" 
                    disabled={selectedCategories.length === 0}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Selected ({selectedCategories.length})
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Share Wellness Data</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        This data will be labeled as <strong>Patient-Generated Wellness Data</strong> and 
                        will not be treated as a clinical diagnosis.
                      </AlertDescription>
                    </Alert>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Data to Share</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedCategories.map(catId => {
                          const cat = WELLNESS_CATEGORIES.find(c => c.id === catId);
                          return cat ? (
                            <Badge key={catId} variant="secondary">
                              {cat.label}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Share With</label>
                      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg mt-2">
                        <User className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Select Provider</p>
                          <p className="text-sm text-muted-foreground">
                            Choose from your care team or enter a new provider
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Optional Note</label>
                      <Textarea
                        placeholder="Add context for your provider..."
                        value={shareNote}
                        onChange={(e) => setShareNote(e.target.value)}
                        className="mt-2"
                        rows={2}
                      />
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Lock className="h-4 w-4" />
                      <span>Access expires after 90 days unless renewed</span>
                    </div>

                    <Button className="w-full" onClick={handleShare}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm & Share
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Active Shares */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Active Access
            </CardTitle>
            <CardDescription>
              Manage who has access to your wellness data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {sharedAccess.map(access => (
                  <div
                    key={access.id}
                    className={`p-4 rounded-lg border ${
                      access.status === "revoked" ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <User className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{access.providerName}</p>
                          <p className="text-sm text-muted-foreground">{access.facility}</p>
                        </div>
                      </div>
                      <Badge
                        variant={access.status === "active" ? "default" : "secondary"}
                        className={access.status === "active" ? "bg-success" : ""}
                      >
                        {access.status}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {access.sharedCategories.map(catId => {
                        const cat = WELLNESS_CATEGORIES.find(c => c.id === catId);
                        return cat ? (
                          <Badge key={catId} variant="outline" className="text-xs">
                            {cat.label}
                          </Badge>
                        ) : null;
                      })}
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="text-muted-foreground">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        Shared: {new Date(access.sharedDate).toLocaleDateString()}
                        {access.expiresAt && (
                          <span className="ml-2">
                            • Expires: {new Date(access.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {access.status === "active" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => revokeAccess(access.id)}
                        >
                          Revoke
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {sharedAccess.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No active data sharing</p>
                    <p className="text-sm">Your wellness data is private</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Data Export */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <h4 className="font-medium">Export Your Wellness Data</h4>
                <p className="text-sm text-muted-foreground">
                  Download a complete copy of your wellness data in standard formats
                </p>
              </div>
            </div>
            <Button variant="outline">
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
