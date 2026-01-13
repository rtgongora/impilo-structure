import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  Star,
  MapPin,
  Clock,
  Calendar,
  Dumbbell,
  Brain,
  Apple,
  Heart,
  Users,
  CheckCircle,
  Video,
  ShoppingCart,
  Wallet
} from "lucide-react";

interface WellnessService {
  id: string;
  title: string;
  provider: string;
  providerAvatar?: string;
  category: "fitness" | "nutrition" | "coaching" | "mental" | "events";
  description: string;
  rating: number;
  reviewCount: number;
  price: number;
  priceUnit: string;
  duration?: string;
  location: string;
  isOnline: boolean;
  isVerified: boolean;
  availability: string[];
  features: string[];
}

const MOCK_SERVICES: WellnessService[] = [
  {
    id: "1",
    title: "Personal Training Sessions",
    provider: "FitZim Academy",
    category: "fitness",
    description: "One-on-one training sessions tailored to your fitness goals. Includes workout planning and progress tracking.",
    rating: 4.8,
    reviewCount: 127,
    price: 45,
    priceUnit: "session",
    duration: "60 min",
    location: "Harare CBD",
    isOnline: false,
    isVerified: true,
    availability: ["Mon", "Wed", "Fri"],
    features: ["Personalized plan", "Equipment provided", "Progress tracking"]
  },
  {
    id: "2",
    title: "Nutrition Coaching Program",
    provider: "Healthy Habits ZW",
    category: "nutrition",
    description: "8-week nutrition coaching with meal planning, grocery guides, and weekly check-ins.",
    rating: 4.9,
    reviewCount: 89,
    price: 150,
    priceUnit: "month",
    location: "Online",
    isOnline: true,
    isVerified: true,
    availability: ["Flexible"],
    features: ["Meal plans", "Shopping lists", "Weekly calls"]
  },
  {
    id: "3",
    title: "Stress Management Workshop",
    provider: "Mind & Body Wellness",
    category: "mental",
    description: "Interactive workshop covering stress management techniques, breathing exercises, and relaxation methods.",
    rating: 4.7,
    reviewCount: 56,
    price: 25,
    priceUnit: "session",
    duration: "90 min",
    location: "Borrowdale",
    isOnline: false,
    isVerified: true,
    availability: ["Sat"],
    features: ["Group session", "Take-home materials", "Follow-up support"]
  },
  {
    id: "4",
    title: "Yoga Classes - Monthly Pass",
    provider: "Sunrise Yoga Studio",
    category: "fitness",
    description: "Unlimited yoga classes including Hatha, Vinyasa, and Restorative styles. All levels welcome.",
    rating: 4.6,
    reviewCount: 203,
    price: 80,
    priceUnit: "month",
    location: "Avondale",
    isOnline: false,
    isVerified: true,
    availability: ["Daily"],
    features: ["Unlimited classes", "Mat provided", "Shower facilities"]
  },
  {
    id: "5",
    title: "Online Life Coaching",
    provider: "Transform ZW",
    category: "coaching",
    description: "Virtual coaching sessions focusing on goal setting, habit formation, and personal development.",
    rating: 4.8,
    reviewCount: 72,
    price: 60,
    priceUnit: "session",
    duration: "45 min",
    location: "Online",
    isOnline: true,
    isVerified: true,
    availability: ["Mon-Fri"],
    features: ["Video sessions", "Goal tracking", "Email support"]
  },
  {
    id: "6",
    title: "Community Fun Run Event",
    provider: "Harare Runners",
    category: "events",
    description: "Monthly 5K fun run through Harare Gardens. All fitness levels welcome. Refreshments provided.",
    rating: 4.9,
    reviewCount: 312,
    price: 10,
    priceUnit: "event",
    duration: "2 hours",
    location: "Harare Gardens",
    isOnline: false,
    isVerified: true,
    availability: ["Last Sat of month"],
    features: ["Medal included", "Refreshments", "Photo finish"]
  }
];

const CATEGORY_ICONS: Record<string, typeof Dumbbell> = {
  fitness: Dumbbell,
  nutrition: Apple,
  coaching: Heart,
  mental: Brain,
  events: Users
};

const CATEGORY_LABELS: Record<string, string> = {
  fitness: "Fitness",
  nutrition: "Nutrition",
  coaching: "Coaching",
  mental: "Mental Wellness",
  events: "Events"
};

export function WellnessMarketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedService, setSelectedService] = useState<WellnessService | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);

  const filteredServices = MOCK_SERVICES.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", ...new Set(MOCK_SERVICES.map(s => s.category))];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Wellness Marketplace</h2>
          <p className="text-sm text-muted-foreground">Discover verified wellness services and events</p>
        </div>
        <Button variant="outline">
          <ShoppingCart className="h-4 w-4 mr-2" />
          My Bookings
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search services, providers..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.filter(c => c !== "all").map(cat => (
              <SelectItem key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map(cat => {
          const Icon = cat === "all" ? Star : CATEGORY_ICONS[cat];
          return (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              className="shrink-0"
              onClick={() => setSelectedCategory(cat)}
            >
              <Icon className="h-4 w-4 mr-1" />
              {cat === "all" ? "All" : CATEGORY_LABELS[cat]}
            </Button>
          );
        })}
      </div>

      {/* Services Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map(service => {
          const Icon = CATEGORY_ICONS[service.category];
          return (
            <Card key={service.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg bg-primary/10`}>
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">{service.rating}</span>
                    <span className="text-xs text-muted-foreground">({service.reviewCount})</span>
                  </div>
                </div>

                <h3 className="font-semibold mb-1">{service.title}</h3>
                
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-xs">{service.provider[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">{service.provider}</span>
                  {service.isVerified && (
                    <CheckCircle className="h-4 w-4 text-success" />
                  )}
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {service.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="secondary" className="text-xs">
                    {service.isOnline ? (
                      <><Video className="h-3 w-3 mr-1" />Online</>
                    ) : (
                      <><MapPin className="h-3 w-3 mr-1" />{service.location}</>
                    )}
                  </Badge>
                  {service.duration && (
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />{service.duration}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div>
                    <span className="text-lg font-bold">${service.price}</span>
                    <span className="text-sm text-muted-foreground">/{service.priceUnit}</span>
                  </div>
                  <Dialog open={bookingOpen && selectedService?.id === service.id} onOpenChange={(open) => {
                    setBookingOpen(open);
                    if (open) setSelectedService(service);
                  }}>
                    <DialogTrigger asChild>
                      <Button size="sm">Book Now</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Book {service.title}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>{service.provider[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{service.provider}</p>
                            <p className="text-sm text-muted-foreground">{service.title}</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium">Select Date</label>
                            <Input type="date" className="mt-1" />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Select Time</label>
                            <Select>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Choose a time" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="09:00">09:00 AM</SelectItem>
                                <SelectItem value="10:00">10:00 AM</SelectItem>
                                <SelectItem value="11:00">11:00 AM</SelectItem>
                                <SelectItem value="14:00">02:00 PM</SelectItem>
                                <SelectItem value="15:00">03:00 PM</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="border-t pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <span>Service Fee</span>
                            <span className="font-medium">${service.price}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>Platform Fee</span>
                            <span>$1.00</span>
                          </div>
                          <div className="flex items-center justify-between font-bold mt-2 pt-2 border-t">
                            <span>Total</span>
                            <span>${service.price + 1}</span>
                          </div>
                        </div>

                        <Button className="w-full">
                          <Wallet className="h-4 w-4 mr-2" />
                          Pay with Health Wallet
                        </Button>
                        <p className="text-xs text-center text-muted-foreground">
                          Your booking is protected by Impilo's wellness guarantee
                        </p>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredServices.length === 0 && (
        <Card className="py-12">
          <CardContent className="text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No services found matching your criteria</p>
            <Button variant="link" onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}>
              Clear filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
