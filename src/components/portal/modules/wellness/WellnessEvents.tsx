import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Ticket,
  Search,
  ChevronRight,
  Star,
  Share2,
  Heart
} from "lucide-react";

interface WellnessEvent {
  id: string;
  title: string;
  description: string;
  organizer: string;
  category: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  address?: string;
  price: number | "free";
  capacity: number;
  registered: number;
  isFeatured: boolean;
  isRegistered: boolean;
  image?: string;
  tags: string[];
}

const MOCK_EVENTS: WellnessEvent[] = [
  {
    id: "1",
    title: "Sunrise Yoga in the Park",
    description: "Start your day with an energizing outdoor yoga session. All levels welcome. Bring your own mat.",
    organizer: "Sunrise Yoga Studio",
    category: "Yoga",
    date: "2024-01-20",
    time: "06:00",
    duration: "75 min",
    location: "Harare Gardens",
    address: "Park Lane, Harare",
    price: "free",
    capacity: 50,
    registered: 38,
    isFeatured: true,
    isRegistered: false,
    tags: ["outdoor", "yoga", "beginner-friendly"]
  },
  {
    id: "2",
    title: "Mental Health Awareness Workshop",
    description: "Learn about mental health, coping strategies, and support resources. Interactive session with Q&A.",
    organizer: "Mind Matters ZW",
    category: "Mental Health",
    date: "2024-01-22",
    time: "14:00",
    duration: "2 hours",
    location: "Rainbow Towers",
    price: 15,
    capacity: 100,
    registered: 67,
    isFeatured: true,
    isRegistered: true,
    tags: ["mental health", "workshop", "awareness"]
  },
  {
    id: "3",
    title: "5K Community Fun Run",
    description: "Monthly community run through the city. Medals for all finishers. Post-run refreshments included.",
    organizer: "Harare Runners Club",
    category: "Running",
    date: "2024-01-27",
    time: "07:00",
    duration: "3 hours",
    location: "National Sports Stadium",
    price: 10,
    capacity: 500,
    registered: 342,
    isFeatured: false,
    isRegistered: false,
    tags: ["running", "community", "fitness"]
  },
  {
    id: "4",
    title: "Healthy Cooking Masterclass",
    description: "Learn to prepare nutritious, delicious meals with local ingredients. Recipe booklet included.",
    organizer: "Healthy Habits ZW",
    category: "Nutrition",
    date: "2024-01-28",
    time: "10:00",
    duration: "3 hours",
    location: "Meikles Hotel",
    price: 45,
    capacity: 30,
    registered: 28,
    isFeatured: false,
    isRegistered: false,
    tags: ["cooking", "nutrition", "hands-on"]
  },
  {
    id: "5",
    title: "Mindfulness Meditation Retreat",
    description: "A half-day retreat focusing on meditation techniques, breathing exercises, and inner peace.",
    organizer: "Peace Within Center",
    category: "Meditation",
    date: "2024-02-03",
    time: "09:00",
    duration: "4 hours",
    location: "Domboshawa Hills",
    price: 35,
    capacity: 25,
    registered: 18,
    isFeatured: true,
    isRegistered: false,
    tags: ["meditation", "retreat", "nature"]
  }
];

const CATEGORY_COLORS: Record<string, string> = {
  "Yoga": "bg-purple-100 text-purple-700",
  "Mental Health": "bg-info/10 text-info",
  "Running": "bg-success/10 text-success",
  "Nutrition": "bg-warning/10 text-warning",
  "Meditation": "bg-primary/10 text-primary"
};

export function WellnessEvents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<WellnessEvent | null>(null);
  const [registrationOpen, setRegistrationOpen] = useState(false);

  const filteredEvents = MOCK_EVENTS.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.organizer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featuredEvents = filteredEvents.filter(e => e.isFeatured);
  const upcomingEvents = filteredEvents.filter(e => !e.isFeatured);
  const myEvents = MOCK_EVENTS.filter(e => e.isRegistered);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Wellness Events</h2>
          <p className="text-sm text-muted-foreground">Discover and join wellness events in your area</p>
        </div>
        <Badge variant="secondary">
          <Ticket className="h-3 w-3 mr-1" />
          {myEvents.length} Registered
        </Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search events..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* My Registered Events */}
      {myEvents.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Ticket className="h-4 w-4 text-primary" />
            My Upcoming Events
          </h3>
          <ScrollArea className="w-full">
            <div className="flex gap-4 pb-4">
              {myEvents.map(event => (
                <Card key={event.id} className="w-[280px] shrink-0 border-primary/20">
                  <CardContent className="p-4">
                    <Badge className={`mb-2 ${CATEGORY_COLORS[event.category] || 'bg-muted'}`}>
                      {event.category}
                    </Badge>
                    <h4 className="font-semibold mb-1">{event.title}</h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(event.date)} at {event.time}
                      </p>
                      <p className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="w-full mt-3">
                      View Ticket
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Featured Events */}
      {featuredEvents.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            Featured Events
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {featuredEvents.map(event => (
              <Card key={event.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4">
                    <div className="flex items-start justify-between">
                      <Badge className={CATEGORY_COLORS[event.category] || 'bg-muted'}>
                        {event.category}
                      </Badge>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Heart className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <h4 className="font-semibold text-lg mt-2">{event.title}</h4>
                    <p className="text-sm text-muted-foreground">{event.organizer}</p>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {event.description}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {formatDate(event.date)}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {event.time} ({event.duration})
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {event.location}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        {event.registered}/{event.capacity}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        {event.price === "free" ? (
                          <Badge variant="secondary" className="bg-success/10 text-success">Free</Badge>
                        ) : (
                          <span className="font-bold text-lg">${event.price}</span>
                        )}
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button disabled={event.isRegistered}>
                            {event.isRegistered ? 'Registered' : 'Register'}
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Register for Event</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <div className="p-4 bg-muted rounded-lg">
                              <h4 className="font-semibold">{event.title}</h4>
                              <p className="text-sm text-muted-foreground">{event.organizer}</p>
                              <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                                <p><Calendar className="h-3 w-3 inline mr-1" />{formatDate(event.date)}</p>
                                <p><Clock className="h-3 w-3 inline mr-1" />{event.time}</p>
                                <p><MapPin className="h-3 w-3 inline mr-1" />{event.location}</p>
                                <p><Clock className="h-3 w-3 inline mr-1" />{event.duration}</p>
                              </div>
                            </div>
                            {event.price !== "free" && (
                              <div className="border-t pt-4">
                                <div className="flex justify-between mb-2">
                                  <span>Event Fee</span>
                                  <span className="font-medium">${event.price}</span>
                                </div>
                                <div className="flex justify-between text-sm text-muted-foreground">
                                  <span>Platform Fee</span>
                                  <span>$0.50</span>
                                </div>
                                <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                                  <span>Total</span>
                                  <span>${Number(event.price) + 0.5}</span>
                                </div>
                              </div>
                            )}
                            <Button className="w-full">
                              {event.price === "free" ? 'Confirm Registration' : 'Pay & Register'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Upcoming Events */}
      <div>
        <h3 className="font-semibold mb-3">All Upcoming Events</h3>
        <div className="space-y-3">
          {upcomingEvents.map(event => (
            <Card key={event.id} className="hover:bg-accent/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="text-center min-w-[60px]">
                    <div className="bg-primary/10 rounded-lg p-2">
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                      </p>
                      <p className="text-xl font-bold text-primary">
                        {new Date(event.date).getDate()}
                      </p>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge className={`mb-1 ${CATEGORY_COLORS[event.category] || 'bg-muted'}`}>
                          {event.category}
                        </Badge>
                        <h4 className="font-semibold">{event.title}</h4>
                        <p className="text-sm text-muted-foreground">{event.organizer}</p>
                      </div>
                      <div className="text-right">
                        {event.price === "free" ? (
                          <Badge variant="secondary" className="bg-success/10 text-success">Free</Badge>
                        ) : (
                          <span className="font-bold">${event.price}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {event.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {event.capacity - event.registered} spots left
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
