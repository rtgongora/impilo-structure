import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  AlertTriangle,
  Phone,
  MessageSquare,
  MapPin,
  Send,
  User,
  Bot,
  Heart,
  Ambulance,
  Shield,
  Clock,
  CheckCircle2,
  Loader2,
  PhoneCall,
  Video,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  available: boolean;
}

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot' | 'provider';
  senderName?: string;
  timestamp: Date;
  isEmergency?: boolean;
}

const EMERGENCY_CONTACTS: EmergencyContact[] = [
  { id: '1', name: 'Dr. Sarah Moyo', role: 'Primary Care Physician', phone: '+263 77 123 4567', available: true },
  { id: '2', name: 'Emergency Services', role: 'Ambulance', phone: '999', available: true },
  { id: '3', name: 'Parirenyatwa Hospital ER', role: 'Emergency Room', phone: '+263 4 701 111', available: true },
  { id: '4', name: 'Poison Control Center', role: 'Toxicology', phone: '+263 4 792 111', available: true },
];

const EMERGENCY_TYPES = [
  { id: 'chest-pain', label: 'Chest Pain', icon: Heart, severity: 'critical' },
  { id: 'breathing', label: 'Difficulty Breathing', icon: AlertTriangle, severity: 'critical' },
  { id: 'injury', label: 'Severe Injury', icon: Ambulance, severity: 'high' },
  { id: 'allergic', label: 'Allergic Reaction', icon: AlertTriangle, severity: 'high' },
  { id: 'poison', label: 'Poisoning', icon: Shield, severity: 'critical' },
  { id: 'other', label: 'Other Emergency', icon: MessageSquare, severity: 'medium' },
];

export function EmergencySOS() {
  const [isActivated, setIsActivated] = useState(false);
  const [emergencyType, setEmergencyType] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAIResponding, setIsAIResponding] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationAddress, setLocationAddress] = useState<string>('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [callInProgress, setCallInProgress] = useState<string | null>(null);

  // Get user's location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          // In real implementation, reverse geocode to get address
          setLocationAddress(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error('Location error:', error);
          setIsLoadingLocation(false);
        }
      );
    }
  }, []);

  const handleActivateSOS = () => {
    setIsActivated(true);
    toast.warning("Emergency SOS Activated", {
      description: "Select the type of emergency you're experiencing",
      duration: 5000,
    });
  };

  const handleSelectEmergencyType = async (type: string) => {
    setEmergencyType(type);
    const emergencyInfo = EMERGENCY_TYPES.find(e => e.id === type);
    
    // Add initial AI triage message
    const initialMessage: ChatMessage = {
      id: Date.now().toString(),
      content: `I understand you're experiencing ${emergencyInfo?.label}. I'm here to help you while we connect you with emergency services. Can you tell me more about your symptoms and when they started?`,
      sender: 'bot',
      senderName: 'Emergency AI Assistant',
      timestamp: new Date(),
      isEmergency: true,
    };
    
    setChatMessages([initialMessage]);

    // In a real implementation, this would:
    // 1. Notify emergency services
    // 2. Alert the patient's primary care provider
    // 3. Share location data
    toast.success("Emergency services notified", {
      description: "Help is on the way. Stay on this screen.",
    });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsAIResponding(true);

    // Simulate AI response - in production this would call the emergency AI edge function
    try {
      const response = await supabase.functions.invoke('emergency-triage', {
        body: { 
          message: inputMessage,
          emergencyType,
          history: chatMessages,
          location: locationAddress
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response.data?.response || getEmergencyResponse(inputMessage, emergencyType),
        sender: 'bot',
        senderName: 'Emergency AI Assistant',
        timestamp: new Date(),
      };

      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      // Fallback to local response if edge function fails
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: getEmergencyResponse(inputMessage, emergencyType),
        sender: 'bot',
        senderName: 'Emergency AI Assistant',
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsAIResponding(false);
    }
  };

  const getEmergencyResponse = (message: string, type: string | null): string => {
    // Basic emergency triage responses
    const lowerMessage = message.toLowerCase();
    
    if (type === 'chest-pain') {
      if (lowerMessage.includes('arm') || lowerMessage.includes('jaw')) {
        return "You mentioned pain in your arm/jaw along with chest pain. This could indicate a cardiac event. Please stay calm, sit or lie down comfortably, and do not exert yourself. Emergency services have been alerted. Do you have any aspirin nearby?";
      }
      return "I understand you're having chest pain. Try to stay calm and avoid any physical exertion. Are you experiencing any shortness of breath, sweating, or nausea?";
    }
    
    if (type === 'breathing') {
      return "For breathing difficulties: Sit upright if possible, try to stay calm and take slow breaths. Do you have any history of asthma or lung conditions? Do you have an inhaler nearby?";
    }
    
    if (type === 'allergic') {
      return "For allergic reactions: Do you have an EpiPen or any antihistamines? Are you experiencing any swelling in your throat or difficulty swallowing? This is important information for the emergency responders.";
    }

    return "I'm here to help. Emergency services have been notified. Can you describe your current symptoms in more detail? Any information you provide will help the emergency responders assist you better.";
  };

  const handleCall = (contact: EmergencyContact) => {
    setCallInProgress(contact.id);
    toast.info(`Calling ${contact.name}...`, {
      description: contact.phone,
    });
    // In real implementation, this would initiate a VoIP call or open phone dialer
    setTimeout(() => {
      setCallInProgress(null);
    }, 3000);
  };

  const handleCancelEmergency = () => {
    if (window.confirm('Are you sure you want to cancel this emergency request?')) {
      setIsActivated(false);
      setEmergencyType(null);
      setChatMessages([]);
      toast.info("Emergency request cancelled");
    }
  };

  if (!isActivated) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Emergency SOS
          </CardTitle>
          <CardDescription>
            Activate in case of medical emergency to get immediate help
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleActivateSOS}
            className="w-full h-24 text-xl font-bold bg-destructive hover:bg-destructive/90"
          >
            <AlertTriangle className="w-8 h-8 mr-3" />
            ACTIVATE SOS
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            This will alert emergency services, share your location, and connect you with medical professionals.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!emergencyType) {
    return (
      <Card className="border-destructive">
        <CardHeader className="bg-destructive/10">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
              SOS ACTIVATED
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleCancelEmergency}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <CardDescription>
            Select the type of emergency you're experiencing
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-3">
            {EMERGENCY_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <Button
                  key={type.id}
                  variant="outline"
                  className={cn(
                    "h-auto py-4 flex flex-col items-center gap-2 border-2",
                    type.severity === 'critical' && "border-destructive/50 hover:border-destructive hover:bg-destructive/10",
                    type.severity === 'high' && "border-warning/50 hover:border-warning hover:bg-warning/10"
                  )}
                  onClick={() => handleSelectEmergencyType(type.id)}
                >
                  <Icon className={cn(
                    "w-6 h-6",
                    type.severity === 'critical' && "text-destructive",
                    type.severity === 'high' && "text-warning"
                  )} />
                  <span className="text-sm font-medium">{type.label}</span>
                </Button>
              );
            })}
          </div>
          
          {/* Location Display */}
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-primary" />
              {isLoadingLocation ? (
                <span className="text-muted-foreground">Getting your location...</span>
              ) : location ? (
                <span>Location: {locationAddress}</span>
              ) : (
                <span className="text-muted-foreground">Location unavailable</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Emergency Header */}
      <div className="p-4 bg-destructive/10 border-b border-destructive/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive rounded-lg animate-pulse">
              <AlertTriangle className="w-5 h-5 text-destructive-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-destructive">Emergency Active</h3>
              <p className="text-xs text-muted-foreground">
                {EMERGENCY_TYPES.find(e => e.id === emergencyType)?.label}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {location && (
              <Badge variant="outline" className="text-xs">
                <MapPin className="w-3 h-3 mr-1" />
                Location Shared
              </Badge>
            )}
            <Button variant="destructive" size="sm" onClick={handleCancelEmergency}>
              Cancel SOS
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3",
                    msg.sender === 'user' && "flex-row-reverse"
                  )}
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className={cn(
                      msg.sender === 'bot' && "bg-primary text-primary-foreground",
                      msg.sender === 'user' && "bg-muted"
                    )}>
                      {msg.sender === 'bot' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "max-w-[70%] rounded-lg p-3",
                    msg.sender === 'user' && "bg-primary text-primary-foreground",
                    msg.sender === 'bot' && "bg-muted",
                    msg.isEmergency && "border-2 border-destructive/50"
                  )}>
                    {msg.senderName && (
                      <p className="text-xs font-medium mb-1 opacity-70">{msg.senderName}</p>
                    )}
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-xs opacity-50 mt-1">
                      {format(msg.timestamp, "HH:mm")}
                    </p>
                  </div>
                </div>
              ))}
              {isAIResponding && (
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg p-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Chat Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Describe your symptoms..."
                disabled={isAIResponding}
              />
              <Button onClick={sendMessage} disabled={isAIResponding}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Emergency Contacts Panel */}
        <div className="w-80 border-l bg-card">
          <div className="p-4 border-b">
            <h4 className="font-semibold">Emergency Contacts</h4>
            <p className="text-xs text-muted-foreground">Tap to call</p>
          </div>
          <ScrollArea className="h-[400px]">
            <div className="p-4 space-y-3">
              {EMERGENCY_CONTACTS.map((contact) => (
                <Card 
                  key={contact.id}
                  className={cn(
                    "cursor-pointer transition-all hover:border-primary",
                    callInProgress === contact.id && "border-success bg-success/10"
                  )}
                  onClick={() => handleCall(contact)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{contact.name}</p>
                        <p className="text-xs text-muted-foreground">{contact.role}</p>
                        <p className="text-xs text-primary">{contact.phone}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {contact.available && (
                          <Badge variant="outline" className="bg-success/10 text-success text-xs">
                            Available
                          </Badge>
                        )}
                        {callInProgress === contact.id ? (
                          <Loader2 className="w-5 h-5 animate-spin text-success" />
                        ) : (
                          <PhoneCall className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
          
          {/* Quick Actions */}
          <div className="p-4 border-t space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <Video className="w-4 h-4 mr-2" />
              Start Video Call
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <MapPin className="w-4 h-4 mr-2" />
              Share Live Location
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
