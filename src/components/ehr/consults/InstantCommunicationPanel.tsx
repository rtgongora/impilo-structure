/**
 * InstantCommunicationPanel - Quick access to call/chat while reviewing cases
 * For consulting practitioners who need to reach out during case review
 */
import { useState, useCallback } from "react";
import {
  Phone,
  Video,
  MessageSquare,
  Users,
  AlertCircle,
  ArrowUpRight,
  X,
  Mic,
  PhoneOff,
  Send,
  Loader2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { ReferralPackage } from "@/types/telehealth";

interface InstantCommunicationPanelProps {
  referral: ReferralPackage;
  isOpen: boolean;
  onClose: () => void;
  onStartFullSession: (mode: 'audio' | 'video' | 'chat') => void;
}

interface QuickMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export function InstantCommunicationPanel({
  referral,
  isOpen,
  onClose,
  onStartFullSession,
}: InstantCommunicationPanelProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'call'>('chat');
  const [isCallActive, setIsCallActive] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const [messages, setMessages] = useState<QuickMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");

  const referringProvider = {
    id: referral.context.referringProviderId,
    name: referral.context.referringProviderName,
    facility: referral.context.referringFacilityName,
  };

  // Start quick call
  const handleStartCall = useCallback(async (type: 'audio' | 'video') => {
    setIsConnecting(true);
    setCallType(type);
    
    // Simulate connection
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsConnecting(false);
    setIsCallActive(true);
    setCallDuration(0);
    
    // Start duration timer
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    
    toast.success(`${type === 'video' ? 'Video' : 'Audio'} call connected`);
    
    // Clean up timer when component unmounts or call ends
    return () => clearInterval(timer);
  }, []);

  // End call
  const handleEndCall = useCallback(() => {
    setIsCallActive(false);
    toast.info(`Call ended. Duration: ${formatDuration(callDuration)}`);
    setCallDuration(0);
  }, [callDuration]);

  // Send quick message
  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim()) return;

    const message: QuickMessage = {
      id: `msg-${Date.now()}`,
      senderId: 'current-user',
      senderName: 'You',
      content: newMessage,
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    setMessages(prev => [...prev, message]);
    setNewMessage("");

    // Simulate response after a delay
    setTimeout(() => {
      const response: QuickMessage = {
        id: `msg-${Date.now()}-response`,
        senderId: referringProvider.id,
        senderName: referringProvider.name,
        content: "Message received. I'll review and respond shortly.",
        timestamp: new Date().toISOString(),
        isRead: false,
      };
      setMessages(prev => [...prev, response]);
    }, 2000);
  }, [newMessage, referringProvider]);

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Expand to full session
  const handleExpandToFullSession = useCallback(() => {
    const mode = activeTab === 'call' ? callType : 'chat';
    onClose();
    onStartFullSession(mode);
  }, [activeTab, callType, onClose, onStartFullSession]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Quick Communication
          </DialogTitle>
          <DialogDescription>
            Reach out to {referringProvider.name} about this case
          </DialogDescription>
        </DialogHeader>

        {/* Recipient info */}
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <Avatar>
            <AvatarFallback>
              {referringProvider.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-medium">{referringProvider.name}</p>
            <p className="text-sm text-muted-foreground">{referringProvider.facility}</p>
          </div>
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Online
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'chat' | 'call')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat">
              <MessageSquare className="h-4 w-4 mr-1" />
              Message
            </TabsTrigger>
            <TabsTrigger value="call">
              <Phone className="h-4 w-4 mr-1" />
              Call
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-3">
            {/* Messages */}
            <ScrollArea className="h-48 border rounded-lg p-3">
              {messages.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">
                  Send a quick message about this case
                </p>
              ) : (
                <div className="space-y-2">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderId === 'current-user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-2 text-sm ${
                          msg.senderId === 'current-user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="call" className="space-y-4">
            {isCallActive ? (
              // Active call UI
              <div className="text-center py-6">
                <div className="w-20 h-20 rounded-full bg-success/20 mx-auto mb-4 flex items-center justify-center">
                  {callType === 'video' ? (
                    <Video className="h-10 w-10 text-success" />
                  ) : (
                    <Phone className="h-10 w-10 text-success" />
                  )}
                </div>
                <p className="font-medium">{referringProvider.name}</p>
                <Badge variant="outline" className="mt-2">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDuration(callDuration)}
                </Badge>

                <div className="flex justify-center gap-3 mt-6">
                  <Button
                    variant="outline"
                    size="lg"
                    className={`h-12 w-12 rounded-full ${isMuted ? 'bg-destructive/20' : ''}`}
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    <Mic className={`h-5 w-5 ${isMuted ? 'text-destructive' : ''}`} />
                  </Button>
                  <Button
                    variant="destructive"
                    size="lg"
                    className="h-12 w-12 rounded-full"
                    onClick={handleEndCall}
                  >
                    <PhoneOff className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ) : isConnecting ? (
              // Connecting state
              <div className="text-center py-8">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <p className="font-medium">Connecting...</p>
                <p className="text-sm text-muted-foreground">
                  Calling {referringProvider.name}
                </p>
              </div>
            ) : (
              // Call options
              <div className="grid grid-cols-2 gap-3 py-4">
                <Button
                  variant="outline"
                  className="h-24 flex-col"
                  onClick={() => handleStartCall('audio')}
                >
                  <Phone className="h-8 w-8 mb-2 text-primary" />
                  <span>Audio Call</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex-col"
                  onClick={() => handleStartCall('video')}
                >
                  <Video className="h-8 w-8 mb-2 text-primary" />
                  <span>Video Call</span>
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={onClose} className="sm:mr-auto">
            Close
          </Button>
          <Button variant="outline" onClick={handleExpandToFullSession}>
            <ArrowUpRight className="h-4 w-4 mr-1" />
            Open Full Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
