import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { Clock, User, CheckCircle } from "lucide-react";

interface TimeSlot {
  time: string;
  available: boolean;
  provider?: string;
  room?: string;
}

interface AppointmentSlotPickerProps {
  onSlotSelect?: (date: Date, time: string) => void;
  providerId?: string;
  appointmentType?: string;
}

const generateTimeSlots = (date: Date): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const providers = ["Dr. Smith", "Dr. Johnson", "Dr. Patel", "Dr. Moyo"];
  const rooms = ["Room 101", "Room 102", "Room 103", "Room 104"];
  
  for (let hour = 8; hour <= 17; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const available = Math.random() > 0.3;
      slots.push({
        time: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
        available,
        provider: available ? providers[Math.floor(Math.random() * providers.length)] : undefined,
        room: available ? rooms[Math.floor(Math.random() * rooms.length)] : undefined,
      });
    }
  }
  return slots;
};

export function AppointmentSlotPicker({ 
  onSlotSelect,
  providerId,
  appointmentType = "consultation" 
}: AppointmentSlotPickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"calendar" | "week">("week");
  
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(selectedDate), i));
  const timeSlots = generateTimeSlots(selectedDate);

  const handleSlotClick = (time: string) => {
    setSelectedSlot(time);
    onSlotSelect?.(selectedDate, time);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Select Appointment Slot
          </CardTitle>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={viewMode === "week" ? "secondary" : "ghost"}
              onClick={() => setViewMode("week")}
            >
              Week
            </Button>
            <Button
              size="sm"
              variant={viewMode === "calendar" ? "secondary" : "ghost"}
              onClick={() => setViewMode("calendar")}
            >
              Month
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex">
          {/* Calendar/Week Selector */}
          <div className="border-r">
            {viewMode === "calendar" ? (
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="p-3"
              />
            ) : (
              <div className="p-3">
                <div className="grid grid-cols-7 gap-1">
                  {weekDays.map((day) => (
                    <Button
                      key={day.toISOString()}
                      variant={isSameDay(day, selectedDate) ? "default" : "ghost"}
                      className={cn(
                        "flex flex-col h-auto py-2 px-3",
                        isSameDay(day, selectedDate) && "bg-primary text-primary-foreground"
                      )}
                      onClick={() => setSelectedDate(day)}
                    >
                      <span className="text-xs font-normal opacity-70">
                        {format(day, "EEE")}
                      </span>
                      <span className="text-lg font-semibold">
                        {format(day, "d")}
                      </span>
                    </Button>
                  ))}
                </div>
                <p className="text-center text-sm text-muted-foreground mt-3">
                  {format(selectedDate, "MMMM yyyy")}
                </p>
              </div>
            )}
          </div>

          {/* Time Slots Grid */}
          <div className="flex-1">
            <div className="px-4 py-2 border-b bg-muted/50">
              <p className="font-medium">{format(selectedDate, "EEEE, MMMM d")}</p>
              <p className="text-sm text-muted-foreground">
                {timeSlots.filter(s => s.available).length} slots available
              </p>
            </div>
            <ScrollArea className="h-[350px]">
              <div className="grid grid-cols-3 gap-2 p-4">
                {timeSlots.map((slot) => (
                  <Button
                    key={slot.time}
                    variant={selectedSlot === slot.time ? "default" : "outline"}
                    className={cn(
                      "h-auto py-3 flex flex-col items-start relative",
                      !slot.available && "opacity-40 cursor-not-allowed",
                      selectedSlot === slot.time && "ring-2 ring-primary"
                    )}
                    disabled={!slot.available}
                    onClick={() => slot.available && handleSlotClick(slot.time)}
                  >
                    {selectedSlot === slot.time && (
                      <CheckCircle className="absolute top-1 right-1 h-4 w-4 text-primary-foreground" />
                    )}
                    <span className="font-semibold">{slot.time}</span>
                    {slot.available && slot.provider && (
                      <span className="text-xs opacity-70 flex items-center gap-1 mt-1">
                        <User className="h-3 w-3" />
                        {slot.provider}
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Selected Slot Confirmation */}
        {selectedSlot && (
          <div className="border-t p-4 bg-muted/30 flex items-center justify-between">
            <div>
              <p className="font-medium">
                {format(selectedDate, "EEEE, MMMM d")} at {selectedSlot}
              </p>
              <p className="text-sm text-muted-foreground capitalize">
                {appointmentType.replace("_", " ")}
              </p>
            </div>
            <Button>Confirm Slot</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
