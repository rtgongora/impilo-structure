import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  MessageSquare,
  Settings,
  Maximize2,
  Minimize2,
  Send,
  Paperclip,
  X
} from "lucide-react";
import { toast } from "sonner";

interface TelehealthSessionProps {
  appointmentId: string;
  providerName: string;
  department: string;
  onEnd: () => void;
}

interface ChatMessage {
  id: string;
  sender: "patient" | "provider";
  message: string;
  timestamp: Date;
}

export function TelehealthSession({ 
  appointmentId, 
  providerName, 
  department, 
  onEnd 
}: TelehealthSessionProps) {
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "provider",
      message: "Hello! I'll be with you shortly. Please make sure your camera and microphone are working.",
      timestamp: new Date()
    }
  ]);
  const [callDuration, setCallDuration] = useState(0);
  const [isConnecting, setIsConnecting] = useState(true);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Simulate connection
    const connectTimer = setTimeout(() => {
      setIsConnecting(false);
      toast.success("Connected to telehealth session");
    }, 2000);

    return () => clearTimeout(connectTimer);
  }, []);

  useEffect(() => {
    if (!isConnecting) {
      const interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isConnecting]);

  useEffect(() => {
    // Get local video stream
    if (isVideoOn && localVideoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: isMicOn })
        .then(stream => {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.error("Error accessing media devices:", err);
          toast.error("Could not access camera/microphone");
        });
    }
  }, [isVideoOn, isMicOn]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const sendMessage = () => {
    if (!chatMessage.trim()) return;
    
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: "patient",
      message: chatMessage,
      timestamp: new Date()
    }]);
    setChatMessage("");
  };

  const endCall = () => {
    toast.info("Telehealth session ended");
    onEnd();
  };

  return (
    <div className={`fixed inset-0 bg-black z-50 flex ${isFullscreen ? "" : "p-4"}`}>
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-black/50">
          <div className="flex items-center gap-4">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{providerName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className="text-white">
              <p className="font-semibold">{providerName}</p>
              <p className="text-sm text-white/70">{department}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-white border-white/30">
              {formatDuration(callDuration)}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="text-white"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Video Area */}
        <div className="flex-1 relative flex items-center justify-center">
          {isConnecting ? (
            <div className="text-white text-center">
              <div className="animate-pulse mb-4">
                <Video className="h-16 w-16 mx-auto text-white/50" />
              </div>
              <p className="text-xl">Connecting to session...</p>
              <p className="text-sm text-white/70">Please wait while we establish a secure connection</p>
            </div>
          ) : (
            <>
              {/* Remote video (placeholder) */}
              <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                <Avatar className="h-32 w-32">
                  <AvatarFallback className="text-4xl">
                    {providerName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              {/* Local video (picture-in-picture) */}
              <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white/20">
                {isVideoOn ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <VideoOff className="h-8 w-8 text-white/50" />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 p-6 bg-black/50">
          <Button
            variant={isMicOn ? "secondary" : "destructive"}
            size="lg"
            className="rounded-full h-14 w-14"
            onClick={() => setIsMicOn(!isMicOn)}
          >
            {isMicOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
          </Button>
          <Button
            variant={isVideoOn ? "secondary" : "destructive"}
            size="lg"
            className="rounded-full h-14 w-14"
            onClick={() => setIsVideoOn(!isVideoOn)}
          >
            {isVideoOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
          </Button>
          <Button
            variant="destructive"
            size="lg"
            className="rounded-full h-14 w-14"
            onClick={endCall}
          >
            <Phone className="h-6 w-6 rotate-[135deg]" />
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="rounded-full h-14 w-14"
            onClick={() => setShowChat(!showChat)}
          >
            <MessageSquare className="h-6 w-6" />
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="rounded-full h-14 w-14"
          >
            <Settings className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Chat Panel */}
      {showChat && (
        <div className="w-80 bg-card border-l flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">Chat</h3>
            <Button variant="ghost" size="icon" onClick={() => setShowChat(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "patient" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[80%] rounded-lg p-3 ${
                    msg.sender === "patient" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted"
                  }`}>
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Button variant="ghost" size="icon">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Textarea
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type a message..."
                className="min-h-[40px] max-h-[80px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <Button size="icon" onClick={sendMessage}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
